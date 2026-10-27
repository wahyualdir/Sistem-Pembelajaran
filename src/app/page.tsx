import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  ArrowRight,
  CalendarCheck2,
  ShieldCheck,
  Layers,
  GraduationCap,
  Activity,
  History,
  Terminal,
  Users,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'RuangKampus — Portal Pembelajaran & Akademik Terpadu',
  description:
    'Ekosistem perkuliahan terpadu Program Studi Teknik Informatika Universitas Islam Riau: manajemen kelas kurikulum, presensi terverifikasi, dan evaluasi pembelajaran.',
};

export const dynamic = 'force-dynamic';

const FEATURED_CURRICULUM = [
  {
    code: 'IF1102',
    title: 'Pemrograman Dasar',
    semester: 'Semester 1',
    sks: 4,
    lecturer: 'Dr. Eng. Budi Santoso, S.T., M.T.',
    desc: 'Fondasi logika algoritma, tipe data, struktur kontrol, dan pemecahan masalah komputasional.',
  },
  {
    code: 'IF1202',
    title: 'Algoritma & Struktur Data',
    semester: 'Semester 2',
    sks: 4,
    lecturer: 'Ir. Rina Kurniawati, S.Kom., M.Cs.',
    desc: 'Implementasi senarai berantai, tumpukan, antrean, pohon biner, graf, dan analisis kompleksitas.',
  },
  {
    code: 'IF2104',
    title: 'Pemrograman Berorientasi Objek',
    semester: 'Semester 3',
    sks: 3,
    lecturer: 'Assoc. Prof. Dr. Hendra Pratama, M.Kom.',
    desc: 'Enkapsulasi, pewarisan, polimorfisme, antarmuka, dan pola rancang perangkat lunak modern.',
  },
  {
    code: 'IF2102',
    title: 'Sistem Basis Data',
    semester: 'Semester 3',
    sks: 4,
    lecturer: 'Dr. Siti Aminah, S.T., M.Kom.',
    desc: 'Pemodelan relasional, normalisasi skema, optimasi kueri SQL, dan transaksi konkuren.',
  },
  {
    code: 'IF2201',
    title: 'Rekayasa Perangkat Lunak',
    semester: 'Semester 4',
    sks: 3,
    lecturer: 'Dr. Eng. Wahyu Nugroho, S.Kom., M.T.',
    desc: 'Siklus hidup pengembangan sistem, spesifikasi kebutuhan, arsitektur perangkat lunak, dan pengujian.',
  },
  {
    code: 'IF3101',
    title: 'Kecerdasan Buatan & Pembelajaran Mesin',
    semester: 'Semester 5',
    sks: 3,
    lecturer: 'Prof. Dr. Ahmad Fauzi, S.Si., M.Kom.',
    desc: 'Pencarian heuristik, pembelajaran terarah, jaringan saraf tiruan, dan evaluasi model prediktif.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-[100dvh] bg-[#FAF8F5] text-[#1C1917] font-sans antialiased selection:bg-[#C2553A] selection:text-white flex flex-col justify-between">
      {/* 1. Navigasi Utama Editorial */}
      <header className="sticky top-0 z-30 w-full bg-[#FFFFFF]/95 backdrop-blur-xs border-b border-[#E8E5DE]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo-ruangkampus.png"
              alt="Logo RuangKampus"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
              priority
            />
            <div className="flex flex-col">
              <span className="font-heading font-bold text-base sm:text-lg tracking-tight text-[#1C1917] leading-none">
                Ruang<span className="text-[#C2553A]">Kampus</span>
              </span>
              <span className="text-[11px] font-medium text-[#7A756D] mt-0.5 leading-none">
                Portal Akademik Terpadu
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#57534E]">
            <a href="#kurikulum" className="hover:text-[#1C1917] transition-colors">
              Kurikulum Terhubung
            </a>
            <a href="#kapabilitas" className="hover:text-[#1C1917] transition-colors">
              Fitur Akademik
            </a>
            <a href="#peran" className="hover:text-[#1C1917] transition-colors">
              Akses Peran
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C2553A] hover:bg-[#853827] text-white text-xs sm:text-sm font-semibold transition-colors"
            >
              <span>Masuk Portal</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Konten Utama */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-[#E8E5DE] bg-[#FFFFFF]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-14 lg:py-20">
            <div className="max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#FAF8F5] border border-[#D6D3CB] text-xs font-mono font-semibold text-[#853827]">
                <span>TEKNIK INFORMATIKA · UNIVERSITAS ISLAM RIAU</span>
              </div>

              <h1 className="font-heading font-bold text-2xl sm:text-4xl lg:text-5xl text-[#1C1917] tracking-tight leading-[1.15]">
                Ruang Belajar, Silabus, dan Evaluasi Akademik dalam Satu Kanvas.
              </h1>

              <p className="text-sm sm:text-base text-[#57534E] leading-relaxed max-w-2xl">
                Dirancang untuk dosen, mahasiswa, asisten perkuliahan, dan pengelola program studi.
                Seluruh mata kuliah kurikulum terhubung langsung dengan modul materi, presensi
                terverifikasi, serta pemantauan capaian pembelajaran.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1C1917] hover:bg-[#C2553A] text-white text-xs sm:text-sm font-semibold transition-colors"
                >
                  <span>Masuk ke Ruang Kerja</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#kurikulum"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#D6D3CB] bg-[#FAF8F5] hover:bg-[#ECE9D8] text-[#1C1917] text-xs sm:text-sm font-semibold transition-colors"
                >
                  <BookOpen className="h-4 w-4 text-[#C2553A]" />
                  <span>Lihat Mata Kuliah Aktif</span>
                </a>
              </div>
            </div>

            {/* Ringkasan Metrik Institusi */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-[#E8E5DE]">
              <div className="space-y-1">
                <p className="font-mono font-bold text-xl sm:text-3xl text-[#1C1917]">8 Semester</p>
                <p className="text-[11px] sm:text-xs text-[#57534E]">Peta Kurikulum Terstruktur</p>
              </div>
              <div className="space-y-1">
                <p className="font-mono font-bold text-xl sm:text-3xl text-[#C2553A]">24+ Kelas</p>
                <p className="text-[11px] sm:text-xs text-[#57534E]">Rombongan Belajar Terhubung</p>
              </div>
              <div className="space-y-1">
                <p className="font-mono font-bold text-xl sm:text-3xl text-[#1C1917]">CPMK &amp; OBE</p>
                <p className="text-[11px] sm:text-xs text-[#57534E]">Pemetaan Capaian Lulusan</p>
              </div>
              <div className="space-y-1">
                <p className="font-mono font-bold text-xl sm:text-3xl text-[#1C1917]">Multi-Peran</p>
                <p className="text-[11px] sm:text-xs text-[#57534E]">Mahasiswa, Dosen, Asisten, Kaprodi</p>
              </div>
            </div>
          </div>
        </section>

        {/* Kapabilitas Inti Akademik */}
        <section id="kapabilitas" className="py-12 sm:py-16 border-b border-[#E8E5DE]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="max-w-2xl space-y-1.5">
              <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[#853827]">
                Arsitektur Pembelajaran
              </p>
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#1C1917] tracking-tight">
                Instrumen Akademik yang Fokus pada Substansi Perkuliahan
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl border border-[#D6D3CB] bg-[#FFFFFF] space-y-2.5">
                <div className="h-9 w-9 rounded-lg bg-[#FAF8F5] border border-[#E8E5DE] flex items-center justify-center text-[#C2553A]">
                  <Layers className="h-4 w-4" />
                </div>
                <h3 className="font-heading font-bold text-base text-[#1C1917]">
                  Ruang Kelas &amp; RPS Terpadu
                </h3>
                <p className="text-xs text-[#57534E] leading-relaxed">
                  Setiap mata kuliah memuat modul pertemuan, forum diskusi, penugasan, kuis, dan
                  rekapitulasi nilai dalam satu halaman.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-[#D6D3CB] bg-[#FFFFFF] space-y-2.5">
                <div className="h-9 w-9 rounded-lg bg-[#FAF8F5] border border-[#E8E5DE] flex items-center justify-center text-[#C2553A]">
                  <Activity className="h-4 w-4" />
                </div>
                <h3 className="font-heading font-bold text-base text-[#1C1917]">
                  Barometer Pemahaman Kelas
                </h3>
                <p className="text-xs text-[#57534E] leading-relaxed">
                  Umpan balik anonim secara langsung saat sesi kuliah berlangsung untuk mendeteksi
                  topik yang memerlukan penjelasan ulang.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-[#D6D3CB] bg-[#FFFFFF] space-y-2.5">
                <div className="h-9 w-9 rounded-lg bg-[#FAF8F5] border border-[#E8E5DE] flex items-center justify-center text-[#C2553A]">
                  <History className="h-4 w-4" />
                </div>
                <h3 className="font-heading font-bold text-base text-[#1C1917]">
                  Verifikasi Riwayat Pengerjaan
                </h3>
                <p className="text-xs text-[#57534E] leading-relaxed">
                  Inspeksi bertahap proses penulisan kode dan jawaban tugas mahasiswa untuk menjaga
                  kejujuran akademik.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-[#D6D3CB] bg-[#FFFFFF] space-y-2.5">
                <div className="h-9 w-9 rounded-lg bg-[#FAF8F5] border border-[#E8E5DE] flex items-center justify-center text-[#C2553A]">
                  <Terminal className="h-4 w-4" />
                </div>
                <h3 className="font-heading font-bold text-base text-[#1C1917]">
                  Navigasi &amp; Kalkulasi Cepat
                </h3>
                <p className="text-xs text-[#57534E] leading-relaxed">
                  Pintasan papan ketik <code className="font-mono font-bold">Ctrl + K</code> untuk
                  berpindah antar-mata kuliah dan menghitung simulasi target IPK.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Daftar Mata Kuliah Kurikulum Terhubung */}
        <section id="kurikulum" className="py-12 sm:py-16 border-b border-[#E8E5DE] bg-[#FFFFFF]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1.5">
                <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[#853827]">
                  Katalog Kurikulum Aktif
                </p>
                <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#1C1917] tracking-tight">
                  Mata Kuliah Program Studi Teknik Informatika
                </h2>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#C2553A] hover:text-[#853827] transition-colors"
              >
                <span>Buka Seluruh Kelas di Portal</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURED_CURRICULUM.map((course) => (
                <div
                  key={course.code}
                  className="rounded-2xl border border-[#D6D3CB] bg-[#FAF8F5] p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#FFFFFF] border border-[#D6D3CB] font-semibold text-[#1C1917]">
                        <span className="font-mono font-bold text-[#853827]">{course.code}</span>
                        <span className="text-[#B8B1A5]">•</span>
                        <span>{course.sks} SKS</span>
                      </span>
                      <span className="font-mono font-semibold text-[#57534E]">
                        {course.semester}
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-base sm:text-lg text-[#1C1917]">
                      {course.title}
                    </h3>

                    <p className="text-xs text-[#57534E] leading-relaxed">{course.desc}</p>
                  </div>

                  <div className="pt-3 border-t border-[#E8E5DE] flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-[#44403C] truncate">{course.lecturer}</span>
                    <Link
                      href="/login"
                      className="font-semibold text-[#C2553A] hover:text-[#1C1917] shrink-0"
                    >
                      Masuk &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Akses Berdasarkan Peran */}
        <section id="peran" className="py-12 sm:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
            <div className="max-w-xl space-y-1.5">
              <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[#853827]">
                Ruang Kerja Terdedikasi
              </p>
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#1C1917] tracking-tight">
                Akses Sesuai Peran Akademik Anda
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/login"
                className="group p-5 rounded-2xl border border-[#D6D3CB] hover:border-[#1C1917] bg-[#FFFFFF] transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <GraduationCap className="h-5 w-5 text-[#C2553A]" />
                  <span className="font-mono text-[11px] text-[#7A756D]">NIM 243510001</span>
                </div>
                <h3 className="font-heading font-bold text-base text-[#1C1917] group-hover:text-[#C2553A]">
                  Portal Mahasiswa
                </h3>
                <p className="text-xs text-[#57534E]">
                  Akses jadwal harian, kelas aktif, pengumpulan tugas, presensi, dan transkrip nilai.
                </p>
              </Link>

              <Link
                href="/login"
                className="group p-5 rounded-2xl border border-[#D6D3CB] hover:border-[#1C1917] bg-[#FFFFFF] transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <BookOpen className="h-5 w-5 text-[#C2553A]" />
                  <span className="font-mono text-[11px] text-[#7A756D]">NIDN 0012345678</span>
                </div>
                <h3 className="font-heading font-bold text-base text-[#1C1917] group-hover:text-[#C2553A]">
                  Portal Dosen Pengampu
                </h3>
                <p className="text-xs text-[#57534E]">
                  Kelola rombongan belajar, materi kuliah, sesi kehadiran, serta pemeriksaan nilai.
                </p>
              </Link>

              <Link
                href="/login"
                className="group p-5 rounded-2xl border border-[#D6D3CB] hover:border-[#1C1917] bg-[#FFFFFF] transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Users className="h-5 w-5 text-[#C2553A]" />
                  <span className="font-mono text-[11px] text-[#7A756D]">NIM 233510001</span>
                </div>
                <h3 className="font-heading font-bold text-base text-[#1C1917] group-hover:text-[#C2553A]">
                  Asisten Perkuliahan
                </h3>
                <p className="text-xs text-[#57534E]">
                  Pendampingan praktikum laboratorium, verifikasi presensi, dan asistensi modul.
                </p>
              </Link>

              <Link
                href="/login"
                className="group p-5 rounded-2xl border border-[#D6D3CB] hover:border-[#1C1917] bg-[#FFFFFF] transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <ShieldCheck className="h-5 w-5 text-[#C2553A]" />
                  <span className="font-mono text-[11px] text-[#7A756D]">NIDN 2008000307</span>
                </div>
                <h3 className="font-heading font-bold text-base text-[#1C1917] group-hover:text-[#C2553A]">
                  Kaprodi &amp; Admin Akademik
                </h3>
                <p className="text-xs text-[#57534E]">
                  Pemantauan kurikulum OBE, evaluasi dosen (EDOM), dan peringatan dini akademik.
                </p>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 3. Footer Institusi */}
      <footer className="border-t border-[#E8E5DE] bg-[#FFFFFF] py-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#7A756D]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#1C1917]">RuangKampus</span>
            <span>&mdash; Sistem Pembelajaran &amp; Akademik Terpadu</span>
          </div>
          <span className="font-mono text-[11px]">
            Program Studi Teknik Informatika · Universitas Islam Riau
          </span>
        </div>
      </footer>
    </div>
  );
}
