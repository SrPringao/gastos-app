import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { cardNameMappings, expenses } from "@/lib/db/schema";
import { getAccounts } from "@/lib/services/accounts";
import { getNetWorthEntries } from "@/lib/services/net-worth";
import { accountTone, chipForColor } from "@/lib/account-colors";

export type PaymentMethodType = "credit" | "debit" | "cash";

export type CatalogWalletName = { id: number; rawName: string };

export type CatalogPatrimonioItem = {
  id: number;
  kind: "asset" | "debt";
  /** Centavos. Solo se muestra en el Estado B, con privacidad */
  amount: number;
  label: string;
};

export type PaymentMethodCatalogItem = {
  id: number;
  name: string;
  type: PaymentMethodType;
  color: string | null;
  colorFrom: string;
  colorTo: string;
  chip: "gold" | "silver";
  /** Solo credito */
  paymentDay: number | null;
  /** Conteo de gastos del mes con este metodo (no es un monto) */
  usesThisMonth: number;
  /** Conteo total de gastos (para la confirmacion de archivar) */
  usesTotal: number;
  walletNames: CatalogWalletName[];
  isLinkedToShortcut: boolean;
  patrimonioItem: CatalogPatrimonioItem | null;
  hasBalance: boolean;
  archived: boolean;
};

const TYPE_ORDER: Record<PaymentMethodType, number> = { credit: 0, debit: 1, cash: 2 };

/** Orden del catalogo: Credito, Debito, Efectivo; dentro, mas usados primero y luego nombre */
export function sortCatalog(items: PaymentMethodCatalogItem[]): PaymentMethodCatalogItem[] {
  return [...items].sort(
    (a, b) =>
      TYPE_ORDER[a.type] - TYPE_ORDER[b.type] ||
      b.usesThisMonth - a.usesThisMonth ||
      a.name.localeCompare(b.name, "es-MX")
  );
}

function monthBounds(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { start: `${monthKey}-01`, end: `${monthKey}-${String(last).padStart(2, "0")}` };
}

/**
 * Catalogo de metodos de pago para la pagina Cuentas. Incluye los
 * archivados (marcados) para el toggle "Mostrar archivados".
 */
export async function getPaymentMethodsCatalog(
  userId: string,
  monthKey: string
): Promise<PaymentMethodCatalogItem[]> {
  const { start, end } = monthBounds(monthKey);

  const [accounts, entries, mappings, monthUses, totalUses] = await Promise.all([
    getAccounts(userId, { includeArchived: true }),
    getNetWorthEntries(userId),
    db
      .select({ id: cardNameMappings.id, rawName: cardNameMappings.rawName, accountId: cardNameMappings.accountId })
      .from(cardNameMappings)
      .where(eq(cardNameMappings.userId, userId))
      .orderBy(cardNameMappings.rawName),
    db
      .select({ accountId: expenses.accountId, count: sql<number>`COUNT(*)::int` })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          sql`DATE(${expenses.date}) >= ${start}::date`,
          sql`DATE(${expenses.date}) <= ${end}::date`
        )
      )
      .groupBy(expenses.accountId),
    db
      .select({ accountId: expenses.accountId, count: sql<number>`COUNT(*)::int` })
      .from(expenses)
      .where(eq(expenses.userId, userId))
      .groupBy(expenses.accountId),
  ]);

  const monthCount = new Map(monthUses.map((r) => [r.accountId, r.count]));
  const totalCount = new Map(totalUses.map((r) => [r.accountId, r.count]));

  const items = accounts.map((account) => {
    const tone = accountTone(account.color);
    const walletNames = mappings
      .filter((m) => m.accountId === account.id)
      .map((m) => ({ id: m.id, rawName: m.rawName }));
    const entry = entries.find((e) => e.accountId === account.id) ?? null;
    return {
      id: account.id,
      name: account.name,
      type: account.type,
      color: account.color,
      colorFrom: tone.light,
      colorTo: tone.dark,
      chip: chipForColor(account.color),
      paymentDay: account.type === "credit" ? account.paymentDay : null,
      usesThisMonth: monthCount.get(account.id) ?? 0,
      usesTotal: totalCount.get(account.id) ?? 0,
      walletNames,
      isLinkedToShortcut: walletNames.length > 0,
      patrimonioItem: entry
        ? { id: entry.id, kind: entry.kind, amount: entry.amount, label: entry.label }
        : null,
      hasBalance: entry !== null,
      archived: account.archivedAt !== null,
    } satisfies PaymentMethodCatalogItem;
  });

  return sortCatalog(items);
}
