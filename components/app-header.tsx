"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MenuIcon, LogOut, RefreshCw, LayoutDashboardIcon, CreditCardIcon, ReceiptIcon, PieChartIcon, FlaskConicalIcon, ReceiptTextIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const primaryNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/gastos", label: "Gastos", icon: ReceiptIcon },
  { href: "/simulador", label: "Simulador", icon: FlaskConicalIcon },
];

const secondaryNavItems = [
  { href: "/cuentas", label: "Cuentas", icon: CreditCardIcon },
  { href: "/gastos-fijos", label: "Gastos Fijos", icon: ReceiptTextIcon },
  { href: "/categorias", label: "Categorias", icon: PieChartIcon },
];

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    <header className="border-border bg-background flex h-14 items-center justify-between border-b px-4 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0">
            <MenuIcon className="size-5" />
            <span className="sr-only">Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <div className="flex h-full flex-col">
            <SheetHeader className="border-b p-6">
              <SheetTitle className="text-left">
                <Link href="/" className="text-xl font-bold" onClick={() => setOpen(false)}>
                  Gastos
                </Link>
              </SheetTitle>
            </SheetHeader>
            <nav className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-col gap-1">
                {primaryNavItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "size-5 shrink-0 transition-transform group-hover:scale-110",
                          isActive && "text-primary"
                        )}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      <span className="flex-1">{item.label}</span>
                      {isActive && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                      {!isActive && (
                        <ChevronRightIcon className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
                      )}
                    </Link>
                  );
                })}
                <div className="my-2 border-t border-border" />
                {secondaryNavItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "size-5 shrink-0 transition-transform group-hover:scale-110",
                          isActive && "text-primary"
                        )}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      <span className="flex-1">{item.label}</span>
                      {isActive && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                      {!isActive && (
                        <ChevronRightIcon className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </nav>
            <div className="border-t p-4">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 rounded-xl px-4 py-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="size-5 shrink-0" />
                <span className="font-medium">Cerrar sesion</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
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
          className={`size-5 ${isRefreshing ? "animate-spin" : ""}`}
        />
        <span className="sr-only">Actualizar</span>
      </Button>
    </header>
  );
}
