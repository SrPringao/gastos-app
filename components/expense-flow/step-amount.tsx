"use client";

import { PencilIcon } from "lucide-react";
import { AmountHero, GroupBox, centsToAmountInput, parseAmount } from "@/components/ui/eb/form-kit";
import { FlowChip, FlowHeader } from "./parts";
import type { ExpenseDraft, FlowCategory, FlowMethod, Suggestions } from "./types";
import type { RecentMerchant } from "@/lib/expense-suggestions";

const QUICK_AMOUNTS = [
  { label: "+$100", cents: 10000 },
  { label: "+$200", cents: 20000 },
  { label: "+$500", cents: 50000 },
  { label: "+$1k", cents: 100000 },
];

/** Paso 1: monto, nota y Recientes */
export function StepAmount({
  draft,
  update,
  suggestions,
  methods,
  categories,
  onNext,
}: {
  draft: ExpenseDraft;
  update: (next: Partial<ExpenseDraft>) => void;
  suggestions: Suggestions | null;
  methods: FlowMethod[];
  categories: FlowCategory[];
  onNext: () => void;
}) {
  const recents = suggestions?.recents ?? [];
  const categoryName = (id: number | null) => categories.find((c) => c.id === id)?.name ?? null;

  function addQuick(cents: number) {
    const current = parseAmount(draft.amount) ?? 0;
    update({ amount: centsToAmountInput(current + cents) });
    navigator.vibrate?.(8);
  }

  function pickRecent(recent: RecentMerchant) {
    const method = methods.find((m) => m.id === recent.lastMethodId);
    const category = categories.find((c) => c.id === recent.lastCategoryId);
    // Llena la nota y precarga metodo y categoria del ultimo uso; no cambia el monto ni avanza
    update({
      note: recent.label,
      merchantKey: recent.key,
      methodId: method ? method.id : draft.methodId,
      methodFromRecent: !!method,
      categoryId: category ? category.id : draft.categoryId,
    });
  }

  return (
    <>
      <AmountHero
        size="lg"
        tint="indigo"
        label="¿Cuánto gastaste?"
        value={draft.amount}
        onChange={(amount) => update({ amount })}
        onEnter={onNext}
      >
        <div className="mt-1.5 flex flex-wrap justify-center gap-2">
          {QUICK_AMOUNTS.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => addQuick(q.cents)}
              className="text-eb-text h-[34px] rounded-[17px] px-3.5 text-[14px] font-semibold"
              style={{ background: "var(--eb-glass-strong)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}
            >
              {q.label}
            </button>
          ))}
        </div>
      </AmountHero>

      <GroupBox variant="mobile">
        <label className="flex min-h-[52px] items-center gap-3 px-4">
          <PencilIcon size={18} strokeWidth={2} className="text-eb-text-tertiary flex-none" aria-hidden="true" />
          <input
            aria-label="Nota"
            placeholder="Añadir una nota"
            value={draft.note}
            onChange={(e) => {
              const note = e.target.value;
              const recent = recents.find((r) => r.key === draft.merchantKey);
              // Si la nota ya no es la del chip, deja de contar como ese comercio
              update({ note, merchantKey: recent && recent.label === note ? draft.merchantKey : null });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onNext();
              }
            }}
            className="text-eb-text placeholder:text-eb-chevron min-w-0 flex-1 border-0 bg-transparent text-[16px] outline-none"
          />
        </label>
      </GroupBox>

      {recents.length > 0 && (
        <section className="flex flex-col gap-2">
          <FlowHeader>Recientes</FlowHeader>
          <div className="flex flex-wrap gap-2">
            {recents.map((recent) => (
              <FlowChip
                key={recent.key}
                label={recent.label}
                categoryName={categoryName(recent.categoryId)}
                onClick={() => pickRecent(recent)}
              />
            ))}
          </div>
          <p className="text-eb-text-tertiary px-4 pt-0.5 text-[13px] leading-[1.4]">
            Toca uno para usarlo como nota. Si lo pagaste igual que la vez pasada, el siguiente paso lo sugiere.
          </p>
        </section>
      )}
    </>
  );
}
