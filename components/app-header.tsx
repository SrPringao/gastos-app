"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MenuIcon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/cuentas", label: "Cuentas" },
  { href: "/gastos", label: "Gastos" },
  { href: "/gastos-fijos", label: "Gastos Fijos" },
  { href: "/categorias", label: "Categorias" },
  { href: "/simulador", label: "Simulador" },
];

export function AppHeader() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.refresh();
    router.push("/login");
  }

  return (
    <header className="border-border bg-background flex h-14 shrink-0 items-center justify-between border-b px-4 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0">
            <MenuIcon className="size-5" />
            <span className="sr-only">Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72">
          <SheetHeader>
            <SheetTitle>
              <Link href="/" className="font-semibold">
                Gastos
              </Link>
            </SheetTitle>
          </SheetHeader>
          <nav className="mt-6 flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="hover:bg-accent rounded-lg px-3 py-2.5 text-sm"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto border-t pt-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="size-5 shrink-0" />
              Cerrar sesion
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      <Link href="/" className="font-semibold">
        Gastos
      </Link>
      <div className="w-10" />
    </header>
  );
}
