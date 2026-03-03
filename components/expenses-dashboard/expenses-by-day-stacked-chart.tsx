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

type DailyAccountPoint = {
  date: string; // YYYY-MM-DD
  accountId: number;
  accountName: string;
  accountColor: string | null;
  total: number; // cents
};

type ChartPoint = {
  date: string;
  dayLabel: string;
  totalCents: number;
  [key: string]: string | number;
};

type Props = {
  data: DailyAccountPoint[];
};

type InternalAccount = {
  id: number;
  name: string;
  color: string | null;
};

type DayTooltipEntry = {
  dataKey?: string | number;
  color?: string;
  value?: number;
  payload?: ChartPoint;
};

type DayTooltipProps = {
  active?: boolean;
  payload?: DayTooltipEntry[];
  accounts: InternalAccount[];
};

function DayTooltip({ active, payload, accounts }: DayTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload as ChartPoint | undefined;
  if (!point) return null;

  const totalFormatted = formatCurrency(point.totalCents);

  const items = payload
    .filter(
      (entry: DayTooltipEntry) =>
        typeof entry.value === "number" && (entry.value ?? 0) > 0
    )
    .map((entry: DayTooltipEntry) => {
      const account = accounts.find(
        (a) => `a_${a.id}` === String(entry.dataKey)
      );
      const label = account ? account.name : "Gastado";
      const valueFormatted = formatCurrency(
        Math.round(Number(entry.value ?? 0) * 100)
      );
      return {
        key: String(entry.dataKey),
        color: entry.color as string | undefined,
        label,
        value: valueFormatted,
      };
    });

  if (items.length === 0) return null;

  return (
    <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-sm">
      <div className="mb-1 font-medium">
        {point.date} · Total del dia: {totalFormatted}
      </div>
      <div className="space-y-0.5">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-2"
          >
            <span className="flex items-center gap-1">
              <span
                className="inline-block size-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.label}</span>
            </span>
            <span>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ExpensesByDayStackedChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="text-muted-foreground flex h-[260px] items-center justify-center text-sm">
        No hay gastos este mes
      </p>
    );
  }

  // Obtener lista unica de cuentas presentes en el mes
  const accounts = Array.from(
    new Map(
      data.map((d) => [
        d.accountId,
        ({
          id: d.accountId,
          name: d.accountName,
          color: d.accountColor as string | null,
        } as InternalAccount),
      ])
    ).values()
  );

  // Agrupar por fecha
  const groupedByDate = new Map<string, DailyAccountPoint[]>();
  for (const row of data) {
    const list = groupedByDate.get(row.date) ?? [];
    list.push(row);
    groupedByDate.set(row.date, list);
  }

  const sortedDates = Array.from(groupedByDate.keys()).sort();

  const chartData: ChartPoint[] = sortedDates.map((date) => {
    const day = Number(date.split("-")[2] ?? "1");
    const rowsForDay = groupedByDate.get(date)!;
    const totalCentsForDay = rowsForDay.reduce(
      (acc, row) => acc + row.total,
      0
    );
    const entry: ChartPoint = {
      date,
      dayLabel: String(day),
      totalCents: totalCentsForDay,
    };
    for (const acc of accounts) {
      const match = rowsForDay.find((r) => r.accountId === acc.id);
      if (match) {
        entry[`a_${acc.id}`] = match.total / 100;
      } else {
        entry[`a_${acc.id}`] = 0;
      }
    }
    return entry;
  });

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
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
            content={(props: any) => (
              <DayTooltip {...props} accounts={accounts} />
            )}
          />
          {accounts.map((acc, index) => (
            <Bar
              key={acc.id}
              dataKey={`a_${acc.id}`}
              stackId="a"
              name={acc.name}
              fill={
                acc.color && acc.color.trim() !== ""
                  ? acc.color
                  : `var(--chart-${(index % 5) + 1})`
              }
              radius={index === accounts.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

