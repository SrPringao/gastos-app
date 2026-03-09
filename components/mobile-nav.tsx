"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  ReceiptIcon,
  FlaskConicalIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Inicio", icon: LayoutDashboardIcon },
  { href: "/gastos", label: "Gastos", icon: ReceiptIcon },
  { href: "/simulador", label: "Simulador", icon: FlaskConicalIcon },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="border-border/60 fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] backdrop-blur-2xl md:hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.94)' }}>
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));
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
              {item.label}
            </span>
            {isActive && (
              <div className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
