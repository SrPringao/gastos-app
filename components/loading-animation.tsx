import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type LoadingAnimationProps = {
  className?: string;
};

export function LoadingAnimation({ className }: LoadingAnimationProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        className
      )}
    >
      <Loader2 className="size-10 animate-spin text-muted-foreground" />
      <p className="text-lg font-medium text-foreground">Cargando</p>
    </div>
  );
}
