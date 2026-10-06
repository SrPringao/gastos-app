import { useId } from "react";

/**
 * Grano/ruido casi invisible sobre el fondo (seccion 2.5). Va detras del
 * contenido: el contenedor padre lleva `position: relative` y el contenido
 * `position: relative; z-index: 1`.
 */
export function Grain() {
  const id = useId().replace(/:/g, "");
  const filterId = `eb-grain-${id}`;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full mix-blend-overlay"
      style={{ opacity: "var(--eb-grain-opacity)" }}
    >
      <filter id={filterId}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.85"
          numOctaves={2}
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${filterId})`} />
    </svg>
  );
}
