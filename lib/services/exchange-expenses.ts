import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { exchangeExpenses } from "@/lib/db/schema";
import {
  isExchangeCategory,
  isExchangeCurrency,
  type ExchangeCategory,
  type ExchangeCurrency,
  type ExchangeExpenseItem,
} from "@/lib/exchange";
import { parseAmountInput } from "@/lib/utils/parse-amount";
import { getEurToMxnRate } from "@/lib/services/fx-rates";

const toYmd = (date: Date) => date.toISOString().slice(0, 10);

/** Columnas de tipo de cambio para un gasto: pesos no lleva; euros se consulta */
async function fxFor(currency: ExchangeCurrency, date: Date) {
  if (currency === "MXN") return { fxRate: null, fxDate: null };
  const fx = await getEurToMxnRate(toYmd(date));
  return { fxRate: fx ? String(fx.rate) : null, fxDate: fx?.date ?? null };
}

export async function getExchangeExpenses(userId: string): Promise<ExchangeExpenseItem[]> {
  const rows = await db
    .select()
    .from(exchangeExpenses)
    .where(eq(exchangeExpenses.userId, userId))
    .orderBy(desc(exchangeExpenses.date), desc(exchangeExpenses.createdAt));

  // Gastos en euros sin tipo de cambio (anteriores a la conversion o la API
  // no respondio al guardar): se completan ahora y quedan guardados
  await Promise.all(
    rows
      .filter((r) => r.currency !== "MXN" && r.fxRate === null)
      .map(async (r) => {
        const fx = await fxFor(r.currency as ExchangeCurrency, r.date);
        if (fx.fxRate === null) return;
        await db.update(exchangeExpenses).set(fx).where(eq(exchangeExpenses.id, r.id));
        Object.assign(r, fx);
      })
  );

  return rows.map((r) => {
    const fxRate = r.fxRate === null ? null : Number(r.fxRate);
    return {
      id: r.id,
      amount: r.amount,
      currency: r.currency as ExchangeCurrency,
      reason: r.reason,
      category: r.category as ExchangeCategory,
      // Fechas guardadas a medianoche UTC: la parte de calendario es la del ISO
      date: toYmd(r.date),
      note: r.note,
      mxnAmount: r.currency === "MXN" ? r.amount : fxRate === null ? null : Math.round(r.amount * fxRate),
      fxRate,
      fxDate: r.fxDate,
    };
  });
}

export type ExchangeExpenseInput = {
  /** En pesos/euros (no centavos) */
  amount?: unknown;
  currency?: unknown;
  reason?: unknown;
  category?: unknown;
  /** YYYY-MM-DD */
  date?: unknown;
  note?: unknown;
};

type Parsed = {
  amount: number;
  currency: ExchangeCurrency;
  reason: string;
  category: ExchangeCategory;
  date: Date;
  note: string | null;
};

/** Valida el cuerpo completo (alta) o solo los campos enviados (edicion) */
function parseInput(
  input: ExchangeExpenseInput,
  partial: boolean
): { data: Partial<Parsed> } | { error: string } {
  const data: Partial<Parsed> = {};

  if (input.amount !== undefined || !partial) {
    const cents = Math.round(parseAmountInput(input.amount) * 100);
    if (!Number.isFinite(cents) || cents <= 0) return { error: "Monto inválido" };
    data.amount = cents;
  }
  if (input.currency !== undefined || !partial) {
    if (!isExchangeCurrency(input.currency)) return { error: "Moneda inválida" };
    data.currency = input.currency;
  }
  if (input.reason !== undefined || !partial) {
    const reason = typeof input.reason === "string" ? input.reason.trim() : "";
    if (!reason) return { error: "El motivo es requerido" };
    data.reason = reason.slice(0, 200);
  }
  if (input.category !== undefined || !partial) {
    if (!isExchangeCategory(input.category)) return { error: "Categoría inválida" };
    data.category = input.category;
  }
  if (input.date !== undefined || !partial) {
    if (typeof input.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input.date))
      return { error: "Fecha inválida" };
    data.date = new Date(`${input.date}T00:00:00.000Z`);
  }
  if (input.note !== undefined) {
    const note = typeof input.note === "string" ? input.note.trim() : "";
    data.note = note ? note.slice(0, 500) : null;
  }

  return { data };
}

export async function createExchangeExpense(userId: string, input: ExchangeExpenseInput) {
  const parsed = parseInput(input, false);
  if ("error" in parsed) return { error: parsed.error };
  const data = parsed.data as Parsed;

  const fx = await fxFor(data.currency, data.date);
  await db.insert(exchangeExpenses).values({ userId, ...data, note: data.note ?? null, ...fx });
  return { success: true };
}

export async function updateExchangeExpense(userId: string, id: number, input: ExchangeExpenseInput) {
  const parsed = parseInput(input, true);
  if ("error" in parsed) return { error: parsed.error };

  const [existing] = await db
    .select()
    .from(exchangeExpenses)
    .where(and(eq(exchangeExpenses.id, id), eq(exchangeExpenses.userId, userId)))
    .limit(1);
  if (!existing) return { error: "Gasto no encontrado" };

  // Otra moneda u otro dia: otro tipo de cambio
  const currency = parsed.data.currency ?? (existing.currency as ExchangeCurrency);
  const date = parsed.data.date ?? existing.date;
  const fxChanged = currency !== existing.currency || toYmd(date) !== toYmd(existing.date);
  const fx = fxChanged ? await fxFor(currency, date) : {};

  await db
    .update(exchangeExpenses)
    .set({ ...parsed.data, ...fx, updatedAt: new Date() })
    .where(eq(exchangeExpenses.id, id));

  return { success: true };
}

export async function deleteExchangeExpense(userId: string, id: number) {
  const result = await db
    .delete(exchangeExpenses)
    .where(and(eq(exchangeExpenses.id, id), eq(exchangeExpenses.userId, userId)))
    .returning({ id: exchangeExpenses.id });

  if (result.length === 0) return { error: "Gasto no encontrado" };
  return { success: true };
}
