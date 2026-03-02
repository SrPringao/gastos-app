import { db } from "@/lib/db";
import { accounts, categories, expenses } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";

function getMonthBounds(year?: number, month?: number) {
  const d = year != null && month != null
    ? new Date(year, month - 1, 1)
    : new Date();
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const start = `${y}-${String(m).padStart(2, "0")}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export async function getTotalSpentThisMonth() {
  const { start, end } = getMonthBounds();

  const result = await db
    .select({
      total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)::int`,
    })
    .from(expenses)
    .where(
      and(
        sql`DATE(${expenses.date}) >= ${start}::date`,
        sql`DATE(${expenses.date}) <= ${end}::date`
      )
    );

  return result[0]?.total ?? 0;
}

export async function getSpentByAccountThisMonth() {
  const { start, end } = getMonthBounds();

  return db
    .select({
      accountId: expenses.accountId,
      accountName: accounts.name,
      accountType: accounts.type,
      total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)::int`,
    })
    .from(expenses)
    .innerJoin(accounts, eq(expenses.accountId, accounts.id))
    .where(
      and(
        sql`DATE(${expenses.date}) >= ${start}::date`,
        sql`DATE(${expenses.date}) <= ${end}::date`
      )
    )
    .groupBy(expenses.accountId, accounts.name, accounts.type);
}

export async function getRecentExpenses(limit = 5) {
  return db
    .select({
      id: expenses.id,
      amount: expenses.amount,
      date: expenses.date,
      description: expenses.description,
      accountId: expenses.accountId,
      categoryId: expenses.categoryId,
      accountName: accounts.name,
    })
    .from(expenses)
    .innerJoin(accounts, eq(expenses.accountId, accounts.id))
    .orderBy(sql`${expenses.date} DESC`)
    .limit(limit);
}

export async function getSpentByCategoryThisMonth() {
  const { start, end } = getMonthBounds();

  return db
    .select({
      categoryId: expenses.categoryId,
      categoryName: categories.name,
      total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)::int`,
    })
    .from(expenses)
    .leftJoin(categories, eq(expenses.categoryId, categories.id))
    .where(
      and(
        sql`DATE(${expenses.date}) >= ${start}::date`,
        sql`DATE(${expenses.date}) <= ${end}::date`
      )
    )
    .groupBy(expenses.categoryId, categories.name);
}

export async function getSpentByMonthLastNMonths(n: number) {
  const now = new Date();
  const rows: { month: string; total: number; year: number; monthNum: number }[] = [];

  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const { start, end } = getMonthBounds(y, m);
    const monthKey = `${y}-${String(m).padStart(2, "0")}`;

    const result = await db
      .select({
        total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)::int`,
      })
      .from(expenses)
      .where(
        and(
          sql`DATE(${expenses.date}) >= ${start}::date`,
          sql`DATE(${expenses.date}) <= ${end}::date`
        )
      );

    rows.push({
      month: monthKey,
      total: result[0]?.total ?? 0,
      year: y,
      monthNum: m,
    });
  }

  return rows.reverse();
}

export async function getExpenseCountThisMonth() {
  const { start, end } = getMonthBounds();

  const result = await db
    .select({
      count: sql<number>`COUNT(*)::int`,
    })
    .from(expenses)
    .where(
      and(
        sql`DATE(${expenses.date}) >= ${start}::date`,
        sql`DATE(${expenses.date}) <= ${end}::date`
      )
    );

  return result[0]?.count ?? 0;
}
