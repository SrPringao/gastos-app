"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils/dates";
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

type ExpenseDetail = {
  id: number;
  amount: number;
  date: Date | string;
  description: string | null;
  categoryName: string | null;
  accountName?: string;
  accountColor?: string | null;
};

type DayExpensesModalProps = {
  date: string | null;
  onOpenChange: (open: boolean) => void;
};

export function DayExpensesModal({ date, onOpenChange }: DayExpensesModalProps) {
  const [expenses, setExpenses] = useState<ExpenseDetail[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date) {
      setExpenses([]);
      return;
    }

    async function fetchExpenses() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("date", date!);

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
  }, [date]);

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

  const dateLabel = date
    ? new Date(date + "T12:00:00").toLocaleDateString("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "";
  const formattedDateLabel =
    dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

  return (
    <Dialog open={!!date} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gastos del {formattedDateLabel}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : expenses.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No hay gastos registrados ese dia.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4">
              <p className="text-muted-foreground text-sm">Total</p>
              <p className="text-2xl font-bold">{formatCurrency(total)}</p>
              <p className="text-muted-foreground text-xs mt-1">
                {expenses.length} {expenses.length === 1 ? "gasto" : "gastos"}
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 md:gap-8 md:items-stretch">
              <div className="flex-1 min-w-0">
                <p className="text-muted-foreground mb-2 text-sm font-medium">
                  Detalle de gastos
                </p>
                <div className="space-y-2">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {expense.description || "Sin descripcion"}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {expense.accountName && (
                              <p className="text-muted-foreground text-xs">
                                {expense.accountName}
                              </p>
                            )}
                            {expense.categoryName && (
                              <>
                                <span className="text-muted-foreground text-xs">•</span>
                                <p className="text-muted-foreground text-xs truncate">
                                  {expense.categoryName}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                        <p className="font-semibold text-nowrap">
                          {formatCurrency(expense.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="hidden md:flex shrink-0 md:w-[220px] flex-col md:justify-center">
                {byAccount.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-muted-foreground mb-2 text-sm font-medium text-center">
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
                            contentStyle={{ borderRadius: "8px" }}
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
                          className="flex items-center justify-between text-sm gap-2"
                        >
                          <span className="text-muted-foreground truncate">{name}</span>
                          <span className="font-medium shrink-0">
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
