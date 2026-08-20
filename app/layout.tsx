import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { PwaViewport } from "@/components/pwa-viewport";
import { PwaServiceWorker } from "@/components/pwa-service-worker";
import { PreferencesProvider } from "@/components/preferences-provider";
import { getCurrentUserId } from "@/lib/auth";
import { getUserPreferences } from "@/lib/services/preferences";
import type { UserPreferencesData } from "@/lib/services/preferences";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ExpenseBro",
  description: "Control de gastos personales",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ExpenseBro",
  },
  // Iconos declarados a mano (no via convencion de archivo) porque cada
  // uno lleva su propio media query: favicon/apple-touch-icon cambian de
  // logo claro/oscuro segun el tema del sistema, igual que el resto de la app.
  icons: {
    icon: [
      {
        url: "/icon-192.png",
        media: "(prefers-color-scheme: dark)",
        type: "image/png",
      },
      {
        url: "/icon-192-light.png",
        media: "(prefers-color-scheme: light)",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/apple-icon-dark.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/apple-icon-light.png",
        media: "(prefers-color-scheme: light)",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e0e" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Preferencias leidas en el servidor antes del primer render: el tema ya
  // llega correcto en el HTML servido (sin localStorage, sin flash, sin
  // next-themes). Sin sesion (login/registro) se usan los defaults.
  const userId = await getCurrentUserId();
  const preferences: UserPreferencesData = userId
    ? await getUserPreferences(userId)
    : { theme: "dark", hideNetWorthAmounts: false, mobileNavHrefs: null };

  return (
    <html
      lang="es"
      className={preferences.theme === "dark" ? "dark" : undefined}
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <PreferencesProvider initial={preferences}>
          <PwaViewport />
          <PwaServiceWorker />
          {children}
        </PreferencesProvider>
      </body>
    </html>
  );
}
