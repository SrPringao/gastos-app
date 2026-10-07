"use client";

import { useRef, useState } from "react";
import { CheckIcon } from "lucide-react";
import { FormSection, GroupBox } from "@/components/payment-methods/method-form";
import { AccountThumb } from "@/components/ui/eb/account-card";
import { EbSheet } from "@/components/ui/eb/sheet";
import { cn } from "@/lib/utils";

/**
 * Piezas de formulario de las hojas (expensebro-modales-prompt.md, seccion 2).
 * Los grupos son los mismos de Cuentas (FormSection / GroupBox, variante movil).
 */

export { FormSection, GroupBox };

// ---------------------------------------------------------------------------
// Monto
// ---------------------------------------------------------------------------

/** "1,845.5" -> 184550 centavos; vacio o invalido -> null */
export function parseAmount(value: string): number | null {
  const clean = value.replace(/[,\s$]/g, "");
  if (!clean || clean === ".") return null;
  const n = Number(clean);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

/** 2652000 -> "26,520"; 649660 -> "6,496.60" */
export function centsToAmountInput(cents: number | null | undefined): string {
  if (cents == null) return "";
  const whole = Math.trunc(cents / 100).toLocaleString("en-US");
  const rest = Math.abs(cents % 100);
  return rest === 0 ? whole : `${whole}.${String(rest).padStart(2, "0")}`;
}

/**
 * Normaliza lo tecleado: solo digitos y un punto, maximo 2 decimales, sin
 * negativos, con separadores de miles en la parte entera.
 */
function formatTyping(raw: string): string {
  let clean = raw.replace(/[^0-9.]/g, "");
  const dot = clean.indexOf(".");
  if (dot >= 0) clean = clean.slice(0, dot + 1) + clean.slice(dot + 1).replace(/\./g, "").slice(0, 2);
  const [intPart, decPart] = clean.split(".");
  const intClean = intPart.replace(/^0+(?=\d)/, "");
  const grouped = intClean ? Number(intClean).toLocaleString("en-US") : dot >= 0 ? "0" : "";
  return decPart !== undefined ? `${grouped}.${decPart}` : grouped;
}

/** Cuantos caracteres significativos (digitos y punto) hay antes de `pos` */
function significantBefore(value: string, pos: number) {
  return value.slice(0, pos).replace(/[^0-9.]/g, "").length;
}

/** Posicion en `value` despues de `count` caracteres significativos */
function positionAfter(value: string, count: number) {
  if (count === 0) return 0;
  let seen = 0;
  for (let i = 0; i < value.length; i++) {
    if (/[0-9.]/.test(value[i])) seen++;
    if (seen === count) return i + 1;
  }
  return value.length;
}

export type AmountTint = "green" | "red" | "indigo";

const TINTS: Record<AmountTint, { color: string; glow: string }> = {
  green: { color: "var(--eb-green)", glow: "rgba(48,209,88,0.14)" },
  red: { color: "var(--eb-red)", glow: "rgba(255,105,97,0.14)" },
  indigo: { color: "var(--eb-link)", glow: "rgba(94,107,255,0.18)" },
};

/**
 * Campo de monto grande, siempre primero en la hoja. El input crece con su
 * contenido (un span invisible en la misma celda de grid fija el ancho).
 */
export function AmountHero({
  label,
  value,
  onChange,
  tint,
  footer,
  ariaLabel = "Monto",
  autoFocus = true,
  size = "md",
  onEnter,
  children,
}: {
  label: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  tint: AmountTint;
  footer?: React.ReactNode;
  ariaLabel?: string;
  autoFocus?: boolean;
  /** "lg": paso 1 de Nuevo gasto (56px, radio 22) */
  size?: "md" | "lg";
  /** Enter en el monto (ej. "Siguiente") */
  onEnter?: () => void;
  /** Contenido extra dentro de la tarjeta (botones rapidos) */
  children?: React.ReactNode;
}) {
  const lg = size === "lg";
  const { color } = TINTS[tint];
  const glow = lg && tint === "indigo" ? "rgba(94,107,255,0.16)" : TINTS[tint].glow;
  const valueClass = lg ? "text-[56px] tracking-[-0.03em]" : "text-[44px] tracking-[-0.02em]";
  const inputRef = useRef<HTMLInputElement>(null);
  const showCents = !value.includes(".");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const caret = input.selectionStart ?? input.value.length;
    const keep = significantBefore(input.value, caret);
    const next = formatTyping(input.value);
    onChange(next);
    // Los separadores de miles mueven el cursor: se reubica despues del render
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el || document.activeElement !== el) return;
      const pos = positionAfter(el.value, keep);
      el.setSelectionRange(pos, pos);
    });
  }

  return (
    <label
      className={cn(
        "flex flex-col items-center px-4",
        lg ? "gap-2.5 rounded-[22px] pt-7 pb-[22px]" : "gap-1.5 rounded-[18px] pt-5 pb-[18px]"
      )}
      style={{
        background: `radial-gradient(100% 120% at 50% 0%, ${glow}, transparent 65%), var(--eb-group-solid)`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.04)",
      }}
    >
      <span className="text-eb-text-tertiary flex items-center gap-1.5 text-[13px]">{label}</span>
      <span className="flex max-w-full items-baseline gap-0.5" style={{ fontFamily: "var(--eb-font-rounded)" }}>
        <span className={cn("font-bold", lg ? "text-[34px]" : "text-[30px]")} style={{ color }}>
          $
        </span>
        <span className="inline-grid min-w-0">
          <span
            aria-hidden="true"
            className={cn("invisible col-start-1 row-start-1 overflow-hidden px-0.5 font-bold whitespace-pre", valueClass)}
          >
            {value || "0"}
          </span>
          <input
            ref={inputRef}
            data-autofocus={autoFocus ? "" : undefined}
            inputMode="decimal"
            autoComplete="off"
            // Sin size el input conserva su ancho nativo (~20 caracteres)
            size={1}
            aria-label={ariaLabel}
            placeholder="0"
            value={value}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && onEnter) {
                e.preventDefault();
                onEnter();
              }
            }}
            className={cn(
              "placeholder:text-eb-chevron col-start-1 row-start-1 w-full min-w-0 border-0 bg-transparent p-0 text-center font-bold outline-none",
              valueClass
            )}
            style={{ fontFamily: "inherit", color: "var(--eb-text-strong)", caretColor: color }}
          />
        </span>
        {showCents && (
          <span className={cn("text-eb-chevron font-semibold", lg ? "text-[26px]" : "text-[22px]")}>.00</span>
        )}
      </span>
      {footer && <span className="text-eb-text-tertiary text-center text-[12px]">{footer}</span>}
      {children}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Segmented
// ---------------------------------------------------------------------------

export type SegmentedOption<T extends string> = { value: T; label: string; dot?: string };

/** "type": selector Tengo/Debo (32px, 14px). "section": 3 opciones (30px, 13px). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = "section",
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: "type" | "section";
}) {
  const big = size === "type";
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("grid gap-0.5 p-0.5", big ? "rounded-[10px]" : "rounded-[9px]")}
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
        background: "var(--eb-segmented-bg)",
      }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex items-center justify-center gap-1.5 transition-colors",
              big ? "h-8 rounded-[8px] text-[14px]" : "h-[30px] rounded-[7px] text-[13px]",
              active ? "text-eb-text font-semibold" : "text-eb-text-muted"
            )}
            style={
              active
                ? { background: "var(--eb-segmented-active)", boxShadow: "var(--eb-segmented-active-shadow)" }
                : undefined
            }
          >
            {option.dot && (
              <span aria-hidden="true" className="size-[7px] rounded-full" style={{ background: option.dot }} />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Switch
// ---------------------------------------------------------------------------

export function IOSSwitch({
  checked,
  onChange,
  disabled = false,
  labelledBy,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  labelledBy?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative h-[31px] w-[51px] flex-none rounded-[16px] transition-colors disabled:opacity-50"
      style={{
        background: checked ? "#30D158" : "rgba(120,120,128,0.32)",
        boxShadow: checked ? "inset 0 1px 1px rgba(0,0,0,0.15)" : undefined,
      }}
    >
      <span
        aria-hidden="true"
        className="absolute top-0.5 left-0.5 size-[27px] rounded-full bg-white transition-transform"
        style={{
          transform: checked ? "translateX(20px)" : "none",
          boxShadow: "0 3px 8px rgba(0,0,0,0.3), 0 1px 1px rgba(0,0,0,0.16)",
        }}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Filas
// ---------------------------------------------------------------------------

/** Fila de texto: etiqueta a la izquierda e input alineado a la derecha */
export function TextRow({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex min-h-12 items-center justify-between gap-3 px-4">
      <span className="flex-none text-[16px]">{label}</span>
      <input
        aria-label={label}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="text-eb-text-secondary placeholder:text-eb-chevron focus:text-eb-text min-w-0 flex-1 border-0 bg-transparent text-right text-[16px] outline-none"
      />
    </label>
  );
}

/** Fila con switch (y subtitulo opcional) */
export function SwitchRow({
  id,
  label,
  subtitle,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  subtitle?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={cn("flex min-h-[52px] items-center justify-between gap-3 px-4", disabled && "opacity-60")}>
      <div className="flex min-w-0 flex-col gap-px">
        <span id={id} className="text-[16px]">
          {label}
        </span>
        {subtitle && <span className="text-eb-text-tertiary text-[12px]">{subtitle}</span>}
      </div>
      <IOSSwitch checked={checked} onChange={onChange} disabled={disabled} labelledBy={id} />
    </div>
  );
}

/** Icono de selector (↕) de iOS */
export function UpDownIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--eb-chevron)"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 9l4-4 4 4M8 15l4 4 4-4" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Metodo de pago
// ---------------------------------------------------------------------------

export type PickerMethod = {
  id: number;
  name: string;
  type: "credit" | "debit" | "cash";
  color: string | null;
};

const TYPE_LABEL: Record<PickerMethod["type"], string> = {
  credit: "Crédito",
  debit: "Débito",
  cash: "Efectivo",
};

const chipFor = (id: number) => (id % 2 === 0 ? "silver" : "gold");

/**
 * Fila "Método de pago": miniatura + nombre (o "Ninguno"). Abre una hoja
 * secundaria con la lista de metodos y la opcion "Ninguno".
 */
export function MethodPickerRow({
  methods,
  value,
  onChange,
  unavailable,
}: {
  methods: PickerMethod[];
  value: number | null;
  onChange: (id: number | null) => void;
  /** Metodos que ya tienen su saldo en otro elemento de Patrimonio */
  unavailable?: Map<number, string>;
}) {
  const [open, setOpen] = useState(false);
  const selected = methods.find((m) => m.id === value) ?? null;

  function pick(id: number | null) {
    onChange(id);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={cn(
          "text-eb-text flex w-full items-center justify-between gap-3 px-4 text-left",
          selected ? "min-h-14" : "min-h-[52px]"
        )}
      >
        <span className="flex-none text-[16px]">Método de pago</span>
        <span
          className={cn(
            "flex min-w-0 items-center text-[16px]",
            selected ? "text-eb-text gap-2.5" : "text-eb-text-tertiary gap-2"
          )}
        >
          {selected && (
            <AccountThumb
              color={selected.color}
              isCash={selected.type === "cash"}
              chip={chipFor(selected.id)}
              size="sm"
            />
          )}
          <span className="truncate">{selected ? selected.name : "Ninguno"}</span>
          <UpDownIcon />
        </span>
      </button>

      <EbSheet open={open} onClose={() => setOpen(false)} title="Método de pago" nested>
        <GroupBox variant="mobile">
          <PickerOption selected={value === null} onSelect={() => pick(null)} title="Ninguno" />
          {methods.map((m) => {
            const owner = unavailable?.get(m.id);
            return (
              <PickerOption
                key={m.id}
                selected={m.id === value}
                disabled={!!owner && m.id !== value}
                onSelect={() => pick(m.id)}
                leading={<AccountThumb color={m.color} isCash={m.type === "cash"} chip={chipFor(m.id)} size="sm" />}
                title={m.name}
                subtitle={owner && m.id !== value ? `Ya está en Patrimonio (${owner})` : TYPE_LABEL[m.type]}
              />
            );
          })}
        </GroupBox>
      </EbSheet>
    </>
  );
}

function PickerOption({
  selected,
  disabled,
  onSelect,
  leading,
  title,
  subtitle,
}: {
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  leading?: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      className="text-eb-text flex min-h-[52px] w-full items-center gap-3 px-4 text-left disabled:opacity-40"
    >
      {leading}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[16px]">{title}</span>
        {subtitle && <span className="text-eb-text-tertiary truncate text-[12px]">{subtitle}</span>}
      </span>
      {selected && <CheckIcon size={18} strokeWidth={2.6} className="text-eb-link flex-none" aria-hidden="true" />}
    </button>
  );
}
