"use client";

import { useMemo, useState } from "react";
import { addDays, endOfMonth, format, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerModernProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

function fromDateString(value: string): Date {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7)) - 1;
  const day = Number(value.slice(8, 10));
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return new Date();
  }
  return new Date(year, month, day);
}

function toDateString(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DatePickerModern({
  value,
  onChange,
  className,
}: DatePickerModernProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = useMemo(() => fromDateString(value), [value]);

  const presets = [
    { label: "Hoy", value: new Date() },
    { label: "Ayer", value: addDays(new Date(), -1) },
    { label: "Inicio mes", value: startOfMonth(new Date()) },
    { label: "Fin mes", value: endOfMonth(new Date()) },
  ];

  function selectDate(date: Date) {
    onChange(toDateString(date));
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-11 w-full justify-start rounded-xl border-dashed text-left font-medium",
            className
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] rounded-xl p-0" align="start">
        <div className="border-b p-3">
          <p className="text-sm font-semibold">Selecciona una fecha</p>
          <p className="text-muted-foreground text-xs">Puedes usar accesos rapidos</p>
        </div>
        <div className="grid grid-cols-2 gap-2 p-3">
          {presets.map((preset) => (
            <Button
              key={preset.label}
              type="button"
              variant="secondary"
              size="sm"
              className="justify-start"
              onClick={() => selectDate(preset.value)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <div className="border-t p-1">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                selectDate(date);
              }
            }}
            captionLayout="dropdown"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
