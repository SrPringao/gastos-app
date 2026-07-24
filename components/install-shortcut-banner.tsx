"use client";

import { useEffect, useState } from "react";
import { CheckIcon, CopyIcon, DownloadIcon, SmartphoneIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SHORTCUT_URL =
  "https://www.icloud.com/shortcuts/0e56642c06aa413bba99a12582a259c4";
const DEFAULT_NAME_BASE = "Shortcut Apple Pay";

function isMobileUserAgent(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export function InstallShortcutBanner() {
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileUserAgent());
  }, []);

  function handleOpenBanner() {
    setOpen(true);
  }

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expiresIn: "365d",
          name: name.trim() || undefined,
          autoNameBase: name.trim() ? undefined : DEFAULT_NAME_BASE,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al crear el token");
        return;
      }
      setToken(data.token);
    } catch {
      setError("Error al crear el token");
    } finally {
      setCreating(false);
    }
  }

  async function handleCopy() {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleContinue() {
    setOpen(false);
    window.location.href = SHORTCUT_URL;
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setName("");
      setToken(null);
      setError(null);
      setCopied(false);
    }
  }

  if (!isMobile) return null;

  return (
    <>
      <Card className="mb-6 border-primary/30 bg-primary/5">
        <CardContent className="flex items-center gap-4">
          <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-full">
            <SmartphoneIcon className="text-primary size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              Instala el Atajo de Apple Pay
            </p>
            <p className="text-muted-foreground text-xs">
              Genera tu token y agrega la automatizacion en un solo paso
            </p>
          </div>
          <Button type="button" size="sm" onClick={handleOpenBanner}>
            <DownloadIcon className="size-4" />
            Instalar
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-sm">
          {!token ? (
            <>
              <DialogHeader className="text-left">
                <DialogTitle>Nombra tu token</DialogTitle>
                <DialogDescription>
                  Te ayuda a identificarlo despues, por ejemplo con el nombre
                  de tu telefono. Si lo dejas en blanco le ponemos un nombre
                  por ti.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5">
                <Label htmlFor="shortcut-token-name">Nombre (opcional)</Label>
                <Input
                  id="shortcut-token-name"
                  placeholder="Ej. iPhone de Franco"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={creating}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                >
                  {creating ? "Generando..." : "Generar token"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader className="text-left">
                <DialogTitle>Copia tu token</DialogTitle>
                <DialogDescription>
                  Copia tu token antes de integrar el Shortcut. Lo vas a
                  necesitar pegar cuando Atajos te lo pida al importar.
                </DialogDescription>
              </DialogHeader>
              <div className="bg-muted flex items-center gap-2 rounded-md border p-3">
                <code className="flex-1 overflow-x-auto text-xs break-all">
                  {token}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={handleCopy}
                  aria-label="Copiar token"
                >
                  {copied ? (
                    <CheckIcon className="size-4 text-emerald-500" />
                  ) : (
                    <CopyIcon className="size-4" />
                  )}
                </Button>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="button" onClick={handleContinue}>
                  Listo, continuar
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
