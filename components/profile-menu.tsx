"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRightIcon, LogOutIcon, MoonIcon, RefreshCwIcon, SunIcon } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { usePreferences } from "@/components/preferences-provider";
import { allMobileNavCandidates, isNavItemActive } from "@/lib/nav-config";
import { initialOf } from "@/lib/dashboard-metrics";
import { cn } from "@/lib/utils";

const rowClass =
  "flex min-h-[48px] w-full items-center gap-3 px-4 text-left text-[16px] transition-colors hover:bg-[var(--eb-fill-subtle)]";

/**
 * Avatar del header movil. Abre el perfil: navegacion completa (lo que no
 * cabe en la tab bar), tema, sincronizar, configuracion y cerrar sesion.
 */
export function ProfileMenu({ name }: { name: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = usePreferences();
  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  function handleRefresh() {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 1500);
  }

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.refresh();
    router.push("/login");
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Perfil"
          className="text-eb-text flex size-9 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold"
          style={{ background: "var(--eb-avatar-bg)" }}
        >
          {initialOf(name)}
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="text-eb-text gap-0 overflow-y-auto rounded-t-[24px] pb-[max(1rem,env(safe-area-inset-bottom))]"
        style={{ fontFamily: "var(--eb-font)" }}
      >
        <SheetHeader className="px-5 pt-5 pb-3 text-left">
          <SheetTitle className="text-[20px] font-bold tracking-[-0.02em]">{name}</SheetTitle>
          <SheetDescription className="sr-only">Navegacion, tema y sesion</SheetDescription>
        </SheetHeader>

        <nav aria-label="Secciones" className="eb-card mx-4 overflow-hidden rounded-[18px]">
          {allMobileNavCandidates.map((item) => {
            const active = isNavItemActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(rowClass, active && "text-eb-accent")}
              >
                <item.icon size={20} strokeWidth={1.8} aria-hidden="true" />
                <span className="border-eb-separator flex min-h-[48px] flex-1 items-center justify-between border-b">
                  {item.label}
                  <ChevronRightIcon size={14} strokeWidth={2.4} className="text-eb-chevron" aria-hidden="true" />
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="eb-card mx-4 mt-4 overflow-hidden rounded-[18px]">
          <button
            type="button"
            className={rowClass}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <SunIcon size={20} strokeWidth={1.8} aria-hidden="true" />
            ) : (
              <MoonIcon size={20} strokeWidth={1.8} aria-hidden="true" />
            )}
            <span className="border-eb-separator flex min-h-[48px] flex-1 items-center border-b">
              {theme === "dark" ? "Tema claro" : "Tema oscuro"}
            </span>
          </button>
          <button type="button" className={rowClass} onClick={handleRefresh} disabled={refreshing}>
            <RefreshCwIcon
              size={20}
              strokeWidth={1.8}
              className={cn(refreshing && "animate-spin")}
              aria-hidden="true"
            />
            <span className="border-eb-separator flex min-h-[48px] flex-1 items-center border-b">
              {refreshing ? "Sincronizando..." : "Sincronizar"}
            </span>
          </button>
          <button type="button" className={cn(rowClass, "text-eb-red")} onClick={handleSignOut}>
            <LogOutIcon size={20} strokeWidth={1.8} aria-hidden="true" />
            <span className="flex min-h-[48px] flex-1 items-center">Cerrar sesión</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
