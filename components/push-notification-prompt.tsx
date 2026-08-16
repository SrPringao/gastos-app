"use client";

import { useEffect, useState } from "react";
import { BellIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  isIosDevice,
  isStandalonePwa,
  subscribeCurrentDevice,
  syncExistingSubscription,
} from "@/lib/push-notifications";

const DISMISS_KEY = "gastos-push-prompt-dismissed";

function canAskPermission(): boolean {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return false;
  }
  if (!window.isSecureContext) return false;
  if (isIosDevice() && !isStandalonePwa()) return false;
  if (Notification.permission === "denied") return false;
  if (localStorage.getItem(DISMISS_KEY) === "1") return false;
  return true;
}

export function PushNotificationPrompt() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function maybePrompt() {
      if (!canAskPermission()) return;

      try {
        await navigator.serviceWorker.ready;
        const registration = await navigator.serviceWorker.getRegistration("/");
        const existing = await registration?.pushManager.getSubscription();
        if (existing) {
          await syncExistingSubscription();
          return;
        }
        if (Notification.permission === "granted") {
          await subscribeCurrentDevice();
          return;
        }
        if (!cancelled) {
          timer = setTimeout(() => {
            if (!cancelled) setOpen(true);
          }, 600);
        }
      } catch {
        // El canal no debe romper la app si el SW o VAPID fallan
      }
    }

    maybePrompt();

    function onInstalled() {
      maybePrompt();
    }

    window.addEventListener("appinstalled", onInstalled);
    const media = window.matchMedia("(display-mode: standalone)");
    const onDisplayMode = () => {
      maybePrompt();
    };
    media.addEventListener("change", onDisplayMode);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      window.removeEventListener("appinstalled", onInstalled);
      media.removeEventListener("change", onDisplayMode);
    };
  }, []);

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
  }

  async function handleEnable() {
    setBusy(true);
    setError(null);
    try {
      const ok = await subscribeCurrentDevice();
      if (!ok) {
        if (Notification.permission === "denied") {
          setError(
            "El permiso quedo bloqueado. Activalo en Ajustes del sistema."
          );
        } else {
          setError("No se pudo activar. Abre la app desde el icono de inicio.");
        }
        return;
      }
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2">
            <BellIcon className="size-5" />
            Activar notificaciones
          </DialogTitle>
          <DialogDescription>
            La app ya esta en tu telefono. Activa los avisos para el resumen
            diario de gastos y otros recordatorios. En iPhone solo funciona
            desde el icono de inicio.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleDismiss}
            disabled={busy}
          >
            Ahora no
          </Button>
          <Button type="button" onClick={handleEnable} disabled={busy}>
            {busy ? "Activando..." : "Activar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
