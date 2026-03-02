"use client";

import { useState, useRef } from "react";
import { CreditCardIcon, WalletIcon, BanknoteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Account } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#eab308",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

const TYPE_OPTIONS = [
  { value: "credit" as const, label: "Credito", icon: CreditCardIcon },
  { value: "debit" as const, label: "Debito", icon: WalletIcon },
  { value: "cash" as const, label: "Efectivo", icon: BanknoteIcon },
];

type AccountFormProps = {
  account?: Account | null;
  onSubmit: (data: {
    name: string;
    type: "credit" | "debit" | "cash";
    color: string | null;
    cutoffDay: number | null;
    paymentDay: number | null;
    creditLimit: string | null;
  }) => Promise<void>;
  onImageChange?: (file: File) => Promise<void>;
  error: string | null;
  submitLabel?: string;
};

export function AccountForm({
  account,
  onSubmit,
  onImageChange,
  error,
  submitLabel = "Guardar",
}: AccountFormProps) {
  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<"credit" | "debit" | "cash">(
    (account?.type as "credit" | "debit" | "cash") ?? "debit"
  );
  const [color, setColor] = useState(account?.color ?? PRESET_COLORS[0]);
  const [cutoffDay, setCutoffDay] = useState(
    account?.cutoffDay?.toString() ?? ""
  );
  const [paymentDay, setPaymentDay] = useState(
    account?.paymentDay?.toString() ?? ""
  );
  const [creditLimit, setCreditLimit] = useState(
    account?.creditLimit ?? ""
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      name,
      type,
      color,
      cutoffDay: cutoffDay ? Number(cutoffDay) : null,
      paymentDay: paymentDay ? Number(paymentDay) : null,
      creditLimit: type === "credit" && creditLimit ? creditLimit : null,
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !onImageChange) return;
    if (!file.type.startsWith("image/")) {
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      return;
    }
    setUploading(true);
    try {
      await onImageChange(file);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {account?.imageUrl ? (
        <div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-4">
          <img
            src={account.imageUrl}
            alt={account.name}
            className="size-14 rounded-xl object-cover border shadow-sm"
          />
          {onImageChange && (
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="rounded-lg"
              >
                {uploading ? "Subiendo..." : "Cambiar imagen"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}
        </div>
      ) : onImageChange && (
        <div className="rounded-xl border border-dashed bg-muted/20 p-4">
          <Label className="text-muted-foreground text-xs">Imagen (opcional)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mt-2 rounded-lg"
          >
            {uploading ? "Subiendo..." : "Subir imagen"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      <div>
        <Label htmlFor="name" className="text-muted-foreground text-sm font-medium">
          Nombre
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Tarjeta BBVA"
          required
          className="mt-2 h-11 rounded-lg border-muted-foreground/20"
        />
      </div>

      <div>
        <Label className="text-muted-foreground mb-2 block text-sm font-medium">
          Tipo de cuenta
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 transition-all",
                type === opt.value
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/15 hover:border-muted-foreground/30 hover:bg-muted/30"
              )}
            >
              <opt.icon
                className={cn(
                  "size-6",
                  type === opt.value ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium",
                  type === opt.value ? "text-primary" : "text-muted-foreground"
                )}
              >
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-muted-foreground mb-2 block text-sm font-medium">
          Color
        </Label>
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                "size-9 rounded-full border-2 transition-all hover:scale-110",
                color === c
                  ? "border-foreground ring-2 ring-primary/30 ring-offset-2"
                  : "border-transparent hover:border-muted-foreground/30"
              )}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
          <div className="flex items-center gap-2 rounded-lg border border-muted-foreground/20 p-1">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="size-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
            />
            <span className="text-muted-foreground text-xs">Personalizado</span>
          </div>
        </div>
      </div>

      {type === "credit" && (
        <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
          <Label className="text-muted-foreground text-sm font-medium">
            Configuracion de credito
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cutoffDay" className="text-xs">
                Dia de corte
              </Label>
              <Input
                id="cutoffDay"
                type="number"
                min={1}
                max={31}
                value={cutoffDay}
                onChange={(e) => setCutoffDay(e.target.value)}
                placeholder="1-31"
                className="mt-1.5 h-10 rounded-lg"
              />
            </div>
            <div>
              <Label htmlFor="paymentDay" className="text-xs">
                Dia de pago
              </Label>
              <Input
                id="paymentDay"
                type="number"
                min={1}
                max={31}
                value={paymentDay}
                onChange={(e) => setPaymentDay(e.target.value)}
                placeholder="1-31"
                className="mt-1.5 h-10 rounded-lg"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="creditLimit" className="text-xs">
              Limite de credito (opcional)
            </Label>
            <Input
              id="creditLimit"
              type="number"
              step="0.01"
              min="0"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              placeholder="0.00"
              className="mt-1.5 h-10 rounded-lg"
            />
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-2 text-destructive text-sm">
          {error}
        </div>
      )}
      <Button type="submit" className="h-11 rounded-lg font-medium">
        {submitLabel}
      </Button>
    </form>
  );
}
