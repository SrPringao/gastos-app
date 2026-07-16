"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountsCard } from "@/components/dashboard/accounts-card";
import { NetWorthCard } from "@/components/net-worth/net-worth-card";
import { NetWorthSimulator } from "@/components/net-worth/net-worth-simulator";
import type { Account, Category, NetWorthEntry, NetWorthProjection } from "@/lib/db/schema";

type CuentasTabsProps = {
  accounts: Account[];
  categories: Category[];
  netWorthEntries: NetWorthEntry[];
  projections: NetWorthProjection[];
};

export function CuentasTabs({
  accounts,
  categories,
  netWorthEntries,
  projections,
}: CuentasTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "patrimonio" ? "patrimonio" : "metodos-de-pago";

  function handleTabChange(value: string) {
    router.replace(`/cuentas?tab=${value}`, { scroll: false });
  }

  return (
    <Tabs value={tab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="metodos-de-pago">Metodos de pago</TabsTrigger>
        <TabsTrigger value="patrimonio">Patrimonio</TabsTrigger>
      </TabsList>
      <TabsContent value="metodos-de-pago" className="mt-6">
        <AccountsCard accounts={accounts} categories={categories} />
      </TabsContent>
      <TabsContent value="patrimonio" className="mt-6 space-y-6">
        <NetWorthCard accounts={accounts} entries={netWorthEntries} />
        <NetWorthSimulator entries={netWorthEntries} projections={projections} />
      </TabsContent>
    </Tabs>
  );
}
