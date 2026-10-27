import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { VIEWPORT_THEME_COLORS } from "@/lib/config/viewport-theme";
import { ScrollAnimationProvider } from "@/components/ui/scroll-animation-provider";

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
  adjustFontFallback: false,
});

const inter = localFont({
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
      path: "../../public/sf-pro-bold.woff",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-inter",
  display: "swap",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "RuangKampus — Sistem Pembelajaran Terpadu",
  description:
    "Satu ruang kerja akademik untuk kelas, materi, tugas, penilaian, dan diskusi.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [...VIEWPORT_THEME_COLORS],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${sfPro.variable} ${inter.variable}`}>
      <body className="min-h-[100dvh] bg-background font-sans font-bold text-ink antialiased">
        <ScrollAnimationProvider>{children}</ScrollAnimationProvider>
      </body>
    </html>
  );
}
