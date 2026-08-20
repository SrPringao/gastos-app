"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ZapIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  isNavItemActive,
  resolveDesktopQuickEntries,
  type QuickActionKind,
} from "@/lib/nav-config";
import { usePreferences } from "@/components/preferences-provider";
import { QuickActionOverlays } from "@/components/quick-action-overlays";

/**
 * Atajo de escritorio: un rayo fijo abajo a la derecha. Al hover (o foco)
 * abre un panel con las funciones rapidas / la lista configurada.
 */
export function DesktopQuickMenu() {
  const pathname = usePathname();
  const { mobileNavHrefs } = usePreferences();
  const entries = resolveDesktopQuickEntries(mobileNavHrefs);
  const [open, setOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<QuickActionKind | null>(null);
  const closeTimer = useRef<number | null>(null);
  const menuId = useId();

  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  function cancelClose() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), 160);
  }

  if (entries.length === 0) return null;

  return (
    <>
      <div
        className="fixed right-6 bottom-6 z-40 hidden md:block"
        onMouseEnter={() => {
          cancelClose();
          setOpen(true);
        }}
        onMouseLeave={scheduleClose}
        onFocusCapture={() => {
          cancelClose();
          setOpen(true);
        }}
        onBlurCapture={(event) => {
          const next = event.relatedTarget;
          if (next instanceof Node && event.currentTarget.contains(next)) return;
          scheduleClose();
        }}
      >
        <div
          id={menuId}
          role="menu"
          aria-hidden={!open}
          className={cn(
            "glass-surface absolute right-0 bottom-[4.25rem] flex w-56 origin-bottom-right flex-col gap-0.5 rounded-[20px] border p-1.5 shadow-[var(--glow-violet-lg)] transition-[transform,opacity,filter] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
            open
              ? "pointer-events-auto scale-100 opacity-100 blur-0"
              : "pointer-events-none scale-90 opacity-0 blur-sm"
          )}
        >
          {entries.map((entry) => {
            if (entry.type === "action") {
              const { action } = entry;
              return (
                <button
                  key={action.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    setActiveModal(action.kind);
                  }}
                  className="hover:bg-secondary/70 flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors"
                >
                  <span className="bg-secondary text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
                    <action.icon className="size-4" />
                  </span>
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              );
            }

            const { item } = entry;
            const isActive = isNavItemActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors",
                  isActive
                    ? "bg-primary/10 text-foreground"
                    : "text-foreground hover:bg-secondary/70"
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  <item.icon className="size-4" />
                </span>
                <span className={cn("text-sm", isActive && "font-medium")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          aria-label="Menu rapido"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((current) => !current)}
          className={cn(
            "bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-full shadow-[var(--glow-violet-lg)] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105 focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none",
            open && "scale-105"
          )}
        >
          <ZapIcon
            className={cn(
              "size-5 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
              open && "rotate-12"
            )}
          />
        </button>
      </div>

      <QuickActionOverlays
        active={activeModal}
        onClose={() => setActiveModal(null)}
      />
    </>
  );
}
