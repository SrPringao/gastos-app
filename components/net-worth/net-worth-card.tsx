"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PencilIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { formatCurrency, dbDateToInputValue } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";
import { MaskedAmount } from "@/components/masked-amount";
import type { Account, NetWorthEntry } from "@/lib/db/schema";

type NetWorthCardProps = {
  accounts: Account[];
  entries: NetWorthEntry[];
};

const NO_ACCOUNT = "none";

function getDaysUntilDue(dueDate: Date | string | null): number | null {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const dueOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const now = new Date();
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = dueOnly.getTime() - todayOnly.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function DueDateBadge({ dueDate }: { dueDate: Date | string | null }) {
  const days = getDaysUntilDue(dueDate);
  if (days === null) return null;

  const label =
    days < 0
      ? `Vencido hace ${Math.abs(days)}d`
      : days === 0
        ? "Vence hoy"
        : `${days}d restantes`;

  return (
    <Badge
      variant={days <= 3 ? "warning" : "secondary"}
      className="font-figures shrink-0"
    >
      {label}
    </Badge>
  );
}

type EntryFormValues = {
  label: string;
  accountId: string;
  amount: string;
  dueDate: string;
};

const EMPTY_FORM: EntryFormValues = {
  label: "",
  accountId: NO_ACCOUNT,
  amount: "",
  dueDate: "",
};

/**
 * Modal unico para agregar o editar una entrada de patrimonio. En desktop
 * el formulario inline (siempre visible, apretujado en 3 columnas) se
 * volvia inconsistente con el resto del sistema; aqui vive en su propio
 * dialogo, con el mismo lenguaje de EditAccountModal.
 */
function EntryFormDialog({
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
      });
    } else {
      setValues(EMPTY_FORM);
    }
    setLabelEditedByUser(false);
    setError(null);
  }, [open, entry]);

  function handleAccountChange(accountId: string) {
    setValues((v) => ({ ...v, accountId }));
    if (labelEditedByUser || isEditing) return;
    const account = accounts.find((acc) => acc.id === Number(accountId));
    if (account) setValues((v) => ({ ...v, accountId, label: account.name }));
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
                setValues((v) => ({ ...v, label: e.target.value }));
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

        <DialogFooter>
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

/**
 * Fila de solo lectura: nombre + badge a la izquierda, monto + reordenar +
 * editar + eliminar a la derecha. El mismo layout sirve para movil y desktop,
 * ya sin el formulario inline que se apretujaba en pantallas grandes.
 */
function EntryRow({
  entry,
  accounts,
  isFirst,
  isLast,
  onMove,
  onEdit,
  onDeleted,
}: {
  entry: NetWorthEntry;
  accounts: Account[];
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: "up" | "down") => void;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/net-worth/entries/${entry.id}`, { method: "DELETE" });
      onDeleted();
    } finally {
      setDeleting(false);
    }
  }

  const account = accounts.find((a) => a.id === entry.accountId);

  return (
    <div className="border-border bg-background/50 flex items-center gap-3 rounded-lg border p-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium">{entry.label}</p>
          {entry.kind === "debt" && <DueDateBadge dueDate={entry.dueDate} />}
        </div>
        {account && (
          <p className="text-muted-foreground truncate text-xs">{account.name}</p>
        )}
      </div>

      <MaskedAmount className="font-figures shrink-0 font-medium">
        {formatCurrency(entry.amount)}
      </MaskedAmount>

      <div className="flex shrink-0 items-center gap-0.5">
        <div className="hidden flex-col sm:flex">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onMove("up")}
            disabled={isFirst}
            className="text-muted-foreground hover:text-foreground size-6"
          >
            <ChevronUpIcon className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onMove("down")}
            disabled={isLast}
            className="text-muted-foreground hover:text-foreground size-6"
          >
            <ChevronDownIcon className="size-3.5" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className="text-muted-foreground hover:text-foreground"
        >
          <PencilIcon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={deleting}
          className="text-muted-foreground hover:text-destructive"
        >
          <TrashIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function EntryList({
  entries,
  accounts,
  onSaved,
  onEdit,
}: {
  entries: NetWorthEntry[];
  accounts: Account[];
  onSaved: () => void;
  onEdit: (entry: NetWorthEntry) => void;
}) {
  const router = useRouter();
  const [reordering, setReordering] = useState(false);

  async function handleMove(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= entries.length) return;

    const reordered = [...entries];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    setReordering(true);
    try {
      await fetch("/api/net-worth/entries/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: reordered.map((e) => e.id) }),
      });
      router.refresh();
    } finally {
      setReordering(false);
    }
  }

  if (entries.length === 0) {
    return (
      <p className="text-muted-foreground py-4 text-center text-sm">
        Nada registrado todavia.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, index) => (
        <EntryRow
          key={entry.id}
          entry={entry}
          accounts={accounts}
          isFirst={index === 0}
          isLast={index === entries.length - 1}
          onMove={(direction) => {
            if (!reordering) handleMove(index, direction);
          }}
          onEdit={() => onEdit(entry)}
          onDeleted={onSaved}
        />
      ))}
    </div>
  );
}

/**
 * Card colapsable: en movil arranca cerrada (solo titulo + total), un tap
 * la despliega. En desktop (lg+) siempre se muestra completa, sin importar
 * el estado — el boton de colapsar tambien se oculta ahi, porque en
 * pantallas grandes no existe el problema de scroll interminable.
 */
function CollapsibleSection({
  title,
  total,
  totalClassName,
  onAdd,
  children,
}: {
  title: string;
  total: string;
  totalClassName?: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="lg:overflow-visible">
      <CardHeader>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex flex-1 items-center gap-3 text-left lg:pointer-events-none"
          >
            <CardTitle className="flex flex-1 items-center gap-2 normal-case tracking-normal">
              <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {title}
              </span>
            </CardTitle>
            <MaskedAmount className={cn("font-figures text-base font-semibold", totalClassName)}>
              {total}
            </MaskedAmount>
            <ChevronDownIcon
              className={cn(
                "text-muted-foreground size-4 shrink-0 transition-transform lg:hidden",
                open && "rotate-180"
              )}
            />
          </button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAdd}
            className="shrink-0 gap-1.5"
          >
            <PlusIcon className="size-4" />
            <span className="hidden sm:inline">Agregar</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className={cn(!open && "hidden lg:block")}>
        {children}
      </CardContent>
    </Card>
  );
}

export function NetWorthCard({ accounts, entries }: NetWorthCardProps) {
  const router = useRouter();
  const [dialog, setDialog] = useState<{
    kind: "asset" | "debt";
    entry?: NetWorthEntry;
  } | null>(null);

  function refresh() {
    router.refresh();
  }

  const assets = entries.filter((e) => e.kind === "asset");
  const debts = entries.filter((e) => e.kind === "debt");
  const totalAssets = assets.reduce((sum, e) => sum + e.amount, 0);
  const totalDebts = debts.reduce((sum, e) => sum + e.amount, 0);
  const net = totalAssets - totalDebts;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <CollapsibleSection
        title="Positivos"
        total={formatCurrency(totalAssets)}
        totalClassName="text-emerald-600 dark:text-emerald-400"
        onAdd={() => setDialog({ kind: "asset" })}
      >
        <EntryList
          entries={assets}
          accounts={accounts}
          onSaved={refresh}
          onEdit={(entry) => setDialog({ kind: "asset", entry })}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Deudas"
        total={formatCurrency(totalDebts)}
        totalClassName="text-destructive"
        onAdd={() => setDialog({ kind: "debt" })}
      >
        <EntryList
          entries={debts}
          accounts={accounts}
          onSaved={refresh}
          onEdit={(entry) => setDialog({ kind: "debt", entry })}
        />
      </CollapsibleSection>

      <Card className="lg:col-span-2">
        <CardContent className="space-y-5">
          <div>
            <p className="text-muted-foreground text-sm">Neto despues de pagos</p>
            <MaskedAmount
              className={cn(
                "font-figures block text-4xl font-medium tracking-tight",
                net >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-destructive"
              )}
            >
              {formatCurrency(net)}
            </MaskedAmount>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-xs font-medium tracking-wide text-emerald-700 uppercase dark:text-emerald-400">
                Positivos
              </p>
              <MaskedAmount className="font-figures mt-1 block text-xl font-medium text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalAssets)}
              </MaskedAmount>
            </div>
            <div className="border-destructive/20 bg-destructive/10 rounded-xl border p-4">
              <p className="text-destructive/90 text-xs font-medium tracking-wide uppercase">
                Deudas
              </p>
              <MaskedAmount className="font-figures text-destructive mt-1 block text-xl font-medium">
                {formatCurrency(totalDebts)}
              </MaskedAmount>
            </div>
          </div>
        </CardContent>
      </Card>

      {dialog && (
        <EntryFormDialog
          kind={dialog.kind}
          accounts={accounts}
          entry={dialog.entry}
          open={!!dialog}
          onOpenChange={(open) => !open && setDialog(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
