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

export async function getExchangeExpenses(userId: string): Promise<ExchangeExpenseItem[]> {
  const rows = await db
    .select()
    .from(exchangeExpenses)
    .where(eq(exchangeExpenses.userId, userId))
    .orderBy(desc(exchangeExpenses.date), desc(exchangeExpenses.createdAt));

  return rows.map((r) => ({
    id: r.id,
    amount: r.amount,
    currency: r.currency as ExchangeCurrency,
    reason: r.reason,
    category: r.category as ExchangeCategory,
    // Fechas guardadas a medianoche UTC: la parte de calendario es la del ISO
    date: r.date.toISOString().slice(0, 10),
    note: r.note,
  }));
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

  await db.insert(exchangeExpenses).values({ userId, ...data, note: data.note ?? null });
  return { success: true };
}

export async function updateExchangeExpense(userId: string, id: number, input: ExchangeExpenseInput) {
  const parsed = parseInput(input, true);
  if ("error" in parsed) return { error: parsed.error };

  const result = await db
    .update(exchangeExpenses)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(exchangeExpenses.id, id), eq(exchangeExpenses.userId, userId)))
    .returning({ id: exchangeExpenses.id });

  if (result.length === 0) return { error: "Gasto no encontrado" };
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
