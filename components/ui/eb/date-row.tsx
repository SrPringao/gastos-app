"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { EbSheet } from "@/components/ui/eb/sheet";
import { GroupBox, Segmented, UpDownIcon } from "@/components/ui/eb/form-kit";
import { monthName, todayDateString } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";

/**
 * Calendario de la app (reemplaza los input date nativos y el calendario
 * generico de shadcn, que se veian distinto en cada navegador). Todas las
 * fechas son YYYY-MM-DD y las cuentas se hacen en UTC para no recorrer dias.
 */

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

function ymd(y: number, m: number, d: number): string {
  return new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10);
}

export function shiftDay(value: string, delta: number): string {
  const [y, m, d] = value.split("-").map(Number);
  return ymd(y, m, d + delta);
}

/** "vie 17 jul 2026" */
export function shortDateLabel(value: string): string {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d))
    .toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
    .replace(/[.,]/g, "");
}

/** Celdas del mes: null antes del dia 1 para que la semana empiece en lunes */
function monthCells(monthKey: string): (string | null)[] {
  const [y, m] = monthKey.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const lead = first === 0 ? 6 : first - 1;
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: days }, (_, i) => ymd(y, m, i + 1)),
  ];
}

function shiftMonthKey(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  return ymd(y, m + delta, 1).slice(0, 7);
}

const selectedStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, var(--eb-accent-light), var(--eb-accent))",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 10px -4px var(--eb-accent-glow)",
};

/**
 * Tarjeta de calendario: mes con flechas y cuadricula L-D. Con `rangeEnd`
 * pinta un rango (los extremos con el acento, el medio con un tinte).
 */
export function CalendarCard({
  value,
  rangeEnd,
  onPick,
  max,
  className,
}: {
  /** Fecha elegida (o inicio del rango); "" sin fecha */
  value: string;
  rangeEnd?: string;
  onPick: (value: string) => void;
  /** Ultima fecha permitida (ej. sin fechas futuras) */
  max?: string;
  className?: string;
}) {
  const today = todayDateString();
  // Arranca en el mes de la fecha elegida (o el actual)
  const [month, setMonth] = useState((value || today).slice(0, 7));
  const canGoNext = !max || shiftMonthKey(month, 1) <= max.slice(0, 7);

  return (
    <div
      className={cn("flex flex-col gap-2 rounded-[14px] p-3", className)}
      style={{ background: "var(--eb-group-solid)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          aria-label="Mes anterior"
          onClick={() => setMonth((m) => shiftMonthKey(m, -1))}
          className="text-eb-link flex size-9 items-center justify-center rounded-full hover:bg-[var(--eb-fill-subtle)]"
        >
          <ChevronLeftIcon size={20} strokeWidth={2.2} />
        </button>
        <span className="text-eb-text text-[16px] font-semibold" aria-live="polite">
          {monthName(month)} {month.slice(0, 4)}
        </span>
        <button
          type="button"
          aria-label="Mes siguiente"
          disabled={!canGoNext}
          onClick={() => setMonth((m) => shiftMonthKey(m, 1))}
          className="text-eb-link flex size-9 items-center justify-center rounded-full hover:bg-[var(--eb-fill-subtle)] disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRightIcon size={20} strokeWidth={2.2} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1" role="grid" aria-label={`${monthName(month)} ${month.slice(0, 4)}`}>
        {WEEKDAYS.map((w, i) => (
          <span key={i} aria-hidden="true" className="text-eb-text-tertiary pb-1 text-center text-[12px] font-semibold">
            {w}
          </span>
        ))}
        {monthCells(month).map((day, i) => {
          if (!day) return <span key={`blank-${i}`} />;
          const isEdge = day === value || (!!rangeEnd && day === rangeEnd);
          const inRange = !!value && !!rangeEnd && day > value && day < rangeEnd;
          const isToday = day === today;
          const disabled = !!max && day > max;
          return (
            <button
              key={day}
              type="button"
              aria-pressed={isEdge}
              aria-label={shortDateLabel(day)}
              disabled={disabled}
              onClick={() => onPick(day)}
              className={cn(
                "flex aspect-square items-center justify-center rounded-full text-[16px] tabular-nums transition-colors disabled:opacity-25",
                isEdge
                  ? "font-semibold text-white"
                  : inRange
                    ? "text-eb-text"
                    : isToday
                      ? "text-eb-link font-semibold hover:bg-[var(--eb-fill-subtle)]"
                      : "text-eb-text hover:bg-[var(--eb-fill-subtle)] disabled:hover:bg-transparent"
              )}
              style={isEdge ? selectedStyle : inRange ? { background: "rgba(94,107,255,0.16)" } : undefined}
            >
              {Number(day.slice(8, 10))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type Shortcut = "today" | "yesterday" | "other";

/** Atajos Hoy · Ayer · Otra fecha (el ultimo solo marca que es otro dia) */
export function DateShortcuts({ value, onPick }: { value: string; onPick: (value: string) => void }) {
  const today = todayDateString();
  const yesterday = shiftDay(today, -1);
  const shortcut: Shortcut = value === today ? "today" : value === yesterday ? "yesterday" : "other";
  return (
    <Segmented<Shortcut>
      ariaLabel="Atajos de fecha"
      value={shortcut}
      onChange={(next) => {
        if (next === "today") onPick(today);
        else if (next === "yesterday") onPick(yesterday);
      }}
      options={[
        { value: "today", label: "Hoy" },
        { value: "yesterday", label: "Ayer" },
        { value: "other", label: "Otra fecha" },
      ]}
    />
  );
}

/**
 * Hoja secundaria con el calendario, para usarse dentro de otras hojas
 * EbSheet. Montala con `key` distinto por apertura para que arranque en el
 * mes de la fecha elegida.
 */
export function DatePickerSheet({
  open,
  value,
  onClose,
  onPick,
  title = "Fecha",
  shortcuts = true,
  max,
  onClear,
  clearLabel = "Quitar fecha",
  nested = true,
}: {
  open: boolean;
  value: string;
  onClose: () => void;
  onPick: (value: string) => void;
  title?: string;
  /** Atajos Hoy/Ayer arriba del calendario */
  shortcuts?: boolean;
  max?: string;
  /** Campo opcional: boton para dejarlo sin fecha */
  onClear?: () => void;
  clearLabel?: string;
  nested?: boolean;
}) {
  return (
    <EbSheet open={open} onClose={onClose} title={title} nested={nested}>
      {shortcuts && <DateShortcuts value={value} onPick={onPick} />}
      <CalendarCard value={value} onPick={onPick} max={max} />
      {onClear && value && (
        <GroupBox variant="mobile">
          <button type="button" onClick={onClear} className="text-eb-red min-h-12 w-full px-4 text-center text-[16px]">
            {clearLabel}
          </button>
        </GroupBox>
      )}
    </EbSheet>
  );
}

/**
 * Fila de fecha para las hojas: muestra "vie 17 jul 2026" y abre el
 * calendario de la app. `value` en YYYY-MM-DD ("" = sin fecha).
 */
export function DateRow({
  label = "Fecha",
  subtitle,
  value,
  onChange,
  placeholder = "Elegir",
  shortcuts = true,
  max,
  clearable = false,
}: {
  label?: string;
  subtitle?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  shortcuts?: boolean;
  max?: string;
  /** Campo opcional: la hoja ofrece "Quitar fecha" */
  clearable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  // Remonta la hoja en cada apertura: arranca en el mes de la fecha elegida
  const [openCount, setOpenCount] = useState(0);

  function pick(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => {
          setOpenCount((n) => n + 1);
          setOpen(true);
        }}
        className="text-eb-text flex min-h-[52px] w-full items-center justify-between gap-3 px-4 text-left"
      >
        <span className="flex flex-none flex-col gap-px">
          <span className="text-[16px]">{label}</span>
          {subtitle && <span className="text-eb-text-tertiary text-[12px]">{subtitle}</span>}
        </span>
        <span className="text-eb-text-secondary flex min-w-0 items-center gap-2 text-[16px]">
          <span className={cn("truncate", !value && "text-eb-text-tertiary")}>
            {value ? shortDateLabel(value) : placeholder}
          </span>
          <UpDownIcon />
        </span>
      </button>
      <DatePickerSheet
        key={openCount}
        open={open}
        title={label}
        value={value}
        onClose={() => setOpen(false)}
        onPick={pick}
        shortcuts={shortcuts}
        max={max}
        onClear={clearable ? () => pick("") : undefined}
      />
    </>
  );
}
