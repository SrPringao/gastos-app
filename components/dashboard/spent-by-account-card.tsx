"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/dates";
import { AccountExpensesModal } from "./account-expenses-modal";

type SpentByAccount = {
  accountId: number;
  accountName: string;
  accountType: string;
  accountColor?: string | null;
  total: number;
};

type SpentByAccountCardProps = {
  data: SpentByAccount[];
  monthKey?: string;
};

const typeLabels: Record<string, string> = {
  credit: "Credito",
  debit: "Debito",
  cash: "Efectivo",
};

export function SpentByAccountCard({ data, monthKey }: SpentByAccountCardProps) {
  const [selectedAccount, setSelectedAccount] = useState<{
    id: number;
    name: string;
  } | null>(null);
  
  const total = data.reduce((acc, item) => acc + item.total, 0);

  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Gastos por cuenta</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col">
          {data.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No hay gastos este mes.
            </p>
          ) : (
            <div className="-mx-8 space-y-1">
              {data.map((item) => (
                <button
                  key={item.accountId}
                  onClick={() =>
                    setSelectedAccount({
                      id: item.accountId,
                      name: item.accountName,
                    })
                  }
                  className="hover:bg-secondary/60 block w-full px-8 py-3 text-left transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.accountName}</p>
                      <p className="text-muted-foreground text-xs">
                        {typeLabels[item.accountType] || item.accountType}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="font-figures font-medium">
                        {formatCurrency(item.total)}
                      </span>
                      <p className="font-figures text-muted-foreground text-xs">
                        {total > 0 ? Math.round((item.total / total) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                  <div className="bg-muted mt-3 h-1.5 w-full overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${total > 0 ? Math.max(4, Math.round((item.total / total) * 100)) : 0}%`,
                        backgroundColor: item.accountColor || "var(--primary)",
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedAccount && (
        <AccountExpensesModal
          accountId={selectedAccount.id}
          accountName={selectedAccount.name}
          monthKey={monthKey}
          onOpenChange={(open) => !open && setSelectedAccount(null)}
        />
      )}
    </>
  );
}
