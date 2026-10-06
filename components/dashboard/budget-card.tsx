"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClockIcon } from "lucide-react";
import { EbCard } from "@/components/ui/eb/card";
import { Money } from "@/components/ui/eb/money";
import { ProgressRing } from "@/components/ui/eb/progress-ring";
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
import { formatMoney } from "@/lib/utils/money";
import type { BudgetSummary } from "@/lib/dashboard-metrics";
import { cn } from "@/lib/utils";

function EditBudgetDialog({
  open,
  onOpenChange,
  monthKey,
  monthLabel,
  currentCents,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  monthKey: string;
  monthLabel: string;
  currentCents: number | null;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(currentCents ? (currentCents / 100).toFixed(2) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const parsed = Number(draft);
    if (!Number.isFinite(parsed) || parsed < 0) {
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
        const data = await res.json().catch(() => null);
        setError(data?.error || "Error al guardar");
        return;
      }
      onOpenChange(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(currentCents ? (currentCents / 100).toFixed(2) : "");
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader className="text-left">
          <DialogTitle>Presupuesto de {monthLabel.toLocaleLowerCase("es-MX")}</DialogTitle>
          <DialogDescription>Cuanto planeas gastar en total este mes.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Label htmlFor="budget-amount">Monto</Label>
          <Input
            id="budget-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
          />
          {error && <p className="text-destructive text-sm">{error}</p>}
          <DialogFooter className="pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Texto de la pastilla inferior segun el estado del presupuesto (seccion 5.2) */
function BudgetHint({ summary }: { summary: Exclude<BudgetSummary, { state: "unset" }> }) {
  if (summary.state === "current" && summary.perDay !== null && summary.daysLeft !== null) {
    return (
      <span>
        <b className="text-eb-text font-semibold">≈ {formatMoney(summary.perDay, { cents: false })} al día</b>{" "}
        · {summary.daysLeft} {summary.daysLeft === 1 ? "día" : "días"}
      </span>
    );
  }
  if (summary.remaining < 0) {
    return (
      <span className="text-eb-orange font-semibold">
        Te pasaste por {formatMoney(-summary.remaining, { cents: false })}
      </span>
    );
  }
  if (summary.state === "past") {
    return (
      <span>
        Terminaste con{" "}
        <b className="text-eb-text font-semibold">{formatMoney(summary.remaining, { cents: false })}</b> de sobra
      </span>
    );
  }
  return <span>Mes por empezar</span>;
}

type BudgetCardProps = {
  summary: BudgetSummary;
  monthKey: string;
  monthLabel: string;
  variant?: "desktop" | "mobile";
  className?: string;
};

export function BudgetCard({ summary, monthKey, monthLabel, variant = "desktop", className }: BudgetCardProps) {
  const [editing, setEditing] = useState(false);
  const isSet = summary.state !== "unset";
  const ratio = isSet ? summary.usedRatio : 0;
  const over = isSet && summary.remaining < 0;
  const ringLabel = isSet ? `${summary.usedPercent}%` : "—";
  const ringAria = isSet
    ? `${summary.usedPercent} % del presupuesto usado`
    : "Sin presupuesto definido";

  const dialog = (
    <EditBudgetDialog
      open={editing}
      onOpenChange={setEditing}
      monthKey={monthKey}
      monthLabel={monthLabel}
      currentCents={isSet ? summary.budget : null}
    />
  );

  if (variant === "mobile") {
    return (
      <>
        <EbCard
          size="mobile"
          as="div"
          className={cn("relative flex aspect-square flex-col justify-between p-4", className)}
        >
          <div className="flex items-start justify-between">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-eb-text-secondary text-[13px] font-semibold after:absolute after:inset-0 after:rounded-[24px]"
              aria-label={isSet ? "Presupuesto, editar" : "Definir presupuesto"}
            >
              Presupuesto
            </button>
            <ProgressRing ratio={ratio} size="mobile" label={ringLabel} ariaLabel={ringAria} />
          </div>
          {isSet ? (
            <div className="flex flex-col gap-0.5">
              <div className="text-eb-text-tertiary text-[12px]">{over ? "Te pasaste por" : "Te quedan"}</div>
              <Money
                value={Math.abs(summary.remaining)}
                size="md"
                className={cn(over && "text-eb-orange")}
              />
              <div className="text-eb-text-tertiary text-[12px]">
                {summary.state === "current" && summary.perDay !== null
                  ? `≈ ${formatMoney(summary.perDay, { cents: false })} al día`
                  : `de ${formatMoney(summary.budget, { cents: false })}`}
              </div>
            </div>
          ) : (
            <div className="text-eb-link text-[15px] font-medium">Definir presupuesto</div>
          )}
        </EbCard>
        {dialog}
      </>
    );
  }

  return (
    <>
      <EbCard className={cn("flex flex-col justify-between gap-4 px-[22px] pt-[22px] pb-5", className)}>
        <div className="flex items-center justify-between">
          <div className="text-eb-text-secondary text-[15px] font-medium">Presupuesto</div>
          {isSet && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="eb-link py-2 pl-2.5 text-[14px]"
              aria-label="Editar presupuesto"
            >
              Editar
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <ProgressRing ratio={ratio} label={ringLabel} ariaLabel={ringAria} />
          <div className="flex min-w-0 flex-col gap-0.5">
            {isSet ? (
              <>
                <div className="text-eb-text-tertiary text-[12px]">{over ? "Te pasaste por" : "Te quedan"}</div>
                <Money
                  value={Math.abs(summary.remaining)}
                  size="md"
                  className={cn(over && "text-eb-orange")}
                />
                <div className="text-eb-text-tertiary text-[12px]">
                  de {formatMoney(summary.budget, { cents: false })}
                </div>
              </>
            ) : (
              <>
                <div className="text-eb-text-tertiary text-[12px]">Sin presupuesto</div>
                <div className="text-eb-text-secondary text-[13px]">Define uno para ver tu avance.</div>
              </>
            )}
          </div>
        </div>

        {isSet ? (
          <div className="eb-well text-eb-text-muted flex items-center gap-2 text-[13px]">
            <ClockIcon size={16} strokeWidth={2} color="#FF9F0A" className="flex-none" aria-hidden="true" />
            <BudgetHint summary={summary} />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="eb-btn-primary h-10 rounded-[20px] px-[18px] text-[14px]"
          >
            Definir presupuesto
          </button>
        )}
      </EbCard>
      {dialog}
    </>
  );
}
