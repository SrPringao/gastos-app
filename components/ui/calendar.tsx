"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={es}
      className={cn("rdp-root p-3", className)}
      classNames={{
        root: "relative",
        months: "flex flex-col sm:flex-row gap-4",
        month: "relative flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 items-center h-9",
        nav: "absolute inset-x-0 top-0 flex h-9 items-center justify-between px-1",
        button_previous:
          "inline-flex size-7 items-center justify-center rounded-full hover:bg-secondary transition-colors",
        button_next:
          "inline-flex size-7 items-center justify-center rounded-full hover:bg-secondary transition-colors",
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday: "text-muted-foreground w-8 font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        day: "relative p-0 text-center text-sm font-figures focus-within:relative focus-within:z-20",
        day_button: cn(
          "inline-flex items-center justify-center rounded-full h-8 w-8 p-0 font-normal transition-colors",
          "hover:bg-secondary hover:text-foreground",
          "focus:bg-secondary focus:text-foreground",
          "data-[today]:text-primary data-[today]:font-semibold",
          "data-[disabled]:text-muted-foreground data-[disabled]:opacity-50",
          "data-[outside]:text-muted-foreground data-[outside]:opacity-50"
        ),
        // El fondo tenue del rango vive en el <td> (day), no en el boton, para
        // que pueda extenderse sin esquinas hasta el borde de la celda.
        range_start:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:shadow-[var(--glow-violet-sm)] bg-primary/10 rounded-l-full",
        range_end:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:shadow-[var(--glow-violet-sm)] bg-primary/10 rounded-r-full",
        range_middle: "bg-primary/10 [&>button]:text-foreground",
        selected: "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:shadow-[var(--glow-violet-sm)]",
        today: "text-primary font-semibold",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon =
            orientation === "left" ? ChevronLeftIcon : ChevronRightIcon;
          return <Icon className="h-4 w-4" />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
