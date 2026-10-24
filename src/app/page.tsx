import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Layers,
  GraduationCap,
  Activity,
  History,
  Terminal,
  Users,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'RuangKampus — Portal Pembelajaran & Akademik Terpadu Telkom University',
  description:
    'Ekosistem perkuliahan terpadu berbasis kurikulum OBE: manajemen kelas kurikulum, presensi terverifikasi, dan evaluasi pembelajaran adaptif.',
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
    <div className="min-h-screen bg-[#F3F3F4] text-[#111111] font-sans antialiased selection:bg-[#9F1521] selection:text-white flex flex-col justify-between">
      {/* 1. Tel-U Top Institutional Strip */}
      <div className="h-1 w-full bg-[#9F1521] shrink-0" />

      {/* Navigasi Utama */}
      <header className="sticky top-0 z-30 w-full bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#E2E3E4]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src="/logo-ruangkampus.png"
              alt="Logo RuangKampus"
              className="h-8 w-8 object-contain"
            />
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-base sm:text-lg tracking-tight text-[#111111] leading-none">
                Ruang<span className="text-[#9F1521]">Kampus</span>
              </span>
              <span className="text-[11px] font-normal text-[#808285] mt-1 leading-none">
                Portal Akademik Terpadu
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#58595B]">
            <a href="#kurikulum" className="hover:text-[#9F1521] transition-colors">
              Kurikulum Terhubung
            </a>
            <a href="#kapabilitas" className="hover:text-[#9F1521] transition-colors">
              Fitur Akademik
            </a>
            <a href="#peran" className="hover:text-[#9F1521] transition-colors">
              Akses Peran
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#9F1521] hover:bg-[#8F131E] text-white text-xs sm:text-sm font-bold transition-colors shadow-sm"
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
        <section className="border-b border-[#E2E3E4] bg-[#FFFFFF]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
            <div className="max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FEF2F2] border border-[#FDDDD7] text-xs font-bold text-[#9F1521]">
                <span>SISTEM INFORMASI AKADEMIK &amp; PEMBELAJARAN TERPADU</span>
              </div>

              <h1 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-[#111111] tracking-tight leading-[1.15]">
                Ruang Belajar, Silabus, dan Evaluasi Akademik dalam Satu Kanvas.
              </h1>

              <p className="text-sm sm:text-base text-[#58595B] font-normal leading-relaxed max-w-2xl">
                Dirancang untuk dosen, mahasiswa, asisten perkuliahan, dan pengelola program studi.
                Seluruh mata kuliah kurikulum terhubung langsung dengan modul materi, presensi
                terverifikasi, serta pemantauan capaian pembelajaran.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#9F1521] hover:bg-[#8F131E] text-white text-xs sm:text-sm font-bold transition-colors shadow-sm"
                >
                  <span>Masuk ke Ruang Kerja</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#kurikulum"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#E2E3E4] bg-[#FFFFFF] hover:bg-[#F3F3F4] text-[#111111] text-xs sm:text-sm font-semibold transition-colors"
                >
                  <BookOpen className="h-4 w-4 text-[#9F1521]" />
                  <span>Lihat Mata Kuliah Aktif</span>
                </a>
              </div>
            </div>

            {/* Ringkasan Metrik Institusi */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 pt-8 border-t border-[#E2E3E4]">
              <div className="space-y-1">
                <p className="font-mono font-extrabold text-2xl sm:text-3xl text-[#111111]">8 Semester</p>
                <p className="text-xs text-[#58595B] font-normal">Peta Kurikulum Terstruktur</p>
              </div>
              <div className="space-y-1">
                <p className="font-mono font-extrabold text-2xl sm:text-3xl text-[#9F1521]">24+ Kelas</p>
                <p className="text-xs text-[#58595B] font-normal">Rombongan Belajar Terhubung</p>
              </div>
              <div className="space-y-1">
                <p className="font-mono font-extrabold text-2xl sm:text-3xl text-[#111111]">CPMK &amp; OBE</p>
                <p className="text-xs text-[#58595B] font-normal">Pemetaan Capaian Lulusan</p>
              </div>
              <div className="space-y-1">
                <p className="font-mono font-extrabold text-2xl sm:text-3xl text-[#111111]">7 Peran</p>
                <p className="text-xs text-[#58595B] font-normal">Mahasiswa, Dosen, Asisten, Kaprodi, Staf</p>
              </div>
            </div>
          </div>
        </section>

        {/* Kapabilitas Inti Akademik */}
        <section id="kapabilitas" className="py-12 sm:py-16 border-b border-[#E2E3E4]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="max-w-2xl space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-[#9F1521]">
                Arsitektur Pembelajaran
              </p>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#111111] tracking-tight">
                Instrumen Akademik yang Fokus pada Substansi Perkuliahan
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] shadow-sm space-y-2.5">
                <div className="h-9 w-9 rounded-lg bg-[#FEF2F2] flex items-center justify-center text-[#9F1521]">
                  <Layers className="h-4 w-4" />
                </div>
                <h3 className="font-heading font-bold text-base text-[#111111]">
                  Ruang Kelas &amp; RPS Terpadu
                </h3>
                <p className="text-xs text-[#58595B] font-normal leading-relaxed">
                  Setiap mata kuliah memuat modul pertemuan, forum diskusi, penugasan, kuis, dan
                  rekapitulasi nilai dalam satu halaman.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] shadow-sm space-y-2.5">
                <div className="h-9 w-9 rounded-lg bg-[#FEF2F2] flex items-center justify-center text-[#9F1521]">
                  <Activity className="h-4 w-4" />
                </div>
                <h3 className="font-heading font-bold text-base text-[#111111]">
                  Barometer Pemahaman Kelas
                </h3>
                <p className="text-xs text-[#58595B] font-normal leading-relaxed">
                  Umpan balik anonim secara langsung saat sesi kuliah berlangsung untuk mendeteksi
                  topik yang memerlukan penjelasan ulang.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] shadow-sm space-y-2.5">
                <div className="h-9 w-9 rounded-lg bg-[#FEF2F2] flex items-center justify-center text-[#9F1521]">
                  <History className="h-4 w-4" />
                </div>
                <h3 className="font-heading font-bold text-base text-[#111111]">
                  Verifikasi Riwayat Pengerjaan
                </h3>
                <p className="text-xs text-[#58595B] font-normal leading-relaxed">
                  Inspeksi bertahap proses penulisan kode dan jawaban tugas mahasiswa untuk menjaga
                  kejujuran akademik.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] shadow-sm space-y-2.5">
                <div className="h-9 w-9 rounded-lg bg-[#FEF2F2] flex items-center justify-center text-[#9F1521]">
                  <Terminal className="h-4 w-4" />
                </div>
                <h3 className="font-heading font-bold text-base text-[#111111]">
                  Navigasi &amp; Kalkulasi Cepat
                </h3>
                <p className="text-xs text-[#58595B] font-normal leading-relaxed">
                  Pintasan papan ketik <code className="font-mono font-bold text-[#9F1521]">Ctrl + K</code> untuk
                  berpindah antar-mata kuliah dan menghitung simulasi target IPK.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Daftar Mata Kuliah Kurikulum Terhubung */}
        <section id="kurikulum" className="py-12 sm:py-16 border-b border-[#E2E3E4] bg-[#FFFFFF]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#9F1521]">
                  Katalog Kurikulum Aktif
                </p>
                <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#111111] tracking-tight">
                  Mata Kuliah Program Studi Teknik Informatika
                </h2>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#9F1521] hover:text-[#8F131E] transition-colors"
              >
                <span>Buka Seluruh Kelas di Portal</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURED_CURRICULUM.map((course) => (
                <div
                  key={course.code}
                  className="rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] hover:border-[#9F1521] p-5 flex flex-col justify-between space-y-4 shadow-sm transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FEF2F2] border border-[#FDDDD7] font-semibold text-[#111111]">
                        <span className="font-mono font-bold text-[#9F1521]">{course.code}</span>
                        <span className="text-[#808285]">•</span>
                        <span>{course.sks} SKS</span>
                      </span>
                      <span className="font-mono font-normal text-[#58595B]">
                        {course.semester}
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-base sm:text-lg text-[#111111]">
                      {course.title}
                    </h3>

                    <p className="text-xs text-[#58595B] font-normal leading-relaxed">{course.desc}</p>
                  </div>

                  <div className="pt-3 border-t border-[#E2E3E4] flex items-center justify-between gap-2 text-xs">
                    <span className="font-normal text-[#58595B] truncate">{course.lecturer}</span>
                    <Link
                      href="/login"
                      className="font-bold text-[#9F1521] hover:text-[#8F131E] shrink-0"
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
              <p className="text-xs font-bold uppercase tracking-wider text-[#9F1521]">
                Ruang Kerja Terdedikasi
              </p>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#111111] tracking-tight">
                Akses Sesuai Peran Akademik Anda
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/login"
                className="group p-5 rounded-xl border border-[#E2E3E4] hover:border-[#9F1521] bg-[#FFFFFF] transition-all shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <GraduationCap className="h-5 w-5 text-[#9F1521]" />
                  <span className="font-mono text-[11px] text-[#808285]">NIM 243510001</span>
                </div>
                <h3 className="font-heading font-bold text-base text-[#111111] group-hover:text-[#9F1521] transition-colors">
                  Portal Mahasiswa
                </h3>
                <p className="text-xs text-[#58595B] font-normal">
                  Akses jadwal harian, kelas aktif, pengumpulan tugas, presensi, dan transkrip nilai.
                </p>
              </Link>

              <Link
                href="/login"
                className="group p-5 rounded-xl border border-[#E2E3E4] hover:border-[#9F1521] bg-[#FFFFFF] transition-all shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <BookOpen className="h-5 w-5 text-[#9F1521]" />
                  <span className="font-mono text-[11px] text-[#808285]">NIDN 0012345678</span>
                </div>
                <h3 className="font-heading font-bold text-base text-[#111111] group-hover:text-[#9F1521] transition-colors">
                  Portal Dosen Pengampu
                </h3>
                <p className="text-xs text-[#58595B] font-normal">
                  Kelola rombongan belajar, materi kuliah, sesi kehadiran, serta pemeriksaan nilai.
                </p>
              </Link>

              <Link
                href="/login"
                className="group p-5 rounded-xl border border-[#E2E3E4] hover:border-[#9F1521] bg-[#FFFFFF] transition-all shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Users className="h-5 w-5 text-[#9F1521]" />
                  <span className="font-mono text-[11px] text-[#808285]">NIM 233510001</span>
                </div>
                <h3 className="font-heading font-bold text-base text-[#111111] group-hover:text-[#9F1521] transition-colors">
                  Asisten Perkuliahan
                </h3>
                <p className="text-xs text-[#58595B] font-normal">
                  Pendampingan praktikum laboratorium, verifikasi presensi, dan asistensi modul.
                </p>
              </Link>

              <Link
                href="/login"
                className="group p-5 rounded-xl border border-[#E2E3E4] hover:border-[#9F1521] bg-[#FFFFFF] transition-all shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <ShieldCheck className="h-5 w-5 text-[#9F1521]" />
                  <span className="font-mono text-[11px] text-[#808285]">NIDN 2008000307</span>
                </div>
                <h3 className="font-heading font-bold text-base text-[#111111] group-hover:text-[#9F1521] transition-colors">
                  Kaprodi &amp; Admin Akademik
                </h3>
                <p className="text-xs text-[#58595B] font-normal">
                  Pemantauan kurikulum OBE, evaluasi dosen (EDOM), dan peringatan dini akademik.
                </p>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 3. Footer Institusi */}
      <footer className="border-t border-[#E2E3E4] bg-[#FFFFFF] py-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#808285]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#111111]">RuangKampus</span>
            <span>&mdash; Sistem Pembelajaran &amp; Akademik Terpadu</span>
          </div>
          <span className="font-mono text-[11px]">
            Telkom University Enterprise Learning System
          </span>
        </div>
      </footer>
    </div>
  );
}
