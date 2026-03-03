import { getCurrentUserId } from "@/lib/auth";
import {
  getTotalSpentThisMonth,
  getSpentByAccountThisMonth,
  getExpenseCountThisMonth,
  getDailySpentByAccountThisMonth,
} from "@/lib/services/dashboard";
import { getAccounts } from "@/lib/services/accounts";
import { getCategories } from "@/lib/services/categories";
import { getMonthlyBudget } from "@/lib/services/monthly-budgets";
import { redirect } from "next/navigation";
import { QuickAddExpense } from "@/components/quick-add-expense";
import { ExpensesList } from "@/components/expenses-list";
import { ExpensesMetrics } from "@/components/expenses-dashboard/expenses-metrics";
import { ExpensesByDayStackedChart } from "@/components/expenses-dashboard/expenses-by-day-stacked-chart";
import { ExpensesBudgetProgressChart } from "@/components/expenses-dashboard/expenses-budget-progress-chart";
import { ExpensesByAccountChart } from "@/components/expenses-dashboard/expenses-by-account-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthSelector } from "@/components/month-selector";
import { BudgetAlert } from "@/components/expenses-dashboard/budget-alert";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function GastosPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const params = await searchParams;
  const monthParam = params.month;
  const monthKey =
    monthParam && /^\d{4}-\d{2}$/.test(monthParam)
      ? monthParam
      : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  const [
    accounts,
    categories,
    totalSpent,
    countThisMonth,
    dailyByAccount,
    monthlyBudget,
    byAccount,
  ] = await Promise.all([
    getAccounts(userId),
    getCategories(userId),
    getTotalSpentThisMonth(userId, monthKey),
    getExpenseCountThisMonth(userId, monthKey),
    getDailySpentByAccountThisMonth(userId, monthKey),
    getMonthlyBudget(userId, monthKey),
    getSpentByAccountThisMonth(userId, monthKey),
  ]);

  const [y, m] = monthKey.split("-").map(Number);
  const monthName = new Date(y, m - 1, 1).toLocaleDateString("es-MX", {
    month: "long",
  });
  const monthLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Gastos</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Metricas, graficas e historial de transacciones
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <div className="w-full sm:w-auto">
            <QuickAddExpense accounts={accounts} categories={categories} />
          </div>
          <Suspense fallback={null}>
            <MonthSelector />
          </Suspense>
        </div>
      </div>

      <div className="mb-8 space-y-4">
        <ExpensesMetrics
          totalSpent={totalSpent}
          countThisMonth={countThisMonth}
          monthLabel={monthLabel}
        />
        <BudgetAlert
          totalSpentCents={totalSpent}
          monthlyBudgetCents={monthlyBudget}
          monthLabel={monthLabel}
        />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gasto por dia (este mes)</CardTitle>
            <p className="text-muted-foreground text-sm font-normal">
              Barras apiladas por metodo de pago
            </p>
          </CardHeader>
          <CardContent>
            <ExpensesByDayStackedChart data={dailyByAccount} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Progreso vs presupuesto mensual</CardTitle>
            <p className="text-muted-foreground text-sm font-normal">
              Acumulado diario comparado con tu presupuesto
            </p>
          </CardHeader>
          <CardContent>
            <ExpensesBudgetProgressChart
              data={dailyByAccount.reduce<
                { date: string; totalCents: number }[]
              >((acc, row) => {
                const existing = acc.find((d) => d.date === row.date);
                if (existing) {
                  existing.totalCents += row.total;
                } else {
                  acc.push({ date: row.date, totalCents: row.total });
                }
                return acc;
              }, [])}
              monthlyBudgetCents={monthlyBudget}
              monthLabel={monthLabel}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 sm:mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Por metodo de pago (este mes)</CardTitle>
            <p className="text-muted-foreground text-sm font-normal">
              Gasto por cuenta
            </p>
          </CardHeader>
          <CardContent>
            <ExpensesByAccountChart data={byAccount} />
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Historial</h2>
        <ExpensesList
          accounts={accounts.map((a) => ({ id: a.id, name: a.name, type: a.type }))}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          monthKey={monthKey}
        />
      </div>
    </div>
  );
}
