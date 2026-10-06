"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EbCard } from "@/components/ui/eb/card";
import { GroupedList } from "@/components/ui/eb/grouped-list";
import {
  ExpenseRow,
  SwipeExpenseRow,
  type ExpenseItem,
} from "@/components/expenses/expense-row";
import { cleanMerchantName } from "@/lib/dashboard-metrics";
import { groupByDayWithTotals } from "@/lib/expenses-metrics";
import { dbDateToInputValue, formatDayMonth, formatLongDay } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";

export type RecentExpense = ExpenseItem;

type RecentExpensesProps = {
  expenses: RecentExpense[];
  accounts: { id: number; name: string; type: string }[];
  categories: { id: number; name: string }[];
  className?: string;
};

/** Escritorio: tarjeta "Recientes" con los ultimos 5 gastos agrupados por dia */
export function RecentExpensesCard({ expenses, accounts, categories, className }: RecentExpensesProps) {
  const router = useRouter();
  const groups = groupByDayWithTotals(expenses);
  const edit = { accounts, categories, onChanged: () => router.refresh() };

  return (
    <EbCard className={cn("flex flex-col overflow-hidden", className)}>
      <div className="flex items-center justify-between px-6 pt-[22px] pb-2">
        <h2 className="eb-card-title m-0">Recientes</h2>
        <Link href="/gastos" className="eb-link py-1.5 pl-2.5 text-[14px]">
          Ver todo
        </Link>
      </div>

      {expenses.length === 0 ? (
        <p className="text-eb-text-tertiary flex flex-1 items-center justify-center px-6 pb-8 text-[14px]">
          No hay gastos registrados este mes.
        </p>
      ) : (
        <div className="flex flex-1 flex-col pb-2">
          {groups.map((group) => (
            <div key={group.date} className="flex flex-1 flex-col">
              <div className="text-eb-text-tertiary px-6 pt-1 pb-1.5 text-[12px] font-semibold tracking-[0.04em] uppercase">
                {formatLongDay(group.date)}
              </div>
              <GroupedList className="flex-1">
                {group.items.map((expense) => {
                  const { aggregator } = cleanMerchantName(expense.description);
                  return (
                    <ExpenseRow
                      key={expense.id}
                      stretch
                      expense={expense}
                      subtitle={aggregator ? `${expense.accountName} · ${aggregator}` : expense.accountName}
                      edit={edit}
                    />
                  );
                })}
              </GroupedList>
            </div>
          ))}
        </div>
      )}
    </EbCard>
  );
}

/** Movil: lista agrupada con swipe a la izquierda para editar/borrar */
export function RecentExpensesMobile({ expenses, accounts, categories }: RecentExpensesProps) {
  const router = useRouter();
  const [openId, setOpenId] = useState<number | null>(null);
  const edit = {
    accounts,
    categories,
    onChanged: () => {
      setOpenId(null);
      router.refresh();
    },
  };

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="eb-card-title m-0">Recientes</h2>
        <Link href="/gastos" className="eb-link py-2.5 pl-3 text-[15px]">
          Ver todo
        </Link>
      </div>
      <EbCard size="list" as="div" className="overflow-hidden">
        {expenses.length === 0 ? (
          <p className="text-eb-text-tertiary px-4 py-6 text-center text-[14px]">
            No hay gastos registrados este mes.
          </p>
        ) : (
          <GroupedList>
            {expenses.map((expense) => (
              <SwipeExpenseRow
                key={expense.id}
                expense={expense}
                subtitle={`${expense.accountName} · ${formatDayMonth(dbDateToInputValue(expense.date))}`}
                open={openId === expense.id}
                onOpenChange={(open) => setOpenId(open ? expense.id : null)}
                edit={edit}
              />
            ))}
          </GroupedList>
        )}
      </EbCard>
    </section>
  );
}
