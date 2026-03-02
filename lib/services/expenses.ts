import { db } from "@/lib/db";
import { accounts, categories, expenses } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export type CreateExpenseInput = {
  amount: number;
  accountId: number;
  categoryId?: number | null;
  date: string;
  description?: string | null;
};

export type UpdateExpenseInput = {
  amount?: number;
  accountId?: number;
  categoryId?: number | null;
  date?: string;
  description?: string | null;
};

export async function createExpense(input: CreateExpenseInput) {
  const { amount, accountId, categoryId, date, description } = input;

  const amountCents = Math.round(amount * 100);
  if (isNaN(amountCents) || amountCents <= 0) {
    return { error: "Monto invalido" };
  }
  if (!accountId) {
    return { error: "Selecciona un metodo de pago" };
  }

  await db.insert(expenses).values({
    amount: amountCents,
    accountId,
    categoryId: categoryId ?? null,
    date: new Date(date),
    description: description || null,
  });

  return { success: true };
}

export async function getExpenseById(id: number) {
  const result = await db
    .select()
    .from(expenses)
    .where(eq(expenses.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function getExpenses(limit = 100) {
  return db
    .select()
    .from(expenses)
    .orderBy(desc(expenses.date))
    .limit(limit);
}

export async function getExpensesWithDetails(limit = 100) {
  return db
    .select({
      id: expenses.id,
      amount: expenses.amount,
      date: expenses.date,
      description: expenses.description,
      accountId: expenses.accountId,
      categoryId: expenses.categoryId,
      accountName: accounts.name,
      accountColor: accounts.color,
      accountImageUrl: accounts.imageUrl,
      categoryName: categories.name,
    })
    .from(expenses)
    .innerJoin(accounts, eq(expenses.accountId, accounts.id))
    .leftJoin(categories, eq(expenses.categoryId, categories.id))
    .orderBy(desc(expenses.date))
    .limit(limit);
}

export async function updateExpense(id: number, input: UpdateExpenseInput) {
  const existing = await getExpenseById(id);
  if (!existing) {
    return { error: "Gasto no encontrado" };
  }

  const { amount, accountId, categoryId, date, description } = input;

  if (amount !== undefined) {
    const amountCents = Math.round(amount * 100);
    if (isNaN(amountCents) || amountCents <= 0) {
      return { error: "Monto invalido" };
    }
  }
  if (accountId !== undefined && !accountId) {
    return { error: "Selecciona un metodo de pago" };
  }

  await db
    .update(expenses)
    .set({
      ...(amount !== undefined && { amount: Math.round(amount * 100) }),
      ...(accountId !== undefined && { accountId }),
      ...(categoryId !== undefined && { categoryId: categoryId ?? null }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(description !== undefined && { description: description || null }),
    })
    .where(eq(expenses.id, id));

  return { success: true };
}
