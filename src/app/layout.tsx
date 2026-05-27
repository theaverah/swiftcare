import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/shared/Providers";
import "./globals.css";

// Inter as the web-safe fallback while Apercu Pro loads from local files
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SwiftCare — Telehealth Platform",
    template: "%s | SwiftCare",
  },
  description:
    "Connect with doctors online. Book consultations, get prescriptions, and manage your health — all in one place.",
  keywords: ["telehealth", "online doctor", "virtual consultation", "healthcare"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg-main text-text-main">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
