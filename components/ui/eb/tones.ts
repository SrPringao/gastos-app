/** Tonos de segmentos de barra y puntos de leyenda (seccion 3.3) */
export type SegmentTone = "accent" | "green" | "purple" | "gray" | "positive" | "negative";

/** Degradado 180deg de cada segmento: claro -> base, y glow opcional */
export const SEGMENT_STYLES: Record<SegmentTone, { background: string; glow?: string }> = {
  accent: {
    background: "linear-gradient(180deg, var(--eb-accent-light), var(--eb-accent))",
    glow: "0 0 12px var(--eb-accent-glow)",
  },
  green: { background: "linear-gradient(180deg, #5FE07F, #28B44C)" },
  purple: { background: "linear-gradient(180deg, #D4B0FF, #A673F0)" },
  gray: { background: "linear-gradient(180deg, #8E8E93, #636366)" },
  positive: {
    background: "linear-gradient(180deg, #6BE58A, #24A846)",
    glow: "0 0 12px rgba(48,209,88,0.45)",
  },
  negative: { background: "linear-gradient(180deg, #FF8E88, #E5484D)" },
};

/** Color del punto de la leyenda para cada tono */
export const SEGMENT_DOT_COLORS: Record<SegmentTone, string> = {
  accent: "var(--eb-accent)",
  green: "#30D158",
  purple: "#BF8CFF",
  gray: "#8E8E93",
  positive: "#30D158",
  negative: "#FF6961",
};

