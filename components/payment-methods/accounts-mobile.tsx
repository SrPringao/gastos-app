"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRightIcon, PlusIcon, ZapIcon } from "lucide-react";
import { EbCard } from "@/components/ui/eb/card";
import { PageGlow } from "@/components/ui/eb/page-glow";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { showToast } from "@/components/ui/eb/toast";
import { CardChip, PreviewCard, SHORTCUT_GRADIENT, ShortcutBadge, TYPE_LABELS, cardSurface } from "./method-cards";
import { ApplePaySection, FormSection, GeneralSection, cardMeta, type WalletOwner } from "./method-form";
import { PatrimonioBalanceQuickAdd } from "./patrimonio-balance-quick-add";
import { restoreMethod, useMethodDraft, useWalletActions } from "./method-detail-panel";
import { updateMethod } from "./api";
import type { PaymentMethodCatalogItem } from "@/lib/payment-methods";

/** Separacion entre tarjetas apiladas: la franja visible de cada una */
const STRIP = 52;
const CARD_HEIGHT = 220;

// ---------------------------------------------------------------------------
// Pila estilo Wallet
// ---------------------------------------------------------------------------

/**
 * Atras los menos usados y al frente el mas usado del mes. Tocar una de
 * atras la trae al frente; tocar la del frente abre su hoja de detalle.
 */
function WalletStack({
  items,
  monthLong,
  onOpen,
}: {
  items: PaymentMethodCatalogItem[];
  monthLong: string;
  onOpen: (id: number) => void;
}) {
  // Orden de atras hacia adelante: menos usado -> mas usado
  const base = [...items].sort((a, b) => a.usesThisMonth - b.usesThisMonth || b.name.localeCompare(a.name, "es-MX"));
  const mostUsedId = base[base.length - 1]?.id;
  const [order, setOrder] = useState<number[]>(() => base.map((i) => i.id));
  // Si cambian los metodos (alta/archivo), se recalcula el orden base
  const ids = base.map((i) => i.id);
  const validOrder =
    order.length === ids.length && order.every((id) => ids.includes(id)) ? order : ids;
  const frontId = validOrder[validOrder.length - 1];

  function bringToFront(id: number) {
    setOrder([...validOrder.filter((x) => x !== id), id]);
  }

  return (
    <div className="relative" style={{ height: (validOrder.length - 1) * STRIP + CARD_HEIGHT }}>
      {validOrder.map((id, index) => {
        const item = items.find((i) => i.id === id)!;
        const front = id === frontId;
        const { background, inkVars } = cardSurface(item.color);
        return (
          <button
            key={id}
            type="button"
            aria-label={front ? `${item.name}, ver ajustes` : `${item.name}, traer al frente`}
            onClick={() => (front ? onOpen(id) : bringToFront(id))}
            className="eb-anim absolute inset-x-0 top-0 flex flex-col justify-between rounded-[18px] px-[18px] py-[15px] text-left text-[var(--ink)]"
            style={{
              ...inkVars,
              height: CARD_HEIGHT,
              zIndex: index,
              transform: `translateY(${index * STRIP}px)`,
              transition: "transform 300ms cubic-bezier(.2,.9,.25,1.05)",
              background,
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.28), inset 0 0 0 1px rgba(255,255,255,0.1), 0 -6px 16px rgba(0,0,0,0.45)",
            }}
          >
            <div className="flex h-[22px] items-center justify-between gap-2">
              <span className="truncate text-[16px] font-bold">{item.name}</span>
              <span className="flex shrink-0 items-center gap-1.5 text-[12px] text-[var(--ink-muted)]">
                {item.isLinkedToShortcut && <ShortcutBadge />}
                {!item.hasBalance && (
                  <span
                    className="size-2 rounded-full bg-[#FF9F0A]"
                    title="Sin saldo en Patrimonio"
                    aria-label="Sin saldo en Patrimonio"
                  />
                )}
                {TYPE_LABELS[item.type]}
              </span>
            </div>
            {front && (
              <>
                <CardChip type={item.type} color={item.color} size="lg" />
                <div className="flex items-end justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[12px] text-[var(--ink-muted)]">
                      {cardMeta(item.type, item.paymentDay)}
                      {id === mostUsedId && item.usesThisMonth > 0 ? " · Más usada" : ""}
                    </span>
                    <span className="text-[20px] font-bold tracking-[-0.01em]">
                      {item.usesThisMonth === 0
                        ? `Sin uso en ${monthLong}`
                        : `${item.usesThisMonth} ${item.usesThisMonth === 1 ? "gasto" : "gastos"} en ${monthLong}`}
                    </span>
                  </div>
                  <ChevronRightIcon size={16} strokeWidth={2.4} color="var(--ink-muted)" aria-hidden="true" />
                </div>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hoja de detalle (Phone-Cuenta-Detalle.dc.html)
// ---------------------------------------------------------------------------

function DetailSheetBody({
  item,
  owners,
  suggestions,
  monthShort,
  onClose,
}: {
  item: PaymentMethodCatalogItem;
  owners: WalletOwner[];
  suggestions: string[];
  monthShort: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const { draft, update, saving, error, save } = useMethodDraft(item);
  const wallet = useWalletActions(item, () => router.refresh());
  const [confirmArchive, setConfirmArchive] = useState(false);

  async function archive() {
    const res = await updateMethod(item.id, { archived: true });
    if (!res.ok) {
      showToast({ message: res.error });
      return;
    }
    setConfirmArchive(false);
    onClose();
    showToast({
      message: `${item.name} archivado`,
      action: { label: "Deshacer", onClick: () => restoreMethod(item.id, () => router.refresh()) },
    });
    router.refresh();
  }

  return (
    <>
      <div aria-hidden="true" className="mx-auto mt-1.5 h-[5px] w-9 rounded-[3px] bg-white/25" />
      <div className="sticky top-0 z-10 flex items-center justify-between px-2 pt-2" style={{ background: "var(--eb-sheet-bg)" }}>
        <button type="button" onClick={onClose} className="eb-link px-2.5 py-3 text-[17px]">
          Cancelar
        </button>
        <SheetTitle className="max-w-[55%] truncate text-[17px] font-semibold">{item.name}</SheetTitle>
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            if (await save()) onClose();
          }}
          className="eb-link px-2.5 py-3 text-[17px] font-semibold disabled:opacity-40"
        >
          {saving ? "Guardando..." : "Listo"}
        </button>
      </div>
      <SheetDescription className="sr-only">Ajustes del método de pago</SheetDescription>

      <div className="flex flex-col gap-[22px] px-4 pt-3 pb-10">
        <PreviewCard
          name={draft.name}
          type={draft.type}
          color={draft.color}
          meta={`${TYPE_LABELS[draft.type]}${draft.type === "credit" && draft.paymentDay ? ` · Pago día ${draft.paymentDay}` : ""}`}
          uses={`${item.usesThisMonth} ${item.usesThisMonth === 1 ? "gasto" : "gastos"} en ${monthShort}`}
          linked={item.isLinkedToShortcut}
          noBalance={!item.hasBalance}
          variant="mobile"
        />
        {error && <p className="text-eb-red px-4 text-[14px]">{error}</p>}

        <FormSection title="Saldo en Patrimonio" variant="mobile">
          <PatrimonioBalanceQuickAdd
            method={{ id: item.id, name: item.name, type: item.type }}
            item={item.patrimonioItem}
            variant="mobile"
          />
        </FormSection>

        <GeneralSection draft={draft} onChange={update} variant="mobile" />

        <ApplePaySection
          key={item.id}
          methodId={item.id}
          names={item.walletNames.map((w) => ({ key: w.id, rawName: w.rawName }))}
          owners={owners}
          suggestions={suggestions}
          onAdd={wallet.add}
          onRemove={wallet.remove}
          busy={wallet.busy}
          variant="mobile"
        />

        <div
          className="overflow-hidden rounded-[14px] [&>*+*]:border-t [&>*+*]:border-[var(--eb-separator)]"
          style={{ background: "var(--eb-group-solid)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}
        >
          <Link href={`/gastos?method=${item.id}`} className="text-eb-text flex min-h-12 items-center justify-between px-4">
            <span className="text-[16px]">Gastos con esta tarjeta</span>
            <span className="text-eb-text-secondary flex items-center gap-1.5 text-[16px]">
              {item.usesThisMonth} en {monthShort}
              <ChevronRightIcon size={13} strokeWidth={2.6} className="text-eb-chevron" aria-hidden="true" />
            </span>
          </Link>
          {item.archived ? (
            <button
              type="button"
              onClick={() => restoreMethod(item.id, () => router.refresh())}
              className="eb-link min-h-12 w-full px-4 text-left text-[16px]"
            >
              Restaurar método
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmArchive(true)}
              className="text-eb-red min-h-12 w-full px-4 text-left text-[16px]"
            >
              Archivar método
            </button>
          )}
        </div>
      </div>

      {/* Action sheet de confirmacion */}
      <Sheet open={confirmArchive} onOpenChange={setConfirmArchive}>
        <SheetContent side="bottom" showCloseButton={false} className="gap-2 border-0 bg-transparent p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-none">
          <div className="overflow-hidden rounded-[14px]" style={{ background: "var(--eb-group-solid)" }}>
            <SheetTitle className="text-eb-text-tertiary px-4 pt-3.5 pb-1 text-center text-[13px] font-semibold">
              Archivar {item.name}
            </SheetTitle>
            <SheetDescription className="text-eb-text-tertiary px-4 pb-3.5 text-center text-[13px]">
              Se ocultará de Cuentas y de Agregar gasto. Sus {item.usesTotal}{" "}
              {item.usesTotal === 1 ? "gasto se conserva" : "gastos se conservan"}.
            </SheetDescription>
            <button
              type="button"
              onClick={archive}
              className="text-eb-red min-h-14 w-full border-t border-[var(--eb-separator)] text-[20px]"
            >
              Archivar método
            </button>
          </div>
          <button
            type="button"
            onClick={() => setConfirmArchive(false)}
            className="eb-link min-h-14 w-full rounded-[14px] text-[20px] font-semibold"
            style={{ background: "var(--eb-group-solid)" }}
          >
            Cancelar
          </button>
        </SheetContent>
      </Sheet>
    </>
  );
}

function DetailSheet({
  item,
  open,
  onOpenChange,
  ...props
}: {
  item: PaymentMethodCatalogItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owners: WalletOwner[];
  suggestions: string[];
  monthShort: string;
}) {
  return (
    <Sheet open={open && !!item} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="text-eb-text h-[94dvh] gap-0 overflow-y-auto rounded-t-[14px] border-0 p-0"
        style={{ background: "var(--eb-sheet-bg)", fontFamily: "var(--eb-font)" }}
      >
        {item && <DetailSheetBody key={item.id} item={item} onClose={() => onOpenChange(false)} {...props} />}
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Lista rapida del atajo de Apple Pay
// ---------------------------------------------------------------------------

function ShortcutSheet({
  items,
  open,
  onOpenChange,
  onPick,
}: {
  items: PaymentMethodCatalogItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (id: number) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="text-eb-text max-h-[85dvh] gap-0 overflow-y-auto rounded-t-[14px] border-0 p-0"
        style={{ background: "var(--eb-sheet-bg)", fontFamily: "var(--eb-font)" }}
      >
        <div className="flex flex-col gap-1 px-5 pt-5 pb-3">
          <SheetTitle className="eb-card-title">Atajo de Apple Pay</SheetTitle>
          <SheetDescription className="text-eb-text-tertiary text-[13px]">
            Toca un método para vincular sus nombres de Wallet.
          </SheetDescription>
        </div>
        <div className="px-4 pb-8">
          <div
            className="overflow-hidden rounded-[14px] [&>*+*]:border-t [&>*+*]:border-[var(--eb-separator)]"
            style={{ background: "var(--eb-group-solid)" }}
          >
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onPick(item.id)}
                className="flex min-h-14 w-full items-center gap-3 px-4 text-left"
              >
                <span
                  aria-hidden="true"
                  className="size-2.5 flex-none rounded-full"
                  style={{ background: item.isLinkedToShortcut ? "#30D158" : "var(--eb-chart-empty-past)" }}
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[16px]">{item.name}</span>
                  <span className="text-eb-text-tertiary truncate text-[13px]">
                    {item.walletNames.length > 0
                      ? item.walletNames.map((w) => w.rawName).join(", ")
                      : "Sin nombre de Wallet"}
                  </span>
                </span>
                <ChevronRightIcon size={13} strokeWidth={2.6} className="text-eb-chevron" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Pagina
// ---------------------------------------------------------------------------

/** Cuentas en iPhone (Phone-Cuentas.dc.html, < 768px) */
export function AccountsMobile({
  items,
  owners,
  suggestions,
  monthShort,
  monthLong,
  onNewMethod,
}: {
  items: PaymentMethodCatalogItem[];
  owners: WalletOwner[];
  suggestions: string[];
  monthShort: string;
  monthLong: string;
  onNewMethod: () => void;
}) {
  const active = items.filter((i) => !i.archived);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [shortcutOpen, setShortcutOpen] = useState(false);
  const linked = active.filter((i) => i.isLinkedToShortcut).length;
  const detailItem = items.find((i) => i.id === detailId) ?? null;

  function openDetail(id: number) {
    setDetailId(id);
    setDetailOpen(true);
  }

  return (
    <div className="relative overflow-hidden md:hidden">
      <PageGlow variant="home" />
      <div className="relative z-[1] flex flex-col gap-[22px] px-4 pt-4 pb-14">
        <header className="flex items-end justify-between px-1">
          <div className="flex flex-col gap-0.5">
              <div className="text-eb-text-tertiary text-[13px] font-semibold tracking-[0.04em] uppercase">
                Métodos de pago
              </div>
              <h1 className="eb-title">Cuentas</h1>
          </div>
          <button
            type="button"
            aria-label="Nuevo método"
            onClick={onNewMethod}
            className="text-eb-link flex size-9 items-center justify-center rounded-full"
            style={{ background: "var(--eb-glass-strong)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)" }}
          >
            <PlusIcon size={18} strokeWidth={2.4} />
          </button>
        </header>

        {active.length > 0 ? (
          <>
            <WalletStack items={active} monthLong={monthLong} onOpen={openDetail} />
            <p className="text-eb-text-tertiary -mt-1.5 text-center text-[13px]">
              Toca una tarjeta para ver y editar sus ajustes
            </p>
          </>
        ) : (
          <p className="text-eb-text-tertiary text-center text-[14px]">Aún no tienes métodos de pago.</p>
        )}

        <section className="flex flex-col gap-1.5">
          <EbCard size="list-sm" as="div" className="overflow-hidden">
            <button
              type="button"
              onClick={() => setShortcutOpen(true)}
              className="text-eb-text flex min-h-[60px] w-full items-center gap-3 px-4 text-left"
            >
              <span
                aria-hidden="true"
                className="flex size-[30px] flex-none items-center justify-center rounded-[8px] text-white"
                style={{ background: SHORTCUT_GRADIENT, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)" }}
              >
                <ZapIcon size={15} fill="#fff" stroke="none" />
              </span>
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-[16px]">Atajo de Apple Pay</span>
                <span className="text-eb-text-tertiary text-[13px]">
                  {linked} de {active.length} métodos vinculados
                </span>
              </span>
              <ChevronRightIcon size={13} strokeWidth={2.6} className="text-eb-chevron" aria-hidden="true" />
            </button>
          </EbCard>
          <p className="text-eb-text-tertiary px-4 pt-1 text-[13px] leading-[1.4]">
            Los saldos de cada cuenta viven en Patrimonio.
          </p>
        </section>
      </div>

      <DetailSheet
        item={detailItem}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        owners={owners}
        suggestions={suggestions}
        monthShort={monthShort}
      />
      <ShortcutSheet
        items={active}
        open={shortcutOpen}
        onOpenChange={setShortcutOpen}
        onPick={(id) => {
          setShortcutOpen(false);
          openDetail(id);
        }}
      />
    </div>
  );
}

