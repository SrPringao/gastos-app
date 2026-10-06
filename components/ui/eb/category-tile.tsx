import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TILE_COLORS, type TileColor } from "@/lib/category-style";

type CategoryTileProps = {
  color: TileColor;
  icon?: LucideIcon | null;
  /** Texto cuando no hay icono (inicial del comercio o de la cuenta) */
  label?: string;
  /** 36: listas de gastos (radio 10). 30: Patrimonio (radio 8). */
  size?: 36 | 30;
  className?: string;
};

export function CategoryTile({
  color,
  icon: Icon,
  label,
  size = 36,
  className,
}: CategoryTileProps) {
  const tone = TILE_COLORS[color];
  const glyphSize = size === 36 ? 18 : 16;

  return (
    <div
      aria-hidden="true"
      className={cn("eb-tile", className)}
      style={
        {
          width: size,
          height: size,
          borderRadius: size === 36 ? 10 : 8,
          background: `linear-gradient(180deg, ${tone.from}, ${tone.to})`,
          color: tone.glyph,
          "--tile-shadow": tone.shadow ?? "transparent",
        } as React.CSSProperties
      }
    >
      {Icon ? (
        <Icon size={glyphSize} strokeWidth={2} />
      ) : (
        <span className="text-[13px] leading-none font-semibold">{label}</span>
      )}
    </div>
  );
}
