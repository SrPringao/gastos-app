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
  /** Sombra de la tarjeta: el oscuro con alpha */
  shadow: string;
};

const FALLBACK: Rgb = [110, 110, 117];
const BLACK: Rgb = [0, 0, 0];
const WHITE: Rgb = [255, 255, 255];

export function accountTone(hex: string | null | undefined): AccountTone {
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
    shadow: `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},0.9)`,
  };
}
