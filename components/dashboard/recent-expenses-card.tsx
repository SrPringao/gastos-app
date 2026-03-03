"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditExpenseModal } from "@/components/edit-expense-modal";
import { DeleteExpenseButton } from "@/components/delete-expense-button";
import { formatCurrency, formatDate } from "@/lib/utils/dates";

type RecentExpense = {
  id: number;
  amount: number;
  date: Date | string;
  description: string | null;
  accountId: number;
  categoryId: number | null;
  accountName: string;
};

type RecentExpensesCardProps = {
  expenses: RecentExpense[];
  accounts: { id: number; name: string; type: string }[];
  categories: { id: number; name: string }[];
};

export function RecentExpensesCard({
  expenses,
  accounts,
  categories,
}: RecentExpensesCardProps) {
  const router = useRouter();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Gastos recientes</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {expenses.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            No hay gastos registrados.
          </p>
        ) : (
          <div className="space-y-3">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-medium">
                    {exp.description || "Sin descripcion"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {exp.accountName} - {formatDate(exp.date)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">{formatCurrency(exp.amount)}</span>
                  <EditExpenseModal
                    expense={{
                      id: exp.id,
                      amount: exp.amount,
                      date:
                        typeof exp.date === "string"
                          ? exp.date
                          : exp.date.toISOString(),
                      description: exp.description,
                      accountId: exp.accountId,
                      categoryId: exp.categoryId,
                    }}
                    accounts={accounts}
                    categories={categories}
                    onSuccess={() => router.refresh()}
                  />
                  <DeleteExpenseButton
                    expenseId={exp.id}
                    description={exp.description}
                    onSuccess={() => router.refresh()}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
