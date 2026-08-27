"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { UserPreferencesData, Theme } from "@/lib/services/preferences";

type PreferencesContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  hideNetWorthAmounts: boolean;
  setHideNetWorthAmounts: (hide: boolean) => void;
  /** Hrefs (en orden) de las secciones elegidas para la tab bar movil; null = default */
  mobileNavHrefs: string[] | null;
  setMobileNavHrefs: (hrefs: string[]) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

async function patchPreferences(updates: Partial<UserPreferencesData>) {
  try {
    await fetch("/api/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  } catch {
    // La UI ya aplico el cambio de forma optimista; un fallo de red aqui
    // no debe interrumpir el uso, la proxima mutacion reintenta el estado real.
  }
}

/**
 * Fuente de verdad de preferencias del usuario: persistentes en servidor
 * (tabla user_preferences), no en localStorage. `initial` viene del layout
 * raiz (Server Component), leido antes del primer render para que el tema
 * ya este correcto en el HTML servido — sin flash y sin next-themes.
 */
export function PreferencesProvider({
  initial,
  children,
}: {
  initial: UserPreferencesData;
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>(initial.theme);
  const [hideNetWorthAmounts, setHideState] = useState(
    initial.hideNetWorthAmounts
  );
  const [mobileNavHrefs, setMobileNavHrefsState] = useState<string[] | null>(
    initial.mobileNavHrefs
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    patchPreferences({ theme: next });
  }, []);

  const setHideNetWorthAmounts = useCallback((next: boolean) => {
    setHideState(next);
    patchPreferences({ hideNetWorthAmounts: next });
  }, []);

  const setMobileNavHrefs = useCallback((next: string[]) => {
    setMobileNavHrefsState(next);
    patchPreferences({ mobileNavHrefs: next });
  }, []);

  return (
    <PreferencesContext.Provider
      value={{
        theme,
        setTheme,
        hideNetWorthAmounts,
        setHideNetWorthAmounts,
        mobileNavHrefs,
        setMobileNavHrefs,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences debe usarse dentro de PreferencesProvider");
  }
  return ctx;
}
