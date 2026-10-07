"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, ChevronRightIcon, CreditCardIcon } from "lucide-react";
import { EbSheet } from "@/components/ui/eb/sheet";
import { AmountHero, FormSection, GroupBox, SwitchRow, parseAmount } from "@/components/ui/eb/form-kit";
import { showToast } from "@/components/ui/eb/toast";
import { monthName } from "@/lib/utils/dates";

const DISMISS_KEY = "gastos-setup-prompt-dismissed";

type SetupReminderPromptProps = {
  hasBudget: boolean;
  hasAccount: boolean;
  monthKey: string;
};

/**
 * "Termina de configurar tu cuenta": misma hoja y piezas que el modal de
 * Presupuesto. Pide el presupuesto del mes y/o una cuenta; "Cancelar" lo
 * oculta por esta sesion.
 */
export function SetupReminderPrompt({ hasBudget, hasAccount, monthKey }: SetupReminderPromptProps) {
  const router = useRouter();
  const switchId = useId();
  const [open, setOpen] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState("");
  const [useAsDefault, setUseAsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedBudget, setSavedBudget] = useState(hasBudget);

  const needsSetup = !savedBudget || !hasAccount;
  const month = monthName(monthKey).toLocaleLowerCase("es-MX");
  const cents = parseAmount(budgetAmount);
  const valid = cents !== null && cents > 0;

  useEffect(() => {
    if (!needsSetup) return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      // Sin sessionStorage (modo privado): se muestra igual
    }
    const timer = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(timer);
  }, [needsSetup]);

  function handleDismiss() {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Sin sessionStorage: solo se cierra
    }
    setOpen(false);
  }

  async function handleSaveBudget() {
    if (!valid || cents === null) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/monthly-budget", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: monthKey, amount: cents / 100, ...(useAsDefault && { useAsDefault: true }) }),
      });
      if (!res.ok) {
        setError("No se pudo guardar el presupuesto");
        return;
      }
      setSavedBudget(true);
      showToast({ message: "Presupuesto guardado" });
      if (hasAccount) setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function handleGoToAccounts() {
    setOpen(false);
    router.push("/cuentas");
  }

  return (
    <EbSheet
      open={open}
      onClose={handleDismiss}
      title="Configura tu cuenta"
      ariaLabel="Termina de configurar tu cuenta"
      action={
        savedBudget
          ? undefined
          : { label: saving ? "Guardando..." : "Guardar", onClick: handleSaveBudget, disabled: !valid || saving }
      }
    >
      <p className="text-eb-text-tertiary px-4 text-center text-[13px] leading-[1.4]">
        La app funciona mejor con un presupuesto mensual y al menos una cuenta o tarjeta registrada.
      </p>

      {savedBudget ? (
        <GroupBox variant="mobile">
          <div className="flex min-h-[52px] items-center gap-3 px-4">
            <span
              aria-hidden="true"
              className="flex size-[30px] flex-none items-center justify-center rounded-full text-white"
              style={{ background: "#30D158" }}
            >
              <CheckIcon size={16} strokeWidth={2.6} />
            </span>
            <span className="text-[16px]">Presupuesto de {month} guardado</span>
          </div>
        </GroupBox>
      ) : (
        <>
          <AmountHero
            label={`¿Cuánto planeas gastar en ${month}?`}
            ariaLabel="Presupuesto mensual"
            value={budgetAmount}
            onChange={setBudgetAmount}
            onEnter={handleSaveBudget}
            tint="indigo"
          />
          <GroupBox variant="mobile">
            <SwitchRow
              id={switchId}
              label="Usar para los siguientes meses"
              subtitle="Puedes cambiarlo cuando quieras"
              checked={useAsDefault}
              onChange={setUseAsDefault}
            />
          </GroupBox>
        </>
      )}

      {!hasAccount && (
        <FormSection
          title="Cuentas"
          variant="mobile"
          footer="Registra la tarjeta o cuenta con la que pagas para empezar a capturar gastos."
        >
          <GroupBox variant="mobile">
            <div className="flex min-h-[52px] items-center gap-3 px-4">
              <span
                aria-hidden="true"
                className="text-eb-text-tertiary flex size-[30px] flex-none items-center justify-center rounded-[8px]"
                style={{ background: "var(--eb-neutral-tile)" }}
              >
                <CreditCardIcon size={16} strokeWidth={2} />
              </span>
              <span className="text-eb-text-secondary text-[15px]">
                Aún no tienes ninguna cuenta o tarjeta registrada.
              </span>
            </div>
            <button
              type="button"
              onClick={handleGoToAccounts}
              className="text-eb-link flex min-h-12 w-full items-center justify-between px-4 text-left text-[16px]"
            >
              Agregar cuenta o tarjeta
              <ChevronRightIcon size={14} strokeWidth={2.4} className="text-eb-chevron" aria-hidden="true" />
            </button>
          </GroupBox>
        </FormSection>
      )}

      {error && <p className="text-eb-red px-4 text-center text-[14px]">{error}</p>}
    </EbSheet>
  );
}
