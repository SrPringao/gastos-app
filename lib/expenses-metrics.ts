/**
 * KPIs y series de la pagina Gastos (parte B del rediseño). Funciones
 * puras: reciben los gastos del mes ya leidos de la DB y la fecha de hoy
 * (YYYY-MM-DD en la zona de la app).
 */

import { daysInMonth, type SpendSegmentTone } from "@/lib/dashboard-metrics";
import { dbDateToInputValue } from "@/lib/utils/dates";

export type MonthExpense = {
  id: number;
  amount: number;
  date: Date | string;
  description: string | null;
  accountId: number;
  accountName: string;
  accountColor?: string | null;
  categoryId: number | null;
  categoryName: string | null;
};

/** Tonos por cuenta en orden de gasto del mes; de la 4a en adelante, gris */
type AccountTone = SpendSegmentTone;
const TONES: AccountTone[] = ["accent", "green", "purple"];

export function expenseDay(expense: { date: Date | string }): string {
  return dbDateToInputValue(expense.date);
}

/** "Revolut Crédito" -> "Revolut" (subtitulos cortos en movil) */
export function shortAccountName(name: string): string {
  const short = name.replace(/\s+(cr[eé]dito|d[eé]bito)$/i, "").trim();
  return short || name;
}

// ---------------------------------------------------------------------------
// Totales por cuenta (filtro del Historial y leyendas)
// ---------------------------------------------------------------------------

export type AccountTotal = {
  accountId: number;
  accountName: string;
  total: number;
  count: number;
  /** % del gasto del mes (0..100) */
  share: number;
  tone: AccountTone;
};

export function buildAccountTotals(expenses: MonthExpense[]): AccountTotal[] {
  const byAccount = new Map<number, { accountName: string; total: number; count: number }>();
  for (const e of expenses) {
    const current = byAccount.get(e.accountId) ?? { accountName: e.accountName, total: 0, count: 0 };
    current.total += e.amount;
    current.count += 1;
    byAccount.set(e.accountId, current);
  }
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  return [...byAccount.entries()]
    .map(([accountId, v]) => ({ accountId, ...v }))
    .sort((a, b) => b.total - a.total)
    .map((row, index) => ({
      ...row,
      share: total > 0 ? (row.total / total) * 100 : 0,
      tone: TONES[index] ?? "gray",
    }));
}

// ---------------------------------------------------------------------------
// KPIs: gastado, transacciones, promedio, por dia, mayor gasto
// ---------------------------------------------------------------------------

/** Dias del mes que ya transcurrieron (mes actual: hasta hoy; pasado: todos) */
export function elapsedDays(monthKey: string, today: string): number {
  const current = today.slice(0, 7);
  if (monthKey < current) return daysInMonth(monthKey);
  if (monthKey > current) return 0;
  return Number(today.slice(8, 10));
}

export type MonthStats = {
  total: number;
  count: number;
  average: number;
  perDay: number;
  largest: { expense: MonthExpense; share: number } | null;
};

export function buildMonthStats(expenses: MonthExpense[], monthKey: string, today: string): MonthStats {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const count = expenses.length;
  const days = elapsedDays(monthKey, today);
  const largest = expenses.reduce<MonthExpense | null>(
    (max, e) => (!max || e.amount > max.amount ? e : max),
    null
  );
  return {
    total,
    count,
    average: count > 0 ? Math.round(total / count) : 0,
    perDay: days > 0 ? Math.round(total / days) : 0,
    largest: largest ? { expense: largest, share: total > 0 ? (largest.amount / total) * 100 : 0 } : null,
  };
}

// ---------------------------------------------------------------------------
// Serie diaria por cuenta (grafica "Gasto por dia")
// ---------------------------------------------------------------------------

/** Paso "bonito" (1, 2 o 5 x 10^n) igual o mayor a `value` */
export function niceStep(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

export type DaySegment = { key: string; tone: AccountTone; total: number };

export type DayPoint = {
  day: number;
  date: string;
  total: number;
  /** De abajo hacia arriba, en orden de gasto del mes */
  segments: DaySegment[];
  /** Desglose completo por cuenta (tooltip) */
  byAccount: { accountName: string; total: number; tone: AccountTone }[];
  isFuture: boolean;
  isToday: boolean;
};

export type DailySeries = {
  days: DayPoint[];
  /** Tope del eje: 3 pasos "bonitos" ($6k, $4k, $2k, $0) */
  axisMax: number;
  axisStep: number;
  /** Dia con mayor gasto (seleccionado por defecto) */
  peakDate: string | null;
  /** Leyenda: hasta 3 cuentas + "Otras" */
  legend: { key: string; label: string; tone: AccountTone }[];
};

export function buildDailySeries(
  expenses: MonthExpense[],
  monthKey: string,
  today: string,
  accountTotals = buildAccountTotals(expenses)
): DailySeries {
  const toneOf = new Map(accountTotals.map((a) => [a.accountId, a.tone]));
  const order = new Map(accountTotals.map((a, i) => [a.accountId, i]));
  const nameOf = new Map(accountTotals.map((a) => [a.accountId, a.accountName]));
  const count = daysInMonth(monthKey);
  const days: DayPoint[] = [];

  for (let day = 1; day <= count; day++) {
    const date = `${monthKey}-${String(day).padStart(2, "0")}`;
    days.push({
      day,
      date,
      total: 0,
      segments: [],
      byAccount: [],
      isFuture: date > today,
      isToday: date === today,
    });
  }

  const perDayAccount = new Map<string, Map<number, number>>();
  for (const e of expenses) {
    const date = expenseDay(e);
    const map = perDayAccount.get(date) ?? new Map<number, number>();
    map.set(e.accountId, (map.get(e.accountId) ?? 0) + e.amount);
    perDayAccount.set(date, map);
  }

  for (const point of days) {
    const map = perDayAccount.get(point.date);
    if (!map) continue;
    const accounts = [...map.entries()].sort((a, b) => (order.get(a[0]) ?? 99) - (order.get(b[0]) ?? 99));
    point.total = accounts.reduce((sum, [, total]) => sum + total, 0);
    point.byAccount = accounts.map(([id, total]) => ({
      accountName: nameOf.get(id) ?? "",
      total,
      tone: toneOf.get(id) ?? "gray",
    }));
    // Las cuentas grises (4a en adelante) se apilan juntas
    const segments: DaySegment[] = [];
    for (const [id, total] of accounts) {
      const tone = toneOf.get(id) ?? "gray";
      const key = tone === "gray" ? "others" : String(id);
      const existing = segments.find((s) => s.key === key);
      if (existing) existing.total += total;
      else segments.push({ key, tone, total });
    }
    point.segments = segments;
  }

  const peak = days.reduce<DayPoint | null>((max, d) => (d.total > (max?.total ?? 0) ? d : max), null);
  const axisStep = niceStep((peak?.total ?? 0) / 3);
  const legend = accountTotals
    .filter((a) => a.tone !== "gray")
    .map((a) => ({ key: String(a.accountId), label: a.accountName, tone: a.tone }));
  if (accountTotals.some((a) => a.tone === "gray")) {
    legend.push({ key: "others", label: "Otras", tone: "gray" });
  }

  return { days, axisMax: axisStep * 3, axisStep, peakDate: peak?.date ?? null, legend };
}

// ---------------------------------------------------------------------------
// Ritmo del mes (acumulado contra presupuesto)
// ---------------------------------------------------------------------------

/** Redondea hacia arriba a 1 cifra significativa (9,900 -> 10,000) */
export function roundUpSignificant(value: number): number {
  if (value <= 0) return 0;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude) * magnitude;
}

export type Pace = {
  /** Acumulado por dia, desde el dia 1 hasta hoy (o fin de mes si ya paso) */
  cumulative: { day: number; total: number }[];
  daysInMonth: number;
  /** Dia de hoy dentro del mes; null si el mes ya paso o no ha empezado */
  todayDay: number | null;
  spent: number;
  budget: number | null;
  axisMax: number;
  /** Lo que "deberias" llevar hoy: presupuesto x dia / dias del mes */
  idealToday: number | null;
  /** gastado − ritmo ideal (positivo = arriba del ritmo) */
  difference: number | null;
  daysLeft: number;
  /** Cuanto puedes gastar por dia lo que resta del mes */
  perDayLeft: number | null;
  isPast: boolean;
};

export function buildPace(input: {
  expenses: MonthExpense[];
  budget: number | null;
  monthKey: string;
  today: string;
}): Pace {
  const { expenses, budget, monthKey, today } = input;
  const total = daysInMonth(monthKey);
  const current = today.slice(0, 7);
  const isPast = monthKey < current;
  const isFuture = monthKey > current;
  const lastDay = isPast ? total : isFuture ? 0 : Number(today.slice(8, 10));

  const perDay = new Map<number, number>();
  for (const e of expenses) {
    const day = Number(expenseDay(e).slice(8, 10));
    perDay.set(day, (perDay.get(day) ?? 0) + e.amount);
  }
  const cumulative: { day: number; total: number }[] = [];
  let running = 0;
  for (let day = 1; day <= lastDay; day++) {
    running += perDay.get(day) ?? 0;
    cumulative.push({ day, total: running });
  }
  const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const hasBudget = !!budget && budget > 0;
  const todayDay = !isPast && !isFuture ? lastDay : null;
  const daysLeft = todayDay !== null ? total - todayDay : 0;
  const idealToday = hasBudget ? Math.round((budget! * (isPast ? total : lastDay)) / total) : null;
  const remaining = hasBudget ? budget! - spent : null;

  return {
    cumulative,
    daysInMonth: total,
    todayDay,
    spent,
    budget: hasBudget ? budget! : null,
    axisMax: roundUpSignificant(Math.max(hasBudget ? budget! * 1.1 : 0, spent * 1.1, 1)),
    idealToday,
    difference: idealToday !== null ? spent - idealToday : null,
    daysLeft,
    perDayLeft:
      remaining !== null && remaining > 0 && daysLeft > 0
        ? Math.round(remaining / 100 / daysLeft) * 100
        : remaining !== null && remaining > 0 && todayDay !== null
          ? remaining
          : null,
    isPast,
  };
}

// ---------------------------------------------------------------------------
// Historial agrupado por dia
// ---------------------------------------------------------------------------

export type DayGroup<T> = { date: string; items: T[]; total: number };

/** Agrupa en dias consecutivos respetando el orden recibido */
export function groupByDayWithTotals<T extends { date: Date | string; amount: number }>(
  items: T[]
): DayGroup<T>[] {
  const groups: DayGroup<T>[] = [];
  for (const item of items) {
    const date = expenseDay(item);
    const last = groups[groups.length - 1];
    if (last && last.date === date) {
      last.items.push(item);
      last.total += item.amount;
    } else {
      groups.push({ date, items: [item], total: item.amount });
    }
  }
  return groups;
}
