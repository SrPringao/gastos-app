"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DeleteExpenseButtonProps = {
  expenseId: number;
  description?: string | null;
  onSuccess?: () => void;
};

export function DeleteExpenseButton({
  expenseId,
  description,
  onSuccess,
}: DeleteExpenseButtonProps) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirmDelete() {
    if (deleting) return;
    setError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setOpen(false);
        onSuccess?.();
      } else {
        const data = await res.json();
        setError(data.error || "Error al eliminar");
      }
    } catch {
      setError("Error al eliminar el gasto");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !deleting && setOpen(isOpen)}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          aria-label="Eliminar gasto"
        >
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader className="text-left">
          <DialogTitle>Eliminar gasto</DialogTitle>
          <DialogDescription>
            ¿Eliminar el gasto
            {description ? ` "${description}"` : ""}? Esta accion no se puede
            deshacer.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-destructive text-sm">
            {error}
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={deleting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={deleting}
          >
            {deleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
