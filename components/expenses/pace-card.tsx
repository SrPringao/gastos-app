"use client";

import { useId } from "react";
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { EbCard } from "@/components/ui/eb/card";
import type { Pace } from "@/lib/expenses-metrics";
import { formatMoney } from "@/lib/utils/money";
import { formatDayMonth } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";

type Variant = "desktop" | "mobile";

/** Aviso naranja (arriba del ritmo) o verde (debajo) — seccion B.2.5 */
function PaceNotice({ pace, variant }: { pace: Pace; variant: Variant }) {
  if (pace.budget === null || pace.difference === null) {
    return (
      <p className="text-eb-text-tertiary text-[13px]">Define un presupuesto para comparar tu ritmo.</p>
    );
  }
  const above = pace.difference > 0;
  const amount = formatMoney(Math.abs(pace.difference), { cents: false });
  const Icon = above ? TrendingUpIcon : TrendingDownIcon;
  const color = above ? "#FF9F0A" : "#30D158";

  let headline: string;
  let detail: string;
  if (pace.isPast) {
    const final = pace.spent - pace.budget;
    headline = `Terminaste ${formatMoney(Math.abs(final), { cents: false })} ${final > 0 ? "arriba" : "debajo"} del presupuesto.`;
    detail = "";
  } else {
    headline = `${amount} ${above ? "arriba" : "debajo"} del ritmo.`;
    const perDay = pace.perDayLeft !== null ? formatMoney(pace.perDayLeft, { cents: false }) : null;
    if (!perDay) detail = "Ya no queda presupuesto este mes.";
    else if (above)
      detail =
        variant === "desktop"
          ? `Te quedan ≈ ${perDay} al día los ${pace.daysLeft} días que faltan.`
          : `≈ ${perDay} al día los ${pace.daysLeft} días que faltan.`;
    else detail = `Puedes gastar ≈ ${perDay} al día.`;
  }
  const overFinal = pace.isPast && pace.spent > pace.budget;
  const tone = pace.isPast ? (overFinal ? "#FF9F0A" : "#30D158") : color;

  return (
    <div
      className="flex items-center gap-2.5 rounded-[14px] px-3 py-2.5"
      style={{
        background: tone === "#FF9F0A" ? "rgba(255,159,10,0.1)" : "rgba(48,209,88,0.1)",
        boxShadow: `inset 0 0 0 1px ${tone === "#FF9F0A" ? "rgba(255,159,10,0.18)" : "rgba(48,209,88,0.18)"}`,
      }}
    >
      <Icon size={18} strokeWidth={2} color={tone} className="flex-none" aria-hidden="true" />
      <div className="text-eb-text-muted text-[13px] leading-[1.35]">
        <b style={{ color: tone }}>{headline}</b> {detail}
      </div>
    </div>
  );
}

export function PaceCard({
  pace,
  monthKey,
  variant = "desktop",
  className,
}: {
  pace: Pace;
  monthKey: string;
  variant?: Variant;
  className?: string;
}) {
  const desktop = variant === "desktop";
  const id = useId().replace(/:/g, "");
  const W = 400;
  const H = 200;
  const days = pace.daysInMonth;
  const max = Math.max(pace.axisMax, 1);
  const x = (day: number) => ((day - 1) / Math.max(days - 1, 1)) * W;
  const y = (value: number) => H - (value / max) * H;

  const points = pace.cumulative.map((p) => `${x(p.day).toFixed(2)},${y(p.total).toFixed(2)}`);
  const line = points.length > 0 ? `M${points.join(" L")}` : "";
  const lastPoint = pace.cumulative[pace.cumulative.length - 1];
  const area =
    points.length > 0 && lastPoint ? `${line} L${x(lastPoint.day).toFixed(2)},${H} L0,${H} Z` : "";
  const budgetY = pace.budget !== null ? y(pace.budget) : null;

  // Punto de hoy (HTML para que no se deforme con preserveAspectRatio="none")
  const today = pace.todayDay !== null && lastPoint ? lastPoint : null;
  const todayLeft = today ? (x(today.day) / W) * 100 : 0;
  const todayTop = today ? (y(today.total) / H) * 100 : 0;
  // Etiqueta del ritmo ideal, sobre la diagonal en el ~30% del mes
  const idealLabelDay = Math.max(2, Math.round(days * 0.3));
  const idealLabelLeft = (x(idealLabelDay) / W) * 100;
  const idealLabelTop = pace.budget !== null ? (y((pace.budget * idealLabelDay) / days) / H) * 100 : 0;

  const firstDay = formatDayMonth(`${monthKey}-01`);
  const lastDay = formatDayMonth(`${monthKey}-${String(days).padStart(2, "0")}`);

  return (
    <EbCard
      size={desktop ? "desktop" : "mobile"}
      className={cn("flex flex-col", desktop ? "gap-4 px-6 pt-6 pb-5" : "gap-[14px] px-4 pt-5 pb-4", className)}
    >
      <div className="flex flex-col gap-1">
        <h2 className="eb-card-title m-0">Ritmo del mes</h2>
        {desktop && <div className="text-eb-text-tertiary text-[13px]">Acumulado contra tu presupuesto</div>}
      </div>

      <PaceNotice pace={pace} variant={variant} />

      <div
        className={cn("relative", desktop ? "min-h-[170px] flex-1" : "h-[130px]")}
        role="img"
        aria-label={`Acumulado ${formatMoney(pace.spent)}${pace.budget !== null ? ` de un presupuesto de ${formatMoney(pace.budget, { cents: false })}` : ""}`}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--eb-accent)" stopOpacity="0.35" />
              <stop offset="1" stopColor="var(--eb-accent)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${id}-line`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="var(--eb-accent)" />
              <stop offset="1" stopColor="var(--eb-accent-light)" />
            </linearGradient>
          </defs>
          {budgetY !== null && (
            <>
              <line
                x1="0"
                y1={budgetY}
                x2={W}
                y2={budgetY}
                stroke="rgba(255,105,97,0.55)"
                strokeWidth="1.5"
                strokeDasharray="5 5"
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1="0"
                y1={H}
                x2={W}
                y2={budgetY}
                stroke="var(--eb-chart-empty-past)"
                strokeWidth="1"
                strokeDasharray="2 4"
                vectorEffect="non-scaling-stroke"
              />
            </>
          )}
          <line x1="0" y1={H} x2={W} y2={H} stroke="var(--eb-chart-base)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          {area && <path d={area} fill={`url(#${id}-area)`} />}
          {line && (
            <path
              d={line}
              fill="none"
              stroke={`url(#${id}-line)`}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {today && (
          <>
            <div
              className="absolute rounded-full bg-white"
              style={{
                left: `${todayLeft}%`,
                top: `${todayTop}%`,
                width: desktop ? 12 : 10,
                height: desktop ? 12 : 10,
                margin: desktop ? "-6px 0 0 -6px" : "-5px 0 0 -5px",
                boxShadow: `0 0 0 3px var(--eb-accent), 0 0 ${desktop ? 14 : 12}px var(--eb-accent-glow)`,
              }}
            />
            <div
              className="absolute text-[12px] font-semibold whitespace-nowrap tabular-nums"
              style={{
                top: `calc(${todayTop}% - ${desktop ? 30 : 26}px)`,
                // Cerca del borde derecho la etiqueta se voltea a la izquierda del punto
                ...(todayLeft > 60
                  ? { right: `calc(${100 - todayLeft}% + 14px)` }
                  : { left: `calc(${todayLeft}% + ${desktop ? 14 : 12}px)` }),
              }}
            >
              {formatMoney(today.total)}
              {desktop && <span className="text-eb-text-tertiary font-normal"> hoy</span>}
            </div>
          </>
        )}

        {pace.budget !== null && budgetY !== null && (
          <>
            <div
              className="absolute right-0 -translate-y-[120%] text-[#FF8E88]"
              style={{ top: `${(budgetY / H) * 100}%`, fontSize: desktop ? 11 : 10 }}
            >
              Presupuesto {formatMoney(pace.budget, { cents: false })}
            </div>
            <div
              className="text-eb-text-tertiary absolute whitespace-nowrap"
              style={{
                left: `${idealLabelLeft}%`,
                top: `calc(${idealLabelTop}% + 8px)`,
                fontSize: desktop ? 11 : 10,
              }}
            >
              Ritmo ideal
              {desktop && pace.idealToday !== null && !pace.isPast
                ? ` · hoy ${formatMoney(pace.idealToday, { cents: false })}`
                : ""}
            </div>
          </>
        )}
      </div>

      <div className="text-eb-text-tertiary flex justify-between" style={{ fontSize: desktop ? 11 : 10 }}>
        <span>{firstDay}</span>
        <span>15</span>
        <span>{lastDay}</span>
      </div>
    </EbCard>
  );
}
