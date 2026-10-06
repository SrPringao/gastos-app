import { getCurrentUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getFixedExpenses,
  getPaymentsForMonth,
} from "@/lib/services/fixed-expenses";
import { FixedExpensesList } from "@/components/fixed-expenses/fixed-expenses-list";
import { AddFixedExpenseTrigger } from "@/components/fixed-expenses/add-fixed-expense-trigger";
import { MonthSwitcher } from "@/components/ui/eb/month-switcher";
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
    <div className="mx-auto flex max-w-[1120px] flex-col gap-7 px-4 pt-6 pb-16 md:px-6 md:pt-10 lg:px-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="text-eb-text-tertiary text-[13px] font-semibold tracking-[0.04em] uppercase">
            Pagos recurrentes · {monthLabel}
          </div>
          <h1 className="eb-title">Gastos fijos</h1>
        </div>
        <div className="flex items-center gap-2.5">
          <Suspense fallback={null}>
            <MonthSwitcher />
          </Suspense>
          <AddFixedExpenseTrigger />
        </div>
      </header>

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
