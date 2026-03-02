"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils/dates";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-2)",
  "var(--chart-3)",
];

type Point = { name: string; value: number; cents: number };

type Props = {
  data: { categoryId: number | null; categoryName: string | null; total: number }[];
};

export function ExpensesByCategoryChart({ data }: Props) {
  const total = data.reduce((acc, d) => acc + d.total, 0);
  const points: Point[] = data.map((d) => ({
    name: d.categoryName ?? "Sin categoria",
    value: total > 0 ? Math.round((d.total / total) * 100) : 0,
    cents: d.total,
  }));

  if (points.length === 0 || total === 0) {
    return (
      <p className="text-muted-foreground flex h-[260px] items-center justify-center text-sm">
        No hay gastos por categoria este mes
      </p>
    );
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={points}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            label={({ name, value }) => (value > 0 ? `${name} ${value}%` : "")}
          >
            {points.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(_, name, props) => [
              formatCurrency((props?.payload as Point)?.cents ?? 0),
              name,
            ]}
            contentStyle={{ borderRadius: "8px" }}
          />
          <Legend
            formatter={(value, entry) => (
              <span className="text-muted-foreground text-sm">
                {value} {(entry?.payload as Point)?.value ?? 0}%
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
