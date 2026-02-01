import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserDataProvider } from "@/context/user-data-context";
import { StoriesProvider } from "@/context/stories-context";
import { MessageNotificationProvider } from "@/context/message-notification-context";
import { PresenceProvider } from "@/context/presence-provider";
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
};

import { ExileOverlay } from "@/components/global/exile-overlay";
import { OnboardingWrapper } from "@/components/onboarding-wrapper";

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
          <StoriesProvider>
            <MessageNotificationProvider>
              <PresenceProvider>
                <ExileOverlay />
                <OnboardingWrapper />
                {children}
                <MobileNavWrapper />
              </PresenceProvider>
            </MessageNotificationProvider>
          </StoriesProvider>
        </UserDataProvider>
      </body>
    </html>
  );
}
