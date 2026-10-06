"use client";

import { useState } from "react";
import { EbCard } from "@/components/ui/eb/card";
import { SEGMENT_DOT_COLORS, SEGMENT_STYLES } from "@/components/ui/eb/tones";
import { shortAccountName, type DailySeries, type DayPoint } from "@/lib/expenses-metrics";
import { formatMoney } from "@/lib/utils/money";
import { formatDayMonth } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";

type Variant = "desktop" | "mobile";

const SPEC = {
  desktop: { height: 210, gap: 4, axisGap: 44, axisWidth: 38, axisFont: 11, topRadius: "3px 3px 2px 2px", radius: 2 },
  mobile: { height: 150, gap: 3, axisGap: 30, axisWidth: 26, axisFont: 10, topRadius: "2px 2px 1px 1px", radius: 1 },
} as const;

/** "JUE 1 OCT" (en mayusculas por CSS) */
function shortDayLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d, 12))
    .toLocaleDateString("es-MX", { weekday: "short", timeZone: "UTC" })
    .replace(".", "");
  return `${weekday} ${formatDayMonth(date)}`;
}

function tooltipShift(index: number, count: number): string {
  const position = (index + 0.5) / count;
  if (position < 0.2) return "-12px";
  if (position > 0.8) return "calc(-100% + 12px)";
  return "-50%";
}

/** $6k / 6k / $600 */
function axisLabel(cents: number, withSign: boolean): string {
  const pesos = Math.round(cents / 100);
  const text = pesos >= 1000 ? `${+(pesos / 1000).toFixed(1)}k` : String(pesos);
  return withSign ? `$${text}` : text;
}

/**
 * Etiquetas del eje X: 1, 15, 22, ultimo dia, "Hoy" y el dia seleccionado.
 * Las que caen a menos de 3 columnas de otra con mas prioridad se omiten.
 */
function xLabels(days: DayPoint[], selected: string | null) {
  const last = days.length;
  const today = days.find((d) => d.isToday)?.day ?? null;
  const selectedDay = selected ? Number(selected.slice(8, 10)) : null;
  const candidates: { day: number; text: string; kind: "today" | "selected" | "plain" }[] = [];
  if (today) candidates.push({ day: today, text: "Hoy", kind: "today" });
  if (selectedDay && selectedDay !== today) {
    candidates.push({ day: selectedDay, text: String(selectedDay), kind: "selected" });
  }
  for (const day of [1, 15, 22, last]) {
    candidates.push({ day, text: String(day), kind: day === selectedDay ? "selected" : "plain" });
  }
  const placed: typeof candidates = [];
  for (const c of candidates) {
    if (placed.some((p) => p.day === c.day || Math.abs(p.day - c.day) < 3)) continue;
    placed.push(c);
  }
  return placed;
}

export function DailySpendCard({
  series,
  selected,
  onSelect,
  variant = "desktop",
  className,
}: {
  series: DailySeries;
  /** Dia seleccionado (YYYY-MM-DD) */
  selected: string | null;
  onSelect: (date: string) => void;
  variant?: Variant;
  className?: string;
}) {
  const spec = SPEC[variant];
  const desktop = variant === "desktop";
  const [hovered, setHovered] = useState<number | null>(null);
  const selectedPoint = series.days.find((d) => d.date === selected) ?? null;
  const axisMax = Math.max(series.axisMax, 1);
  const columns = `repeat(${series.days.length}, minmax(0, 1fr))`;
  const hoveredPoint = hovered !== null ? series.days[hovered] : null;

  return (
    <EbCard
      size={desktop ? "desktop" : "mobile"}
      className={cn("flex flex-col", desktop ? "gap-[18px] px-6 pt-6 pb-5" : "gap-[14px] px-4 pt-5 pb-4", className)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="eb-card-title m-0">{desktop ? "Gasto por día" : "Por día"}</h2>
          {desktop && <div className="text-eb-text-tertiary text-[13px]">Toca un día para ver sus gastos</div>}
        </div>
        {selectedPoint && (
          <div
            className={cn("flex flex-col items-end", desktop ? "eb-well gap-0.5 rounded-[12px] px-3 py-2" : "gap-px")}
            aria-live="polite"
          >
            <span className="text-eb-text-tertiary text-[11px] font-semibold tracking-[0.04em] uppercase">
              {shortDayLabel(selectedPoint.date)}
            </span>
            <span className={cn("eb-rounded font-bold", desktop ? "text-[18px]" : "text-[17px]")}>
              {formatMoney(selectedPoint.total)}
            </span>
          </div>
        )}
      </div>

      <div className="relative" style={{ height: spec.height }}>
        {/* Gridlines: 3 punteadas + base solida */}
        <div className="absolute inset-0 flex flex-col justify-between" style={{ right: spec.axisGap }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ borderTop: "1px dashed var(--eb-chart-grid)" }} />
          ))}
          <div style={{ borderTop: "1px solid var(--eb-chart-base)" }} />
        </div>
        {/* Eje Y a la derecha */}
        <div
          aria-hidden="true"
          className="text-eb-text-tertiary absolute top-0 right-0 bottom-0 flex -translate-y-1.5 flex-col justify-between"
          style={{ width: spec.axisWidth, fontSize: spec.axisFont }}
        >
          {[3, 2, 1, 0].map((step) => (
            <span key={step}>{axisLabel((axisMax / 3) * step, desktop)}</span>
          ))}
        </div>
        {/* Columnas */}
        <div
          className="absolute inset-0 grid items-end"
          style={{ right: spec.axisGap, gridTemplateColumns: columns, gap: spec.gap }}
          onMouseLeave={() => setHovered(null)}
        >
          {series.days.map((point, index) => {
            const isSelected = point.date === selected;
            const empty = point.total === 0;
            return (
              <button
                key={point.date}
                type="button"
                disabled={point.isFuture && empty}
                onClick={() => onSelect(point.date)}
                onMouseEnter={() => setHovered(index)}
                onFocus={() => setHovered(index)}
                onBlur={() => setHovered(null)}
                aria-pressed={isSelected}
                aria-label={`${shortDayLabel(point.date)}: ${empty ? "sin gastos" : formatMoney(point.total)}`}
                className="flex h-full min-w-0 flex-col justify-end gap-px outline-none focus-visible:ring-2 focus-visible:ring-[var(--eb-accent)]"
                style={{
                  borderRadius: desktop ? 4 : 3,
                  ...(isSelected
                    ? {
                        background: "var(--eb-chart-selected-bg)",
                        boxShadow: "inset 0 0 0 1px var(--eb-chart-selected-ring)",
                        padding: "0 2px",
                      }
                    : null),
                }}
              >
                {empty ? (
                  <div
                    style={{
                      height: 3,
                      borderRadius: spec.radius,
                      background: point.isFuture ? "var(--eb-chart-empty-future)" : "var(--eb-chart-empty-past)",
                    }}
                  />
                ) : (
                  // Los segmentos vienen de abajo hacia arriba; en el DOM van de arriba hacia abajo
                  [...point.segments].reverse().map((segment, i) => {
                    const style = SEGMENT_STYLES[segment.tone];
                    return (
                      <div
                        key={segment.key}
                        className="eb-anim"
                        style={{
                          height: `${(segment.total / axisMax) * 100}%`,
                          minHeight: 3,
                          borderRadius: i === 0 ? spec.topRadius : spec.radius,
                          background: style.background,
                          boxShadow: isSelected && segment.tone === "accent" ? "0 0 14px var(--eb-accent-glow)" : undefined,
                        }}
                      />
                    );
                  })
                )}
              </button>
            );
          })}
        </div>

        {/* Tooltip (escritorio) */}
        {desktop && hoveredPoint && hoveredPoint.total > 0 && (
          <div
            role="tooltip"
            className="eb-card pointer-events-none absolute z-10 flex w-max min-w-[160px] flex-col gap-1.5 rounded-[12px] px-3 py-2.5"
            style={{
              left: `calc((100% - ${spec.axisGap}px) * ${(hovered! + 0.5) / series.days.length})`,
              // Cerca de los bordes se ancla al lado contrario para no cortarse
              transform: `translateX(${tooltipShift(hovered!, series.days.length)})`,
              bottom: `calc(${Math.min((hoveredPoint.total / axisMax) * 100, 100)}% + 10px)`,
            }}
          >
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-eb-text-tertiary text-[11px] font-semibold tracking-[0.04em] uppercase">
                {shortDayLabel(hoveredPoint.date)}
              </span>
              <span className="text-[13px] font-semibold tabular-nums">{formatMoney(hoveredPoint.total)}</span>
            </div>
            {hoveredPoint.byAccount.map((row) => (
              <div key={row.accountName} className="text-eb-text-secondary flex items-center gap-2 text-[12px]">
                <span className="size-2 shrink-0 rounded-full" style={{ background: SEGMENT_DOT_COLORS[row.tone] }} />
                <span className="flex-1 truncate">{row.accountName}</span>
                <span className="text-eb-text tabular-nums">{formatMoney(row.total)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Eje X */}
      <div
        aria-hidden="true"
        className="text-eb-text-tertiary grid"
        style={{
          gridTemplateColumns: columns,
          gap: spec.gap,
          marginRight: spec.axisGap,
          marginTop: desktop ? -8 : -6,
          fontSize: spec.axisFont,
        }}
      >
        {xLabels(series.days, selected).map((label) => (
          <span
            key={`${label.kind}-${label.day}`}
            className={cn(
              "text-center whitespace-nowrap",
              label.kind === "today" && "text-eb-link font-semibold",
              label.kind === "selected" && "text-eb-text font-semibold"
            )}
            style={{
              gridColumn: label.kind === "today" ? `${Math.max(label.day - 1, 1)} / span 3` : label.day,
              gridRow: 1,
            }}
          >
            {label.text}
          </span>
        ))}
      </div>

      {series.legend.length > 0 && (
        <div
          className={cn(
            "text-eb-text-secondary flex flex-wrap",
            desktop ? "gap-[18px] text-[13px]" : "gap-[14px] text-[12px]"
          )}
        >
          {series.legend.map((item) => (
            <span key={item.key} className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: SEGMENT_DOT_COLORS[item.tone] }} />
              {desktop ? item.label : shortAccountName(item.label)}
            </span>
          ))}
        </div>
      )}
    </EbCard>
  );
}
