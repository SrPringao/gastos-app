import { Suspense } from "react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
import { getCurrentUser } from "@/lib/auth";
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
  nextPaymentWithBalance,
} from "@/lib/dashboard-metrics";
import {
  formatLongDay,
  formatShortWeekday,
  monthName,
  todayDateString,
} from "@/lib/utils/dates";
import { NewExpenseButton } from "@/components/dashboard/new-expense-button";
import {
  MonthSwitcher,
  MonthTitleSelect,
} from "@/components/ui/eb/month-switcher";
import { PageGlow } from "@/components/ui/eb/page-glow";
import { ProfileMenu } from "@/components/profile-menu";
import { SpentCard } from "@/components/dashboard/spent-card";
import { BudgetCard } from "@/components/dashboard/budget-card";
import {
  NextPaymentWidget,
  UpcomingPaymentsCard,
} from "@/components/dashboard/upcoming-payments-card";
import {
  RecentExpensesCard,
  RecentExpensesMobile,
} from "@/components/dashboard/recent-expenses";
import {
  AccountsCarousel,
  AccountsOverviewCard,
} from "@/components/dashboard/accounts-overview";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const userId = user.id;

  const today = todayDateString();
  const params = await searchParams;
  const monthKey =
    params.month && /^\d{4}-\d{2}$/.test(params.month)
      ? params.month
      : today.slice(0, 7);

  const [
    allAccounts,
    categories,
    totalSpent,
    spentByAccount,
    recentExpenses,
    budget,
    netWorthEntries,
  ] = await Promise.all([
    getAccounts(userId, { includeArchived: true }),
    getCategories(userId),
    getTotalSpentThisMonth(userId, monthKey),
    getSpentByAccountThisMonth(userId, monthKey),
    getRecentExpenses(userId, 5, monthKey),
    getMonthlyBudget(userId, monthKey),
    getNetWorthEntries(userId),
  ]);
  // Archivados: fuera de "Agregar gasto" y de los resumenes, pero sus
  // gastos se pueden seguir editando.
  const accounts = allAccounts.filter((a) => !a.archivedAt);

  const month = monthName(monthKey);
  const { segments } = buildSpendSegments(spentByAccount);
  const budgetSummary = buildBudgetSummary({
    spent: totalSpent,
    budget,
    monthKey,
    today,
  });
  const payments = buildUpcomingPayments(
    netWorthEntries.filter((e) => e.kind === "debt"),
    today,
    new Map(allAccounts.map((a) => [a.id, a.paymentDay])),
  );
  const toItem = (p: (typeof payments)[number]) => ({
    id: p.entry.id,
    name: p.entry.label,
    amount: p.entry.amount,
    daysLeft: p.daysLeft,
    label: p.label,
    isSoon: p.isSoon,
  });
  const upcoming = payments.map(toItem);
  const nextPayment = nextPaymentWithBalance(payments);
  const toBalanceItem = (b: ReturnType<typeof buildAccountBalances>[number]) => ({
    entryId: b.entryId,
    label: b.label,
    balance: b.balance,
    accountId: b.account.id,
    accountType: b.account.type,
    color: b.account.color,
  });
  // Movil: carrusel de hasta 4 en el orden del usuario. Escritorio: todas.
  const accountBalances = buildAccountBalances(netWorthEntries, accounts).map(toBalanceItem);
  const allAccountBalances = buildAccountBalances(netWorthEntries, accounts, Infinity).map(
    toBalanceItem,
  );
  const editAccounts = allAccounts.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    archived: !!a.archivedAt,
  }));
  const editCategories = categories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <>
      {/* Movil (< 768px): Phone-Inicio.dc.html */}
      <div className="relative overflow-hidden md:hidden">
        <PageGlow variant="home" />
        <div className="relative z-[1] flex flex-col gap-[22px] px-4 pt-[max(64px,calc(env(safe-area-inset-top)+20px))] pb-14">
          <header className="flex items-end justify-between px-1">
            <div className="flex flex-col gap-0.5">
              <div className="text-eb-text-tertiary text-[13px] font-semibold tracking-[0.04em] uppercase">
                {formatShortWeekday(today)}
              </div>
              <Suspense
                fallback={
                  <h1 className="eb-title">
                    {month}
                  </h1>
                }
              >
                <MonthTitleSelect />
              </Suspense>
            </div>
            <ProfileMenu name={user.displayName || user.email || "Perfil"} />
          </header>

          <SpentCard
            variant="mobile"
            label="Gastado este mes"
            total={totalSpent}
            segments={segments}
            monthKey={monthKey}
          />

          <div className="grid grid-cols-2 gap-[14px]">
            <BudgetCard
              variant="mobile"
              summary={budgetSummary}
              monthKey={monthKey}
              monthLabel={month}
            />
            <NextPaymentWidget
              payment={nextPayment ? toItem(nextPayment) : null}
            />
          </div>

          <RecentExpensesMobile
            expenses={recentExpenses}
            accounts={editAccounts}
            categories={editCategories}
          />

          <AccountsCarousel items={accountBalances} />
        </div>
      </div>

      {/* Escritorio: Main.dc.html */}
      <div className="hidden px-6 pt-10 pb-16 md:block lg:px-12">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-7">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="text-eb-text-tertiary text-[13px] font-semibold tracking-[0.04em] uppercase">
                {formatLongDay(today)}
              </div>
              <h1 className="eb-title">
                {month}
              </h1>
            </div>
            <div className="flex items-center gap-2.5">
              <Suspense fallback={null}>
                <MonthSwitcher />
              </Suspense>
              <NewExpenseButton accounts={accounts} categories={categories} />
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
              items={allAccountBalances}
              creditCount={countCreditAccounts(accounts)}
              className="col-span-12 min-[1000px]:col-span-5"
            />
          </div>
        </div>
      </div>
    </>
  );
}
