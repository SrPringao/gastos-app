"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { resolveMobileNavEntries, isNavItemActive, type QuickActionKind } from "@/lib/nav-config";
import { usePreferences } from "@/components/preferences-provider";
import { QuickActionOverlays } from "@/components/quick-action-overlays";

export function DashboardMain({ children }: { children: React.ReactNode }) {
  const { mobileNavHrefs } = usePreferences();
  const hasNav = resolveMobileNavEntries(mobileNavHrefs).length > 0;

  return (
    <main
      data-scrollable
      className={cn(
        "w-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain md:pb-0",
        hasNav && "pb-20"
      )}
      style={{
        WebkitOverflowScrolling: "touch",
        touchAction: "pan-y",
        overscrollBehavior: "contain",
        overscrollBehaviorY: "contain",
      }}
    >
      {children}
    </main>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const { mobileNavHrefs } = usePreferences();
  const entries = resolveMobileNavEntries(mobileNavHrefs);
  const [activeModal, setActiveModal] = useState<QuickActionKind | null>(null);

  if (entries.length === 0) return null;

  return (
    <>
      <nav className="glass-surface fixed bottom-0 left-0 right-0 z-40 flex items-stretch justify-around gap-0 border-t px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 md:hidden">
        {entries.map((entry) => {
          const itemClass = cn(
            "relative flex min-w-0 flex-1 flex-col items-center gap-0.5 overflow-hidden px-0.5 py-1.5 transition-all duration-200 active:scale-95",
            entries.length >= 5 ? "max-w-[20%]" : "max-w-none"
          );
          const labelClass =
            "block w-full truncate text-center text-[10px] leading-tight font-medium";

          if (entry.type === "action") {
            const { action } = entry;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => setActiveModal(action.kind)}
                className={cn(itemClass, "text-muted-foreground")}
              >
                <action.icon className="size-5 shrink-0" strokeWidth={2} />
                <span className={cn(labelClass, "opacity-60")}>
                  {action.mobileLabel ?? action.label}
                </span>
              </button>
            );
          }

          const { item } = entry;
          const isActive = isNavItemActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                itemClass,
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="size-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
              <span
                className={cn(
                  labelClass,
                  "transition-all duration-200",
                  isActive ? "opacity-100" : "opacity-60"
                )}
              >
                {item.mobileLabel ?? item.label}
              </span>
              {isActive && (
                <div className="bg-primary shadow-[var(--glow-violet-sm)] absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      <QuickActionOverlays
        active={activeModal}
        onClose={() => setActiveModal(null)}
      />
    </>
  );
}
