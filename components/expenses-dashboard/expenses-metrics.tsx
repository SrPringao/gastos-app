import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/dates";
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
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Gastado este mes
          </CardTitle>
          <TrendingDownIcon className="text-muted-foreground size-5 opacity-70" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tracking-tight">
            {formatCurrency(totalSpent)}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">{monthLabel}</p>
        </CardContent>
      </Card>
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Transacciones
          </CardTitle>
          <ReceiptIcon className="text-muted-foreground size-5 opacity-70" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tracking-tight">{countThisMonth}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Este mes
          </p>
        </CardContent>
      </Card>
      <Card className="h-full sm:col-span-2 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Promedio por transaccion
          </CardTitle>
          <WalletIcon className="text-muted-foreground size-5 opacity-70" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tracking-tight">
            {countThisMonth > 0
              ? formatCurrency(Math.round(totalSpent / countThisMonth))
              : formatCurrency(0)}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Este mes
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
