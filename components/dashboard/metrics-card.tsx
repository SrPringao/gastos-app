import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/dates";

type MetricsCardProps = {
  title: string;
  value: number;
  subtitle?: string;
  icon?: React.ReactNode;
  formatAsCurrency?: boolean;
  /** Metrica protagonista del dashboard: lleva el glow degradado de marca detras */
  featured?: boolean;
};

export function MetricsCard({
  title,
  value,
  subtitle,
  icon,
  formatAsCurrency = false,
  featured = false,
}: MetricsCardProps) {
  const displayValue = formatAsCurrency ? formatCurrency(value) : String(value);

  return (
    <Card className="relative h-full overflow-hidden">
      {featured && (
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full opacity-[0.15] blur-3xl"
          style={{ background: "var(--gradient-signal)" }}
        />
      )}
      <CardContent className="relative flex h-full flex-col justify-between gap-4">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {title}
          </p>
          {icon && (
            <div className="bg-secondary text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
              {icon}
            </div>
          )}
        </div>
        <div>
          <div className="font-figures text-3xl font-medium tracking-tight sm:text-[2rem]">
            {displayValue}
          </div>
          {subtitle && (
            <p className="text-muted-foreground mt-1.5 text-sm">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
