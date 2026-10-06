import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { MobileNav, DashboardMain } from "@/components/mobile-nav";
import { DesktopQuickMenu } from "@/components/desktop-quick-menu";
import { PushNotificationPrompt } from "@/components/push-notification-prompt";
import { SetupReminderPrompt } from "@/components/setup-reminder-prompt";
import { getCurrentUserId } from "@/lib/auth";
import { getAccounts } from "@/lib/services/accounts";
import { getMonthlyBudget } from "@/lib/services/monthly-budgets";
import { Grain } from "@/components/ui/eb/grain";
import { PrivacyShortcut } from "@/components/privacy";
import { Toaster } from "@/components/ui/eb/toast";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getCurrentUserId();
  const monthKey = `${new Date().getFullYear()}-${String(
    new Date().getMonth() + 1
  ).padStart(2, "0")}`;

  const [accounts, budget] = userId
    ? await Promise.all([
        getAccounts(userId),
        getMonthlyBudget(userId, monthKey),
      ])
    : [[], null];

  return (
    <div
      className="eb-page h-screen h-[100dvh] flex w-full max-w-full overflow-hidden md:flex-row md:pl-[17rem]"
      style={{
        touchAction: 'none',
        overscrollBehavior: 'none'
      }}
    >
      <Grain />
      {/* El sidebar conserva su look original, incluida su tipografia */}
      <div className="eb-legacy-font contents">
        <AppSidebar />
      </div>
      <div
        className="relative z-[1] flex h-full min-w-0 w-full flex-col"
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
      <PrivacyShortcut />
      <Toaster />
      <DesktopQuickMenu />
      <PushNotificationPrompt />
      {userId && (
        <SetupReminderPrompt
          hasBudget={budget !== null}
          hasAccount={accounts.length > 0}
          monthKey={monthKey}
        />
      )}
    </div>
  );
}
