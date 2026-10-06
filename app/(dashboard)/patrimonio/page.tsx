import { getCurrentUserId } from "@/lib/auth";
import { getAccounts } from "@/lib/services/accounts";
import { getNetWorthEntries, getNetWorthProjections } from "@/lib/services/net-worth";
import { NetWorthView } from "@/components/net-worth/net-worth-view";
import { PatrimonioReportCard } from "@/components/net-worth/patrimonio-report-card";
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
    <>
      <NetWorthView accounts={accounts} entries={netWorthEntries} projections={projections} />
      <div className="mx-auto max-w-[1120px] px-4 pb-14 md:px-6 md:pb-16 lg:px-12">
        <PatrimonioReportCard />
      </div>
    </>
  );
}
