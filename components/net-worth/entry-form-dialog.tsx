"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/date-picker";
import { dbDateToInputValue } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";
import type { Account, NetWorthEntry } from "@/lib/db/schema";
import {
  inferAssetKind,
  resolveAssetKind,
  type AssetKind,
} from "@/lib/dashboard-metrics";

const NO_ACCOUNT = "none";

type EntryFormValues = {
  label: string;
  accountId: string;
  amount: string;
  dueDate: string;
  syncEnabled: boolean;
  /** Seccion del positivo en Patrimonio */
  assetKind: AssetKind;
  contact: string;
};

const EMPTY_FORM: EntryFormValues = {
  label: "",
  accountId: NO_ACCOUNT,
  amount: "",
  dueDate: "",
  syncEnabled: false,
  assetKind: "receivable",
  contact: "",
};

const ASSET_KIND_LABELS: Record<AssetKind, string> = {
  account: "Cuenta",
  receivable: "Te deben",
  income: "Por recibir",
};

/**
 * Modal unico para agregar o editar una entrada de patrimonio. En desktop
 * el formulario inline (siempre visible, apretujado en 3 columnas) se
 * volvia inconsistente con el resto del sistema; aqui vive en su propio
 * dialogo, con el mismo lenguaje de EditAccountModal.
 */
export function EntryFormDialog({
  kind,
  accounts,
  entry,
  open,
  onOpenChange,
  onSaved,
}: {
  kind: "asset" | "debt";
  accounts: Account[];
  entry?: NetWorthEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const isEditing = !!entry;
  const [values, setValues] = useState<EntryFormValues>(EMPTY_FORM);
  const [labelEditedByUser, setLabelEditedByUser] = useState(false);
  // Mientras el usuario no elija seccion, se infiere del metodo/nombre
  const [assetKindEditedByUser, setAssetKindEditedByUser] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (entry) {
      setValues({
        label: entry.label,
        accountId: entry.accountId ? String(entry.accountId) : NO_ACCOUNT,
        amount: String(entry.amount / 100),
        dueDate: entry.dueDate ? dbDateToInputValue(entry.dueDate) : "",
        syncEnabled: entry.syncEnabled,
        assetKind: resolveAssetKind(entry),
        contact: entry.contact ?? "",
      });
    } else {
      setValues(EMPTY_FORM);
    }
    setLabelEditedByUser(false);
    setAssetKindEditedByUser(!!entry);
    setError(null);
  }, [open, entry]);

  function handleAccountChange(accountId: string) {
    const account = accounts.find((acc) => acc.id === Number(accountId));
    setValues((v) => ({
      ...v,
      accountId,
      syncEnabled: accountId === NO_ACCOUNT ? false : v.syncEnabled,
      label:
        !labelEditedByUser && !isEditing && account ? account.name : v.label,
      assetKind: assetKindEditedByUser
        ? v.assetKind
        : inferAssetKind({
            label: v.label,
            accountId: accountId === NO_ACCOUNT ? null : Number(accountId),
          }),
    }));
  }

  async function handleSubmit() {
    if (!values.label.trim() || !values.amount) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        label: values.label.trim(),
        kind,
        accountId: values.accountId === NO_ACCOUNT ? null : Number(values.accountId),
        amount: Math.round(parseFloat(values.amount || "0") * 100),
        dueDate: kind === "debt" && values.dueDate ? values.dueDate : null,
        syncEnabled: values.syncEnabled,
        ...(kind === "asset" && {
          assetKind: values.assetKind,
          contact: values.assetKind === "receivable" ? values.contact.trim() || null : null,
        }),
      };

      const res = await fetch(
        isEditing ? `/api/net-worth/entries/${entry.id}` : "/api/net-worth/entries",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Error al guardar");
        return;
      }
      onOpenChange(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!entry) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/net-worth/entries/${entry.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Error al eliminar");
        return;
      }
      onOpenChange(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const title = isEditing
    ? "Editar entrada"
    : kind === "asset"
      ? "Nuevo positivo"
      : "Nueva deuda";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {kind === "asset"
              ? "Un saldo o cuenta que suma a tu patrimonio."
              : "Una deuda que resta a tu patrimonio."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="entry-label">Nombre</Label>
            <Input
              id="entry-label"
              placeholder="Ej: Nu, Sueldo, iPad"
              value={values.label}
              onChange={(e) => {
                setLabelEditedByUser(true);
                const label = e.target.value;
                setValues((v) => ({
                  ...v,
                  label,
                  assetKind: assetKindEditedByUser
                    ? v.assetKind
                    : inferAssetKind({
                        label,
                        accountId: v.accountId === NO_ACCOUNT ? null : Number(v.accountId),
                      }),
                }));
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Metodo de pago (opcional)</Label>
            <Select value={values.accountId} onValueChange={handleAccountChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sin metodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_ACCOUNT}>Sin metodo</SelectItem>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={String(acc.id)}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {kind === "asset" && (
            <div className="space-y-2">
              <Label>Seccion</Label>
              <Select
                value={values.assetKind}
                onValueChange={(value) => {
                  setAssetKindEditedByUser(true);
                  setValues((v) => ({ ...v, assetKind: value as AssetKind }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ASSET_KIND_LABELS) as AssetKind[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {ASSET_KIND_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {kind === "asset" && values.assetKind === "receivable" && (
            <div className="space-y-2">
              <Label htmlFor="entry-contact">Quien te debe (opcional)</Label>
              <Input
                id="entry-contact"
                placeholder="Ej: Pedro"
                value={values.contact}
                onChange={(e) => setValues((v) => ({ ...v, contact: e.target.value }))}
              />
              <p className="text-muted-foreground text-xs">
                Los positivos con la misma persona se agrupan en una sola fila.
              </p>
            </div>
          )}

          <div
            className={cn(
              "flex items-start justify-between gap-3 rounded-[10px] border p-3",
              values.accountId === NO_ACCOUNT && "opacity-60"
            )}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">Sincronizar con gastos</p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {values.accountId === NO_ACCOUNT
                  ? "Elige un metodo de pago para activarla."
                  : kind === "debt"
                    ? "A partir de ahora, cada gasto nuevo de esa cuenta se suma a esta deuda."
                    : "A partir de ahora, cada gasto nuevo de esa cuenta se resta de este positivo."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={values.syncEnabled}
              disabled={values.accountId === NO_ACCOUNT}
              onClick={() =>
                setValues((v) => ({ ...v, syncEnabled: !v.syncEnabled }))
              }
              className={cn(
                "relative inline-flex h-6 w-10 shrink-0 rounded-full transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none",
                values.syncEnabled ? "bg-primary" : "bg-input"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none mt-0.5 block size-5 rounded-full bg-white shadow-sm transition-transform",
                  values.syncEnabled ? "translate-x-[18px]" : "translate-x-0.5"
                )}
              />
            </button>
          </div>

          {kind === "debt" && (
            <div className="space-y-2">
              <Label>Fecha limite (opcional)</Label>
              <DatePicker
                value={values.dueDate}
                onChange={(dueDate) => setValues((v) => ({ ...v, dueDate }))}
                placeholder="Sin fecha limite"
                className="w-full"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="entry-amount">Monto</Label>
            <Input
              id="entry-amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={values.amount}
              onChange={(e) => setValues((v) => ({ ...v, amount: e.target.value }))}
              className="font-figures"
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {isEditing && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleDelete}
              disabled={saving}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              Eliminar
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !values.label.trim() || !values.amount}
          >
            {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Agregar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
