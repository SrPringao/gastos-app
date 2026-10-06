"use client";

import { useState } from "react";
import { ChevronsUpDownIcon, CreditCardIcon, MinusIcon, PlusIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { PAYMENT_METHOD_PALETTE, paletteEntry } from "@/lib/account-colors";
import { cn } from "@/lib/utils";
import type { PaymentMethodType } from "@/lib/payment-methods";
import { TYPE_LABELS } from "./method-cards";

export type Variant = "desktop" | "mobile";

export type MethodDraft = {
  name: string;
  type: PaymentMethodType;
  color: string | null;
  paymentDay: number | null;
};

/** Borrador del flujo "Nuevo metodo": el tipo puede no estar elegido aun */
export type NewMethodDraft = Omit<MethodDraft, "type"> & { type: PaymentMethodType | null };

// ---------------------------------------------------------------------------
// Contenedores de lista agrupada
// ---------------------------------------------------------------------------

export function FormSection({
  title,
  variant,
  footer,
  children,
}: {
  title?: string;
  variant: Variant;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const mobile = variant === "mobile";
  return (
    <section className="flex flex-col gap-1.5">
      {title && (
        <div
          className={cn(
            "text-eb-text-tertiary uppercase",
            mobile ? "px-4 text-[13px] tracking-[0.02em]" : "px-1 text-[12px] font-semibold tracking-[0.04em]"
          )}
        >
          {title}
        </div>
      )}
      {children}
      {footer && (
        <div
          className={cn(
            "text-eb-text-tertiary leading-[1.4]",
            mobile ? "px-4 pt-1 text-[13px]" : "px-1 pt-0.5 text-[12px]"
          )}
        >
          {footer}
        </div>
      )}
    </section>
  );
}

export function GroupBox({ variant, children }: { variant: Variant; children: React.ReactNode }) {
  const mobile = variant === "mobile";
  return (
    <div
      className="overflow-hidden rounded-[14px] [&>*+*]:border-t [&>*+*]:border-[var(--eb-separator)]"
      style={{
        background: mobile ? "var(--eb-group-solid)" : "var(--eb-group-bg)",
        boxShadow: mobile ? "inset 0 1px 0 rgba(255,255,255,0.06)" : "var(--eb-group-ring)",
      }}
    >
      {children}
    </div>
  );
}

function Row({
  variant,
  className,
  children,
}: {
  variant: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-h-12 items-center justify-between gap-3",
        variant === "mobile" ? "px-4" : "px-[14px]",
        className
      )}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// General: nombre, tipo, color
// ---------------------------------------------------------------------------

function TypeSegmented({
  value,
  onChange,
  variant,
}: {
  value: PaymentMethodType | null;
  onChange: (type: PaymentMethodType) => void;
  variant: Variant;
}) {
  const order: PaymentMethodType[] = ["debit", "credit", "cash"];
  return (
    <div
      role="radiogroup"
      aria-label="Tipo"
      className={cn("grid grid-cols-3 gap-0.5 rounded-[9px] p-0.5", variant === "mobile" && "w-full")}
      style={{ background: "var(--eb-segmented-bg)" }}
    >
      {order.map((type) => {
        const active = value === type;
        return (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(type)}
            className={cn(
              "rounded-[7px] px-2.5 text-[13px] transition-colors",
              variant === "mobile" ? "h-[30px]" : "h-7",
              active ? "text-eb-text font-semibold" : "text-eb-text-muted"
            )}
            style={
              active
                ? { background: "var(--eb-segmented-active)", boxShadow: "var(--eb-segmented-active-shadow)" }
                : undefined
            }
          >
            {TYPE_LABELS[type]}
          </button>
        );
      })}
    </div>
  );
}

function ColorSwatches({
  value,
  onChange,
  variant,
}: {
  value: string | null;
  onChange: (color: string) => void;
  variant: Variant;
}) {
  const mobile = variant === "mobile";
  const size = mobile ? 30 : 20;
  const ring = mobile ? "var(--eb-group-solid)" : "var(--eb-surface-bottom)";
  // Un color fuera de la paleta se muestra como 8o swatch "personalizado"
  const custom = value && !paletteEntry(value) ? value : null;
  const swatches = [
    ...PAYMENT_METHOD_PALETTE.map((p) => ({ value: p.from, background: `linear-gradient(145deg, ${p.from}, ${p.to})`, label: p.from })),
    ...(custom ? [{ value: custom, background: custom, label: "Personalizado" }] : []),
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Color"
      className={cn("flex", mobile ? "w-full justify-between" : "gap-2")}
    >
      {swatches.map((swatch) => {
        const selected = value?.toLowerCase() === swatch.value.toLowerCase();
        return (
          <button
            key={swatch.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={swatch.label === "Personalizado" ? "Color personalizado" : `Color ${swatch.value}`}
            onClick={() => onChange(swatch.value)}
            className="rounded-full transition-shadow"
            style={{
              width: size,
              height: size,
              background: swatch.background,
              boxShadow: selected ? `0 0 0 2px ${ring}, 0 0 0 4px #B3B9FF` : undefined,
            }}
          />
        );
      })}
      {/* Cualquier color: abre el selector nativo del sistema */}
      <label
        className="relative cursor-pointer rounded-full focus-within:ring-2 focus-within:ring-[var(--eb-accent)]"
        title="Elegir cualquier color"
        style={{
          width: size,
          height: size,
          background: "conic-gradient(from 90deg, #FF453A, #FF9F0A, #FFD60A, #30D158, #5AC8FA, #5E6BFF, #BF5AF2, #FF453A)",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.25)",
        }}
      >
        <input
          type="color"
          aria-label="Elegir cualquier color"
          value={value && /^#[0-9a-f]{6}$/i.test(value) ? value : "#5e6bff"}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
}

/** Nombre editable inline, alineado a la derecha */
function NameInput({
  value,
  onChange,
  variant,
}: {
  value: string;
  onChange: (value: string) => void;
  variant: Variant;
}) {
  return (
    <input
      aria-label="Nombre"
      value={value}
      placeholder="Ej: Nu Crédito"
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "text-eb-text-secondary placeholder:text-eb-text-tertiary focus:text-eb-text min-w-0 flex-1 border-0 bg-transparent text-right outline-none",
        variant === "mobile" ? "text-[16px]" : "text-[15px]"
      )}
    />
  );
}

export function GeneralSection({
  draft,
  onChange,
  variant,
}: {
  draft: MethodDraft | NewMethodDraft;
  onChange: (next: Partial<MethodDraft>) => void;
  variant: Variant;
}) {
  const mobile = variant === "mobile";
  const label = mobile ? "text-[16px]" : "text-[15px]";
  return (
    <FormSection title="General" variant={variant}>
      <GroupBox variant={variant}>
        <Row variant={variant}>
          <span className={label}>Nombre</span>
          <NameInput value={draft.name} onChange={(name) => onChange({ name })} variant={variant} />
        </Row>
        {mobile ? (
          <div className="flex flex-col gap-2.5 px-4 py-2.5">
            <span className={label}>Tipo</span>
            <TypeSegmented value={draft.type} onChange={(type) => onChange({ type })} variant={variant} />
          </div>
        ) : (
          <Row variant={variant}>
            <span className={label}>Tipo</span>
            <TypeSegmented value={draft.type} onChange={(type) => onChange({ type })} variant={variant} />
          </Row>
        )}
        {mobile && draft.type === "credit" && (
          <PaymentDayRow value={draft.paymentDay} onChange={(paymentDay) => onChange({ paymentDay })} variant={variant} />
        )}
        {mobile ? (
          <div className="flex flex-col gap-3 px-4 py-3">
            <span className={label}>Color</span>
            <ColorSwatches value={draft.color} onChange={(color) => onChange({ color })} variant={variant} />
          </div>
        ) : (
          <Row variant={variant}>
            <span className={label}>Color</span>
            <ColorSwatches value={draft.color} onChange={(color) => onChange({ color })} variant={variant} />
          </Row>
        )}
      </GroupBox>
    </FormSection>
  );
}

// ---------------------------------------------------------------------------
// Dia de pago (solo credito)
// ---------------------------------------------------------------------------

export function PaymentDayRow({
  value,
  onChange,
  variant,
}: {
  value: number | null;
  onChange: (day: number | null) => void;
  variant: Variant;
}) {
  const mobile = variant === "mobile";
  return (
    <Row variant={variant} className={mobile ? "min-h-[52px]" : undefined}>
      <div className="flex flex-col gap-px">
        <span className={mobile ? "text-[16px]" : "text-[15px]"}>Día de pago</span>
        <span className="text-eb-text-tertiary text-[12px]">Aparece en Próximos pagos</span>
      </div>
      <Select
        value={value ? String(value) : "none"}
        onValueChange={(v) => onChange(v === "none" ? null : Number(v))}
      >
        <SelectTrigger
          aria-label="Día de pago"
          className={cn(
            "text-eb-text-secondary h-auto gap-1.5 border-0 bg-transparent p-0 shadow-none dark:bg-transparent dark:hover:bg-transparent [&>svg:last-child]:hidden",
            mobile ? "text-[16px]" : "text-[15px]"
          )}
        >
          {value ? (mobile ? `Día ${value}` : `Día ${value} de cada mes`) : "Sin definir"}
          <ChevronsUpDownIcon size={12} strokeWidth={2.6} className="text-eb-chevron" aria-hidden="true" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          <SelectItem value="none">Sin definir</SelectItem>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
            <SelectItem key={day} value={String(day)}>
              Día {day}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Row>
  );
}

/** Escritorio: el dia de pago va en su propio grupo "Tarjeta de crédito" */
export function CreditSection({
  draft,
  onChange,
  variant,
}: {
  draft: MethodDraft | NewMethodDraft;
  onChange: (next: Partial<MethodDraft>) => void;
  variant: Variant;
}) {
  if (draft.type !== "credit" || variant === "mobile") return null;
  return (
    <FormSection title="Tarjeta de crédito" variant={variant}>
      <GroupBox variant={variant}>
        <PaymentDayRow value={draft.paymentDay} onChange={(paymentDay) => onChange({ paymentDay })} variant={variant} />
      </GroupBox>
    </FormSection>
  );
}

// ---------------------------------------------------------------------------
// Apple Pay: nombres de Wallet
// ---------------------------------------------------------------------------

export type WalletOwner = { methodId: number; methodName: string; walletId: number; rawName: string };

export function normalizeWalletName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("es-MX");
}

/**
 * Lista de nombres de Wallet de un metodo. `owners` (todos los nombres de
 * todos los metodos) permite detectar que un nombre ya es de otro metodo
 * y ofrecer "Mover aqui". Montala con `key={methodId}` para reiniciarla.
 */
export function ApplePaySection({
  methodId,
  names,
  owners,
  suggestions = [],
  onAdd,
  onRemove,
  variant,
  busy = false,
}: {
  methodId?: number;
  names: { key: string | number; rawName: string }[];
  owners: WalletOwner[];
  /** Nombres que llegaron del atajo sin metodo asignado */
  suggestions?: string[];
  onAdd: (rawName: string) => Promise<void> | void;
  onRemove: (key: string | number) => Promise<void> | void;
  variant: Variant;
  busy?: boolean;
}) {
  const mobile = variant === "mobile";
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const normalized = normalizeWalletName(value);
  const conflict = normalized
    ? owners.find((o) => normalizeWalletName(o.rawName) === normalized && o.methodId !== methodId)
    : undefined;
  const duplicate = normalized ? names.some((n) => normalizeWalletName(n.rawName) === normalized) : false;
  const pendingSuggestions = suggestions.filter(
    (s) => !names.some((n) => normalizeWalletName(n.rawName) === normalizeWalletName(s))
  );

  async function submit(name = value) {
    const clean = name.trim();
    if (!clean) return;
    if (names.some((n) => normalizeWalletName(n.rawName) === normalizeWalletName(clean))) {
      setError("Ese nombre ya está en este método.");
      return;
    }
    setError(null);
    await onAdd(clean);
    setValue("");
    setAdding(false);
  }

  return (
    <FormSection
      title="Apple Pay"
      variant={variant}
      footer={
        mobile
          ? "Al pagar con esta tarjeta en Apple Pay, el atajo registra el gasto aquí. Usa el nombre exacto que muestra Wallet."
          : "Escribe el nombre exacto con el que aparece la tarjeta en Wallet. Puedes agregar varios."
      }
    >
      <GroupBox variant={variant}>
        {names.length === 0 && !mobile && (
          <div className="text-eb-text-tertiary flex min-h-11 items-center px-[14px] text-[14px]">
            Ningún nombre de Wallet vinculado
          </div>
        )}
        {names.map((n) =>
          mobile ? (
            <div key={n.key} className="flex min-h-14 items-center gap-3 px-4">
              <button
                type="button"
                disabled={busy}
                onClick={() => onRemove(n.key)}
                aria-label={`Quitar ${n.rawName}`}
                className="flex size-[22px] flex-none items-center justify-center rounded-full bg-[#FF453A] text-white"
              >
                <MinusIcon size={12} strokeWidth={3} />
              </button>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-[16px]">{n.rawName}</span>
                <span className="text-eb-text-tertiary text-[12px]">Nombre en Wallet</span>
              </div>
            </div>
          ) : (
            <div key={n.key} className="flex min-h-[52px] items-center gap-3 px-[14px]">
              <span
                aria-hidden="true"
                className="text-eb-text-tertiary flex size-[30px] flex-none items-center justify-center rounded-[8px]"
                style={{ background: "var(--eb-neutral-tile)" }}
              >
                <CreditCardIcon size={16} strokeWidth={2} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[15px]">{n.rawName}</span>
                <span className="text-eb-text-tertiary text-[12px]">Nombre en Wallet</span>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => onRemove(n.key)}
                className="text-eb-red py-2 pl-2 text-[14px]"
              >
                Quitar
              </button>
            </div>
          )
        )}

        {adding ? (
          <div className={cn("flex flex-col gap-2 py-3", mobile ? "px-4" : "px-[14px]")}>
            <input
              autoFocus
              aria-label="Nombre en Wallet"
              placeholder="Ej: Revolut Mastercard"
              value={value}
              list={`wallet-suggestions-${methodId ?? "new"}`}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !conflict) {
                  e.preventDefault();
                  submit();
                }
                if (e.key === "Escape") setAdding(false);
              }}
              className={cn(
                "text-eb-text placeholder:text-eb-text-tertiary h-10 rounded-[10px] border-0 px-3 outline-none focus:shadow-[inset_0_0_0_2px_rgba(94,107,255,0.6)]",
                mobile ? "text-[16px]" : "text-[15px]"
              )}
              style={{ background: "var(--eb-ios-fill)" }}
            />
            <datalist id={`wallet-suggestions-${methodId ?? "new"}`}>
              {pendingSuggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            {conflict ? (
              <div className="text-eb-text-muted flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
                <span>
                  Ya está vinculado a <b className="text-eb-text font-semibold">{conflict.methodName}</b>.
                </span>
                <button type="button" disabled={busy} onClick={() => submit()} className="eb-link font-semibold">
                  Mover aquí
                </button>
              </div>
            ) : duplicate ? (
              <p className="text-eb-text-tertiary text-[13px]">Ese nombre ya está en este método.</p>
            ) : null}
            {error && <p className="text-eb-red text-[13px]">{error}</p>}
            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={() => setAdding(false)} className="text-eb-text-tertiary text-[14px]">
                Cancelar
              </button>
              {!conflict && (
                <button
                  type="button"
                  disabled={busy || !value.trim() || duplicate}
                  onClick={() => submit()}
                  className="eb-link text-[14px] font-semibold disabled:opacity-40"
                >
                  Agregar
                </button>
              )}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className={cn(
              "text-eb-link flex w-full items-center gap-3 text-left",
              mobile ? "min-h-[52px] px-4 text-[16px]" : "min-h-12 px-[14px] text-[15px]"
            )}
          >
            {mobile ? (
              <span className="flex size-[22px] flex-none items-center justify-center rounded-full bg-[#30D158] text-white">
                <PlusIcon size={12} strokeWidth={3} aria-hidden="true" />
              </span>
            ) : (
              <span
                className="flex size-[30px] flex-none items-center justify-center rounded-full"
                style={{ background: "rgba(94,107,255,0.18)" }}
              >
                <PlusIcon size={15} strokeWidth={2.4} aria-hidden="true" />
              </span>
            )}
            Agregar nombre de Wallet
          </button>
        )}
      </GroupBox>

      {!adding && pendingSuggestions.length > 0 && (
        <div className={cn("flex flex-wrap items-center gap-1.5", mobile ? "px-4" : "px-1")}>
          <span className="text-eb-text-tertiary text-[12px]">Sin asignar en el atajo:</span>
          {pendingSuggestions.slice(0, 4).map((s) => (
            <button
              key={s}
              type="button"
              disabled={busy}
              onClick={() => submit(s)}
              className="text-eb-text-muted rounded-full px-2.5 py-1 text-[12px]"
              style={{ background: "var(--eb-glass-strong)" }}
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </FormSection>
  );
}

/** Texto del pie de la tarjeta: "Pago día 2" / "Débito" / "En mano" */
export function cardMeta(type: PaymentMethodType, paymentDay: number | null): string {
  if (type === "credit") return paymentDay ? `Pago día ${paymentDay}` : "Crédito";
  return type === "debit" ? "Débito" : "En mano";
}

/** "13 gastos", "1 gasto" o "Sin uso en oct" */
export function usesLabel(count: number, monthShort: string): string {
  if (count === 0) return `Sin uso en ${monthShort}`;
  return count === 1 ? "1 gasto" : `${count} gastos`;
}
