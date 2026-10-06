"use client";

import { useCallback, useEffect } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { usePreferences } from "@/components/preferences-provider";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "eb:hide-balances";

/** Lo que se muestra en lugar de un monto privado: siempre 4 puntos */
export const PRIVATE_MASK = "$••••";

/**
 * Ocultar saldos (privacidad al compartir pantalla). La fuente de verdad
 * es la preferencia del usuario en servidor (se sincroniza entre
 * dispositivos); localStorage solo guarda una copia local.
 */
export function usePrivacy() {
  const { hideNetWorthAmounts: hidden, setHideNetWorthAmounts } = usePreferences();

  const setHidden = useCallback(
    (next: boolean) => {
      setHideNetWorthAmounts(next);
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // Sin acceso a localStorage (modo privado): la preferencia en servidor basta
      }
    },
    [setHideNetWorthAmounts]
  );

  const toggle = useCallback(() => setHidden(!hidden), [hidden, setHidden]);

  return { hidden, toggle, setHidden };
}

/** Atajo Shift + H para alternar, fuera de inputs */
export function PrivacyShortcut() {
  const { toggle } = usePrivacy();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key !== "H" && e.key !== "h") return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }
      e.preventDefault();
      toggle();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  return null;
}

/**
 * Envoltorio de un monto privado: con saldos ocultos muestra "$••••" con
 * el mismo estilo. Al cambiar de estado entra con opacidad + blur (150ms).
 */
export function PrivateValue({
  maskClassName,
  maskStyle,
  children,
}: {
  /** Estilo de "$••••" (el de la cifra a la que reemplaza) */
  maskClassName?: string;
  maskStyle?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const { hidden } = usePrivacy();
  return (
    <span key={hidden ? "hidden" : "shown"} className="eb-privacy-swap inline-flex">
      {hidden ? (
        <span aria-label="Saldo oculto" className={cn("select-none", maskClassName)} style={maskStyle}>
          {PRIVATE_MASK}
        </span>
      ) : (
        children
      )}
    </span>
  );
}

/** Boton ojo de 32px (seccion A.3) */
export function PrivacyToggle({ className }: { className?: string }) {
  const { hidden, toggle } = usePrivacy();
  const label = hidden ? "Mostrar saldos" : "Ocultar saldos";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={hidden}
      aria-label={label}
      title={`${label} (Shift + H)`}
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full border-0 transition-colors",
        hidden ? "text-eb-link-hover" : "text-eb-text-muted",
        className
      )}
      style={
        hidden
          ? { background: "rgba(94,107,255,0.2)", boxShadow: "inset 0 0 0 1px rgba(94,107,255,0.35)" }
          : { background: "var(--eb-glass-strong)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }
      }
    >
      {hidden ? (
        <EyeOffIcon size={17} strokeWidth={2} aria-hidden="true" />
      ) : (
        <EyeIcon size={17} strokeWidth={2} aria-hidden="true" />
      )}
    </button>
  );
}
