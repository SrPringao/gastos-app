import { getCurrentUserId } from "@/lib/auth";
import { getAccounts } from "@/lib/services/accounts";
import { getNetWorthEntries, getNetWorthProjections } from "@/lib/services/net-worth";
import { NetWorthCard } from "@/components/net-worth/net-worth-card";
import { NetWorthSimulator } from "@/components/net-worth/net-worth-simulator";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export default async function PatrimonioPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const [accounts, netWorthEntries, projections] = await Promise.all([
    getAccounts(userId),
    getNetWorthEntries(userId),
    getNetWorthProjections(userId),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-heading-sm tracking-tight">Patrimonio</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Tus activos, deudas y proyeccion de patrimonio neto
        </p>
      </div>
      <div className="space-y-6">
        <NetWorthCard accounts={accounts} entries={netWorthEntries} />
        <NetWorthSimulator entries={netWorthEntries} projections={projections} />
      </div>
    </div>
  );
}
