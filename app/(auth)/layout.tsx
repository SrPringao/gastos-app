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
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
