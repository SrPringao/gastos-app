"use client";

import { PencilIcon, Trash2Icon } from "lucide-react";
import { Money } from "@/components/ui/eb/money";
import { CategoryTile } from "@/components/ui/eb/category-tile";
import { ListRow } from "@/components/ui/eb/grouped-list";
import { SwipeAction, SwipeRow } from "@/components/ui/eb/swipe-row";
import { EditExpenseModal } from "@/components/edit-expense-modal";
import { DeleteExpenseButton } from "@/components/delete-expense-button";
import { getCategoryStyle } from "@/lib/category-style";
import { cleanMerchantName, initialOf } from "@/lib/dashboard-metrics";
import { dbDateToInputValue } from "@/lib/utils/dates";

export type ExpenseItem = {
  id: number;
  amount: number;
  date: Date | string;
  description: string | null;
  accountId: number;
  categoryId: number | null;
  categoryName: string | null;
  accountName: string;
};

export type EditOptions = {
  accounts: { id: number; name: string; type: string; archived?: boolean }[];
  categories: { id: number; name: string }[];
  onChanged: () => void;
};

/** Datos de presentacion de un gasto: nombre limpio, agregador, tile y dia */
export function describeExpense(expense: ExpenseItem, tileSize: 36 | 30 = 36) {
  const { name, aggregator } = cleanMerchantName(expense.description);
  const style = getCategoryStyle(expense.categoryName);
  return {
    name,
    aggregator,
    // TODO: los gastos todavia no traen categoria (category_id vacio); hasta
    // que se capture, el tile cae al gris con la inicial del comercio.
    tile: <CategoryTile color={style.color} icon={style.icon} label={initialOf(name)} size={tileSize} />,
    day: dbDateToInputValue(expense.date),
  };
}

export function expenseForEdit(expense: ExpenseItem) {
  return {
    id: expense.id,
    amount: expense.amount,
    date: typeof expense.date === "string" ? expense.date : expense.date.toISOString(),
    description: expense.description,
    accountId: expense.accountId,
    categoryId: expense.categoryId,
  };
}

/** Escritorio: fila con editar/borrar que solo aparecen con hover */
export function ExpenseRow({
  expense,
  subtitle,
  stretch = false,
  edit,
}: {
  expense: ExpenseItem;
  subtitle: string;
  stretch?: boolean;
  edit: EditOptions;
}) {
  const info = describeExpense(expense);
  return (
    <ListRow
      stretch={stretch}
      leading={info.tile}
      title={info.name}
      subtitle={subtitle}
      trailing={
        <Money
          value={expense.amount}
          sign="negative"
          className="inline-block min-w-[96px] text-right text-[15px] font-semibold"
        />
      }
      actions={
        <div className="flex items-center gap-1.5">
          <EditExpenseModal
            expense={expenseForEdit(expense)}
            accounts={edit.accounts}
            categories={edit.categories}
            onSuccess={edit.onChanged}
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
            onSuccess={edit.onChanged}
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
        </div>
      }
    />
  );
}

/** Movil: fila con swipe a la izquierda para Editar / Borrar */
export function SwipeExpenseRow({
  expense,
  subtitle,
  open,
  onOpenChange,
  edit,
}: {
  expense: ExpenseItem;
  subtitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  edit: EditOptions;
}) {
  const info = describeExpense(expense);
  return (
    <SwipeRow
      open={open}
      onOpenChange={onOpenChange}
      actions={[
        <EditExpenseModal
          key="edit"
          expense={expenseForEdit(expense)}
          accounts={edit.accounts}
          categories={edit.categories}
          onSuccess={edit.onChanged}
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
          onSuccess={edit.onChanged}
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
        subtitle={subtitle}
        trailing={<Money value={expense.amount} sign="negative" className="text-[16px] font-semibold" />}
      />
    </SwipeRow>
  );
}
