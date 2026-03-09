"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpensesByDayStackedChart } from "./expenses-by-day-stacked-chart";
import { DayExpensesModal } from "./day-expenses-modal";

type DailyAccountPoint = {
  date: string;
  accountId: number;
  accountName: string;
  accountColor: string | null;
  total: number;
};

type Props = {
  data: DailyAccountPoint[];
};

export function ExpensesByDayCard({ data }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Gasto por dia (este mes)</CardTitle>
          <p className="text-muted-foreground text-sm font-normal">
            Barras apiladas por metodo de pago. Toca una barra para ver los gastos del dia.
          </p>
        </CardHeader>
        <CardContent>
          <ExpensesByDayStackedChart
            data={data}
            onBarClick={(date) => setSelectedDate(date)}
          />
        </CardContent>
      </Card>

      {selectedDate && (
        <DayExpensesModal
          date={selectedDate}
          onOpenChange={(open) => !open && setSelectedDate(null)}
        />
      )}
    </>
  );
}
