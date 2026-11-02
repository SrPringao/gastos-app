import { redirect } from "next/navigation";
import { getUserWithAccess } from "@/lib/services/access";
import { getUsersActivity } from "@/lib/services/admin";
import { AdminUsersPanel } from "@/components/admin/admin-users-panel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Solo super admins; al resto se le manda al Dashboard sin revelar la seccion
  const admin = await getUserWithAccess("superAdmin");
  if (!admin) redirect("/");

  const users = await getUsersActivity();

  return (
    <div className="mx-auto flex max-w-[1120px] flex-col gap-7 px-4 pt-6 pb-16 md:px-6 md:pt-10 lg:px-12">
      <header className="flex flex-col gap-1">
        <div className="text-eb-text-tertiary text-[13px] font-semibold tracking-[0.04em] uppercase">
          Super admin
        </div>
        <h1 className="eb-title">Usuarios</h1>
        <p className="text-eb-text-tertiary text-[14px]">
          Solo actividad: cuántos gastos registran y cuándo. Sin montos ni descripciones.
        </p>
      </header>

      <AdminUsersPanel users={users} currentUserId={admin.id} />
    </div>
  );
}
