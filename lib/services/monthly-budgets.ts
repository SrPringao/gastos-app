import { db } from "@/lib/db";
import { monthlyBudgets, userPreferences } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/** Presupuesto guardado para ese mes (sin el por defecto) */
async function getOwnMonthlyBudget(userId: string, month: string): Promise<number | null> {
  const result = await db
    .select()
    .from(monthlyBudgets)
    .where(
      and(
        eq(monthlyBudgets.userId, userId),
        eq(monthlyBudgets.month, month)
      )
    )
    .limit(1);
  const row = result[0];
  return row ? row.amount : null;
}

/** Presupuesto por defecto del usuario ("Usar para los siguientes meses") */
export async function getDefaultBudget(userId: string): Promise<number | null> {
  const rows = await db
    .select({ defaultBudget: userPreferences.defaultBudget })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  return rows[0]?.defaultBudget ?? null;
}

/**
 * Presupuesto efectivo del mes: el propio del mes o, si no tiene, el
 * presupuesto por defecto del usuario.
 */
export async function getMonthlyBudget(
  userId: string,
  month: string
): Promise<number | null> {
  const [own, fallback] = await Promise.all([
    getOwnMonthlyBudget(userId, month),
    getDefaultBudget(userId),
  ]);
  return own ?? fallback;
}

/** Guarda (o quita, con null) el presupuesto por defecto. No toca meses con presupuesto propio. */
export async function setDefaultBudget(userId: string, amount: number | null) {
  if (amount !== null && (!Number.isInteger(amount) || amount < 0)) {
    return { error: "Monto invalido" };
  }
  const existing = await db
    .select({ id: userPreferences.id })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  if (existing[0]) {
    await db
      .update(userPreferences)
      .set({ defaultBudget: amount, updatedAt: new Date() })
      .where(eq(userPreferences.userId, userId));
  } else {
    await db.insert(userPreferences).values({ userId, defaultBudget: amount });
  }
  return { success: true };
}

export async function upsertMonthlyBudget(
  userId: string,
  month: string,
  amount: number
) {
  if (amount < 0) {
    return { error: "El monto no puede ser negativo" };
  }

  const existing = await getOwnMonthlyBudget(userId, month);

  if (existing !== null) {
    await db
      .update(monthlyBudgets)
      .set({ amount, updatedAt: new Date() })
      .where(
        and(
          eq(monthlyBudgets.userId, userId),
          eq(monthlyBudgets.month, month)
        )
      );
  } else {
    await db.insert(monthlyBudgets).values({
      userId,
      month,
      amount,
    });
  }

  return { success: true };
}
