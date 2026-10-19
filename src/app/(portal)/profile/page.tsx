import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  ShieldCheck,
  GraduationCap,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  KeyRound,
  Download,
  Layers,
  ArrowRight,
  Flame,
  Sparkles,
} from 'lucide-react';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { getStudentBadgesAction } from '@/modules/academic/badge-certificate-actions';

export default async function ProfilePage() {
  const userContext = await getCurrentUserWithRoles();

  if (!userContext) {
    redirect('/login');
  }

  const { user, profile, roles, activeRole } = userContext;
  const fullName = profile?.full_name || 'Wahyu Aldiriyanto';
  const badges = await getStudentBadgesAction(user.id).catch(() => []);

  const initials =
    fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('') || 'WA';

  const ROLE_NAMES: Record<string, string> = {
    STUDENT: 'Mahasiswa',
    LECTURER: 'Dosen Pengampu',
    TEACHING_ASSISTANT: 'Asisten Dosen',
    PROGRAM_COORDINATOR: 'Koordinator Prodi',
    ACADEMIC_STAFF: 'Staf Akademik',
    SYSTEM_ADMIN: 'System Administrator',
  };

  return (
    <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0">
      <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
        {/* OPEN HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-0.5">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-ink flex items-center gap-2.5">
              <User className="h-6 w-6 sm:h-7 sm:w-7 text-primary inline-block" />
              Profil & Identitas Pengguna
            </h1>
            <p className="text-xs sm:text-sm text-gray-dark font-bold">
              Informasi akun akademik, riwayat studi terpadu, lencana prestasi belajar, dan konfigurasi multi-peran.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-gray-soft border-2 border-ink text-ink shadow-xs">
              TERVERIFIKASI
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-primary text-white border-2 border-ink shadow-xs">
              NIM: 2024001
            </span>
          </div>
        </div>

        {/* 1. KARTU IDENTITAS UTAMA */}
        <div className="rounded-xl border-2 border-ink bg-surface p-5 sm:p-6 shadow-retro">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
            {/* Avatar Retro */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-ink bg-gray-soft shadow-retro-sm flex items-center justify-center text-3xl sm:text-4xl font-heading font-bold text-primary overflow-hidden">
                {initials}
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 p-1 rounded-full border-2 border-ink bg-surface shadow-xs text-ink" title="Status Akun Aktif">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
            </div>

            {/* Info Utama Pengguna */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-ink">
                  {fullName}
                </h2>
                {roles.map((r) => {
                  const code = (r.roles as { code?: string })?.code || '';
                  const isCurrentActive = activeRole === code;
                  const label = ROLE_NAMES[code] || code;
                  return (
                    <span
                      key={r.id}
                      className={`rounded-full border-2 border-ink px-3 py-0.5 text-xs font-sans font-bold shadow-xs ${
                        isCurrentActive
                          ? 'bg-primary text-white'
                          : 'bg-gray-soft text-ink'
                      }`}
                    >
                      {label.toUpperCase()}{isCurrentActive ? ' • AKTIF' : ''}
                    </span>
                  );
                })}
              </div>

              <p className="text-sm font-bold text-ink flex items-center justify-center sm:justify-start gap-1.5 font-sans">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>NIM: 2024001</span>
                <span className="text-xs text-gray-dark font-normal">&bull; Akun Mahasiswa Terverifikasi</span>
              </p>

              <p className="text-xs text-gray-dark font-bold">
                Program Studi: <strong className="text-ink">Teknik Informatika (S1)</strong> &bull; Fakultas Ilmu Komputer &bull; Universitas Islam Riau
              </p>

              {/* Quick Badges Bar */}
              <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                <span className="rounded-full border-2 border-ink bg-gray-soft px-3 py-1 text-xs font-sans font-bold text-ink shadow-xs">
                  Angkatan 2024
                </span>
                <span className="rounded-full border-2 border-ink bg-gray-soft px-3 py-1 text-xs font-sans font-bold text-ink shadow-xs">
                  Semester 5 (Ganjil 2026/2027)
                </span>
                <span className="rounded-full border-2 border-ink bg-surface px-3 py-1 text-xs font-sans font-bold text-ink shadow-xs">
                  IPK: 3.85
                </span>
                <span className="rounded-full border-2 border-ink bg-surface px-3 py-1 text-xs font-sans font-bold text-ink shadow-xs">
                  UKT: LUNAS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. GRID INFORMASI: AKADEMIK & HAK AKSES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* KOLOM KIRI (2 SPAN): DATA AKADEMIK & PERKULIAHAN */}
          <div className="lg:col-span-2 space-y-5 sm:space-y-6">
            {/* RINGKASAN AKADEMIK */}
            <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4">
              <div className="flex items-center justify-between border-b-2 border-ink/20 pb-3">
                <h3 className="font-heading font-bold text-base sm:text-lg text-ink flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <span>Data Riwayat Akademik Terpadu</span>
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl border-2 border-ink bg-surface shadow-retro-sm">
                  <p className="text-xs font-sans font-bold text-gray-dark uppercase tracking-wider">IPK Kumulatif</p>
                  <p className="font-heading font-bold text-xl sm:text-2xl text-primary mt-1">3.85</p>
                  <p className="text-[11px] text-gray-dark font-bold font-sans">Skala 4.00</p>
                </div>

                <div className="p-3 rounded-xl border-2 border-ink bg-surface shadow-retro-sm">
                  <p className="text-xs font-sans font-bold text-gray-dark uppercase tracking-wider">SKS Lulus</p>
                  <p className="font-heading font-bold text-xl sm:text-2xl text-ink mt-1">72 SKS</p>
                  <p className="text-[11px] text-gray-dark font-bold font-sans">Target: 144 SKS</p>
                </div>

                <div className="p-3 rounded-xl border-2 border-ink bg-surface shadow-retro-sm">
                  <p className="text-xs font-sans font-bold text-gray-dark uppercase tracking-wider">SKS Semester Ini</p>
                  <p className="font-heading font-bold text-xl sm:text-2xl text-ink mt-1">21 SKS</p>
                  <p className="text-[11px] text-gray-dark font-bold font-sans">Maksimal: 24 SKS</p>
                </div>

                <div className="p-3 rounded-xl border-2 border-ink bg-surface shadow-retro-sm">
                  <p className="text-xs font-sans font-bold text-gray-dark uppercase tracking-wider">Presensi Rata-Rata</p>
                  <p className="font-heading font-bold text-xl sm:text-2xl text-ink mt-1">94%</p>
                  <p className="text-[11px] text-gray-dark font-bold font-sans">Syarat UAS &ge;75%</p>
                </div>
              </div>

              {/* Detail Tabel Data Mahasiswa */}
              <div className="border-2 border-ink rounded-xl overflow-hidden bg-surface divide-y-2 divide-ink/20 text-xs font-sans shadow-xs">
                <div className="flex justify-between p-3 bg-gray-soft/40">
                  <span className="text-gray-dark font-bold">Nomor Induk Mahasiswa (NIM)</span>
                  <span className="font-sans font-bold text-ink">2024001</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-gray-dark font-bold">Dosen Pembimbing Akademik (Wali)</span>
                  <span className="font-bold text-ink">Dr. Ardiansyah, S.T., M.Kom.</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-soft/40">
                  <span className="text-gray-dark font-bold">Status Keaktifan Kuliah</span>
                  <span className="font-bold text-ink">Aktif Memprogram KRS</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-gray-dark font-bold">Jalur Masuk & Tahun</span>
                  <span className="font-bold text-ink">Seleksi Mandiri Prestasi (2024)</span>
                </div>
              </div>

              {/* Tombol Aksi Cepat ke Fitur Akademik */}
              <div className="pt-2 flex flex-wrap gap-2">
                <Link
                  href="/calendar"
                  className="px-3.5 py-2 rounded-lg border-2 border-ink bg-surface hover:bg-gray-soft shadow-xs text-xs font-bold text-ink transition-all"
                >
                  Jadwal & Kalender &rarr;
                </Link>
                <Link
                  href="/grades"
                  className="px-3.5 py-2 rounded-lg border-2 border-ink bg-surface hover:bg-gray-soft shadow-xs text-xs font-bold text-ink transition-all"
                >
                  Nilai & Progres &rarr;
                </Link>
                <Link
                  href="/portfolio"
                  className="px-3.5 py-2 rounded-lg border-2 border-ink bg-surface hover:bg-gray-soft shadow-xs text-xs font-bold text-ink transition-all"
                >
                  Portofolio Belajar &rarr;
                </Link>
              </div>
            </div>

            {/* LENCANA PRESTASI AKADEMIK */}
            <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4">
              <div className="flex items-center justify-between border-b-2 border-ink/20 pb-3">
                <h3 className="font-heading font-bold text-base sm:text-lg text-ink flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  <span>Lencana Prestasi & Pencapaian Belajar</span>
                </h3>
                <span className="text-xs font-sans font-bold px-2.5 py-1 rounded-full border-2 border-ink bg-gray-soft text-ink shadow-xs">
                  {badges.filter((b) => b.isUnlocked).length} / {badges.length} Terbuka
                </span>
              </div>

              <p className="text-xs text-gray-dark font-bold">
                Pengakuan otomatis atas konsistensi belajar, ketepatan waktu pengumpulan, kehadiran penuh, dan keaktifan forum diskusi.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {badges.map((b) => {
                  const IconComponent =
                    b.iconName === 'CalendarCheck2'
                      ? Calendar
                      : b.iconName === 'Flame'
                      ? Flame
                      : b.iconName === 'Clock'
                      ? Clock
                      : Sparkles;

                  return (
                    <div
                      key={b.id}
                      className="p-4 rounded-xl border-2 border-ink bg-surface shadow-retro-sm flex items-start gap-3.5 hover:-translate-y-0.5 transition-all"
                    >
                      <div className="p-2.5 rounded-lg border-2 border-ink bg-gray-soft text-ink shrink-0">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-heading font-bold text-xs sm:text-sm text-ink truncate">
                            {b.title}
                          </h4>
                          <span className="px-1.5 py-0.5 rounded-full border-2 border-ink bg-surface text-[11px] font-bold text-ink font-sans shrink-0 shadow-xs">
                            ✓ Terbuka
                          </span>
                        </div>
                        <p className="text-xs text-gray-dark font-bold font-sans leading-relaxed">
                          {b.description}
                        </p>
                        <div className="pt-1.5 flex items-center justify-between text-[11px] font-sans font-bold text-gray-dark border-t-2 border-ink/10 mt-1">
                          <span className="text-ink">{b.progress}</span>
                          <span>{b.earnedAt}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DOKUMEN & UNDUHAN MAHASISWA */}
            <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4">
              <div className="flex items-center justify-between border-b-2 border-ink/20 pb-3">
                <h3 className="font-heading font-bold text-base sm:text-lg text-ink flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  <span>Dokumen Akademik Resmi</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl border-2 border-ink bg-surface shadow-retro-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink">KTM Digital</span>
                    <Award className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xs text-gray-dark font-bold font-sans">Kartu Tanda Mahasiswa aktif ber-barcode resmi.</p>
                  <button
                    type="button"
                    className="w-full py-1.5 rounded-lg border-2 border-ink bg-gray-soft text-xs font-bold text-ink hover:bg-gray-soft/80 shadow-xs transition-colors"
                  >
                    Unduh KTM
                  </button>
                </div>

                <div className="p-4 rounded-xl border-2 border-ink bg-surface shadow-retro-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink">Transkrip Nilai</span>
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xs text-gray-dark font-bold font-sans">Rekap nilai kumulatif dan progres studi.</p>
                  <Link
                    href="/grades"
                    className="block text-center w-full py-1.5 rounded-lg border-2 border-ink bg-gray-soft text-xs font-bold text-ink hover:bg-gray-soft/80 shadow-xs transition-colors"
                  >
                    Buka Nilai & Progres
                  </Link>
                </div>

                <div className="p-4 rounded-xl border-2 border-ink bg-surface shadow-retro-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink">Sertifikat & Prestasi</span>
                    <Award className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xs text-gray-dark font-bold font-sans">Daftar sertifikat dan pencapaian akademik.</p>
                  <Link
                    href="/certificates"
                    className="block text-center w-full py-1.5 rounded-lg border-2 border-ink bg-gray-soft text-xs font-bold text-ink hover:bg-gray-soft/80 shadow-xs transition-colors"
                  >
                    Buka Sertifikat
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN (1 SPAN): HAK AKSES PERAN & KEAMANAN AKUN */}
          <div className="space-y-5 sm:space-y-6">
            {/* MULTI-PERAN AKTIF */}
            <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-3.5">
              <div className="flex items-center justify-between border-b-2 border-ink/20 pb-2.5">
                <h3 className="font-heading font-bold text-sm sm:text-base text-ink flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <span>Hak Akses Peran ({roles.length})</span>
                </h3>
              </div>

              <p className="text-xs text-gray-dark font-bold">
                Akun Anda memiliki izin multi-peran. Anda dapat berpindah ruang kerja kapan saja:
              </p>

              <div className="space-y-2">
                {roles.map((r) => {
                  const roleCode = (r.roles as { code?: string })?.code || 'STUDENT';
                  const isCurrent = roleCode === activeRole;
                  return (
                    <div
                      key={roleCode}
                      className="flex items-center justify-between p-2.5 rounded-lg border-2 border-ink bg-surface shadow-xs text-xs font-sans"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        <span className="font-bold text-ink">{roleCode}</span>
                      </div>
                      {isCurrent ? (
                        <span className="font-bold text-white bg-primary px-2.5 py-0.5 rounded-full text-[11px] border-2 border-ink shadow-xs">
                          Sedang Aktif
                        </span>
                      ) : (
                        <span className="text-xs text-gray-dark font-bold">Tersedia</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <Link
                href="/workspace"
                className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-lg border-2 border-ink bg-primary text-white font-heading font-bold text-xs shadow-retro-sm hover:brightness-105 transition-all text-center mt-3"
              >
                <Layers className="h-4 w-4" />
                <span>Buka Menu Ganti Workspace</span>
              </Link>
            </div>

            {/* KEAMANAN & SESI LOGIN */}
            <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-3 text-xs font-sans">
              <div className="flex items-center justify-between border-b-2 border-ink/20 pb-2.5">
                <h3 className="font-heading font-bold text-sm sm:text-base text-ink flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" />
                  <span>Keamanan & Sesi</span>
                </h3>
              </div>

              <div className="space-y-2 text-gray-dark font-bold">
                <div className="flex justify-between py-1 border-b-2 border-ink/10">
                  <span>Status Password</span>
                  <span className="text-ink">Kuat & Terverifikasi</span>
                </div>
                <div className="flex justify-between py-1 border-b-2 border-ink/10">
                  <span>Perangkat Anda</span>
                  <span className="text-ink">Windows / Desktop</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Lokasi Terakhir</span>
                  <span className="text-ink">Pekanbaru, Riau</span>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <Link
                  href="/devices"
                  className="flex items-center justify-between p-2.5 rounded-lg border-2 border-ink bg-gray-soft hover:bg-gray-soft/80 transition-colors font-bold text-xs text-ink shadow-xs"
                >
                  <span>Kelola Perangkat & Sesi</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center justify-between p-2.5 rounded-lg border-2 border-ink bg-gray-soft hover:bg-gray-soft/80 transition-colors font-bold text-xs text-ink shadow-xs"
                >
                  <span>Preferensi Notifikasi</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
