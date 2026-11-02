import { todayDateString } from "@/lib/utils/dates";

/**
 * Tipo de cambio a pesos con Frankfurter (datos del Banco Central Europeo,
 * gratis y sin llave). Pide un dia concreto; en fin de semana o festivo la
 * API responde con el ultimo dia habil anterior.
 */
const FRANKFURTER_URL = "https://api.frankfurter.dev/v1";

export type FxRate = {
  /** Pesos por 1 unidad de la moneda */
  rate: number;
  /** Dia (YYYY-MM-DD) del tipo de cambio que uso el BCE */
  date: string;
};

/**
 * Pesos por 1 euro el dia `date`. Fechas futuras usan el tipo mas reciente.
 * null si la API no responde (el gasto se guarda igual y se completa despues).
 */
export async function getEurToMxnRate(date: string): Promise<FxRate | null> {
  const day = date > todayDateString() ? "latest" : date;
  try {
    const res = await fetch(`${FRANKFURTER_URL}/${day}?base=EUR&symbols=MXN`, {
      signal: AbortSignal.timeout(5000),
      // Un dia pasado no cambia; "latest" se refresca cada hora
      next: { revalidate: day === "latest" ? 3600 : 60 * 60 * 24 * 30 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { date?: string; rates?: { MXN?: number } };
    const rate = data.rates?.MXN;
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0 || !data.date) return null;
    return { rate, date: data.date };
  } catch {
    return null;
  }
}
