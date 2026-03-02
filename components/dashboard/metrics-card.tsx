import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/dates";

type MetricsCardProps = {
  title: string;
  value: number;
  subtitle?: string;
  icon?: React.ReactNode;
  formatAsCurrency?: boolean;
};

export function MetricsCard({ title, value, subtitle, icon, formatAsCurrency = false }: MetricsCardProps) {
  const displayValue = formatAsCurrency ? formatCurrency(value) : String(value);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-muted-foreground opacity-70">{icon}</div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{displayValue}</div>
        {subtitle && (
          <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
