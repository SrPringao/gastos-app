"use client";

import { useMemo, useState } from "react";
import { CalendarIcon, XIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";

type DateRangeFilterProps = {
  /** YYYY-MM-DD o "" si no hay filtro */
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
};

/** Parsea un string YYYY-MM-DD como fecha local (sin desfase de zona horaria) */
function parseLocalDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Filtro de fecha en un solo control: abre un calendario de rango.
 * Un solo click (sin arrastrar a un segundo dia) filtra por esa fecha unica;
 * seleccionar dos dias filtra por el rango completo.
 */
export function DateRangeFilter({ from, to, onChange }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);

  const range: DateRange | undefined = useMemo(
    () =>
      from
        ? { from: parseLocalDate(from), to: to ? parseLocalDate(to) : undefined }
        : undefined,
    [from, to]
  );

  const hasFilter = from !== "";

  function handleSelect(next: DateRange | undefined) {
    if (!next?.from) {
      onChange("", "");
      return;
    }
    // Un solo dia seleccionado (sin "to" o "to" == "from"): filtra fecha unica
    const fromValue = toInputValue(next.from);
    const toValue = next.to ? toInputValue(next.to) : "";
    onChange(fromValue, toValue);
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("", "");
  }

  const label = !hasFilter
    ? "Fecha"
    : to && to !== from
      ? `${formatDate(from)} – ${formatDate(to)}`
      : formatDate(from);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "font-figures h-9 w-auto min-w-[160px] justify-start gap-2 font-normal",
            hasFilter && "text-foreground"
          )}
        >
          <CalendarIcon className="text-muted-foreground size-4 shrink-0" />
          <span className="truncate">{label}</span>
          {hasFilter && (
            <span
              role="button"
              tabIndex={0}
              onClick={clear}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onChange("", "");
                }
              }}
              className="hover:bg-secondary text-muted-foreground hover:text-foreground -mr-1 ml-auto flex size-5 shrink-0 items-center justify-center rounded-full transition-colors"
              aria-label="Quitar filtro de fecha"
            >
              <XIcon className="size-3.5" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        collisionPadding={12}
      >
        <Calendar
          mode="range"
          selected={range}
          onSelect={handleSelect}
          defaultMonth={range?.from}
          numberOfMonths={1}
          className="p-3"
        />
        {hasFilter && (
          <div className="border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground w-full"
              onClick={() => {
                onChange("", "");
                setOpen(false);
              }}
            >
              Limpiar fecha
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
