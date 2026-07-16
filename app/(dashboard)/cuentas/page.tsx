import { getCurrentUserId } from "@/lib/auth";
import { getAccounts } from "@/lib/services/accounts";
import { getCategories } from "@/lib/services/categories";
import { getNetWorthEntries, getNetWorthProjections } from "@/lib/services/net-worth";
import { CuentasTabs } from "@/components/cuentas-tabs";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export default async function CuentasPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const [accounts, categories, netWorthEntries, projections] = await Promise.all([
    getAccounts(userId),
    getCategories(userId),
    getNetWorthEntries(userId),
    getNetWorthProjections(userId),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Cuentas</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Administra tus metodos de pago y tu patrimonio
        </p>
      </div>
      <CuentasTabs
        accounts={accounts}
        categories={categories}
        netWorthEntries={netWorthEntries}
        projections={projections}
      />
    </div>
  );
}
