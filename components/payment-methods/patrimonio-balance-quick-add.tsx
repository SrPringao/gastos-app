"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircleIcon, ArrowUpRightIcon, CheckIcon } from "lucide-react";
import { Money } from "@/components/ui/eb/money";
import { showToast } from "@/components/ui/eb/toast";
import { formatMoney } from "@/lib/utils/money";
import { cn } from "@/lib/utils";
import type { PaymentMethodType } from "@/lib/payment-methods";

type Variant = "desktop" | "mobile";

/** "3,000.00" -> 300000 centavos; vacio o invalido -> null */
export function parseAmountInput(value: string): number | null {
  const clean = value.replace(/[,\s$]/g, "");
  if (!clean) return null;
  const n = Number(clean);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function formatAmountInput(value: string): string {
  const cents = parseAmountInput(value);
  if (cents === null) return value ? "" : value;
  return (cents / 100).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const COPY: Record<PaymentMethodType, { notice: string; label: string; skip: string; section: string }> = {
  credit: {
    notice: "Esta tarjeta aún no tiene saldo en Patrimonio. ¿Cuánto debes hoy?",
    label: "Deuda actual",
    skip: "No debo nada por ahora",
    section: "Deudas",
  },
  debit: {
    notice: "Esta cuenta aún no tiene saldo en Patrimonio. ¿Cuánto tienes hoy?",
    label: "Saldo actual",
    skip: "No tengo saldo por ahora",
    section: "Cuentas",
  },
  cash: {
    notice: "¿Cuánto efectivo tienes hoy?",
    label: "Saldo actual",
    skip: "No tengo saldo por ahora",
    section: "Cuentas",
  },
};

/** Campo de monto con prefijo "$" en SF Pro Rounded */
export function AmountField({
  label,
  value,
  onChange,
  variant,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  variant: Variant;
}) {
  const mobile = variant === "mobile";
  return (
    <label className="flex flex-col gap-1.5">
      <span className={cn("text-eb-text-tertiary", mobile ? "text-[13px]" : "text-[12px]")}>{label}</span>
      <span
        className={cn(
          "flex items-center gap-1 rounded-[12px] transition-shadow focus-within:shadow-[inset_0_0_0_2px_rgba(94,107,255,0.6)]",
          mobile ? "h-14 px-4" : "h-[52px] px-[14px]"
        )}
        style={{ background: "var(--eb-ios-fill)" }}
      >
        <span className={cn("eb-rounded text-eb-text-tertiary font-bold", mobile ? "text-[28px]" : "text-[24px]")}>$</span>
        <input
          inputMode="decimal"
          aria-label={label}
          placeholder="0.00"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ""))}
          onBlur={() => onChange(formatAmountInput(value))}
          className={cn(
            "eb-rounded text-eb-text placeholder:text-eb-text-tertiary min-w-0 flex-1 border-0 bg-transparent font-bold outline-none",
            mobile ? "text-[28px]" : "text-[24px]"
          )}
        />
      </span>
    </label>
  );
}

/** Contenedor del Estado A (tinte rojo para credito, verde para debito/efectivo) */
function StateAShell({
  type,
  variant,
  children,
}: {
  type: PaymentMethodType;
  variant: Variant;
  children: React.ReactNode;
}) {
  const tint = type === "credit" ? "rgba(255,105,97,0.10)" : "rgba(48,209,88,0.10)";
  const mobile = variant === "mobile";
  return (
    <div
      className={cn("flex flex-col rounded-[14px]", mobile ? "gap-[14px] p-4" : "gap-3 p-[14px]")}
      style={{
        background: `radial-gradient(100% 120% at 0% 0%, ${tint}, rgba(0,0,0,0) 60%), ${mobile ? "var(--eb-group-solid)" : "var(--eb-group-bg)"}`,
        boxShadow: mobile ? "inset 0 1px 0 rgba(255,255,255,0.06)" : "inset 0 0 0 1px rgba(255,255,255,0.06)",
      }}
    >
      {children}
    </div>
  );
}

function Destination({ type, name, variant }: { type: PaymentMethodType; name: string; variant: Variant }) {
  return (
    <div
      className={cn(
        "text-eb-text-secondary flex items-center gap-2",
        variant === "mobile" ? "text-[13px]" : "text-[12px]"
      )}
    >
      <span
        aria-hidden="true"
        className="size-2 shrink-0 rounded-full"
        style={{ background: type === "credit" ? "#FF6961" : "#30D158" }}
      />
      <span>
        Se crea en <b className="text-eb-text font-semibold">{COPY[type].section}</b> ligada a {name}
      </span>
    </div>
  );
}

export type BalanceDraft = {
  /** Texto del campo de monto */
  amount: string;
  /** "No debo nada / no tengo saldo por ahora": crea el item en 0 */
  zero: boolean;
};

/**
 * Bloque "Saldo en Patrimonio" (seccion 4). Estado A: el metodo no tiene
 * item en Patrimonio y se puede crear aqui. Estado B: ya lo tiene; solo
 * se muestra (los saldos se editan unicamente en Patrimonio).
 *
 * Con `draft` funciona como campo del flujo "Nuevo metodo": no guarda,
 * solo reporta el monto elegido al padre.
 */
export function PatrimonioBalanceQuickAdd({
  method,
  item,
  variant = "desktop",
  draft,
  onDraftChange,
}: {
  method: { id?: number; name: string; type: PaymentMethodType };
  item: { id: number; amount: number } | null;
  variant?: Variant;
  draft?: BalanceDraft;
  onDraftChange?: (draft: BalanceDraft) => void;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = COPY[method.type];
  const mobile = variant === "mobile";
  const displayName = method.name.trim() || (method.type === "credit" ? "esta tarjeta" : "esta cuenta");

  // Estado B
  if (item) {
    return (
      <div
        className={cn(
          "eb-privacy-swap flex min-h-12 items-center justify-between gap-3 overflow-hidden rounded-[14px]",
          mobile ? "px-4" : "px-[14px]"
        )}
        style={{
          background: mobile ? "var(--eb-group-solid)" : "var(--eb-group-bg)",
          boxShadow: mobile ? "inset 0 1px 0 rgba(255,255,255,0.06)" : "var(--eb-group-ring)",
        }}
      >
        <span className={cn("whitespace-nowrap", mobile ? "text-[16px]" : "text-[15px]")}>{copy.label}</span>
        <span className="flex items-center gap-2.5 whitespace-nowrap">
          <Money value={item.amount} private="netWorth" className="text-[15px] font-semibold" />
          <Link
            href={`/patrimonio?entry=${item.id}`}
            className="eb-link flex items-center gap-0.5 text-[14px] whitespace-nowrap"
          >
            Ver en Patrimonio
            <ArrowUpRightIcon size={14} strokeWidth={2.2} aria-hidden="true" />
          </Link>
        </span>
      </div>
    );
  }

  const value = draft ? draft.amount : amount;
  const setValue = (next: string) => {
    if (draft) onDraftChange?.({ amount: next, zero: false });
    else setAmount(next);
  };
  const cents = parseAmountInput(value);

  async function create(amountCents: number) {
    if (!method.id) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/net-worth/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: method.name,
          kind: method.type === "credit" ? "debt" : "asset",
          accountId: method.id,
          amount: amountCents,
          ...(method.type !== "credit" && { assetKind: "account" }),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "No se pudo agregar a Patrimonio");
        return;
      }
      const entryId: number | undefined = data?.id;
      setAmount("");
      router.refresh();
      const what = method.type === "credit" ? "Deuda" : "Saldo";
      showToast({
        message:
          amountCents > 0
            ? `${what} de ${formatMoney(amountCents)} ${method.type === "credit" ? "agregada" : "agregado"} a Patrimonio`
            : `${method.name} quedó en Patrimonio sin ${method.type === "credit" ? "deuda" : "saldo"}`,
        action: entryId
          ? {
              label: "Deshacer",
              onClick: async () => {
                await fetch(`/api/net-worth/entries/${entryId}`, { method: "DELETE" });
                router.refresh();
              },
            }
          : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <StateAShell type={method.type} variant={variant}>
      <div className="flex items-start gap-2.5">
        <AlertCircleIcon size={18} strokeWidth={2} color="#FF9F0A" className="mt-px flex-none" aria-hidden="true" />
        <div className={cn("text-eb-text-muted leading-[1.4]", mobile ? "text-[14px]" : "text-[13px]")}>
          {copy.notice}
        </div>
      </div>
      <AmountField label={copy.label} value={value} onChange={setValue} variant={variant} />
      <Destination type={method.type} name={displayName} variant={variant} />
      {error && <p className="text-eb-red text-[13px]">{error}</p>}
      {!draft && (
        <button
          type="button"
          disabled={cents === null || saving}
          onClick={() => cents !== null && create(cents)}
          className={cn(
            "eb-btn-primary font-semibold disabled:opacity-40",
            mobile ? "h-[50px] rounded-[14px] text-[17px]" : "h-11 rounded-[12px] text-[15px]"
          )}
        >
          {saving ? "Agregando..." : "Agregar a Patrimonio"}
        </button>
      )}
      <button
        type="button"
        disabled={saving}
        onClick={() => {
          if (draft) onDraftChange?.({ amount: "", zero: !draft.zero });
          else create(0);
        }}
        aria-pressed={draft ? draft.zero : undefined}
        className={cn(
          "self-center py-1",
          mobile ? "text-[14px]" : "text-[13px]",
          draft?.zero ? "text-eb-link font-semibold" : "text-eb-text-tertiary"
        )}
      >
        <span className="inline-flex items-center gap-1">
          {copy.skip}
          {draft?.zero && <CheckIcon size={14} strokeWidth={2.6} aria-hidden="true" />}
        </span>
      </button>
    </StateAShell>
  );
}
