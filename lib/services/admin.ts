import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { isUserFeatureKey, type UserFeatureKey } from "@/lib/features";

/**
 * Actividad por usuario para el panel de Super admin. Por privacidad solo
 * cuenta registros y fechas: nunca montos, descripciones ni categorias.
 * "Ultimo registro" es cuando se capturo el gasto (created_at), no la fecha
 * del gasto, para ver quien sigue usando la app aunque capture dias atrasados.
 */
export type UserActivity = {
  id: string;
  email: string | null;
  displayName: string | null;
  isSuperAdmin: boolean;
  joinedAt: string;
  totalExpenses: number;
  expensesLast30Days: number;
  firstExpenseAt: string | null;
  lastExpenseAt: string | null;
  /** Dias completos desde el ultimo registro (calculado en Postgres); null sin gastos */
  daysSinceLastExpense: number | null;
  features: UserFeatureKey[];
};

type ActivityRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  is_super_admin: boolean;
  created_at: Date | string;
  total_expenses: number | string;
  expenses_last_30_days: number | string;
  first_expense_at: Date | string | null;
  last_expense_at: Date | string | null;
  days_since_last_expense: number | string | null;
  features: string[] | null;
};

const toIso = (value: Date | string) => new Date(value).toISOString();

export async function getUsersActivity(): Promise<UserActivity[]> {
  const rows = (await db.execute(sql`
    SELECT
      u.id,
      u.email,
      u.display_name,
      u.is_super_admin,
      u.created_at,
      COUNT(e.id) AS total_expenses,
      COUNT(e.id) FILTER (WHERE e.created_at >= now() - interval '30 days') AS expenses_last_30_days,
      MIN(e.created_at) AS first_expense_at,
      MAX(e.created_at) AS last_expense_at,
      FLOOR(EXTRACT(EPOCH FROM now() - MAX(e.created_at)) / 86400) AS days_since_last_expense,
      (SELECT array_agg(f.feature) FROM user_features f WHERE f.user_id = u.id) AS features
    FROM users u
    LEFT JOIN expenses e ON e.user_id = u.id
    GROUP BY u.id
    ORDER BY last_expense_at DESC NULLS LAST, u.created_at DESC
  `)) as unknown as ActivityRow[];

  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    displayName: r.display_name,
    isSuperAdmin: r.is_super_admin,
    joinedAt: toIso(r.created_at),
    totalExpenses: Number(r.total_expenses),
    expensesLast30Days: Number(r.expenses_last_30_days),
    firstExpenseAt: r.first_expense_at ? toIso(r.first_expense_at) : null,
    lastExpenseAt: r.last_expense_at ? toIso(r.last_expense_at) : null,
    daysSinceLastExpense: r.days_since_last_expense === null ? null : Number(r.days_since_last_expense),
    features: (r.features ?? []).filter(isUserFeatureKey),
  }));
}
