import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PlusIcon } from "lucide-react";

export const dynamic = "force-dynamic";
import { getCurrentUserId } from "@/lib/auth";
import { getAccounts } from "@/lib/services/accounts";
import { getCategories } from "@/lib/services/categories";
import { getMonthlyBudget } from "@/lib/services/monthly-budgets";
import { getNetWorthEntries } from "@/lib/services/net-worth";
import {
  getTotalSpentThisMonth,
  getSpentByAccountThisMonth,
  getRecentExpenses,
} from "@/lib/services/dashboard";
import {
  buildAccountBalances,
  buildBudgetSummary,
  buildSpendSegments,
  buildUpcomingPayments,
  countCreditAccounts,
} from "@/lib/dashboard-metrics";
import { formatLongDay, monthName, todayDateString } from "@/lib/utils/dates";
import { QuickAddExpense } from "@/components/quick-add-expense";
import { MonthSwitcher } from "@/components/ui/eb/month-switcher";
import { SpentCard } from "@/components/dashboard/spent-card";
import { BudgetCard } from "@/components/dashboard/budget-card";
import { UpcomingPaymentsCard } from "@/components/dashboard/upcoming-payments-card";
import { RecentExpensesCard } from "@/components/dashboard/recent-expenses";
import { AccountsOverviewCard } from "@/components/dashboard/accounts-overview";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const today = todayDateString();
  const params = await searchParams;
  const monthKey =
    params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : today.slice(0, 7);

  const [accounts, categories, totalSpent, spentByAccount, recentExpenses, budget, netWorthEntries] =
    await Promise.all([
      getAccounts(userId),
      getCategories(userId),
      getTotalSpentThisMonth(userId, monthKey),
      getSpentByAccountThisMonth(userId, monthKey),
      getRecentExpenses(userId, 5, monthKey),
      getMonthlyBudget(userId, monthKey),
      getNetWorthEntries(userId),
    ]);

  const month = monthName(monthKey);
  const { segments } = buildSpendSegments(spentByAccount);
  const budgetSummary = buildBudgetSummary({ spent: totalSpent, budget, monthKey, today });
  const upcoming = buildUpcomingPayments(
    netWorthEntries.filter((e) => e.kind === "debt"),
    today
  ).map((p) => ({
    id: p.entry.id,
    name: p.entry.label,
    amount: p.entry.amount,
    daysLeft: p.daysLeft,
    label: p.label,
    isSoon: p.isSoon,
  }));
  const accountBalances = buildAccountBalances(netWorthEntries, accounts).map((b) => ({
    entryId: b.entryId,
    label: b.label,
    balance: b.balance,
    accountId: b.account.id,
    accountType: b.account.type,
    color: b.account.color,
  }));
  const editAccounts = accounts.map((a) => ({ id: a.id, name: a.name, type: a.type }));
  const editCategories = categories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="px-4 pt-6 pb-16 sm:px-6 lg:px-12 lg:pt-10">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-7">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="text-eb-text-tertiary text-[13px] font-semibold tracking-[0.04em] uppercase">
              {formatLongDay(today)}
            </div>
            <h1 className="m-0 text-[34px] leading-[1.1] font-bold tracking-[-0.025em]">{month}</h1>
          </div>
          <div className="flex items-center gap-2.5">
            <Suspense fallback={null}>
              <MonthSwitcher />
            </Suspense>
            <QuickAddExpense
              accounts={accounts}
              categories={categories}
              trigger={
                <button
                  type="button"
                  className="eb-btn-primary flex h-10 items-center gap-2 rounded-[20px] px-[18px] text-[14px]"
                >
                  <PlusIcon size={16} strokeWidth={2.4} aria-hidden="true" />
                  Nuevo gasto
                </button>
              }
            />
          </div>
        </header>

        <div className="grid grid-cols-12 items-stretch gap-5">
          <SpentCard
            label={`Gastado en ${month.toLocaleLowerCase("es-MX")}`}
            total={totalSpent}
            segments={segments}
            monthKey={monthKey}
            className="col-span-12 min-[1000px]:col-span-6"
          />
          <BudgetCard
            summary={budgetSummary}
            monthKey={monthKey}
            monthLabel={month}
            className="col-span-12 min-[1000px]:col-span-3"
          />
          <UpcomingPaymentsCard
            payments={upcoming.slice(0, 3)}
            className="col-span-12 min-[1000px]:col-span-3"
          />

          <RecentExpensesCard
            expenses={recentExpenses}
            accounts={editAccounts}
            categories={editCategories}
            className="col-span-12 min-[1000px]:col-span-7"
          />
          <AccountsOverviewCard
            items={accountBalances}
            creditCount={countCreditAccounts(accounts)}
            className="col-span-12 min-[1000px]:col-span-5"
          />
        </div>
      </div>
    </div>
  );
}
