import { getCurrentUserId } from "@/lib/auth";
import { getAccounts } from "@/lib/services/accounts";
import { getCategories } from "@/lib/services/categories";
import { AccountsCard } from "@/components/dashboard/accounts-card";
import { UnassignedCardsCard } from "@/components/dashboard/unassigned-cards-card";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export default async function CuentasPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const [accounts, categories] = await Promise.all([
    getAccounts(userId),
    getCategories(userId),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-heading-sm tracking-tight">Cuentas</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Administra tus metodos de pago
        </p>
      </div>
      <div className="space-y-6">
        <AccountsCard accounts={accounts} categories={categories} />
        <UnassignedCardsCard accounts={accounts} />
      </div>
    </div>
  );
}
