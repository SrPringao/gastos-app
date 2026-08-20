"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LogOut, RefreshCw, ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { navGroups, isNavItemActive, type NavItem, type NavSubItem } from "@/lib/nav-config";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";

/** Item de nav de primer nivel: chip de icono + indicador lateral solido cuando esta activo */
function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string;
  label: string;
  icon: NavItem["icon"];
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3 rounded-2xl py-2 pr-3 pl-2.5 text-sm transition-colors",
        isActive
          ? "bg-primary/10 text-foreground"
          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full transition-all",
          isActive
            ? "bg-primary shadow-[var(--glow-violet-sm)]"
            : "bg-transparent"
        )}
      />
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-muted-foreground group-hover:text-foreground"
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className={cn(isActive && "font-medium")}>{label}</span>
    </Link>
  );
}

/** Cabecera de grupo desplegable (Cuentas, Configuracion) con el mismo lenguaje que NavLink */
function NavGroupTrigger({
  label,
  icon: Icon,
  isActive,
  isOpen,
  onToggle,
}: {
  label: string;
  icon: NavItem["icon"];
  isActive: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-2xl py-2 pr-3 pl-2.5 text-sm transition-colors",
        isActive
          ? "bg-primary/10 text-foreground"
          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full transition-all",
          isActive
            ? "bg-primary shadow-[var(--glow-violet-sm)]"
            : "bg-transparent"
        )}
      />
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-muted-foreground group-hover:text-foreground"
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className={cn("flex-1 text-left", isActive && "font-medium")}>
        {label}
      </span>
      <ChevronDownIcon
        className={cn(
          "size-3.5 shrink-0 opacity-50 transition-transform",
          isOpen && "rotate-180"
        )}
      />
    </button>
  );
}

function NavSubLink({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string;
  label: string;
  icon: NavSubItem["icon"];
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-xl py-1.5 pr-3 pl-[3.375rem] text-sm transition-colors",
        isActive
          ? "text-primary font-medium"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="size-3.5 shrink-0 opacity-70" />
      {label}
    </Link>
  );
}

function NavGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground/70 px-2.5 pt-5 pb-1.5 text-[11px] font-medium tracking-wide uppercase first:pt-0">
      {children}
    </p>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [manuallyOpen, setManuallyOpen] = useState<Record<string, boolean>>({});
  const activeTab = searchParams.get("tab") ?? undefined;

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
    <aside className="glass-surface text-sidebar-foreground fixed top-3 bottom-3 left-3 z-30 hidden w-64 flex-col overflow-hidden rounded-[30px] border md:flex">
      <div className="flex items-center justify-center border-b px-5 py-8">
        <Link href="/" className="flex items-center justify-center">
          <Logo className="h-16" />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <NavGroupLabel>{group.label}</NavGroupLabel>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = isNavItemActive(pathname, item);

                if (!item.subItems) {
                  return (
                    <NavLink
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      isActive={isActive}
                    />
                  );
                }

                const isOpen = isActive || manuallyOpen[item.label];
                return (
                  <div key={item.label}>
                    <NavGroupTrigger
                      label={item.label}
                      icon={item.icon}
                      isActive={isActive}
                      isOpen={isOpen}
                      onToggle={() =>
                        setManuallyOpen((prev) => ({
                          ...prev,
                          [item.label]: !prev[item.label],
                        }))
                      }
                    />
                    {isOpen && (
                      <div className="space-y-0.5 pb-1">
                        {item.subItems.map((sub) => (
                          <NavSubLink
                            key={sub.tab ?? sub.href}
                            href={sub.href}
                            label={sub.label}
                            icon={sub.icon}
                            isActive={
                              sub.tab
                                ? isActive && activeTab === sub.tab
                                : pathname === sub.href
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t p-3">
        <div className="mb-2 flex items-center justify-center gap-1">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="shrink-0"
            title="Actualizar"
          >
            <RefreshCw
              className={`size-4.5 opacity-70 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span className="sr-only">Actualizar</span>
          </Button>
        </div>
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-full justify-start gap-3 rounded-2xl px-2.5"
          onClick={handleSignOut}
        >
          <span className="bg-secondary flex size-7 shrink-0 items-center justify-center rounded-full">
            <LogOut className="size-4" />
          </span>
          Cerrar sesion
        </Button>
      </div>
    </aside>
  );
}
