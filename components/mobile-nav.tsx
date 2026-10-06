"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  allMobileNavCandidates,
  isNavItemActive,
  resolveTabBarEntries,
  type MobileNavEntry,
  type QuickActionKind,
} from "@/lib/nav-config";
import { usePreferences } from "@/components/preferences-provider";
import { QuickActionOverlays } from "@/components/quick-action-overlays";
import { MobileHeader } from "@/components/mobile-header";

/** Alto de la tab bar: 84px incluyendo el safe area inferior */
const TAB_BAR_HEIGHT = "max(84px, calc(50px + env(safe-area-inset-bottom)))";

/** Pantallas con su propio MobileHeader (titulo grande + accion derecha) */
const ROUTES_WITH_OWN_HEADER = new Set(["/", "/gastos", "/cuentas", "/patrimonio"]);

export function DashboardMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // El resto de pantallas recibe el mismo header flotante, solo con el boton de menu
  const genericTitle = ROUTES_WITH_OWN_HEADER.has(pathname)
    ? null
    : (allMobileNavCandidates.find((item) => isNavItemActive(pathname, item))?.label ?? "ExpenseBro");

  return (
    <main
      data-scrollable
      className="w-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain pb-[var(--eb-tabbar-h)] md:pb-0"
      style={
        {
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-y",
          overscrollBehavior: "contain",
          overscrollBehaviorY: "contain",
          "--eb-tabbar-h": TAB_BAR_HEIGHT,
        } as React.CSSProperties
      }
    >
      {genericTitle && <MobileHeader title={genericTitle} inset={false} />}
      {children}
    </main>
  );
}

function TabItem({
  entry,
  pathname,
  onAction,
}: {
  entry: MobileNavEntry;
  pathname: string;
  onAction: (kind: QuickActionKind) => void;
}) {
  const itemClass =
    "flex min-h-11 min-w-0 flex-col items-center gap-[3px] text-[10px] font-medium transition-colors";

  if (entry.type === "action") {
    const { action } = entry;
    return (
      <button
        type="button"
        onClick={() => onAction(action.kind)}
        className={cn(itemClass, "text-[#8E8E93]")}
      >
        <action.icon size={24} strokeWidth={1.8} aria-hidden="true" />
        <span className="w-full truncate text-center">{action.mobileLabel ?? action.label}</span>
      </button>
    );
  }

  const { item } = entry;
  const isActive = isNavItemActive(pathname, item);
  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={cn(itemClass, isActive ? "text-eb-accent" : "text-[#8E8E93]")}
    >
      <item.icon size={24} strokeWidth={1.8} aria-hidden="true" />
      <span className="w-full truncate text-center">{item.mobileLabel ?? item.label}</span>
    </Link>
  );
}

/**
 * Tab bar movil (seccion 3.11): 2 pestañas, boton + central, 2 pestañas.
 * Las pestañas salen de la preferencia "Menu rapido" (o del default).
 */
export function MobileNav() {
  const pathname = usePathname();
  const { mobileNavHrefs } = usePreferences();
  const entries = resolveTabBarEntries(mobileNavHrefs);
  const [activeModal, setActiveModal] = useState<QuickActionKind | null>(null);
  const half = Math.ceil(entries.length / 2);
  const left = entries.slice(0, half);
  const right = entries.slice(half);

  return (
    <>
      <nav
        aria-label="Pestañas"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 items-start px-2.5 pt-2 md:hidden"
        style={{
          height: TAB_BAR_HEIGHT,
          paddingBottom: "env(safe-area-inset-bottom)",
          background: "var(--eb-tabbar-bg)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid var(--eb-tabbar-border)",
          fontFamily: "var(--eb-font)",
        }}
      >
        {[0, 1].map((i) =>
          left[i] ? (
            <TabItem key={i} entry={left[i]} pathname={pathname} onAction={setActiveModal} />
          ) : (
            <span key={i} />
          )
        )}
        <div className="flex justify-center">
          <button
            type="button"
            aria-label="Nuevo gasto"
            onClick={() => setActiveModal("add-expense")}
            className="eb-btn-primary -mt-[14px] flex size-[52px] items-center justify-center rounded-full"
            style={{
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,.35), 0 10px 24px -6px var(--eb-accent-glow)",
            }}
          >
            <PlusIcon size={24} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </div>
        {[0, 1].map((i) =>
          right[i] ? (
            <TabItem key={i + 2} entry={right[i]} pathname={pathname} onAction={setActiveModal} />
          ) : (
            <span key={i + 2} />
          )
        )}
      </nav>

      <QuickActionOverlays active={activeModal} onClose={() => setActiveModal(null)} />
    </>
  );
}
