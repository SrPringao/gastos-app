import { getCurrentUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getFixedExpenses,
  getPaymentsForMonth,
} from "@/lib/services/fixed-expenses";
import { FixedExpensesList } from "@/components/fixed-expenses/fixed-expenses-list";
import { AddFixedExpenseTrigger } from "@/components/fixed-expenses/add-fixed-expense-trigger";
import { MonthSelector } from "@/components/month-selector";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function GastosFijosPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const params = await searchParams;
  const monthParam = params.month;
  const monthKey =
    monthParam && /^\d{4}-\d{2}$/.test(monthParam)
      ? monthParam
      : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  const [y, m] = monthKey.split("-").map(Number);
  const monthName = new Date(y, m - 1, 1).toLocaleDateString("es-MX", { month: "long" });
  const monthLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const [items, payments] = await Promise.all([
    getFixedExpenses(userId),
    getPaymentsForMonth(userId, monthKey),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Gastos Fijos</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Seguimiento de pagos recurrentes — {monthLabel}
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="w-full sm:w-auto">
            <AddFixedExpenseTrigger />
          </div>
          <Suspense fallback={null}>
            <MonthSelector />
          </Suspense>
        </div>
      </div>

      <FixedExpensesList
        initialItems={items.map((i) => ({
          id: i.id,
          name: i.name,
          amount: i.amount,
          dayOfMonth: i.dayOfMonth,
          category: i.category,
        }))}
        initialPayments={payments.map((p) => ({
          fixedExpenseId: p.fixedExpenseId,
          month: p.month,
          paidAt: p.paidAt.toISOString(),
        }))}
        monthKey={monthKey}
      />
    </div>
  );
}
