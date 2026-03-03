"use client";

import { useState } from "react";
import { CheckIcon, TrashIcon, CalendarIcon, TagIcon, PencilIcon, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type FixedExpense = {
  id: number;
  name: string;
  amount: number;
  dayOfMonth: number | null;
  category: string | null;
};

type Payment = {
  fixedExpenseId: number;
  month: string;
  paidAt: string;
};

type FixedExpensesListProps = {
  initialItems: FixedExpense[];
  initialPayments: Payment[];
  monthKey: string;
};

function parseAmount(value: string): number {
  return parseFloat(value.replace(/,/g, ".")) || 0;
}

function EditModal({
  item,
  onSave,
  onClose,
}: {
  item: FixedExpense;
  onSave: (updated: FixedExpense) => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(String(item.amount / 100));
  const [name, setName] = useState(item.name);
  const [dayOfMonth, setDayOfMonth] = useState(item.dayOfMonth ? String(item.dayOfMonth) : "");
  const [category, setCategory] = useState(item.category ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!name.trim()) { setError("Ingresa un nombre."); return; }
    const parsed = parseAmount(amount);
    if (isNaN(parsed) || parsed <= 0) { setError("Ingresa un monto válido."); return; }
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/fixed-expenses/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          amount: parsed,
          dayOfMonth: dayOfMonth ? Number(dayOfMonth) : null,
          category: category.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al guardar"); return; }
      onSave({
        ...item,
        name: name.trim(),
        amount: Math.round(parsed * 100),
        dayOfMonth: dayOfMonth ? Number(dayOfMonth) : null,
        category: category.trim() || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Monto */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-muted-foreground text-sm">Monto mensual</span>
        <div className="flex items-baseline justify-center gap-0.5">
          <span className="text-4xl font-bold tracking-tight">$</span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9.,]/g, "").replace(/,/g, ".");
              if (v === "" || /^\d*\.?\d{0,2}$/.test(v)) setAmount(v);
            }}
            autoFocus
            className="w-full min-w-[80px] max-w-[200px] border-0 bg-transparent p-0 text-4xl font-bold tracking-tight tabular-nums outline-none focus:ring-0"
          />
        </div>
      </div>

      {/* Nombre */}
      <div className="rounded-2xl border border-border/50 bg-muted/30 px-4 py-3.5">
        <p className="text-muted-foreground mb-1 text-xs">Nombre</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-transparent text-sm font-medium outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border/50 bg-muted/30 px-4 py-3.5">
          <p className="text-muted-foreground mb-1 text-xs">Día de pago</p>
          <input
            type="number"
            min="1"
            max="31"
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(e.target.value)}
            placeholder="1 – 31"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="rounded-2xl border border-border/50 bg-muted/30 px-4 py-3.5">
          <p className="text-muted-foreground mb-1 text-xs">Etiqueta</p>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Opcional"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {error && <p className="text-destructive text-center text-sm">{error}</p>}

      <div className="flex gap-2">
        <Button variant="outline" onClick={onClose} className="h-11 rounded-xl">
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving} className="h-11 flex-1 rounded-xl gap-2">
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}

export function FixedExpensesList({
  initialItems,
  initialPayments,
  monthKey,
}: FixedExpensesListProps) {
  const [items, setItems] = useState<FixedExpense[]>(initialItems);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<FixedExpense | null>(null);

  function isPaid(id: number) {
    return payments.some((p) => p.fixedExpenseId === id && p.month === monthKey);
  }

  function getPaidAt(id: number) {
    return payments.find((p) => p.fixedExpenseId === id && p.month === monthKey)?.paidAt ?? null;
  }

  async function togglePayment(id: number) {
    if (loadingId !== null) return;
    setLoadingId(id);
    try {
      const paid = isPaid(id);
      if (paid) {
        await fetch(`/api/fixed-expenses/${id}/payment?month=${monthKey}`, {
          method: "DELETE",
        });
        setPayments((prev) =>
          prev.filter((p) => !(p.fixedExpenseId === id && p.month === monthKey))
        );
      } else {
        await fetch(`/api/fixed-expenses/${id}/payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ month: monthKey }),
        });
        setPayments((prev) => [
          ...prev,
          { fixedExpenseId: id, month: monthKey, paidAt: new Date().toISOString() },
        ]);
      }
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await fetch(`/api/fixed-expenses/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== id));
      setPayments((prev) => prev.filter((p) => p.fixedExpenseId !== id));
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  const paidCount = items.filter((i) => isPaid(i.id)).length;
  const totalCents = items.reduce((s, i) => s + i.amount, 0);
  const paidCents = items
    .filter((i) => isPaid(i.id))
    .reduce((s, i) => s + i.amount, 0);

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">
        No tienes gastos fijos registrados. Agrega uno con el botón de arriba.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="border-border flex flex-wrap items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
        <div className="flex-1">
          <p className="text-sm font-medium">
            {paidCount} de {items.length} pagados
          </p>
          <p className="text-muted-foreground text-xs">
            {formatCurrency(paidCents)} de {formatCurrency(totalCents)}
          </p>
        </div>
        {/* Barra de progreso */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted sm:w-40">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{
              width: totalCents > 0 ? `${(paidCents / totalCents) * 100}%` : "0%",
            }}
          />
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {items.map((item) => {
          const paid = isPaid(item.id);
          const paidAt = getPaidAt(item.id);
          const isLoading = loadingId === item.id;
          const isDeleting = deletingId === item.id;
          const confirmingDelete = confirmDeleteId === item.id;

          return (
            <div
              key={item.id}
              className={cn(
                "border-border flex min-h-[68px] items-center gap-3 rounded-xl border p-4 transition-colors",
                paid ? "bg-emerald-500/5 border-emerald-500/20" : "bg-background/50"
              )}
            >
              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{item.name}</p>
                  {item.category && (
                    <Badge variant="secondary" className="gap-1 text-xs font-normal">
                      <TagIcon className="size-3" />
                      {item.category}
                    </Badge>
                  )}
                </div>
                <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-medium text-foreground">
                    {formatCurrency(item.amount)}
                  </span>
                  {item.dayOfMonth && (
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="size-3" />
                      día {item.dayOfMonth}
                    </span>
                  )}
                  {paid && paidAt && (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Pagado el{" "}
                      {new Date(paidAt).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex shrink-0 items-center gap-2">
                {confirmingDelete ? (
                  <>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-muted-foreground hover:text-foreground rounded-full px-3 py-1.5 text-xs transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={isDeleting}
                      className="rounded-full bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
                    >
                      {isDeleting ? "Eliminando…" : "Confirmar"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => togglePayment(item.id)}
                      disabled={isLoading}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                        paid
                          ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-400"
                          : "border-border border hover:bg-muted text-muted-foreground"
                      )}
                    >
                      {isLoading ? (
                        <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : paid ? (
                        <CheckIcon className="size-3.5" />
                      ) : null}
                      {isLoading ? "" : paid ? "Pagado" : "Marcar como pagado"}
                    </button>
                    <button
                      onClick={() => setEditingItem(item)}
                      className="text-muted-foreground hover:text-foreground rounded-full p-1.5 transition-colors"
                    >
                      <PencilIcon className="size-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(item.id)}
                      className="text-muted-foreground hover:text-destructive rounded-full p-1.5 transition-colors"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de edición */}
      <Dialog open={!!editingItem} onOpenChange={(v) => { if (!v) setEditingItem(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar gasto fijo</DialogTitle>
            <DialogDescription className="sr-only">Editar los datos del gasto fijo</DialogDescription>
          </DialogHeader>
          {editingItem && (
            <EditModal
              item={editingItem}
              onSave={(updated) => {
                setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
              }}
              onClose={() => setEditingItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
