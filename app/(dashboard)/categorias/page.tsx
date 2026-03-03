"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  TrashIcon,
  TagIcon,
  Loader2,
  ChevronRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

type Category = {
  id: number;
  name: string;
  color: string | null;
};

const COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16",
  "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6",
  "#8b5cf6", "#ec4899", "#f43f5e", "#64748b",
];

function AddCategoryModal({ onSuccess }: { onSuccess: () => void }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setName("");
    setColor(null);
    setError("");
  }

  async function handleSubmit() {
    if (!name.trim()) { setError("Ingresa un nombre."); return; }
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al guardar"); return; }
      onSuccess();
      setOpen(false);
      reset();
    } finally {
      setSaving(false);
    }
  }

  const content = (
    <div className="flex flex-col gap-6">
      {/* Nombre grande */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-muted-foreground text-sm">Nombre</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Restaurantes"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="w-full max-w-xs border-0 bg-transparent p-0 text-center text-3xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/50 focus:ring-0"
        />
      </div>

      {/* Paleta de color */}
      <div className="flex flex-col items-center gap-3">
        <span className="text-muted-foreground text-xs font-medium">Color (opcional)</span>
        <div className="flex flex-wrap justify-center gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(color === c ? null : c)}
              className={cn(
                "size-8 rounded-full transition-transform",
                color === c ? "ring-2 ring-offset-2 ring-offset-background scale-110" : "hover:scale-105"
              )}
              style={{ backgroundColor: c, ...(color === c ? { ringColor: c } : {}) }}
            />
          ))}
        </div>
        {color && (
          <button
            type="button"
            onClick={() => setColor(null)}
            className="text-muted-foreground text-xs underline"
          >
            Quitar color
          </button>
        )}
      </div>

      {/* Preview */}
      <div className="flex justify-center">
        <Badge
          style={color ? { backgroundColor: `${color}20`, color, borderColor: `${color}40` } : {}}
          variant="secondary"
          className="gap-1.5 px-3 py-1 text-sm"
        >
          <TagIcon className="size-3.5" />
          {name || "Vista previa"}
        </Badge>
      </div>

      {error && <p className="text-destructive text-center text-sm">{error}</p>}

      <Button
        onClick={handleSubmit}
        className="h-12 gap-2 rounded-xl"
        disabled={saving || !name.trim()}
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : <ChevronRightIcon className="size-4" />}
        {saving ? "Guardando..." : "Agregar categoría"}
      </Button>
    </div>
  );

  const trigger = (
    <Button size="lg" className="h-12 w-full gap-2 sm:h-10 sm:w-auto sm:min-w-[140px]">
      <PlusIcon className="size-5 shrink-0" />
      Agregar
    </Button>
  );

  return isMobile ? (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom" className="max-h-[90dvh] min-h-[60vh] overflow-y-auto">
        <SheetHeader className="sr-only">
          <SheetTitle>Nueva categoría</SheetTitle>
          <SheetDescription>Agregar una categoría</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6 pt-4">{content}</div>
      </SheetContent>
    </Sheet>
  ) : (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="sr-only">Nueva categoría</DialogTitle>
          <DialogDescription className="sr-only">Agregar una categoría</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

export default function CategoriasPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  function load() {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await fetch(`/api/categories/${id}`, { method: "DELETE" });
      setCategories((prev) => prev.filter((c) => c.id !== id));
      router.refresh();
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Categorías</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Administra las categorías de tus gastos
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <AddCategoryModal onSuccess={() => { load(); router.refresh(); }} />
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground py-12 text-center text-sm">Cargando categorías...</p>
      ) : categories.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          No tienes categorías. Agrega una con el botón de arriba.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="border-border flex items-center justify-between gap-3 rounded-xl border bg-background/50 p-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: cat.color ? `${cat.color}20` : "var(--muted)",
                    border: cat.color ? `2px solid ${cat.color}40` : undefined,
                  }}
                >
                  <TagIcon
                    className="size-4"
                    style={{ color: cat.color ?? "var(--muted-foreground)" }}
                  />
                </div>
                <span className="font-medium truncate">{cat.name}</span>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {confirmId === cat.id ? (
                  <>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="text-muted-foreground hover:text-foreground rounded-full px-3 py-1 text-xs transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      disabled={deletingId === cat.id}
                      className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors"
                    >
                      {deletingId === cat.id ? "..." : "Confirmar"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmId(cat.id)}
                    className="text-muted-foreground hover:text-destructive rounded-full p-1.5 transition-colors"
                  >
                    <TrashIcon className="size-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
