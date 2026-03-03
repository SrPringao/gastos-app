"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils/dates";
import { Loader2 } from "lucide-react";

type ExpenseDetail = {
  id: number;
  amount: number;
  date: Date;
  description: string | null;
  categoryName: string | null;
};

type AccountExpensesModalProps = {
  accountId: number | null;
  accountName: string;
  monthKey?: string;
  onOpenChange: (open: boolean) => void;
};

export function AccountExpensesModal({
  accountId,
  accountName,
  monthKey,
  onOpenChange,
}: AccountExpensesModalProps) {
  const [expenses, setExpenses] = useState<ExpenseDetail[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accountId) {
      setExpenses([]);
      return;
    }

    async function fetchExpenses() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (monthKey) params.set("month", monthKey);
        params.set("accountId", String(accountId));

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
  }, [accountId, monthKey]);

  const total = expenses.reduce((acc, exp) => acc + exp.amount, 0);

  return (
    <Dialog open={!!accountId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gastos de {accountName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : expenses.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No hay gastos registrados.
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
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-muted-foreground text-xs">
                          {formatDate(expense.date)}
                        </p>
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
        )}
      </DialogContent>
    </Dialog>
  );
}
