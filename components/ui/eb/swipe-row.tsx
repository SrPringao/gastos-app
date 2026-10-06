"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Cada accion revelada mide 74px de ancho (seccion 3.11) */
const ACTION_WIDTH = 74;

type SwipeRowProps = {
  /** Botones que quedan detras de la fila (Editar, Borrar) */
  actions: React.ReactNode[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
};

/**
 * Fila deslizable con pointer events: arrastrar a la izquierda revela las
 * acciones. Solo se mueve en horizontal; el scroll vertical sigue nativo.
 */
export function SwipeRow({ actions, open, onOpenChange, children, className }: SwipeRowProps) {
  const revealWidth = ACTION_WIDTH * actions.length;
  const [dragX, setDragX] = useState<number | null>(null);
  const start = useRef<{ x: number; y: number; base: number; locked: "x" | "y" | null } | null>(null);
  const moved = useRef(false);
  // Ultimo desplazamiento: en un ref para que pointerup no lea un estado viejo
  const latestX = useRef<number | null>(null);

  const offset = dragX ?? (open ? -revealWidth : 0);

  function handlePointerDown(e: React.PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY, base: open ? -revealWidth : 0, locked: null };
    moved.current = false;
  }

  function handlePointerMove(e: React.PointerEvent) {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (!s.locked) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      s.locked = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (s.locked === "x") (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    if (s.locked !== "x") return;
    moved.current = true;
    const next = Math.max(-revealWidth, Math.min(0, s.base + dx));
    latestX.current = next;
    setDragX(next);
  }

  function handlePointerUp() {
    const s = start.current;
    const finalX = latestX.current;
    start.current = null;
    latestX.current = null;
    if (!s || s.locked !== "x" || finalX === null) {
      setDragX(null);
      return;
    }
    onOpenChange(finalX < -revealWidth / 2);
    setDragX(null);
  }

  return (
    <div className={cn("eb-row relative flex overflow-hidden", className)}>
      {/* Siempre montadas: los dialogos que abren viven dentro de ellas */}
      <div
        className={cn("absolute inset-y-0 right-0 flex", offset === 0 && "invisible")}
        style={{
          width: revealWidth,
          // Se ocultan hasta que la fila termina de regresar
          transition: offset === 0 ? "visibility 0s linear .25s" : "visibility 0s",
        }}
      >
        {actions}
      </div>
      <div
        className="relative w-full select-none"
        style={{
          transform: `translateX(${offset}px)`,
          // Fondo y sombra se quitan hasta que la fila termina de regresar (.25s,
          // igual que las acciones): si se quitaran al soltar, la fila regresaria
          // transparente y se verian Editar/Borrar a traves de ella
          transition: [
            dragX === null ? "transform .25s cubic-bezier(.2,.8,.2,1)" : "transform 0s",
            offset < 0 ? "background-color 0s, box-shadow 0s" : "background-color 0s linear .25s, box-shadow 0s linear .25s",
          ].join(", "),
          touchAction: "pan-y",
          backgroundColor: offset < 0 ? "var(--eb-row-raised)" : "transparent",
          boxShadow: offset < 0 ? "8px 0 16px -6px rgba(0,0,0,.6)" : "none",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClickCapture={(e) => {
          // Un tap con la fila abierta solo la cierra
          if (moved.current || open) {
            e.preventDefault();
            e.stopPropagation();
            if (open && !moved.current) onOpenChange(false);
          }
          moved.current = false;
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Boton de accion de 74px que queda detras de la fila */
export const SwipeAction = ({
  label,
  icon,
  tone,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  label: string;
  icon: React.ReactNode;
  tone: "neutral" | "destructive";
}) => (
  <button
    type="button"
    className={cn(
      "flex h-full flex-col items-center justify-center gap-[3px] text-[13px] font-medium text-white",
      className
    )}
    style={{ width: ACTION_WIDTH, background: tone === "destructive" ? "#E5484D" : "#636366" }}
    {...props}
  >
    {icon}
    {label}
  </button>
);
