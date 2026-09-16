export const HISTORY_MONTH_OPTIONS = [3, 6, 12] as const;

export type PatrimonioReportOptions = {
  includePatrimonio: boolean;
  includeCurrentMonth: boolean;
  includeHistory: boolean;
  historyMonths: number;
  includeFixedExpenses: boolean;
};

export const DEFAULT_REPORT_OPTIONS: PatrimonioReportOptions = {
  includePatrimonio: true,
  includeCurrentMonth: true,
  includeHistory: false,
  historyMonths: 6,
  includeFixedExpenses: false,
};

export function hasAnyReportSection(options: PatrimonioReportOptions): boolean {
  return (
    options.includePatrimonio ||
    options.includeCurrentMonth ||
    options.includeHistory ||
    options.includeFixedExpenses
  );
}

export function parseReportOptions(input: unknown): {
  options?: PatrimonioReportOptions;
  error?: string;
} {
  if (!input || typeof input !== "object") {
    return { error: "Opciones invalidas" };
  }
  const raw = input as Record<string, unknown>;
  const historyMonthsRaw = Number(raw.historyMonths);
  const historyMonths = HISTORY_MONTH_OPTIONS.includes(
    historyMonthsRaw as (typeof HISTORY_MONTH_OPTIONS)[number]
  )
    ? historyMonthsRaw
    : 6;

  const options: PatrimonioReportOptions = {
    includePatrimonio: Boolean(raw.includePatrimonio),
    includeCurrentMonth: Boolean(raw.includeCurrentMonth),
    includeHistory: Boolean(raw.includeHistory),
    historyMonths,
    includeFixedExpenses: Boolean(raw.includeFixedExpenses),
  };

  if (!hasAnyReportSection(options)) {
    return { error: "Elige al menos una seccion" };
  }

  return { options };
}
