import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { getPaymentMethodsCatalog } from "@/lib/payment-methods";
import { getUnassignedCardGroups } from "@/lib/services/card-name-mappings";
import { todayDateString } from "@/lib/utils/dates";
import { AccountsPage } from "@/components/payment-methods/accounts-page";

export const dynamic = "force-dynamic";

export default async function CuentasPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const monthKey = todayDateString().slice(0, 7);
  const [items, unassigned] = await Promise.all([
    getPaymentMethodsCatalog(userId, monthKey),
    getUnassignedCardGroups(userId),
  ]);

  const [y, m] = monthKey.split("-").map(Number);
  const monthShort = new Date(Date.UTC(y, m - 1, 15))
    .toLocaleDateString("es-MX", { month: "short", timeZone: "UTC" })
    .replace(".", "");

  return (
    <AccountsPage
      items={items}
      // Nombres que llegaron del atajo sin metodo: se sugieren al agregar un nombre de Wallet
      suggestions={unassigned.map((u) => u.rawCardName)}
      monthShort={monthShort}
    />
  );
}
