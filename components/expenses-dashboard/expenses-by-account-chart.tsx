"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/utils/dates";

const typeLabels: Record<string, string> = {
  credit: "Credito",
  debit: "Debito",
  cash: "Efectivo",
};

type Point = {
  name: string;
  total: number;
  totalPesos: number;
  color?: string | null;
};

type Props = {
  data: {
    accountId: number;
    accountName: string;
    accountType: string;
    accountColor?: string | null;
    total: number;
  }[];
};

export function ExpensesByAccountChart({ data }: Props) {
  const points: Point[] = data.map((d) => {
    const typeLabel = typeLabels[d.accountType] || d.accountType;
    return {
      name: `${d.accountName} · ${typeLabel}`,
      total: d.total / 100,
      totalPesos: d.total,
      color: d.accountColor,
    };
  });

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
            radius={[0, 4, 4, 0]}
            name="Gastado"
          >
            {points.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || "var(--chart-2)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
