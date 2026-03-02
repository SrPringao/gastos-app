import { db } from "@/lib/db";
import { monthlyBudgets } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function getMonthlyBudget(
  userId: string,
  month: string
): Promise<number | null> {
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

export async function upsertMonthlyBudget(
  userId: string,
  month: string,
  amount: number
) {
  if (amount < 0) {
    return { error: "El monto no puede ser negativo" };
  }

  const existing = await getMonthlyBudget(userId, month);

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
