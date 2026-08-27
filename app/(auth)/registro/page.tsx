"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegistroPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          displayName: displayName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al registrar");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-[30px] shadow-[var(--glow-card)]">
      {/* Header solido de marca: el unico lugar del sistema donde el
          gradiente violeta-azul se usa como fill, no como halo difuminado. */}
      <div
        className="flex flex-col items-center gap-3 px-8 pt-12 pb-16 text-white"
        style={{ background: "var(--gradient-signal)" }}
      >
        <img src="/logo-dark.svg" alt="" className="h-16 w-auto" aria-hidden />
        <p className="text-lg font-semibold">ExpenseBro</p>
        <p className="text-sm text-white/80">Empieza gratis</p>
      </div>

      {/* Panel de vidrio montado sobre el bloque de color, jalado hacia
          arriba para que se lea como una sola pieza flotando sobre el header. */}
      <div className="glass-surface -mt-8 rounded-t-[30px] border-t p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
              autoComplete="email"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimo 6 caracteres"
              required
              minLength={6}
              autoComplete="new-password"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="displayName">Nombre (opcional)</Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Tu nombre"
              autoComplete="name"
              className="mt-2"
            />
          </div>
          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Registrando..." : "Registrarse"}
          </Button>
          <p className="text-muted-foreground text-center text-sm">
            Ya tienes cuenta?{" "}
            <Link href="/login" className="text-primary underline underline-offset-4">
              Inicia sesion
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
