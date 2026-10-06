import { cn } from "@/lib/utils";
import { formatMoney, splitMoney, type MoneySign } from "@/lib/utils/money";

type MoneySize = "hero" | "hero-mobile" | "hero-net" | "md" | "sm";

/** Tamaños de numero heroe: parte entera / centavos (seccion 2.2) */
const HERO_SIZES: Record<"hero" | "hero-mobile" | "hero-net", [number, number]> = {
  hero: [58, 28],
  "hero-mobile": [44, 22],
  "hero-net": [48, 24],
};

type MoneyProps = {
  /** Monto en centavos */
  value: number;
  /**
   * hero*: SF Pro Rounded grande con centavos al 50% en gris.
   * md: numero secundario rounded 22px, sin centavos.
   * sm: hereda tipografia, con centavos (filas de lista).
   */
  size?: MoneySize;
  sign?: MoneySign;
  /** Fuerza mostrar u ocultar centavos (por defecto: hero/sm si, md no) */
  cents?: boolean;
  /** Separa los centavos en un span mas chico (por defecto solo en hero) */
  splitCents?: boolean;
  /** Oculta la cifra tras puntos (ojito de privacidad de Patrimonio) */
  hidden?: boolean;
  className?: string;
};

export function Money({
  value,
  size = "sm",
  sign,
  cents,
  splitCents,
  hidden = false,
  className,
}: MoneyProps) {
  const isHero = size === "hero" || size === "hero-mobile" || size === "hero-net";
  const showCents = cents ?? size !== "md";
  const split = (splitCents ?? isHero) && showCents;

  if (hidden) {
    return (
      <span
        aria-label="Monto oculto"
        className={cn(
          "select-none",
          isHero && "eb-rounded leading-none font-bold tracking-[-0.03em]",
          size === "md" && "eb-rounded text-[22px] font-bold tracking-[-0.02em]",
          className
        )}
        style={isHero ? { fontSize: HERO_SIZES[size][0] } : undefined}
      >
        ••••••
      </span>
    );
  }

  if (split) {
    const { whole, fraction } = splitMoney(value, { sign });
    const [wholePx, centsPx] = isHero ? HERO_SIZES[size] : [undefined, undefined];
    return (
      <span
        className={cn(
          "inline-flex items-baseline tabular-nums",
          isHero ? "eb-rounded gap-[2px] tracking-[-0.03em]" : "gap-px",
          className
        )}
      >
        <span
          className={cn(isHero && "leading-none font-bold")}
          style={wholePx ? { fontSize: wholePx } : undefined}
        >
          {whole}
        </span>
        {fraction && (
          <span
            className="text-eb-text-tertiary font-semibold"
            style={centsPx ? { fontSize: centsPx } : { fontSize: "0.5em" }}
          >
            {fraction}
          </span>
        )}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "tabular-nums",
        size === "md" && "eb-rounded text-[22px] font-bold tracking-[-0.02em]",
        className
      )}
    >
      {formatMoney(value, { cents: showCents, sign })}
    </span>
  );
}
