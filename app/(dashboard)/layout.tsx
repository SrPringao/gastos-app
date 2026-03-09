import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { MobileNav } from "@/components/mobile-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div 
      className="h-screen h-[100dvh] flex overflow-hidden w-full max-w-full md:flex-row"
      style={{ 
        touchAction: 'none',
        overscrollBehavior: 'none'
      }}
    >
      <AppSidebar />
      <div 
        className="flex flex-col h-full w-full relative"
        style={{ 
          touchAction: 'none',
          overscrollBehavior: 'none'
        }}
      >
        <div 
          className="sticky top-0 z-50 flex-shrink-0"
          style={{ 
            touchAction: 'none'
          }}
        >
          <AppHeader />
        </div>
        <main 
          data-scrollable
          className="flex-1 overflow-y-auto overflow-x-hidden w-full overscroll-contain bg-muted/30 pb-20 md:pb-0"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
            overscrollBehavior: 'contain',
            overscrollBehaviorY: 'contain'
          }}
        >
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
