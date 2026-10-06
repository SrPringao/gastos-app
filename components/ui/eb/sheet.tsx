"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

/**
 * Hoja tipo iOS para los modales de Patrimonio y Presupuesto
 * (expensebro-modales-prompt.md, seccion 1). En movil sube desde abajo y la
 * pagina de atras se reduce (hoja apilada); en escritorio es una ventana
 * centrada de 480px. Barra superior Cancelar · Titulo · Accion.
 *
 * Posicion y animacion van inline (no en globals.css) para no depender de
 * que el CSS global se recompile. Solo se animan transform y opacity.
 */

const EASE = "cubic-bezier(.32,.72,0,1)";
const MOBILE_MS = 320;
const DESKTOP_MS = 200;
/** Distancia o velocidad (px/ms) del swipe hacia abajo que cierra la hoja */
const SWIPE_CLOSE_PX = 120;
const SWIPE_CLOSE_VELOCITY = 0.6;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Phase = "closed" | "entering" | "open" | "closing";

// Pila de capas abiertas (hojas y action sheets): Escape y el foco atrapado
// solo aplican a la de hasta arriba.
const layerStack: string[] = [];
function pushLayer(id: string) {
  layerStack.push(id);
}
function removeLayer(id: string) {
  const i = layerStack.lastIndexOf(id);
  if (i >= 0) layerStack.splice(i, 1);
}
function isTopLayer(id: string) {
  return layerStack[layerStack.length - 1] === id;
}

/** Monta, anima la entrada en el siguiente cuadro y desmonta al terminar la salida */
function usePresence(open: boolean, durationMs: number) {
  const [state, setState] = useState<{ phase: Phase; open: boolean }>({
    phase: open ? "entering" : "closed",
    open,
  });

  // Ajuste durante el render (no en un efecto) cuando cambia `open`
  if (state.open !== open) {
    const phase: Phase = open
      ? state.phase === "open"
        ? "open"
        : "entering"
      : state.phase === "closed"
        ? "closed"
        : "closing";
    setState({ phase, open });
  }

  useEffect(() => {
    if (state.phase === "entering") {
      // Dos cuadros: el primero pinta la hoja fuera de pantalla, el segundo
      // arranca la transicion (si no, el navegador salta directo al final)
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setState((s) => (s.open ? { ...s, phase: "open" } : s)));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }
    if (state.phase === "closing") {
      const timer = window.setTimeout(
        () => setState((s) => (s.open ? s : { ...s, phase: "closed" })),
        durationMs
      );
      return () => window.clearTimeout(timer);
    }
  }, [state.phase, durationMs]);

  return state.phase;
}

/** Foco atrapado con Tab dentro de `container` mientras sea la capa de arriba */
function trapTab(e: KeyboardEvent, container: HTMLElement | null) {
  if (e.key !== "Tab" || !container) return;
  const items = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null
  );
  if (items.length === 0) {
    e.preventDefault();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (e.shiftKey && (active === first || !container.contains(active))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (active === last || !container.contains(active))) {
    e.preventDefault();
    first.focus();
  }
}

/**
 * Hoja apilada de iOS: la pagina (.eb-page) se reduce a 0.94 con esquinas
 * de 14px y opacidad .55 sobre fondo negro. Solo movil y solo la primera hoja.
 */
function useStackedPage(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const page = document.querySelector<HTMLElement>(".eb-page");
    if (!page) return;
    const html = document.documentElement;
    const prev = {
      htmlBg: html.style.background,
      bodyBg: document.body.style.background,
    };
    html.style.background = "#000";
    document.body.style.background = "#000";
    page.style.transition = `transform ${MOBILE_MS}ms ${EASE}, opacity ${MOBILE_MS}ms ${EASE}, border-radius ${MOBILE_MS}ms ${EASE}`;
    page.style.transformOrigin = "50% 0";
    page.style.transform = "translate3d(0, calc(env(safe-area-inset-top) + 10px), 0) scale(0.94)";
    page.style.borderRadius = "14px";
    page.style.opacity = "0.55";
    return () => {
      page.style.transform = "";
      page.style.borderRadius = "";
      page.style.opacity = "";
      window.setTimeout(() => {
        // Otra hoja pudo abrirse mientras tanto: solo se limpia si sigue en reposo
        if (!page.style.transform) {
          page.style.transition = "";
          page.style.transformOrigin = "";
          html.style.background = prev.htmlBg;
          document.body.style.background = prev.bodyBg;
        }
      }, MOBILE_MS);
    };
  }, [active]);
}

/** Alto del teclado en pantalla (iOS no achica el layout viewport) */
function useKeyboardInset(active: boolean) {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!active || !vv) return;
    const update = () => setInset(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)));
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      setInset(0);
    };
  }, [active]);
  return inset;
}

export type EbSheetAction = {
  label: string;
  onClick: () => void;
  /** Formulario invalido o guardando: gris y sin accion */
  disabled?: boolean;
};

export function EbSheet({
  open,
  onClose,
  title,
  ariaLabel,
  action,
  dirty = false,
  nested = false,
  contentClassName,
  children,
}: {
  open: boolean;
  /** Cierre efectivo (Cancelar, Escape, swipe o "Descartar cambios") */
  onClose: () => void;
  title: string;
  /** Nombre accesible si difiere del titulo visible */
  ariaLabel?: string;
  action?: EbSheetAction;
  /** Con cambios sin guardar, cerrar pide confirmacion */
  dirty?: boolean;
  /** Hoja secundaria (sobre otra hoja): no vuelve a reducir la pagina */
  nested?: boolean;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const duration = isDesktop ? DESKTOP_MS : MOBILE_MS;
  const phase = usePresence(open, duration);
  const visible = phase === "open";
  const mounted = phase !== "closed";
  const layerId = useId();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ y: number; t: number; lastY: number; lastT: number; moved: boolean } | null>(null);
  const keyboard = useKeyboardInset(mounted && !isDesktop);

  useStackedPage(open && !nested && !isDesktop);

  // Capa activa: se registra al abrir; al cerrar el foco vuelve al boton que la abrio
  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement as HTMLElement | null;
    pushLayer(layerId);
    return () => {
      removeLayer(layerId);
      openerRef.current?.focus({ preventScroll: true });
    };
  }, [open, layerId]);

  // Foco inicial: el campo marcado con data-autofocus (el monto) o la hoja
  useEffect(() => {
    if (!visible) return;
    const panel = panelRef.current;
    const target = panel?.querySelector<HTMLElement>("[data-autofocus]") ?? panel;
    target?.focus({ preventScroll: true });
  }, [visible]);

  function requestClose() {
    if (dirty) {
      setDragY(0);
      setConfirmDiscard(true);
      return;
    }
    onClose();
  }

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (!isTopLayer(layerId)) return;
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
        return;
      }
      trapTab(e, panelRef.current);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  // Swipe hacia abajo desde el grabber o la barra superior (solo movil)
  function onPointerDown(e: React.PointerEvent) {
    if (isDesktop || (e.pointerType === "mouse" && e.button !== 0)) return;
    const now = performance.now();
    drag.current = { y: e.clientY, t: now, lastY: e.clientY, lastT: now, moved: false };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.y;
    if (!d.moved) {
      if (dy < 6) return;
      d.moved = true;
      setDragging(true);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    d.lastY = e.clientY;
    d.lastT = performance.now();
    setDragY(Math.max(0, dy));
  }
  function onPointerUp(e: React.PointerEvent) {
    const d = drag.current;
    drag.current = null;
    if (!d || !d.moved) return;
    setDragging(false);
    const dy = Math.max(0, e.clientY - d.y);
    const dt = Math.max(1, performance.now() - d.lastT);
    const velocity = (e.clientY - d.lastY) / dt;
    if (dy > SWIPE_CLOSE_PX || (velocity > SWIPE_CLOSE_VELOCITY && dy > 24)) {
      requestClose();
    } else {
      setDragY(0);
    }
  }
  // Un arrastre que empezo sobre "Cancelar" o la accion no debe disparar el click
  function onClickCapture(e: React.MouseEvent) {
    if (dragging) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  // Cada apertura empieza sin arrastre ni confirmacion pendiente
  const [lastOpen, setLastOpen] = useState(open);
  if (lastOpen !== open) {
    setLastOpen(open);
    if (open) {
      setDragY(0);
      setConfirmDiscard(false);
    }
  }

  if (!mounted || typeof document === "undefined") return null;

  const z = nested ? 80 : 70;
  const panelStyle: React.CSSProperties = isDesktop
    ? {
        position: "fixed",
        left: "50%",
        top: "50%",
        width: "min(480px, calc(100vw - 32px))",
        maxHeight: "min(760px, 90vh)",
        borderRadius: 26,
        transform: `translate(-50%, -50%) scale(${visible ? 1 : 0.96})`,
        opacity: visible ? 1 : 0,
        transition: `transform ${DESKTOP_MS}ms ${EASE}, opacity ${DESKTOP_MS}ms ease`,
      }
    : {
        position: "fixed",
        left: 0,
        right: 0,
        top: nested ? "calc(env(safe-area-inset-top) + 56px)" : "calc(env(safe-area-inset-top) + 46px)",
        bottom: 0,
        borderRadius: "14px 14px 0 0",
        transform: visible ? `translate3d(0, ${dragY}px, 0)` : "translate3d(0, 100%, 0)",
        transition: dragging ? "none" : `transform ${MOBILE_MS}ms ${EASE}`,
        willChange: "transform",
      };

  return createPortal(
    <>
      {/* Bloquea la pagina de atras (el scroll vive en <main>, que queda debajo) */}
      <div
        aria-hidden="true"
        className="fixed inset-0"
        style={{
          zIndex: z,
          touchAction: "none",
          background: isDesktop ? "rgba(0,0,0,0.5)" : nested ? "rgba(0,0,0,0.4)" : "transparent",
          backdropFilter: isDesktop ? "blur(8px)" : undefined,
          WebkitBackdropFilter: isDesktop ? "blur(8px)" : undefined,
          opacity: visible ? 1 : 0,
          transition: `opacity ${duration}ms ease`,
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabel ? undefined : titleId}
        aria-label={ariaLabel}
        tabIndex={-1}
        className="text-eb-text flex flex-col overflow-hidden outline-none"
        style={{
          ...panelStyle,
          zIndex: z,
          background: "var(--eb-sheet-bg)",
          boxShadow: isDesktop
            ? "0 0 0 1px rgba(255,255,255,0.08), 0 30px 80px -20px rgba(0,0,0,0.8)"
            : "0 -1px 0 rgba(255,255,255,0.08), 0 -20px 40px rgba(0,0,0,0.6)",
          fontFamily: "var(--eb-font)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <div
          className="flex-none"
          style={{ touchAction: isDesktop ? undefined : "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClickCapture={onClickCapture}
        >
          {!isDesktop && (
            <div aria-hidden="true" className="mx-auto mt-1.5 h-[5px] w-9 rounded-[3px] bg-white/25" />
          )}
          <div
            className="grid items-center"
            style={{ gridTemplateColumns: "1fr auto 1fr", padding: isDesktop ? "10px 8px 0" : "6px 8px 0" }}
          >
            <button
              type="button"
              onClick={requestClose}
              className="text-eb-link min-h-11 justify-self-start px-2.5 py-3 text-[17px]"
            >
              Cancelar
            </button>
            <span id={titleId} className="max-w-[52vw] truncate text-[17px] font-semibold md:max-w-[260px]">
              {title}
            </span>
            {action ? (
              <button
                type="button"
                onClick={action.onClick}
                disabled={action.disabled}
                className="min-h-11 justify-self-end px-2.5 py-3 text-[17px] font-semibold"
                style={{ color: action.disabled ? "var(--eb-chevron)" : "var(--eb-link)" }}
              >
                {action.label}
              </button>
            ) : (
              <span />
            )}
          </div>
        </div>

        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-4 pt-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            contentClassName
          )}
          style={{ paddingBottom: `calc(40px + ${keyboard}px)` }}
        >
          {children}
        </div>
      </div>

      <ActionSheet
        open={confirmDiscard}
        actions={[
          {
            label: "Descartar cambios",
            destructive: true,
            onSelect: () => {
              setConfirmDiscard(false);
              onClose();
            },
          },
        ]}
        cancelLabel="Seguir editando"
        onCancel={() => setConfirmDiscard(false)}
      />
    </>,
    document.body
  );
}

/**
 * Action sheet de iOS: opciones abajo y "Cancelar" aparte. Se usa para
 * confirmar descartar cambios y eliminar.
 */
export function ActionSheet({
  open,
  message,
  actions,
  cancelLabel = "Cancelar",
  onCancel,
}: {
  open: boolean;
  message?: string;
  actions: { label: string; destructive?: boolean; onSelect: () => void }[];
  cancelLabel?: string;
  onCancel: () => void;
}) {
  const phase = usePresence(open, 240);
  const visible = phase === "open";
  const layerId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    pushLayer(layerId);
    return () => removeLayer(layerId);
  }, [open, layerId]);

  useEffect(() => {
    if (!visible) return;
    panelRef.current?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
  }, [visible]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (!isTopLayer(layerId)) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }
      trapTab(e, panelRef.current);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  if (phase === "closed" || typeof document === "undefined") return null;

  const groupStyle: React.CSSProperties = {
    background: "var(--eb-group-solid)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
  };

  return createPortal(
    <>
      <div
        aria-hidden="true"
        className="fixed inset-0 z-[90]"
        onClick={onCancel}
        style={{
          background: "rgba(0,0,0,0.4)",
          touchAction: "none",
          opacity: visible ? 1 : 0,
          transition: "opacity 240ms ease",
        }}
      />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-label={message ?? "Confirmar"}
        className="text-eb-text fixed inset-x-2 z-[90] mx-auto flex max-w-[400px] flex-col gap-2"
        style={{
          bottom: "calc(8px + env(safe-area-inset-bottom))",
          fontFamily: "var(--eb-font)",
          transform: visible ? "translate3d(0,0,0)" : "translate3d(0, calc(100% + 16px), 0)",
          transition: `transform 240ms ${EASE}`,
        }}
      >
        <div className="flex flex-col overflow-hidden rounded-[14px]" style={groupStyle}>
          {message && (
            <p className="text-eb-text-tertiary border-eb-separator border-b px-4 py-3.5 text-center text-[13px]">
              {message}
            </p>
          )}
          {actions.map((a, i) => (
            <button
              key={a.label}
              type="button"
              onClick={a.onSelect}
              className={cn("min-h-[57px] px-4 text-[20px]", i > 0 && "border-eb-separator border-t")}
              style={{ color: a.destructive ? "var(--eb-red)" : "var(--eb-link)" }}
            >
              {a.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-eb-link min-h-[57px] rounded-[14px] px-4 text-[20px] font-semibold"
          style={groupStyle}
        >
          {cancelLabel}
        </button>
      </div>
    </>,
    document.body
  );
}
