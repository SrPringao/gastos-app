import {
  getTotalSpentThisMonth,
  getSpentByAccountThisMonth,
  getSpentByCategoryThisMonth,
  getSpentByMonthLastNMonths,
  getExpenseCountThisMonth,
} from "@/lib/services/dashboard";
import { getAccounts } from "@/lib/services/accounts";
import { getCategories } from "@/lib/services/categories";
import { QuickAddExpense } from "@/components/quick-add-expense";
import { ExpensesList } from "@/components/expenses-list";
import { ExpensesMetrics } from "@/components/expenses-dashboard/expenses-metrics";
import { ExpensesTrendChart } from "@/components/expenses-dashboard/expenses-trend-chart";
import { ExpensesByCategoryChart } from "@/components/expenses-dashboard/expenses-by-category-chart";
import { ExpensesByAccountChart } from "@/components/expenses-dashboard/expenses-by-account-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function GastosPage() {
  const [
    accounts,
    categories,
    totalSpent,
    countThisMonth,
    byMonth,
    byCategory,
    byAccount,
  ] = await Promise.all([
    getAccounts(),
    getCategories(),
    getTotalSpentThisMonth(),
    getExpenseCountThisMonth(),
    getSpentByMonthLastNMonths(6),
    getSpentByCategoryThisMonth(),
    getSpentByAccountThisMonth(),
  ]);

  const now = new Date();
  const monthName = now.toLocaleDateString("es-MX", { month: "long" });
  const monthLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gastos</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Metricas, graficas e historial de transacciones
          </p>
        </div>
        <QuickAddExpense accounts={accounts} categories={categories} />
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

      <div className="mb-8">
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
        />
      </div>
    </div>
  );
}
