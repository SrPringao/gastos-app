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

export function MonthSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [months, setMonths] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const currentMonth = searchParams.get("month");
  const now = new Date();
  const defaultMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const selectedMonth = currentMonth && /^\d{4}-\d{2}$/.test(currentMonth)
    ? currentMonth
    : defaultMonthKey;

  useEffect(() => {
    const now = new Date();
    const def = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    fetch("/api/dashboard/months")
      .then((res) => res.json())
      .then((data: string[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setMonths(data);
        } else {
          setMonths([def]);
        }
      })
      .catch(() => {
        const n = new Date();
        setMonths([`${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`]);
      })
      .finally(() => setLoading(false));
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

  if (loading || months.length === 0) return null;

  return (
    <Select
      value={selectedMonth}
      onValueChange={handleChange}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Mes" />
      </SelectTrigger>
      <SelectContent>
        {months.map((monthKey) => (
          <SelectItem key={monthKey} value={monthKey}>
            {formatMonthKey(monthKey)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
