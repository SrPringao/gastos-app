import { getCurrentUserId } from "@/lib/auth";
import { getAccounts } from "@/lib/services/accounts";
import { getNetWorthEntries, getNetWorthProjections } from "@/lib/services/net-worth";
import { NetWorthView } from "@/components/net-worth/net-worth-view";
import { PatrimonioReportCard } from "@/components/net-worth/patrimonio-report-card";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export default async function PatrimonioPage({
  searchParams,
}: {
  /** `entry`: item a resaltar (link "Ver en Patrimonio" desde Cuentas) */
  searchParams: Promise<{ entry?: string }>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const { entry } = await searchParams;
  const highlightEntryId = entry && /^\d+$/.test(entry) ? Number(entry) : undefined;

  const [accounts, netWorthEntries, projections] = await Promise.all([
    getAccounts(userId),
    getNetWorthEntries(userId),
    getNetWorthProjections(userId),
  ]);

  return (
    <NetWorthView
      accounts={accounts}
      entries={netWorthEntries}
      projections={projections}
      highlightEntryId={highlightEntryId}
      footer={<PatrimonioReportCard />}
    />
  );
}
