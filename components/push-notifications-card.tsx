"use client";

import { useEffect, useState } from "react";
import { BellIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  isIosDevice,
  isStandalonePwa,
  subscribeCurrentDevice,
} from "@/lib/push-notifications";

type DeviceRow = {
  id: number;
  deviceType: string | null;
  createdAt: string;
};

export function PushNotificationsCard() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [needsInstall, setNeedsInstall] = useState(false);
  const [needsHttps, setNeedsHttps] = useState(false);

  async function loadDevices() {
    const res = await fetch("/api/push-notifications/subscriptions");
    if (!res.ok) return;
    const data = (await res.json()) as { subscriptions?: DeviceRow[] };
    setDevices(data.subscriptions ?? []);
  }

  useEffect(() => {
    const standalone = isStandalonePwa();
    const ios = isIosDevice();
    if (!window.isSecureContext) {
      setNeedsHttps(true);
    } else if (ios && !standalone) {
      setNeedsInstall(true);
    } else if (
      "Notification" in window &&
      Notification.permission === "denied"
    ) {
      setBlocked(true);
    }
    loadDevices().finally(() => setLoading(false));
  }, []);

  async function handleEnable() {
    setBusy(true);
    setMessage(null);
    try {
      const ok = await subscribeCurrentDevice();
      if (!ok) {
        setMessage("No se pudo activar en este dispositivo.");
        return;
      }
      await loadDevices();
      setMessage("Notificaciones activadas en este dispositivo.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable(id: number) {
    setBusy(true);
    setMessage(null);
    try {
      await fetch(`/api/push-notifications/subscriptions/${id}`, {
        method: "DELETE",
      });
      await loadDevices();
    } finally {
      setBusy(false);
    }
  }

  async function handleTest() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/push-notifications/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "No se pudo enviar la prueba.");
        return;
      }
      setMessage(
        data.sent > 0
          ? "Prueba enviada. Bloquea el telefono y deberia aparecer el aviso."
          : "No hay dispositivos suscritos todavia."
      );
    } finally {
      setBusy(false);
    }
  }

  const cannotEnable = busy || blocked || needsInstall || needsHttps;

  return (
    <Card className="mb-4">
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-full">
            <BellIcon className="text-primary size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Notificaciones</p>
            <p className="text-muted-foreground text-xs">
              Activalas en este dispositivo para el resumen diario y avisos.
            </p>
          </div>
        </div>

        {needsHttps && (
          <p className="text-muted-foreground text-xs">
            Problema HTTPS.
          </p>
        )}
        {needsInstall && (
          <p className="text-muted-foreground text-xs">
            En iPhone: Safari, Compartir, Anadir a pantalla de inicio, y abre la
            app desde ahi.
          </p>
        )}
        {blocked && (
          <p className="text-destructive text-xs">
            El permiso esta bloqueado. Activalo en Ajustes del iPhone,
            Notificaciones, Gastos.
          </p>
        )}
        {message && <p className="text-muted-foreground text-xs">{message}</p>}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleEnable}
            disabled={cannotEnable}
          >
            {busy ? "Espera..." : "Activar en este dispositivo"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleTest}
            disabled={busy || devices.length === 0}
          >
            Enviar prueba
          </Button>
        </div>

        {!loading && devices.length > 0 && (
          <ul className="space-y-2">
            {devices.map((device) => (
              <li
                key={device.id}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span>
                  {device.deviceType || "dispositivo"} ·{" "}
                  {new Date(device.createdAt).toLocaleDateString("es-MX")}
                </span>
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => handleDisable(device.id)}
                >
                  Quitar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
