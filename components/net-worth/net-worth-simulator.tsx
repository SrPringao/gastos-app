"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, TrashIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/components/preferences-provider";
import { MaskedAmount } from "@/components/masked-amount";
import type { NetWorthEntry, NetWorthProjection } from "@/lib/db/schema";

type NetWorthSimulatorProps = {
  entries: NetWorthEntry[];
  projections: NetWorthProjection[];
};

function ProjectionRow({
  projection,
  onSaved,
}: {
  projection: NetWorthProjection;
  onSaved: () => void;
}) {
  const { hideNetWorthAmounts } = usePreferences();
  const [amount, setAmount] = useState(String(projection.amount / 100));
  const [saving, setSaving] = useState(false);

  async function handleAmountBlur() {
    const cents = Math.round(parseFloat(amount || "0") * 100);
    if (cents === projection.amount) return;
    setSaving(true);
    try {
      await fetch(`/api/net-worth/projections/${projection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: cents }),
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await fetch(`/api/net-worth/projections/${projection.id}`, {
        method: "DELETE",
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-border flex flex-wrap items-center gap-3 rounded-lg border bg-background/50 p-3">
      <p className="min-w-0 flex-1 truncate text-sm font-medium">{projection.label}</p>
      {hideNetWorthAmounts ? (
        <div className="font-figures bg-muted flex h-9 w-24 flex-1 items-center justify-end rounded-md px-3 text-sm select-none sm:w-32 sm:flex-none">
          ••••••
        </div>
      ) : (
        <Input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onBlur={handleAmountBlur}
          disabled={saving}
          className="font-figures h-9 w-24 flex-1 text-right sm:w-32 sm:flex-none"
        />
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        disabled={saving}
        className="text-muted-foreground hover:text-destructive shrink-0"
      >
        <TrashIcon className="size-4" />
      </Button>
    </div>
  );
}

export function NetWorthSimulator({ entries, projections }: NetWorthSimulatorProps) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  function refresh() {
    router.refresh();
  }

  async function handleAdd() {
    if (!label.trim() || !amount) return;
    setSaving(true);
    try {
      await fetch("/api/net-worth/projections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim(),
          amount: Math.round(parseFloat(amount || "0") * 100),
        }),
      });
      setLabel("");
      setAmount("");
      refresh();
    } finally {
      setSaving(false);
    }
  }

  const totalAssets = entries
    .filter((e) => e.kind === "asset")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalDebts = entries
    .filter((e) => e.kind === "debt")
    .reduce((sum, e) => sum + e.amount, 0);
  const net = totalAssets - totalDebts;
  const totalPrevisto = projections.reduce((sum, p) => sum + p.amount, 0);
  const netAfterPrevisto = net - totalPrevisto;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulador de gastos previstos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {projections.map((projection) => (
            <ProjectionRow key={projection.id} projection={projection} onSaved={refresh} />
          ))}
          <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Input
              placeholder="Concepto (ej: Renta, Super)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="h-9 sm:min-w-[140px] sm:flex-1"
            />
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-figures h-9 flex-1 text-right sm:w-28 sm:flex-none"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAdd}
                disabled={saving || !label.trim() || !amount}
                className="shrink-0 gap-1.5"
              >
                <PlusIcon className="size-4" />
                Agregar
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-5 border-t pt-4">
          <div>
            <p className="text-muted-foreground text-sm">Neto − previsto</p>
            <MaskedAmount
              className={cn(
                "font-figures block text-4xl font-medium tracking-tight",
                netAfterPrevisto >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-destructive"
              )}
            >
              {formatCurrency(netAfterPrevisto)}
            </MaskedAmount>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-xs font-medium tracking-wide text-emerald-700 uppercase dark:text-emerald-400">
                Neto
              </p>
              <MaskedAmount className="font-figures mt-1 block text-xl font-medium text-emerald-600 dark:text-emerald-400">
                {formatCurrency(net)}
              </MaskedAmount>
            </div>
            <div className="border-destructive/20 bg-destructive/10 rounded-xl border p-4">
              <p className="text-destructive/90 text-xs font-medium tracking-wide uppercase">
                Previsto
              </p>
              <MaskedAmount className="font-figures text-destructive mt-1 block text-xl font-medium">
                {formatCurrency(totalPrevisto)}
              </MaskedAmount>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
