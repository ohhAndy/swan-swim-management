import type { Metadata } from "next";
import "./globals.css";
import { LocationProvider } from "@/context/LocationContext";
import { Fredoka } from "next/font/google";
const fredoka = Fredoka({ subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Swan Swim School Admin",
  description: "Swim School CRM System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fredoka.className} min-h-screen bg-slate-100 text-slate-900`}
      >
        <LocationProvider>
          <main className="mx-auto max-w-5xl p-6">{children}</main>
        </LocationProvider>
      </body>
    </html>
  );
}
