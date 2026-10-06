"use client";

import { useState } from "react";
import { EbCard } from "@/components/ui/eb/card";
import { Money } from "@/components/ui/eb/money";
import { SegmentedBar } from "@/components/ui/eb/segmented-bar";
import { Legend } from "@/components/ui/eb/legend";
import type { SpendSegment } from "@/lib/dashboard-metrics";
import { cn } from "@/lib/utils";
import { AccountExpensesModal } from "./account-expenses-modal";

type SpentCardProps = {
  /** "Gastado en octubre" / "Gastado este mes" */
  label: string;
  total: number;
  segments: SpendSegment[];
  monthKey: string;
  variant?: "desktop" | "mobile";
  className?: string;
};

/** KPI protagonista: gasto del mes, barra segmentada por cuenta y leyenda */
export function SpentCard({
  label,
  total,
  segments,
  monthKey,
  variant = "desktop",
  className,
}: SpentCardProps) {
  const [selected, setSelected] = useState<{ id: number; name: string } | null>(null);
  const isDesktop = variant === "desktop";
  const ariaLabel =
    segments.length > 0
      ? `Gasto por cuenta: ${segments.map((s) => `${s.label} ${s.percent}%`).join(", ")}`
      : "Sin gastos este mes";

  return (
    <EbCard
      variant={isDesktop ? "hero" : "default"}
      size={isDesktop ? "desktop" : "mobile"}
      className={cn(
        "flex flex-col",
        isDesktop ? "justify-between gap-6 px-7 py-[26px]" : "gap-[18px] p-5",
        className
      )}
    >
      <div className={cn("flex flex-col", isDesktop ? "gap-2" : "gap-1")}>
        <div
          className={cn(
            "text-[15px]",
            isDesktop ? "text-eb-text-secondary font-medium" : "text-eb-text-secondary"
          )}
        >
          {label}
        </div>
        <Money
          value={total}
          size={isDesktop ? "hero" : "hero-mobile"}
          className={cn(isDesktop && "text-eb-text-strong")}
        />
      </div>

      {segments.length > 0 ? (
        <div className={cn("flex flex-col", isDesktop ? "gap-[18px]" : "gap-[18px]")}>
          <SegmentedBar
            ariaLabel={ariaLabel}
            segments={segments.map((s) => ({ key: s.key, share: s.share, tone: s.tone }))}
          />
          <Legend
            layout={isDesktop ? "grid" : "list"}
            items={segments.map((s) => ({
              key: s.key,
              label: s.label,
              total: s.total,
              percent: s.percent,
              tone: s.tone,
            }))}
            onSelect={(item) => {
              // "Otras" agrupa varias cuentas: no tiene un detalle unico
              if (item.key !== "others") setSelected({ id: Number(item.key), name: item.label });
            }}
          />
        </div>
      ) : (
        <p className="text-eb-text-tertiary text-[13px]">Todavía no hay gastos este mes.</p>
      )}
      {selected && (
        <AccountExpensesModal
          accountId={selected.id}
          accountName={selected.name}
          monthKey={monthKey}
          onOpenChange={(open) => !open && setSelected(null)}
        />
      )}
    </EbCard>
  );
}
