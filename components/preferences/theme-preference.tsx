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
                  "flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors",
                  isActive
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-secondary/60"
                )}
              >
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
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
