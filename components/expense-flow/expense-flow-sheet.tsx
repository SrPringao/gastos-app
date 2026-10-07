"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EbSheet } from "@/components/ui/eb/sheet";
import { parseAmount } from "@/components/ui/eb/form-kit";
import { showToast } from "@/components/ui/eb/toast";
import { formatMoney } from "@/lib/utils/money";
import { todayDateString } from "@/lib/utils/dates";
import { StepIndicator } from "./parts";
import { StepAmount } from "./step-amount";
import { StepMethod } from "./step-method";
import { StepConfirm } from "./step-confirm";
import type { ExpenseDraft, FlowCategory, FlowMethod, Suggestions } from "./types";
import type { Account, Category } from "@/lib/db/schema";

type Step = 1 | 2 | 3;

const TITLES: Record<Step, string> = { 1: "Nuevo gasto", 2: "¿Cómo pagaste?", 3: "Confirmar" };
/** Padding del contenido por paso (sin el inferior) y padding inferior */
const PADDING: Record<Step, { top: number; bottom: number; gap: string }> = {
  1: { top: 18, bottom: 40, gap: "gap-5" },
  2: { top: 16, bottom: 40, gap: "gap-[18px]" },
  3: { top: 16, bottom: 30, gap: "gap-[18px]" },
};
/** Pausa para que se vea la seleccion antes de avanzar al paso 3 */
const AUTO_ADVANCE_MS = 150;
/** Swipe a la derecha que equivale a "Atras" */
const SWIPE_BACK_PX = 70;

function minusDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - days)).toISOString().slice(0, 10);
}

/**
 * Flujo "Nuevo gasto" en una sola hoja con 3 pasos
 * (expensebro-nuevo-gasto-prompt.md). El estado se conserva al ir y volver.
 * Montalo con `key` distinto por apertura para empezar en blanco.
 */
export function ExpenseFlowSheet({
  open,
  onClose,
  accounts: accountsProp,
  categories: categoriesProp,
}: {
  open: boolean;
  onClose: () => void;
  /** Sin props (ej. desde la tab bar) se cargan al abrir */
  accounts?: Account[];
  categories?: Category[];
}) {
  const router = useRouter();
  const today = todayDateString();
  const yesterday = minusDays(today, 1);
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [draft, setDraft] = useState<ExpenseDraft>({
    amount: "",
    note: "",
    merchantKey: null,
    methodId: null,
    date: today,
    dateMode: "today",
    categoryId: null,
    methodFromRecent: false,
  });
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [fetchedAccounts, setFetchedAccounts] = useState<Account[] | null>(null);
  const [fetchedCategories, setFetchedCategories] = useState<Category[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stepRef = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const advanceTimer = useRef<number | null>(null);

  // Datos: sugerencias siempre; metodos y categorias solo si no llegaron por props
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/expenses/suggestions")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => !cancelled && data && setSuggestions(data))
      .catch(() => {});
    if (accountsProp === undefined) {
      fetch("/api/accounts")
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => !cancelled && setFetchedAccounts(data))
        .catch(() => {});
    }
    if (categoriesProp === undefined) {
      fetch("/api/categories")
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => !cancelled && setFetchedCategories(data))
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [open, accountsProp, categoriesProp]);

  useEffect(() => () => {
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
  }, []);

  const accounts = accountsProp ?? fetchedAccounts ?? [];
  const methods: FlowMethod[] = accounts
    .filter((a) => !a.archivedAt)
    .map((a) => ({ id: a.id, name: a.name, type: a.type, color: a.color }));
  const categories: FlowCategory[] = (categoriesProp ?? fetchedCategories ?? []).map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const cents = parseAmount(draft.amount) ?? 0;
  const canAdvance = cents > 0;

  function update(next: Partial<ExpenseDraft>) {
    setDraft((d) => ({ ...d, ...next }));
  }

  function goTo(next: Step) {
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  function back() {
    if (step > 1) goTo((step - 1) as Step);
  }

  function next() {
    if (step === 1 && canAdvance) goTo(2);
  }

  // Al cambiar de paso el contenido entra deslizandose 24px con fade (220ms).
  // El primer paso no se anima: ya entra con la hoja.
  const firstRender = useRef(true);
  useLayoutEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const el = stepRef.current;
    if (!el || typeof el.animate !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.animate(
      [
        { opacity: 0, transform: `translateX(${direction * 24}px)` },
        { opacity: 1, transform: "translateX(0)" },
      ],
      { duration: 220, easing: "cubic-bezier(.2,.8,.2,1)" }
    );
    el.parentElement?.scrollTo({ top: 0 });
  }, [step, direction]);

  function pickMethod(id: number) {
    update({ methodId: id });
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => {
      setDirection(1);
      setStep(3);
    }, AUTO_ADVANCE_MS);
  }

  async function createMethod(input: { name: string; type: FlowMethod["type"] }): Promise<string | null> {
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return data?.error || "Error al guardar";
    const list = await fetch("/api/accounts").then((r) => (r.ok ? r.json() : null));
    if (list) setFetchedAccounts(list);
    router.refresh();
    return null;
  }

  async function save() {
    if (saving || cents <= 0 || !draft.methodId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: cents / 100,
          accountId: draft.methodId,
          categoryId: draft.categoryId,
          date: draft.date,
          description: draft.note.trim() || null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Error al guardar");
        return;
      }
      const id: number | undefined = data?.id;
      onClose();
      router.refresh();
      showToast({
        message: `Gasto de ${formatMoney(cents)} guardado`,
        duration: 5000,
        ...(id && {
          action: {
            label: "Deshacer",
            onClick: async () => {
              const undo = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
              router.refresh();
              showToast({ message: undo.ok ? "Gasto eliminado" : "No se pudo deshacer" });
            },
          },
        }),
      });
    } finally {
      setSaving(false);
    }
  }

  // Swipe a la derecha = "Atras" (movil), salvo en filas con scroll horizontal
  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "mouse" || (e.target as HTMLElement).closest("[data-hscroll]")) return;
    swipe.current = { x: e.clientX, y: e.clientY };
  }
  function onPointerUp(e: React.PointerEvent) {
    const start = swipe.current;
    swipe.current = null;
    if (!start || step === 1) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (dx > SWIPE_BACK_PX && Math.abs(dy) < Math.abs(dx) / 2) back();
  }

  const padding = PADDING[step];

  return (
    <EbSheet
      open={open}
      onClose={onClose}
      title={TITLES[step]}
      ariaLabel={`Nuevo gasto, paso ${step} de 3`}
      dirty={cents > 0}
      discardLabel="Descartar gasto"
      leftAction={step > 1 ? { label: "Atrás", chevron: true, onClick: back } : undefined}
      action={step === 1 ? { label: "Siguiente", onClick: next, disabled: !canAdvance } : undefined}
      headerExtra={<StepIndicator step={step} />}
      contentPadding={{ top: padding.top, x: 16 }}
      bottomPadding={padding.bottom}
      contentClassName="gap-0"
      desktopHeight="min(760px, 90vh)"
    >
      <div
        ref={stepRef}
        className={`flex flex-col ${padding.gap}`}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipe.current = null)}
      >
        {step === 1 && (
          <StepAmount
            draft={draft}
            update={update}
            suggestions={suggestions}
            methods={methods}
            categories={categories}
            onNext={next}
          />
        )}
        {step === 2 && (
          <StepMethod
            draft={draft}
            suggestions={suggestions}
            methods={methods}
            onPick={pickMethod}
            onContinue={() => goTo(3)}
            onCreateMethod={createMethod}
          />
        )}
        {step === 3 && (
          <StepConfirm
            draft={draft}
            update={update}
            methods={methods}
            categories={categories}
            suggestions={suggestions}
            today={today}
            yesterday={yesterday}
            onEditAmount={() => goTo(1)}
            onEditMethod={() => goTo(2)}
            onSave={save}
            saving={saving}
            error={error}
          />
        )}
      </div>
    </EbSheet>
  );
}
