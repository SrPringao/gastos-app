"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { monthName, todayDateString } from "@/lib/utils/dates";

function isMonthKey(value: string | null): value is string {
  return !!value && /^\d{4}-\d{2}$/.test(value);
}

function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function capitalize(value: string): string {
  return value.charAt(0).toLocaleUpperCase("es-MX") + value.slice(1);
}

/** "Oct 2026" */
function shortMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const short = new Date(Date.UTC(y, m - 1, 15))
    .toLocaleDateString("es-MX", { month: "short", timeZone: "UTC" })
    .replace(".", "");
  return `${capitalize(short)} ${y}`;
}

/** Mes seleccionado (?month=YYYY-MM) y navegacion entre meses */
function useMonthNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentMonthKey = todayDateString().slice(0, 7);
  const param = searchParams.get("month");
  const selected = isMonthKey(param) ? param : currentMonthKey;
  const [monthsWithData, setMonthsWithData] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/dashboard/months")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: unknown) => setMonthsWithData(Array.isArray(data) ? data.filter(isMonthKey) : []))
      .catch(() => setMonthsWithData([]));
  }, []);

  // Meses con gastos + el actual + el seleccionado, del mas reciente al mas viejo
  const options = Array.from(new Set([...monthsWithData, currentMonthKey, selected])).sort((a, b) =>
    b.localeCompare(a)
  );

  function goTo(monthKey: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (monthKey === currentMonthKey) params.delete("month");
    else params.set("month", monthKey);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return { selected, currentMonthKey, options, goTo };
}

function MonthOptions({ options }: { options: string[] }) {
  return (
    <SelectContent>
      {options.map((key) => (
        <SelectItem key={key} value={key}>
          {monthName(key)} {key.slice(0, 4)}
        </SelectItem>
      ))}
    </SelectContent>
  );
}

/** Selector de vidrio de escritorio: [‹] Oct 2026 [›]; el texto abre la lista de meses */
export function MonthSwitcher({ className }: { className?: string }) {
  const { selected, currentMonthKey, options, goTo } = useMonthNavigation();
  const isCurrent = selected >= currentMonthKey;
  const buttonClass =
    "text-eb-text-muted hover:text-eb-text flex h-[34px] w-9 items-center justify-center rounded-[9px] transition-colors hover:bg-[var(--eb-glass-bg)] disabled:opacity-35 disabled:hover:bg-transparent";

  return (
    <div className={cn("eb-glass flex items-center", className)}>
      <button
        type="button"
        aria-label="Mes anterior"
        className={buttonClass}
        onClick={() => goTo(shiftMonth(selected, -1))}
      >
        <ChevronLeftIcon size={16} strokeWidth={2} />
      </button>
      <Select value={selected} onValueChange={goTo}>
        <SelectTrigger
          aria-label="Elegir mes"
          className="text-eb-text h-[34px] rounded-[9px] border-0 bg-transparent px-[10px] text-[14px] font-medium shadow-none dark:bg-transparent dark:hover:bg-transparent [&>svg]:hidden"
        >
          {shortMonthLabel(selected)}
        </SelectTrigger>
        <MonthOptions options={options} />
      </Select>
      <button
        type="button"
        aria-label="Mes siguiente"
        className={buttonClass}
        disabled={isCurrent}
        onClick={() => goTo(shiftMonth(selected, 1))}
      >
        <ChevronRightIcon size={16} strokeWidth={2} />
      </button>
    </div>
  );
}

/** Titulo movil "Octubre ⌄": el chevron (y el titulo) abren la lista de meses */
export function MonthTitleSelect({ className }: { className?: string }) {
  const { selected, options, goTo } = useMonthNavigation();
  return (
    <h1 className={cn("m-0 text-[34px] leading-[1.1] font-bold tracking-[-0.025em]", className)}>
      <Select value={selected} onValueChange={goTo}>
        <SelectTrigger
          aria-label={`${monthName(selected)}, elegir mes`}
          className="text-eb-text h-auto gap-1.5 rounded-none border-0 bg-transparent p-0 text-[34px] leading-[1.1] font-bold tracking-[-0.025em] shadow-none dark:bg-transparent dark:hover:bg-transparent [&>svg]:hidden"
        >
          {monthName(selected)}
          <ChevronDownIcon size={18} strokeWidth={2.4} className="text-eb-text-tertiary" aria-hidden="true" />
        </SelectTrigger>
        <MonthOptions options={options} />
      </Select>
    </h1>
  );
}
