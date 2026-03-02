export function getDaysUntilPayment(
  cutoffDay: number | null,
  paymentDay: number | null
): number | null {
  if (cutoffDay === null || paymentDay === null) return null;

  const now = new Date();
  const today = now.getDate();

  let nextPayment = new Date(now.getFullYear(), now.getMonth(), paymentDay);
  if (today >= paymentDay) {
    nextPayment = new Date(now.getFullYear(), now.getMonth() + 1, paymentDay);
  }

  const diff = nextPayment.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Parsea fechas de la DB sin conversion de zona horaria.
 * Los Date con UTC midnight (ej. "2026-03-01T00:00:00.000Z") se muestran
 * un dia antes en zonas negativas; usamos partes UTC para el calendario.
 */
function parseDbDate(date: Date | string): Date {
  if (date instanceof Date) {
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth();
    const d = date.getUTCDate();
    return new Date(y, m, d);
  }
  const str = String(date).trim();
  const datePart = str.split("T")[0]?.split(" ")[0] ?? str.slice(0, 10);
  const [year, month, day] = datePart.split("-").map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return new Date(date);
  }
  return new Date(year, month - 1, day);
}

/**
 * Formato para mostrar: "1 mar 2026"
 */
export function formatDate(date: Date | string): string {
  const d = parseDbDate(date);
  return d.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Convierte fecha de DB a YYYY-MM-DD para input type="date"
 */
export function dbDateToInputValue(date: Date | string): string {
  const d = parseDbDate(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
