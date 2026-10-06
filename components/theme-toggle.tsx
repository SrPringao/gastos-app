"use client";

import { SunIcon, MoonIcon } from "lucide-react";
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
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "text-eb-text-secondary flex size-8 shrink-0 items-center justify-center rounded-full transition-colors hover:text-eb-text",
        className
      )}
      style={{
        background: "var(--eb-glass-strong)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
      }}
      title="Cambiar tema"
    >
      {/* Ambos iconos se renderizan siempre; el tema decide cual se ve via
          CSS puro (dark:), coherente con como el html ya trae la clase
          correcta desde el servidor (sin flash, sin mismatch). */}
      <SunIcon className="hidden size-[18px] dark:block" strokeWidth={2.2} />
      <MoonIcon className="size-[18px] dark:hidden" strokeWidth={2.2} />
      <span className="sr-only">Cambiar tema</span>
    </button>
  );
}
