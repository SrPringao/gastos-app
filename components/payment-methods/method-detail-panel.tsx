"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/eb/toast";
import { PatrimonioBalanceQuickAdd } from "./patrimonio-balance-quick-add";
import { PreviewCard, TYPE_LABELS } from "./method-cards";
import {
  ApplePaySection,
  CreditSection,
  FormSection,
  GeneralSection,
  type MethodDraft,
  type Variant,
  type WalletOwner,
} from "./method-form";
import { addWalletName, removeWalletName, updateMethod } from "./api";
import type { PaymentMethodCatalogItem } from "@/lib/payment-methods";
import { cn } from "@/lib/utils";

function draftFrom(item: PaymentMethodCatalogItem): MethodDraft {
  return { name: item.name, type: item.type, color: item.color, paymentDay: item.paymentDay };
}

function isDirty(draft: MethodDraft, item: PaymentMethodCatalogItem) {
  return (
    draft.name.trim() !== item.name ||
    draft.type !== item.type ||
    (draft.color ?? "") !== (item.color ?? "") ||
    (draft.type === "credit" && draft.paymentDay !== item.paymentDay)
  );
}

/** Confirmacion de archivar (accion destructiva suave: los gastos se conservan) */
export function ArchiveDialog({
  item,
  open,
  onOpenChange,
  onArchived,
}: {
  item: PaymentMethodCatalogItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onArchived: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="text-left">
          <DialogTitle>Archivar {item.name}</DialogTitle>
          <DialogDescription>
            Se ocultará de Cuentas y de Agregar gasto. Sus {item.usesTotal}{" "}
            {item.usesTotal === 1 ? "gasto se conserva" : "gastos se conservan"}.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const res = await updateMethod(item.id, { archived: true });
              setBusy(false);
              if (!res.ok) {
                setError(res.error);
                return;
              }
              onOpenChange(false);
              onArchived();
            }}
          >
            {busy ? "Archivando..." : "Archivar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Cambios de nombres de Wallet: se guardan al momento, no con "Guardar" */
export function useWalletActions(item: PaymentMethodCatalogItem, onChanged: () => void) {
  const [busy, setBusy] = useState(false);
  async function add(rawName: string) {
    setBusy(true);
    const res = await addWalletName(rawName, item.id);
    setBusy(false);
    if (!res.ok) {
      showToast({ message: res.error });
      return;
    }
    onChanged();
  }
  async function remove(key: string | number) {
    setBusy(true);
    const res = await removeWalletName(Number(key));
    setBusy(false);
    if (!res.ok) {
      showToast({ message: res.error });
      return;
    }
    onChanged();
  }
  return { busy, add, remove };
}

/**
 * Panel "Detalle del metodo" (seccion 3.2, columna derecha). Los campos
 * generales se guardan con "Guardar cambios" (el patron de formularios
 * del repo); los nombres de Wallet y el saldo, al momento.
 * Montalo con `key={item.id}` para reiniciar el borrador.
 */
export function MethodDetailPanel({
  item,
  owners,
  suggestions,
  monthShort,
  variant = "desktop",
  className,
}: {
  item: PaymentMethodCatalogItem;
  owners: WalletOwner[];
  suggestions: string[];
  monthShort: string;
  variant?: Variant;
  className?: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<MethodDraft>(() => draftFrom(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const wallet = useWalletActions(item, () => router.refresh());
  const dirty = isDirty(draft, item);

  async function save() {
    if (!draft.name.trim()) {
      setError("El nombre es requerido");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await updateMethod(item.id, {
      name: draft.name.trim(),
      type: draft.type,
      color: draft.color,
      paymentDay: draft.type === "credit" ? draft.paymentDay : null,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    showToast({ message: "Cambios guardados" });
    router.refresh();
  }

  async function restore() {
    const res = await updateMethod(item.id, { archived: false });
    if (res.ok) router.refresh();
  }

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <PreviewCard
        name={draft.name}
        type={draft.type}
        color={draft.color}
        meta={`${TYPE_LABELS[draft.type]}${draft.type === "credit" && draft.paymentDay ? ` · Pago día ${draft.paymentDay}` : ""}`}
        uses={`${item.usesThisMonth} ${item.usesThisMonth === 1 ? "gasto" : "gastos"} en ${monthShort}`}
        linked={item.isLinkedToShortcut}
        noBalance={!item.hasBalance}
        variant={variant}
      />

      <FormSection title="Saldo en Patrimonio" variant={variant}>
        <PatrimonioBalanceQuickAdd
          method={{ id: item.id, name: item.name, type: item.type }}
          item={item.patrimonioItem}
          variant={variant}
        />
      </FormSection>

      <GeneralSection draft={draft} onChange={(next) => setDraft((d) => ({ ...d, ...next }))} variant={variant} />
      <CreditSection draft={draft} onChange={(next) => setDraft((d) => ({ ...d, ...next }))} variant={variant} />

      {(dirty || error) && (
        <div className="flex items-center justify-end gap-3">
          {error && <span className="text-eb-red mr-auto text-[13px]">{error}</span>}
          <button
            type="button"
            onClick={() => {
              setDraft(draftFrom(item));
              setError(null);
            }}
            className="text-eb-text-tertiary px-2 py-2 text-[14px]"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving || !dirty}
            onClick={save}
            className="eb-btn-primary h-9 rounded-[18px] px-4 text-[14px] disabled:opacity-40"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      )}

      <ApplePaySection
        key={item.id}
        methodId={item.id}
        names={item.walletNames.map((w) => ({ key: w.id, rawName: w.rawName }))}
        owners={owners}
        suggestions={suggestions}
        onAdd={wallet.add}
        onRemove={wallet.remove}
        busy={wallet.busy}
        variant={variant}
      />

      <div className="flex items-center justify-between px-1 pt-1">
        <Link href={`/gastos?method=${item.id}`} className="eb-link text-[14px]">
          Ver sus gastos
        </Link>
        {item.archived ? (
          <button type="button" onClick={restore} className="eb-link py-2 pl-2.5 text-[14px]">
            Restaurar método
          </button>
        ) : (
          <button type="button" onClick={() => setArchiveOpen(true)} className="text-eb-red py-2 pl-2.5 text-[14px]">
            Archivar método
          </button>
        )}
      </div>

      <ArchiveDialog
        item={item}
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        onArchived={() => {
          showToast({
            message: `${item.name} archivado`,
            action: { label: "Deshacer", onClick: restore },
          });
          router.refresh();
        }}
      />
    </div>
  );
}

