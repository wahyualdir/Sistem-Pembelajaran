import React from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  BookOpen,
  ShieldCheck,
  Laptop,
  CheckCircle2,
  FileQuestion,
  ExternalLink,
  MapPin,
  KeyRound,
  FileSpreadsheet,
  Users,
  ArrowRight,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';

const FAQS = [
  {
    category: 'UJIAN ONLINE',
    icon: Laptop,
    badgeBg: 'bg-gray-soft',
    q: 'Bagaimana cara mengikuti ujian dengan sistem pengawasan (proctoring)?',
    a: 'Masuk ke menu Ujian Aktif, klik Mulai Ujian, setujui aturan pengawasan, dan aktifkan mode layar penuh (fullscreen). Hindari berpindah tab atau meminimize jendela agar tidak memicu peringatan log pelanggaran.',
  },
  {
    category: 'PRESENSI KELAS',
    icon: MapPin,
    badgeBg: 'bg-retro-mint',
    q: 'Bagaimana cara melakukan presensi dengan QR Dinamis & Lokasi?',
    a: 'Buka Hub Kelas Anda, pilih tab Presensi, scan kode QR yang ditampilkan dosen atau izinkan akses lokasi GPS peramban untuk validasi geofence radius kelas (≤ 50 meter dari titik koordinat ruang kelas).',
  },
  {
    category: 'PRIVASI MAHASISWA',
    icon: ShieldCheck,
    badgeBg: 'bg-gray-soft',
    q: 'Apakah peramban merekam isi layar lain atau berkas pribadi saya?',
    a: 'Tidak. SIAJAR hanya mendeteksi event peramban bawaan seperti visibilitychange (tab aktif/non-aktif) dan blur jendela. Sistem tidak memiliki akses teknis untuk mengintip berkas di luar tab ujian.',
  },
  {
    category: 'KEAMANAN AKUN',
    icon: KeyRound,
    badgeBg: 'bg-gray-soft/40',
    q: 'Bagaimana cara mendaftarkan biometrik (Passkey / WebAuthn)?',
    a: 'Buka menu Perangkat & Sesi, pilih Tambah Kredensial Biometrik, lalu verifikasi menggunakan sensor sidik jari atau Windows Hello/Touch ID bawaan perangkat laptop maupun smartphone Anda.',
  },
  {
    category: 'SENGKETA NILAI',
    icon: FileSpreadsheet,
    badgeBg: 'bg-primary text-white',
    q: 'Bagaimana jika terjadi error koneksi saat ujian yang mengurangi nilai?',
    a: 'Mahasiswa berhak mengajukan sanggahan resmi pada menu Sengketa Nilai (Disputes). Sertakan tangkapan layar bukti kendala jaringan; dosen pengampu akan meninjau ulang log audit teknis.',
  },
  {
    category: 'PERAN ASISTEN',
    icon: Users,
    badgeBg: 'bg-retro-surface',
    q: 'Siapa yang memeriksa tugas praktikum dan kuis saya?',
    a: 'Penilaian tugas dapat dilakukan langsung oleh Dosen Pengampu atau didelegasikan kepada Asisten Dosen resmi yang telah dimandatkan hak evaluasi pada rombongan belajar kelas Anda.',
  },
];

export default function HelpCenterPage() {
  return (
    <div className="p-6 sm:p-9 w-full space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW BANTUAN */}
      <RetroWindow
        title="pusat_bantuan_dan_panduan.app"
        badge="PANDUAN OPERASIONAL v2.0"
        headerClassName="bg-gray-soft"
        bodyClassName="p-6 sm:p-8 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-lg border-2 border-retro-border bg-primary text-white shadow-xs">
                <HelpCircle className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-foreground">
                Pusat Bantuan & Panduan LMS
              </h1>
            </div>
            <p className="text-base sm:text-lg text-black font-medium max-w-2xl mt-1 leading-relaxed">
              Temukan panduan lengkap penggunaan portal pembelajaran SIAJAR, tata cara pelaksanaan ujian terawasi, mekanisme presensi berbasis GPS & QR dinamis, serta perlindungan privasi data akademik.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border-2 border-black bg-white px-4 py-1.5 text-sm sm:text-base font-sans font-bold text-black shadow-xs">
              SOP Akademik Aktif
            </span>
          </div>
        </div>
      </RetroWindow>

      {/* 2. DAFTAR FAQ 6 CARDS DALAM GRID 3 KOLOM */}
      <RetroWindow
        title={`tanya_jawab_populer.faq (${FAQS.length})`}
        headerClassName="bg-gray-soft"
        bodyClassName="p-6 sm:p-7 space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-xl sm:text-2xl text-black flex items-center gap-2.5">
            <FileQuestion className="h-6 w-6 text-primary" />
            <span>Pertanyaan yang Sering Diajukan (FAQ)</span>
          </h2>
          <span className="text-sm font-sans font-bold text-black">Kanal Informasi Resmi</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FAQS.map((faq, i) => {
            const Icon = faq.icon;
            return (
              <div
                key={i}
                className="rounded-xl border-2 border-black bg-white p-6 shadow-retro flex flex-col justify-between space-y-4 hover:-translate-y-0.5 hover:shadow-retro-md transition-all animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded border-2 border-black text-xs font-sans font-bold shadow-xs ${faq.badgeBg}`}>
                      {faq.category}
                    </span>
                    <Icon className="h-5 w-5 text-primary" />
                  </div>

                  <h3 className="font-heading font-bold text-lg text-black leading-snug">
                    {faq.q}
                  </h3>

                  <p className="text-sm sm:text-base text-black font-medium leading-relaxed pt-2 border-t-2 border-black/10">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </RetroWindow>

      {/* 3. CALLOUT BANNER TRANSPARANSI FULL */}
      <div className="rounded-xl border-2 border-black bg-gray-soft p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-retro">
        <div className="space-y-1.5 text-center sm:text-left">
          <h3 className="font-heading font-bold text-xl text-black flex items-center justify-center sm:justify-start gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span>Butuh Transparansi Privasi & Keamanan Data?</span>
          </h3>
          <p className="text-sm sm:text-base text-black font-medium max-w-2xl leading-relaxed">
            Pelajari rincian parameter telemetri yang dicatat selama ujian, batas retensi log kehadiran GPS, dan jaminan keamanan modul evaluasi kami.
          </p>
        </div>
        <Link
          href="/transparency"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-black bg-gray-soft text-black font-heading font-bold text-sm sm:text-base shadow-retro hover:bg-black hover:text-white transition-all shrink-0"
        >
          <span>Buka Transparansi Data &rarr;</span>
        </Link>
      </div>
    </div>
  );
}
