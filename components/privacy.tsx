"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { usePreferences } from "@/components/preferences-provider";
import { cn } from "@/lib/utils";

/**
 * Cada ojo es independiente:
 * - accounts: widget Cuentas del dashboard (y su carrusel movil).
 * - netWorth: pantalla Patrimonio (preferencia guardada en servidor).
 */
export type PrivacyScope = "accounts" | "netWorth";

/** Lo que se muestra en lugar de un monto privado: siempre 4 puntos */
export const PRIVATE_MASK = "$••••";

const ACCOUNTS_STORAGE_KEY = "eb:hide-balances";

// Store minimo sobre localStorage para el ojo de Cuentas: todos los
// componentes suscritos (tarjeta de escritorio y carrusel) se enteran del cambio.
const listeners = new Set<() => void>();
let memoryValue: boolean | null = null;

function readAccountsHidden(): boolean {
  try {
    return localStorage.getItem(ACCOUNTS_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeAccountsHidden(next: boolean) {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, next ? "1" : "0");
  } catch {
    // Sin acceso a localStorage (modo privado): el cambio vive solo en esta pestaña
  }
  memoryValue = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === ACCOUNTS_STORAGE_KEY) {
      memoryValue = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getAccountsSnapshot(): boolean {
  if (memoryValue === null) memoryValue = readAccountsHidden();
  return memoryValue;
}

export function usePrivacy(scope: PrivacyScope) {
  const { hideNetWorthAmounts, setHideNetWorthAmounts } = usePreferences();
  const accountsHidden = useSyncExternalStore(subscribe, getAccountsSnapshot, () => false);

  const hidden = scope === "netWorth" ? hideNetWorthAmounts : accountsHidden;

  const setHidden = useCallback(
    (next: boolean) => {
      if (scope === "netWorth") setHideNetWorthAmounts(next);
      else writeAccountsHidden(next);
    },
    [scope, setHideNetWorthAmounts]
  );

  const toggle = useCallback(() => setHidden(!hidden), [hidden, setHidden]);

  return { hidden, toggle, setHidden };
}

/** Atajo Shift + H: alterna el ojo de la pantalla actual, fuera de inputs */
export function PrivacyShortcut() {
  const pathname = usePathname();
  const scope: PrivacyScope = pathname.startsWith("/patrimonio") ? "netWorth" : "accounts";
  const { toggle } = usePrivacy(scope);

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
 * Envoltorio de un monto privado: con su ojo activo muestra "$••••" con
 * el mismo estilo. Al cambiar de estado entra con opacidad + blur (150ms).
 */
export function PrivateValue({
  scope,
  maskClassName,
  maskStyle,
  children,
}: {
  scope: PrivacyScope;
  /** Estilo de "$••••" (el de la cifra a la que reemplaza) */
  maskClassName?: string;
  maskStyle?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const { hidden } = usePrivacy(scope);
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
export function PrivacyToggle({ scope, className }: { scope: PrivacyScope; className?: string }) {
  const { hidden, toggle } = usePrivacy(scope);
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
