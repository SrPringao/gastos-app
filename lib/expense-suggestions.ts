import { db } from "@/lib/db";
import { expenses } from "@/lib/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { getTotalSpentThisMonth } from "@/lib/services/dashboard";
import { getMonthlyBudget } from "@/lib/services/monthly-budgets";
import { buildBudgetSummary, cleanMerchantName, toCalendarDate } from "@/lib/dashboard-metrics";
import { monthName, todayDateString } from "@/lib/utils/dates";

/**
 * Sugerencias del flujo "Nuevo gasto" (expensebro-nuevo-gasto-prompt.md,
 * seccion 5). Todo sale de los gastos existentes; no hay tablas nuevas.
 */

/** "2026-10-06" - n dias */
function minusDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d - days));
  return date.toISOString().slice(0, 10);
}

function previousMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

/** Clave para deduplicar comercios: minusculas, sin acentos ni espacios dobles */
export function merchantKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export type RecentMerchant = {
  key: string;
  /** Nombre limpio ("Elotesal", no "Mercadopago *elotesal") */
  label: string;
  /** Categoria del tile (la del ultimo uso) */
  categoryId: number | null;
  lastMethodId: number | null;
  lastCategoryId: number | null;
};

/**
 * Hasta `limit` comercios/notas distintos de los ultimos `days` dias,
 * ordenados por frecuencia y luego por recencia.
 */
export async function getRecentMerchants(
  userId: string,
  { days = 30, limit = 6 }: { days?: number; limit?: number } = {}
): Promise<RecentMerchant[]> {
  const since = minusDays(todayDateString(), days);
  const rows = await db
    .select({
      description: expenses.description,
      accountId: expenses.accountId,
      categoryId: expenses.categoryId,
      date: expenses.date,
      createdAt: expenses.createdAt,
    })
    .from(expenses)
    .where(and(eq(expenses.userId, userId), sql`DATE(${expenses.date}) >= ${since}::date`))
    .orderBy(desc(expenses.date), desc(expenses.createdAt));

  const byKey = new Map<string, RecentMerchant & { count: number; order: number }>();
  rows.forEach((row, index) => {
    if (!row.description?.trim()) return;
    const label = cleanMerchantName(row.description).name;
    const key = merchantKey(label);
    if (!key) return;
    const existing = byKey.get(key);
    if (existing) {
      existing.count += 1;
      return;
    }
    // Las filas vienen de la mas reciente a la mas vieja: la primera es el ultimo uso
    byKey.set(key, {
      key,
      label,
      categoryId: row.categoryId,
      lastMethodId: row.accountId,
      lastCategoryId: row.categoryId,
      count: 1,
      order: index,
    });
  });

  return [...byKey.values()]
    .sort((a, b) => b.count - a.count || a.order - b.order)
    .slice(0, limit)
    .map(({ key, label, categoryId, lastMethodId, lastCategoryId }) => ({
      key,
      label,
      categoryId,
      lastMethodId,
      lastCategoryId,
    }));
}

/** Gastos por metodo en un mes ("YYYY-MM") */
async function countByMethod(userId: string, monthKey: string): Promise<Map<number, number>> {
  const rows = await db
    .select({ accountId: expenses.accountId, count: sql<number>`count(*)::int` })
    .from(expenses)
    .where(and(eq(expenses.userId, userId), sql`to_char(${expenses.date}, 'YYYY-MM') = ${monthKey}`))
    .groupBy(expenses.accountId);
  return new Map(rows.map((r) => [r.accountId, r.count]));
}

export type TopMethod = { accountId: number; count: number; monthKey: string };

/**
 * Los `limit` metodos mas usados del mes; si el mes tiene menos, se
 * completa con los del mes anterior.
 */
export async function getTopMethods(userId: string, month: string, limit = 3): Promise<TopMethod[]> {
  const [current, previous] = await Promise.all([
    countByMethod(userId, month),
    countByMethod(userId, previousMonthKey(month)),
  ]);
  const ranked = (map: Map<number, number>, monthKey: string) =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([accountId, count]) => ({ accountId, count, monthKey }));

  const top = ranked(current, month).slice(0, limit);
  for (const candidate of ranked(previous, previousMonthKey(month))) {
    if (top.length >= limit) break;
    if (!top.some((t) => t.accountId === candidate.accountId)) top.push(candidate);
  }
  return top;
}

/** Uso por metodo y por categoria en los ultimos `days` dias (para ordenar listas) */
export async function getUsageCounts(userId: string, days = 90) {
  const since = minusDays(todayDateString(), days);
  const where = and(eq(expenses.userId, userId), sql`DATE(${expenses.date}) >= ${since}::date`);
  const [methods, categories] = await Promise.all([
    db
      .select({ id: expenses.accountId, count: sql<number>`count(*)::int` })
      .from(expenses)
      .where(where)
      .groupBy(expenses.accountId),
    db
      .select({ id: expenses.categoryId, count: sql<number>`count(*)::int` })
      .from(expenses)
      .where(where)
      .groupBy(expenses.categoryId),
  ]);
  return {
    methods: Object.fromEntries(methods.map((r) => [r.id, r.count])) as Record<number, number>,
    categories: Object.fromEntries(
      categories.filter((r) => r.id != null).map((r) => [r.id as number, r.count])
    ) as Record<number, number>,
  };
}

export type BudgetImpact = {
  /** Presupuesto - gastado - monto (centavos); negativo si se pasa */
  remaining: number;
  /** Centavos por dia, solo en el mes en curso y si no se pasa */
  perDay: number | null;
  overBy: number | null;
  monthLabel: string;
  isCurrentMonth: boolean;
};

/**
 * Impacto de un gasto en el presupuesto del mes de su fecha. null si ese
 * mes no tiene presupuesto. "Por dia" usa los dias restantes del Dashboard.
 */
export async function getBudgetImpact(
  userId: string,
  date: string,
  amountCents: number
): Promise<BudgetImpact | null> {
  const monthKey = toCalendarDate(date).slice(0, 7);
  const [budget, spent] = await Promise.all([
    getMonthlyBudget(userId, monthKey),
    getTotalSpentThisMonth(userId, monthKey),
  ]);
  if (!budget || budget <= 0) return null;
  const today = todayDateString();
  const summary = buildBudgetSummary({ spent: spent + amountCents, budget, monthKey, today });
  if (summary.state === "unset") return null;
  return {
    remaining: summary.remaining,
    perDay: summary.state === "current" ? summary.perDay : null,
    overBy: summary.remaining < 0 ? -summary.remaining : null,
    monthLabel: monthName(monthKey),
    isCurrentMonth: monthKey === today.slice(0, 7),
  };
}
