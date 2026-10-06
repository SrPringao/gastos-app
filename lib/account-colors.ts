/**
 * Pares claro/oscuro para tarjetas de cuenta y tiles de Patrimonio, a
 * partir del color que el usuario ya le dio a cada metodo de pago.
 */

type Rgb = [number, number, number];

function parseHex(hex: string | null | undefined): Rgb | null {
  if (!hex) return null;
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

function mix(color: Rgb, target: Rgb, amount: number): Rgb {
  return color.map((c, i) => c + (target[i] - c) * amount) as Rgb;
}

/** Luminancia relativa aproximada (0 negro, 1 blanco) */
function luminance([r, g, b]: Rgb): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export type AccountTone = {
  light: string;
  dark: string;
  /** Un poco mas claro que `light`: final del degradado de barras */
  bright: string;
  /** Sombra de la tarjeta: el oscuro con alpha */
  shadow: string;
};

const FALLBACK: Rgb = [110, 110, 117];
const BLACK: Rgb = [0, 0, 0];
const WHITE: Rgb = [255, 255, 255];

/**
 * Paleta de 7 swatches del catalogo de Cuentas (base -> oscuro). El color
 * guardado en la cuenta es la base; su par oscuro sale de aqui.
 */
export const PAYMENT_METHOD_PALETTE: { from: string; to: string }[] = [
  { from: "#13969C", to: "#0A5559" },
  { from: "#3E44C9", to: "#1E2170" },
  { from: "#6B3FC4", to: "#3A1C7A" },
  { from: "#E0573A", to: "#7A1F12" },
  { from: "#F08A24", to: "#9A4A0C" },
  { from: "#2E7A45", to: "#173F24" },
  { from: "#5A5A63", to: "#26262B" },
];

export function paletteEntry(hex: string | null | undefined) {
  if (!hex) return null;
  return PAYMENT_METHOD_PALETTE.find((p) => p.from.toLowerCase() === hex.toLowerCase()) ?? null;
}

/** Chip plateado para colores frios (azules, morados, verdes azulados) o grises */
export function chipForColor(hex: string | null | undefined): "gold" | "silver" {
  const rgb = parseHex(hex);
  if (!rgb) return "silver";
  const [r, g, b] = rgb.map((c) => c / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  if (saturation < 0.25) return "silver";
  let hue = 0;
  if (max === r) hue = ((g - b) / (max - min)) % 6;
  else if (max === g) hue = (b - r) / (max - min) + 2;
  else hue = (r - g) / (max - min) + 4;
  hue = (hue * 60 + 360) % 360;
  return hue >= 170 && hue <= 300 ? "silver" : "gold";
}

export function accountTone(hex: string | null | undefined): AccountTone {
  const fromPalette = paletteEntry(hex);
  if (fromPalette) {
    const light = parseHex(fromPalette.from)!;
    const dark = parseHex(fromPalette.to)!;
    return {
      light: fromPalette.from,
      dark: fromPalette.to,
      bright: toHex(mix(light, WHITE, 0.12)),
      shadow: `rgba(${dark[0]},${dark[1]},${dark[2]},0.9)`,
    };
  }
  let base = parseHex(hex) ?? FALLBACK;
  // Colores muy claros (lima, blanco) o casi negros no aguantan texto
  // blanco encima ni dejan ver el degradado: se llevan a un rango medio.
  const lum = luminance(base);
  if (lum > 0.6) base = mix(base, BLACK, Math.min(0.55, (lum - 0.45) * 1.6));
  if (lum < 0.12) base = mix(base, WHITE, 0.22);

  const light = base;
  const dark = mix(base, BLACK, 0.4);
  const [r, g, b] = dark;
  return {
    light: toHex(light),
    dark: toHex(dark),
    bright: toHex(mix(light, WHITE, 0.12)),
    shadow: `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},0.9)`,
  };
}
