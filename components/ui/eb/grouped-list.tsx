import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Contenedor de filas estilo iOS: el separador vive en el cuerpo de cada
 * fila (empieza despues del icono) y la ultima fila no lleva.
 */
export function GroupedList({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col [&>.eb-row:last-child_.eb-row-body]:border-b-0", className)}
      {...props}
    >
      {children}
    </div>
  );
}

const DENSITY = {
  /** Escritorio: 60px, 24px a los lados, titulo 15/500 */
  desktop: { row: "min-h-[60px] gap-[14px] px-6", title: "text-[15px] font-medium", gap: "gap-3" },
  /** Movil Inicio: 60px, 16px a los lados, titulo 16/400 */
  mobile: { row: "min-h-[60px] gap-3 px-4", title: "text-[16px]", gap: "gap-2" },
  /** Patrimonio: 52px */
  compact: { row: "min-h-[52px] gap-3 px-4", title: "text-[16px]", gap: "gap-2" },
} as const;

type ListRowProps = {
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Valor a la derecha (monto) */
  trailing?: React.ReactNode;
  /** Botones que solo aparecen con hover/foco (escritorio) */
  actions?: React.ReactNode;
  density?: keyof typeof DENSITY;
  /** Se estira para repartir la altura de la tarjeta */
  stretch?: boolean;
  /** Contenido extra debajo del subtitulo (ej. mini barra de ciclo) */
  children?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  /** Sin hover (filas de solo lectura) */
  static?: boolean;
};

export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  actions,
  density = "desktop",
  stretch = false,
  children,
  className,
  titleClassName,
  static: isStatic = false,
}: ListRowProps) {
  const spec = DENSITY[density];
  return (
    <div
      className={cn(
        "flex items-center",
        !isStatic && "eb-row",
        isStatic && "eb-row eb-row--static",
        spec.row,
        stretch && "flex-1",
        className
      )}
    >
      {leading}
      <div
        className={cn(
          "eb-row-body border-eb-separator flex min-w-0 flex-1 items-center self-stretch border-b",
          spec.gap
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-px py-2">
          <span className={cn("truncate", spec.title, titleClassName)}>{title}</span>
          {subtitle && (
            <span className="text-eb-text-tertiary truncate text-[13px]">{subtitle}</span>
          )}
          {children}
        </div>
        {actions && <div className="eb-row-actions flex shrink-0 items-center gap-2">{actions}</div>}
        {trailing && <div className="ml-1 shrink-0 text-right">{trailing}</div>}
      </div>
    </div>
  );
}

/** Encabezado de grupo ("JUEVES 1 DE OCTUBRE", "CUENTAS") */
export function GroupHeader({
  children,
  trailing,
  className,
}: {
  children: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-eb-text-tertiary flex items-center justify-between gap-3 text-[13px] uppercase tracking-[0.02em]",
        className
      )}
    >
      <span>{children}</span>
      {trailing && <span className="tabular-nums">{trailing}</span>}
    </div>
  );
}
