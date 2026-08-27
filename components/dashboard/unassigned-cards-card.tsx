"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Account, CardNameMapping } from "@/lib/db/schema";

type UnassignedCardGroup = {
  rawCardName: string;
  count: number;
  totalAmount: number;
  lastDate: string;
};

type UnassignedCardsCardProps = {
  accounts: Account[];
};

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

export function UnassignedCardsCard({ accounts }: UnassignedCardsCardProps) {
  const router = useRouter();
  const [groups, setGroups] = useState<UnassignedCardGroup[] | null>(null);
  const [mappings, setMappings] = useState<CardNameMapping[] | null>(null);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    const [groupsRes, mappingsRes] = await Promise.all([
      fetch("/api/card-name-mappings/unassigned"),
      fetch("/api/card-name-mappings"),
    ]);
    setGroups(await groupsRes.json());
    setMappings(await mappingsRes.json());
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAssign(rawCardName: string) {
    const accountId = selected[rawCardName];
    if (!accountId) return;
    setError(null);
    setSaving(rawCardName);
    const res = await fetch("/api/card-name-mappings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rawCardName,
        accountId: Number(accountId),
        reassignExistingExpenses: true,
      }),
    });
    const result = await res.json();
    setSaving(null);
    if (!res.ok) {
      setError(result.error || "Error al asignar");
      return;
    }
    await loadData();
    router.refresh();
  }

  async function handleDeleteMapping(id: number) {
    setError(null);
    const res = await fetch(`/api/card-name-mappings/${id}`, {
      method: "DELETE",
    });
    const result = await res.json();
    if (!res.ok) {
      setError(result.error || "Error al eliminar mapeo");
      return;
    }
    await loadData();
    router.refresh();
  }

  const hasUnassigned = groups && groups.length > 0;
  const hasMappings = mappings && mappings.length > 0;

  if (!hasUnassigned && !hasMappings) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tarjetas del Shortcut</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <p className="text-destructive text-sm">{error}</p>}

        {hasUnassigned && (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm font-medium">
              Sin asignar
            </p>
            {groups!.map((g) => (
              <div
                key={g.rawCardName}
                className="border-border flex flex-col gap-3 rounded-lg border bg-background/50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{g.rawCardName}</p>
                  <p className="text-muted-foreground text-xs">
                    {g.count} gasto{g.count !== 1 ? "s" : ""} ·{" "}
                    {formatCents(g.totalAmount)} · ultimo{" "}
                    {new Date(g.lastDate).toLocaleDateString("es-MX")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Select
                    value={selected[g.rawCardName] ?? ""}
                    onValueChange={(value) =>
                      setSelected((s) => ({ ...s, [g.rawCardName]: value }))
                    }
                  >
                    <SelectTrigger size="sm" className="w-40">
                      <SelectValue placeholder="Elegir cuenta" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={String(acc.id)}>
                          {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    disabled={!selected[g.rawCardName] || saving === g.rawCardName}
                    onClick={() => handleAssign(g.rawCardName)}
                  >
                    Asignar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMappings && (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm font-medium">
              Mapeos guardados
            </p>
            {mappings!.map((m) => {
              const account = accounts.find((a) => a.id === m.accountId);
              return (
                <div
                  key={m.id}
                  className="border-border flex items-center justify-between rounded-lg border bg-background/50 p-3"
                >
                  <p className="text-sm truncate">
                    {m.rawName} <span className="text-muted-foreground">→</span>{" "}
                    {account?.name ?? "Cuenta eliminada"}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMapping(m.id)}
                  >
                    Eliminar
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
