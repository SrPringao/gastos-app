"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  CreditCardIcon,
  WalletIcon,
  BanknoteIcon,
  ChevronRightIcon,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePickerModern } from "@/components/date-picker-modern";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/dates";
import type { Account } from "@/lib/db/schema";
import type { Category } from "@/lib/db/schema";

const typeIcons = {
  credit: CreditCardIcon,
  debit: WalletIcon,
  cash: BanknoteIcon,
};

const typeLabels = {
  credit: "Credito",
  debit: "Debito",
  cash: "Efectivo",
};

type QuickAddExpenseProps = {
  accounts: Account[];
  categories: Category[];
};

type Step = "amount" | "account" | "details";

export function QuickAddExpense({ accounts, categories }: QuickAddExpenseProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("amount");
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [date, setDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [addingAccount, setAddingAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountType, setNewAccountType] =
    useState<"credit" | "debit" | "cash">("debit");
  const [savingExpense, setSavingExpense] = useState(false);

  const selectedAccount =
    accounts.find((acc) => acc.id === accountId) ?? null;

  function resetForm() {
    setStep("amount");
    setAmount("");
    setDescription("");
    setAccountId(null);
    setCategoryId(null);
    setDate(new Date().toISOString().slice(0, 10));
    setError(null);
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      resetForm();
      setAddingAccount(false);
    }
  }

  function parseAmount(value: string): number {
    return parseFloat(value.replace(/,/g, ".")) || 0;
  }

  function handleNextFromAmount() {
    const parsed = parseAmount(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setError("Ingresa un monto valido");
      return;
    }
    setError(null);
    if (accounts.length === 0) {
      setAddingAccount(true);
      return;
    }
    setStep("account");
  }

  function handleSelectAccount(id: number) {
    setAccountId(id);
    setStep("details");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (savingExpense) return;
    setError(null);
    const parsedAmount = parseAmount(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Monto invalido");
      return;
    }
    if (!accountId) {
      setError("Selecciona un metodo de pago");
      return;
    }

    setSavingExpense(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          accountId,
          categoryId: categoryId || null,
          date,
          description: description.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al guardar");
        return;
      }
      setOpen(false);
      resetForm();
      router.refresh();
    } finally {
      setSavingExpense(false);
    }
  }

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newAccountName,
        type: newAccountType,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Error al guardar");
      return;
    }
    setAddingAccount(false);
    setNewAccountName("");
    setNewAccountType("debit");
    router.refresh();
  }

  const trigger = (
    <Button
      size="lg"
      className="h-12 w-full gap-2 sm:h-10 sm:w-auto sm:min-w-[140px]"
    >
      <PlusIcon className="size-5 shrink-0" />
      Agregar gasto
    </Button>
  );

  const content = (
    <>
      {addingAccount ? (
          <>
            <DialogHeader>
              <DialogTitle>Agregar metodo de pago</DialogTitle>
              <DialogDescription>
                No tienes metodos configurados. Agrega uno para empezar.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddAccount} className="flex flex-col gap-4">
              <div>
                <Label htmlFor="new-account-name">Nombre</Label>
                <Input
                  id="new-account-name"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="Ej: Tarjeta BBVA"
                  required
                  autoFocus
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select
                  value={newAccountType}
                  onValueChange={(v) =>
                    setNewAccountType(v as "credit" | "debit" | "cash")
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">Credito</SelectItem>
                    <SelectItem value="debit">Debito</SelectItem>
                    <SelectItem value="cash">Efectivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit">Agregar</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddingAccount(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </>
        ) : step === "amount" ? (
          <>
            <DialogHeader className="sm:text-left">
              <DialogTitle className="sr-only">Nuevo gasto</DialogTitle>
              <DialogDescription className="sr-only">
                Ingresa el monto y opcionalmente una nota.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-1">
                <span className="text-muted-foreground text-sm">Monto</span>
                <div className="flex items-baseline justify-center gap-0.5">
                  <span className="text-5xl font-bold tracking-tight sm:text-6xl">$</span>
                  <input
                    id="amount-input"
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9.,]/g, "").replace(/,/g, ".");
                      if (v === "" || /^\d*\.?\d{0,2}$/.test(v)) setAmount(v);
                    }}
                    placeholder="0"
                    autoFocus
                    aria-label="Monto"
                    style={{ fontSize: "3rem" }}
                    className="border-0 bg-transparent p-0 font-bold tracking-tight tabular-nums outline-none placeholder:text-muted-foreground/60 focus:ring-0 sm:text-6xl w-full min-w-[80px] max-w-[240px]"
                  />
                </div>
              </div>
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
              <div className="rounded-2xl border border-border/50 bg-muted/30 px-4 py-3.5">
                <label htmlFor="description-input" className="sr-only">
                  Descripcion (opcional)
                </label>
                <input
                  id="description-input"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Anadir una nota"
                  style={{ fontSize: "16px" }}
                  className="bg-transparent w-full outline-none placeholder:text-muted-foreground"
                />
              </div>
              {error && <p className="text-destructive text-center text-sm">{error}</p>}
              <Button
                onClick={handleNextFromAmount}
                className="h-12 gap-2 rounded-xl"
                disabled={!amount || parseAmount(amount) <= 0 || savingExpense}
              >
                {savingExpense && (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                )}
                <span>{savingExpense ? "Guardando..." : "Siguiente"}</span>
                <ChevronRightIcon className="size-4" />
              </Button>
            </div>
          </>
        ) : step === "account" ? (
          <>
            <DialogHeader>
              <DialogTitle>Metodo de pago</DialogTitle>
              <DialogDescription>
                {amount && (
                  <span className="font-medium text-foreground">
                    {formatCurrency(Math.round(parseAmount(amount) * 100))}
                  </span>
                )}{" "}
                - Selecciona como pagaste
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 pb-8 sm:grid-cols-2 sm:gap-3 sm:pb-4">
              {accounts.map((acc) => {
                const Icon = typeIcons[acc.type as keyof typeof typeIcons];
                const accWithColor = acc as Account & { color?: string | null; imageUrl?: string | null };
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleSelectAccount(acc.id)}
                    className={cn(
                      "border-border flex min-h-[52px] items-center gap-3 rounded-xl border p-3 text-left transition-colors active:bg-accent sm:min-h-[64px] sm:gap-4 sm:p-4",
                      "hover:bg-accent hover:border-accent-foreground/20"
                    )}
                  >
                    {accWithColor.imageUrl ? (
                      <img
                        src={accWithColor.imageUrl}
                        alt={acc.name}
                        className="size-10 shrink-0 rounded-lg object-cover border sm:size-12"
                      />
                    ) : (
                      <div
                        className="flex size-10 shrink-0 items-center justify-center rounded-lg sm:size-12"
                        style={{
                          backgroundColor: accWithColor.color
                            ? `${accWithColor.color}20`
                            : undefined,
                          ...(accWithColor.color && {
                            border: `2px solid ${accWithColor.color}`,
                          }),
                        }}
                      >
                        <Icon
                          className="size-5 sm:size-6"
                          style={
                            accWithColor.color
                              ? { color: accWithColor.color }
                              : { color: "var(--muted-foreground)" }
                          }
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium sm:text-base">{acc.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {typeLabels[acc.type as keyof typeof typeLabels]}
                      </p>
                    </div>
                    <ChevronRightIcon className="text-muted-foreground size-4 shrink-0 sm:size-5" />
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="sm:text-left">
              <DialogTitle className="text-base font-semibold">
                Detalles del gasto
              </DialogTitle>
              <DialogDescription className="text-xs">
                Ajusta la categoria y la fecha. Ambos campos son opcionales.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-8 pb-4">
              <div className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3.5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-muted-foreground text-xs">Monto</p>
                  <p className="text-2xl font-semibold tracking-tight tabular-nums">
                    {formatCurrency(
                      Math.round(parseAmount(amount || "0") * 100)
                    )}
                  </p>
                </div>
                {selectedAccount && (
                  <div className="text-right">
                    <p className="text-muted-foreground text-xs">Metodo</p>
                    <p className="font-medium truncate max-w-[160px]">
                      {selectedAccount.name}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-muted-foreground text-xs font-medium">
                  Categoria (opcional)
                </span>
                <Select
                  value={categoryId ? String(categoryId) : "none"}
                  onValueChange={(v) =>
                    setCategoryId(v === "none" ? null : Number(v))
                  }
                >
                  <SelectTrigger className="h-11 w-full rounded-full border-border/60 bg-muted/40 px-4 text-sm">
                    <SelectValue placeholder="Sin categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin categoria</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-muted-foreground text-xs font-medium">
                  Fecha
                </span>
                <DatePickerModern
                  value={date}
                  onChange={setDate}
                  className="rounded-full border-dashed bg-muted/40"
                />
              </div>

              {error && (
                <p className="text-destructive text-center text-sm">{error}</p>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("account")}
                  disabled={savingExpense}
                  className="h-11 rounded-xl"
                >
                  Atras
                </Button>
                <Button
                  type="submit"
                  className="h-11 flex-1 gap-2 rounded-xl"
                  disabled={savingExpense}
                >
                  {savingExpense && (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  )}
                  <span>{savingExpense ? "Guardando..." : "Guardar gasto"}</span>
                </Button>
              </div>
            </form>
          </>
        )}
    </>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-6">
        {content}
      </DialogContent>
    </Dialog>
  );
}
