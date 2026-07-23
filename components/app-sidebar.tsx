"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboardIcon,
  CreditCardIcon,
  ReceiptIcon,
  PieChartIcon,
  FlaskConicalIcon,
  ReceiptTextIcon,
  LogOut,
  RefreshCw,
  ChevronDownIcon,
  WalletIcon,
  TrendingUpIcon,
  SettingsIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const primaryNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/gastos", label: "Gastos", icon: ReceiptIcon },
  { href: "/simulador", label: "Simulador", icon: FlaskConicalIcon },
];

const cuentasSubItems = [
  { href: "/cuentas?tab=metodos-de-pago", tab: "metodos-de-pago", label: "Metodos de pago", icon: WalletIcon },
  { href: "/cuentas?tab=patrimonio", tab: "patrimonio", label: "Patrimonio", icon: TrendingUpIcon },
];

const secondaryNavItems = [
  { href: "/gastos-fijos", label: "Gastos Fijos", icon: ReceiptTextIcon },
  { href: "/categorias", label: "Categorias", icon: PieChartIcon },
  { href: "/configuracion", label: "Configuracion", icon: SettingsIcon },
];

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isCuentasActive = pathname.startsWith("/cuentas");
  const [cuentasManuallyOpen, setCuentasManuallyOpen] = useState(false);
  const cuentasOpen = isCuentasActive || cuentasManuallyOpen;
  const activeTab = searchParams.get("tab") === "patrimonio" ? "patrimonio" : "metodos-de-pago";

  function handleRefresh() {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1500);
  }

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.refresh();
    router.push("/login");
  }

  return (
    <aside className="border-border bg-sidebar text-sidebar-foreground hidden h-screen w-64 flex-col border-r md:flex">
      <div className="flex h-14 items-center justify-between border-b px-4">
        <Link href="/" className="font-semibold">
          Gastos
        </Link>
        <Button
          variant="ghost"
          size="icon"
        onClick={handleRefresh}
        disabled={isRefreshing}
          className="shrink-0"
          title="Actualizar"
        >
          <RefreshCw
            className={`size-5 opacity-70 ${isRefreshing ? "animate-spin" : ""}`}
          />
          <span className="sr-only">Actualizar</span>
        </Button>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {primaryNavItems.map((item) => {
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
        <div className="my-2 border-t border-sidebar-border" />

        <div>
          <button
            type="button"
            onClick={() => setCuentasManuallyOpen((open) => !open)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              isCuentasActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "hover:bg-sidebar-accent/50"
            )}
          >
            <CreditCardIcon className="size-5 shrink-0 opacity-70" />
            <span className="flex-1 text-left">Cuentas</span>
            <ChevronDownIcon
              className={cn(
                "size-4 shrink-0 opacity-70 transition-transform",
                cuentasOpen && "rotate-180"
              )}
            />
          </button>
          {cuentasOpen && (
            <div className="mt-1 space-y-1 pl-4">
              {cuentasSubItems.map((item) => {
                const isActive = isCuentasActive && activeTab === item.tab;
                return (
                  <Link
                    key={item.tab}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "hover:bg-sidebar-accent/50"
                    )}
                  >
                    <item.icon className="size-4 shrink-0 opacity-70" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {secondaryNavItems.map((item) => {
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
