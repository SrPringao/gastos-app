"use client";

import { EbCard } from "@/components/ui/eb/card";
import { Money } from "@/components/ui/eb/money";
import { CategoryTile } from "@/components/ui/eb/category-tile";
import { EditExpenseModal } from "@/components/edit-expense-modal";
import {
  describeExpense,
  expenseForEdit,
  type EditOptions,
  type ExpenseItem,
} from "@/components/expenses/expense-row";
import { getCategoryStyle } from "@/lib/category-style";
import { initialOf } from "@/lib/dashboard-metrics";
import type { MonthStats } from "@/lib/expenses-metrics";
import { formatMoney } from "@/lib/utils/money";
import { formatDayMonth } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";

type Variant = "desktop" | "mobile";

/** Barra de 8px de gastado / presupuesto con su fila de texto */
function BudgetBar({ spent, budget }: { spent: number; budget: number | null }) {
  if (!budget || budget <= 0) {
    return <p className="text-eb-text-tertiary text-[13px]">Sin presupuesto definido</p>;
  }
  const ratio = spent / budget;
  const over = ratio > 1;
  return (
    <div className="flex flex-col gap-2">
      <div
        role="img"
        aria-label={`${Math.round(ratio * 100)} % del presupuesto usado`}
        className="h-2 rounded-[4px] p-0.5"
        style={{ background: "var(--eb-track)", boxShadow: "var(--eb-track-shadow)" }}
      >
        <div
          className="h-full rounded-[2px]"
          style={{
            width: `${Math.min(ratio, 1) * 100}%`,
            background: over
              ? "linear-gradient(90deg, #FF9F0A, #FF453A)"
              : "linear-gradient(90deg, var(--eb-accent-light), var(--eb-accent))",
            boxShadow: over ? "0 0 10px rgba(255,69,58,0.45)" : "0 0 10px var(--eb-accent-glow)",
          }}
        />
      </div>
      <div className="text-eb-text-tertiary flex justify-between gap-2 text-[13px]">
        <span>
          {Math.round(ratio * 100)}% de {formatMoney(budget, { cents: false })}
        </span>
        {over ? (
          <span className="text-eb-orange">Te pasaste por {formatMoney(spent - budget, { cents: false })}</span>
        ) : (
          <span>Quedan {formatMoney(budget - spent, { cents: false })}</span>
        )}
      </div>
    </div>
  );
}

export function SpentKpi({
  monthLabel,
  stats,
  budget,
  variant = "desktop",
  className,
}: {
  monthLabel: string;
  stats: MonthStats;
  budget: number | null;
  variant?: Variant;
  className?: string;
}) {
  const desktop = variant === "desktop";
  return (
    <EbCard
      variant="hero"
      size={desktop ? "desktop" : "mobile"}
      className={cn("flex flex-col justify-between", desktop ? "gap-[18px] p-6" : "gap-4 p-5", className)}
    >
      <div className={cn("flex flex-col", desktop ? "gap-2" : "gap-1")}>
        <div className={cn("text-eb-text-secondary text-[15px]", desktop && "font-medium")}>
          Gastado en {monthLabel.toLocaleLowerCase("es-MX")}
        </div>
        <Money value={stats.total} size="hero-mobile" />
      </div>
      <BudgetBar spent={stats.total} budget={budget} />
    </EbCard>
  );
}

export function TransactionsKpi({
  stats,
  variant = "desktop",
  className,
}: {
  stats: MonthStats;
  variant?: Variant;
  className?: string;
}) {
  if (variant === "mobile") {
    return (
      <EbCard size="mobile" className={cn("flex flex-col gap-[14px] p-4", className)}>
        <div className="text-eb-text-secondary text-[13px] font-semibold">Transacciones</div>
        <div className="eb-rounded text-[34px] leading-none font-bold tracking-[-0.02em]">{stats.count}</div>
        <div className="text-eb-text-tertiary flex flex-col gap-0.5 text-[12px]">
          <span>
            Promedio <b className="text-eb-text font-semibold">{formatMoney(stats.average, { cents: false })}</b>
          </span>
          <span>
            Por día <b className="text-eb-text font-semibold">{formatMoney(stats.perDay, { cents: false })}</b>
          </span>
        </div>
      </EbCard>
    );
  }
  return (
    <EbCard className={cn("flex flex-col justify-between gap-[18px] p-6", className)}>
      <div className="flex flex-col gap-2">
        <div className="text-eb-text-secondary text-[15px] font-medium">Transacciones</div>
        <div className="eb-rounded text-eb-text-strong text-[44px] leading-none font-bold tracking-[-0.03em]">
          {stats.count}
        </div>
      </div>
      <div className="border-eb-separator grid grid-cols-2 gap-3 border-t pt-3">
        {[
          { label: "Promedio", value: stats.average },
          { label: "Por día", value: stats.perDay },
        ].map((item) => (
          <div key={item.label} className="flex flex-col gap-0.5">
            <span className="text-eb-text-tertiary text-[12px]">{item.label}</span>
            <Money value={item.value} className="text-[16px] font-semibold" />
          </div>
        ))}
      </div>
    </EbCard>
  );
}

/** Mayor gasto del mes; clic abre ese gasto en el modal de edicion */
export function LargestKpi({
  stats,
  edit,
  variant = "desktop",
  className,
}: {
  stats: MonthStats;
  edit: EditOptions;
  variant?: Variant;
  className?: string;
}) {
  const largest = stats.largest;
  const desktop = variant === "desktop";

  if (!largest) {
    return (
      <EbCard
        size={desktop ? "desktop" : "mobile"}
        className={cn("flex flex-col gap-2", desktop ? "p-6" : "p-4", className)}
      >
        <div className={cn("text-eb-text-secondary", desktop ? "text-[15px] font-medium" : "text-[13px] font-semibold")}>
          Mayor gasto
        </div>
        <p className="text-eb-text-tertiary text-[13px]">Sin gastos este mes.</p>
      </EbCard>
    );
  }

  const expense: ExpenseItem = largest.expense;
  const info = describeExpense(expense);
  const style = getCategoryStyle(expense.categoryName);
  const share = `${Math.round(largest.share)}% del mes`;

  const trigger = desktop ? (
    <button
      type="button"
      aria-label={`Editar mayor gasto: ${info.name}`}
      className={cn(
        "eb-card flex flex-col justify-between gap-[18px] rounded-[26px] p-6 text-left transition-[filter] hover:brightness-110",
        className
      )}
    >
      <div className="flex flex-col gap-2">
        <div className="text-eb-text-secondary text-[15px] font-medium">Mayor gasto</div>
        <Money value={expense.amount} size="hero-mobile" />
      </div>
      <div className="border-eb-separator flex w-full items-center gap-3 border-t pt-3">
        <CategoryTile color={style.color} icon={style.icon} label={initialOf(info.name)} size={32} />
        <div className="flex min-w-0 flex-1 flex-col gap-px">
          <span className="truncate text-[14px] font-medium">{info.name}</span>
          <span className="text-eb-text-tertiary text-[12px]">
            {formatDayMonth(info.day)} · {share}
          </span>
        </div>
      </div>
    </button>
  ) : (
    <button
      type="button"
      aria-label={`Editar mayor gasto: ${info.name}`}
      className={cn("eb-card eb-card--sm flex flex-col gap-[14px] rounded-[24px] p-4 text-left", className)}
    >
      <div className="flex w-full items-start justify-between">
        <div className="text-eb-text-secondary text-[13px] font-semibold">Mayor gasto</div>
        <CategoryTile color={style.color} icon={style.icon} label={initialOf(info.name)} size={28} />
      </div>
      <Money
        value={expense.amount}
        cents={false}
        className="eb-rounded text-[34px] leading-none font-bold tracking-[-0.02em]"
      />
      <div className="text-eb-text-tertiary flex w-full flex-col gap-0.5 text-[12px]">
        <span className="text-eb-text truncate">{info.name}</span>
        <span>{share}</span>
      </div>
    </button>
  );

  return (
    <EditExpenseModal
      expense={expenseForEdit(expense)}
      accounts={edit.accounts}
      categories={edit.categories}
      onSuccess={edit.onChanged}
      trigger={trigger}
    />
  );
}
