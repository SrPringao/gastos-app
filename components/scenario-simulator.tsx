"use client";

import { useState, useMemo } from "react";
import {
  TrashIcon,
  FlaskConicalIcon,
  ChevronRightIcon,
  CreditCardIcon,
  WalletIcon,
  BanknoteIcon,
  PlusIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerModern } from "@/components/date-picker-modern";
import { formatCurrency } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";

type SimulatedExpense = {
  id: string;
  type: "gasto" | "ingreso";
  description: string;
  amountCents: number;
  date: string;
  accountId: number;
  accountName: string;
  categoryId: number | null;
  categoryName: string | null;
};

type ScenarioSimulatorProps = {
  totalSpentCents: number;
  monthlyBudgetCents: number | null;
  monthKey: string;
  monthLabel: string;
  accounts: { id: number; name: string; type: string; color: string | null; imageUrl: string | null }[];
  categories: { id: number; name: string }[];
};

type Step = "amount" | "account" | "details";

const typeIcons = {
  credit: CreditCardIcon,
  debit: WalletIcon,
  cash: BanknoteIcon,
};

const typeLabels: Record<string, string> = {
  credit: "Crédito",
  debit: "Débito",
  cash: "Efectivo",
};

function parseAmount(value: string): number {
  return parseFloat(value.replace(/,/g, ".")) || 0;
}

export function ScenarioSimulator({
  totalSpentCents,
  monthlyBudgetCents,
  monthKey,
  monthLabel,
  accounts,
  categories,
}: ScenarioSimulatorProps) {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [items, setItems] = useState<SimulatedExpense[]>([]);
  const [step, setStep] = useState<Step>("amount");
  const [itemType, setItemType] = useState<"gasto" | "ingreso">("gasto");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [date, setDate] = useState(todayStr);
  const [error, setError] = useState("");

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) ?? null;

  function resetForm() {
    setStep("amount");
    setItemType("gasto");
    setAmount("");
    setDescription("");
    setSelectedAccountId(null);
    setCategoryId(null);
    setDate(todayStr);
    setError("");
  }

  function handleNextFromAmount() {
    const parsed = parseAmount(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setError("Ingresa un monto válido.");
      return;
    }
    setError("");
    setStep("account");
  }

  function handleSelectAccount(id: number) {
    setSelectedAccountId(id);
    setStep("details");
  }

  function handleAddItem() {
    if (!selectedAccountId || !selectedAccount) return;
    const cents = Math.round(parseAmount(amount) * 100);
    const cat = categories.find((c) => c.id === categoryId) ?? null;
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: itemType,
        description: description.trim() || "Sin descripción",
        amountCents: cents,
        date,
        accountId: selectedAccountId,
        accountName: selectedAccount.name,
        categoryId,
        categoryName: cat?.name ?? null,
      },
    ]);
    resetForm();
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  // Totales
  const simulatedGastos = useMemo(
    () => items.filter((i) => i.type === "gasto").reduce((s, i) => s + i.amountCents, 0),
    [items]
  );
  const simulatedIngresos = useMemo(
    () => items.filter((i) => i.type === "ingreso").reduce((s, i) => s + i.amountCents, 0),
    [items]
  );
  const simulatedNet = simulatedGastos - simulatedIngresos;
  const projectedTotal = totalSpentCents + simulatedNet;
  const remaining = monthlyBudgetCents ? monthlyBudgetCents - projectedTotal : null;
  const realPct = monthlyBudgetCents
    ? Math.min((totalSpentCents / monthlyBudgetCents) * 100, 100)
    : 0;
  const simPct = monthlyBudgetCents
    ? Math.max(0, Math.min((simulatedNet / monthlyBudgetCents) * 100, 100 - realPct))
    : 0;

  const sortedItems = [...items].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
          <FlaskConicalIcon className="text-primary size-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Simulador de escenarios
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Agrega gastos hipotéticos para {monthLabel} y ve cómo afectarían tu presupuesto
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Panel izquierdo: entrada */}
        <div className="space-y-4">

          {/* Paso: monto */}
          {step === "amount" && (
            <Card>
              <CardContent className="pt-6 flex flex-col gap-6">
                {/* Toggle gasto / ingreso */}
                <div className="flex rounded-xl border border-border/60 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setItemType("gasto")}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors",
                      itemType === "gasto"
                        ? "bg-destructive/10 text-destructive"
                        : "text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <TrendingDownIcon className="size-4" />
                    Gasto
                  </button>
                  <div className="w-px bg-border/60" />
                  <button
                    type="button"
                    onClick={() => setItemType("ingreso")}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors",
                      itemType === "ingreso"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <TrendingUpIcon className="size-4" />
                    Ingreso
                  </button>
                </div>

                {/* Monto grande */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-muted-foreground text-sm">Monto</span>
                  <div className="flex items-baseline justify-center gap-0.5">
                    <span className="text-5xl font-bold tracking-tight sm:text-6xl">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => {
                        const v = e.target.value
                          .replace(/[^0-9.,]/g, "")
                          .replace(/,/g, ".");
                        if (v === "" || /^\d*\.?\d{0,2}$/.test(v)) setAmount(v);
                      }}
                      placeholder="0"
                      autoFocus
                      aria-label="Monto"
                      className="w-full min-w-[80px] max-w-[240px] border-0 bg-transparent p-0 text-5xl font-bold tracking-tight tabular-nums outline-none placeholder:text-muted-foreground/60 focus:ring-0 sm:text-6xl"
                    />
                  </div>
                </div>

                {/* Presets */}
                <div className="flex justify-center gap-2">
                  {[100, 200, 500, 1000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        setAmount((prev) => String(parseAmount(prev) + preset))
                      }
                      className="bg-muted hover:bg-muted/80 rounded-full px-4 py-2 text-sm font-medium transition-colors"
                    >
                      ${preset >= 1000 ? "1k" : preset}
                    </button>
                  ))}
                </div>

                {/* Nota */}
                <div className="rounded-2xl border border-border/50 bg-muted/30 px-4 py-3.5">
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Añadir una nota (opcional)"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    onKeyDown={(e) => e.key === "Enter" && handleNextFromAmount()}
                  />
                </div>

                {error && (
                  <p className="text-destructive text-center text-sm">{error}</p>
                )}

                <Button
                  onClick={handleNextFromAmount}
                  className="h-12 gap-2 rounded-xl"
                  disabled={!amount || parseAmount(amount) <= 0}
                >
                  Siguiente
                  <ChevronRightIcon className="size-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Paso: cuenta */}
          {step === "account" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Método de pago</CardTitle>
                <p className="text-muted-foreground text-sm">
                  <span className="font-medium text-foreground">
                    {formatCurrency(Math.round(parseAmount(amount) * 100))}
                  </span>{" "}
                  — ¿Cómo pagarías?
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  {accounts.map((acc) => {
                    const Icon =
                      typeIcons[acc.type as keyof typeof typeIcons] ??
                      CreditCardIcon;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => handleSelectAccount(acc.id)}
                        className={cn(
                          "border-border flex min-h-[64px] items-center gap-4 rounded-xl border p-4 text-left transition-colors",
                          "hover:bg-accent hover:border-accent-foreground/20 active:bg-accent"
                        )}
                      >
                        {acc.imageUrl ? (
                          <img
                            src={acc.imageUrl}
                            alt={acc.name}
                            className="size-10 shrink-0 rounded-lg border object-cover"
                          />
                        ) : (
                          <div
                            className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                            style={{
                              backgroundColor: acc.color ? `${acc.color}20` : undefined,
                              border: acc.color ? `2px solid ${acc.color}` : undefined,
                            }}
                          >
                            <Icon
                              className="size-5"
                              style={{ color: acc.color ?? "var(--muted-foreground)" }}
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{acc.name}</p>
                          <p className="text-muted-foreground text-xs">
                            {typeLabels[acc.type] ?? acc.type}
                          </p>
                        </div>
                        <ChevronRightIcon className="text-muted-foreground size-4 shrink-0" />
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={() => setStep("amount")}
                >
                  Atrás
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Paso: detalles */}
          {step === "details" && (
            <Card>
              <CardContent className="pt-6 flex flex-col gap-6">
                {/* Resumen monto + cuenta */}
                <div className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-muted-foreground text-xs">Monto</p>
                    <p className="text-2xl font-semibold tracking-tight tabular-nums">
                      {formatCurrency(Math.round(parseAmount(amount) * 100))}
                    </p>
                  </div>
                  {selectedAccount && (
                    <div className="text-right">
                      <p className="text-muted-foreground text-xs">Método</p>
                      <p className="font-medium truncate max-w-[160px]">
                        {selectedAccount.name}
                      </p>
                    </div>
                  )}
                </div>

                {/* Categoría */}
                <div className="flex flex-col gap-2">
                  <span className="text-muted-foreground text-xs font-medium">
                    Categoría (opcional)
                  </span>
                  <Select
                    value={categoryId ? String(categoryId) : "none"}
                    onValueChange={(v) =>
                      setCategoryId(v === "none" ? null : Number(v))
                    }
                  >
                    <SelectTrigger className="h-11 w-full rounded-full border-border/60 bg-muted/40 px-4 text-sm">
                      <SelectValue placeholder="Sin categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin categoría</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Fecha */}
                <div className="flex flex-col gap-2">
                  <span className="text-muted-foreground text-xs font-medium">
                    Fecha
                  </span>
                  <DatePickerModern
                    value={date}
                    onChange={setDate}
                    className="rounded-full border-dashed bg-muted/40"
                  />
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("account")}
                    className="h-11 rounded-xl"
                  >
                    Atrás
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddItem}
                    className="h-11 flex-1 gap-2 rounded-xl"
                  >
                    <PlusIcon className="size-4" />
                    Agregar al escenario
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de gastos simulados */}
          {sortedItems.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Gastos del escenario</CardTitle>
                <Badge variant="secondary">{items.length}</Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {sortedItems.map((item) => (
                  <div
                    key={item.id}
                    className="border-border flex items-center justify-between gap-3 rounded-xl border border-dashed bg-background/50 p-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full",
                        item.type === "ingreso"
                          ? "bg-emerald-500/10"
                          : "bg-destructive/10"
                      )}>
                        {item.type === "ingreso"
                          ? <TrendingUpIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                          : <TrendingDownIcon className="size-3.5 text-destructive" />
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.description}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {item.accountName}
                          {item.categoryName && ` · ${item.categoryName}`}
                          {" · "}
                          {new Date(item.date + "T12:00:00").toLocaleDateString(
                            "es-MX",
                            { day: "numeric", month: "short" }
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={cn(
                        "text-sm font-medium",
                        item.type === "ingreso"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : ""
                      )}>
                        {item.type === "ingreso" ? "+" : "-"}{formatCurrency(item.amountCents)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-destructive rounded-full p-1.5 transition-colors"
                      >
                        <TrashIcon className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="border-border flex items-center justify-between border-t pt-2">
                  <span className="text-sm font-medium">Impacto neto</span>
                  <span className={cn(
                    "font-semibold",
                    simulatedNet < 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : simulatedNet > 0 ? "text-orange-500 dark:text-orange-400" : ""
                  )}>
                    {simulatedNet > 0 ? "+" : simulatedNet < 0 ? "−" : ""}
                    {formatCurrency(Math.abs(simulatedNet))}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Panel derecho: resumen */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Preview del mes — {monthLabel}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Barra tricolor */}
              {monthlyBudgetCents && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {Math.round(((projectedTotal / monthlyBudgetCents) * 100))}% del presupuesto
                    </span>
                    <span className="text-muted-foreground">
                      {formatCurrency(monthlyBudgetCents)}
                    </span>
                  </div>
                  <div className="bg-muted h-3 w-full overflow-hidden rounded-full">
                    <div className="flex h-full">
                      <div
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${realPct}%` }}
                      />
                      {simulatedNet > 0 && (
                        <div
                          className="h-full bg-orange-400 transition-all duration-300"
                          style={{ width: `${simPct}%` }}
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="bg-primary size-2.5 rounded-full" />
                      Real
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full bg-orange-400" />
                      Simulado
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="bg-muted-foreground/30 size-2.5 rounded-full" />
                      Disponible
                    </span>
                  </div>
                </div>
              )}

              {/* Desglose */}
              <div className="space-y-3">
                {monthlyBudgetCents && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Presupuesto mensual</span>
                    <span className="font-medium">{formatCurrency(monthlyBudgetCents)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Ya gastado</span>
                  <span className="font-medium">{formatCurrency(totalSpentCents)}</span>
                </div>
                {simulatedGastos > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-orange-500 dark:text-orange-400">
                      + Gastos simulados
                    </span>
                    <span className="font-medium text-orange-500 dark:text-orange-400">
                      + {formatCurrency(simulatedGastos)}
                    </span>
                  </div>
                )}
                {simulatedIngresos > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-emerald-600 dark:text-emerald-400">
                      − Ingresos simulados
                    </span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      − {formatCurrency(simulatedIngresos)}
                    </span>
                  </div>
                )}
                <div className="border-border flex items-center justify-between border-t pt-3">
                  <span className="text-sm font-semibold">Total proyectado</span>
                  <span className="text-lg font-bold">{formatCurrency(projectedTotal)}</span>
                </div>
                {remaining !== null && (
                  <div
                    className={cn(
                      "flex items-center justify-between rounded-xl p-3",
                      remaining < 0
                        ? "bg-destructive/10 text-destructive"
                        : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    )}
                  >
                    <span className="text-sm font-medium">
                      {remaining < 0 ? "Te pasarías por" : "Te quedarían"}
                    </span>
                    <span className="font-bold">{formatCurrency(Math.abs(remaining))}</span>
                  </div>
                )}
                {!monthlyBudgetCents && (
                  <p className="text-muted-foreground text-center text-sm">
                    No tienes presupuesto configurado para {monthLabel}.
                    <br />
                    Configúralo en Gastos para ver el análisis completo.
                  </p>
                )}
              </div>

              {items.length === 0 && (
                <p className="text-muted-foreground border-border border-t pt-4 text-center text-sm">
                  Agrega gastos hipotéticos para ver el preview
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
