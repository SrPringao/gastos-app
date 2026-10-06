"use client";

import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/utils";

const RING_SIZES = {
  desktop: { size: 92, radius: 38, stroke: 11, font: 21 },
  mobile: { size: 62, radius: 25, stroke: 8, font: 13 },
} as const;

type ProgressRingProps = {
  /** 0..n; arriba de 1 el anillo se dibuja lleno en modo excedido */
  ratio: number;
  size?: keyof typeof RING_SIZES;
  /** Texto del centro (por defecto el % redondeado) */
  label?: string;
  ariaLabel: string;
  className?: string;
};

export function ProgressRing({
  ratio,
  size = "desktop",
  label,
  ariaLabel,
  className,
}: ProgressRingProps) {
  const spec = RING_SIZES[size];
  const gradientId = `eb-ring-${useId().replace(/:/g, "")}`;
  const circumference = 2 * Math.PI * spec.radius;
  const exceeded = ratio > 1;
  const clamped = Math.max(0, Math.min(1, ratio));

  // El anillo se llena al montar
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  const progress = filled ? circumference * clamped : 0;
  const center = spec.size / 2;

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={cn("relative flex-none", className)}
      style={{ width: spec.size, height: spec.size }}
    >
      <svg
        width={spec.size}
        height={spec.size}
        viewBox={`0 0 ${spec.size} ${spec.size}`}
        className="overflow-visible"
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={exceeded ? "#FF9F0A" : "var(--eb-accent-light)"} />
            <stop offset="1" stopColor={exceeded ? "#FF453A" : "var(--eb-accent)"} />
          </linearGradient>
        </defs>
        <circle
          cx={center}
          cy={center}
          r={spec.radius}
          fill="none"
          stroke="var(--eb-ring-track)"
          strokeWidth={spec.stroke}
        />
        {clamped > 0 && (
          <circle
            cx={center}
            cy={center}
            r={spec.radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={spec.stroke}
            strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference}`}
            className="eb-anim"
            style={{
              filter: exceeded
                ? "drop-shadow(0 0 6px rgba(255,69,58,0.45))"
                : "drop-shadow(0 0 6px var(--eb-accent-glow))",
              transition: "stroke-dasharray .6s cubic-bezier(.2,.8,.2,1)",
            }}
          />
        )}
      </svg>
      <div
        className="eb-rounded absolute inset-0 flex items-center justify-center font-bold tracking-[-0.02em]"
        style={{ fontSize: spec.font }}
        aria-hidden="true"
      >
        {label ?? `${Math.round(ratio * 100)}%`}
      </div>
    </div>
  );
}
