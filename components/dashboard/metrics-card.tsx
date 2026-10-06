import { Card, CardContent } from "@/components/ui/card";
import { Money } from "@/components/ui/eb/money";
import { cn } from "@/lib/utils";

type MetricsCardProps = {
  title: string;
  value: number;
  subtitle?: string;
  icon?: React.ReactNode;
  formatAsCurrency?: boolean;
  /** Metrica protagonista: lleva el tinte indigo de la tarjeta heroe */
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
  return (
    <Card className={cn("relative h-full", featured && "eb-card--hero")}>
      <CardContent className="relative flex h-full flex-col justify-between gap-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-eb-text-secondary min-w-0 truncate text-[15px] font-medium">{title}</p>
          {icon && (
            <div
              aria-hidden="true"
              className="text-eb-text-tertiary flex size-8 shrink-0 items-center justify-center rounded-full"
              style={{ background: "var(--eb-glass-strong)" }}
            >
              {icon}
            </div>
          )}
        </div>
        <div>
          {formatAsCurrency ? (
            <Money
              value={value}
              splitCents
              className="eb-rounded text-[34px] leading-none font-bold tracking-[-0.03em]"
            />
          ) : (
            <div className="eb-rounded text-[34px] leading-none font-bold tracking-[-0.03em] tabular-nums">
              {value}
            </div>
          )}
          {subtitle && <p className="text-eb-text-tertiary mt-1.5 text-[13px]">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
