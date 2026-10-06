"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { MoonIcon, RefreshCw, SunIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { SidebarNav, SignOutRow, useSessionActions } from "@/components/app-sidebar";
import { useMobileMenu } from "@/components/mobile-menu-context";
import { useIsMobile, useMediaQuery } from "@/hooks/use-media-query";

/** Distancia minima del swipe a la izquierda para cerrar el panel */
const SWIPE_CLOSE_PX = 60;

/** Curva tipo iOS; 300ms al abrir, 240ms al cerrar */
const EASE = "cubic-bezier(.32,.72,0,1)";
const OPEN_MS = 300;
const CLOSE_MS = 240;

/**
 * Estado abierto/cerrado inline (no en globals.css): el panel siempre esta
 * montado, asi que si sus reglas no cargaran quedaria visible encima de
 * todo. visibility espera a que termine la salida para ocultarlo.
 */
function overlayStyle(open: boolean, reduceMotion: boolean): React.CSSProperties {
  return {
    background: "rgba(0,0,0,0.45)",
    touchAction: "none",
    opacity: open ? 1 : 0,
    pointerEvents: open ? "auto" : "none",
    willChange: "opacity",
    transition: reduceMotion ? "none" : `opacity ${open ? OPEN_MS : CLOSE_MS}ms ease`,
  };
}

function panelMotionStyle(open: boolean, reduceMotion: boolean): React.CSSProperties {
  return {
    transform: open ? "translate3d(0,0,0)" : "translate3d(calc(-100% - 16px),0,0)",
    visibility: open ? "visible" : "hidden",
    willChange: "transform",
    transition: reduceMotion
      ? "none"
      : open
        ? `transform ${OPEN_MS}ms ${EASE}, visibility 0s`
        : `transform ${CLOSE_MS}ms ${EASE}, visibility 0s linear ${CLOSE_MS}ms`,
  };
}

/** Elementos enfocables dentro del panel (para atrapar el foco con Tab) */
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Menu lateral movil (Phone-Menu.dc.html): panel flotante con las mismas
 * secciones, estilos y estado activo del sidebar de escritorio.
 *
 * El panel y el overlay estan SIEMPRE montados y abrir/cerrar solo cambia
 * su transform/opacity con una transicion CSS (la resuelve la GPU). Montarlo
 * al abrir (Radix Dialog) se comia los primeros cuadros y la animacion se
 * veia como un salto; desmontarlo al cerrar trababa el final.
 *
 * Por eso el foco atrapado, Escape y devolver el foco al boton se hacen
 * aqui. El scroll no necesita bloqueo extra: el body ya es overflow hidden
 * en movil y el overlay (fuera de <main>) recibe los gestos.
 */
export function MobileMenu() {
  const { open, setOpen } = useMobileMenu();
  const { theme, toggleTheme, isRefreshing, handleRefresh, handleSignOut } = useSessionActions();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const isMobile = useIsMobile();
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Navegar cierra el menu
  useEffect(() => {
    setOpen(false);
  }, [pathname, query, setOpen]);

  // El menu solo existe en movil: al pasar a escritorio se cierra
  useEffect(() => {
    if (!isMobile) setOpen(false);
  }, [isMobile, setOpen]);

  // Abierto: foco al boton cerrar, Escape cierra y Tab no sale del panel.
  // Al cerrar, el foco vuelve a donde estaba (el boton de menu).
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !panelRef.current.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panelRef.current.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus({ preventScroll: true });
    };
  }, [open, setOpen]);

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
    <>
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-50 md:hidden"
        style={overlayStyle(open, reduceMotion)}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menú"
        inert={!open}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        className="text-eb-text fixed bottom-6 left-[10px] z-50 flex w-[286px] flex-col overflow-hidden rounded-[30px] outline-none md:hidden"
        style={{
          top: "calc(env(safe-area-inset-top) + 8px)",
          background: "var(--eb-menu-panel-bg)",
          border: "1px solid var(--eb-menu-panel-border)",
          boxShadow: "var(--eb-menu-panel-shadow)",
          fontFamily: "var(--eb-font)",
          touchAction: "pan-y",
          ...panelMotionStyle(open, reduceMotion),
        }}
      >
        <div className="border-eb-separator flex h-24 flex-none items-center justify-between border-b pr-4 pl-[22px]">
          <Link href="/" className="flex items-center">
            <Logo className="h-[54px] w-[70px] object-contain" />
            <span className="sr-only">ExpenseBro</span>
          </Link>
          <button
            ref={closeRef}
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
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
          </button>
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
      </div>
    </>
  );
}
