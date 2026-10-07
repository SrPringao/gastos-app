"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { AddExpenseFlow } from "@/components/expense-flow/add-expense-flow";
import type { Account, Category } from "@/lib/db/schema";

/**
 * "Nuevo gasto" del header de escritorio: abre el flujo de 3 pasos. El
 * trigger se crea aqui (cliente) y no en el Server Component, para no
 * mandar JSX por props a traves del limite servidor/cliente.
 */
export function NewExpenseButton({
  accounts,
  categories,
}: {
  accounts: Account[];
  categories: Category[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="eb-btn-primary flex h-10 items-center gap-2 rounded-[20px] px-[18px] text-[14px]"
      >
        <PlusIcon size={16} strokeWidth={2.4} aria-hidden="true" />
        Nuevo gasto
      </button>
      <AddExpenseFlow
        open={open}
        onClose={() => setOpen(false)}
        accounts={accounts}
        categories={categories}
      />
    </>
  );
}
