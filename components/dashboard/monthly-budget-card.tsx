"use client";

import { useEffect, useMemo, useState } from "react";
import { PencilIcon, CheckIcon, XIcon, WalletIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/dates";

type MonthlyBudgetCardProps = {
  totalSpentCents: number;
  monthKey: string;
  monthLabel: string;
};

function getStorageKey(monthKey: string) {
  return `budget:${monthKey}`;
}

export function MonthlyBudgetCard({
  totalSpentCents,
  monthKey,
  monthLabel,
}: MonthlyBudgetCardProps) {
  const [budgetCents, setBudgetCents] = useState<number>(0);
  const [draftPesos, setDraftPesos] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(getStorageKey(monthKey));
    const parsed = raw ? Number(raw) : 0;
    const normalized = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    setBudgetCents(normalized);
    setDraftPesos(normalized > 0 ? (normalized / 100).toFixed(2) : "");
  }, [monthKey]);

  const remainingCents = budgetCents - totalSpentCents;
  const usagePercent = useMemo(() => {
    if (budgetCents <= 0) return 0;
    return Math.min(100, Math.round((totalSpentCents / budgetCents) * 100));
  }, [budgetCents, totalSpentCents]);

  function saveBudget() {
    const parsed = Number(draftPesos);
    const nextCents = Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) : 0;
    setBudgetCents(nextCents);
    localStorage.setItem(getStorageKey(monthKey), String(nextCents));
    setIsEditing(false);
  }

  function cancelEdit() {
    setDraftPesos(budgetCents > 0 ? (budgetCents / 100).toFixed(2) : "");
    setIsEditing(false);
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          Presupuesto mensual
        </CardTitle>
        <div className="text-muted-foreground opacity-70">
          <WalletIcon className="size-5" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">{monthLabel}</p>
          <p className="text-2xl font-bold tracking-tight">
            {budgetCents > 0 ? formatCurrency(budgetCents) : "Sin definir"}
          </p>
        </div>

        {budgetCents > 0 ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Consumido</span>
                <span className="font-medium">{usagePercent}%</span>
              </div>
              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  className={`h-full rounded-full transition-all ${
                    usagePercent >= 100 ? "bg-destructive" : "bg-primary"
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>
            <p className={`text-xs ${remainingCents < 0 ? "text-destructive" : "text-muted-foreground"}`}>
              {remainingCents >= 0
                ? `Te quedan ${formatCurrency(remainingCents)}`
                : `Te pasaste por ${formatCurrency(Math.abs(remainingCents))}`}
            </p>
          </>
        ) : (
          <p className="text-muted-foreground text-xs">
            Define un presupuesto para ver el avance.
          </p>
        )}

        <div className="mt-auto">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={draftPesos}
              onChange={(e) => setDraftPesos(e.target.value)}
            />
            <Button type="button" size="icon-sm" onClick={saveBudget}>
              <CheckIcon className="size-4" />
            </Button>
            <Button type="button" variant="outline" size="icon-sm" onClick={cancelEdit}>
              <XIcon className="size-4" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={() => setIsEditing(true)}
          >
            <PencilIcon className="size-4" />
            {budgetCents > 0 ? "Editar presupuesto" : "Definir presupuesto"}
          </Button>
        )}
        </div>
      </CardContent>
    </Card>
  );
}
