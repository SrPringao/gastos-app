"use client";

import { useMemo, useRef, useState } from "react";
import { PlusIcon, ZapIcon } from "lucide-react";
import { EbCard } from "@/components/ui/eb/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useMediaQuery } from "@/hooks/use-media-query";
import { CatalogCard, SHORTCUT_GRADIENT } from "./method-cards";
import { MethodDetailPanel } from "./method-detail-panel";
import { cardMeta, usesLabel, type WalletOwner } from "./method-form";
import type { PaymentMethodCatalogItem, PaymentMethodType } from "@/lib/payment-methods";
import { cn } from "@/lib/utils";

const GROUPS: { type: PaymentMethodType; title: string }[] = [
  { type: "credit", title: "Crédito" },
  { type: "debit", title: "Débito" },
  { type: "cash", title: "Efectivo" },
];

/** Metodo seleccionado por defecto: el primero sin saldo; si no hay, el mas usado */
export function defaultSelection(items: PaymentMethodCatalogItem[]): number | null {
  const active = items.filter((i) => !i.archived);
  const noBalance = active.find((i) => !i.hasBalance);
  if (noBalance) return noBalance.id;
  const mostUsed = [...active].sort((a, b) => b.usesThisMonth - a.usesThisMonth)[0];
  return mostUsed?.id ?? null;
}

export function walletOwners(items: PaymentMethodCatalogItem[]): WalletOwner[] {
  return items.flatMap((i) =>
    i.walletNames.map((w) => ({ methodId: i.id, methodName: i.name, walletId: w.id, rawName: w.rawName }))
  );
}

/** Franja "Atajo de Apple Pay": N de M metodos vinculados */
function ShortcutStrip({
  items,
  onPickUnlinked,
}: {
  items: PaymentMethodCatalogItem[];
  onPickUnlinked: () => void;
}) {
  const linked = items.filter((i) => i.isLinkedToShortcut).length;
  return (
    <button
      type="button"
      onClick={onPickUnlinked}
      className="eb-card flex items-center gap-[14px] rounded-[18px] px-4 py-[14px] text-left"
      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.05)" }}
    >
      <span
        aria-hidden="true"
        className="flex size-9 flex-none items-center justify-center rounded-[10px] text-white"
        style={{ background: SHORTCUT_GRADIENT, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)" }}
      >
        <ZapIcon size={18} strokeWidth={2} />
      </span>
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-semibold">Atajo de Apple Pay</span>
        <span className="text-eb-text-tertiary text-[13px]">
          <b className="text-eb-text-secondary font-semibold">
            {linked} de {items.length}
          </b>{" "}
          métodos registran gastos solos al pagar con Wallet
        </span>
      </span>
      <span className="flex gap-[3px]" aria-hidden="true">
        {items.map((i) => (
          <span
            key={i.id}
            className="size-2 rounded-full"
            style={{ background: i.isLinkedToShortcut ? "#30D158" : "var(--eb-chart-empty-past)" }}
          />
        ))}
      </span>
    </button>
  );
}

/**
 * Pagina Cuentas en escritorio (Cuentas.dc.html): catalogo de metodos de
 * pago a la izquierda y panel de detalle a la derecha. Sin montos.
 */
export function AccountsCatalogDesktop({
  items,
  suggestions,
  monthShort,
  onNewMethod,
  selectedId,
  onSelectedIdChange,
}: {
  items: PaymentMethodCatalogItem[];
  suggestions: string[];
  monthShort: string;
  onNewMethod: () => void;
  selectedId: number | null;
  onSelectedIdChange: (id: number) => void;
}) {
  const wide = useMediaQuery("(min-width: 1000px)");
  const [showArchived, setShowArchived] = useState(false);
  // Debajo de 1000px el detalle va en un modal que se abre al tocar una tarjeta
  const [dialogOpen, setDialogOpen] = useState(false);
  const cardRefs = useRef(new Map<number, HTMLButtonElement>());

  const active = items.filter((i) => !i.archived);
  const archivedCount = items.length - active.length;
  const visible = showArchived ? items : active;
  const selected = items.find((i) => i.id === selectedId) ?? null;
  const owners = useMemo(() => walletOwners(items), [items]);
  const order = visible.map((i) => i.id);

  function select(id: number) {
    onSelectedIdChange(id);
    if (!wide) setDialogOpen(true);
  }

  // Flechas para moverse entre tarjetas; Enter las selecciona (boton nativo)
  function onCardKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, id: number) {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const index = order.indexOf(id);
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : e.key === "ArrowDown" ? 3 : -3;
    const next = order[Math.min(Math.max(index + step, 0), order.length - 1)];
    cardRefs.current.get(next)?.focus();
  }

  function pickUnlinked() {
    const target = active.find((i) => !i.isLinkedToShortcut);
    if (!target) return;
    select(target.id);
    cardRefs.current.get(target.id)?.scrollIntoView({ block: "center", behavior: "smooth" });
    cardRefs.current.get(target.id)?.focus({ preventScroll: true });
  }

  const panel = selected ? (
    <MethodDetailPanel
      key={selected.id}
      item={selected}
      owners={owners}
      suggestions={suggestions}
      monthShort={monthShort}
    />
  ) : (
    <p className="text-eb-text-tertiary text-[14px]">Elige un método para ver sus ajustes.</p>
  );

  return (
    <div className="mx-auto flex max-w-[1120px] flex-col gap-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="text-eb-text-tertiary text-[13px] font-semibold tracking-[0.04em] uppercase">
            Métodos de pago
          </div>
          <h1 className="eb-title">Cuentas</h1>
        </div>
        <button
          type="button"
          onClick={onNewMethod}
          className="eb-btn-primary flex h-10 items-center gap-2 rounded-[20px] px-[18px] text-[14px]"
        >
          <PlusIcon size={16} strokeWidth={2.4} aria-hidden="true" />
          Nuevo método
        </button>
      </header>

      <div className="grid grid-cols-12 items-start gap-6">
        <div className="col-span-12 flex flex-col gap-[22px] min-[1000px]:col-span-7">
          {active.length > 0 && <ShortcutStrip items={active} onPickUnlinked={pickUnlinked} />}

          {GROUPS.map((group) => {
            const cards = visible.filter((i) => i.type === group.type);
            if (cards.length === 0) return null;
            return (
              <section key={group.type} className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between px-1">
                  <h2 className="eb-card-title m-0">{group.title}</h2>
                  <span className="text-eb-text-tertiary text-[13px]">{cards.length}</span>
                </div>
                <div className="grid grid-cols-3 gap-[14px]">
                  {cards.map((item) => (
                    <CatalogCard
                      key={item.id}
                      ref={(el) => {
                        if (el) cardRefs.current.set(item.id, el);
                        else cardRefs.current.delete(item.id);
                      }}
                      name={item.name}
                      type={item.type}
                      color={item.color}
                      meta={cardMeta(item.type, item.paymentDay)}
                      uses={usesLabel(item.usesThisMonth, monthShort)}
                      linked={item.isLinkedToShortcut}
                      archived={item.archived}
                      selected={item.id === selectedId}
                      tabIndex={item.id === selectedId || (selectedId === null && item.id === order[0]) ? 0 : -1}
                      onSelect={() => select(item.id)}
                      onKeyDown={(e) => onCardKeyDown(e, item.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          {items.length === 0 && (
            <p className="text-eb-text-tertiary text-[14px]">Aún no tienes métodos de pago. Crea el primero.</p>
          )}

          {archivedCount > 0 && (
            <label className="text-eb-text-secondary flex cursor-pointer items-center justify-between gap-3 px-1 text-[14px]">
              <span>
                Mostrar archivados <span className="text-eb-text-tertiary">({archivedCount})</span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={showArchived}
                onClick={() => setShowArchived((v) => !v)}
                className={cn(
                  "relative inline-flex h-[26px] w-[44px] shrink-0 rounded-full transition-colors",
                  showArchived ? "bg-[#30D158]" : "bg-[var(--eb-segmented-bg)]"
                )}
              >
                <span
                  className={cn(
                    "mt-[2px] block size-[22px] rounded-full bg-white shadow transition-transform",
                    showArchived ? "translate-x-[20px]" : "translate-x-[2px]"
                  )}
                />
              </button>
            </label>
          )}
        </div>

        {wide && (
          <EbCard
            as="div"
            className="sticky top-6 col-span-5 flex flex-col gap-5 p-[22px]"
          >
            <aside aria-label="Detalle del método">{panel}</aside>
          </EbCard>
        )}
      </div>

      {!wide && selected && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="eb-card max-h-[90dvh] max-w-[480px] overflow-y-auto rounded-[26px] border-0 p-[22px]">
            <DialogTitle className="sr-only">{selected.name}</DialogTitle>
            <DialogDescription className="sr-only">Ajustes del método de pago</DialogDescription>
            {panel}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
