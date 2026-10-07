"use client";

import { useMemo } from "react";
import { AddExpenseFlow } from "@/components/expense-flow/add-expense-flow";
import { ExpensesRangeModal } from "@/components/expenses-dashboard/day-expenses-modal";
import type { QuickActionKind } from "@/lib/nav-config";
import {
  mondayOfCurrentWeekDateString,
  todayDateString,
} from "@/lib/utils/dates";

export function QuickActionOverlays({
  active,
  onClose,
}: {
  active: QuickActionKind | null;
  onClose: () => void;
}) {
  const rangeModalProps = useMemo(() => {
    if (active === "expenses-today") {
      const today = todayDateString();
      return { from: today, to: today, title: "Gastos de hoy" };
    }
    if (active === "expenses-week") {
      return {
        from: mondayOfCurrentWeekDateString(),
        to: todayDateString(),
        title: "Gastos de la semana",
      };
    }
    return null;
  }, [active]);

  return (
    <>
      <AddExpenseFlow open={active === "add-expense"} onClose={onClose} />
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
