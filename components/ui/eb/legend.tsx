import { cn } from "@/lib/utils";
import type { PrivacyScope } from "@/components/privacy";
import { Money } from "./money";
import { SEGMENT_DOT_COLORS, type SegmentTone } from "./tones";

export type LegendItem = {
  key: string;
  label: string;
  /** Centavos */
  total: number;
  percent?: number;
  tone: SegmentTone;
};

function Dot({ tone }: { tone: SegmentTone }) {
  return (
    <span
      aria-hidden="true"
      className="size-2 shrink-0 rounded-full"
      style={{ background: SEGMENT_DOT_COLORS[tone] }}
    />
  );
}

/**
 * grid: escritorio, 3 columnas iguales (punto + nombre arriba, monto y %
 * abajo). list: movil, lista vertical con el monto a la derecha.
 */
export function Legend({
  items,
  layout = "grid",
  privacyScope,
  onSelect,
  className,
}: {
  items: LegendItem[];
  layout?: "grid" | "list";
  /** Ambito de privacidad de los montos, si son saldos privados */
  privacyScope?: PrivacyScope;
  /** Si se pasa, el nombre de cada cuenta abre su detalle */
  onSelect?: (item: LegendItem) => void;
  className?: string;
}) {
  const nameButton = (item: LegendItem, className: string) =>
    onSelect ? (
      <button
        type="button"
        onClick={() => onSelect(item)}
        className={cn("truncate text-left hover:underline hover:underline-offset-2", className)}
        aria-label={`Ver gastos de ${item.label}`}
      >
        {item.label}
      </button>
    ) : (
      <span className={cn("truncate", className)}>{item.label}</span>
    );

  if (layout === "list") {
    return (
      <div className={cn("flex flex-col gap-2.5", className)}>
        {items.map((item) => (
          <div key={item.key} className="flex items-center gap-2 text-[15px]">
            <Dot tone={item.tone} />
            {nameButton(item, "min-w-0 flex-1")}
            <Money value={item.total} private={privacyScope} className="font-semibold" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn("grid gap-3", className)}
      style={{ gridTemplateColumns: `repeat(${Math.max(items.length, 3)}, minmax(0, 1fr))` }}
    >
      {items.map((item) => (
        <div key={item.key} className="flex min-w-0 flex-col gap-1">
          <div className="text-eb-text-secondary flex items-center gap-2 text-[13px]">
            <Dot tone={item.tone} />
            {nameButton(item, "min-w-0")}
          </div>
          <div className="text-[17px] font-semibold">
            <Money value={item.total} private={privacyScope} />{" "}
            {item.percent !== undefined && (
              <span className="text-eb-text-tertiary text-[13px] font-normal">
                {item.percent}%
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
