import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import "./globals.css";

const sfPro = localFont({
  src: [
    {
      path: "../../public/sf-pro-regular.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/sf-pro-medium.woff",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/sf-pro-medium.woff",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/sf-pro-bold.woff",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/sf-pro-bold.woff",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../public/sf-pro-bold.woff",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-sf-pro",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "SIAJAR — Sistem Informasi Ajar Terpadu",
  description:
    "Satu ruang kerja akademik untuk kelas, materi, tugas, penilaian, dan diskusi.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

import { ScrollAnimationProvider } from "@/components/ui/scroll-animation-provider";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${sfPro.variable} ${inter.variable}`}>
      <body className="min-h-[100dvh] overflow-x-hidden bg-background font-sans font-bold text-ink antialiased">
        <ScrollAnimationProvider>{children}</ScrollAnimationProvider>
      </body>
    </html>
  );
}


