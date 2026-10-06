"use client";

import { useEffect, useSyncExternalStore } from "react";

type ToastAction = { label: string; onClick: () => void };
type Toast = { id: number; message: string; action?: ToastAction; duration: number };

// Store minimo en modulo: el toast sobrevive a router.refresh() y a que el
// componente que lo disparo cambie de estado.
let current: Toast | null = null;
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function showToast(input: { message: string; action?: ToastAction; duration?: number }) {
  current = { id: nextId++, duration: 5000, ...input };
  emit();
}

function dismiss(id: number) {
  if (current?.id === id) {
    current = null;
    emit();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Va una vez en el layout; muestra el toast activo abajo al centro */
export function Toaster() {
  const toast = useSyncExternalStore(subscribe, () => current, () => null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => dismiss(toast.id), toast.duration);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <div
      // En movil queda arriba de la tab bar; en escritorio, abajo
      className="pointer-events-none fixed inset-x-0 bottom-[calc(max(84px,50px+env(safe-area-inset-bottom))+16px)] z-[60] flex justify-center px-4 md:bottom-6 md:pl-[17rem]"
    >
      <div
        key={toast.id}
        role="status"
        aria-live="polite"
        className="eb-privacy-swap text-eb-text pointer-events-auto flex max-w-[460px] items-center gap-4 rounded-[14px] py-3 pr-3 pl-4 text-[14px]"
        style={{
          background: "var(--eb-tabbar-bg)",
          backdropFilter: "blur(20px) saturate(160%)",
          WebkitBackdropFilter: "blur(20px) saturate(160%)",
          boxShadow: "var(--eb-surface-shadow-sm), inset 0 0 0 1px var(--eb-tabbar-border)",
          fontFamily: "var(--eb-font)",
        }}
      >
        <span className="flex-1">{toast.message}</span>
        {toast.action && (
          <button
            type="button"
            className="eb-link shrink-0 rounded-[8px] px-2 py-1 text-[14px] font-semibold"
            onClick={() => {
              toast.action?.onClick();
              dismiss(toast.id);
            }}
          >
            {toast.action.label}
          </button>
        )}
      </div>
    </div>
  );
}
