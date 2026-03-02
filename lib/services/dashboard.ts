import { db } from "@/lib/db";
import { accounts, categories, expenses } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";

function getMonthBounds(year?: number, month?: number, monthKey?: string) {
  let y: number;
  let m: number;
  if (monthKey && /^\d{4}-\d{2}$/.test(monthKey)) {
    const [yy, mm] = monthKey.split("-").map(Number);
    y = yy;
    m = mm;
  } else if (year != null && month != null) {
    y = year;
    m = month;
  } else {
    const d = new Date();
    y = d.getFullYear();
    m = d.getMonth() + 1;
  }
  const start = `${y}-${String(m).padStart(2, "0")}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export async function getMonthsWithExpenses(userId: string): Promise<string[]> {
  const rows = await db
    .select({
      month: sql<string>`TO_CHAR(DATE(${expenses.date}), 'YYYY-MM')`,
    })
    .from(expenses)
    .where(eq(expenses.userId, userId))
    .groupBy(sql`TO_CHAR(DATE(${expenses.date}), 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(DATE(${expenses.date}), 'YYYY-MM') DESC`);
  return rows.map((r) => r.month);
}

export async function getTotalSpentThisMonth(
  userId: string,
  monthKey?: string
) {
  const { start, end } = getMonthBounds(undefined, undefined, monthKey);

  const result = await db
    .select({
      total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)::int`,
    })
    .from(expenses)
    .where(
      and(
        eq(expenses.userId, userId),
        sql`DATE(${expenses.date}) >= ${start}::date`,
        sql`DATE(${expenses.date}) <= ${end}::date`
      )
    );

  return result[0]?.total ?? 0;
}

export async function getSpentByAccountThisMonth(
  userId: string,
  monthKey?: string
) {
  const { start, end } = getMonthBounds(undefined, undefined, monthKey);

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
        eq(expenses.userId, userId),
        sql`DATE(${expenses.date}) >= ${start}::date`,
        sql`DATE(${expenses.date}) <= ${end}::date`
      )
    )
    .groupBy(expenses.accountId, accounts.name, accounts.type);
}

export async function getRecentExpenses(
  userId: string,
  limit = 5,
  monthKey?: string
) {
  const baseWhere = eq(expenses.userId, userId);
  const bounds = monthKey
    ? getMonthBounds(undefined, undefined, monthKey)
    : null;
  const conditions = bounds
    ? and(
        baseWhere,
        sql`DATE(${expenses.date}) >= ${bounds.start}::date`,
        sql`DATE(${expenses.date}) <= ${bounds.end}::date`
      )
    : baseWhere;
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
    .where(conditions)
    .orderBy(sql`${expenses.date} DESC`)
    .limit(limit);
}

export async function getSpentByCategoryThisMonth(
  userId: string,
  monthKey?: string
) {
  const { start, end } = getMonthBounds(undefined, undefined, monthKey);

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
        eq(expenses.userId, userId),
        sql`DATE(${expenses.date}) >= ${start}::date`,
        sql`DATE(${expenses.date}) <= ${end}::date`
      )
    )
    .groupBy(expenses.categoryId, categories.name);
}

export async function getSpentByMonthLastNMonths(
  userId: string,
  n: number,
  endMonthKey?: string
) {
  const baseDate = endMonthKey && /^\d{4}-\d{2}$/.test(endMonthKey)
    ? (() => {
        const [y, m] = endMonthKey.split("-").map(Number);
        return new Date(y, m - 1, 1);
      })()
    : new Date();
  const rows: { month: string; total: number; year: number; monthNum: number }[] = [];

  for (let i = 0; i < n; i++) {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
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
          eq(expenses.userId, userId),
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

export async function getExpenseCountThisMonth(
  userId: string,
  monthKey?: string
) {
  const { start, end } = getMonthBounds(undefined, undefined, monthKey);

  const result = await db
    .select({
      count: sql<number>`COUNT(*)::int`,
    })
    .from(expenses)
    .where(
      and(
        eq(expenses.userId, userId),
        sql`DATE(${expenses.date}) >= ${start}::date`,
        sql`DATE(${expenses.date}) <= ${end}::date`
      )
    );

  return result[0]?.count ?? 0;
}
