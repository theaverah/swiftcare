import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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
    default: "SwiftCare",
    template: "%s | SwiftCare",
  },
  description:
    "SwiftCare — consult with licensed doctors online, book appointments, and manage your health from anywhere.",
  keywords: ["telehealth", "online doctor", "virtual consultation", "healthcare"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg-sub text-text-main overscroll-none">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
