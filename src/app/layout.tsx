import type { Metadata, Viewport } from "next";
import "./fonts-sf-pro.css";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <head>
        <link
          rel="preload"
          href="/fonts/SFProDisplay-Bold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/SFProDisplay-Semibold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/SFProDisplay-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-[100dvh] overflow-x-hidden bg-background font-sans font-bold text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}

