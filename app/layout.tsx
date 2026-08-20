import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { PwaViewport } from "@/components/pwa-viewport";
import { PwaServiceWorker } from "@/components/pwa-service-worker";
import { ThemeProvider } from "@/components/theme-provider";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <PwaViewport />
          <PwaServiceWorker />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
