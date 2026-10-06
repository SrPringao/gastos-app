"use client";

import { useState } from "react";
import { ArrowUpDownIcon, ChevronDownIcon, ReceiptIcon, SearchIcon, XIcon } from "lucide-react";
import { EbCard } from "@/components/ui/eb/card";
import { GroupedList } from "@/components/ui/eb/grouped-list";
import { SEGMENT_DOT_COLORS } from "@/components/ui/eb/tones";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { DateRangeFilter } from "@/components/date-range-filter";
import { ExpenseRow, SwipeExpenseRow, type EditOptions } from "@/components/expenses/expense-row";
import { SORT_LABELS, type ExpenseFilters, type SortOption } from "@/components/expenses/use-expense-filters";
import { cleanMerchantName } from "@/lib/dashboard-metrics";
import { groupByDayWithTotals, shortAccountName, type AccountTotal } from "@/lib/expenses-metrics";
import { formatMoney } from "@/lib/utils/money";
import { formatDayMonth, formatLongDay, formatShortWeekday } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";

const IOS_FILL = { background: "var(--eb-ios-fill)" };

type HistoryProps = {
  filters: ExpenseFilters;
  accountTotals: AccountTotal[];
  monthTotal: number;
  monthCount: number;
  monthLabel: string;
  categories: { id: number; name: string }[];
  edit: EditOptions;
  /** Boton "Nuevo gasto" para el estado vacio */
  newExpense: React.ReactNode;
};

/** Chip del filtro de un dia ("1 oct ✕") */
function DayChip({ filters }: { filters: ExpenseFilters }) {
  if (!filters.dateFrom || filters.dateTo) return null;
  return (
    <button
      type="button"
      onClick={() => filters.setDateRange("", "")}
      aria-label={`Quitar filtro del ${formatDayMonth(filters.dateFrom)}`}
      className="text-eb-text flex h-8 items-center gap-1.5 self-start rounded-full px-3 text-[13px] font-medium"
      style={{ background: "rgba(94,107,255,0.2)", boxShadow: "inset 0 0 0 1px rgba(94,107,255,0.35)" }}
    >
      {formatDayMonth(filters.dateFrom)}
      <XIcon size={13} strokeWidth={2.4} aria-hidden="true" />
    </button>
  );
}

function CategorySelect({
  filters,
  categories,
  className,
}: {
  filters: ExpenseFilters;
  categories: { id: number; name: string }[];
  className?: string;
}) {
  const current =
    filters.categoryFilter === "all"
      ? "Categoría"
      : filters.categoryFilter === "none"
        ? "Sin categoría"
        : (categories.find((c) => String(c.id) === filters.categoryFilter)?.name ?? "Categoría");
  return (
    <Select value={filters.categoryFilter} onValueChange={filters.setCategoryFilter}>
      <SelectTrigger
        aria-label="Filtrar por categoría"
        className={cn(
          "text-eb-text h-9 gap-1.5 rounded-[10px] border-0 px-3 text-[13px] font-medium shadow-none dark:bg-transparent [&>svg]:hidden",
          className
        )}
        style={IOS_FILL}
      >
        {current}
        <ChevronDownIcon size={12} strokeWidth={2.6} className="text-eb-text-tertiary !block" aria-hidden="true" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas las categorías</SelectItem>
        <SelectItem value="none">Sin categoría</SelectItem>
        {categories.map((c) => (
          <SelectItem key={c.id} value={String(c.id)}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SortSelect({ filters, iconOnly = true }: { filters: ExpenseFilters; iconOnly?: boolean }) {
  return (
    <Select value={filters.sort} onValueChange={(v) => filters.setSort(v as SortOption)}>
      <SelectTrigger
        aria-label={`Ordenar: ${SORT_LABELS[filters.sort].toLocaleLowerCase("es-MX")}`}
        className={cn(
          "text-eb-text h-9 rounded-[10px] border-0 text-[13px] font-medium shadow-none dark:bg-transparent [&>svg:last-child]:hidden",
          iconOnly ? "w-9 justify-center px-0" : "gap-1.5 px-3"
        )}
        style={IOS_FILL}
      >
        <ArrowUpDownIcon size={16} strokeWidth={2} aria-hidden="true" />
        {!iconOnly && SORT_LABELS[filters.sort]}
      </SelectTrigger>
      <SelectContent>
        {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SearchField({ filters, size }: { filters: ExpenseFilters; size: "desktop" | "mobile" }) {
  const desktop = size === "desktop";
  return (
    <label
      className={cn(
        "text-eb-text-tertiary flex items-center gap-2 px-3",
        desktop ? "h-9 w-[280px] max-w-full rounded-[10px]" : "h-10 rounded-[12px]"
      )}
      style={IOS_FILL}
    >
      <SearchIcon size={desktop ? 15 : 16} strokeWidth={2.2} aria-hidden="true" />
      <input
        type="search"
        placeholder="Buscar"
        aria-label="Buscar gastos"
        value={filters.search}
        onChange={(e) => filters.setSearch(e.target.value)}
        className={cn(
          "text-eb-text placeholder:text-eb-text-tertiary min-w-0 flex-1 border-0 bg-transparent outline-none",
          desktop ? "text-[14px]" : "text-[16px]"
        )}
      />
    </label>
  );
}

/**
 * Totales por cuenta para el filtro. Si el filtro activo es una cuenta sin
 * gastos en el mes (por ejemplo, al llegar desde "Ver sus gastos"), se
 * agrega en $0 para que se vea seleccionada y se pueda quitar.
 */
function accountsForFilter(
  accountTotals: AccountTotal[],
  accountFilter: string,
  accounts: { id: number; name: string }[]
): AccountTotal[] {
  if (accountFilter === "all" || accountTotals.some((a) => String(a.accountId) === accountFilter)) {
    return accountTotals;
  }
  const account = accounts.find((a) => String(a.id) === accountFilter);
  if (!account) return accountTotals;
  return [
    ...accountTotals,
    { accountId: account.id, accountName: account.name, total: 0, count: 0, share: 0, tone: "gray" },
  ];
}

/** Estado vacio del historial */
function EmptyState({
  filters,
  monthCount,
  monthLabel,
  newExpense,
  accountName,
}: Pick<HistoryProps, "filters" | "monthCount" | "monthLabel" | "newExpense"> & {
  /** Cuenta del filtro activo, si hay */
  accountName?: string;
}) {
  const q = filters.search.trim();
  // Solo el filtro de cuenta deja la lista vacia: se dice cual y como salir
  if (accountName && !q && monthCount > 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <p className="text-eb-text-secondary text-[15px]">
          {accountName} no tiene gastos en {monthLabel.toLocaleLowerCase("es-MX")}
          {filters.dateFrom ? " en esas fechas" : ""}
        </p>
        <button
          type="button"
          onClick={() => filters.setAccountFilter("all")}
          className="eb-link rounded-full px-3 py-1.5 text-[14px] font-semibold"
          style={{ background: "rgba(94,107,255,0.14)" }}
        >
          Ver todas las cuentas
        </button>
      </div>
    );
  }
  if (monthCount === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <span
          className="text-eb-text-tertiary flex size-12 items-center justify-center rounded-full"
          style={{ background: "var(--eb-glass-strong)" }}
          aria-hidden="true"
        >
          <ReceiptIcon size={22} strokeWidth={1.8} />
        </span>
        <p className="text-eb-text-secondary text-[15px]">
          Aún no hay gastos en {monthLabel.toLocaleLowerCase("es-MX")}
        </p>
        {newExpense}
      </div>
    );
  }
  return (
    <p className="text-eb-text-tertiary px-6 py-10 text-center text-[14px]">
      {q ? `Sin resultados para “${q}”` : "No hay gastos con los filtros aplicados."}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Escritorio
// ---------------------------------------------------------------------------

export function HistoryDesktop({
  filters,
  accountTotals,
  monthTotal,
  monthCount,
  monthLabel,
  categories,
  edit,
  newExpense,
  className,
}: HistoryProps & { className?: string }) {
  const groups = groupByDayWithTotals(filters.filtered);
  const activeAccount = filters.accountFilter;
  const filterAccounts = accountsForFilter(accountTotals, activeAccount, edit.accounts);
  const activeName = filterAccounts.find((a) => String(a.accountId) === activeAccount)?.accountName;

  const accountCard = (key: string, active: boolean, onClick: () => void, children: React.ReactNode) => (
    <button
      key={key}
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      // Con pocos metodos se reparten el ancho del Historial (fila simetrica);
      // con muchos conservan 150px y la fila se desplaza en horizontal.
      className="text-eb-text flex min-w-[150px] flex-[1_1_150px] flex-col gap-2 rounded-[16px] px-[14px] py-3 text-left"
      style={
        active
          ? { background: "var(--eb-chip-active)", boxShadow: "var(--eb-chip-active-shadow)" }
          : { background: "var(--eb-chip-idle)", boxShadow: "var(--eb-chip-idle-ring)" }
      }
    >
      {children}
    </button>
  );

  return (
    <EbCard className={cn("flex flex-col overflow-hidden", className)}>
      <div className="flex flex-col gap-4 px-6 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="eb-card-title m-0">Historial</h2>
          <div className="flex flex-wrap items-center gap-2">
            <SearchField filters={filters} size="desktop" />
            <CategorySelect filters={filters} categories={categories} />
            <DateRangeFilter
              appearance="ios"
              from={filters.dateFrom}
              to={filters.dateTo}
              onChange={filters.setDateRange}
            />
            <SortSelect filters={filters} />
          </div>
        </div>

        {filterAccounts.length > 0 && (
          <div role="tablist" aria-label="Filtrar por cuenta" className="flex gap-2 overflow-x-auto pb-1">
            {accountCard(
              "all",
              activeAccount === "all",
              () => filters.setAccountFilter("all"),
              <>
                <span className="text-eb-text-muted text-[13px]">Todas · {monthCount}</span>
                <span className="text-[17px] font-bold tabular-nums">{formatMoney(monthTotal)}</span>
                <span className="flex h-1 w-full gap-0.5 overflow-hidden rounded-[2px]">
                  {accountTotals.map((a) => (
                    <span key={a.accountId} style={{ flex: `${a.share} 1 0%`, background: SEGMENT_DOT_COLORS[a.tone] }} />
                  ))}
                </span>
              </>
            )}
            {filterAccounts.map((a) =>
              accountCard(
                String(a.accountId),
                activeAccount === String(a.accountId),
                () => filters.setAccountFilter(String(a.accountId)),
                <>
                  <span className="text-eb-text-secondary flex items-center gap-1.5 text-[13px]">
                    <span className="size-2 rounded-full" style={{ background: SEGMENT_DOT_COLORS[a.tone] }} />
                    {a.accountName} · {a.count}
                  </span>
                  <span className="text-[17px] font-semibold tabular-nums">{formatMoney(a.total)}</span>
                  <span className="flex h-1 w-full rounded-[2px]" style={{ background: "var(--eb-chip-idle)" }}>
                    <span
                      className="rounded-[2px]"
                      style={{ width: `${a.share}%`, minWidth: 3, background: SEGMENT_DOT_COLORS[a.tone] }}
                    />
                  </span>
                </>
              )
            )}
          </div>
        )}
        <DayChip filters={filters} />
      </div>

      {groups.length === 0 ? (
        <EmptyState
          filters={filters}
          monthCount={monthCount}
          monthLabel={monthLabel}
          newExpense={newExpense}
          accountName={activeName}
        />
      ) : (
        <div className="flex flex-col pt-2 pb-3">
          {groups.map((group, index) => (
            <div key={`${group.date}-${index}`}>
              <div className="text-eb-text-tertiary flex items-baseline justify-between px-6 pt-[18px] pb-1.5 text-[12px] font-semibold">
                <span className="tracking-[0.04em] uppercase">{formatLongDay(group.date)}</span>
                <span className="font-medium">
                  {group.items.length} {group.items.length === 1 ? "gasto" : "gastos"} ·{" "}
                  <b className="text-eb-text-muted font-semibold">{formatMoney(group.total)}</b>
                </span>
              </div>
              <GroupedList>
                {group.items.map((expense) => {
                  const { aggregator } = cleanMerchantName(expense.description);
                  return (
                    <ExpenseRow
                      key={expense.id}
                      expense={expense}
                      subtitle={aggregator ? `${expense.accountName} · ${aggregator}` : expense.accountName}
                      edit={edit}
                    />
                  );
                })}
              </GroupedList>
            </div>
          ))}
        </div>
      )}
    </EbCard>
  );
}

// ---------------------------------------------------------------------------
// Movil
// ---------------------------------------------------------------------------

export function HistoryMobile({
  filters,
  accountTotals,
  monthTotal,
  monthCount,
  monthLabel,
  edit,
  newExpense,
}: HistoryProps) {
  const [openId, setOpenId] = useState<number | null>(null);
  const groups = groupByDayWithTotals(filters.filtered);
  const filterAccounts = accountsForFilter(accountTotals, filters.accountFilter, edit.accounts);
  const activeName = filterAccounts.find((a) => String(a.accountId) === filters.accountFilter)?.accountName;
  const filteredTotal = filters.filtered.reduce((sum, e) => sum + e.amount, 0);
  const swipeEdit = {
    ...edit,
    onChanged: () => {
      setOpenId(null);
      edit.onChanged();
    },
  };

  const chip = (key: string, active: boolean, onClick: () => void, children: React.ReactNode) => (
    <button
      key={key}
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex h-[34px] flex-none items-center gap-1.5 rounded-[17px] px-[14px] text-[13px]",
        active ? "text-eb-text font-semibold" : "text-eb-text-muted"
      )}
      style={
        active
          ? { background: "var(--eb-segment-active)", boxShadow: "var(--eb-segment-active-shadow)" }
          : { background: "var(--eb-glass-strong)", boxShadow: "var(--eb-chip-idle-ring)" }
      }
    >
      {children}
    </button>
  );

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="eb-card-title m-0">Historial</h2>
        <span className="text-eb-text-tertiary text-[13px] tabular-nums">
          {filters.filtered.length} · {formatMoney(filters.hasFilters ? filteredTotal : monthTotal)}
        </span>
      </div>
      <SearchField filters={filters} size="mobile" />
      {filterAccounts.length > 0 && (
        <div
          role="tablist"
          aria-label="Filtrar por cuenta"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {chip("all", filters.accountFilter === "all", () => filters.setAccountFilter("all"), "Todas")}
          {filterAccounts.map((a) =>
            chip(
              String(a.accountId),
              filters.accountFilter === String(a.accountId),
              () => filters.setAccountFilter(String(a.accountId)),
              <>
                <span className="size-[7px] rounded-full" style={{ background: SEGMENT_DOT_COLORS[a.tone] }} />
                {shortAccountName(a.accountName)} · {formatMoney(a.total, { cents: false })}
              </>
            )
          )}
        </div>
      )}
      <DayChip filters={filters} />

      {groups.length === 0 ? (
        <EbCard size="list-sm" as="div">
          <EmptyState
          filters={filters}
          monthCount={monthCount}
          monthLabel={monthLabel}
          newExpense={newExpense}
          accountName={activeName}
        />
        </EbCard>
      ) : (
        <div className="flex flex-col gap-[14px]">
          {groups.map((group, index) => (
            <div key={`${group.date}-${index}`} className="flex flex-col gap-1.5">
              <div className="text-eb-text-tertiary flex justify-between px-4 text-[13px]">
                <span className="tracking-[0.02em] uppercase">{formatShortWeekday(group.date)}</span>
                <span className="tabular-nums">{formatMoney(group.total)}</span>
              </div>
              <EbCard size="list-sm" as="div" className="overflow-hidden">
                <GroupedList>
                  {group.items.map((expense) => {
                    const { aggregator } = cleanMerchantName(expense.description);
                    const account = shortAccountName(expense.accountName);
                    return (
                      <SwipeExpenseRow
                        key={expense.id}
                        expense={expense}
                        subtitle={aggregator ? `${account} · ${aggregator}` : account}
                        open={openId === expense.id}
                        onOpenChange={(open) => setOpenId(open ? expense.id : null)}
                        edit={swipeEdit}
                      />
                    );
                  })}
                </GroupedList>
              </EbCard>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/** Controles del sheet de filtros en movil (Categoria, Fecha, Orden) */
export function MobileFilterControls({
  filters,
  categories,
}: {
  filters: ExpenseFilters;
  categories: { id: number; name: string }[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-eb-text-tertiary text-[13px] uppercase">Categoría</span>
        <CategorySelect filters={filters} categories={categories} className="h-11 w-full justify-between" />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-eb-text-tertiary text-[13px] uppercase">Fecha</span>
        <DateRangeFilter from={filters.dateFrom} to={filters.dateTo} onChange={filters.setDateRange} />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-eb-text-tertiary text-[13px] uppercase">Orden</span>
        <SortSelect filters={filters} iconOnly={false} />
      </div>
      {filters.hasFilters && (
        <button type="button" onClick={filters.clearFilters} className="eb-link self-start py-2 text-[15px]">
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
