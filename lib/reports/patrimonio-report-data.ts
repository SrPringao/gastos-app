import { getAccounts } from "@/lib/services/accounts";
import {
  getExpenseCountThisMonth,
  getSpentByAccountThisMonth,
  getSpentByCategoryThisMonth,
  getSpentByMonthLastNMonths,
  getTotalSpentThisMonth,
} from "@/lib/services/dashboard";
import { getFixedExpenses } from "@/lib/services/fixed-expenses";
import { getMonthlyBudget } from "@/lib/services/monthly-budgets";
import {
  getNetWorthEntries,
  getNetWorthProjections,
} from "@/lib/services/net-worth";
import { formatDate, todayDateString } from "@/lib/utils/dates";
import type { CurrentUser } from "@/lib/auth";
import type { PatrimonioReportOptions } from "@/lib/reports/report-options";

export type ReportLine = {
  label: string;
  detail?: string;
  amountLabel: string;
  amountCents: number;
};

export type ReportMonth = {
  monthKey: string;
  label: string;
  spentLabel: string;
  spentCents: number;
  budgetLabel: string | null;
  budgetCents: number | null;
};

export type PatrimonioReportData = {
  generatedOn: string;
  generatedAtLabel: string;
  monthKey: string;
  monthLabel: string;
  ownerName: string;
  fileStamp: string;
  options: PatrimonioReportOptions;
  netCents: number;
  netLabel: string;
  assetsCents: number;
  assetsLabel: string;
  debtsCents: number;
  debtsLabel: string;
  previstoCents: number;
  previstoLabel: string;
  netAfterPrevistoCents: number;
  netAfterPrevistoLabel: string;
  assets: ReportLine[];
  debts: ReportLine[];
  projections: ReportLine[];
  spentCents: number;
  spentLabel: string;
  expenseCount: number;
  budgetCents: number | null;
  budgetLabel: string | null;
  budgetRemainingLabel: string | null;
  budgetPctLabel: string | null;
  spentByCategory: ReportLine[];
  spentByAccount: ReportLine[];
  months: ReportMonth[];
  fixedExpenses: ReportLine[];
  fixedTotalLabel: string;
  facts: string[];
};

function formatPdfCurrency(cents: number): string {
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, "0");
  const grouped = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}$${grouped}.${frac}`;
}

function monthLabelFromKey(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const raw = new Date(y, m - 1, 1).toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function pct(part: number, whole: number): string | null {
  if (whole <= 0) return null;
  return `${Math.round((part / whole) * 100)}%`;
}

export async function getPatrimonioReportData(
  user: CurrentUser,
  options: PatrimonioReportOptions
): Promise<PatrimonioReportData> {
  const generatedOn = todayDateString();
  const monthKey = generatedOn.slice(0, 7);
  const generatedAtLabel = new Date().toLocaleString("es-MX", {
    timeZone: "America/Mexico_City",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const [accounts, entries, projections, monthBundle, fixed] = await Promise.all([
    options.includePatrimonio ? getAccounts(user.id) : Promise.resolve([]),
    options.includePatrimonio ? getNetWorthEntries(user.id) : Promise.resolve([]),
    options.includePatrimonio
      ? getNetWorthProjections(user.id)
      : Promise.resolve([]),
    options.includeCurrentMonth
      ? Promise.all([
          getTotalSpentThisMonth(user.id, monthKey),
          getExpenseCountThisMonth(user.id, monthKey),
          getMonthlyBudget(user.id, monthKey),
          getSpentByCategoryThisMonth(user.id, monthKey),
          getSpentByAccountThisMonth(user.id, monthKey),
        ])
      : Promise.resolve(null),
    options.includeFixedExpenses
      ? getFixedExpenses(user.id)
      : Promise.resolve([]),
  ]);

  const spentCents = monthBundle?.[0] ?? 0;
  const expenseCount = monthBundle?.[1] ?? 0;
  const budgetCents = monthBundle?.[2] ?? null;
  const byCategory = monthBundle?.[3] ?? [];
  const byAccount = monthBundle?.[4] ?? [];

  const monthRows = options.includeHistory
    ? await getSpentByMonthLastNMonths(user.id, options.historyMonths, monthKey)
    : [];

  const accountName = (id: number | null) =>
    accounts.find((a) => a.id === id)?.name;

  const assets = entries
    .filter((e) => e.kind === "asset")
    .map((e) => ({
      label: e.label,
      detail: accountName(e.accountId),
      amountLabel: formatPdfCurrency(e.amount),
      amountCents: e.amount,
    }));
  const debts = entries
    .filter((e) => e.kind === "debt")
    .map((e) => {
      const due = e.dueDate ? formatDate(e.dueDate) : null;
      const extra = [accountName(e.accountId), due ? `limite ${due}` : null]
        .filter(Boolean)
        .join(" · ");
      return {
        label: e.label,
        detail: extra || undefined,
        amountLabel: formatPdfCurrency(e.amount),
        amountCents: e.amount,
      };
    });

  const projectionLines = projections.map((p) => ({
    label: p.label,
    amountLabel: formatPdfCurrency(p.amount),
    amountCents: p.amount,
  }));

  const assetsCents = assets.reduce((s, e) => s + e.amountCents, 0);
  const debtsCents = debts.reduce((s, e) => s + e.amountCents, 0);
  const netCents = assetsCents - debtsCents;
  const previstoCents = projectionLines.reduce((s, e) => s + e.amountCents, 0);
  const netAfterPrevistoCents = netCents - previstoCents;

  const budgets = await Promise.all(
    monthRows.map((row) => getMonthlyBudget(user.id, row.month))
  );

  const months: ReportMonth[] = monthRows.map((row, i) => ({
    monthKey: row.month,
    label: monthLabelFromKey(row.month),
    spentLabel: formatPdfCurrency(row.total),
    spentCents: row.total,
    budgetCents: budgets[i],
    budgetLabel: budgets[i] != null ? formatPdfCurrency(budgets[i]!) : null,
  }));

  const spentByCategory: ReportLine[] = [...byCategory]
    .sort((a, b) => b.total - a.total)
    .map((row) => ({
      label: row.categoryName?.trim() || "Sin categoria",
      amountLabel: formatPdfCurrency(row.total),
      amountCents: row.total,
    }));

  const spentByAccount: ReportLine[] = [...byAccount]
    .sort((a, b) => b.total - a.total)
    .map((row) => ({
      label: row.accountName,
      amountLabel: formatPdfCurrency(row.total),
      amountCents: row.total,
    }));

  const fixedLines: ReportLine[] = fixed.map((item) => ({
    label: item.name,
    detail: [
      item.category,
      item.dayOfMonth ? `dia ${item.dayOfMonth}` : null,
    ]
      .filter(Boolean)
      .join(" · ") || undefined,
    amountLabel: formatPdfCurrency(item.amount),
    amountCents: item.amount,
  }));
  const fixedTotal = fixedLines.reduce((s, e) => s + e.amountCents, 0);

  const facts: string[] = [];
  if (options.includePatrimonio) {
    facts.push(
      `Patrimonio neto ${formatPdfCurrency(netCents)} = positivos ${formatPdfCurrency(assetsCents)} menos deudas ${formatPdfCurrency(debtsCents)}.`
    );
    if (previstoCents > 0) {
      facts.push(
        `Despues de gastos previstos (${formatPdfCurrency(previstoCents)}) el neto queda en ${formatPdfCurrency(netAfterPrevistoCents)}.`
      );
    }
    const nextDebt = entries
      .filter((e) => e.kind === "debt" && e.dueDate)
      .slice()
      .sort((a, b) => {
        const da = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const db = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return da - db;
      })[0];
    if (nextDebt?.dueDate) {
      facts.push(
        `Deuda con fecha mas cercana: ${nextDebt.label} por ${formatPdfCurrency(nextDebt.amount)} (limite ${formatDate(nextDebt.dueDate)}).`
      );
    }
  }
  if (options.includeCurrentMonth) {
    if (budgetCents != null && budgetCents > 0) {
      facts.push(
        `En ${monthLabelFromKey(monthKey)} llevas ${formatPdfCurrency(spentCents)} de ${formatPdfCurrency(budgetCents)} de presupuesto (${pct(spentCents, budgetCents) ?? "0%"}, ${expenseCount} gastos).`
      );
    } else {
      facts.push(
        `En ${monthLabelFromKey(monthKey)} llevas ${formatPdfCurrency(spentCents)} en ${expenseCount} gastos registrados. Sin presupuesto fijado para este mes.`
      );
    }
  }
  if (options.includeFixedExpenses && fixedTotal > 0) {
    facts.push(
      `Gastos fijos recurrentes: ${formatPdfCurrency(fixedTotal)} al mes (${fixedLines.length} conceptos). No se mezclan con el gastado del mes salvo que tambien se hayan capturado como gasto.`
    );
  }

  return {
    generatedOn,
    generatedAtLabel,
    monthKey,
    monthLabel: monthLabelFromKey(monthKey),
    ownerName: user.displayName?.trim() || user.email || "Usuario",
    fileStamp: generatedOn,
    options,
    netCents,
    netLabel: formatPdfCurrency(netCents),
    assetsCents,
    assetsLabel: formatPdfCurrency(assetsCents),
    debtsCents,
    debtsLabel: formatPdfCurrency(debtsCents),
    previstoCents,
    previstoLabel: formatPdfCurrency(previstoCents),
    netAfterPrevistoCents,
    netAfterPrevistoLabel: formatPdfCurrency(netAfterPrevistoCents),
    assets,
    debts,
    projections: projectionLines,
    spentCents,
    spentLabel: formatPdfCurrency(spentCents),
    expenseCount,
    budgetCents,
    budgetLabel: budgetCents != null ? formatPdfCurrency(budgetCents) : null,
    budgetRemainingLabel:
      budgetCents != null ? formatPdfCurrency(budgetCents - spentCents) : null,
    budgetPctLabel: budgetCents != null ? pct(spentCents, budgetCents) : null,
    spentByCategory,
    spentByAccount,
    months,
    fixedExpenses: fixedLines,
    fixedTotalLabel: formatPdfCurrency(fixedTotal),
    facts,
  };
}
