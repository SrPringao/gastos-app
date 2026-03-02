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

type Point = { name: string; total: number; totalPesos: number };

type Props = {
  data: { accountId: number; accountName: string; accountType: string; total: number }[];
};

export function ExpensesByAccountChart({ data }: Props) {
  const points: Point[] = data.map((d) => ({
    name: d.accountName,
    total: d.total / 100,
    totalPesos: d.total,
  }));

  if (points.length === 0) {
    return (
      <p className="text-muted-foreground flex h-[260px] items-center justify-center text-sm">
        No hay gastos por cuenta este mes
      </p>
    );
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={points}
          layout="vertical"
          margin={{ top: 8, right: 24, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            tickFormatter={(v) => `$${v}`}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={90}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <Tooltip
            formatter={(_, name, props) => [
              formatCurrency((props?.payload as Point)?.totalPesos ?? 0),
              name,
            ]}
            contentStyle={{ borderRadius: "8px" }}
          />
          <Bar
            dataKey="total"
            fill="var(--chart-2)"
            radius={[0, 4, 4, 0]}
            name="Gastado"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
