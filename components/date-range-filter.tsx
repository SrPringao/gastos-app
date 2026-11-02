"use client";

import { useState } from "react";
import { CalendarIcon, ChevronDownIcon, XIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarCard } from "@/components/ui/eb/date-row";
import { formatDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";

type DateRangeFilterProps = {
  /** YYYY-MM-DD o "" si no hay filtro */
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  /** ios: boton compacto del Historial de escritorio ("Fecha ⌄"), alto 36 y fondo gris */
  appearance?: "default" | "ios";
};

/**
 * Filtro de fecha en un solo control con el calendario de la app.
 * Un toque filtra por ese dia; un segundo dia posterior completa el rango.
 *
 * ios (barra del Historial de escritorio): en popover. default (hoja de
 * Filtros en movil, un Dialog de Radix): desplegado en el mismo formulario,
 * porque un popover suelto se posiciona mal en el celular.
 */
export function DateRangeFilter({ from, to, onChange, appearance = "default" }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  // Remonta el calendario en cada apertura: arranca en el mes del filtro
  const [openCount, setOpenCount] = useState(0);
  const hasFilter = from !== "";
  const isRange = !!to && to !== from;

  function toggle(next: boolean) {
    if (next) setOpenCount((n) => n + 1);
    setOpen(next);
  }

  function pick(day: string) {
    // Ya hay un dia suelto y el nuevo es posterior: completa el rango y cierra
    if (from && !isRange && day > from) {
      onChange(from, day);
      setOpen(false);
      return;
    }
    // Primer toque (o rango ya completo, o dia anterior): empieza de nuevo
    onChange(day, "");
  }

  function clear() {
    onChange("", "");
    setOpen(false);
  }

  const label = !hasFilter ? "Fecha" : isRange ? `${formatDate(from)} – ${formatDate(to)}` : formatDate(from);

  const panel = (
    <div key={openCount} className="flex flex-col gap-2">
      <CalendarCard value={from} rangeEnd={isRange ? to : undefined} onPick={pick} />
      <div className="flex items-center justify-between gap-3 px-1">
        <span className="text-eb-text-tertiary text-[12px]">
          {from && !isRange ? "Toca otro día para hacer un rango" : "Toca un día o dos para un rango"}
        </span>
        {hasFilter && (
          <button type="button" onClick={clear} className="text-eb-link flex-none text-[14px] font-medium">
            Limpiar
          </button>
        )}
      </div>
    </div>
  );

  if (appearance === "ios") {
    return (
      <Popover open={open} onOpenChange={toggle}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="text-eb-text flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-[13px] font-medium"
            style={{ background: "var(--eb-ios-fill)" }}
          >
            <span className="max-w-[180px] truncate">{label}</span>
            <ChevronDownIcon size={12} strokeWidth={2.6} className="text-eb-text-tertiary" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[320px] rounded-[18px] border-0 p-2"
          style={{ background: "var(--eb-sheet-bg)", boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 20px 50px -12px rgba(0,0,0,0.7)" }}
          align="start"
          collisionPadding={12}
        >
          {panel}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        className="text-eb-text flex h-11 w-full items-center gap-2.5 rounded-[12px] px-3.5 text-[15px]"
        style={{ background: "var(--eb-group-solid)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}
      >
        <button
          type="button"
          aria-expanded={open}
          onClick={() => toggle(!open)}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <CalendarIcon size={16} strokeWidth={2} className="text-eb-text-tertiary flex-none" aria-hidden="true" />
          <span className={cn("flex-1 truncate", !hasFilter && "text-eb-text-tertiary")}>
            {hasFilter ? label : "Cualquier fecha"}
          </span>
          <ChevronDownIcon
            size={14}
            strokeWidth={2.4}
            className={cn("text-eb-chevron flex-none transition-transform", open && "rotate-180")}
            aria-hidden="true"
          />
        </button>
        {hasFilter && (
          <button
            type="button"
            onClick={clear}
            aria-label="Quitar filtro de fecha"
            className="text-eb-text-tertiary hover:text-eb-text -mr-1 flex size-7 flex-none items-center justify-center rounded-full"
          >
            <XIcon size={14} strokeWidth={2.4} />
          </button>
        )}
      </div>
      {open && panel}
    </div>
  );
}
