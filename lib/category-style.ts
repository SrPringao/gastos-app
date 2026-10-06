import {
  BanknoteIcon,
  BrainIcon,
  FuelIcon,
  HomeIcon,
  UtensilsIcon,
  WineIcon,
  type LucideIcon,
} from "lucide-react";

export type TileColor =
  | "orange"
  | "blue"
  | "yellow"
  | "indigo"
  | "green"
  | "purple"
  | "gray";

/** Degradado 180deg, sombra y color del glifo de cada tile (seccion 2.6) */
export const TILE_COLORS: Record<
  TileColor,
  { from: string; to: string; shadow: string | null; glyph: string }
> = {
  orange: { from: "#FFB340", to: "#FF8A00", shadow: "rgba(255,138,0,.6)", glyph: "#fff" },
  blue: { from: "#5AC8FA", to: "#1E8FE0", shadow: "rgba(30,143,224,.6)", glyph: "#fff" },
  yellow: { from: "#FFE066", to: "#F5B800", shadow: "rgba(245,184,0,.5)", glyph: "#3A2A00" },
  indigo: { from: "#8C95FF", to: "#4F5BF0", shadow: "rgba(79,91,240,.6)", glyph: "#fff" },
  green: { from: "#5FE07F", to: "#24A846", shadow: "rgba(36,168,70,.6)", glyph: "#fff" },
  purple: { from: "#9A66F5", to: "#5B22C4", shadow: "rgba(91,34,196,.6)", glyph: "#fff" },
  gray: { from: "#6E6E75", to: "#48484E", shadow: null, glyph: "#fff" },
};

export type CategoryStyle = { icon: LucideIcon | null; color: TileColor };

export const FALLBACK_CATEGORY_STYLE: CategoryStyle = { icon: null, color: "gray" };

/**
 * Estilo por categoria: el color y el icono del tile salen de aqui y de
 * ningun otro lado. Las categorias son texto libre del usuario, asi que se
 * empata por nombre normalizado (sin acentos, minusculas). Solo hay
 * entradas para categorias que ya existen en la app; una categoria nueva
 * sin entrada cae al tile gris con la inicial del comercio.
 */
const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  gasolina: { icon: FuelIcon, color: "blue" },
  desayunos: { icon: UtensilsIcon, color: "yellow" },
  salidas: { icon: WineIcon, color: "purple" },
  renta: { icon: HomeIcon, color: "indigo" },
  psicologa: { icon: BrainIcon, color: "indigo" },
  sueldo: { icon: BanknoteIcon, color: "green" },
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function getCategoryStyle(categoryName: string | null | undefined): CategoryStyle {
  if (!categoryName) return FALLBACK_CATEGORY_STYLE;
  return CATEGORY_STYLES[normalize(categoryName)] ?? FALLBACK_CATEGORY_STYLE;
}
