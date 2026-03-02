import { getCurrentUserId } from "@/lib/auth";
import {
  getTotalSpentThisMonth,
  getSpentByAccountThisMonth,
  getSpentByCategoryThisMonth,
  getSpentByMonthLastNMonths,
  getExpenseCountThisMonth,
} from "@/lib/services/dashboard";
import { getAccounts } from "@/lib/services/accounts";
import { getCategories } from "@/lib/services/categories";
import { redirect } from "next/navigation";
import { QuickAddExpense } from "@/components/quick-add-expense";
import { ExpensesList } from "@/components/expenses-list";
import { ExpensesMetrics } from "@/components/expenses-dashboard/expenses-metrics";
import { ExpensesTrendChart } from "@/components/expenses-dashboard/expenses-trend-chart";
import { ExpensesByCategoryChart } from "@/components/expenses-dashboard/expenses-by-category-chart";
import { ExpensesByAccountChart } from "@/components/expenses-dashboard/expenses-by-account-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthSelector } from "@/components/month-selector";
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
    byMonth,
    byCategory,
    byAccount,
  ] = await Promise.all([
    getAccounts(userId),
    getCategories(userId),
    getTotalSpentThisMonth(userId, monthKey),
    getExpenseCountThisMonth(userId, monthKey),
    getSpentByMonthLastNMonths(userId, 6, monthKey),
    getSpentByCategoryThisMonth(userId, monthKey),
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

      <div className="mb-8">
        <ExpensesMetrics
          totalSpent={totalSpent}
          countThisMonth={countThisMonth}
          monthLabel={monthLabel}
        />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gasto por mes (ultimos 6 meses)</CardTitle>
            <p className="text-muted-foreground text-sm font-normal">
              Evolucion del total gastado
            </p>
          </CardHeader>
          <CardContent>
            <ExpensesTrendChart data={byMonth} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Por categoria (este mes)</CardTitle>
            <p className="text-muted-foreground text-sm font-normal">
              Distribucion del gasto
            </p>
          </CardHeader>
          <CardContent>
            <ExpensesByCategoryChart data={byCategory} />
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
