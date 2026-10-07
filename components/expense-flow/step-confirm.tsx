"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, ClockIcon, Loader2Icon } from "lucide-react";
import { AccountThumb } from "@/components/ui/eb/account-card";
import { EbSheet } from "@/components/ui/eb/sheet";
import { FormSection, GroupBox, Segmented, parseAmount } from "@/components/ui/eb/form-kit";
import { formatMoney } from "@/lib/utils/money";
import { FlowChip, FlowHeader, FlowTile } from "./parts";
import type { BudgetImpact } from "@/lib/expense-suggestions";
import type { ExpenseDraft, FlowCategory, FlowMethod, Suggestions } from "./types";

/** Categorias visibles en la fila antes de "Más" */
const VISIBLE_CATEGORIES = 8;

const chipFor = (id: number) => (id % 2 === 0 ? "silver" : "gold");

/** "Martes 6 de octubre de 2026" (Intl dateStyle full, sin la coma) */
export function fullDateLabel(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const text = new Intl.DateTimeFormat("es-MX", { dateStyle: "full", timeZone: "UTC" })
    .format(new Date(Date.UTC(y, m - 1, d)))
    .replace(",", "");
  return text.charAt(0).toLocaleUpperCase("es-MX") + text.slice(1);
}

/** Paso 3: confirmar, fecha, categoria e impacto en el presupuesto */
export function StepConfirm({
  draft,
  update,
  methods,
  categories,
  suggestions,
  today,
  yesterday,
  onEditAmount,
  onEditMethod,
  onSave,
  saving,
  error,
}: {
  draft: ExpenseDraft;
  update: (next: Partial<ExpenseDraft>) => void;
  methods: FlowMethod[];
  categories: FlowCategory[];
  suggestions: Suggestions | null;
  today: string;
  yesterday: string;
  onEditAmount: () => void;
  onEditMethod: () => void;
  onSave: () => void;
  saving: boolean;
  error: string | null;
}) {
  const cents = parseAmount(draft.amount) ?? 0;
  const method = methods.find((m) => m.id === draft.methodId) ?? null;
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [query, setQuery] = useState("");
  const [impact, setImpact] = useState<{ key: string; value: BudgetImpact | null } | null>(null);

  // Impacto en el presupuesto del mes de la fecha elegida
  const impactKey = `${draft.date}:${cents}`;
  useEffect(() => {
    if (cents <= 0) return;
    const controller = new AbortController();
    fetch(`/api/expenses/budget-impact?date=${draft.date}&amount=${cents}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setImpact({ key: impactKey, value: data?.impact ?? null }))
      .catch(() => {});
    return () => controller.abort();
  }, [impactKey, draft.date, cents]);
  const currentImpact = impact?.key === impactKey ? impact.value : null;

  const usage = suggestions?.usage.categories ?? {};
  const sortedCategories = [...categories].sort(
    (a, b) => (usage[b.id] ?? 0) - (usage[a.id] ?? 0) || a.name.localeCompare(b.name, "es-MX")
  );
  let visibleCategories = sortedCategories.slice(0, VISIBLE_CATEGORIES);
  const selectedCategory = sortedCategories.find((c) => c.id === draft.categoryId);
  if (selectedCategory && !visibleCategories.includes(selectedCategory)) {
    visibleCategories = [selectedCategory, ...visibleCategories.slice(0, VISIBLE_CATEGORIES - 1)];
  }
  const filteredCategories = query.trim()
    ? sortedCategories.filter((c) => c.name.toLocaleLowerCase("es-MX").includes(query.trim().toLocaleLowerCase("es-MX")))
    : sortedCategories;

  function pickDateMode(mode: ExpenseDraft["dateMode"]) {
    if (mode === "today") update({ dateMode: mode, date: today });
    else if (mode === "yesterday") update({ dateMode: mode, date: yesterday });
    // "Otra fecha" la maneja el input nativo que esta encima del segmento
  }

  const whole = Math.trunc(cents / 100).toLocaleString("en-US");
  const decimals = String(cents % 100).padStart(2, "0");

  return (
    <>
      <section
        className="overflow-hidden rounded-[22px]"
        style={{
          background: "radial-gradient(100% 120% at 50% 0%, rgba(94,107,255,0.14), transparent 65%), var(--eb-group-solid)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        <button
          type="button"
          onClick={onEditAmount}
          aria-label={`Editar monto ${formatMoney(cents)}${draft.note.trim() ? ` y nota ${draft.note.trim()}` : ""}`}
          className="flex w-full flex-col items-center gap-1 px-4 pt-5 pb-4"
        >
          <span className="flex items-baseline gap-px" style={{ fontFamily: "var(--eb-font-rounded)" }}>
            <span className="text-eb-text-strong text-[44px] font-bold tracking-[-0.03em]">${whole}</span>
            <span className="text-eb-text-tertiary text-[22px] font-semibold">.{decimals}</span>
          </span>
          {draft.note.trim() && <span className="text-eb-text-muted max-w-full truncate text-[15px]">{draft.note.trim()}</span>}
        </button>
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderTop: "1px dashed rgba(255,255,255,0.12)" }}>
          {method && (
            <AccountThumb color={method.color} isCash={method.type === "cash"} chip={chipFor(method.id)} size="sm" />
          )}
          <span className="min-w-0 flex-1 truncate text-[15px]">{method?.name ?? "Sin método"}</span>
          <button type="button" onClick={onEditMethod} className="text-eb-link py-2 pl-2.5 text-[15px]">
            Cambiar
          </button>
        </div>
      </section>

      <FormSection title="Fecha" variant="mobile">
        <div
          className="flex flex-col gap-2.5 rounded-[14px] px-4 py-3"
          style={{ background: "var(--eb-group-solid)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}
        >
          <div className="relative">
            <Segmented<ExpenseDraft["dateMode"]>
              ariaLabel="Fecha"
              value={draft.dateMode}
              onChange={pickDateMode}
              options={[
                { value: "today", label: "Hoy" },
                { value: "yesterday", label: "Ayer" },
                { value: "other", label: "Otra fecha" },
              ]}
            />
            {/* Input nativo transparente sobre "Otra fecha": el toque abre el selector
                del sistema (en iPhone no se puede abrir de forma confiable desde codigo) */}
            <input
              ref={dateInputRef}
              type="date"
              aria-label="Otra fecha"
              max={today}
              onClick={(e) => {
                try {
                  e.currentTarget.showPicker();
                } catch {
                  // Sin showPicker: el navegador abre su selector con el toque
                }
              }}
            value={draft.date}
            onChange={(e) => {
              const value = e.target.value;
              // Sin fechas futuras
              if (!value || value > today) return;
              update({
                date: value,
                dateMode: value === today ? "today" : value === yesterday ? "yesterday" : "other",
              });
            }}
              className="absolute inset-y-0 right-0 w-1/3 cursor-pointer opacity-0"
            />
          </div>
          <p className="text-eb-text-tertiary text-center text-[13px]">{fullDateLabel(draft.date)}</p>
        </div>
      </FormSection>

      {categories.length > 0 && (
        <section className="flex flex-col gap-2">
          <FlowHeader trailing="Opcional">Categoría</FlowHeader>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-hscroll="">
            {visibleCategories.map((category) => (
              <FlowChip
                key={category.id}
                pressable
                label={category.name}
                categoryName={category.name}
                selected={category.id === draft.categoryId}
                onClick={() => update({ categoryId: category.id === draft.categoryId ? null : category.id })}
              />
            ))}
            <button
              type="button"
              onClick={() => setShowAllCategories(true)}
              className="text-eb-link h-9 flex-none rounded-[18px] px-3.5 text-[14px]"
              style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)" }}
            >
              Más
            </button>
          </div>
        </section>
      )}

      {currentImpact && (
        <div
          className="text-eb-text-muted flex items-center gap-2.5 rounded-[14px] px-3.5 py-3 text-[13px]"
          style={{ background: "rgba(0,0,0,0.3)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)" }}
        >
          <ClockIcon
            size={16}
            strokeWidth={2}
            className="flex-none"
            style={{ color: currentImpact.overBy ? "var(--eb-orange)" : "#8C95FF" }}
            aria-hidden="true"
          />
          {currentImpact.overBy ? (
            <span className="text-eb-orange">
              Con este gasto te pasas por <b className="font-semibold">{formatMoney(currentImpact.overBy, { cents: false })}</b>
            </span>
          ) : !currentImpact.isCurrentMonth ? (
            <span>
              Presupuesto de {currentImpact.monthLabel.toLocaleLowerCase("es-MX")}: quedan{" "}
              <b className="text-eb-text font-semibold">{formatMoney(currentImpact.remaining, { cents: false })}</b>
            </span>
          ) : (
            <span>
              Te quedarán <b className="text-eb-text font-semibold">{formatMoney(currentImpact.remaining, { cents: false })}</b>{" "}
              del presupuesto
              {currentImpact.perDay !== null && <> · ≈ {formatMoney(currentImpact.perDay, { cents: false })} al día</>}
            </span>
          )}
        </div>
      )}

      {error && <p className="text-eb-red px-4 text-center text-[14px]">{error}</p>}

      <button
        type="button"
        onClick={onSave}
        disabled={saving || !method || cents <= 0}
        className="flex h-[52px] w-full flex-none items-center justify-center gap-2 rounded-[16px] text-[17px] font-semibold text-white disabled:opacity-60"
        style={{
          background: "linear-gradient(180deg, #929AFF, #5E6BFF)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 10px 24px -10px rgba(94,107,255,0.6)",
        }}
      >
        {saving && <Loader2Icon size={18} className="animate-spin" aria-hidden="true" />}
        {saving ? "Guardando..." : "Guardar gasto"}
      </button>

      <EbSheet
        open={showAllCategories}
        onClose={() => {
          setShowAllCategories(false);
          setQuery("");
        }}
        title="Categorías"
        nested
      >
        <input
          data-autofocus=""
          type="search"
          aria-label="Buscar categoría"
          placeholder="Buscar"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="text-eb-text placeholder:text-eb-text-tertiary h-9 rounded-[10px] border-0 px-3 text-[16px] outline-none"
          style={{ background: "var(--eb-ios-fill)" }}
        />
        <GroupBox variant="mobile">
          {!query.trim() && (
            <CategoryOption
              label="Sin categoría"
              selected={draft.categoryId === null}
              onSelect={() => {
                update({ categoryId: null });
                setShowAllCategories(false);
              }}
            />
          )}
          {filteredCategories.length === 0 ? (
            <p className="text-eb-text-tertiary px-4 py-3.5 text-[15px]">Ninguna categoría con ese nombre.</p>
          ) : (
            filteredCategories.map((category) => (
              <CategoryOption
                key={category.id}
                label={category.name}
                categoryName={category.name}
                selected={category.id === draft.categoryId}
                onSelect={() => {
                  update({ categoryId: category.id });
                  setShowAllCategories(false);
                  setQuery("");
                }}
              />
            ))
          )}
        </GroupBox>
      </EbSheet>
    </>
  );
}

function CategoryOption({
  label,
  categoryName,
  selected,
  onSelect,
}: {
  label: string;
  categoryName?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className="text-eb-text flex min-h-[52px] w-full items-center gap-3 px-4 text-left"
    >
      {categoryName !== undefined && <FlowTile categoryName={categoryName} label={label} />}
      <span className="min-w-0 flex-1 truncate text-[16px]">{label}</span>
      {selected && <CheckIcon size={18} strokeWidth={2.6} className="text-eb-link flex-none" aria-hidden="true" />}
    </button>
  );
}
