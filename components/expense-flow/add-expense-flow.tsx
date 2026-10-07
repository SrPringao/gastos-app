"use client";

import { useState } from "react";
import { ExpenseFlowSheet } from "./expense-flow-sheet";
import type { Account, Category } from "@/lib/db/schema";

/**
 * Monta el flujo "Nuevo gasto" y lo reinicia en cada apertura (key nueva)
 * sin desmontarlo al cerrar, para que se vea la animacion de salida.
 */
export function AddExpenseFlow({
  open,
  onClose,
  accounts,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  accounts?: Account[];
  categories?: Category[];
}) {
  const [key, setKey] = useState(0);
  const [lastOpen, setLastOpen] = useState(open);
  if (lastOpen !== open) {
    setLastOpen(open);
    if (open) setKey((k) => k + 1);
  }
  if (key === 0 && !open) return null;
  return (
    <ExpenseFlowSheet key={key} open={open} onClose={onClose} accounts={accounts} categories={categories} />
  );
}
