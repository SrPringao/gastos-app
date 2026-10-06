"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { NetWorthProjection } from "@/lib/db/schema";

/**
 * Agregar o editar un gasto previsto (concepto + monto). Reemplaza el
 * formulario inline del antiguo "Simulador de gastos previstos".
 */
export function ProjectionDialog({
  projection,
  open,
  onOpenChange,
  onSaved,
}: {
  projection?: NetWorthProjection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const isEditing = !!projection;
  const [label, setLabel] = useState(projection?.label ?? "");
  const [amount, setAmount] = useState(projection ? String(projection.amount / 100) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function request(url: string, init: RequestInit) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(url, init);
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cents = Math.round(parseFloat(amount || "0") * 100);
    if (!label.trim() || !Number.isFinite(cents) || cents <= 0) {
      setError("Escribe un concepto y un monto mayor a cero");
      return;
    }
    const body = JSON.stringify({ label: label.trim(), amount: cents });
    request(isEditing ? `/api/net-worth/projections/${projection.id}` : "/api/net-worth/projections", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="text-left">
          <DialogTitle>{isEditing ? "Editar previsto" : "Agregar previsto"}</DialogTitle>
          <DialogDescription>Un gasto que ya sabes que viene y resta a tu neto.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projection-label">Concepto</Label>
            <Input
              id="projection-label"
              placeholder="Ej: Renta, Super"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="projection-amount">Monto</Label>
            <Input
              id="projection-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <DialogFooter className="gap-2 sm:justify-between">
            {isEditing && (
              <Button
                type="button"
                variant="ghost"
                disabled={saving}
                onClick={() => request(`/api/net-worth/projections/${projection.id}`, { method: "DELETE" })}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Eliminar
              </Button>
            )}
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
