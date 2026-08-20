"use client";

import { SunIcon, MoonIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/components/preferences-provider";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = usePreferences();

  function toggle() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      className={cn("shrink-0", className)}
      title="Cambiar tema"
    >
      {/* Ambos iconos se renderizan siempre; el tema decide cual se ve via
          CSS puro (dark:), coherente con como el html ya trae la clase
          correcta desde el servidor (sin flash, sin mismatch). */}
      <SunIcon className="hidden size-5 opacity-70 dark:block" />
      <MoonIcon className="size-5 opacity-70 dark:hidden" />
      <span className="sr-only">Cambiar tema</span>
    </Button>
  );
}
