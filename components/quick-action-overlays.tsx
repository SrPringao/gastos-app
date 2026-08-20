"use client";

import { useMemo } from "react";
import { QuickAddExpense } from "@/components/quick-add-expense";
import { ExpensesRangeModal } from "@/components/expenses-dashboard/day-expenses-modal";
import type { QuickActionKind } from "@/lib/nav-config";

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysAgoStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function QuickActionOverlays({
  active,
  onClose,
}: {
  active: QuickActionKind | null;
  onClose: () => void;
}) {
  const rangeModalProps = useMemo(() => {
    if (active === "expenses-today") {
      return { from: todayStr(), to: todayStr(), title: "Gastos de hoy" };
    }
    if (active === "expenses-week") {
      return { from: daysAgoStr(6), to: todayStr(), title: "Gastos de la semana" };
    }
    return null;
  }, [active]);

  return (
    <>
      {active === "add-expense" && (
        <QuickAddExpense open onOpenChange={(open) => !open && onClose()} />
      )}
      {rangeModalProps && (
        <ExpensesRangeModal
          from={rangeModalProps.from}
          to={rangeModalProps.to}
          title={rangeModalProps.title}
          open
          onOpenChange={(open) => !open && onClose()}
        />
      )}
    </>
  );
}
