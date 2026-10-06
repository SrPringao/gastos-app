import { getCurrentUserId } from "@/lib/auth";
import { ThemePreference } from "@/components/preferences/theme-preference";
import { MobileNavPreference } from "@/components/preferences/mobile-nav-preference";
import { ContactsManager, type ManagedContact } from "@/components/preferences/contacts-manager";
import { getContacts } from "@/lib/services/contacts";
import { getNetWorthEntries } from "@/lib/services/net-worth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PreferenciasPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const [contacts, entries] = await Promise.all([
    getContacts(userId, { includeArchived: true }),
    getNetWorthEntries(userId),
  ]);
  // Activas primero; archivadas al final
  const managed: ManagedContact[] = contacts
    .map((c) => {
      const own = entries.filter((e) => e.contactId === c.id);
      return {
        id: c.id,
        name: c.name,
        archived: !!c.archivedAt,
        entries: own.length,
        balance: own.reduce((sum, e) => sum + e.amount, 0),
      };
    })
    .sort((a, b) => Number(a.archived) - Number(b.archived) || a.name.localeCompare(b.name, "es-MX"));

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="eb-title">Preferencias</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Ajustes personales de la app, guardados en tu cuenta
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ThemePreference />
        <MobileNavPreference />
        <ContactsManager contacts={managed} />
      </div>
    </div>
  );
}
