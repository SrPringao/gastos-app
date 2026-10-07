"use client";

import { useState } from "react";
import { CheckIcon, ChevronRightIcon } from "lucide-react";
import { AccountThumb, cardSurface } from "@/components/ui/eb/account-card";
import { GroupBox, Segmented, parseAmount } from "@/components/ui/eb/form-kit";
import { formatMoney } from "@/lib/utils/money";
import { FlowHeader } from "./parts";
import type { ExpenseDraft, FlowMethod, Suggestions } from "./types";

const TYPE_LABEL: Record<FlowMethod["type"], string> = {
  credit: "Crédito",
  debit: "Débito",
  cash: "Efectivo",
};

const chipFor = (id: number) => (id % 2 === 0 ? "silver" : "gold");

/** "2026-10" -> "oct" */
function shortMonth(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 15))
    .toLocaleDateString("es-MX", { month: "short", timeZone: "UTC" })
    .replace(".", "");
}

/** Paso 2: ¿Cómo pagaste? Tocar un metodo lo selecciona y avanza */
export function StepMethod({
  draft,
  suggestions,
  methods,
  onPick,
  onContinue,
  onCreateMethod,
}: {
  draft: ExpenseDraft;
  suggestions: Suggestions | null;
  methods: FlowMethod[];
  onPick: (id: number) => void;
  onContinue: () => void;
  onCreateMethod: (input: { name: string; type: FlowMethod["type"] }) => Promise<string | null>;
}) {
  const cents = parseAmount(draft.amount) ?? 0;
  const byId = new Map(methods.map((m) => [m.id, m]));
  const top = (suggestions?.topMethods ?? [])
    .filter((t) => byId.has(t.accountId))
    .map((t) => ({ ...t, method: byId.get(t.accountId)! }));
  // Preseleccionada: la del ultimo uso del comercio, o la mas usada
  const selectedId = draft.methodId ?? top[0]?.accountId ?? null;
  const usage = suggestions?.usage.methods ?? {};
  const rest = methods
    .filter((m) => !top.some((t) => t.accountId === m.id))
    .sort((a, b) => (usage[b.id] ?? 0) - (usage[a.id] ?? 0) || a.name.localeCompare(b.name, "es-MX"));
  const continueWith = draft.methodFromRecent && draft.methodId ? byId.get(draft.methodId) : undefined;

  return (
    <>
      <div className="flex items-baseline justify-center gap-2">
        <span className="text-[28px] font-bold tracking-[-0.02em]" style={{ fontFamily: "var(--eb-font-rounded)" }}>
          {formatMoney(cents)}
        </span>
        {draft.note.trim() && (
          <span className="text-eb-text-tertiary min-w-0 truncate text-[15px]">· {draft.note.trim()}</span>
        )}
      </div>

      {methods.length === 0 ? (
        <NewMethodInline onCreate={onCreateMethod} />
      ) : (
        <>
          {top.length > 0 && (
            <section className="flex flex-col gap-2">
              <FlowHeader>Más usadas</FlowHeader>
              <div className="grid grid-cols-3 gap-2.5">
                {top.map(({ method, count, monthKey }) => {
                  const selected = method.id === selectedId;
                  const surface = cardSurface(method.color, "thumb");
                  return (
                    <button
                      key={method.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onPick(method.id)}
                      className="relative flex aspect-[1.45] flex-col justify-between rounded-[14px] p-2.5 text-left text-[var(--ink)]"
                      style={{
                        ...surface,
                        boxShadow: selected
                          ? `${surface.boxShadow}, 0 0 0 2px var(--eb-sheet-bg), 0 0 0 4px #5E6BFF`
                          : surface.boxShadow,
                      }}
                    >
                      <span className="line-clamp-2 text-[12px] leading-[1.2] font-bold">{method.name}</span>
                      <span className="flex items-center justify-between text-[10px] text-[var(--ink-muted)]">
                        {count} en {shortMonth(monthKey)}
                        {selected && (
                          <span className="flex size-[18px] items-center justify-center rounded-full bg-[#5E6BFF]">
                            <CheckIcon size={10} strokeWidth={3.5} className="text-white" aria-hidden="true" />
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
              {continueWith && (
                <button
                  type="button"
                  onClick={onContinue}
                  className="text-eb-link flex items-center justify-center gap-0.5 self-center py-2 text-[15px]"
                >
                  Continuar con {continueWith.name}
                  <ChevronRightIcon size={16} strokeWidth={2.4} aria-hidden="true" />
                </button>
              )}
            </section>
          )}

          {rest.length > 0 && (
            <section className="flex flex-col gap-1.5">
              <FlowHeader>{top.length > 0 ? "Todas" : "Métodos"}</FlowHeader>
              <GroupBox variant="mobile">
                {rest.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    aria-pressed={method.id === selectedId}
                    onClick={() => onPick(method.id)}
                    className="text-eb-text flex min-h-[52px] w-full items-center gap-3 px-4 text-left"
                  >
                    <AccountThumb
                      color={method.color}
                      isCash={method.type === "cash"}
                      chip={chipFor(method.id)}
                      size="sm"
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-px">
                      <span className="truncate text-[16px]">{method.name}</span>
                      <span className="text-eb-text-tertiary text-[12px]">{TYPE_LABEL[method.type]}</span>
                    </span>
                    {method.id === selectedId ? (
                      <CheckIcon size={16} strokeWidth={2.6} className="text-eb-link flex-none" aria-hidden="true" />
                    ) : (
                      <ChevronRightIcon size={13} strokeWidth={2.6} className="text-eb-chevron flex-none" aria-hidden="true" />
                    )}
                  </button>
                ))}
              </GroupBox>
            </section>
          )}
        </>
      )}
    </>
  );
}

/** Sin metodos de pago: se crea uno aqui mismo (como el flujo anterior) */
function NewMethodInline({
  onCreate,
}: {
  onCreate: (input: { name: string; type: FlowMethod["type"] }) => Promise<string | null>;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<FlowMethod["type"]>("debit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    const failure = await onCreate({ name: name.trim(), type });
    setSaving(false);
    if (failure) setError(failure);
  }

  return (
    <section className="flex flex-col gap-1.5">
      <FlowHeader>Agrega un método de pago</FlowHeader>
      <GroupBox variant="mobile">
        <label className="flex min-h-12 items-center justify-between gap-3 px-4">
          <span className="flex-none text-[16px]">Nombre</span>
          <input
            aria-label="Nombre del método"
            placeholder="Ej: Tarjeta BBVA"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-eb-text-secondary placeholder:text-eb-chevron focus:text-eb-text min-w-0 flex-1 border-0 bg-transparent text-right text-[16px] outline-none"
          />
        </label>
        <div className="flex flex-col gap-2.5 px-4 pt-2.5 pb-3">
          <span className="text-[16px]">Tipo</span>
          <Segmented<FlowMethod["type"]>
            ariaLabel="Tipo de método"
            value={type}
            onChange={setType}
            options={[
              { value: "debit", label: "Débito" },
              { value: "credit", label: "Crédito" },
              { value: "cash", label: "Efectivo" },
            ]}
          />
        </div>
        <button
          type="button"
          disabled={saving || !name.trim()}
          onClick={submit}
          className="text-eb-link min-h-12 w-full px-4 text-[16px] font-semibold disabled:opacity-40"
        >
          {saving ? "Agregando..." : "Agregar método"}
        </button>
      </GroupBox>
      <p className="text-eb-text-tertiary px-4 pt-1 text-[13px] leading-[1.4]">
        Aún no tienes métodos de pago. Agrega uno para registrar el gasto.
      </p>
      {error && <p className="text-eb-red px-4 text-[13px]">{error}</p>}
    </section>
  );
}
