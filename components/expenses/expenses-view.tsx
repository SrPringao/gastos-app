"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontalIcon } from "lucide-react";
import { MonthSwitcher, MonthTitleSelect } from "@/components/ui/eb/month-switcher";
import { PageGlow } from "@/components/ui/eb/page-glow";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NewExpenseButton } from "@/components/dashboard/new-expense-button";
import { SpentKpi, TransactionsKpi, LargestKpi } from "@/components/expenses/expenses-kpis";
import { DailySpendCard } from "@/components/expenses/daily-spend-chart";
import { PaceCard } from "@/components/expenses/pace-card";
import { HistoryDesktop, HistoryMobile, MobileFilterControls } from "@/components/expenses/expenses-history";
import { useExpenseFilters } from "@/components/expenses/use-expense-filters";
import {
  buildAccountTotals,
  buildDailySeries,
  buildMonthStats,
  buildPace,
  type MonthExpense,
} from "@/lib/expenses-metrics";
import { formatLongDay, monthName } from "@/lib/utils/dates";
import type { Account, Category } from "@/lib/db/schema";

/**
 * Pagina Gastos (Gastos.dc.html / Phone-Gastos.dc.html). Un solo estado
 * compartido: el dia que se toca en la grafica selecciona la columna y
 * filtra el Historial a ese dia.
 */
export function ExpensesView({
  expenses,
  accounts,
  categories,
  budget,
  monthKey,
  today,
  initialAccountId,
}: {
  expenses: MonthExpense[];
  accounts: Account[];
  categories: Category[];
  budget: number | null;
  monthKey: string;
  today: string;
  /** Filtro inicial por metodo (?method=<id>) */
  initialAccountId?: string;
}) {
  const router = useRouter();
  const filters = useExpenseFilters(expenses, { accountId: initialAccountId });

  // ?method=<id> solo fija el filtro inicial: se quita de la URL para que al
  // recargar o cambiar de mes no se vuelva a aplicar solo.
  useEffect(() => {
    if (!initialAccountId) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("method");
    window.history.replaceState(window.history.state, "", url.pathname + url.search);
  }, [initialAccountId]);
  const activeAccounts = accounts.filter((a) => !a.archivedAt);
  const month = monthName(monthKey);
  const accountTotals = buildAccountTotals(expenses);
  const stats = buildMonthStats(expenses, monthKey, today);
  const series = buildDailySeries(expenses, monthKey, today, accountTotals);
  const pace = buildPace({ expenses, budget, monthKey, today });
  // Por defecto se resalta el dia con mayor gasto; tocar uno lo cambia
  const [pickedDay, setPickedDay] = useState<string | null>(null);
  const selectedDay =
    pickedDay && pickedDay.startsWith(monthKey) ? pickedDay : (filters.dateFrom && !filters.dateTo ? filters.dateFrom : series.peakDate);

  const edit = {
    accounts: accounts.map((a) => ({ id: a.id, name: a.name, type: a.type, archived: !!a.archivedAt })),
    categories: categories.map((c) => ({ id: c.id, name: c.name })),
    onChanged: () => router.refresh(),
  };

  function selectDay(date: string) {
    setPickedDay(date);
    filters.setDateRange(date, "");
  }

  const historyProps = {
    filters,
    accountTotals,
    monthTotal: stats.total,
    monthCount: stats.count,
    monthLabel: month,
    categories: edit.categories,
    edit,
    newExpense: <NewExpenseButton accounts={activeAccounts} categories={categories} />,
  };

  return (
    <>
      {/* Movil (< 768px) */}
      <div className="relative overflow-hidden md:hidden">
        <PageGlow variant="home" />
        <div className="relative z-[1] flex flex-col gap-[22px] px-4 pt-4 pb-14">
          <header className="flex items-end justify-between px-1">
            <div className="flex flex-col gap-0.5">
                <div className="text-eb-text-tertiary text-[13px] font-semibold tracking-[0.04em] uppercase">
                  {month} {monthKey.slice(0, 4)}
                </div>
                <Suspense fallback={<h1 className="eb-title">Gastos</h1>}>
                  <MonthTitleSelect title="Gastos" />
                </Suspense>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Filtros"
                  className="text-eb-link relative flex size-9 items-center justify-center rounded-full"
                  style={{ background: "var(--eb-glass-strong)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)" }}
                >
                  <SlidersHorizontalIcon size={18} strokeWidth={2.2} aria-hidden="true" />
                  {filters.hasFilters && (
                    <span className="bg-eb-accent absolute top-1 right-1 size-2 rounded-full" aria-hidden="true" />
                  )}
                </button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="text-eb-text rounded-t-[24px] px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
              >
                <SheetHeader className="p-0 text-left">
                  <SheetTitle className="eb-card-title">Filtros</SheetTitle>
                  <SheetDescription className="sr-only">Categoría, fecha y orden del historial</SheetDescription>
                </SheetHeader>
                <MobileFilterControls filters={filters} categories={edit.categories} />
              </SheetContent>
            </Sheet>
          </header>

          <SpentKpi variant="mobile" monthLabel={month} stats={stats} budget={budget} />
          <div className="grid grid-cols-2 gap-[14px]">
            <TransactionsKpi variant="mobile" stats={stats} />
            <LargestKpi variant="mobile" stats={stats} edit={edit} />
          </div>
          <DailySpendCard variant="mobile" series={series} selected={selectedDay} onSelect={selectDay} />
          <PaceCard variant="mobile" pace={pace} monthKey={monthKey} />
          <HistoryMobile {...historyProps} />
        </div>
      </div>

      {/* Escritorio */}
      <div className="hidden px-6 pt-10 pb-16 md:block lg:px-12">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-7">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="text-eb-text-tertiary text-[13px] font-semibold tracking-[0.04em] uppercase">
                {formatLongDay(today)}
              </div>
              <h1 className="eb-title">Gastos</h1>
            </div>
            <div className="flex items-center gap-2.5">
              <Suspense fallback={null}>
                <MonthSwitcher />
              </Suspense>
              <NewExpenseButton accounts={activeAccounts} categories={categories} />
            </div>
          </header>

          <div className="grid grid-cols-12 items-stretch gap-5">
            <SpentKpi
              monthLabel={month}
              stats={stats}
              budget={budget}
              className="col-span-12 min-[1000px]:col-span-4"
            />
            <TransactionsKpi stats={stats} className="col-span-12 min-[1000px]:col-span-4" />
            <LargestKpi stats={stats} edit={edit} className="col-span-12 min-[1000px]:col-span-4" />

            <DailySpendCard
              series={series}
              selected={selectedDay}
              onSelect={selectDay}
              className="col-span-12 min-[1000px]:col-span-7"
            />
            <PaceCard pace={pace} monthKey={monthKey} className="col-span-12 min-[1000px]:col-span-5" />

            <HistoryDesktop {...historyProps} className="col-span-12" />
          </div>
        </div>
      </div>
    </>
  );
}
