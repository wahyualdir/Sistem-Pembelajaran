import React from 'react';
import Link from 'next/link';
import {
  Award,
  Download,
  CheckCircle2,
  Share2,
  Calendar,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';

const CERTIFICATES = [
  {
    id: 'cert-1',
    title: 'Sertifikat Kompetensi Pemrograman Web Lanjut (Fullstack)',
    issuer: 'Laboratorium Rekayasa Perangkat Lunak UIR',
    date: '30 September 2026',
    credentialId: 'CERT-UIR-2026-WEB-0018',
    grade: 'Lulus dengan Pujian (Grade A)',
    hours: '64 Jam Pelajaran',
  },
  {
    id: 'cert-2',
    title: 'Lencana Prestasi Terbaik: Kuis Algoritma & Struktur Data',
    issuer: 'Fakultas Teknik Informatika',
    date: '15 September 2026',
    credentialId: 'BADGE-DSA-TOP10-2026',
    grade: 'Peringkat 5 dari 120 Peserta',
    hours: 'Top 5% Performer',
  },
  {
    id: 'cert-3',
    title: 'Sertifikat Asisten Laboratorium Komputer Komputasi',
    issuer: 'Ketua Program Studi Teknik Informatika',
    date: '01 Juli 2026',
    credentialId: 'ASDOS-TI-GANJIL-2026',
    grade: 'Aktif Menjalankan Tugas Asistensi',
    hours: '1 Semester Penuh',
  },
  {
    id: 'cert-4',
    title: 'Sertifikat Pelatihan Keamanan Siber & Kriptografi Modern',
    issuer: 'Pusat Studi Cyber Defense & Forensik',
    date: '20 Agustus 2026',
    credentialId: 'CERT-CYBER-UIR-8821',
    grade: 'Kompeten (Skor 92/100)',
    hours: '32 Jam Praktikum',
  },
];

export default function CertificatesPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW RETRO */}
      <RetroWindow
        title="sertifikat_dan_lencana_prestasi.app"
        badge="Terverifikasi Resmi"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg border-2 border-black bg-retro-orange text-white shadow-xs">
                <Award className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight text-foreground">
                Sertifikat & Badge Digital
              </h1>
            </div>
            <p className="text-base sm:text-lg text-black font-medium max-w-3xl leading-relaxed">
              Koleksi sertifikat kelulusan modul, badge penguasaan live coding, dan pengakuan formal yang diterbitkan secara resmi dengan ID kredensial terenkripsi.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded-lg border-2 border-black bg-white px-4 py-2 text-sm sm:text-base font-mono font-black text-black shadow-retro">
              {CERTIFICATES.length} Kredensial Terbit
            </span>
          </div>
        </div>
      </RetroWindow>

      {/* 2. GRID KARTU SERTIFIKAT (3 KOLOM PROPORSIONAL & CRISP) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CERTIFICATES.map((cert) => (
          <div
            key={cert.id}
            className="rounded-xl border-2 border-black bg-white p-5 sm:p-6 shadow-retro flex flex-col justify-between space-y-5 hover:-translate-y-1 hover:shadow-retro-md transition-all"
          >
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg border-2 border-black bg-retro-warm text-black shadow-xs">
                  <Award className="h-6 w-6 text-retro-orange" />
                </div>
                <span className="text-xs sm:text-sm font-mono font-black px-3 py-1 rounded border-2 border-black bg-emerald-100 text-emerald-950 shadow-xs">
                  ✓ Terverifikasi Resmi
                </span>
              </div>

              <div>
                <h2 className="font-heading font-black text-lg sm:text-xl text-black leading-snug line-clamp-2">
                  {cert.title}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-800 font-semibold mt-1">
                  Penerbit: <strong className="text-black font-bold">{cert.issuer}</strong>
                </p>
              </div>

              <div className="space-y-1.5 p-3 rounded-lg border-2 border-black/15 bg-emerald-50/80 text-xs sm:text-sm font-mono">
                <p className="text-emerald-950 font-black text-sm">{cert.grade}</p>
                <p className="text-neutral-900 font-bold truncate">ID: {cert.credentialId}</p>
                <p className="text-neutral-700 font-medium">{cert.date} · {cert.hours}</p>
              </div>
            </div>

            <div className="pt-3.5 border-t-2 border-black/10 flex items-center justify-between gap-2.5">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border-2 border-black bg-white hover:bg-retro-warm text-xs sm:text-sm font-heading font-black text-black shadow-xs transition-all"
              >
                <Share2 className="h-4 w-4 text-black" />
                <span>Bagikan</span>
              </button>

              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-2 border-black bg-retro-yellow text-black hover:bg-black hover:text-white text-xs sm:text-sm font-heading font-black shadow-xs transition-all"
              >
                <Download className="h-4 w-4" />
                <span>Unduh PDF</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
