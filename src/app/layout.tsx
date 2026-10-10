import type { Metadata } from "next";
import "./fonts-sf-pro.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIAJAR — Sistem Informasi Ajar Terpadu",
  description:
    "Satu ruang kerja akademik untuk kelas, materi, tugas, penilaian, dan diskusi.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}

