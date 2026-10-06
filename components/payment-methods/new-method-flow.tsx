"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { showToast } from "@/components/ui/eb/toast";
import { PAYMENT_METHOD_PALETTE } from "@/lib/account-colors";
import { PreviewCard, TYPE_LABELS } from "./method-cards";
import {
  ApplePaySection,
  CreditSection,
  FormSection,
  GeneralSection,
  type NewMethodDraft,
  type Variant,
  type WalletOwner,
} from "./method-form";
import {
  PatrimonioBalanceQuickAdd,
  parseAmountInput,
  type BalanceDraft,
} from "./patrimonio-balance-quick-add";
import { addWalletName, createMethod } from "./api";

const EMPTY: NewMethodDraft = {
  name: "",
  type: null,
  color: PAYMENT_METHOD_PALETTE[0].from,
  paymentDay: null,
};

function NewMethodBody({
  draft,
  setDraft,
  walletNames,
  setWalletNames,
  balance,
  setBalance,
  owners,
  suggestions,
  variant,
}: {
  draft: NewMethodDraft;
  setDraft: React.Dispatch<React.SetStateAction<NewMethodDraft>>;
  walletNames: string[];
  setWalletNames: React.Dispatch<React.SetStateAction<string[]>>;
  balance: BalanceDraft;
  setBalance: (b: BalanceDraft) => void;
  owners: WalletOwner[];
  suggestions: string[];
  variant: Variant;
}) {
  const previewType = draft.type ?? "debit";
  return (
    <>
      <PreviewCard
        name={draft.name}
        type={previewType}
        color={draft.color}
        meta={
          draft.type
            ? `${TYPE_LABELS[draft.type]}${draft.type === "credit" && draft.paymentDay ? ` · Pago día ${draft.paymentDay}` : ""}`
            : "Elige un tipo"
        }
        uses=""
        linked={walletNames.length > 0}
        noBalance={false}
        variant={variant}
      />
      <GeneralSection draft={draft} onChange={(next) => setDraft((d) => ({ ...d, ...next }))} variant={variant} />
      <CreditSection draft={draft} onChange={(next) => setDraft((d) => ({ ...d, ...next }))} variant={variant} />
      <ApplePaySection
        names={walletNames.map((rawName) => ({ key: rawName, rawName }))}
        owners={owners}
        suggestions={suggestions}
        onAdd={(rawName) => setWalletNames((list) => [...list, rawName])}
        onRemove={(key) => setWalletNames((list) => list.filter((n) => n !== key))}
        variant={variant}
      />
      {draft.type && (
        <FormSection title="¿Quieres registrar su saldo en Patrimonio?" variant={variant}>
          <PatrimonioBalanceQuickAdd
            method={{ name: draft.name, type: draft.type }}
            item={null}
            variant={variant}
            draft={balance}
            onDraftChange={setBalance}
          />
        </FormSection>
      )}
    </>
  );
}

/**
 * Flujo "Nuevo metodo" (seccion 6): modal en escritorio, hoja en iPhone.
 * Si se llena el saldo, el metodo y su item de Patrimonio se crean en una
 * sola accion; si no, el metodo queda en el Estado A del bloque de saldo.
 */
export function NewMethodFlow({
  open,
  onOpenChange,
  owners,
  suggestions,
  onCreated,
  variant,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owners: WalletOwner[];
  suggestions: string[];
  onCreated: (id: number) => void;
  variant: Variant;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<NewMethodDraft>(EMPTY);
  const [walletNames, setWalletNames] = useState<string[]>([]);
  const [balance, setBalance] = useState<BalanceDraft>({ amount: "", zero: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canCreate = draft.name.trim() !== "" && draft.type !== null && !saving;

  function reset() {
    setDraft(EMPTY);
    setWalletNames([]);
    setBalance({ amount: "", zero: false });
    setError(null);
  }

  function close(next: boolean) {
    onOpenChange(next);
    if (!next) reset();
  }

  async function create() {
    if (!draft.type || !draft.name.trim()) return;
    setSaving(true);
    setError(null);
    const amount = balance.zero ? 0 : parseAmountInput(balance.amount);
    const res = await createMethod({
      name: draft.name.trim(),
      type: draft.type,
      color: draft.color,
      paymentDay: draft.type === "credit" ? draft.paymentDay : null,
      ...(amount !== null && { patrimonioAmount: amount }),
    });
    if (!res.ok) {
      setSaving(false);
      setError(res.error);
      return;
    }
    const id = res.data.account.id;
    // Los nombres de Wallet se vinculan despues de crear el metodo
    for (const rawName of walletNames) {
      await addWalletName(rawName, id);
    }
    setSaving(false);
    showToast({ message: `${draft.name.trim()} creado` });
    close(false);
    onCreated(id);
    router.refresh();
  }

  const body = (
    <NewMethodBody
      draft={draft}
      setDraft={setDraft}
      walletNames={walletNames}
      setWalletNames={setWalletNames}
      balance={balance}
      setBalance={setBalance}
      owners={owners}
      suggestions={suggestions}
      variant={variant}
    />
  );

  if (variant === "mobile") {
    return (
      <Sheet open={open} onOpenChange={close}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="text-eb-text h-[94dvh] gap-0 overflow-y-auto rounded-t-[14px] border-0 p-0"
          style={{ background: "var(--eb-sheet-bg)", fontFamily: "var(--eb-font)" }}
        >
          <div aria-hidden="true" className="mx-auto mt-1.5 h-[5px] w-9 rounded-[3px] bg-white/25" />
          <div className="sticky top-0 z-10 flex items-center justify-between px-2 pt-2" style={{ background: "var(--eb-sheet-bg)" }}>
            <button type="button" onClick={() => close(false)} className="eb-link px-2.5 py-3 text-[17px]">
              Cancelar
            </button>
            <SheetTitle className="text-[17px] font-semibold">Nuevo método</SheetTitle>
            <button
              type="button"
              disabled={!canCreate}
              onClick={create}
              className="eb-link px-2.5 py-3 text-[17px] font-semibold disabled:opacity-40"
            >
              {saving ? "Creando..." : "Crear"}
            </button>
          </div>
          <SheetDescription className="sr-only">Datos del nuevo método de pago</SheetDescription>
          <div className="flex flex-col gap-[22px] px-4 pt-3 pb-10">
            {body}
            {error && <p className="text-eb-red px-4 text-[14px]">{error}</p>}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="eb-card max-h-[92dvh] max-w-[480px] gap-0 overflow-y-auto rounded-[26px] border-0 p-0">
        <div className="flex flex-col gap-5 p-[22px]">
          <div className="flex flex-col gap-1">
            <DialogTitle className="eb-card-title">Nuevo método</DialogTitle>
            <DialogDescription className="text-eb-text-tertiary text-[13px]">
              Un método con el que pagas: tarjeta, cuenta o efectivo.
            </DialogDescription>
          </div>
          {body}
          {error && <p className="text-eb-red text-[13px]">{error}</p>}
        </div>
        <div
          className="sticky bottom-0 flex justify-end gap-3 border-t border-[var(--eb-separator)] px-[22px] py-4"
          style={{ background: "var(--eb-surface-bottom)" }}
        >
          <button type="button" onClick={() => close(false)} className="text-eb-text-secondary px-3 text-[14px]">
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canCreate}
            onClick={create}
            className="eb-btn-primary h-10 rounded-[20px] px-[18px] text-[14px] disabled:opacity-40"
          >
            {saving ? "Creando..." : "Crear método"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
