import { cn } from "@/lib/utils";

/**
 * Brillo ambiental de la parte superior de una pantalla movil. Va como
 * primer hijo de un contenedor `relative`; el contenido lleva z-index 1.
 * Las maquetas miden 390x1600 (Inicio) y 390x2080 (Patrimonio), asi que
 * los % del degradado se calculan sobre esas alturas.
 */
export function PageGlow({
  variant,
  className,
}: {
  variant: "home" | "net-worth";
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0",
        variant === "home" ? "eb-glow-home-mobile h-[1600px]" : "eb-glow-net-worth h-[2080px]",
        className
      )}
    />
  );
}
