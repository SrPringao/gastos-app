"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, CreditCardIcon, WalletIcon, BanknoteIcon } from "lucide-react";
import { AccountForm } from "@/components/account-form";
import { EditAccountModal } from "@/components/edit-account-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuickAddExpense } from "@/components/quick-add-expense";
import { getDaysUntilPayment } from "@/lib/utils/dates";
import type { Account } from "@/lib/db/schema";
import type { Category } from "@/lib/db/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

type AccountsCardProps = {
  accounts: Account[];
  categories: Category[];
};

export function AccountsCard({ accounts, categories }: AccountsCardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addFormKey, setAddFormKey] = useState(0);

  async function handleAddAccount(data: {
    name: string;
    type: "credit" | "debit" | "cash";
    color: string | null;
    cutoffDay: number | null;
    paymentDay: number | null;
    creditLimit: string | null;
  }) {
    setError(null);
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      setError(result.error || "Error al guardar");
      return;
    }
    setOpen(false);
    setAddFormKey((k) => k + 1);
    router.refresh();
  }

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Metodos de pago</CardTitle>
        <div className="flex flex-wrap gap-2">
          <QuickAddExpense accounts={accounts} categories={categories} />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <PlusIcon className="size-4" />
                Agregar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader className="text-left">
                <DialogTitle className="text-xl">Nueva cuenta</DialogTitle>
                <DialogDescription>
                  Agrega un metodo de pago para trackear tus gastos.
                </DialogDescription>
              </DialogHeader>
              <AccountForm
                key={addFormKey}
                onSubmit={handleAddAccount}
                error={error}
                submitLabel="Agregar cuenta"
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No tienes metodos de pago. Agrega uno para empezar a registrar gastos.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {accounts.map((acc) => {
              const Icon = typeIcons[acc.type as keyof typeof typeIcons];
              const daysUntilPayment =
                acc.type === "credit"
                  ? getDaysUntilPayment(acc.cutoffDay, acc.paymentDay)
                  : null;

              return (
                <div
                  key={acc.id}
                  className="border-border flex items-center justify-between rounded-lg border bg-background/50 p-4"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {acc.imageUrl ? (
                      <img
                        src={acc.imageUrl}
                        alt={acc.name}
                        className="size-10 shrink-0 rounded-lg object-cover border"
                      />
                    ) : (
                      <div
                        className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: acc.color
                            ? `${acc.color}20`
                            : undefined,
                          ...(acc.color && { border: `2px solid ${acc.color}` }),
                        }}
                      >
                        <Icon
                          className="size-5"
                          style={
                            acc.color
                              ? { color: acc.color }
                              : { color: "var(--muted-foreground)" }
                          }
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate">{acc.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {typeLabels[acc.type as keyof typeof typeLabels]}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {daysUntilPayment !== null && (
                      <Badge variant={daysUntilPayment <= 7 ? "warning" : "secondary"}>
                        {daysUntilPayment} dias
                      </Badge>
                    )}
                    <EditAccountModal account={acc} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
