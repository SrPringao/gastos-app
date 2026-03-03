"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboardIcon,
  CreditCardIcon,
  ReceiptIcon,
  PieChartIcon,
  FlaskConicalIcon,
  ReceiptTextIcon,
  LogOut,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/cuentas", label: "Cuentas", icon: CreditCardIcon },
  { href: "/gastos", label: "Gastos", icon: ReceiptIcon },
  { href: "/gastos-fijos", label: "Gastos Fijos", icon: ReceiptTextIcon },
  { href: "/categorias", label: "Categorias", icon: PieChartIcon },
  { href: "/simulador", label: "Simulador", icon: FlaskConicalIcon },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.refresh();
    router.push("/login");
  }

  return (
    <aside className="border-border bg-sidebar text-sidebar-foreground hidden h-screen w-64 flex-col border-r md:flex">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="font-semibold">
          Gastos
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className="size-5 shrink-0 opacity-70" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="size-5 shrink-0 opacity-70" />
          Cerrar sesion
        </Button>
      </div>
    </aside>
  );
}
