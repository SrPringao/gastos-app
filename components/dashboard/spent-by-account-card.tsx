import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/dates";

type SpentByAccount = {
  accountId: number;
  accountName: string;
  accountType: string;
  total: number;
};

type SpentByAccountCardProps = {
  data: SpentByAccount[];
};

const typeLabels: Record<string, string> = {
  credit: "Credito",
  debit: "Debito",
  cash: "Efectivo",
};

export function SpentByAccountCard({ data }: SpentByAccountCardProps) {
  const total = data.reduce((acc, item) => acc + item.total, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Gastos por cuenta (este mes)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {data.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            No hay gastos este mes.
          </p>
        ) : (
          <div className="space-y-4">
            {data.map((item) => (
              <div key={item.accountId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.accountName}</p>
                    <p className="text-muted-foreground text-xs">
                      {typeLabels[item.accountType] || item.accountType}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">
                      {formatCurrency(item.total)}
                    </span>
                    <p className="text-muted-foreground text-xs">
                      {total > 0 ? Math.round((item.total / total) * 100) : 0}%
                    </p>
                  </div>
                </div>
                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{
                      width: `${total > 0 ? Math.max(4, Math.round((item.total / total) * 100)) : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
