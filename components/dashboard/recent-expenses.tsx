"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { EbCard } from "@/components/ui/eb/card";
import { Money } from "@/components/ui/eb/money";
import { CategoryTile } from "@/components/ui/eb/category-tile";
import { GroupedList, ListRow } from "@/components/ui/eb/grouped-list";
import { SwipeAction, SwipeRow } from "@/components/ui/eb/swipe-row";
import { EditExpenseModal } from "@/components/edit-expense-modal";
import { DeleteExpenseButton } from "@/components/delete-expense-button";
import { getCategoryStyle } from "@/lib/category-style";
import { cleanMerchantName, initialOf } from "@/lib/dashboard-metrics";
import { dbDateToInputValue, formatDayMonth, formatLongDay } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";

export type RecentExpense = {
  id: number;
  amount: number;
  date: Date | string;
  description: string | null;
  accountId: number;
  categoryId: number | null;
  categoryName: string | null;
  accountName: string;
};

type RecentExpensesProps = {
  expenses: RecentExpense[];
  accounts: { id: number; name: string; type: string }[];
  categories: { id: number; name: string }[];
  className?: string;
};

/** Datos de presentacion de un gasto: nombre limpio, subtitulo y tile */
export function describeExpense(expense: RecentExpense) {
  const { name, aggregator } = cleanMerchantName(expense.description);
  const style = getCategoryStyle(expense.categoryName);
  return {
    name,
    subtitle: aggregator ? `${expense.accountName} · ${aggregator}` : expense.accountName,
    // TODO: los gastos todavia no traen categoria (category_id vacio); hasta
    // que se capture, el tile cae al gris con la inicial del comercio.
    tile: <CategoryTile color={style.color} icon={style.icon} label={initialOf(name)} />,
    day: dbDateToInputValue(expense.date),
  };
}

/** Agrupa gastos ya ordenados por fecha en dias consecutivos */
export function groupByDay<T extends { date: Date | string }>(items: T[]) {
  const groups: { day: string; items: T[] }[] = [];
  for (const item of items) {
    const day = dbDateToInputValue(item.date);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(item);
    else groups.push({ day, items: [item] });
  }
  return groups;
}

export function expenseForEdit(expense: RecentExpense) {
  return {
    id: expense.id,
    amount: expense.amount,
    date: typeof expense.date === "string" ? expense.date : expense.date.toISOString(),
    description: expense.description,
    accountId: expense.accountId,
    categoryId: expense.categoryId,
  };
}

/** Escritorio: tarjeta "Recientes" con los ultimos 5 gastos agrupados por dia */
export function RecentExpensesCard({ expenses, accounts, categories, className }: RecentExpensesProps) {
  const router = useRouter();
  const groups = groupByDay(expenses);

  return (
    <EbCard className={cn("flex flex-col overflow-hidden", className)}>
      <div className="flex items-center justify-between px-6 pt-[22px] pb-2">
        <h2 className="m-0 text-[20px] font-bold tracking-[-0.02em]">Recientes</h2>
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
            <div key={group.day} className="flex flex-1 flex-col">
              <div className="text-eb-text-tertiary px-6 pt-1 pb-1.5 text-[12px] font-semibold tracking-[0.04em] uppercase">
                {formatLongDay(group.day)}
              </div>
              <GroupedList className="flex-1">
                {group.items.map((expense) => {
                  const info = describeExpense(expense);
                  return (
                    <ListRow
                      key={expense.id}
                      stretch
                      leading={info.tile}
                      title={info.name}
                      subtitle={info.subtitle}
                      trailing={
                        <Money value={expense.amount} sign="negative" className="text-[15px] font-semibold" />
                      }
                      actions={
                        <>
                          <EditExpenseModal
                            expense={expenseForEdit(expense)}
                            accounts={accounts}
                            categories={categories}
                            onSuccess={() => router.refresh()}
                            trigger={
                              <button
                                type="button"
                                aria-label={`Editar ${info.name}`}
                                className="text-eb-text-muted flex size-[30px] items-center justify-center rounded-[9px] bg-[var(--eb-glass-strong)]"
                              >
                                <PencilIcon size={14} strokeWidth={2} />
                              </button>
                            }
                          />
                          <DeleteExpenseButton
                            expenseId={expense.id}
                            description={expense.description}
                            onSuccess={() => router.refresh()}
                            trigger={
                              <button
                                type="button"
                                aria-label={`Eliminar ${info.name}`}
                                className="text-eb-red flex size-[30px] items-center justify-center rounded-[9px] bg-[rgba(255,105,97,0.14)]"
                              >
                                <Trash2Icon size={14} strokeWidth={2} />
                              </button>
                            }
                          />
                        </>
                      }
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

  function done() {
    setOpenId(null);
    router.refresh();
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="m-0 text-[20px] font-bold tracking-[-0.02em]">Recientes</h2>
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
            {expenses.map((expense) => {
              const info = describeExpense(expense);
              return (
                <SwipeRow
                  key={expense.id}
                  open={openId === expense.id}
                  onOpenChange={(open) => setOpenId(open ? expense.id : null)}
                  actions={[
                    <EditExpenseModal
                      key="edit"
                      expense={expenseForEdit(expense)}
                      accounts={accounts}
                      categories={categories}
                      onSuccess={done}
                      trigger={
                        <SwipeAction
                          label="Editar"
                          tone="neutral"
                          icon={<PencilIcon size={18} strokeWidth={2} aria-hidden="true" />}
                        />
                      }
                    />,
                    <DeleteExpenseButton
                      key="delete"
                      expenseId={expense.id}
                      description={expense.description}
                      onSuccess={done}
                      trigger={
                        <SwipeAction
                          label="Borrar"
                          tone="destructive"
                          icon={<Trash2Icon size={18} strokeWidth={2} aria-hidden="true" />}
                        />
                      }
                    />,
                  ]}
                >
                  <ListRow
                    density="mobile"
                    static
                    leading={info.tile}
                    title={info.name}
                    subtitle={`${expense.accountName} · ${formatDayMonth(info.day)}`}
                    trailing={
                      <Money value={expense.amount} sign="negative" className="text-[16px] font-semibold" />
                    }
                  />
                </SwipeRow>
              );
            })}
          </GroupedList>
        )}
      </EbCard>
    </section>
  );
}
