import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { getAccounts } from "@/lib/services/accounts";
import { getCategories } from "@/lib/services/categories";
import { getMonthlyBudget } from "@/lib/services/monthly-budgets";
import { getExpensesWithDetails } from "@/lib/services/expenses";
import { todayDateString } from "@/lib/utils/dates";
import { ExpensesView } from "@/components/expenses/expenses-view";

export const dynamic = "force-dynamic";

/** Tope de gastos por mes que se cargan para KPIs, graficas e historial */
const MONTH_LIMIT = 5000;

export default async function GastosPage({
  searchParams,
}: {
  /** `method`: abre el Historial filtrado por ese metodo ("Ver sus gastos") */
  searchParams: Promise<{ month?: string; method?: string }>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const today = todayDateString();
  const params = await searchParams;
  const monthKey =
    params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : today.slice(0, 7);

  const [accounts, categories, budget, expenses] = await Promise.all([
    getAccounts(userId, { includeArchived: true }),
    getCategories(userId),
    getMonthlyBudget(userId, monthKey),
    getExpensesWithDetails(userId, MONTH_LIMIT, monthKey),
  ]);

  return (
    <ExpensesView
      key={`${monthKey}-${params.method ?? ""}`}
      expenses={expenses}
      accounts={accounts}
      categories={categories}
      budget={budget}
      initialAccountId={
        params.method && /^\d+$/.test(params.method) ? params.method : undefined
      }
      monthKey={monthKey}
      today={today}
    />
  );
}
