export function parseAmountInput(raw: unknown): number {
  if (typeof raw === "number") return raw;
  if (typeof raw !== "string") return NaN;

  const cleaned = raw.replace(/[^0-9.-]/g, "");
  return parseFloat(cleaned);
}
