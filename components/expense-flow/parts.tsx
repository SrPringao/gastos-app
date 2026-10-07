"use client";

import { CategoryTile } from "@/components/ui/eb/category-tile";
import { getCategoryStyle } from "@/lib/category-style";
import { initialOf } from "@/lib/dashboard-metrics";
import { cn } from "@/lib/utils";

/** Indicador de pasos bajo la barra superior (3 barras de 28x4) */
export function StepIndicator({ step, total = 3 }: { step: number; total?: number }) {
  return (
    <div
      role="img"
      aria-label={`Paso ${step} de ${total}`}
      className="flex justify-center gap-1.5 pt-0.5"
    >
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        return (
          <span
            key={n}
            className="h-1 w-7 rounded-[2px] transition-colors duration-200"
            style={
              n === step
                ? { background: "#5E6BFF", boxShadow: "0 0 8px rgba(94,107,255,0.6)" }
                : { background: n < step ? "rgba(94,107,255,0.5)" : "rgba(255,255,255,0.14)" }
            }
          />
        );
      })}
    </div>
  );
}

/** Tile de 28px con el icono de la categoria, o gris con la inicial */
export function FlowTile({ categoryName, label }: { categoryName: string | null; label: string }) {
  const style = getCategoryStyle(categoryName);
  return (
    <CategoryTile
      color={style.icon ? style.color : "gray"}
      icon={style.icon}
      label={initialOf(label)}
      size={28}
    />
  );
}

/** Chip de 36px con tile (Recientes y Categoria) */
export function FlowChip({
  categoryName,
  label,
  selected,
  onClick,
  pressable = false,
  className,
}: {
  categoryName: string | null;
  label: string;
  /** Solo Categoria tiene estado seleccionado */
  selected?: boolean;
  onClick: () => void;
  pressable?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressable ? !!selected : undefined}
      onClick={onClick}
      className={cn(
        "flex h-9 max-w-full flex-none items-center gap-2 rounded-[18px] pr-3 pl-1 text-[14px]",
        selected ? "text-eb-text-strong font-medium" : "text-eb-text-muted",
        className
      )}
      style={
        selected
          ? { background: "rgba(94,107,255,0.22)", boxShadow: "inset 0 0 0 1px rgba(94,107,255,0.5)" }
          : { background: "var(--eb-glass-bg)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }
      }
    >
      <FlowTile categoryName={categoryName} label={label} />
      <span className="truncate">{label}</span>
    </button>
  );
}

/** Encabezado de seccion de 13px en mayusculas */
export function FlowHeader({ children, trailing }: { children: React.ReactNode; trailing?: React.ReactNode }) {
  return (
    <div className="text-eb-text-tertiary flex justify-between px-4 text-[13px] tracking-[0.02em] uppercase">
      <span>{children}</span>
      {trailing && <span className="tracking-normal normal-case">{trailing}</span>}
    </div>
  );
}
