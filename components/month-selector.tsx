"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTH_NAMES: Record<string, string> = {
  "01": "Enero",
  "02": "Febrero",
  "03": "Marzo",
  "04": "Abril",
  "05": "Mayo",
  "06": "Junio",
  "07": "Julio",
  "08": "Agosto",
  "09": "Septiembre",
  "10": "Octubre",
  "11": "Noviembre",
  "12": "Diciembre",
};

function formatMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const monthName = MONTH_NAMES[month] ?? month;
  return `${monthName} ${year}`;
}

function currentMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function isMonthKey(value: string | null): value is string {
  return !!value && /^\d{4}-\d{2}$/.test(value);
}

/** Incluye meses sin gastos (p. ej. el mes actual) para que el Select no quede en blanco. */
function mergeMonthOptions(months: string[], ...extra: string[]): string[] {
  const set = new Set(months.filter(isMonthKey));
  for (const key of extra) {
    if (isMonthKey(key)) set.add(key);
  }
  return Array.from(set).sort((a, b) => b.localeCompare(a));
}

export function MonthSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [months, setMonths] = useState<string[]>(() => [currentMonthKey()]);

  const currentMonth = searchParams.get("month");
  const defaultMonthKey = currentMonthKey();
  const selectedMonth = isMonthKey(currentMonth) ? currentMonth : defaultMonthKey;
  const monthOptions = mergeMonthOptions(months, selectedMonth, defaultMonthKey);

  useEffect(() => {
    const def = currentMonthKey();
    fetch("/api/dashboard/months")
      .then((res) => res.json())
      .then((data: string[]) => {
        setMonths(mergeMonthOptions(Array.isArray(data) ? data : [], def));
      })
      .catch(() => {
        setMonths([currentMonthKey()]);
      });
  }, []);

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === defaultMonthKey) {
      params.delete("month");
    } else {
      params.set("month", value);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <Select
      value={selectedMonth}
      onValueChange={handleChange}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Mes" />
      </SelectTrigger>
      <SelectContent>
        {monthOptions.map((monthKey) => (
          <SelectItem key={monthKey} value={monthKey}>
            {formatMonthKey(monthKey)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
