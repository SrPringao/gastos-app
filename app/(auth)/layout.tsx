import { redirect } from "next/navigation";
import { resolveAuthRouteAccess } from "@/lib/auth";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await resolveAuthRouteAccess();
  if (access === "authenticated") {
    redirect("/");
  }
  if (access === "stale") {
    redirect("/api/auth/signout?next=/login");
  }

  return (
    <div className="bg-background relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Wash suave de marca detras del panel: apenas insinuado, para que el
          bloque de gradiente solido del panel (arriba) sea el unico lugar
          donde el color realmente se compromete. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 size-[24rem] rounded-full opacity-[0.08] blur-3xl"
        style={{ background: "var(--gradient-signal)" }}
      />
      <div className="relative w-full max-w-sm">{children}</div>
    </div>
  );
}
