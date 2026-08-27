"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WalletIcon, CreditCardIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DISMISS_KEY = "gastos-setup-prompt-dismissed";

type SetupReminderPromptProps = {
  hasBudget: boolean;
  hasAccount: boolean;
  monthKey: string;
};

export function SetupReminderPrompt({
  hasBudget,
  hasAccount,
  monthKey,
}: SetupReminderPromptProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedBudget, setSavedBudget] = useState(hasBudget);

  const needsSetup = !savedBudget || !hasAccount;

  useEffect(() => {
    if (!needsSetup) return;
    if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    const timer = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(timer);
  }, [needsSetup]);

  function handleDismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
  }

  async function handleSaveBudget() {
    const parsed = Number(budgetAmount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Ingresa un monto valido");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/monthly-budget", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: monthKey, amount: parsed }),
      });
      if (!res.ok) {
        setError("No se pudo guardar el presupuesto");
        return;
      }
      setSavedBudget(true);
      if (hasAccount) {
        setOpen(false);
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function handleGoToAccounts() {
    setOpen(false);
    router.push("/cuentas");
  }

  if (!needsSetup) return null;

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : handleDismiss())}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2">
            <WalletIcon className="size-5" />
            Termina de configurar tu cuenta
          </DialogTitle>
          <DialogDescription>
            La app funciona mejor con un presupuesto mensual y al menos una
            cuenta o tarjeta registrada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!savedBudget && (
            <div className="space-y-1.5">
              <Label htmlFor="setup-budget" className="text-sm font-medium">
                Presupuesto mensual
              </Label>
              <Input
                id="setup-budget"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                autoFocus
              />
            </div>
          )}

          {!hasAccount && (
            <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
              <CreditCardIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
              <p className="text-muted-foreground text-xs">
                Aun no tienes ninguna cuenta o tarjeta registrada.
              </p>
            </div>
          )}

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {!savedBudget && (
            <Button
              type="button"
              className="w-full"
              onClick={handleSaveBudget}
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar presupuesto"}
            </Button>
          )}
          {!hasAccount && (
            <Button
              type="button"
              variant={savedBudget ? "default" : "outline"}
              className="w-full"
              onClick={handleGoToAccounts}
            >
              Agregar cuenta o tarjeta
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={handleDismiss}
            disabled={saving}
          >
            Ahora no
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
