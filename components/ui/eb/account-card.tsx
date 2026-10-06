import { BanknoteIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { accountTone } from "@/lib/account-colors";
import { Money } from "./money";

const CHIPS = {
  gold: "linear-gradient(135deg, #F3E1A6, #C9A55A)",
  silver: "linear-gradient(135deg, #E9EAEE, #A8ABB5)",
} as const;

type AccountCardProps = {
  name: string;
  /** "Débito", "En mano"... */
  typeLabel: string;
  /** Centavos; se muestra sin centavos */
  balance: number;
  color: string | null;
  isCash?: boolean;
  chip?: keyof typeof CHIPS;
  /** grid: llena su celda (escritorio). carousel: 168x106 sin chip (movil). */
  variant?: "grid" | "carousel";
  hidden?: boolean;
  className?: string;
};

/** Tarjeta fisica: degradado diagonal, reflejo, chip (seccion 3.8) */
export function AccountCard({
  name,
  typeLabel,
  balance,
  color,
  isCash = false,
  chip = "gold",
  variant = "grid",
  hidden = false,
  className,
}: AccountCardProps) {
  const tone = accountTone(color);
  const isCarousel = variant === "carousel";

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between overflow-hidden rounded-[16px] p-[14px] text-white",
        isCarousel && "h-[106px] w-[168px] flex-none",
        className
      )}
      style={{
        background: `radial-gradient(120% 90% at 100% 0%, rgba(255,255,255,0.2), rgba(255,255,255,0) 55%), linear-gradient(145deg, ${tone.light} 0%, ${tone.dark} 100%)`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.28), inset 0 0 0 1px rgba(255,255,255,0.1), 0 14px 28px -14px ${tone.shadow}`,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn("truncate text-[14px]", isCarousel ? "font-semibold" : "font-bold")}>
          {name}
        </span>
        {!isCarousel &&
          (isCash ? (
            <BanknoteIcon
              aria-hidden="true"
              className="size-5 shrink-0"
              strokeWidth={1.8}
              color="rgba(255,255,255,0.85)"
            />
          ) : (
            <span
              aria-hidden="true"
              className="h-[19px] w-[26px] shrink-0 rounded-[4px]"
              style={{ background: CHIPS[chip], boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)" }}
            />
          ))}
      </div>
      <div className="flex flex-col gap-px">
        <span className={cn(isCarousel ? "text-[12px] text-white/80" : "text-[11px] text-white/[0.78]")}>
          {typeLabel}
        </span>
        <Money
          value={balance}
          cents={false}
          hidden={hidden}
          className={cn(
            "font-bold",
            isCarousel ? "text-[18px]" : "eb-rounded text-[19px] tracking-[-0.01em]"
          )}
        />
      </div>
    </div>
  );
}
