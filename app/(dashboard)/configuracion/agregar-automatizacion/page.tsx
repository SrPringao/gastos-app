import { getCurrentUserId } from "@/lib/auth";
import { listApiTokens } from "@/lib/api-tokens";
import { ApiTokensManager } from "@/components/api-tokens-manager";
import { InstallShortcutBanner } from "@/components/install-shortcut-banner";
import { PushNotificationsCard } from "@/components/push-notifications-card";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AgregarAutomatizacionPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const tokens = await listApiTokens(userId);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          Agregar automatizacion
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Administra tus tokens de acceso para Atajos y automatizaciones
        </p>
      </div>
      <PushNotificationsCard />
      <InstallShortcutBanner />
      <ApiTokensManager
        initialTokens={tokens.map((t) => ({
          ...t,
          createdAt: t.createdAt.toISOString(),
          expiresAt: t.expiresAt.toISOString(),
          revokedAt: t.revokedAt ? t.revokedAt.toISOString() : null,
        }))}
      />
    </div>
  );
}
