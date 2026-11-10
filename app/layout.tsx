import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://tipin.vercel.app"
  ),
  title: {
    default: "TipIn — Heren van Flatsoen",
    template: "%s | TipIn",
  },
  description:
    "De team-app van Heren van Flatsoen voor trainingen, wedstrijden, borrels, polls en de boetepot.",
  applicationName: "TipIn",
  appleWebApp: {
    capable: true,
    title: "TipIn",
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    locale: "nl_NL",
    siteName: "TipIn — Heren van Flatsoen",
    title: "TipIn — Heren van Flatsoen",
    description:
      "De team-app van Heren van Flatsoen voor trainingen, wedstrijden, borrels, polls en de boetepot.",
  },
  twitter: {
    card: "summary_large_image",
    title: "TipIn — Heren van Flatsoen",
    description:
      "De team-app van Heren van Flatsoen voor trainingen, wedstrijden, borrels, polls en de boetepot.",
  },
};

import { Suspense } from "react";
import BottomNav from "@/components/BottomNav";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ServiceWorkerRegister />
        {children}
        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
      </body>
    </html>
  );
}
