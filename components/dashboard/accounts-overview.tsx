"use client";

import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { EbCard } from "@/components/ui/eb/card";
import { AccountCard } from "@/components/ui/eb/account-card";
import { usePreferences } from "@/components/preferences-provider";
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

function cardProps(item: AccountBalanceItem) {
  return {
    name: item.label,
    typeLabel: TYPE_LABELS[item.accountType],
    balance: item.balance,
    color: item.color,
    isCash: item.accountType === "cash",
    // El chip alterna dorado/plateado de forma estable por cuenta
    chip: item.accountId % 2 === 0 ? ("silver" as const) : ("gold" as const),
  };
}

/** Escritorio: grid 2x2 de tarjetas fisicas + link a las de credito */
export function AccountsOverviewCard({
  items,
  creditCount,
  className,
}: {
  items: AccountBalanceItem[];
  creditCount: number;
  className?: string;
}) {
  const { hideNetWorthAmounts } = usePreferences();

  return (
    <EbCard className={cn("flex flex-col px-5 pb-[14px]", className)}>
      <div className="flex items-center justify-between px-1 pt-[22px] pb-[14px]">
        <h2 className="m-0 text-[20px] font-bold tracking-[-0.02em]">Cuentas</h2>
        <Link href="/cuentas" className="eb-link py-1.5 pl-2.5 text-[14px]">
          Administrar
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-eb-text-tertiary flex flex-1 items-center px-1 text-[13px]">
          Liga tus cuentas de débito y efectivo a un positivo en Patrimonio para ver su saldo aquí.
        </p>
      ) : (
        <div
          className="grid flex-1 gap-3"
          style={{
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gridTemplateRows: `repeat(${Math.ceil(items.length / 2)}, minmax(110px, 1fr))`,
          }}
        >
          {items.map((item) => (
            <AccountCard key={item.entryId} {...cardProps(item)} hidden={hideNetWorthAmounts} />
          ))}
        </div>
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
  const { hideNetWorthAmounts } = usePreferences();

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="m-0 text-[20px] font-bold tracking-[-0.02em]">Cuentas</h2>
        <Link href="/cuentas" className="eb-link py-2.5 pl-3 text-[15px]">
          Todas
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-eb-text-tertiary px-1 text-[13px]">
          Liga tus cuentas de débito y efectivo en Patrimonio para ver su saldo aquí.
        </p>
      ) : (
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => (
            <AccountCard
              key={item.entryId}
              {...cardProps(item)}
              variant="carousel"
              hidden={hideNetWorthAmounts}
            />
          ))}
        </div>
      )}
    </section>
  );
}
