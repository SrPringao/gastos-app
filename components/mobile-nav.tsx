"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  CreditCardIcon,
  ReceiptIcon,
  PieChartIcon,
  FlaskConicalIcon,
  ReceiptTextIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/gastos", label: "Gastos", icon: ReceiptIcon },
  { href: "/gastos-fijos", label: "Fijos", icon: ReceiptTextIcon },
  { href: "/simulador", label: "Simulador", icon: FlaskConicalIcon },
  { href: "/cuentas", label: "Cuentas", icon: CreditCardIcon },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="border-border bg-background fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:hidden">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-w-0 flex-col items-center gap-1 px-2 py-3 text-xs transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="size-5 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
