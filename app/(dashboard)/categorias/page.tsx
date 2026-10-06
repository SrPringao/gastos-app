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
import { EbCard } from "@/components/ui/eb/card";

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
          className="eb-rounded w-full max-w-xs border-0 bg-transparent p-0 text-center text-3xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/50 focus:ring-0"
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
    <button
      type="button"
      className="eb-btn-primary flex h-10 items-center gap-2 rounded-[20px] px-[18px] text-[14px]"
    >
      <PlusIcon size={16} strokeWidth={2.4} aria-hidden="true" />
      Agregar
    </button>
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
    <div className="mx-auto flex max-w-[1120px] flex-col gap-7 px-4 pt-4 pb-16 md:px-6 md:pt-10 lg:px-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
            <div className="text-eb-text-tertiary text-[13px] font-semibold tracking-[0.04em] uppercase">
              Organiza tus gastos
            </div>
            <h1 className="eb-title">Categorías</h1>
        </div>
        <AddCategoryModal onSuccess={() => { load(); router.refresh(); }} />
      </header>

      {loading ? (
        <p className="text-eb-text-tertiary py-12 text-center text-[14px]">Cargando categorías...</p>
      ) : categories.length === 0 ? (
        <EbCard className="text-eb-text-tertiary px-6 py-12 text-center text-[14px]">
          No tienes categorías. Agrega una con el botón de arriba.
        </EbCard>
      ) : (
        <EbCard className="grid overflow-hidden sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="eb-row border-eb-separator flex min-h-[60px] items-center justify-between gap-3 border-b px-5 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Tile estilo Ajustes de iOS con el color de la categoria */}
                <div
                  aria-hidden="true"
                  className="eb-tile size-9 rounded-[10px]"
                  style={{
                    background: cat.color
                      ? `linear-gradient(180deg, ${cat.color}, color-mix(in srgb, ${cat.color} 70%, black))`
                      : "linear-gradient(180deg, #6E6E75, #48484E)",
                  }}
                >
                  <TagIcon size={18} strokeWidth={2} />
                </div>
                <span className="truncate text-[15px] font-medium">{cat.name}</span>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {confirmId === cat.id ? (
                  <>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="text-eb-text-tertiary hover:text-eb-text h-[30px] px-2 text-[13px]"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      disabled={deletingId === cat.id}
                      className="text-eb-red h-[30px] rounded-[9px] bg-[rgba(255,105,97,0.14)] px-3 text-[13px] font-medium"
                    >
                      {deletingId === cat.id ? "..." : "Confirmar"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmId(cat.id)}
                    aria-label={`Eliminar ${cat.name}`}
                    className="text-eb-red flex size-[30px] items-center justify-center rounded-[9px] bg-[rgba(255,105,97,0.14)]"
                  >
                    <TrashIcon size={14} strokeWidth={2} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </EbCard>
      )}
    </div>
  );
}
