"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { EbSheet } from "@/components/ui/eb/sheet";
import {
  AmountHero,
  GroupBox,
  SwitchRow,
  centsToAmountInput,
  parseAmount,
} from "@/components/ui/eb/form-kit";
import { showToast } from "@/components/ui/eb/toast";
import { buildBudgetSummary } from "@/lib/dashboard-metrics";
import { todayDateString } from "@/lib/utils/dates";
import { formatMoney } from "@/lib/utils/money";

/**
 * Presupuesto del mes (expensebro-modales-prompt.md, seccion 5): misma hoja
 * y misma altura que los modales de Patrimonio. La vista previa se recalcula
 * en vivo con la misma logica del Dashboard. Montala con `key` distinto por
 * apertura para reiniciar el formulario.
 */
export function BudgetSheet({
  open,
  onClose,
  monthKey,
  monthLabel,
  currentCents,
  spent,
  defaultBudget,
}: {
  open: boolean;
  onClose: () => void;
  monthKey: string;
  monthLabel: string;
  /** Presupuesto vigente del mes (propio o por defecto); null si no hay */
  currentCents: number | null;
  /** Gastado en el mes (centavos) */
  spent: number;
  /** Presupuesto por defecto del usuario */
  defaultBudget: number | null;
}) {
  const router = useRouter();
  const switchId = useId();
  const initialAmount = centsToAmountInput(currentCents);
  // Encendido si el monto vigente es el que se usa para los siguientes meses
  const initialDefault = defaultBudget !== null && defaultBudget === currentCents;
  const [amount, setAmount] = useState(initialAmount);
  const [useAsDefault, setUseAsDefault] = useState(initialDefault);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const month = monthLabel.toLocaleLowerCase("es-MX");
  const today = todayDateString();
  const isCurrentMonth = monthKey === today.slice(0, 7);
  const cents = parseAmount(amount);
  const valid = cents !== null && cents > 0;
  const dirty = amount !== initialAmount || useAsDefault !== initialDefault;
  const summary = buildBudgetSummary({ spent, budget: valid ? cents : null, monthKey, today });

  async function save() {
    if (!valid || cents === null) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/monthly-budget", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: monthKey,
          amount: cents / 100,
          // Encendido: guarda el por defecto. Apagado despues de estar encendido: lo quita.
          ...(useAsDefault ? { useAsDefault: true } : initialDefault ? { useAsDefault: false } : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Error al guardar");
        return;
      }
      showToast({ message: "Presupuesto guardado" });
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const over = summary.state !== "unset" && summary.remaining < 0;
  const ratio = summary.state !== "unset" ? Math.min(1, summary.usedRatio) : 0;

  return (
    <EbSheet
      open={open}
      onClose={onClose}
      title="Presupuesto"
      ariaLabel={`Presupuesto de ${month}`}
      dirty={dirty}
      action={{ label: saving ? "Guardando..." : "Guardar", onClick: save, disabled: !valid || saving }}
    >
      <AmountHero
        label={`¿Cuánto planeas gastar en ${month}?`}
        ariaLabel="Presupuesto"
        value={amount}
        onChange={setAmount}
        tint="indigo"
      />

      <div
        className="flex flex-col gap-2.5 rounded-[14px] px-4 py-3.5"
        style={{ background: "var(--eb-group-solid)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}
      >
        <div className="flex justify-between gap-3 text-[13px]">
          <span className="text-eb-text-tertiary">{isCurrentMonth ? "Gastado hasta hoy" : `Gastado en ${month}`}</span>
          <span className="font-semibold">
            {formatMoney(spent)}
            {summary.state !== "unset" && ` · ${summary.usedPercent}%`}
          </span>
        </div>
        <div
          className="h-2 rounded-[4px] p-0.5"
          style={{ background: "rgba(0,0,0,0.45)", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.6)" }}
        >
          <div
            className="h-full rounded-[2px] transition-[width] duration-200"
            style={{
              width: `${ratio * 100}%`,
              background: over
                ? "linear-gradient(90deg, #FFB340, #FF9F0A)"
                : "linear-gradient(90deg, var(--eb-accent-light), var(--eb-accent))",
              boxShadow: over ? "0 0 10px rgba(255,159,10,0.45)" : "0 0 10px var(--eb-accent-glow)",
            }}
          />
        </div>
        <div className="text-eb-text-muted text-[13px]">
          {summary.state === "unset" ? (
            "Escribe un monto para ver cómo te queda el mes."
          ) : over ? (
            <span className="text-eb-orange">
              Ya te pasaste por <b className="font-semibold">{formatMoney(-summary.remaining, { cents: false })}</b>
            </span>
          ) : (
            <>
              Te quedarían{" "}
              <b className="text-eb-text font-semibold">{formatMoney(summary.remaining, { cents: false })}</b>
              {summary.perDay !== null && <> · ≈ {formatMoney(summary.perDay, { cents: false })} al día</>}
            </>
          )}
        </div>
      </div>

      <GroupBox variant="mobile">
        <SwitchRow
          id={switchId}
          label="Usar para los siguientes meses"
          subtitle="Puedes cambiarlo cuando quieras"
          checked={useAsDefault}
          onChange={setUseAsDefault}
        />
      </GroupBox>

      {error && <p className="text-eb-red px-4 text-[14px]">{error}</p>}
    </EbSheet>
  );
}
