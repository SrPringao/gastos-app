"use client";

import { forwardRef } from "react";
import { BanknoteIcon, ZapIcon } from "lucide-react";
import { accountTone, chipForColor } from "@/lib/account-colors";
import { cn } from "@/lib/utils";
import type { PaymentMethodType } from "@/lib/payment-methods";

const CHIPS = {
  gold: "linear-gradient(135deg, #F3E1A6, #C9A55A)",
  silver: "linear-gradient(135deg, #E9EAEE, #A8ABB5)",
} as const;

/** Degradado del atajo de Apple Pay (franja, tiles y etiquetas) */
export const SHORTCUT_GRADIENT = "linear-gradient(135deg, #FF6B8B 0%, #A35BFF 55%, #4F7BFF 100%)";

export const TYPE_LABELS: Record<PaymentMethodType, string> = {
  credit: "Crédito",
  debit: "Débito",
  cash: "Efectivo",
};

export type CardLook = {
  name: string;
  type: PaymentMethodType;
  color: string | null;
};

function surface(color: string | null, reflection = 0.2) {
  const tone = accountTone(color);
  return {
    tone,
    background: `radial-gradient(120% 90% at 100% 0%, rgba(255,255,255,${reflection}), rgba(255,255,255,0) 55%), linear-gradient(145deg, ${tone.light} 0%, ${tone.dark} 100%)`,
  };
}

/** Chip dorado/plateado o, en efectivo, billete */
export function CardChip({
  type,
  color,
  size,
}: {
  type: PaymentMethodType;
  color: string | null;
  size: "sm" | "lg";
}) {
  if (type === "cash") {
    return (
      <BanknoteIcon
        aria-hidden="true"
        size={size === "sm" ? 24 : 30}
        strokeWidth={1.6}
        color="rgba(255,255,255,0.85)"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={size === "sm" ? "h-5 w-7 rounded-[4px]" : "h-[30px] w-10 rounded-[6px]"}
      style={{ background: CHIPS[chipForColor(color)], boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)" }}
    />
  );
}

/** Circulo con rayo: la tarjeta registra gastos sola con el atajo */
export function ShortcutBadge({ size = 22 }: { size?: number }) {
  return (
    <span
      title="Vinculada al atajo"
      className="flex flex-none items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: "rgba(255,255,255,0.22)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
      }}
    >
      <ZapIcon size={Math.round(size * 0.55)} fill="#fff" stroke="none" aria-hidden="true" />
      <span className="sr-only">Vinculada al atajo</span>
    </span>
  );
}

/** Tarjeta del catalogo de escritorio (aspect 1.586) */
export const CatalogCard = forwardRef<
  HTMLButtonElement,
  CardLook & {
    meta: string;
    uses: string;
    linked: boolean;
    selected: boolean;
    archived?: boolean;
    onSelect: () => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
    tabIndex?: number;
  }
>(function CatalogCard(
  { name, type, color, meta, uses, linked, selected, archived, onSelect, onKeyDown, tabIndex },
  ref
) {
  const { tone, background } = surface(color);
  return (
    <button
      ref={ref}
      type="button"
      aria-label={name}
      aria-pressed={selected}
      tabIndex={tabIndex}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={cn(
        "relative flex aspect-[1.586] flex-col justify-between overflow-hidden rounded-[16px] px-[14px] py-3 text-left text-white outline-none transition-[box-shadow,transform] focus-visible:ring-2 focus-visible:ring-[var(--eb-accent)] active:scale-[0.98]",
        archived && "opacity-55"
      )}
      style={{
        background,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.28), inset 0 0 0 1px rgba(255,255,255,0.1), 0 16px 28px -16px ${tone.dark}${
          selected ? ", 0 0 0 2px var(--eb-bg), 0 0 0 4px var(--eb-accent)" : ""
        }`,
      }}
    >
      <div className="flex items-start justify-between gap-1.5">
        <span className="line-clamp-2 text-[14px] leading-[1.2] font-bold">{name}</span>
        {linked && <ShortcutBadge />}
      </div>
      <CardChip type={type} color={color} size="sm" />
      <div className="flex items-end justify-between gap-2 text-[11px]">
        <span className="truncate text-white/80">{archived ? "Archivado" : meta}</span>
        <span className="shrink-0 text-white/70">{uses}</span>
      </div>
    </button>
  );
});

/** Vista previa grande (panel de escritorio y hoja de iPhone) */
export function PreviewCard({
  name,
  type,
  color,
  meta,
  uses,
  linked,
  noBalance,
  variant = "desktop",
}: CardLook & {
  meta: string;
  uses: string;
  linked: boolean;
  noBalance: boolean;
  variant?: "desktop" | "mobile";
}) {
  const { background } = surface(color, 0.22);
  const mobile = variant === "mobile";
  return (
    <div
      className={cn(
        "relative flex flex-col justify-between overflow-hidden text-white",
        mobile ? "h-[222px] rounded-[18px] p-[18px]" : "aspect-[1.586] rounded-[20px] p-5"
      )}
      style={{
        background,
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.28), inset 0 0 0 1px rgba(255,255,255,0.1), 0 24px 40px -20px rgba(0,0,0,0.95)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn("min-w-0 truncate font-bold", mobile ? "text-[18px]" : "text-[20px]")}>
          {name || "Nuevo método"}
        </span>
        {noBalance ? (
          <span
            className="flex h-[26px] shrink-0 items-center rounded-[13px] px-2.5 text-[12px] font-semibold text-[#FFD08A]"
            style={{ background: "rgba(255,159,10,0.22)", boxShadow: "inset 0 0 0 1px rgba(255,159,10,0.4)" }}
          >
            {mobile ? "Sin saldo" : "Sin saldo en Patrimonio"}
          </span>
        ) : linked ? (
          <span
            className="flex h-[26px] shrink-0 items-center gap-1 rounded-[13px] px-2.5 text-[12px] font-semibold"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <ZapIcon size={12} fill="#fff" stroke="none" aria-hidden="true" />
            Atajo
          </span>
        ) : null}
      </div>
      <CardChip type={type} color={color} size="lg" />
      <div className="flex items-end justify-between gap-3 text-[13px] text-white/80">
        <span className="truncate">{meta}</span>
        <span className="shrink-0">{uses}</span>
      </div>
    </div>
  );
}

/** Fondo de una tarjeta para quien necesite pintar su propio contenido (pila Wallet) */
export function cardSurface(color: string | null) {
  return surface(color);
}
