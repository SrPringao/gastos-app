"use client";

import { useRouter } from "next/navigation";
import { AddFixedExpenseModal } from "./add-fixed-expense-modal";

export function AddFixedExpenseTrigger() {
  const router = useRouter();
  return <AddFixedExpenseModal onSuccess={() => router.refresh()} />;
}
