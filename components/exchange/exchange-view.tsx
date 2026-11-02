"use client";

import { useState } from "react";
import { PlaneIcon, PlusIcon } from "lucide-react";
import { EbCard } from "@/components/ui/eb/card";
import { ExchangeExpenseSheet } from "@/components/exchange/exchange-expense-sheet";
import {
  EXCHANGE_CATEGORIES,
  EXCHANGE_CURRENCIES,
  exchangeCategoryMeta,
  formatExchangeMoney,
  type ExchangeCurrency,
  type ExchangeExpenseItem,
} from "@/lib/exchange";
import { formatLongDay } from "@/lib/utils/dates";

type Totals = Record<ExchangeCurrency, number>;

const emptyTotals = (): Totals => ({ MXN: 0, EUR: 0 });

/** "$12,000.00 + €350.00"; solo las monedas usadas */
function joinTotals(totals: Totals): string {
  const used = EXCHANGE_CURRENCIES.filter((c) => totals[c] > 0);
  return used.length === 0
    ? formatExchangeMoney(0, "MXN")
    : used.map((c) => formatExchangeMoney(totals[c], c)).join(" + ");
}

/**
 * Intercambio: registro de gastos del viaje, independiente del Dashboard,
 * presupuesto y Patrimonio. Pesos y euros se suman por separado (sin
 * conversion). Tocar un gasto lo abre para editar o eliminar.
 */
export function ExchangeView({ expenses }: { expenses: ExchangeExpenseItem[] }) {
  // key se incrementa en cada apertura: remonta la hoja con el formulario
  // limpio. Al cerrar solo cambia open, para que se vea la salida.
  const [sheet, setSheet] = useState<{ key: number; item: ExchangeExpenseItem | null; open: boolean } | null>(
    null
  );
  const lastCurrency = expenses[0]?.currency ?? "MXN";

  const totals = emptyTotals();
  const byCategory = new Map<string, Totals>();
  for (const e of expenses) {
    totals[e.currency] += e.amount;
    const t = byCategory.get(e.category) ?? emptyTotals();
    t[e.currency] += e.amount;
    byCategory.set(e.category, t);
  }
  const categories = EXCHANGE_CATEGORIES.filter((c) => byCategory.has(c.value));
  const usedCurrencies = EXCHANGE_CURRENCIES.filter((c) => totals[c] > 0);

  // Agrupado por dia (ya viene ordenado del mas reciente al mas viejo)
  const days: { date: string; items: ExchangeExpenseItem[] }[] = [];
  for (const e of expenses) {
    const last = days[days.length - 1];
    if (last?.date === e.date) last.items.push(e);
    else days.push({ date: e.date, items: [e] });
  }

  function open(item: ExchangeExpenseItem | null) {
    setSheet((prev) => ({ key: (prev?.key ?? 0) + 1, item, open: true }));
  }

  return (
    <div className="mx-auto flex max-w-[1120px] flex-col gap-7 px-4 pt-6 pb-16 md:px-6 md:pt-10 lg:px-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="text-eb-text-tertiary text-[13px] font-semibold tracking-[0.04em] uppercase">
            Gastos del viaje · aparte de tus finanzas
          </div>
          <h1 className="eb-title">Intercambio</h1>
        </div>
        <button
          type="button"
          onClick={() => open(null)}
          className="eb-btn-primary flex h-10 items-center gap-2 rounded-[20px] px-[18px] text-[14px]"
        >
          <PlusIcon size={16} strokeWidth={2.4} aria-hidden="true" />
          Agregar
        </button>
      </header>

      {expenses.length === 0 ? (
        <EbCard className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span
            aria-hidden="true"
            className="eb-tile size-12 rounded-[14px]"
            style={{ background: "linear-gradient(180deg, var(--eb-accent-light), var(--eb-accent))" }}
          >
            <PlaneIcon size={22} strokeWidth={2} />
          </span>
          <p className="text-[16px] font-semibold">Aún no registras gastos del intercambio</p>
          <p className="text-eb-text-tertiary max-w-sm text-[14px]">
            Vuelos, hospedaje, trámites, comida... todo lo del viaje va aquí, sin mezclarse con tu
            Dashboard ni con Patrimonio.
          </p>
          <button type="button" onClick={() => open(null)} className="eb-link mt-1 text-[15px] font-semibold">
            Agregar el primero
          </button>
        </EbCard>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:items-start">
          {/* Resumen */}
          <EbCard variant="hero" className="flex flex-col gap-5 p-6">
            <div className="flex flex-col gap-3">
              <span className="text-eb-text-tertiary text-[13px]">Total del intercambio</span>
              {usedCurrencies.map((c) => (
                <span
                  key={c}
                  className="eb-rounded text-[34px] leading-none font-bold tracking-[-0.03em] tabular-nums"
                >
                  {formatExchangeMoney(totals[c], c)}
                </span>
              ))}
              <span className="text-eb-text-tertiary text-[13px]">
                {expenses.length === 1 ? "1 gasto" : `${expenses.length} gastos`}
                {usedCurrencies.length > 1 && " · pesos y euros por separado"}
              </span>
            </div>

            <ul className="border-eb-separator flex flex-col gap-2.5 border-t pt-4">
              {categories.map((c) => (
                <li key={c.value} className="flex items-center justify-between gap-3 text-[14px]">
                  <span className="flex min-w-0 items-center gap-2">
                    <span aria-hidden="true" className="size-[7px] flex-none rounded-full" style={{ background: c.color }} />
                    <span className="truncate">{c.label}</span>
                  </span>
                  <span className="text-eb-text-secondary text-right tabular-nums">
                    {joinTotals(byCategory.get(c.value)!)}
                  </span>
                </li>
              ))}
            </ul>
          </EbCard>

          {/* Lista por dia */}
          <div className="flex flex-col gap-5">
            {days.map((day) => (
              <section key={day.date} className="flex flex-col gap-1.5">
                <h2 className="text-eb-text-tertiary px-1 text-[12px] font-semibold tracking-[0.04em] uppercase">
                  {formatLongDay(day.date)}
                </h2>
                <EbCard size="list" className="overflow-hidden">
                  <ul>
                    {day.items.map((e) => {
                      const meta = exchangeCategoryMeta(e.category);
                      return (
                        <li key={e.id} className="border-eb-separator border-b last:border-b-0">
                          <button
                            type="button"
                            onClick={() => open(e)}
                            className="eb-row flex min-h-[60px] w-full items-center gap-3 px-4 py-3 text-left"
                          >
                            <span
                              aria-hidden="true"
                              className="eb-tile size-9 rounded-[10px]"
                              style={{
                                background: `linear-gradient(180deg, ${meta.color}, color-mix(in srgb, ${meta.color} 70%, black))`,
                              }}
                            >
                              <span className="text-[13px] font-bold">{meta.label.charAt(0)}</span>
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col">
                              <span className="truncate text-[15px] font-medium">{e.reason}</span>
                              <span className="text-eb-text-tertiary truncate text-[13px]">
                                {e.note ? `${meta.label} · ${e.note}` : meta.label}
                              </span>
                            </span>
                            <span className="flex-none text-[15px] font-semibold tabular-nums">
                              {formatExchangeMoney(e.amount, e.currency)}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </EbCard>
              </section>
            ))}
          </div>
        </div>
      )}

      {sheet && (
        <ExchangeExpenseSheet
          key={sheet.key}
          open={sheet.open}
          onClose={() => setSheet((s) => (s ? { ...s, open: false } : s))}
          item={sheet.item}
          lastCurrency={lastCurrency}
        />
      )}
    </div>
  );
}
