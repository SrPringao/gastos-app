"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { formatCurrency } from "@/lib/utils/dates";

type DailyTotalPoint = {
  date: string; // YYYY-MM-DD
  totalCents: number;
};

type Props = {
  data: DailyTotalPoint[];
  monthlyBudgetCents: number | null;
  monthLabel: string;
};

export function ExpensesBudgetProgressChart({
  data,
  monthlyBudgetCents,
  monthLabel,
}: Props) {
  if (data.length === 0 || monthlyBudgetCents == null || monthlyBudgetCents <= 0) {
    return (
      <p className="text-muted-foreground flex h-[260px] items-center justify-center text-sm">
        Configura un presupuesto mensual para ver el progreso diario.
      </p>
    );
  }

  const sorted = [...data].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  let cumulative = 0;
  const chartData = sorted.map((item) => {
    cumulative += item.totalCents;
    const day = Number(item.date.split("-")[2] ?? "1");
    return {
      date: item.date,
      dayLabel: String(day),
      spent: cumulative / 100,
      budget: monthlyBudgetCents / 100,
    };
  });

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="dayLabel"
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            formatter={(value, name) => {
              if (name === "Presupuesto") {
                return [formatCurrency(monthlyBudgetCents), name];
              }
              return [
                formatCurrency(Math.round(Number(value ?? 0) * 100)),
                "Acumulado",
              ];
            }}
            labelFormatter={(_, payload) => {
              const p = payload?.[0]?.payload as
                | { date?: string }
                | undefined;
              return p?.date ? `${p.date} · ${monthLabel}` : "";
            }}
            contentStyle={{ borderRadius: "8px" }}
          />
          <Line
            type="monotone"
            dataKey="spent"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
            name="Acumulado"
          />
          <ReferenceLine
            y={monthlyBudgetCents / 100}
            stroke="var(--destructive)"
            strokeDasharray="4 4"
            ifOverflow="extendDomain"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

