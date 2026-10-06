/**
 * KPIs del dashboard y de Patrimonio (seccion 5 del rediseño). Todo aqui
 * son funciones puras: reciben filas ya leidas de la DB y la fecha de hoy
 * (YYYY-MM-DD en la zona de la app) para poder probarlas sin servidor.
 */

import { dbDateToInputValue } from "@/lib/utils/dates";

const DAY_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Fechas
// ---------------------------------------------------------------------------

/**
 * YYYY-MM-DD de una fecha de calendario guardada en la DB. Las fechas
 * limite llegan como medianoche UTC; convertirlas a la zona de Mexico las
 * correria al dia anterior, asi que se toman sus partes UTC.
 */
export function toCalendarDate(value: Date | string): string {
  return dbDateToInputValue(value);
}

function ymdToUtcMs(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Dias de calendario de `from` a `to` (ambos YYYY-MM-DD) */
export function daysBetween(from: string, to: string): number {
  return Math.round((ymdToUtcMs(to) - ymdToUtcMs(from)) / DAY_MS);
}

export function daysInMonth(monthKey: string): number {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** "Hoy", "Mañana", "En 16 días", "Vencido hace 2 días" */
export function formatDaysUntil(days: number): string {
  if (days === 0) return "Hoy";
  if (days === 1) return "Mañana";
  if (days < 0) {
    const n = Math.abs(days);
    return `Vencido hace ${n} ${n === 1 ? "día" : "días"}`;
  }
  return `En ${days} días`;
}

// ---------------------------------------------------------------------------
// 5.1 Gasto del mes por cuenta
// ---------------------------------------------------------------------------

export type SpendByAccountRow = {
  accountId: number;
  accountName: string;
  total: number;
};

export type SpendSegmentTone = "accent" | "green" | "purple" | "gray";

export type SpendSegment = {
  key: string;
  label: string;
  total: number;
  /** % del total, redondeado */
  percent: number;
  /** % exacto, para el ancho de la barra */
  share: number;
  tone: SpendSegmentTone;
};

const SEGMENT_TONES: SpendSegmentTone[] = ["accent", "green", "purple"];

/**
 * Hasta 3 cuentas ordenadas de mayor a menor; si hay mas, el resto se
 * agrupa como "Otras" en gris.
 */
export function buildSpendSegments(
  rows: SpendByAccountRow[],
  maxSegments = 3
): { total: number; segments: SpendSegment[] } {
  const sorted = rows.filter((r) => r.total > 0).sort((a, b) => b.total - a.total);
  const total = sorted.reduce((sum, r) => sum + r.total, 0);
  if (total === 0) return { total: 0, segments: [] };

  const head = sorted.length > maxSegments ? sorted.slice(0, maxSegments) : sorted;
  const rest = sorted.length > maxSegments ? sorted.slice(maxSegments) : [];

  const segments: SpendSegment[] = head.map((row, index) => ({
    key: String(row.accountId),
    label: row.accountName,
    total: row.total,
    percent: Math.round((row.total / total) * 100),
    share: (row.total / total) * 100,
    tone: SEGMENT_TONES[index] ?? "gray",
  }));

  if (rest.length > 0) {
    const restTotal = rest.reduce((sum, r) => sum + r.total, 0);
    segments.push({
      key: "others",
      label: "Otras",
      total: restTotal,
      percent: Math.round((restTotal / total) * 100),
      share: (restTotal / total) * 100,
      tone: "gray",
    });
  }

  return { total, segments };
}

// ---------------------------------------------------------------------------
// 5.2 Presupuesto
// ---------------------------------------------------------------------------

export type BudgetSummary =
  | { state: "unset"; spent: number }
  | {
      state: "current" | "current-over" | "past" | "future";
      spent: number;
      budget: number;
      /** usado / presupuesto, 0..n (1 = 100%) */
      usedRatio: number;
      /** % usado redondeado (puede pasar de 100) */
      usedPercent: number;
      /** presupuesto − gastado (negativo si te pasaste) */
      remaining: number;
      /** Solo mes actual: dias que quedan despues de hoy */
      daysLeft: number | null;
      /** Solo mes actual con saldo: cuanto puedes gastar por dia, en centavos redondeados a pesos */
      perDay: number | null;
    };

export function buildBudgetSummary(input: {
  spent: number;
  budget: number | null;
  monthKey: string;
  today: string;
}): BudgetSummary {
  const { spent, budget, monthKey, today } = input;
  if (!budget || budget <= 0) return { state: "unset", spent };

  const usedRatio = spent / budget;
  const remaining = budget - spent;
  const currentMonthKey = today.slice(0, 7);
  const base = {
    spent,
    budget,
    usedRatio,
    usedPercent: Math.round(usedRatio * 100),
    remaining,
  };

  if (monthKey < currentMonthKey) {
    return { ...base, state: "past", daysLeft: null, perDay: null };
  }
  if (monthKey > currentMonthKey) {
    return { ...base, state: "future", daysLeft: null, perDay: null };
  }

  const dayOfMonth = Number(today.slice(8, 10));
  const daysLeft = daysInMonth(monthKey) - dayOfMonth;
  if (remaining < 0) {
    return { ...base, state: "current-over", daysLeft, perDay: null };
  }
  // El ultimo dia del mes todavia queda "hoy" para gastar lo que resta
  const perDayPesos = Math.round(remaining / 100 / Math.max(daysLeft, 1));
  return { ...base, state: "current", daysLeft, perDay: perDayPesos * 100 };
}

// ---------------------------------------------------------------------------
// 5.4 Proximos pagos y ciclo de deudas
// ---------------------------------------------------------------------------

export type DebtLike = {
  id: number;
  label: string;
  amount: number;
  dueDate: Date | string | null;
  accountId: number | null;
};

export type UpcomingPayment<T extends DebtLike = DebtLike> = {
  entry: T;
  dueDate: string;
  daysLeft: number;
  label: string;
  /** Vence en 3 dias o menos */
  isSoon: boolean;
};

/**
 * Proximo dia de pago a partir de hoy (incluido). Si el mes no tiene ese
 * dia (31 en noviembre) se usa su ultimo dia.
 */
export function nextPaymentDate(paymentDay: number, today: string): string {
  const [y, m, d] = today.split("-").map(Number);
  const build = (year: number, month: number) => {
    const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const day = Math.min(paymentDay, last);
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };
  const thisMonth = build(y, m);
  if (Number(thisMonth.slice(8, 10)) >= d) return thisMonth;
  return m === 12 ? build(y + 1, 1) : build(y, m + 1);
}

/**
 * Fecha de pago efectiva de una deuda: el dia de pago del metodo ligado
 * si lo tiene; si no, la fecha limite guardada en Patrimonio.
 */
export function effectiveDueDate(
  entry: { dueDate: Date | string | null; accountId: number | null },
  paymentDayByAccount: Map<number, number | null>,
  today: string
): string | null {
  const paymentDay = entry.accountId != null ? paymentDayByAccount.get(entry.accountId) : null;
  if (paymentDay) return nextPaymentDate(paymentDay, today);
  return entry.dueDate ? toCalendarDate(entry.dueDate) : null;
}

export function buildUpcomingPayments<T extends DebtLike>(
  debts: T[],
  today: string,
  paymentDayByAccount: Map<number, number | null> = new Map()
): UpcomingPayment<T>[] {
  return debts
    .map((entry) => ({ entry, due: effectiveDueDate(entry, paymentDayByAccount, today) }))
    .filter((x): x is { entry: T; due: string } => x.due !== null)
    .map(({ entry, due }) => {
      const dueDate = due;
      const daysLeft = daysBetween(today, dueDate);
      return {
        entry,
        dueDate,
        daysLeft,
        label: formatDaysUntil(daysLeft),
        isSoon: daysLeft <= 3,
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft || b.entry.amount - a.entry.amount);
}

/** El widget movil muestra la deuda mas proxima que todavia tiene saldo */
export function nextPaymentWithBalance<T extends DebtLike>(
  payments: UpcomingPayment<T>[]
): UpcomingPayment<T> | null {
  return payments.find((p) => p.entry.amount > 0) ?? null;
}

/**
 * Que tanto del ciclo ya paso (0..1). El ciclo es el mes que termina en
 * la fecha de pago: del mismo dia del mes anterior a la fecha de pago.
 */
export function debtCycleProgress(dueDate: string, today: string): number {
  const [y, m, d] = dueDate.split("-").map(Number);
  const prevMonthDays = new Date(Date.UTC(y, m - 1, 0)).getUTCDate();
  const start = new Date(Date.UTC(y, m - 2, Math.min(d, prevMonthDays)));
  const startYmd = start.toISOString().slice(0, 10);
  const total = daysBetween(startYmd, dueDate);
  if (total <= 0) return 1;
  const elapsed = daysBetween(startYmd, today);
  return Math.min(1, Math.max(0, elapsed / total));
}

// ---------------------------------------------------------------------------
// 5.5 Cuentas del dashboard
// ---------------------------------------------------------------------------

export type AccountLike = {
  id: number;
  name: string;
  type: "credit" | "debit" | "cash";
  color: string | null;
};

export type AssetLike = {
  id: number;
  label: string;
  amount: number;
  accountId: number | null;
  kind: "asset" | "debt";
  sortOrder: number;
  assetKind?: string | null;
};

export type AccountBalance<A extends AccountLike = AccountLike> = {
  entryId: number;
  label: string;
  balance: number;
  account: A;
};

/**
 * Saldos reales de debito/efectivo: los positivos de la seccion Cuentas
 * de Patrimonio ligados a un metodo de pago de esos tipos, en el orden
 * del usuario. Con mas de
 * `limit`, se quedan los de mayor saldo (conservando el orden).
 */
export function buildAccountBalances<A extends AccountLike>(
  entries: AssetLike[],
  accounts: A[],
  limit = 4
): AccountBalance<A>[] {
  const byId = new Map(accounts.map((a) => [a.id, a]));
  const balances = entries
    .filter(
      (e) => e.kind === "asset" && e.accountId != null && resolveAssetKind(e) === "account"
    )
    .map((e) => ({ entry: e, account: byId.get(e.accountId!) }))
    .filter(
      (x): x is { entry: AssetLike; account: A } =>
        !!x.account && (x.account.type === "debit" || x.account.type === "cash")
    )
    .sort((a, b) => a.entry.sortOrder - b.entry.sortOrder)
    .map(({ entry, account }) => ({
      entryId: entry.id,
      label: entry.label,
      balance: entry.amount,
      account,
    }));

  if (balances.length <= limit) return balances;
  const keep = new Set(
    [...balances]
      .sort((a, b) => b.balance - a.balance)
      .slice(0, limit)
      .map((b) => b.entryId)
  );
  return balances.filter((b) => keep.has(b.entryId));
}

export function countCreditAccounts(accounts: AccountLike[]): number {
  return accounts.filter((a) => a.type === "credit").length;
}

// ---------------------------------------------------------------------------
// 5.6 Patrimonio agrupado
// ---------------------------------------------------------------------------

export type AssetKind = "account" | "receivable" | "income";

/** Inferencia inicial cuando el positivo no tiene `assetKind` guardado */
export function inferAssetKind(entry: { label: string; accountId: number | null }): AssetKind {
  if (entry.accountId != null) return "account";
  if (/sueldo/i.test(entry.label)) return "income";
  return "receivable";
}

export function resolveAssetKind(entry: {
  label: string;
  accountId: number | null;
  assetKind?: string | null;
}): AssetKind {
  if (
    entry.assetKind === "account" ||
    entry.assetKind === "receivable" ||
    entry.assetKind === "income"
  ) {
    return entry.assetKind;
  }
  return inferAssetKind(entry);
}

export type ReceivableGroup<T> = {
  key: string;
  /** Nombre de la persona, o el nombre del positivo si no tiene contacto */
  name: string;
  /** Conceptos agrupados ("Figs · Tarjeta"); vacio si no hay contacto */
  concepts: string[];
  total: number;
  entries: T[];
};

/** "Te deben": agrupa por contacto; sin contacto, cada positivo es su fila */
export function groupReceivables<
  T extends { id: number; label: string; amount: number; contact?: string | null },
>(entries: T[]): ReceivableGroup<T>[] {
  const groups: ReceivableGroup<T>[] = [];
  const byContact = new Map<string, ReceivableGroup<T>>();

  for (const entry of entries) {
    const contact = entry.contact?.trim();
    if (!contact) {
      groups.push({
        key: `entry-${entry.id}`,
        name: entry.label,
        concepts: [],
        total: entry.amount,
        entries: [entry],
      });
      continue;
    }
    const key = contact.toLocaleLowerCase("es-MX");
    let group = byContact.get(key);
    if (!group) {
      group = { key: `contact-${key}`, name: contact, concepts: [], total: 0, entries: [] };
      byContact.set(key, group);
      groups.push(group);
    }
    group.total += entry.amount;
    group.entries.push(entry);
    group.concepts.push(entry.label);
  }

  return groups;
}

// ---------------------------------------------------------------------------
// 5.8 Limpieza de nombres de comercio
// ---------------------------------------------------------------------------

const AGGREGATORS: { pattern: RegExp; label: string }[] = [
  { pattern: /^mercado\s*pago\s*\*\s*/i, label: "Mercado Pago" },
  { pattern: /^mp\s*\*\s*/i, label: "Mercado Pago" },
  { pattern: /^paypal\s*\*\s*/i, label: "PayPal" },
  { pattern: /^clip(?:\s*mx)?\s*\*\s*/i, label: "Clip" },
];

function titleCase(value: string): string {
  return value
    .toLocaleLowerCase("es-MX")
    .replace(/(^|\s)(\p{L})/gu, (_, space: string, letter: string) =>
      `${space}${letter.toLocaleUpperCase("es-MX")}`
    );
}

/**
 * Solo presentacion: quita el prefijo del agregador ("Mercadopago *elotesal"
 * → "Elotesal") y lo devuelve aparte para el subtitulo. El dato original
 * en la DB no se toca.
 */
export function cleanMerchantName(raw: string | null | undefined): {
  name: string;
  aggregator: string | null;
} {
  const value = (raw ?? "").trim();
  if (!value) return { name: "Sin descripción", aggregator: null };

  for (const { pattern, label } of AGGREGATORS) {
    if (pattern.test(value)) {
      const rest = value.replace(pattern, "").trim();
      return { name: rest ? titleCase(rest) : label, aggregator: rest ? label : null };
    }
  }

  // Todo en minusculas ("ñokis", "starbucks") se capitaliza; lo demas se respeta (OXXO)
  if (value === value.toLocaleLowerCase("es-MX")) {
    return { name: titleCase(value), aggregator: null };
  }
  return { name: value, aggregator: null };
}

/** Inicial para tiles/avatares sin icono */
export function initialOf(value: string): string {
  const match = value.trim().match(/\p{L}|\p{N}/u);
  return match ? match[0].toLocaleUpperCase("es-MX") : "?";
}
