"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/components/preferences-provider";
import type { Theme } from "@/lib/services/preferences";

const OPTIONS: { value: Theme; label: string; icon: typeof MoonIcon }[] = [
  { value: "dark", label: "Oscuro", icon: MoonIcon },
  { value: "light", label: "Claro", icon: SunIcon },
];

export function ThemePreference() {
  const { theme, setTheme } = usePreferences();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tema</CardTitle>
        <p className="text-muted-foreground text-sm font-normal">
          Se aplica en todos tus dispositivos donde inicies sesion.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {OPTIONS.map((option) => {
            const isActive = theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-[16px] p-4 transition-colors",
                  isActive
                    ? "bg-[rgba(94,107,255,0.12)] shadow-[inset_0_0_0_1px_rgba(94,107,255,0.35)]"
                    : "bg-[var(--eb-group-bg)] shadow-[var(--eb-group-ring)] hover:bg-[var(--eb-fill-subtle)]"
                )}
              >
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-[11px]",
                    isActive
                      ? "text-white [background:linear-gradient(180deg,var(--eb-accent-light),var(--eb-accent))] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_10px_-4px_var(--eb-accent-glow)]"
                      : "text-eb-text-secondary bg-[var(--eb-neutral-tile)]"
                  )}
                >
                  <option.icon className="size-5" />
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
