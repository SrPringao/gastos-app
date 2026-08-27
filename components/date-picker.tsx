"use client";

import { useState } from "react";
import { CalendarIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  /** YYYY-MM-DD o "" si no hay fecha elegida */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  clearable?: boolean;
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
 * Selector de fecha unica con el look del sistema, reemplazando el input
 * nativo type=date (que el navegador no deja estilizar de forma consistente).
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "Elegir fecha",
  className,
  clearable = true,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseLocalDate(value) : undefined;

  function handleSelect(date: Date | undefined) {
    onChange(date ? toInputValue(date) : "");
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "font-figures h-9 w-full justify-start gap-2 font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="size-4 shrink-0 opacity-70" />
          <span className="truncate">{value ? formatDate(value) : placeholder}</span>
          {clearable && value && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onChange("");
                }
              }}
              className="hover:bg-secondary text-muted-foreground hover:text-foreground -mr-1 ml-auto flex size-5 shrink-0 items-center justify-center rounded-full transition-colors"
              aria-label="Quitar fecha"
            >
              <XIcon className="size-3.5" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" collisionPadding={12}>
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          defaultMonth={selected}
          className="p-3"
        />
      </PopoverContent>
    </Popover>
  );
}
