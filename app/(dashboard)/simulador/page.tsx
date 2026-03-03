import { getCurrentUserId } from "@/lib/auth";
import { getTotalSpentThisMonth } from "@/lib/services/dashboard";
import { getAccounts } from "@/lib/services/accounts";
import { getCategories } from "@/lib/services/categories";
import { getMonthlyBudget } from "@/lib/services/monthly-budgets";
import { redirect } from "next/navigation";
import { ScenarioSimulator } from "@/components/scenario-simulator";
import { MonthSelector } from "@/components/month-selector";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function SimuladorPage({
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

  const [accounts, categories, totalSpent, monthlyBudget] = await Promise.all([
    getAccounts(userId),
    getCategories(userId),
    getTotalSpentThisMonth(userId, monthKey),
    getMonthlyBudget(userId, monthKey),
  ]);

  const [y, m] = monthKey.split("-").map(Number);
  const monthName = new Date(y, m - 1, 1).toLocaleDateString("es-MX", {
    month: "long",
  });
  const monthLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div />
        <Suspense fallback={null}>
          <MonthSelector />
        </Suspense>
      </div>

      <ScenarioSimulator
        totalSpentCents={totalSpent}
        monthlyBudgetCents={monthlyBudget}
        monthKey={monthKey}
        monthLabel={monthLabel}
        accounts={accounts.map((a) => ({ id: a.id, name: a.name, type: a.type, color: a.color ?? null, imageUrl: a.imageUrl ?? null }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
