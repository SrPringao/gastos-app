import { redirect } from "next/navigation";
import { getUserWithAccess } from "@/lib/services/access";
import { getExchangeExpenses } from "@/lib/services/exchange-expenses";
import { ExchangeView } from "@/components/exchange/exchange-view";

export const dynamic = "force-dynamic";

export default async function IntercambioPage() {
  // Funcion especial: solo si un super admin la encendio para este usuario
  const user = await getUserWithAccess("exchange");
  if (!user) redirect("/");

  const expenses = await getExchangeExpenses(user.id);
  return <ExchangeView expenses={expenses} />;
}
