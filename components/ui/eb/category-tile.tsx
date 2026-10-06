import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TILE_COLORS, type TileColor } from "@/lib/category-style";

type CategoryTileProps = {
  color: TileColor;
  icon?: LucideIcon | null;
  /** Texto cuando no hay icono (inicial del comercio o de la cuenta) */
  label?: string;
  /** 36: listas (radio 10). 32: KPI Mayor gasto (9). 30: Patrimonio (8). 28: widget movil (8). */
  size?: TileSize;
  className?: string;
};

type TileSize = 36 | 32 | 30 | 28;

const TILE_METRICS: Record<TileSize, { radius: number; glyph: number; label: string }> = {
  36: { radius: 10, glyph: 18, label: "text-[15px]" },
  32: { radius: 9, glyph: 16, label: "text-[14px]" },
  30: { radius: 8, glyph: 16, label: "text-[13px]" },
  28: { radius: 8, glyph: 15, label: "text-[13px]" },
};

export function CategoryTile({
  color,
  icon: Icon,
  label,
  size = 36,
  className,
}: CategoryTileProps) {
  const tone = TILE_COLORS[color];
  const metrics = TILE_METRICS[size];

  return (
    <div
      aria-hidden="true"
      className={cn("eb-tile", className)}
      style={
        {
          width: size,
          height: size,
          borderRadius: metrics.radius,
          background: `linear-gradient(180deg, ${tone.from}, ${tone.to})`,
          color: tone.glyph,
          "--tile-shadow": tone.shadow ?? "transparent",
        } as React.CSSProperties
      }
    >
      {Icon ? (
        <Icon size={metrics.glyph} strokeWidth={2} />
      ) : (
        <span className={cn("leading-none font-semibold", metrics.label)}>
          {label}
        </span>
      )}
    </div>
  );
}
