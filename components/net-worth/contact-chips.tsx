"use client";

import { useState } from "react";
import { CheckIcon, PlusIcon } from "lucide-react";
import { EbSheet } from "@/components/ui/eb/sheet";
import { FormSection, GroupBox } from "@/components/ui/eb/form-kit";
import { contactNameKey } from "@/lib/contacts";
import { initialOf } from "@/lib/dashboard-metrics";
import { formatMoney } from "@/lib/utils/money";
import { cn } from "@/lib/utils";
import type { Contact } from "@/lib/db/schema";

/** Maximo de chips visibles; con mas aparece "Ver todas" */
const MAX_CHIPS = 8;

export type ContactOption = {
  id: number;
  name: string;
  /** Lo que ya te debe (centavos), sin contar el elemento que se edita */
  balance: number;
  /** Ultimo uso (ms) para ordenar */
  lastUsed: number;
};

function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-[26px] flex-none items-center justify-center rounded-full text-[12px] font-semibold text-white"
      style={{ background: "linear-gradient(180deg, #6E6E75, #48484E)" }}
    >
      {initialOf(name)}
    </span>
  );
}

function Chip({ option, selected, onToggle }: { option: { name: string }; selected: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        "flex h-[34px] max-w-full items-center gap-2 rounded-[17px] pr-3 pl-1 text-[14px]",
        selected ? "text-eb-text-strong font-medium" : "text-eb-text-muted"
      )}
      style={
        selected
          ? { background: "rgba(94,107,255,0.22)", boxShadow: "inset 0 0 0 1px rgba(94,107,255,0.5)" }
          : { background: "var(--eb-glass-bg)" }
      }
    >
      <Avatar name={option.name} />
      <span className="truncate">{option.name}</span>
    </button>
  );
}

/** Personas con saldo pendiente primero; luego por uso mas reciente */
export function sortContactOptions(options: ContactOption[]): ContactOption[] {
  return [...options].sort(
    (a, b) => Number(b.balance > 0) - Number(a.balance > 0) || b.lastUsed - a.lastUsed || a.name.localeCompare(b.name)
  );
}

/**
 * Grupo "¿Quién te debe?" (seccion 4.2): chips de personas guardadas,
 * "Ver todas" con buscador y "+ Otra persona" con sugerencias para no
 * duplicar. La seleccion es opcional (tocar el chip elegido lo quita).
 */
export function ContactChips({
  options,
  value,
  onChange,
  onCreated,
  amountCents,
}: {
  options: ContactOption[];
  value: number | null;
  onChange: (id: number | null) => void;
  /** Persona recien creada: se agrega a la lista del padre */
  onCreated: (contact: Contact) => void;
  /** Monto que se esta capturando (para el pie "Se agrupa con...") */
  amountCents: number;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState("");

  const sorted = sortContactOptions(options);
  let visible = sorted.slice(0, MAX_CHIPS);
  // La persona elegida siempre queda a la vista
  const selectedOption = sorted.find((o) => o.id === value);
  if (selectedOption && !visible.includes(selectedOption)) {
    visible = [...visible.slice(0, MAX_CHIPS - 1), selectedOption];
  }

  const draftKey = contactNameKey(draft);
  const exact = draftKey ? options.find((o) => contactNameKey(o.name) === draftKey) : undefined;
  const suggestion =
    exact ?? (draftKey ? options.find((o) => contactNameKey(o.name).startsWith(draftKey)) : undefined);

  function toggle(id: number) {
    onChange(value === id ? null : id);
  }

  function closeAdding() {
    setAdding(false);
    setDraft("");
    setError(null);
  }

  async function add() {
    const name = draft.trim();
    if (!name) return;
    // Mismo nombre normalizado: se elige la que ya existe
    if (exact) {
      onChange(exact.id);
      closeAdding();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.contact) {
        setError(data?.error || "No se pudo agregar");
        return;
      }
      onCreated(data.contact as Contact);
      onChange((data.contact as Contact).id);
      closeAdding();
    } finally {
      setSaving(false);
    }
  }

  const footer =
    selectedOption && selectedOption.balance > 0
      ? `Se agrupa con lo que ya te debe ${selectedOption.name} (${formatMoney(selectedOption.balance)} → ${formatMoney(
          selectedOption.balance + amountCents
        )}).`
      : undefined;

  const queryKey = contactNameKey(query);
  const filtered = queryKey ? sorted.filter((o) => contactNameKey(o.name).includes(queryKey)) : sorted;

  return (
    <FormSection title="¿Quién te debe?" variant="mobile" footer={footer}>
      <div
        className="flex flex-wrap gap-2 rounded-[14px] px-4 py-3"
        style={{ background: "var(--eb-group-solid)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}
      >
        {visible.map((option) => (
          <Chip key={option.id} option={option} selected={option.id === value} onToggle={() => toggle(option.id)} />
        ))}
        {sorted.length > MAX_CHIPS && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-eb-link h-[34px] rounded-[17px] px-3 text-[14px]"
            style={{ background: "var(--eb-glass-bg)" }}
          >
            Ver todas
          </button>
        )}

        {adding ? (
          <div className="flex w-full flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                autoFocus
                aria-label="Nombre"
                placeholder="Nombre"
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    add();
                  }
                  if (e.key === "Escape") {
                    e.stopPropagation();
                    closeAdding();
                  }
                }}
                className="text-eb-text placeholder:text-eb-chevron h-[34px] min-w-0 flex-1 rounded-[17px] border-0 px-3.5 text-[16px] outline-none focus:shadow-[inset_0_0_0_1px_rgba(94,107,255,0.6)]"
                style={{ background: "var(--eb-ios-fill)" }}
              />
              <button
                type="button"
                disabled={saving || !draft.trim()}
                onClick={add}
                className="text-eb-link h-[34px] px-1.5 text-[15px] font-semibold disabled:opacity-40"
              >
                Agregar
              </button>
              <button type="button" onClick={closeAdding} className="text-eb-text-tertiary h-[34px] px-1 text-[15px]">
                Cancelar
              </button>
            </div>
            {suggestion && suggestion.id !== value && (
              <button
                type="button"
                onClick={() => {
                  onChange(suggestion.id);
                  closeAdding();
                }}
                className="text-eb-text-muted self-start text-left text-[13px]"
              >
                ¿Te refieres a <b className="text-eb-text font-semibold">{suggestion.name}</b>?
              </button>
            )}
            {error && <p className="text-eb-red text-[13px]">{error}</p>}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-eb-link flex h-[34px] items-center gap-1.5 rounded-[17px] px-3 text-[14px]"
            style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)" }}
          >
            <PlusIcon size={13} strokeWidth={2.6} aria-hidden="true" />
            Otra persona
          </button>
        )}
      </div>

      <EbSheet
        open={showAll}
        onClose={() => {
          setShowAll(false);
          setQuery("");
        }}
        title="Personas"
        nested
      >
        <input
          data-autofocus=""
          type="search"
          aria-label="Buscar persona"
          placeholder="Buscar"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="text-eb-text placeholder:text-eb-text-tertiary h-9 rounded-[10px] border-0 px-3 text-[16px] outline-none"
          style={{ background: "var(--eb-ios-fill)" }}
        />
        <GroupBox variant="mobile">
          {filtered.length === 0 ? (
            <p className="text-eb-text-tertiary px-4 py-3.5 text-[15px]">Nadie con ese nombre.</p>
          ) : (
            filtered.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={option.id === value}
                onClick={() => {
                  onChange(option.id);
                  setShowAll(false);
                  setQuery("");
                }}
                className="text-eb-text flex min-h-[52px] w-full items-center gap-3 px-4 text-left"
              >
                <Avatar name={option.name} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[16px]">{option.name}</span>
                  {option.balance > 0 && (
                    <span className="text-eb-text-tertiary text-[12px]">Te debe {formatMoney(option.balance)}</span>
                  )}
                </span>
                {option.id === value && (
                  <CheckIcon size={18} strokeWidth={2.6} className="text-eb-link flex-none" aria-hidden="true" />
                )}
              </button>
            ))
          )}
        </GroupBox>
      </EbSheet>
    </FormSection>
  );
}
