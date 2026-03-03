"use client";

import { useState } from "react";
import { PlusIcon, ChevronRightIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-media-query";

function parseAmount(value: string): number {
  return parseFloat(value.replace(/,/g, ".")) || 0;
}

type AddFixedExpenseModalProps = {
  onSuccess: () => void;
};

function ModalContent({
  onSuccess,
  onClose,
}: {
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    const parsed = parseAmount(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setError("Ingresa un monto válido.");
      return;
    }
    if (!name.trim()) {
      setError("Ingresa un nombre.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/fixed-expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          amount: parsed,
          dayOfMonth: dayOfMonth ? Number(dayOfMonth) : null,
          category: category.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al guardar");
        return;
      }
      onSuccess();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Monto grande */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-muted-foreground text-sm">Monto mensual</span>
        <div className="flex items-baseline justify-center gap-0.5">
          <span className="text-5xl font-bold tracking-tight sm:text-6xl">$</span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9.,]/g, "").replace(/,/g, ".");
              if (v === "" || /^\d*\.?\d{0,2}$/.test(v)) setAmount(v);
            }}
            placeholder="0"
            autoFocus
            aria-label="Monto"
            className="w-full min-w-[80px] max-w-[240px] border-0 bg-transparent p-0 text-5xl font-bold tracking-tight tabular-nums outline-none placeholder:text-muted-foreground/60 focus:ring-0 sm:text-6xl"
          />
        </div>
      </div>

      {/* Presets */}
      <div className="flex justify-center gap-2">
        {[100, 500, 1000, 5000].map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setAmount((prev) => String(parseAmount(prev) + preset))}
            className="bg-muted hover:bg-muted/80 rounded-full px-4 py-2 text-sm font-medium transition-colors"
          >
            ${preset >= 1000 ? `${preset / 1000}k` : preset}
          </button>
        ))}
      </div>

      {/* Nombre */}
      <div className="rounded-2xl border border-border/50 bg-muted/30 px-4 py-3.5">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre (ej: Escuela, Renta, Gym…)"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
      </div>

      {/* Día y categoría en una fila */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border/50 bg-muted/30 px-4 py-3.5">
          <p className="text-muted-foreground mb-1 text-xs">Día de pago (opcional)</p>
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
          <p className="text-muted-foreground mb-1 text-xs">Etiqueta (opcional)</p>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Educación…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {error && <p className="text-destructive text-center text-sm">{error}</p>}

      <Button
        onClick={handleSubmit}
        className="h-12 gap-2 rounded-xl"
        disabled={saving || !amount || parseAmount(amount) <= 0}
      >
        {saving && <Loader2 className="size-4 animate-spin" />}
        <span>{saving ? "Guardando..." : "Agregar gasto fijo"}</span>
        {!saving && <ChevronRightIcon className="size-4" />}
      </Button>
    </div>
  );
}

export function AddFixedExpenseModal({ onSuccess }: AddFixedExpenseModalProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const trigger = (
    <Button size="lg" className="h-12 w-full gap-2 sm:h-10 sm:w-auto sm:min-w-[140px]">
      <PlusIcon className="size-5 shrink-0" />
      Agregar
    </Button>
  );

  return isMobile ? (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom" className="max-h-[90dvh] min-h-[65vh] overflow-y-auto">
        <SheetHeader className="sr-only">
          <SheetTitle>Nuevo gasto fijo</SheetTitle>
          <SheetDescription>Agregar un gasto fijo recurrente</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6 pt-4">
          <ModalContent onSuccess={onSuccess} onClose={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  ) : (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Nuevo gasto fijo</DialogTitle>
          <DialogDescription className="sr-only">
            Agregar un gasto fijo recurrente
          </DialogDescription>
        </DialogHeader>
        <ModalContent onSuccess={onSuccess} onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
