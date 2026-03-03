"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreditCardIcon, WalletIcon, BanknoteIcon } from "lucide-react";
import { EditExpenseModal } from "@/components/edit-expense-modal";
import { DeleteExpenseButton } from "@/components/delete-expense-button";
import { formatCurrency, formatDate } from "@/lib/utils/dates";

const typeIcons = {
  credit: CreditCardIcon,
  debit: WalletIcon,
  cash: BanknoteIcon,
};

type ExpenseWithDetails = {
  id: number;
  amount: number;
  date: string;
  description: string | null;
  accountId: number;
  categoryId: number | null;
  accountName: string;
  accountColor: string | null;
  accountImageUrl: string | null;
  categoryName: string | null;
};

type ExpensesListProps = {
  accounts: { id: number; name: string; type: string }[];
  categories: { id: number; name: string }[];
  monthKey?: string;
};

export function ExpensesList({ accounts, categories, monthKey }: ExpensesListProps) {
  const router = useRouter();
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = monthKey
      ? `/api/expenses/list?limit=100&month=${monthKey}`
      : "/api/expenses/list?limit=100";
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setExpenses(data);
      })
      .finally(() => setLoading(false));
  }, [monthKey]);

  function refreshList() {
    router.refresh();
    const url = monthKey
      ? `/api/expenses/list?limit=100&month=${monthKey}`
      : "/api/expenses/list?limit=100";
    fetch(url)
      .then((res) => res.json())
      .then(setExpenses);
  }

  if (loading) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Cargando gastos...
      </p>
    );
  }

  if (expenses.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No hay gastos registrados.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {expenses.map((exp) => (
        <div
          key={exp.id}
          className="border-border flex min-h-[60px] items-center justify-between gap-3 rounded-lg border bg-background/50 p-4"
        >
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
              {exp.accountImageUrl ? (
                <img
                  src={exp.accountImageUrl}
                  alt={exp.accountName}
                  className="size-8 rounded object-cover"
                />
              ) : (
                <CreditCardIcon
                  className="size-5"
                  style={
                    exp.accountColor
                      ? { color: exp.accountColor }
                      : { color: "var(--muted-foreground)" }
                  }
                />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium">
                {exp.description || "Sin descripcion"}
              </p>
              <p className="text-muted-foreground text-xs">
                {exp.accountName}
                {exp.categoryName && ` - ${exp.categoryName}`}
                {" - "}
                {formatDate(exp.date)}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span className="font-medium">{formatCurrency(exp.amount)}</span>
            <EditExpenseModal
              expense={exp}
              accounts={accounts}
              categories={categories}
              onSuccess={refreshList}
            />
            <DeleteExpenseButton
              expenseId={exp.id}
              description={exp.description}
              onSuccess={refreshList}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
