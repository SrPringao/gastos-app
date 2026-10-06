/** Signo menos tipografico (U+2212), no el guion del teclado */
export const MINUS_SIGN = "−";

const withCents = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const withoutCents = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export type MoneySign = "negative" | "positive";

/**
 * Formatea centavos como MXN. `cents: false` redondea a pesos ($6,103),
 * para widgets compactos. El signo se agrega aparte para usar U+2212.
 */
export function formatMoney(
  amountCents: number,
  options: { cents?: boolean; sign?: MoneySign } = {}
): string {
  const { cents = true, sign } = options;
  const abs = Math.abs(amountCents) / 100;
  const body = (cents ? withCents : withoutCents).format(abs);
  const isNegative = sign === "negative" || (sign === undefined && amountCents < 0);
  if (isNegative && amountCents !== 0) return `${MINUS_SIGN}${body}`;
  if (sign === "positive" && amountCents !== 0) return `+${body}`;
  return body;
}

/** Separa "$5,635.60" en ["$5,635", ".60"] para los numeros heroe */
export function splitMoney(
  amountCents: number,
  options: { sign?: MoneySign } = {}
): { whole: string; fraction: string } {
  const full = formatMoney(amountCents, { cents: true, sign: options.sign });
  const dot = full.lastIndexOf(".");
  if (dot === -1) return { whole: full, fraction: "" };
  return { whole: full.slice(0, dot), fraction: full.slice(dot) };
}
