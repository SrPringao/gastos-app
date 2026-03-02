import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { MobileNav } from "@/components/mobile-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden md:flex-row">
      <AppSidebar />
      <AppHeader />
      <main className="min-h-0 flex-1 overflow-y-auto bg-muted/30 pb-20 md:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
