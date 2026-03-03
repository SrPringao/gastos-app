import { db } from "@/lib/db";
import { fixedExpenses, fixedExpensePayments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// ── Gastos fijos ────────────────────────────────────────────────────────────

export async function getFixedExpenses(userId: string) {
  return db
    .select()
    .from(fixedExpenses)
    .where(eq(fixedExpenses.userId, userId))
    .orderBy(fixedExpenses.name);
}

export async function getFixedExpenseById(id: number) {
  const result = await db
    .select()
    .from(fixedExpenses)
    .where(eq(fixedExpenses.id, id))
    .limit(1);
  return result[0] ?? null;
}

export type CreateFixedExpenseInput = {
  name: string;
  amount: number; // en pesos, se convierte a centavos
  dayOfMonth?: number | null;
  category?: string | null;
};

export async function createFixedExpense(
  userId: string,
  input: CreateFixedExpenseInput
) {
  const { name, amount, dayOfMonth, category } = input;

  if (!name?.trim()) return { error: "El nombre es requerido" };

  const amountCents = Math.round(amount * 100);
  if (isNaN(amountCents) || amountCents <= 0)
    return { error: "Monto inválido" };

  if (dayOfMonth !== undefined && dayOfMonth !== null) {
    if (dayOfMonth < 1 || dayOfMonth > 31)
      return { error: "El día debe ser entre 1 y 31" };
  }

  await db.insert(fixedExpenses).values({
    userId,
    name: name.trim(),
    amount: amountCents,
    dayOfMonth: dayOfMonth ?? null,
    category: category?.trim() || null,
  });

  return { success: true };
}

export async function deleteFixedExpense(userId: string, id: number) {
  const existing = await getFixedExpenseById(id);
  if (!existing) return { error: "Gasto fijo no encontrado" };
  if (existing.userId !== userId) return { error: "No autorizado" };

  await db.delete(fixedExpenses).where(eq(fixedExpenses.id, id));
  return { success: true };
}

// ── Pagos mensuales ─────────────────────────────────────────────────────────

export async function getPaymentsForMonth(userId: string, month: string) {
  return db
    .select()
    .from(fixedExpensePayments)
    .where(
      and(
        eq(fixedExpensePayments.userId, userId),
        eq(fixedExpensePayments.month, month)
      )
    );
}

export async function markAsPaid(
  userId: string,
  fixedExpenseId: number,
  month: string
) {
  const expense = await getFixedExpenseById(fixedExpenseId);
  if (!expense) return { error: "Gasto fijo no encontrado" };
  if (expense.userId !== userId) return { error: "No autorizado" };

  // Upsert: si ya existe no falla
  try {
    await db.insert(fixedExpensePayments).values({
      fixedExpenseId,
      userId,
      month,
      paidAt: new Date(),
    });
  } catch {
    // Ya estaba marcado como pagado (unique constraint), no es error
  }

  return { success: true };
}

export async function markAsUnpaid(
  userId: string,
  fixedExpenseId: number,
  month: string
) {
  const expense = await getFixedExpenseById(fixedExpenseId);
  if (!expense) return { error: "Gasto fijo no encontrado" };
  if (expense.userId !== userId) return { error: "No autorizado" };

  await db
    .delete(fixedExpensePayments)
    .where(
      and(
        eq(fixedExpensePayments.fixedExpenseId, fixedExpenseId),
        eq(fixedExpensePayments.userId, userId),
        eq(fixedExpensePayments.month, month)
      )
    );

  return { success: true };
}
