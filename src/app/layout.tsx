import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserDataProvider } from "@/context/user-data-context";
import { StoriesProvider } from "@/context/stories-context";
import { MessageNotificationProvider } from "@/context/message-notification-context";
import { PresenceProvider } from "@/context/presence-provider";
import { ToastProvider } from "@/context/toast-context";
import { MobileNavWrapper } from "@/components/mobile-nav-wrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { PWAInit } from "@/components/pwa-init";

export const metadata: Metadata = {
  title: "Gyral — Forge Your Discipline",
  description: "A cognitive architecture and habit formation system. Track habits, conquer goals, and hold yourself accountable with an AI mentor by your side.",
  manifest: "/manifest.json",
  icons: {
    icon: '/icons/icon-192.png',
    shortcut: '/icons/icon-192.png',
    apple: '/icons/icon-512.png',
  }
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

import { ExileOverlay } from "@/components/global/exile-overlay";
import { OnboardingWrapper } from "@/components/onboarding-wrapper";
import { AuthSync } from "@/components/auth-sync";
import { CapacitorAuthHandler } from "@/components/capacitor-auth-handler";

import { FCMHandler } from "@/components/fcm-handler";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('beforeinstallprompt', (e) => {
                console.log("[PWA] beforeinstallprompt captured successfully");
                e.preventDefault();
                window.deferredPrompt = e;
                window.dispatchEvent(new Event('deferred-prompt-available'));
              });
            `,
          }}
        />
        <PWAInit />
        <UserDataProvider>
          <ToastProvider>
            <StoriesProvider>
              <MessageNotificationProvider>
                <PresenceProvider>
                  <ExileOverlay />
                  <AuthSync />
                  <CapacitorAuthHandler />
                  <FCMHandler />
                  <OnboardingWrapper />
                    {children}
                  <MobileNavWrapper />
                </PresenceProvider>
              </MessageNotificationProvider>
            </StoriesProvider>
          </ToastProvider>
        </UserDataProvider>

      </body>
    </html>
  );
}
