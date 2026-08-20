import { MetricsCard } from "@/components/dashboard/metrics-card";
import { ReceiptIcon, TrendingDownIcon, WalletIcon } from "lucide-react";

type ExpensesMetricsProps = {
  totalSpent: number;
  countThisMonth: number;
  monthLabel: string;
};

export function ExpensesMetrics({
  totalSpent,
  countThisMonth,
  monthLabel,
}: ExpensesMetricsProps) {
  const averagePerTransaction =
    countThisMonth > 0 ? Math.round(totalSpent / countThisMonth) : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <MetricsCard
        title="Gastado este mes"
        value={totalSpent}
        subtitle={monthLabel}
        formatAsCurrency
        icon={<TrendingDownIcon className="size-4" />}
        featured
      />
      <MetricsCard
        title="Transacciones"
        value={countThisMonth}
        subtitle="Este mes"
        icon={<ReceiptIcon className="size-4" />}
      />
      <div className="sm:col-span-2 lg:col-span-1">
        <MetricsCard
          title="Promedio por transaccion"
          value={averagePerTransaction}
          subtitle="Este mes"
          formatAsCurrency
          icon={<WalletIcon className="size-4" />}
        />
      </div>
    </div>
  );
}
