import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { MobileNav, DashboardMain } from "@/components/mobile-nav";
import { DesktopQuickMenu } from "@/components/desktop-quick-menu";
import { PushNotificationPrompt } from "@/components/push-notification-prompt";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="bg-muted/30 h-screen h-[100dvh] flex overflow-hidden w-full max-w-full md:flex-row"
      style={{
        touchAction: 'none',
        overscrollBehavior: 'none'
      }}
    >
      <AppSidebar />
      <div
        className="flex flex-col h-full w-full relative md:ml-[17rem]"
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
        <DashboardMain>{children}</DashboardMain>
      </div>
      <MobileNav />
      <DesktopQuickMenu />
      <PushNotificationPrompt />
    </div>
  );
}
