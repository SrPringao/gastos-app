"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/components/preferences-provider";

/**
 * El "ojito" de privacidad de Patrimonio: oculta todas las cifras de la
 * pantalla (totales y montos individuales) tras puntos, util al compartir
 * pantalla. Persiste en servidor (user_preferences), no en cache/localStorage
 * — se mantiene igual sin importar el dispositivo donde inicies sesion.
 */
export function NetWorthVisibilityToggle() {
  const { hideNetWorthAmounts, setHideNetWorthAmounts } = usePreferences();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setHideNetWorthAmounts(!hideNetWorthAmounts)}
      className="gap-1.5"
      title={hideNetWorthAmounts ? "Mostrar cifras" : "Ocultar cifras"}
    >
      {hideNetWorthAmounts ? (
        <EyeOffIcon className="size-4" />
      ) : (
        <EyeIcon className="size-4" />
      )}
      {hideNetWorthAmounts ? "Mostrar cifras" : "Ocultar cifras"}
    </Button>
  );
}
