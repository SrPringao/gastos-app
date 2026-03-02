"use client";

import { useState } from "react";
import { PencilIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePickerModern } from "@/components/date-picker-modern";
import { cn } from "@/lib/utils";
import { dbDateToInputValue } from "@/lib/utils/dates";

type ExpenseForEdit = {
  id: number;
  amount: number;
  date: string;
  description: string | null;
  accountId: number;
  categoryId: number | null;
};

type EditExpenseModalProps = {
  expense: ExpenseForEdit;
  accounts: { id: number; name: string; type: string }[];
  categories: { id: number; name: string }[];
  onSuccess?: () => void;
};

export function EditExpenseModal({
  expense,
  accounts,
  categories,
  onSuccess,
}: EditExpenseModalProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState((expense.amount / 100).toFixed(2));
  const [description, setDescription] = useState(expense.description ?? "");
  const [accountId, setAccountId] = useState(String(expense.accountId));
  const [categoryId, setCategoryId] = useState(
    expense.categoryId ? String(expense.categoryId) : ""
  );
  const [dateValue, setDateValue] = useState<string>(
    expense.date ? dbDateToInputValue(expense.date) : dbDateToInputValue(new Date())
  );

  function resetForm() {
    setAmount((expense.amount / 100).toFixed(2));
    setDescription(expense.description ?? "");
    setAccountId(String(expense.accountId));
    setCategoryId(expense.categoryId ? String(expense.categoryId) : "");
    setDateValue(
      expense.date ? dbDateToInputValue(expense.date) : dbDateToInputValue(new Date())
    );
    setError(null);
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) {
      resetForm();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Monto invalido");
      return;
    }

    const res = await fetch(`/api/expenses/${expense.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parsedAmount,
        accountId: Number(accountId),
        categoryId: categoryId ? Number(categoryId) : null,
        date: dateValue,
        description: description.trim() || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Error al guardar");
      return;
    }
    setOpen(false);
    onSuccess?.();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="shrink-0">
          <PencilIcon className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar gasto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="amount">Monto</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="description">Descripcion</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="accountId">Metodo de pago</Label>
            <select
              id="accountId"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
              className={cn(
                "border-input mt-1 h-9 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              )}
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="categoryId">Categoria</Label>
            <select
              id="categoryId"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={cn(
                "border-input mt-1 h-9 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
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
            <Label className="text-muted-foreground text-sm font-medium">
              Fecha
            </Label>
            <DatePickerModern
              value={dateValue}
              onChange={setDateValue}
              className="mt-2"
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="flex justify-end">
            <Button type="submit">Guardar cambios</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
