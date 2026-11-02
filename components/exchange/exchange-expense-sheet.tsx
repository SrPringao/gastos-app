"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionSheet, EbSheet } from "@/components/ui/eb/sheet";
import {
  AmountHero,
  FormSection,
  GroupBox,
  Segmented,
  TextRow,
  centsToAmountInput,
  parseAmount,
} from "@/components/ui/eb/form-kit";
import { showToast } from "@/components/ui/eb/toast";
import { DateRow } from "@/components/ui/eb/date-row";
import {
  CURRENCY_SYMBOL,
  EXCHANGE_CATEGORIES,
  formatExchangeMoney,
  type ExchangeCategory,
  type ExchangeCurrency,
  type ExchangeExpenseItem,
} from "@/lib/exchange";
import { formatDayMonth, todayDateString } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";

type Draft = {
  amount: string;
  currency: ExchangeCurrency;
  reason: string;
  category: ExchangeCategory;
  date: string;
  note: string;
};

function draftFrom(item: ExchangeExpenseItem | null, lastCurrency: ExchangeCurrency): Draft {
  return item
    ? {
        amount: centsToAmountInput(item.amount),
        currency: item.currency,
        reason: item.reason,
        category: item.category,
        date: item.date,
        note: item.note ?? "",
      }
    : {
        amount: "",
        currency: lastCurrency,
        reason: "",
        category: "other",
        date: todayDateString(),
        note: "",
      };
}

/**
 * Alta / edicion de un gasto del intercambio. Montala con `key` distinto
 * por apertura para reiniciar el formulario.
 */
export function ExchangeExpenseSheet({
  open,
  onClose,
  item,
  lastCurrency,
}: {
  open: boolean;
  onClose: () => void;
  /** null = nuevo gasto */
  item: ExchangeExpenseItem | null;
  /** Moneda del ultimo gasto: la mas probable para el siguiente */
  lastCurrency: ExchangeCurrency;
}) {
  const router = useRouter();
  const [initial] = useState(() => draftFrom(item, lastCurrency));
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = item !== null;
  const cents = parseAmount(draft.amount);
  const valid = cents !== null && cents > 0 && draft.reason.trim() !== "" && draft.date !== "";
  const dirty = (Object.keys(initial) as (keyof Draft)[]).some((k) => initial[k] !== draft[k]);

  // Euros: el tipo guardado sirve mientras no cambien moneda ni fecha;
  // si cambian, el servidor consulta el del nuevo dia al guardar
  let amountFooter: string | undefined;
  if (draft.currency === "EUR") {
    const savedRate =
      item?.fxRate && item.fxDate && item.currency === "EUR" && item.date === draft.date ? item : null;
    amountFooter = savedRate
      ? `${cents ? `≈ ${formatExchangeMoney(Math.round(cents * savedRate.fxRate!), "MXN")} · ` : ""}${formatExchangeMoney(
          Math.round(savedRate.fxRate! * 100),
          "MXN"
        )} por euro (BCE, ${formatDayMonth(savedRate.fxDate!)})`
      : "Se convierte a pesos con el tipo de cambio de ese día";
  }

  function update(patch: Partial<Draft>) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  async function save() {
    if (!valid || cents === null) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(isEditing ? `/api/exchange-expenses/${item.id}` : "/api/exchange-expenses", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: cents / 100,
          currency: draft.currency,
          reason: draft.reason.trim(),
          category: draft.category,
          date: draft.date,
          note: draft.note.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Error al guardar");
        return;
      }
      showToast({ message: isEditing ? "Gasto actualizado" : "Gasto agregado al intercambio" });
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!item) return;
    setConfirmDelete(false);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/exchange-expenses/${item.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Error al eliminar");
        return;
      }
      showToast({ message: "Gasto eliminado" });
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <EbSheet
        open={open}
        onClose={onClose}
        title={isEditing ? "Editar gasto" : "Nuevo gasto"}
        ariaLabel={isEditing ? "Editar gasto del intercambio" : "Nuevo gasto del intercambio"}
        dirty={dirty}
        action={{
          label: saving ? "Guardando..." : isEditing ? "Guardar" : "Agregar",
          onClick: save,
          disabled: !valid || saving,
        }}
      >
        <AmountHero
          label="¿Cuánto fue?"
          value={draft.amount}
          onChange={(amount) => update({ amount })}
          symbol={CURRENCY_SYMBOL[draft.currency]}
          tint="indigo"
          autoFocus={!isEditing}
          footer={amountFooter}
        >
          <div className="mt-2 w-full max-w-[220px]">
            <Segmented<ExchangeCurrency>
              ariaLabel="Moneda"
              value={draft.currency}
              onChange={(currency) => update({ currency })}
              options={[
                { value: "MXN", label: "Pesos" },
                { value: "EUR", label: "Euros" },
              ]}
            />
          </div>
        </AmountHero>

        <FormSection variant="mobile">
          <GroupBox variant="mobile">
            <TextRow
              label="Motivo"
              value={draft.reason}
              placeholder="Ej: Vuelo CDMX - Madrid"
              onChange={(reason) => update({ reason })}
            />
            <DateRow value={draft.date} onChange={(date) => update({ date })} />
            <TextRow
              label="Nota"
              value={draft.note}
              placeholder="Opcional"
              onChange={(note) => update({ note })}
            />
          </GroupBox>
        </FormSection>

        <FormSection variant="mobile" title="Categoría">
          <div role="radiogroup" aria-label="Categoría" className="flex flex-wrap gap-2 px-1">
            {EXCHANGE_CATEGORIES.map((c) => {
              const active = draft.category === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => update({ category: c.value })}
                  className={cn(
                    "flex h-9 items-center gap-2 rounded-full px-3.5 text-[14px] transition-colors",
                    active ? "text-eb-text font-semibold" : "text-eb-text-secondary"
                  )}
                  style={{
                    background: active ? `color-mix(in srgb, ${c.color} 22%, transparent)` : "var(--eb-group-solid)",
                    boxShadow: active
                      ? `inset 0 0 0 1px color-mix(in srgb, ${c.color} 55%, transparent)`
                      : "inset 0 1px 0 rgba(255,255,255,0.06)",
                  }}
                >
                  <span aria-hidden="true" className="size-[7px] rounded-full" style={{ background: c.color }} />
                  {c.label}
                </button>
              );
            })}
          </div>
        </FormSection>

        {isEditing && (
          <GroupBox variant="mobile">
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={saving}
              className="text-eb-red min-h-12 w-full px-4 text-center text-[16px]"
            >
              Eliminar gasto
            </button>
          </GroupBox>
        )}

        {error && <p className="text-eb-red px-4 text-[14px]">{error}</p>}
      </EbSheet>

      <ActionSheet
        open={confirmDelete}
        message={item ? `¿Eliminar "${item.reason}"? Esta acción no se puede deshacer.` : undefined}
        actions={[{ label: "Eliminar", destructive: true, onSelect: remove }]}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
