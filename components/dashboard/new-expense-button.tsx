"use client";

import { PlusIcon } from "lucide-react";
import { QuickAddExpense } from "@/components/quick-add-expense";
import type { Account, Category } from "@/lib/db/schema";

/**
 * "Nuevo gasto" del header de escritorio: el unico boton de agregar gasto
 * en la pagina. El trigger se crea aqui (cliente) y no en el Server
 * Component, para no mandar JSX por props a traves del limite servidor/cliente.
 */
export function NewExpenseButton({
  accounts,
  categories,
}: {
  accounts: Account[];
  categories: Category[];
}) {
  return (
    <QuickAddExpense
      accounts={accounts}
      categories={categories}
      trigger={
        <button
          type="button"
          className="eb-btn-primary flex h-10 items-center gap-2 rounded-[20px] px-[18px] text-[14px]"
        >
          <PlusIcon size={16} strokeWidth={2.4} aria-hidden="true" />
          Nuevo gasto
        </button>
      }
    />
  );
}
