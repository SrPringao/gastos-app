"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LogOut, RefreshCw, ChevronDownIcon, MoonIcon, SunIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { navGroups, isNavItemActive, type NavItem, type NavSubItem } from "@/lib/nav-config";
import { usePreferences } from "@/components/preferences-provider";
import { Logo } from "@/components/logo";

/**
 * Sidebar de escritorio en el lenguaje "Apple dark": superficie de tarjeta,
 * tiles cuadrados estilo Ajustes de iOS (neutros; el activo con el
 * degradado indigo del acento), pill activa con tinte indigo e indicador
 * lateral.
 */

const rowBase =
  "group relative flex items-center gap-3 rounded-[12px] py-[7px] pr-3 pl-2.5 text-[14px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--eb-accent)]";

function rowState(isActive: boolean) {
  return isActive
    ? "text-eb-text font-semibold"
    : "text-eb-text-secondary hover:bg-[var(--eb-fill-subtle)] hover:text-eb-text";
}

const activeRowStyle = {
  background: "rgba(94,107,255,0.12)",
  boxShadow: "inset 0 0 0 1px rgba(94,107,255,0.14)",
};

/** Tile de icono: neutro en reposo, degradado del acento cuando esta activo */
function NavTile({ icon: Icon, isActive }: { icon: NavItem["icon"]; isActive: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-[8px] transition-colors",
        isActive ? "text-white" : "text-eb-text-secondary group-hover:text-eb-text"
      )}
      style={
        isActive
          ? {
              background: "linear-gradient(180deg, var(--eb-accent-light), var(--eb-accent))",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 4px 10px -4px var(--eb-accent-glow)",
            }
          : {
              background: "var(--eb-neutral-tile)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
            }
      }
    >
      <Icon size={16} strokeWidth={2} />
    </span>
  );
}

/** Indicador lateral de la fila activa */
function ActiveBar({ isActive }: { isActive: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="absolute top-1/2 left-0 h-4 w-[3px] -translate-y-1/2 rounded-full transition-all"
      style={
        isActive
          ? {
              background: "linear-gradient(180deg, var(--eb-accent-light), var(--eb-accent))",
              boxShadow: "0 0 8px var(--eb-accent-glow)",
            }
          : { background: "transparent" }
      }
    />
  );
}

/** Item de nav de primer nivel */
function NavLink({
  href,
  label,
  icon,
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
      aria-current={isActive ? "page" : undefined}
      className={cn(rowBase, rowState(isActive))}
      style={isActive ? activeRowStyle : undefined}
    >
      <ActiveBar isActive={isActive} />
      <NavTile icon={icon} isActive={isActive} />
      <span>{label}</span>
    </Link>
  );
}

/** Cabecera de grupo desplegable (Configuracion) con el mismo lenguaje que NavLink */
function NavGroupTrigger({
  label,
  icon,
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
      aria-expanded={isOpen}
      className={cn(rowBase, "w-full", rowState(isActive))}
      style={isActive ? activeRowStyle : undefined}
    >
      <ActiveBar isActive={isActive} />
      <NavTile icon={icon} isActive={isActive} />
      <span className="flex-1 text-left">{label}</span>
      <ChevronDownIcon
        size={14}
        strokeWidth={2.4}
        className={cn("text-eb-chevron shrink-0 transition-transform", isOpen && "rotate-180")}
        aria-hidden="true"
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
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-[10px] py-1.5 pr-3 pl-[3.25rem] text-[13px] transition-colors",
        isActive
          ? "text-eb-link font-semibold"
          : "text-eb-text-tertiary hover:bg-[var(--eb-fill-subtle)] hover:text-eb-text"
      )}
    >
      <Icon size={14} strokeWidth={2} className="shrink-0" aria-hidden="true" />
      {label}
    </Link>
  );
}

function NavGroupLabel({ first, children }: { first: boolean; children: React.ReactNode }) {
  return (
    <p
      className={cn(
        "text-eb-text-tertiary px-2.5 pb-1.5 text-[11px] font-semibold tracking-[0.04em] uppercase",
        first ? "pt-0" : "pt-5"
      )}
    >
      {children}
    </p>
  );
}

/** Boton circular de vidrio (tema, sincronizar), como el ojo de saldos */
function GlassButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="text-eb-text-muted hover:text-eb-text flex size-8 items-center justify-center rounded-full transition-colors disabled:opacity-60"
      style={{ background: "var(--eb-glass-strong)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}
    >
      {children}
    </button>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme, setTheme } = usePreferences();
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
    <aside
      className="eb-card text-eb-text fixed top-3 bottom-3 left-3 z-30 hidden w-64 flex-col overflow-hidden rounded-[26px] md:flex"
      style={{ fontFamily: "var(--eb-font)" }}
    >
      <div className="border-eb-separator flex items-center justify-center border-b px-5 py-8">
        <Link href="/" className="flex items-center justify-center">
          <Logo className="h-16" />
          <span className="sr-only">ExpenseBro</span>
        </Link>
      </div>

      <nav aria-label="Principal" className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group, groupIndex) => (
          <div key={group.label}>
            <NavGroupLabel first={groupIndex === 0}>{group.label}</NavGroupLabel>
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
                      <div className="space-y-0.5 pt-0.5 pb-1">
                        {item.subItems.map((sub) => (
                          <NavSubLink
                            key={sub.tab ?? sub.href}
                            href={sub.href}
                            label={sub.label}
                            icon={sub.icon}
                            isActive={
                              sub.tab ? isActive && activeTab === sub.tab : pathname === sub.href
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

      <div className="border-eb-separator border-t p-3">
        <div className="mb-2 flex items-center justify-center gap-2">
          <GlassButton
            label={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <SunIcon size={16} strokeWidth={2} /> : <MoonIcon size={16} strokeWidth={2} />}
          </GlassButton>
          <GlassButton label="Sincronizar" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw size={16} strokeWidth={2} className={cn(isRefreshing && "animate-spin")} />
          </GlassButton>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className={cn(rowBase, "text-eb-text-secondary w-full hover:bg-[rgba(255,105,97,0.1)] hover:text-eb-red")}
        >
          <span
            aria-hidden="true"
            className="flex size-7 shrink-0 items-center justify-center rounded-[8px]"
            style={{ background: "var(--eb-neutral-tile)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}
          >
            <LogOut size={16} strokeWidth={2} />
          </span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
