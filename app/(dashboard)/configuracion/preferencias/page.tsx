import { getCurrentUserId } from "@/lib/auth";
import { ThemePreference } from "@/components/preferences/theme-preference";
import { MobileNavPreference } from "@/components/preferences/mobile-nav-preference";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PreferenciasPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-heading-sm tracking-tight">Preferencias</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Ajustes personales de la app, guardados en tu cuenta
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ThemePreference />
        <MobileNavPreference />
      </div>
    </div>
  );
}
