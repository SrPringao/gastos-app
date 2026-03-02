import { TrendingDownIcon, ReceiptIcon } from "lucide-react";

export const dynamic = "force-dynamic";
import { getCurrentUserId } from "@/lib/auth";
import { getAccounts } from "@/lib/services/accounts";
import { getCategories } from "@/lib/services/categories";
import {
  getTotalSpentThisMonth,
  getSpentByAccountThisMonth,
  getRecentExpenses,
} from "@/lib/services/dashboard";
import { redirect } from "next/navigation";
import { MetricsCard } from "@/components/dashboard/metrics-card";
import { AccountsCard } from "@/components/dashboard/accounts-card";
import { RecentExpensesCard } from "@/components/dashboard/recent-expenses-card";
import { SpentByAccountCard } from "@/components/dashboard/spent-by-account-card";
import { MonthlyBudgetCard } from "@/components/dashboard/monthly-budget-card";
import { MonthSelector } from "@/components/month-selector";
import { Suspense } from "react";

export default async function DashboardPage({
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
    spentByAccount,
    recentExpenses,
  ] = await Promise.all([
    getAccounts(userId),
    getCategories(userId),
    getTotalSpentThisMonth(userId, monthKey),
    getSpentByAccountThisMonth(userId, monthKey),
    getRecentExpenses(userId, 5, monthKey),
  ]);

  const [y, m] = monthKey.split("-").map(Number);
  const monthName = new Date(y, m - 1, 1).toLocaleDateString("es-MX", {
    month: "long",
  });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Resumen de tus gastos y metodos de pago
          </p>
        </div>
        <Suspense fallback={null}>
          <MonthSelector />
        </Suspense>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <MetricsCard
            title="Gastado este mes"
            value={totalSpent}
            subtitle={capitalizedMonth}
            formatAsCurrency
            icon={<TrendingDownIcon className="size-5" />}
          />
        </div>
        <div className="xl:col-span-4">
          <MonthlyBudgetCard
            totalSpentCents={totalSpent}
            monthKey={monthKey}
            monthLabel={capitalizedMonth}
          />
        </div>
        <div className="sm:col-span-2 xl:col-span-3">
          <MetricsCard
            title="Ultimos gastos"
            value={recentExpenses.length > 0 ? recentExpenses.length : 0}
            subtitle="Transacciones recientes"
            icon={<ReceiptIcon className="size-5" />}
          />
        </div>

        <div className="xl:col-span-7">
          <SpentByAccountCard data={spentByAccount} />
        </div>
        <div className="xl:col-span-5">
          <RecentExpensesCard
            expenses={recentExpenses}
            accounts={accounts.map((a) => ({ id: a.id, name: a.name, type: a.type }))}
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          />
        </div>

        <div className="xl:col-span-12">
          <AccountsCard accounts={accounts} categories={categories} />
        </div>
      </div>
    </div>
  );
}
