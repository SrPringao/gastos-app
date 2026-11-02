/**
 * Intercambio: catalogo de monedas y categorias, compartido por la pagina,
 * la API y el servicio. Los gastos viven en exchange_expenses, aparte del
 * resto de la app.
 */

export const EXCHANGE_CURRENCIES = ["MXN", "EUR"] as const;
export type ExchangeCurrency = (typeof EXCHANGE_CURRENCIES)[number];

export const EXCHANGE_CATEGORIES = [
  { value: "flights", label: "Vuelos", color: "#5E6BFF" },
  { value: "lodging", label: "Hospedaje", color: "#BF8CFF" },
  { value: "school", label: "Escuela", color: "#5AC8FA" },
  { value: "paperwork", label: "Trámites", color: "#FF9F0A" },
  { value: "transport", label: "Transporte", color: "#30D158" },
  { value: "food", label: "Comida", color: "#FF6961" },
  { value: "other", label: "Otros", color: "#8E8E93" },
] as const;

export type ExchangeCategory = (typeof EXCHANGE_CATEGORIES)[number]["value"];

export function isExchangeCurrency(value: unknown): value is ExchangeCurrency {
  return typeof value === "string" && (EXCHANGE_CURRENCIES as readonly string[]).includes(value);
}

export function isExchangeCategory(value: unknown): value is ExchangeCategory {
  return typeof value === "string" && EXCHANGE_CATEGORIES.some((c) => c.value === value);
}

export function exchangeCategoryMeta(value: string) {
  return EXCHANGE_CATEGORIES.find((c) => c.value === value) ?? EXCHANGE_CATEGORIES[EXCHANGE_CATEGORIES.length - 1];
}

export const CURRENCY_SYMBOL: Record<ExchangeCurrency, string> = { MXN: "$", EUR: "€" };

const formatters: Record<ExchangeCurrency, Intl.NumberFormat> = {
  MXN: new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 }),
  EUR: new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "EUR",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 2,
  }),
};

/** Centavos -> "$1,250.00" o "€1,250.00" */
export function formatExchangeMoney(cents: number, currency: ExchangeCurrency): string {
  return formatters[currency].format(cents / 100);
}

/** Lo que la pagina recibe del servidor (fechas como string) */
export type ExchangeExpenseItem = {
  id: number;
  amount: number;
  currency: ExchangeCurrency;
  reason: string;
  category: ExchangeCategory;
  /** YYYY-MM-DD */
  date: string;
  note: string | null;
  /** Monto en centavos de peso (al tipo de cambio del dia); null si falta el tipo */
  mxnAmount: number | null;
  /** Pesos por 1 unidad de la moneda; null en pesos o si falta */
  fxRate: number | null;
  /** Dia del tipo de cambio que se uso (el habil anterior en fin de semana) */
  fxDate: string | null;
};
