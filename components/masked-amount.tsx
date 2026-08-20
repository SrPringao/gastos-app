"use client";

import { usePreferences } from "@/components/preferences-provider";
import { cn } from "@/lib/utils";

type MaskedAmountProps = {
  /** Cifra ya formateada (ej. el resultado de formatCurrency) */
  children: string;
  className?: string;
};

/**
 * Envuelve una cifra de patrimonio ya formateada; cuando el usuario activo
 * el ojito de privacidad (hideNetWorthAmounts), la reemplaza por puntos en
 * vez de mostrar el monto real — util para compartir pantalla sin exponer
 * cifras. La preferencia persiste en servidor, no es solo un estado local.
 */
export function MaskedAmount({ children, className }: MaskedAmountProps) {
  const { hideNetWorthAmounts } = usePreferences();

  if (!hideNetWorthAmounts) {
    return <span className={className}>{children}</span>;
  }

  // Puntos en cantidad similar al ancho del texto real, para que el layout
  // no salte al alternar el ojito.
  const dots = "•".repeat(Math.min(Math.max(children.length - 2, 4), 10));

  return (
    <span className={cn("select-none", className)} aria-label="Monto oculto">
      {dots}
    </span>
  );
}
