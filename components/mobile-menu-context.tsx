"use client";

import { createContext, useContext, useMemo, useState } from "react";

/**
 * Estado del menu lateral movil: lo abre el boton de menu del MobileHeader
 * (dentro de cada pagina) y lo pinta <MobileMenu /> en el layout.
 */
type MobileMenuState = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const MobileMenuContext = createContext<MobileMenuState | null>(null);

export function MobileMenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open, setOpen }), [open]);
  return <MobileMenuContext.Provider value={value}>{children}</MobileMenuContext.Provider>;
}

export function useMobileMenu(): MobileMenuState {
  const ctx = useContext(MobileMenuContext);
  if (!ctx) throw new Error("useMobileMenu debe usarse dentro de <MobileMenuProvider>");
  return ctx;
}
