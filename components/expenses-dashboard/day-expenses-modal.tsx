"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils/dates";
import { Loader2 } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function formatDayLabel(dateKey: string): string {
  const label = new Date(dateKey + "T12:00:00").toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

type ExpenseDetail = {
  id: number;
  amount: number;
  date: Date | string;
  description: string | null;
  categoryName: string | null;
  accountName?: string;
  accountColor?: string | null;
};

function ExpenseItemRow({ expense }: { expense: ExpenseDetail }) {
  return (
    <div className="hover:bg-muted/50 rounded-lg border p-3 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">
            {expense.description || "Sin descripcion"}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {expense.accountName && (
              <p className="text-muted-foreground text-xs">{expense.accountName}</p>
            )}
            {expense.categoryName && (
              <>
                <span className="text-muted-foreground text-xs">•</span>
                <p className="text-muted-foreground truncate text-xs">
                  {expense.categoryName}
                </p>
              </>
            )}
          </div>
        </div>
        <p className="font-figures text-nowrap font-medium">
          {formatCurrency(expense.amount)}
        </p>
      </div>
    </div>
  );
}

/**
 * Modal de gastos para un rango de fechas cualquiera (un solo dia cuenta
 * como rango de 1 dia). Usado tanto por el detalle de "gasto por dia" del
 * dashboard como por las funciones rapidas de la tab bar movil ("Gastos de
 * hoy", "Gastos de la semana").
 */
export function ExpensesRangeModal({
  from,
  to,
  title,
  open,
  onOpenChange,
}: {
  /** YYYY-MM-DD */
  from: string | null;
  /** YYYY-MM-DD; si se omite se usa el mismo dia que `from` */
  to?: string | null;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [expenses, setExpenses] = useState<ExpenseDetail[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !from) {
      setExpenses([]);
      return;
    }

    async function fetchExpenses() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        const rangeTo = to || from!;
        if (rangeTo === from) {
          params.set("date", from!);
        } else {
          params.set("from", from!);
          params.set("to", rangeTo);
        }

        const res = await fetch(`/api/expenses/list?${params}`);
        if (res.ok) {
          const data = await res.json();
          setExpenses(data);
        }
      } catch (error) {
        console.error("Error al cargar gastos:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchExpenses();
  }, [open, from, to]);

  const total = expenses.reduce((acc, exp) => acc + exp.amount, 0);

  const byAccount = useMemo(() => {
    const map = new Map<string, { total: number; color: string | null }>();
    for (const exp of expenses) {
      const name = exp.accountName ?? "Sin cuenta";
      const existing = map.get(name);
      const color = exp.accountColor ?? null;
      if (existing) {
        existing.total += exp.amount;
      } else {
        map.set(name, { total: exp.amount, color });
      }
    }
    return Array.from(map.entries()).map(([name, { total: t, color }]) => ({
      name,
      value: total > 0 ? Math.round((t / total) * 100) : 0,
      cents: t,
      color: color && color.trim() ? color : undefined,
    }));
  }, [expenses, total]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const exp of expenses) {
      const name = exp.categoryName ?? "Sin categoria";
      map.set(name, (map.get(name) ?? 0) + exp.amount);
    }
    return Array.from(map.entries()).map(([name, cents]) => ({
      name,
      cents,
    }));
  }, [expenses]);

  const isMultiDay = !!to && to !== from;

  const byDay = useMemo(() => {
    if (!isMultiDay) return null;
    const map = new Map<string, { total: number; items: ExpenseDetail[] }>();
    for (const exp of expenses) {
      const dateKey =
        typeof exp.date === "string" ? exp.date.slice(0, 10) : exp.date.toISOString().slice(0, 10);
      const existing = map.get(dateKey);
      if (existing) {
        existing.total += exp.amount;
        existing.items.push(exp);
      } else {
        map.set(dateKey, { total: exp.amount, items: [exp] });
      }
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([dateKey, { total: dayTotal, items }]) => ({
        dateKey,
        label: formatDayLabel(dateKey),
        total: dayTotal,
        items,
      }));
  }, [expenses, isMultiDay]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : expenses.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No hay gastos registrados en este periodo.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted rounded-xl p-4">
              <p className="text-muted-foreground text-sm">Total</p>
              <p className="font-figures text-2xl font-medium">{formatCurrency(total)}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {expenses.length} {expenses.length === 1 ? "gasto" : "gastos"}
              </p>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-stretch md:gap-8">
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground mb-2 text-sm font-medium">
                  Detalle de gastos
                </p>
                {byDay ? (
                  <div className="space-y-4">
                    {byDay.map((day) => (
                      <div key={day.dateKey}>
                        <div className="bg-muted/60 mb-2 flex items-center justify-between gap-2 rounded-lg px-3 py-1.5">
                          <p className="truncate text-xs font-medium">{day.label}</p>
                          <p className="font-figures text-nowrap text-xs font-semibold">
                            {formatCurrency(day.total)}
                          </p>
                        </div>
                        <div className="space-y-2">
                          {day.items.map((expense) => (
                            <ExpenseItemRow key={expense.id} expense={expense} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {expenses.map((expense) => (
                      <ExpenseItemRow key={expense.id} expense={expense} />
                    ))}
                  </div>
                )}
              </div>

              <div className="hidden shrink-0 flex-col md:flex md:w-[220px] md:justify-center">
                {byAccount.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-muted-foreground mb-2 text-center text-sm font-medium">
                      Por metodo de pago
                    </p>
                    <div className="h-[180px] w-full min-w-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={byAccount}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={2}
                          >
                            {byAccount.map((entry, i) => (
                              <Cell
                                key={entry.name}
                                fill={
                                  entry.color ?? CHART_COLORS[i % CHART_COLORS.length]
                                }
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(_, name, props: { payload?: { cents: number } }) => [
                              formatCurrency(props?.payload?.cents ?? 0),
                              name,
                            ]}
                            contentStyle={{
                              borderRadius: "10px",
                              background: "var(--popover)",
                              color: "var(--popover-foreground)",
                              border: "1px solid var(--border)",
                              fontSize: "12px",
                              fontFamily: "var(--font-mono)",
                            }}
                          />
                          <Legend
                            formatter={(value, entry) => (
                              <span className="text-muted-foreground text-xs">
                                {value} {Number((entry?.payload as { value?: number })?.value ?? 0)}%
                              </span>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {byCategory.length > 1 && (
                  <div>
                    <p className="text-muted-foreground mb-2 text-sm font-medium">
                      Por categoria
                    </p>
                    <div className="space-y-1">
                      {byCategory.map(({ name, cents }) => (
                        <div
                          key={name}
                          className="flex items-center justify-between gap-2 text-sm"
                        >
                          <span className="text-muted-foreground truncate">{name}</span>
                          <span className="font-figures shrink-0 font-medium">
                            {formatCurrency(cents)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

type DayExpensesModalProps = {
  date: string | null;
  onOpenChange: (open: boolean) => void;
};

/** Wrapper de compatibilidad: mismo API que antes, ahora sobre ExpensesRangeModal */
export function DayExpensesModal({ date, onOpenChange }: DayExpensesModalProps) {
  const dateLabel = date
    ? new Date(date + "T12:00:00").toLocaleDateString("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "";
  const formattedDateLabel = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

  return (
    <ExpensesRangeModal
      from={date}
      title={`Gastos del ${formattedDateLabel}`}
      open={!!date}
      onOpenChange={onOpenChange}
    />
  );
}
