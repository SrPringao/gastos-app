export function normalizeCardName(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}
