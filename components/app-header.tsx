"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileMenuButton } from "@/components/mobile-menu-button";

/**
 * Barra superior movil. Ocupa la franja del safe area: menu, tema y recarga.
 * En escritorio no se muestra; ahi vive el sidebar.
 */
export function AppHeader() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  function handleRefresh() {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1500);
  }

  return (
    <header
      className="md:hidden px-4"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        background: "var(--eb-tabbar-bg)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--eb-tabbar-border)",
      }}
    >
      <div className="flex h-11 items-center justify-between">
        <MobileMenuButton />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            aria-label="Actualizar"
            title="Actualizar"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-eb-text-secondary flex size-8 items-center justify-center rounded-full transition-colors hover:text-eb-text disabled:opacity-50"
            style={{
              background: "var(--eb-glass-strong)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            <RefreshCw className={`size-[18px] ${isRefreshing ? "animate-spin" : ""}`} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </header>
  );
}
