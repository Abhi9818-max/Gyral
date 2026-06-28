import type { Metadata, Viewport } from "next";
import Script from "next/script";
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
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gyral",
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/icons/icon-192.png',
    apple: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
};

export const viewport: Viewport = {
  themeColor: "#000000",
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
        <Script
          id="pwa-install-capture"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('beforeinstallprompt', function(e) {
                e.preventDefault();
                window.deferredPrompt = e;
                window.dispatchEvent(new Event('deferred-prompt-available'));
              });
            `,
          }}
        />
        <Script
          id="register-sw"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then(
                  function(registration) {
                    console.log('SW registered:', registration.scope);
                    registration.update();
                  },
                  function(err) {
                    console.log('SW registration failed:', err);
                  }
                );
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
