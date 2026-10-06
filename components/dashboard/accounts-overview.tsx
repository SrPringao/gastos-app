"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
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

/** Lista de escritorio: arriba de este numero se agrega "Ver N más" */
const VISIBLE_ROWS = 6;

// El chip alterna dorado/plateado de forma estable por cuenta
const chipFor = (item: AccountBalanceItem) => (item.accountId % 2 === 0 ? "silver" : "gold");

function cardProps(item: AccountBalanceItem) {
  return {
    name: item.label,
    typeLabel: TYPE_LABELS[item.accountType],
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
  items,
  creditCount,
  className,
}: {
  items: AccountBalanceItem[];
  creditCount: number;
  className?: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const sorted = [...items].sort((a, b) => b.balance - a.balance);
  const total = sorted.reduce((sum, item) => sum + Math.max(item.balance, 0), 0);
  const visible = showAll ? sorted : sorted.slice(0, VISIBLE_ROWS);
  const hiddenCount = sorted.length - visible.length;

  return (
    <EbCard className={cn("flex flex-col px-5 pb-[14px]", className)}>
      <div className="flex items-center justify-between px-1 pt-[22px] pb-[14px]">
        <h2 className="eb-card-title m-0">Cuentas</h2>
        <div className="flex items-center gap-1.5">
          <PrivacyToggle />
          <Link href="/cuentas" className="eb-link py-1.5 pl-1.5 text-[14px]">
            Administrar
          </Link>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="text-eb-text-tertiary flex flex-1 items-center px-1 text-[13px]">
          Liga tus cuentas de débito y efectivo a un positivo en Patrimonio para ver su saldo aquí.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3 px-1 pb-1.5">
            <div className="flex items-baseline justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-eb-text-tertiary text-[13px]">Disponible</span>
                <Money
                  value={total}
                  cents={false}
                  private
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
                    <Money value={item.balance} private className="text-[15px] font-semibold" />
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
export function AccountsCarousel({ items }: { items: AccountBalanceItem[] }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="eb-card-title m-0">Cuentas</h2>
        <div className="flex items-center gap-1.5">
          <PrivacyToggle />
          <Link href="/cuentas" className="eb-link py-2.5 pl-1.5 text-[15px]">
            Todas
          </Link>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="text-eb-text-tertiary px-1 text-[13px]">
          Liga tus cuentas de débito y efectivo en Patrimonio para ver su saldo aquí.
        </p>
      ) : (
        <div className="-mx-4 -mb-3 flex gap-3 overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => (
            <AccountCard key={item.entryId} {...cardProps(item)} variant="carousel" />
          ))}
        </div>
      )}
    </section>
  );
}
