import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
};

/**
 * Logo de marca, condicional por tema via CSS puro (nunca JS/useTheme):
 * logo-dark.svg (grises claros, sobre Carbon) en modo oscuro,
 * logo-light.svg (grises oscuros, sobre Paper) en modo claro. Ambas
 * versiones se renderizan en el servidor y el tema decide cual se ve con
 * la variante `dark:` — asi el HTML es identico en servidor y cliente y no
 * hay mismatch de hidratacion posible (un <img src> que cambiara segun
 * resolvedTheme rompia la hidratacion de verdad, no solo el warning).
 */
export function Logo({ className }: LogoProps) {
  return (
    <>
      <img
        src="/logo-light.svg"
        alt=""
        aria-hidden
        className={cn("h-auto w-auto shrink-0 dark:hidden", className)}
      />
      <img
        src="/logo-dark.svg"
        alt=""
        aria-hidden
        className={cn("hidden h-auto w-auto shrink-0 dark:block", className)}
      />
    </>
  );
}
