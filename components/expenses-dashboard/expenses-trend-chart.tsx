"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils/dates";

const MONTHS_ES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

type Point = { month: string; total: number; label: string };

type Props = {
  data: { month: string; total: number; year: number; monthNum: number }[];
};

export function ExpensesTrendChart({ data }: Props) {
  const points: Point[] = data.map((d) => ({
    month: d.month,
    total: d.total / 100,
    label: `${MONTHS_ES[d.monthNum - 1]} ${d.year}`,
  }));

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            formatter={(value) => [
              formatCurrency(Math.round(Number(value ?? 0) * 100)),
              "Gastado",
            ]}
            labelFormatter={(_, payload) => payload[0]?.payload?.label ?? ""}
            contentStyle={{ borderRadius: "8px" }}
          />
          <Bar
            dataKey="total"
            fill="var(--chart-1)"
            radius={[4, 4, 0, 0]}
            name="Gastado"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
