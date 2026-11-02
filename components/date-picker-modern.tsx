"use client";

import { useState } from "react";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";
import { CalendarCard, DateShortcuts, shortDateLabel } from "@/components/ui/eb/date-row";
import { cn } from "@/lib/utils";

type DatePickerModernProps = {
  /** YYYY-MM-DD */
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

/**
 * Selector de fecha para formularios dentro de un Dialog de Radix (Editar
 * gasto, Simulador): el calendario de la app se despliega en el mismo
 * formulario. Una hoja o popover aparte quedaria fuera del dialogo, que
 * bloquea los toques de afuera.
 */
export function DatePickerModern({ value, onChange, className }: DatePickerModernProps) {
  const [open, setOpen] = useState(false);
  // Remonta el calendario en cada apertura: arranca en el mes de la fecha elegida
  const [openCount, setOpenCount] = useState(0);

  function pick(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          if (!open) setOpenCount((n) => n + 1);
          setOpen((o) => !o);
        }}
        className="text-eb-text flex h-11 w-full items-center gap-2.5 rounded-[12px] px-3.5 text-left text-[15px]"
        style={{ background: "var(--eb-group-solid)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}
      >
        <CalendarIcon size={16} strokeWidth={2} className="text-eb-text-tertiary flex-none" aria-hidden="true" />
        <span className="flex-1 truncate">{value ? shortDateLabel(value) : "Elegir fecha"}</span>
        <ChevronDownIcon
          size={14}
          strokeWidth={2.4}
          className={cn("text-eb-chevron flex-none transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div key={openCount} className="flex flex-col gap-2">
          <DateShortcuts value={value} onPick={pick} />
          <CalendarCard value={value} onPick={pick} />
        </div>
      )}
    </div>
  );
}
