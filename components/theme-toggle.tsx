"use client";

import { useTheme } from "next-themes";
import { SunIcon, MoonIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();

  function toggle() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
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
          CSS puro (dark:). Un unico icono elegido por resolvedTheme rompia
          la hidratacion de verdad (SSR sin tema conocido pinta MoonIcon,
          cliente con defaultTheme="dark" pinta SunIcon: dos <svg> con
          distintos <path>/<circle>, no solo un mismatch cosmetico que
          suppressHydrationWarning pudiera tapar). */}
      <SunIcon className="hidden size-5 opacity-70 dark:block" />
      <MoonIcon className="size-5 opacity-70 dark:hidden" />
      <span className="sr-only">Cambiar tema</span>
    </Button>
  );
}
