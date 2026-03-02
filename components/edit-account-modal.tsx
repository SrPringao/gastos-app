"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AccountForm } from "@/components/account-form";
import type { Account } from "@/lib/db/schema";

type EditAccountModalProps = {
  account: Account;
  trigger?: React.ReactNode;
};

export function EditAccountModal({ account, trigger }: EditAccountModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAccount, setCurrentAccount] = useState(account);

  useEffect(() => {
    setCurrentAccount(account);
  }, [account, open]);

  async function handleSubmit(data: {
    name: string;
    type: "credit" | "debit" | "cash";
    color: string | null;
    cutoffDay: number | null;
    paymentDay: number | null;
    creditLimit: string | null;
  }) {
    setError(null);
    const res = await fetch(`/api/accounts/${account.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        type: data.type,
        color: data.color,
        cutoffDay: data.cutoffDay,
        paymentDay: data.paymentDay,
        creditLimit: data.creditLimit,
      }),
    });
    const result = await res.json();
    if (!res.ok) {
      setError(result.error || "Error al guardar");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function handleImageChange(file: File) {
    setError(null);
    const formData = new FormData();
    formData.set("image", file);
    const res = await fetch(`/api/accounts/${account.id}/upload`, {
      method: "POST",
      body: formData,
    });
    const result = await res.json();
    if (!res.ok) {
      setError(result.error || "Error al subir imagen");
      throw new Error(result.error);
    }
    setCurrentAccount((prev) =>
      prev ? { ...prev, imageUrl: result.imageUrl } : prev
    );
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="icon-sm" className="shrink-0">
            <PencilIcon className="size-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar metodo de pago</DialogTitle>
        </DialogHeader>
        <AccountForm
          account={currentAccount}
          onSubmit={handleSubmit}
          onImageChange={handleImageChange}
          error={error}
          submitLabel="Guardar cambios"
        />
      </DialogContent>
    </Dialog>
  );
}
