"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { mobileNavItems, isNavItemActive } from "@/lib/nav-config";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="glass-surface fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 md:hidden">
      {mobileNavItems.map((item) => {
        const isActive = isNavItemActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex min-w-0 flex-1 flex-col items-center gap-1 px-3 py-1.5 transition-all duration-200 active:scale-95",
              isActive
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <item.icon
              className="size-5 shrink-0"
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span
              className={cn(
                "truncate text-[10px] font-medium transition-all duration-200",
                isActive ? "opacity-100" : "opacity-60"
              )}
            >
              {item.mobileLabel ?? item.label}
            </span>
            {isActive && (
              <div className="bg-primary shadow-[var(--glow-violet-sm)] absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
