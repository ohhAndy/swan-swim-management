import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Swan Swim School — Swim Like No Other | Markham & Newmarket",
  description:
    "Swim lessons for all ages in Markham & Newmarket. Small 3:1 class ratios, certified instructors, warm water pools, and 4.9★ on Google (350+ reviews). Book a free trial today!",
  keywords: [
    "swim school",
    "swim lessons",
    "learn to swim",
    "kids swimming",
    "swimming classes",
    "swim lessons Markham",
    "swim lessons Newmarket",
    "swim school York Region",
    "swimming classes Markham Ontario",
    "swimming classes Newmarket Ontario",
  ],
  openGraph: {
    title: "Swan Swim School — Swim Like No Other | Markham & Newmarket",
    description:
      "Small class ratios, certified instructors, and warm pool water. 4.9★ rated swim school serving Markham & Newmarket.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
