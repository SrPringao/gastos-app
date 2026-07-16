"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon, CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, dbDateToInputValue } from "@/lib/utils/dates";
import type { Account, NetWorthEntry } from "@/lib/db/schema";

type NetWorthCardProps = {
  accounts: Account[];
  entries: NetWorthEntry[];
};

const NO_ACCOUNT = "none";

function getDaysUntilDue(dueDate: Date | string | null): number | null {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const dueOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const now = new Date();
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = dueOnly.getTime() - todayOnly.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function DueDateBadge({ dueDate }: { dueDate: Date | string | null }) {
  const days = getDaysUntilDue(dueDate);
  if (days === null) return null;

  const label =
    days < 0
      ? `Vencido hace ${Math.abs(days)}d`
      : days === 0
        ? "Vence hoy"
        : `${days}d restantes`;

  return (
    <Badge variant={days <= 3 ? "warning" : "secondary"} className="shrink-0">
      {label}
    </Badge>
  );
}

function EntryRow({
  entry,
  accounts,
  isFirst,
  isLast,
  onSaved,
  onMove,
}: {
  entry: NetWorthEntry;
  accounts: Account[];
  isFirst: boolean;
  isLast: boolean;
  onSaved: () => void;
  onMove: (direction: "up" | "down") => void;
}) {
  const [amount, setAmount] = useState(String(entry.amount / 100));
  const [dueDate, setDueDate] = useState(
    entry.dueDate ? dbDateToInputValue(entry.dueDate) : ""
  );
  const [saving, setSaving] = useState(false);

  async function handleAmountBlur() {
    const cents = Math.round(parseFloat(amount || "0") * 100);
    if (cents === entry.amount) return;
    setSaving(true);
    try {
      await fetch(`/api/net-worth/entries/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: cents }),
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  async function handleDueDateChange(value: string) {
    setDueDate(value);
    setSaving(true);
    try {
      await fetch(`/api/net-worth/entries/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate: value || null }),
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await fetch(`/api/net-worth/entries/${entry.id}`, { method: "DELETE" });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const account = accounts.find((a) => a.id === entry.accountId);

  return (
    <div className="border-border flex flex-col gap-3 rounded-lg border bg-background/50 p-3 sm:flex-row sm:items-center">
      <div className="flex items-start gap-2">
        <div className="flex shrink-0 flex-col">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onMove("up")}
            disabled={isFirst || saving}
            className="size-6 text-muted-foreground hover:text-foreground"
          >
            <ChevronUpIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onMove("down")}
            disabled={isLast || saving}
            className="size-6 text-muted-foreground hover:text-foreground"
          >
            <ChevronDownIcon className="size-4" />
          </Button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium">{entry.label}</p>
            {entry.kind === "debt" && <DueDateBadge dueDate={entry.dueDate} />}
          </div>
          {account && (
            <p className="text-muted-foreground truncate text-xs">{account.name}</p>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={saving}
          className="text-muted-foreground hover:text-destructive shrink-0 sm:hidden"
        >
          <TrashIcon className="size-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2 sm:shrink-0">
        {entry.kind === "debt" && (
          <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:flex-none">
            <CalendarIcon className="text-muted-foreground size-4 shrink-0" />
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => handleDueDateChange(e.target.value)}
              disabled={saving}
              className="h-9 min-w-0 flex-1 rounded-lg text-xs sm:w-[145px] sm:flex-none"
            />
          </div>
        )}

        <Input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onBlur={handleAmountBlur}
          disabled={saving}
          className="h-9 w-24 flex-1 rounded-lg text-right sm:w-32 sm:flex-none"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={saving}
          className="text-muted-foreground hover:text-destructive hidden shrink-0 sm:inline-flex"
        >
          <TrashIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function AddEntryForm({
  kind,
  accounts,
  onAdded,
}: {
  kind: "asset" | "debt";
  accounts: Account[];
  onAdded: () => void;
}) {
  const [label, setLabel] = useState("");
  const [accountId, setAccountId] = useState<string>(NO_ACCOUNT);
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [labelEditedByUser, setLabelEditedByUser] = useState(false);

  function handleAccountChange(value: string) {
    setAccountId(value);
    if (labelEditedByUser) return;
    const account = accounts.find((acc) => acc.id === Number(value));
    setLabel(account?.name ?? "");
  }

  async function handleAdd() {
    if (!label.trim() || !amount) return;
    setSaving(true);
    try {
      await fetch("/api/net-worth/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim(),
          kind,
          accountId: accountId === NO_ACCOUNT ? null : Number(accountId),
          amount: Math.round(parseFloat(amount || "0") * 100),
          dueDate: kind === "debt" && dueDate ? dueDate : null,
        }),
      });
      setLabel("");
      setAccountId(NO_ACCOUNT);
      setAmount("");
      setDueDate("");
      setLabelEditedByUser(false);
      onAdded();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3 sm:flex-row sm:flex-wrap sm:items-center">
      <Input
        placeholder="Nombre (ej: Nu, Sueldo, iPad)"
        value={label}
        onChange={(e) => {
          setLabel(e.target.value);
          setLabelEditedByUser(true);
        }}
        className="h-9 rounded-lg sm:min-w-[140px] sm:flex-1"
      />
      <div className="flex items-center gap-2">
        <Select value={accountId} onValueChange={handleAccountChange}>
          <SelectTrigger size="sm" className="w-full rounded-lg sm:w-40">
            <SelectValue placeholder="Sin metodo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_ACCOUNT}>Sin metodo</SelectItem>
            {accounts.map((acc) => (
              <SelectItem key={acc.id} value={String(acc.id)}>
                {acc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {kind === "debt" && (
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="h-9 min-w-0 flex-1 rounded-lg text-xs sm:w-[145px] sm:flex-none"
          />
        )}
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-9 flex-1 rounded-lg text-right sm:w-28 sm:flex-none"
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
  );
}

function EntryList({
  entries,
  accounts,
  onSaved,
}: {
  entries: NetWorthEntry[];
  accounts: Account[];
  onSaved: () => void;
}) {
  const router = useRouter();
  const [reordering, setReordering] = useState(false);

  async function handleMove(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= entries.length) return;

    const reordered = [...entries];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    setReordering(true);
    try {
      await fetch("/api/net-worth/entries/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: reordered.map((e) => e.id) }),
      });
      router.refresh();
    } finally {
      setReordering(false);
    }
  }

  return (
    <>
      {entries.map((entry, index) => (
        <EntryRow
          key={entry.id}
          entry={entry}
          accounts={accounts}
          isFirst={index === 0}
          isLast={index === entries.length - 1}
          onSaved={onSaved}
          onMove={(direction) => {
            if (!reordering) handleMove(index, direction);
          }}
        />
      ))}
    </>
  );
}

export function NetWorthCard({ accounts, entries }: NetWorthCardProps) {
  const router = useRouter();

  function refresh() {
    router.refresh();
  }

  const assets = entries.filter((e) => e.kind === "asset");
  const debts = entries.filter((e) => e.kind === "debt");
  const totalAssets = assets.reduce((sum, e) => sum + e.amount, 0);
  const totalDebts = debts.reduce((sum, e) => sum + e.amount, 0);
  const net = totalAssets - totalDebts;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Positivos</span>
            <span className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalAssets)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <EntryList entries={assets} accounts={accounts} onSaved={refresh} />
          <AddEntryForm kind="asset" accounts={accounts} onAdded={refresh} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Deudas</span>
            <span className="text-base font-semibold text-red-600 dark:text-red-400">
              {formatCurrency(totalDebts)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <EntryList entries={debts} accounts={accounts} onSaved={refresh} />
          <AddEntryForm kind="debt" accounts={accounts} onAdded={refresh} />
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardContent className="space-y-5 pt-6">
          <div>
            <p className="text-muted-foreground text-sm">Neto despues de pagos</p>
            <p
              className={
                net >= 0
                  ? "text-4xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400"
                  : "text-4xl font-bold tracking-tight text-red-600 dark:text-red-400"
              }
            >
              {formatCurrency(net)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                Positivos
              </p>
              <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalAssets)}
              </p>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-red-700 dark:text-red-400">
                Deudas
              </p>
              <p className="mt-1 text-xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(totalDebts)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
