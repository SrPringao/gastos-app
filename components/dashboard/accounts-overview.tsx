"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronDownIcon, ChevronRightIcon, Repeat2Icon } from "lucide-react";
import { usePreferences } from "@/components/preferences-provider";
import { EbCard } from "@/components/ui/eb/card";
import { AccountCard, AccountThumb } from "@/components/ui/eb/account-card";
import { Money } from "@/components/ui/eb/money";
import { PrivacyToggle } from "@/components/privacy";
import { accountTone } from "@/lib/account-colors";
import { cn } from "@/lib/utils";

export type AccountBalanceItem = {
  entryId: number;
  label: string;
  balance: number;
  accountId: number;
  accountType: "credit" | "debit" | "cash";
  color: string | null;
};

const TYPE_LABELS = { debit: "Débito", cash: "En mano", credit: "Crédito" } as const;

/**
 * "balance": saldos de Patrimonio (debito/efectivo). "spent": para quien no
 * registra saldos, todas sus cuentas con lo gastado en el mes.
 */
export type AccountsMode = "balance" | "spent";

/**
 * Vista activa: la preferencia del usuario; sin preferencia, saldos si hay
 * alguno y si no, gastado. Siempre se puede voltear (sin saldos, la vista
 * de saldos muestra como registrarlos).
 */
function useAccountsView(hasBalances: boolean) {
  const { accountsView, setAccountsView } = usePreferences();
  const view: AccountsMode = accountsView ?? (hasBalances ? "balance" : "spent");
  return { view, setView: setAccountsView };
}

/**
 * Media vuelta en Y: gira a 90°, cambia el contenido y regresa desde -90°.
 * Solo transform (GPU); con "reducir movimiento" cambia directo.
 */
function useFlip<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const busy = useRef(false);
  async function flip(swap: () => void) {
    const el = ref.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!el || typeof el.animate !== "function" || reduce) {
      swap();
      return;
    }
    if (busy.current) return;
    busy.current = true;
    try {
      await el.animate(
        [{ transform: "perspective(900px) rotateY(0deg)" }, { transform: "perspective(900px) rotateY(90deg)" }],
        { duration: 160, easing: "cubic-bezier(.4,0,1,1)" }
      ).finished;
      swap();
      await new Promise((r) => requestAnimationFrame(r));
      await el.animate(
        [{ transform: "perspective(900px) rotateY(-90deg)" }, { transform: "perspective(900px) rotateY(0deg)" }],
        { duration: 200, easing: "cubic-bezier(0,0,.2,1)" }
      ).finished;
    } finally {
      busy.current = false;
    }
  }
  return { ref, flip };
}

/** Boton de voltear la tarjeta entre saldos y gastado (solo icono) */
function FlipButton({ view, onFlip }: { view: AccountsMode; onFlip: () => void }) {
  const label = view === "balance" ? "Ver lo gastado del mes" : "Ver saldos de Patrimonio";
  return (
    <button
      type="button"
      onClick={onFlip}
      aria-label={label}
      title={label}
      className="text-eb-link flex size-8 shrink-0 items-center justify-center rounded-full transition-colors"
      style={{ background: "var(--eb-glass-strong)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}
    >
      <Repeat2Icon size={17} strokeWidth={2.2} aria-hidden="true" />
    </button>
  );
}

/** "Octubre" -> "oct" */
const shortMonth = (monthLabel: string) => monthLabel.slice(0, 3).toLocaleLowerCase("es-MX");

/** Lista de escritorio: arriba de este numero se agrega "Ver N más" */
const VISIBLE_ROWS = 6;

// El chip alterna dorado/plateado de forma estable por cuenta
const chipFor = (item: AccountBalanceItem) => (item.accountId % 2 === 0 ? "silver" : "gold");

function cardProps(item: AccountBalanceItem, mode: AccountsMode, monthLabel: string) {
  return {
    name: item.label,
    typeLabel: mode === "spent" ? `Gastado en ${shortMonth(monthLabel)}` : TYPE_LABELS[item.accountType],
    balance: item.balance,
    color: item.color,
    isCash: item.accountType === "cash",
    chip: chipFor(item),
  } as const;
}

function sharePercent(balance: number, total: number): string {
  if (total <= 0) return "0%";
  const pct = (balance / total) * 100;
  if (pct > 0 && pct < 1) return "<1%";
  return `${Math.round(pct)}%`;
}

/**
 * Escritorio: resumen "Disponible" + barra de distribucion + lista con
 * miniaturas de tarjeta, ordenada por saldo (seccion A.1).
 */
export function AccountsOverviewCard({
  balanceItems,
  spendItems,
  creditCount,
  monthLabel,
  className,
}: {
  /** Saldos de Patrimonio (debito/efectivo) */
  balanceItems: AccountBalanceItem[];
  /** Todas las cuentas con lo gastado en el mes */
  spendItems: AccountBalanceItem[];
  creditCount: number;
  /** "Octubre" */
  monthLabel: string;
  className?: string;
}) {
  const { view: mode, setView } = useAccountsView(balanceItems.length > 0);
  const { ref, flip } = useFlip<HTMLDivElement>();
  const items = mode === "balance" ? balanceItems : spendItems;
  const [showAll, setShowAll] = useState(false);
  const sorted = [...items].sort((a, b) => b.balance - a.balance);
  const total = sorted.reduce((sum, item) => sum + Math.max(item.balance, 0), 0);
  const visible = showAll ? sorted : sorted.slice(0, VISIBLE_ROWS);
  const hiddenCount = sorted.length - visible.length;

  return (
    <EbCard ref={ref} className={cn("flex flex-col px-5 pb-[14px]", className)}>
      <div className="flex items-center justify-between px-1 pt-[22px] pb-[14px]">
        <h2 className="eb-card-title m-0">Cuentas</h2>
        <div className="flex items-center gap-1.5">
          <FlipButton
            view={mode}
            onFlip={() => flip(() => setView(mode === "balance" ? "spent" : "balance"))}
          />
          <PrivacyToggle scope="accounts" />
          <Link href="/cuentas" className="eb-link py-1.5 pl-1.5 text-[14px]">
            Administrar
          </Link>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="text-eb-text-tertiary flex flex-1 items-center px-1 text-[13px]">
          {mode === "spent"
            ? "Agrega tus tarjetas y cuentas en Cuentas para verlas aquí."
            : "Liga tus cuentas de débito y efectivo a un positivo en Patrimonio para ver su saldo aquí."}
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3 px-1 pb-1.5">
            <div className="flex items-baseline justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-eb-text-tertiary text-[13px]">
                  {mode === "spent" ? `Gastado en ${monthLabel.toLocaleLowerCase("es-MX")}` : "Disponible"}
                </span>
                <Money
                  value={total}
                  cents={false}
                  private="accounts"
                  className="eb-rounded text-[28px] leading-[1.1] font-bold tracking-[-0.02em]"
                />
              </div>
              <span className="text-eb-text-tertiary text-[13px]">
                {sorted.length} {sorted.length === 1 ? "cuenta" : "cuentas"}
              </span>
            </div>
            <div
              role="img"
              aria-label={`Distribución: ${sorted
                .map((item) => `${item.label} ${sharePercent(item.balance, total)}`)
                .join(", ")}`}
              className="flex h-2 overflow-hidden rounded-[4px] p-0.5"
              style={{ gap: 2, background: "var(--eb-track)", boxShadow: "var(--eb-track-shadow)" }}
            >
              {sorted.map((item) => {
                const tone = accountTone(item.color);
                const share = total > 0 ? (Math.max(item.balance, 0) / total) * 100 : 0;
                return (
                  <div
                    key={item.entryId}
                    className="rounded-[2px]"
                    style={{
                      flex: `${share} 1 0%`,
                      minWidth: share < 1 ? 2 : undefined,
                      background: `linear-gradient(90deg, ${tone.light}, ${tone.bright})`,
                    }}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex flex-1 flex-col">
            {visible.map((item, index) => {
              const isLast = index === visible.length - 1 && hiddenCount === 0;
              return (
                <div key={item.entryId} className="flex min-h-14 flex-1 items-center gap-[14px] px-1">
                  <AccountThumb
                    color={item.color}
                    isCash={item.accountType === "cash"}
                    chip={chipFor(item)}
                  />
                  <div
                    className={cn(
                      "flex min-w-0 flex-1 items-center gap-3 self-stretch",
                      !isLast && "border-eb-separator border-b"
                    )}
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-px">
                      <span className="truncate text-[15px] font-medium">{item.label}</span>
                      <span className="text-eb-text-tertiary text-[13px]">
                        {TYPE_LABELS[item.accountType]} · {sharePercent(item.balance, total)}
                      </span>
                    </div>
                    <Money value={item.balance} private="accounts" className="text-[15px] font-semibold" />
                  </div>
                </div>
              );
            })}
            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="eb-link flex min-h-11 items-center gap-1.5 px-1 text-[14px]"
              >
                Ver {hiddenCount} más
                <ChevronDownIcon size={14} strokeWidth={2.4} aria-hidden="true" />
              </button>
            )}
          </div>
        </>
      )}

      <Link
        href="/cuentas"
        className="border-eb-separator text-eb-text-muted hover:text-eb-text mt-2.5 flex items-center justify-between border-t px-1 pt-3 pb-1 text-[14px] transition-colors"
      >
        {creditCount} {creditCount === 1 ? "tarjeta de crédito" : "tarjetas de crédito"}
        <ChevronRightIcon size={14} strokeWidth={2.4} className="text-eb-chevron" aria-hidden="true" />
      </Link>
    </EbCard>
  );
}

/** Movil: carrusel horizontal de tarjetas de 168x106 */
export function AccountsCarousel({
  balanceItems,
  spendItems,
  monthLabel,
}: {
  balanceItems: AccountBalanceItem[];
  spendItems: AccountBalanceItem[];
  /** "Octubre" */
  monthLabel: string;
}) {
  const { view: mode, setView } = useAccountsView(balanceItems.length > 0);
  const { ref, flip } = useFlip<HTMLDivElement>();
  const items = mode === "balance" ? balanceItems : spendItems;
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="eb-card-title m-0">Cuentas</h2>
        <div className="flex items-center gap-1.5">
          <FlipButton
            view={mode}
            onFlip={() => flip(() => setView(mode === "balance" ? "spent" : "balance"))}
          />
          <PrivacyToggle scope="accounts" />
          <Link href="/cuentas" className="eb-link py-2.5 pl-1.5 text-[15px]">
            Todas
          </Link>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="text-eb-text-tertiary px-1 text-[13px]">
          {mode === "spent"
            ? "Agrega tus tarjetas y cuentas en Cuentas para verlas aquí."
            : "Liga tus cuentas de débito y efectivo en Patrimonio para ver su saldo aquí."}
        </p>
      ) : (
        <div
          ref={ref}
          className="-mx-4 -mb-3 flex gap-3 overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item) => (
            <AccountCard key={item.entryId} {...cardProps(item, mode, monthLabel)} variant="carousel" />
          ))}
        </div>
      )}
    </section>
  );
}
