"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { MenuIcon, LogOut, ChevronRightIcon, ChevronDownIcon } from "lucide-react";
import { navGroups, isNavItemActive } from "@/lib/nav-config";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const chromeButtonClass =
  "text-eb-text-secondary flex size-8 shrink-0 items-center justify-center rounded-full transition-colors hover:text-eb-text";
const chromeButtonStyle = {
  background: "var(--eb-glass-strong)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
};

/** Boton de las tres rayas que abre el menu lateral en movil. */
export function MobileMenuButton() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [manuallyOpen, setManuallyOpen] = useState<Record<string, boolean>>({});
  const activeTab = searchParams.get("tab") ?? undefined;

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.refresh();
    router.push("/login");
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button type="button" aria-label="Menu" className={chromeButtonClass} style={chromeButtonStyle}>
          <MenuIcon className="size-[18px]" strokeWidth={2.2} />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b px-5 py-8">
            <SheetTitle className="flex items-center justify-center">
              <Link
                href="/"
                className="flex items-center justify-center"
                onClick={() => setOpen(false)}
              >
                <Logo className="h-16" />
                <span className="sr-only">ExpenseBro</span>
              </Link>
            </SheetTitle>
          </SheetHeader>
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-1">
              {navGroups.map((group, groupIndex) => (
                <div key={group.label} className="contents">
                  {groupIndex > 0 && <div className="my-2 border-t border-border" />}
                  {group.items.map((item) => {
                    const isActive = isNavItemActive(pathname, item);

                    if (!item.subItems) {
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "group flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground"
                          )}
                        >
                          <item.icon
                            className={cn(
                              "size-5 shrink-0 transition-transform group-hover:scale-110",
                              isActive && "text-primary"
                            )}
                            strokeWidth={isActive ? 2.5 : 2}
                          />
                          <span className="flex-1">{item.label}</span>
                          {isActive && <div className="h-2 w-2 rounded-full bg-primary" />}
                          {!isActive && (
                            <ChevronRightIcon className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
                          )}
                        </Link>
                      );
                    }

                    const isOpen = isActive || manuallyOpen[item.label];
                    return (
                      <div key={item.label}>
                        <button
                          type="button"
                          onClick={() =>
                            setManuallyOpen((prev) => ({
                              ...prev,
                              [item.label]: !prev[item.label],
                            }))
                          }
                          className={cn(
                            "group flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground"
                          )}
                        >
                          <item.icon
                            className={cn(
                              "size-5 shrink-0 transition-transform group-hover:scale-110",
                              isActive && "text-primary"
                            )}
                            strokeWidth={isActive ? 2.5 : 2}
                          />
                          <span className="flex-1 text-left">{item.label}</span>
                          <ChevronDownIcon
                            className={cn("size-4 shrink-0 transition-transform", isOpen && "rotate-180")}
                          />
                        </button>
                        {isOpen && (
                          <div className="mt-1 flex flex-col gap-1 pl-4">
                            {item.subItems.map((sub) => {
                              const subActive = sub.tab
                                ? isActive && activeTab === sub.tab
                                : pathname === sub.href;
                              return (
                                <Link
                                  key={sub.tab ?? sub.href}
                                  href={sub.href}
                                  onClick={() => setOpen(false)}
                                  className={cn(
                                    "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                                    subActive
                                      ? "bg-primary/10 text-primary"
                                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                  )}
                                >
                                  <sub.icon
                                    className={cn(
                                      "size-4 shrink-0 transition-transform group-hover:scale-110",
                                      subActive && "text-primary"
                                    )}
                                    strokeWidth={subActive ? 2.5 : 2}
                                  />
                                  <span className="flex-1">{sub.label}</span>
                                  {subActive && <div className="h-2 w-2 rounded-full bg-primary" />}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </nav>
          <div className="border-t p-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 rounded-xl px-4 py-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="size-5 shrink-0" />
              <span className="font-medium">Cerrar sesion</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
