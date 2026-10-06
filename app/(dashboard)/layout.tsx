import { AppSidebar } from "@/components/app-sidebar";
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
import { MobileMenuProvider } from "@/components/mobile-menu-context";
import { MobileMenu } from "@/components/mobile-menu";

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
    <MobileMenuProvider>
      {/* Movil: fixed + inset 0 (con ! para ganarle al position: relative de
          .eb-page). Asi mide exactamente el viewport donde se pega la tab bar
          (fixed, bottom 0); con 100dvh, en la PWA de iPhone quedaba mas alto
          que la pantalla y el final del scroll se perdia debajo de la tab bar. */}
      <div
        className="eb-page h-screen h-[100dvh] max-md:fixed! max-md:inset-0 max-md:h-auto! flex w-full max-w-full overflow-hidden md:flex-row md:pl-[17rem]"
        style={{
          touchAction: 'none',
          overscrollBehavior: 'none'
        }}
      >
        <Grain />
        <AppSidebar />
        <div
          className="relative z-[1] flex h-full min-w-0 w-full flex-col"
          style={{
            touchAction: 'none',
            overscrollBehavior: 'none'
          }}
        >
          <DashboardMain>{children}</DashboardMain>
        </div>
        <MobileNav />
        <MobileMenu />
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
    </MobileMenuProvider>
  );
}
