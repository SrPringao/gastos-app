import { AlertTriangleIcon, XCircleIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils/dates";

type BudgetAlertProps = {
  totalSpentCents: number;
  monthlyBudgetCents: number | null;
  monthLabel: string;
};

export function BudgetAlert({
  totalSpentCents,
  monthlyBudgetCents,
  monthLabel,
}: BudgetAlertProps) {
  if (!monthlyBudgetCents || monthlyBudgetCents <= 0) return null;

  const pct = (totalSpentCents / monthlyBudgetCents) * 100;

  if (pct < 80) return null;

  const exceeded = pct >= 100;
  const remaining = monthlyBudgetCents - totalSpentCents;

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-4 ${
        exceeded
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
      }`}
    >
      <div className="mt-0.5 shrink-0">
        {exceeded ? (
          <XCircleIcon className="size-5" />
        ) : (
          <AlertTriangleIcon className="size-5" />
        )}
      </div>
      <div className="min-w-0">
        <p className="font-semibold">
          {exceeded
            ? `Presupuesto superado en ${monthLabel}`
            : `Cerca del límite de presupuesto (${Math.round(pct)}%)`}
        </p>
        <p className="mt-0.5 text-sm opacity-80">
          {exceeded
            ? `Llevas ${formatCurrency(totalSpentCents)} de ${formatCurrency(monthlyBudgetCents)} — excediste por ${formatCurrency(Math.abs(remaining))}.`
            : `Llevas ${formatCurrency(totalSpentCents)} de ${formatCurrency(monthlyBudgetCents)} — te quedan ${formatCurrency(remaining)}.`}
        </p>
      </div>
    </div>
  );
}
