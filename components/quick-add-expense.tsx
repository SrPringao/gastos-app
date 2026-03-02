"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  CreditCardIcon,
  WalletIcon,
  BanknoteIcon,
  ChevronRightIcon,
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

  function handleNextFromAmount() {
    const parsed = parseFloat(amount);
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
    setError(null);
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Monto invalido");
      return;
    }
    if (!accountId) {
      setError("Selecciona un metodo de pago");
      return;
    }

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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <PlusIcon className="size-5" />
          Agregar gasto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
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
            <DialogHeader>
              <DialogTitle>Nuevo gasto</DialogTitle>
              <DialogDescription>
                Ingresa el monto del gasto. Luego seleccionaras el metodo de pago.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div>
                <Label htmlFor="amount">Monto</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                  className="mt-1 text-lg"
                />
              </div>
              <div>
                <Label htmlFor="description">Descripcion (opcional)</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: Comida, uber..."
                  className="mt-1"
                />
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Button
                onClick={handleNextFromAmount}
                className="gap-2"
                disabled={!amount}
              >
                Siguiente
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
                    {formatCurrency(parseFloat(amount) * 100)}
                  </span>
                )}{" "}
                - Selecciona como pagaste
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              {accounts.map((acc) => {
                const Icon = typeIcons[acc.type as keyof typeof typeIcons];
                const accWithColor = acc as Account & { color?: string | null; imageUrl?: string | null };
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleSelectAccount(acc.id)}
                    className={cn(
                      "border-border flex items-center gap-4 rounded-xl border p-4 text-left transition-colors",
                      "hover:bg-accent hover:border-accent-foreground/20"
                    )}
                  >
                    {accWithColor.imageUrl ? (
                      <img
                        src={accWithColor.imageUrl}
                        alt={acc.name}
                        className="size-12 shrink-0 rounded-lg object-cover border"
                      />
                    ) : (
                      <div
                        className="flex size-12 shrink-0 items-center justify-center rounded-lg"
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
                          className="size-6"
                          style={
                            accWithColor.color
                              ? { color: accWithColor.color }
                              : { color: "var(--muted-foreground)" }
                          }
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{acc.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {typeLabels[acc.type as keyof typeof typeLabels]}
                      </p>
                    </div>
                    <ChevronRightIcon className="text-muted-foreground size-5 shrink-0" />
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Detalles</DialogTitle>
              <DialogDescription>
                Categoria y fecha son opcionales.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <Label htmlFor="category">Categoria (opcional)</Label>
                <select
                  id="category"
                  value={categoryId ?? ""}
                  onChange={(e) =>
                    setCategoryId(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  className={cn(
                    "border-input dark:bg-input/30 mt-1 h-9 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  )}
                >
                  <option value="">Sin categoria</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Fecha</Label>
                <DatePickerModern
                  value={date}
                  onChange={setDate}
                  className="mt-2"
                />
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("account")}
                >
                  Atras
                </Button>
                <Button type="submit" className="flex-1">
                  Guardar gasto
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
