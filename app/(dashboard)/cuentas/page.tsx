import { getAccounts } from "@/lib/services/accounts";
import { getCategories } from "@/lib/services/categories";
import { AccountsCard } from "@/components/dashboard/accounts-card";

export const dynamic = "force-dynamic";
export default async function CuentasPage() {
  const [accounts, categories] = await Promise.all([
    getAccounts(),
    getCategories(),
  ]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Cuentas</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Administra tus metodos de pago
        </p>
      </div>
      <AccountsCard accounts={accounts} categories={categories} />
    </div>
  );
}
