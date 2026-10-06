"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SEGMENT_STYLES, type SegmentTone } from "./tones";

export type BarSegment = {
  key: string;
  /** % del total (0..100) */
  share: number;
  tone: SegmentTone;
};

type SegmentedBarProps = {
  segments: BarSegment[];
  /** 12px en dashboard, 14px en Patrimonio */
  height?: 12 | 14;
  ariaLabel: string;
  className?: string;
};

export function SegmentedBar({
  segments,
  height = 12,
  ariaLabel,
  className,
}: SegmentedBarProps) {
  // Las barras se llenan al montar
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const outerRadius = height / 2;
  const innerRadius = height === 14 ? 5 : 4;

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={cn("w-full overflow-hidden", className)}
      style={{
        height,
        borderRadius: outerRadius,
        padding: 2,
        background: "var(--eb-track)",
        boxShadow: "var(--eb-track-shadow)",
      }}
    >
      {/* El riel interno se revela de izquierda a derecha al montar con
          clip-path (sin animar el ancho, que recalcula layout). Los
          segmentos se reparten el ancho con flex-grow para que los huecos
          de 3px no empujen al ultimo fuera del riel. */}
      <div
        className="eb-anim flex h-full w-full"
        style={{
          gap: 3,
          clipPath: filled ? "inset(0 0 0 0)" : "inset(0 100% 0 0)",
          transition: "clip-path .6s cubic-bezier(.2,.8,.2,1)",
        }}
      >
        {segments.map((segment) => {
          const style = SEGMENT_STYLES[segment.tone];
          return (
            <div
              key={segment.key}
              style={{
                flex: `${segment.share} 1 0%`,
                minWidth: segment.share > 0 ? 4 : 0,
                borderRadius: innerRadius,
                background: style.background,
                boxShadow: style.glow,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
