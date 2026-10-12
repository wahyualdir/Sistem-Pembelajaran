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
      <body className="min-h-[100dvh] overflow-x-hidden bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}

