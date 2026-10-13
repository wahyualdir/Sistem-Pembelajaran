import React from 'react';
import Link from 'next/link';
import { BookOpen, FileText, Download, Eye, ExternalLink, ShieldCheck } from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';

const ASSISTANT_MATERIALS = [
  {
    id: 'mat-ta-1',
    code: 'MODUL 04',
    title: 'Panduan Asisten: Modul REST API & Auth',
    category: 'PDF · Modul Ajar',
    course: 'Pemrograman Web Lanjut (TI-301)',
    updatedAt: '2 hari lalu',
    description: 'Petunjuk setup environment pengujian otomatis, test cases standar, konfigurasi Postman Collection, dan rubrik penilaian tugas ke-4.',
  },
  {
    id: 'mat-ta-2',
    code: 'KUNCI SOAL',
    title: 'Kunci Solusi Praktikum Database Migration & Sharding',
    category: 'Dokumen · Rahasia Dosen',
    course: 'Praktikum Sistem Basis Data (TI-204)',
    updatedAt: '3 hari lalu',
    description: 'Skema referensi migrasi Prisma/PostgreSQL, query benchmark, dan skrip verifikasi otomatis untuk memeriksa kode implementasi mahasiswa.',
  },
  {
    id: 'mat-ta-3',
    code: 'CHEAT SHEET',
    title: 'Pedoman Standardisasi & Gaya Kode Praktikum C/C++',
    category: 'Panduan Teknis · Standar',
    course: 'Algoritma & Pemrograman Dasar (TI-102)',
    updatedAt: '1 minggu lalu',
    description: 'Standar penamaan variabel, penanganan alokasi memori dinamis malloc/free, dan aturan pengecekan memory leak menggunakan Valgrind.',
  },
  {
    id: 'mat-ta-4',
    code: 'RUBRIK PENILAIAN',
    title: 'Rubrik Evaluasi Ujian Praktikum & Live Coding',
    category: 'Format Skor · Akreditasi',
    course: 'Semua Kelas Praktikum',
    updatedAt: '5 hari lalu',
    description: 'Skema penilaian objektif untuk test case publik (40%), test case tersembunyi (40%), dan kualitas keterbacaan kode (20%).',
  },
];

export default function AssistantMaterialsPage() {
  return (
    <div className="p-6 sm:p-9 w-full space-y-8 animate-fade-up">
      <RetroWindow
        title="materi_asisten_praktikum.app"
        subtitle="Panduan Praktikum, Kunci Pembahasan & Modul Pembimbing"
        headerBadge="Mode Asisten"
        headerBadgeVariant="warning"
      >
        <div className="p-6 sm:p-8 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground flex items-center gap-3">
            <BookOpen className="h-7 w-7 text-retro-orange" />
            <span>Materi & Panduan Asistensi</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-3xl leading-relaxed">
            Akses modul panduan praktikum, kisi-kisi solusi, dan rubrik evaluasi yang dibagikan oleh dosen pengampu khusus untuk asisten kelas.
          </p>
        </div>
      </RetroWindow>

      {/* Grid 4 Kartu Materi Asisten Full Width */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {ASSISTANT_MATERIALS.map((m) => (
          <div
            key={m.id}
            className="rounded-xl border-2 border-black bg-white p-6 shadow-retro flex flex-col justify-between space-y-4 hover:-translate-y-0.5 transition-transform"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg border-2 border-black bg-retro-warm">
                  <FileText className="h-5 w-5 text-foreground" />
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded border border-black bg-neutral-100">
                  {m.code}
                </span>
              </div>

              <div>
                <span className="text-xs font-mono text-muted-foreground block truncate">
                  {m.course}
                </span>
                <h3 className="font-heading font-black text-base text-foreground mt-1 leading-snug">
                  {m.title}
                </h3>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {m.description}
              </p>
            </div>

            <div className="pt-3 flex items-center justify-between border-t-2 border-black/10">
              <span className="text-xs text-muted-foreground font-mono">
                {m.updatedAt}
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-black bg-neutral-50 hover:bg-neutral-100 font-bold text-xs shadow-xs transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Unduh</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
