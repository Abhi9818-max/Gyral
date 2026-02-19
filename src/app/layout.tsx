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
  title: "Gyral",
  description: "Advanced cognitive architecture and habit formation system.",
  manifest: "/manifest.json",
  icons: {
    icon: '/icons/icon-192.png',
    shortcut: '/icons/icon-192.png',
    apple: '/icons/icon-512.png',
  }
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

import { ExileOverlay } from "@/components/global/exile-overlay";
import { OnboardingWrapper } from "@/components/onboarding-wrapper";
import { AuthSync } from "@/components/auth-sync";
import { CapacitorAuthHandler } from "@/components/capacitor-auth-handler";

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
                  <OnboardingWrapper />
                  {children}
                  <MobileNavWrapper />
                </PresenceProvider>
              </MessageNotificationProvider>
            </StoriesProvider>
          </ToastProvider>
        </UserDataProvider>
        <Script
          id="register-sw"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('Service Worker registration successful with scope: ', registration.scope);
                    },
                    function(err) {
                      console.log('Service Worker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
