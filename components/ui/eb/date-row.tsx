"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { EbSheet } from "@/components/ui/eb/sheet";
import { Segmented, UpDownIcon } from "@/components/ui/eb/form-kit";
import { monthName, todayDateString } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

function ymd(y: number, m: number, d: number): string {
  return new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10);
}

function shiftDay(value: string, delta: number): string {
  const [y, m, d] = value.split("-").map(Number);
  return ymd(y, m, d + delta);
}

/** "vie 17 jul 2026" */
function rowLabel(value: string): string {
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

type Shortcut = "today" | "yesterday" | "other";

/**
 * Hoja de calendario con el lenguaje de la app (el input date nativo se
 * veia distinto en cada navegador): atajos Hoy/Ayer y cuadricula del mes.
 */
function DateSheet({
  open,
  value,
  onClose,
  onPick,
}: {
  open: boolean;
  value: string;
  onClose: () => void;
  onPick: (value: string) => void;
}) {
  const today = todayDateString();
  const yesterday = shiftDay(today, -1);
  const [month, setMonth] = useState(value.slice(0, 7));
  const shortcut: Shortcut = value === today ? "today" : value === yesterday ? "yesterday" : "other";

  return (
    <EbSheet open={open} onClose={onClose} title="Fecha" nested>
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

      <div
        className="flex flex-col gap-2 rounded-[14px] p-3"
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
          <span className="text-[16px] font-semibold" aria-live="polite">
            {monthName(month)} {month.slice(0, 4)}
          </span>
          <button
            type="button"
            aria-label="Mes siguiente"
            onClick={() => setMonth((m) => shiftMonthKey(m, 1))}
            className="text-eb-link flex size-9 items-center justify-center rounded-full hover:bg-[var(--eb-fill-subtle)]"
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
            const selected = day === value;
            const isToday = day === today;
            return (
              <button
                key={day}
                type="button"
                aria-pressed={selected}
                aria-label={rowLabel(day)}
                onClick={() => onPick(day)}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-full text-[16px] tabular-nums transition-colors",
                  selected
                    ? "font-semibold text-white"
                    : isToday
                      ? "text-eb-link font-semibold hover:bg-[var(--eb-fill-subtle)]"
                      : "text-eb-text hover:bg-[var(--eb-fill-subtle)]"
                )}
                style={
                  selected
                    ? {
                        background: "linear-gradient(180deg, var(--eb-accent-light), var(--eb-accent))",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 10px -4px var(--eb-accent-glow)",
                      }
                    : undefined
                }
              >
                {Number(day.slice(8, 10))}
              </button>
            );
          })}
        </div>
      </div>
    </EbSheet>
  );
}

/**
 * Fila "Fecha" para las hojas: muestra "vie 17 jul 2026" y abre el
 * calendario de la app. `value` en YYYY-MM-DD.
 */
export function DateRow({
  label = "Fecha",
  value,
  onChange,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  // Remonta la hoja en cada apertura: arranca en el mes de la fecha elegida
  const [openCount, setOpenCount] = useState(0);

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
        <span className="flex-none text-[16px]">{label}</span>
        <span className="text-eb-text-secondary flex min-w-0 items-center gap-2 text-[16px]">
          <span className="truncate">{value ? rowLabel(value) : "Elegir"}</span>
          <UpDownIcon />
        </span>
      </button>
      <DateSheet
        key={openCount}
        open={open}
        value={value || todayDateString()}
        onClose={() => setOpen(false)}
        onPick={(next) => {
          onChange(next);
          setOpen(false);
        }}
      />
    </>
  );
}
