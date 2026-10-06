"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Dialog } from "radix-ui";
import { MoonIcon, RefreshCw, SunIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { SidebarNav, SignOutRow, useSessionActions } from "@/components/app-sidebar";
import { useMobileMenu } from "@/components/mobile-menu-context";
import { useIsMobile } from "@/hooks/use-media-query";

/** Distancia minima del swipe a la izquierda para cerrar el panel */
const SWIPE_CLOSE_PX = 60;

/**
 * Contenido de la app que queda detras del menu movil: mientras esta
 * abierto se reduce y desplaza (solo < 768px, ver globals.css).
 */
export function MobileMenuStage({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { open } = useMobileMenu();
  return (
    <div className={cn("eb-menu-stage", className)} data-menu-open={open}>
      {children}
    </div>
  );
}

/**
 * Menu lateral movil (Phone-Menu.dc.html): panel flotante con las mismas
 * secciones, estilos y estado activo del sidebar de escritorio. Radix Dialog
 * aporta role="dialog", aria-modal, foco atrapado, Escape y bloqueo del scroll.
 */
export function MobileMenu() {
  const { open, setOpen } = useMobileMenu();
  const { theme, toggleTheme, isRefreshing, handleRefresh, handleSignOut } = useSessionActions();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const isMobile = useIsMobile();
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  // Navegar cierra el menu
  useEffect(() => {
    setOpen(false);
  }, [pathname, query, setOpen]);

  // El menu solo existe en movil: al pasar a escritorio se cierra
  useEffect(() => {
    if (!isMobile) setOpen(false);
  }, [isMobile, setOpen]);

  function onPointerDown(e: React.PointerEvent) {
    swipeStart.current = { x: e.clientX, y: e.clientY };
  }

  function onPointerMove(e: React.PointerEvent) {
    const start = swipeStart.current;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (dx < -SWIPE_CLOSE_PX && Math.abs(dx) > Math.abs(dy)) {
      swipeStart.current = null;
      setOpen(false);
    }
  }

  function onPointerEnd() {
    swipeStart.current = null;
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="eb-menu-overlay fixed inset-0 z-50 md:hidden"
          style={{ background: "rgba(0,0,0,0.45)" }}
        />
        <Dialog.Content
          aria-modal="true"
          aria-describedby={undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          className="eb-menu-panel text-eb-text fixed bottom-6 left-[10px] z-50 flex w-[286px] flex-col overflow-hidden rounded-[30px] outline-none md:hidden"
          style={{
            top: "calc(env(safe-area-inset-top) + 8px)",
            background: "var(--eb-menu-panel-bg)",
            border: "1px solid var(--eb-menu-panel-border)",
            boxShadow: "var(--eb-menu-panel-shadow)",
            fontFamily: "var(--eb-font)",
            touchAction: "pan-y",
          }}
        >
          <Dialog.Title className="sr-only">Menú</Dialog.Title>

          <div className="border-eb-separator flex h-24 flex-none items-center justify-between border-b pr-4 pl-[22px]">
            <Link href="/" className="flex items-center">
              <Logo className="h-[54px] w-[70px] object-contain" />
              <span className="sr-only">ExpenseBro</span>
            </Link>
            <Dialog.Close
              aria-label="Cerrar menú"
              className="text-eb-text-muted flex size-9 items-center justify-center rounded-full"
              style={{ background: "var(--eb-glass-strong)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)" }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </Dialog.Close>
          </div>

          <SidebarNav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4" />

          <div className="border-eb-separator flex flex-none items-center justify-between border-t px-3 pt-3 pb-4">
            <SignOutRow onSignOut={handleSignOut} />
            <div className="flex gap-1">
              <button
                type="button"
                aria-label={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
                onClick={toggleTheme}
                className="text-eb-text-muted hover:text-eb-text flex size-11 items-center justify-center rounded-full transition-colors"
              >
                {theme === "dark" ? (
                  <SunIcon size={20} strokeWidth={1.8} aria-hidden="true" />
                ) : (
                  <MoonIcon size={20} strokeWidth={1.8} aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                aria-label="Sincronizar"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-eb-text-muted hover:text-eb-text flex size-11 items-center justify-center rounded-full transition-colors disabled:opacity-60"
              >
                <RefreshCw
                  size={20}
                  strokeWidth={1.8}
                  className={cn(isRefreshing && "animate-spin")}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
