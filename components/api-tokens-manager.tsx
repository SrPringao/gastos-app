"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon, KeyRoundIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ApiTokenRow = {
  id: number;
  name: string | null;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
};

type ExpiresIn = "7d" | "30d" | "90d" | "365d";

const EXPIRES_OPTIONS: { value: ExpiresIn; label: string }[] = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "365d", label: "1 año" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function tokenStatus(token: ApiTokenRow): {
  label: string;
  variant: "success" | "destructive" | "warning";
} {
  if (token.revokedAt) return { label: "Revocado", variant: "destructive" };
  if (new Date(token.expiresAt) < new Date())
    return { label: "Expirado", variant: "warning" };
  return { label: "Activo", variant: "success" };
}

export function ApiTokensManager({
  initialTokens,
}: {
  initialTokens: ApiTokenRow[];
}) {
  const [tokens, setTokens] = useState(initialTokens);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [expiresIn, setExpiresIn] = useState<ExpiresIn>("30d");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [clearingRevoked, setClearingRevoked] = useState(false);

  async function refreshTokens() {
    const listRes = await fetch("/api/auth/token", { cache: "no-store" });
    const listData = await listRes.json();
    setTokens(listData.tokens ?? []);
  }

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresIn, name: name.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al crear el token");
        return;
      }
      setNewToken(data.token);
      await refreshTokens();
      setName("");
    } catch {
      setError("Error al crear el token");
    } finally {
      setCreating(false);
    }
  }

  async function handleCopy() {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleCloseCreate(open: boolean) {
    setCreateOpen(open);
    if (!open) {
      setNewToken(null);
      setError(null);
      setCopied(false);
    }
  }

  async function handleRevoke(id: number) {
    setRevokingId(id);
    try {
      const res = await fetch(`/api/auth/token?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await refreshTokens();
      }
    } finally {
      setRevokingId(null);
    }
  }

  async function handleClearRevoked() {
    setClearingRevoked(true);
    try {
      const res = await fetch("/api/auth/token?revoked=true", {
        method: "DELETE",
      });
      if (res.ok) {
        await refreshTokens();
      }
    } finally {
      setClearingRevoked(false);
    }
  }

  const hasRevoked = tokens.some((t) => t.revokedAt);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <KeyRoundIcon className="size-5 opacity-70" />
            Tokens de API
          </CardTitle>
          <CardDescription>
            Usalos en el Atajo de iOS o automatizaciones para registrar gastos
          </CardDescription>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {hasRevoked && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleClearRevoked}
              disabled={clearingRevoked}
            >
              {clearingRevoked ? "Limpiando..." : "Limpiar revocados"}
            </Button>
          )}
          <Dialog open={createOpen} onOpenChange={handleCloseCreate}>
            <DialogTrigger asChild>
              <Button type="button" size="sm">
                Nuevo token
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-sm">
            {!newToken ? (
              <>
                <DialogHeader className="text-left">
                  <DialogTitle>Crear token</DialogTitle>
                  <DialogDescription>
                    El token solo se muestra una vez. Guardalo en un lugar
                    seguro.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="token-name">Nombre (opcional)</Label>
                    <Input
                      id="token-name"
                      placeholder="Ej. iPhone de Franco"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Expira en</Label>
                    <Select
                      value={expiresIn}
                      onValueChange={(v) => setExpiresIn(v as ExpiresIn)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPIRES_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {error && (
                    <p className="text-destructive text-sm">{error}</p>
                  )}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateOpen(false)}
                    disabled={creating}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCreate}
                    disabled={creating}
                  >
                    {creating ? "Creando..." : "Crear token"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <DialogHeader className="text-left">
                  <DialogTitle>Token creado</DialogTitle>
                  <DialogDescription>
                    Copialo ahora, no podras volver a verlo.
                  </DialogDescription>
                </DialogHeader>
                <div className="bg-muted flex items-center gap-2 rounded-md border p-3">
                  <code className="flex-1 overflow-x-auto text-xs break-all">
                    {newToken}
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
                <div className="mt-4 flex justify-end">
                  <Button type="button" onClick={() => setCreateOpen(false)}>
                    Listo
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {tokens.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No tienes tokens creados todavia.
          </p>
        ) : (
          <div className="space-y-2">
            {tokens.map((token) => {
              const status = tokenStatus(token);
              return (
                <div
                  key={token.id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {token.name || "Sin nombre"}
                      </p>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      Creado {formatDate(token.createdAt)} · Expira{" "}
                      {formatDate(token.expiresAt)}
                    </p>
                  </div>
                  {!token.revokedAt && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => handleRevoke(token.id)}
                      disabled={revokingId === token.id}
                      aria-label="Revocar token"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
