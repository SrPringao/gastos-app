"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useMobileMenu } from "@/components/mobile-menu-context";

/**
 * Header integrado de las pantallas moviles (< 768px), segun
 * design-reference/expensebro-header-movil-prompt.md: no es una barra, son
 * dos botones de vidrio flotando sobre el glow de la pagina. Cuando el
 * titulo grande (children) sale de la vista entra el estado compacto: capa
 * de blur con desvanecido, glow de la pagina y titulo centrado.
 *
 * Va como hijo directo del contenedor de la pagina (el que tiene el padding
 * superior env(safe-area-inset-top) + 8px) para que el sticky funcione con
 * el scroll de <main>.
 */
export function MobileHeader({
  title,
  subtitle,
  rightAction,
  tint = "indigo",
  inset = true,
  titleClassName,
  children,
}: {
  /** Titulo del estado compacto */
  title: string;
  /** Texto pequeño bajo el titulo compacto */
  subtitle?: string;
  /** Boton de la derecha (avatar, filtros, +) */
  rightAction?: React.ReactNode;
  /** Tinte del glow del estado compacto: verde en Patrimonio, indigo en el resto */
  tint?: "indigo" | "green";
  /**
   * true (default): va dentro del contenedor de la pagina y compensa su
   * padding (lateral y superior). false: va directo en <main>, sin contenedor.
   */
  inset?: boolean;
  /** Clases del contenedor del titulo grande (ajuste del gap con la fila) */
  titleClassName?: string;
  /** Titulo grande de la pagina (con su sobretitulo); se observa para el estado compacto */
  children?: React.ReactNode;
}) {
  const headerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const header = headerRef.current;
    const target = titleRef.current;
    if (!header || !target) return;
    const headerHeight = header.offsetHeight;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Compacto solo cuando el titulo quedo arriba, debajo de la fila de botones
        setCompact(!entry.isIntersecting && entry.boundingClientRect.bottom <= headerHeight + 1);
      },
      { rootMargin: `-${headerHeight}px 0px 0px 0px` }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <header
        ref={headerRef}
        data-compact={compact}
        className={cn("sticky top-0 z-40 md:hidden", inset && "-mx-4")}
        style={{
          marginTop: inset ? "calc(-1 * (env(safe-area-inset-top) + 8px))" : undefined,
          paddingTop: "calc(env(safe-area-inset-top) + 8px)",
        }}
      >
        <div
          aria-hidden="true"
          className="eb-hdr-layer eb-hdr-fade pointer-events-none absolute inset-x-0 top-0"
          style={{ height: "calc(env(safe-area-inset-top) + 88px)" }}
        />
        <div
          aria-hidden="true"
          className={cn(
            "eb-hdr-layer pointer-events-none absolute inset-x-0 top-0",
            tint === "green" ? "eb-hdr-glow-green" : "eb-hdr-glow-indigo"
          )}
          style={{ height: "calc(env(safe-area-inset-top) + 88px)" }}
        />

        <div className="relative flex h-11 items-center justify-between px-4">
          <MenuButton />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-16 left-16 flex items-center justify-center"
          >
            <div className="eb-hdr-compact flex min-w-0 flex-col items-center">
              <span className="text-eb-text max-w-full truncate text-[17px] leading-[22px] font-semibold tracking-[-0.01em]">
                {title}
              </span>
              {subtitle && (
                <span className="text-eb-text-tertiary max-w-full truncate text-[11px] leading-[13px]">
                  {subtitle}
                </span>
              )}
            </div>
          </div>
          {rightAction ?? <span className="size-10" aria-hidden="true" />}
        </div>
      </header>

      {children && (
        <div ref={titleRef} className={titleClassName}>
          {children}
        </div>
      )}
    </>
  );
}

/** Boton de menu: abre el menu lateral movil */
function MenuButton() {
  const { open, setOpen } = useMobileMenu();
  return (
    <button
      type="button"
      aria-label="Abrir menú"
      aria-expanded={open}
      aria-haspopup="dialog"
      onClick={() => setOpen(true)}
      className="eb-hdr-btn text-eb-text"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M4 7h16M4 12h16M4 17h10" />
      </svg>
    </button>
  );
}

/**
 * Boton de vidrio para la accion derecha del header (filtros, +). Iconos en
 * color link. Acepta las props de <button> para usarse con `asChild`.
 */
export function HeaderIconButton({ className, ...props }: React.ComponentProps<"button">) {
  return <button type="button" {...props} className={cn("eb-hdr-btn text-eb-link relative", className)} />;
}
