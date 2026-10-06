"use client";

import { CalendarIcon } from "lucide-react";
import { EbCard } from "@/components/ui/eb/card";
import { Money } from "@/components/ui/eb/money";
import { CategoryTile } from "@/components/ui/eb/category-tile";
import type { UpcomingPayment } from "@/lib/dashboard-metrics";
import { cn } from "@/lib/utils";

export type UpcomingPaymentItem = Pick<UpcomingPayment, "daysLeft" | "label" | "isSoon"> & {
  id: number;
  name: string;
  amount: number;
};

/** Escritorio: las 3 deudas con fecha mas proximas, incluidas las de $0 */
export function UpcomingPaymentsCard({
  payments,
  className,
}: {
  payments: UpcomingPaymentItem[];
  className?: string;
}) {
  return (
    <EbCard className={cn("flex flex-col gap-1.5 px-[22px] pt-[22px] pb-[14px]", className)}>
      <div className="text-eb-text-secondary pb-1.5 text-[15px] font-medium">Próximos pagos</div>
      {payments.length === 0 ? (
        <p className="text-eb-text-tertiary flex flex-1 items-center text-[13px]">
          Agrega una fecha límite a tus deudas en Patrimonio para verlas aquí.
        </p>
      ) : (
        <div className="flex flex-1 flex-col">
          {payments.map((payment, index) => (
            <div
              key={payment.id}
              className={cn(
                "flex min-h-[52px] flex-1 items-center gap-2.5",
                index < payments.length - 1 && "border-eb-separator border-b"
              )}
            >
              <span
                aria-hidden="true"
                className="size-1.5 shrink-0 rounded-full"
                style={
                  payment.isSoon
                    ? { background: "#FF9F0A", boxShadow: "0 0 8px rgba(255,159,10,.8)" }
                    : { background: "#636366" }
                }
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[14px] font-medium">{payment.name}</span>
                <span
                  className={cn("text-[12px]", payment.isSoon ? "text-eb-orange" : "text-eb-text-tertiary")}
                >
                  {payment.label}
                </span>
              </div>
              <Money
                value={payment.amount}
                cents={false}
                private
                className={cn(
                  "text-[14px]",
                  payment.amount > 0 ? "font-semibold" : "text-eb-text-tertiary"
                )}
              />
            </div>
          ))}
        </div>
      )}
    </EbCard>
  );
}

/** Widget movil: la deuda mas proxima con saldo */
export function NextPaymentWidget({
  payment,
  className,
}: {
  payment: UpcomingPaymentItem | null;
  className?: string;
}) {
  return (
    <EbCard
      size="mobile"
      className={cn("flex aspect-square flex-col justify-between p-4", className)}
    >
      <div className="flex items-start justify-between">
        <div className="text-eb-text-secondary text-[13px] font-semibold">Próximo pago</div>
        <CategoryTile color="orange" icon={CalendarIcon} size={30} className="rounded-[9px]" />
      </div>
      {payment ? (
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="text-eb-text-tertiary truncate text-[12px]">{payment.name}</div>
          <Money value={payment.amount} size="md" private />
          <div
            className={cn("text-[12px]", payment.daysLeft <= 16 ? "text-eb-orange" : "text-eb-text-tertiary")}
          >
            {payment.label}
          </div>
        </div>
      ) : (
        <div className="text-eb-text-tertiary text-[12px]">Sin pagos pendientes</div>
      )}
    </EbCard>
  );
}
