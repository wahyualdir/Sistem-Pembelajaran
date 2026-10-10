import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Mail,
  ShieldCheck,
  GraduationCap,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Laptop,
  KeyRound,
  Download,
  ExternalLink,
  Layers,
  ArrowRight,
  Flame,
  FileText,
} from 'lucide-react';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { RetroWindow } from '@/components/retro/retro-window';

export default async function ProfilePage() {
  const userContext = await getCurrentUserWithRoles();

  if (!userContext) {
    redirect('/login');
  }

  const { user, profile, roles, activeRole } = userContext;
  const fullName = profile?.full_name || 'Wahyu Aldiriyanto';
  const email = profile?.email || user.email || 'wahyualdiriyanto80@gmail.com';

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
    <div className="p-6 sm:p-9 w-full space-y-8 animate-fade-up">
      {/* ======================================================== */}
      {/* 1. HEADER HALAMAN PROFIL DENGAN GAYA RETRO WINDOW (MATCH IMAGES) */}
      {/* ======================================================== */}
      <RetroWindow
        title="identitas_pengguna_uir.card"
        badge="TERVERIFIKASI"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-6 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar Kotak Retro dengan Border & Shadow */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border-[2px] border-retro-border bg-retro-warm shadow-retro-md flex items-center justify-center text-4xl font-mono font-black text-retro-orange overflow-hidden">
              {initials}
            </div>
            <div className="absolute -bottom-2 -right-2 p-1.5 rounded-full border border-retro-border bg-retro-mint shadow-retro text-retro-border" title="Status Akun Aktif">
              <CheckCircle2 className="h-4 w-4 text-black" />
            </div>
          </div>

          {/* Info Utama Pengguna */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-foreground">
                {fullName}
              </h1>
              {roles.map((r) => {
                const code = (r.roles as { code?: string })?.code || '';
                const isCurrentActive = activeRole === code;
                const label = ROLE_NAMES[code] || code;
                return (
                  <span
                    key={r.id}
                    className={`rounded-full border border-retro-border px-3 py-0.5 text-xs font-bold shadow-xs ${
                      isCurrentActive
                        ? 'bg-retro-orange text-white'
                        : 'bg-retro-mint text-black'
                    }`}
                  >
                    {label.toUpperCase()}{isCurrentActive ? ' • AKTIF' : ''}
                  </span>
                );
              })}
            </div>

            <p className="text-sm font-medium text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="h-4 w-4 text-retro-orange" />
              <span>{email}</span>
              <span className="text-xs text-muted-foreground">&bull; NIM: 2024001</span>
            </p>

            <p className="text-xs text-muted-foreground">
              Program Studi: <strong className="text-foreground">Teknik Informatika (S1)</strong> &bull; Fakultas Ilmu Komputer &bull; Universitas Islam Riau
            </p>

            {/* Quick Badges Bar */}
            <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
              <span className="rounded border border-retro-border bg-retro-warm px-2.5 py-1 text-xs font-semibold text-foreground">
                Angkatan 2024
              </span>
              <span className="rounded border border-retro-border bg-retro-warm px-2.5 py-1 text-xs font-semibold text-foreground">
                Semester 5 (Ganjil 2026/2027)
              </span>
              <span className="rounded border border-retro-border bg-retro-yellow px-2.5 py-1 text-xs font-bold text-black shadow-xs">
                IPK: 3.85
              </span>
              <span className="rounded border border-retro-border bg-retro-mint px-2.5 py-1 text-xs font-bold text-black shadow-xs">
                UKT: LUNAS
              </span>
            </div>
          </div>
        </div>
      </RetroWindow>

      {/* ======================================================== */}
      {/* 2. GRID INFORMASI: AKADEMIK & HAK AKSES */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KOLOM KIRI (2 SPAN): DATA AKADEMIK & PERKULIAHAN */}
        <div className="lg:col-span-2 space-y-6">
          <RetroWindow
            title="ringkasan_akademik.window"
            headerClassName="bg-retro-warm"
            bodyClassName="p-5 space-y-4"
          >
            <h2 className="font-heading font-black text-base text-foreground flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-retro-orange" />
              <span>Data Riwayat Akademik Terpadu</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-lg border border-retro-border bg-retro-warm shadow-retro">
                <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase">IPK Kumulatif</p>
                <p className="font-heading font-black text-xl text-retro-orange mt-1">3.85</p>
                <p className="text-[10px] text-muted-foreground">Skala 4.00</p>
              </div>

              <div className="p-3 rounded-lg border border-retro-border bg-retro-warm shadow-retro">
                <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase">SKS Lulus</p>
                <p className="font-heading font-black text-xl text-foreground mt-1">72 SKS</p>
                <p className="text-[10px] text-muted-foreground">Target: 144 SKS</p>
              </div>

              <div className="p-3 rounded-lg border border-retro-border bg-retro-warm shadow-retro">
                <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase">SKS Semester Ini</p>
                <p className="font-heading font-black text-xl text-foreground mt-1">21 SKS</p>
                <p className="text-[10px] text-muted-foreground">Maksimal: 24 SKS</p>
              </div>

              <div className="p-3 rounded-lg border border-retro-border bg-retro-warm shadow-retro">
                <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase">Presensi Rata-Rata</p>
                <p className="font-heading font-black text-xl text-success mt-1">94%</p>
                <p className="text-[10px] text-muted-foreground">Syarat UAS &ge;75%</p>
              </div>
            </div>

            {/* Detail Tabel Data Mahasiswa */}
            <div className="border border-retro-border rounded-lg overflow-hidden bg-retro-surface divide-y divide-retro-border text-xs">
              <div className="flex justify-between p-3 bg-retro-bg">
                <span className="text-muted-foreground font-medium">Nomor Induk Mahasiswa (NIM)</span>
                <span className="font-mono font-bold text-foreground">2024001</span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-muted-foreground font-medium">Dosen Pembimbing Akademik (Wali)</span>
                <span className="font-bold text-foreground">Dr. Ardiansyah, S.T., M.Kom.</span>
              </div>
              <div className="flex justify-between p-3 bg-retro-bg">
                <span className="text-muted-foreground font-medium">Status Keaktifan Kuliah</span>
                <span className="font-bold text-success">Aktif Memprogram KRS</span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-muted-foreground font-medium">Jalur Masuk & Tahun</span>
                <span className="font-medium text-foreground">Seleksi Mandiri Prestasi (2024)</span>
              </div>
            </div>

            {/* Tombol Aksi Cepat ke Fitur Akademik */}
            <div className="pt-2 flex flex-wrap gap-2">
              <Link
                href="/calendar"
                className="px-3.5 py-2 rounded-md border border-retro-border bg-retro-surface hover:bg-retro-warm shadow-retro text-xs font-bold transition-all"
              >
                Jadwal & Kalender &rarr;
              </Link>
              <Link
                href="/grades"
                className="px-3.5 py-2 rounded-md border border-retro-border bg-retro-surface hover:bg-retro-warm shadow-retro text-xs font-bold transition-all"
              >
                Nilai & Progres &rarr;
              </Link>
              <Link
                href="/portfolio"
                className="px-3.5 py-2 rounded-md border border-retro-border bg-retro-surface hover:bg-retro-warm shadow-retro text-xs font-bold transition-all"
              >
                Portofolio Belajar &rarr;
              </Link>
            </div>
          </RetroWindow>

          {/* DOKUMEN & UNDUHAN MAHASISWA */}
          <RetroWindow
            title="dokumen_resmi_mahasiswa.tab"
            headerClassName="bg-retro-mint/40"
            bodyClassName="p-5 space-y-3"
          >
            <h2 className="font-heading font-black text-base text-foreground flex items-center gap-2">
              <Download className="h-5 w-5 text-retro-orange" />
              <span>Dokumen Akademik Resmi</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-lg border border-retro-border bg-retro-surface shadow-retro space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">KTM Digital</span>
                  <Award className="h-4 w-4 text-retro-orange" />
                </div>
                <p className="text-[11px] text-muted-foreground">Kartu Tanda Mahasiswa aktif ber-barcode resmi.</p>
                <button
                  type="button"
                  className="w-full py-1.5 rounded border border-retro-border bg-retro-warm text-xs font-bold hover:bg-retro-yellow transition-colors"
                >
                  Unduh KTM
                </button>
              </div>

              <div className="p-3.5 rounded-lg border border-retro-border bg-retro-surface shadow-retro space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Transkrip Nilai</span>
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <p className="text-[11px] text-muted-foreground">Rekap nilai kumulatif dan progres studi.</p>
                <Link
                  href="/grades"
                  className="block text-center w-full py-1.5 rounded border border-retro-border bg-retro-warm text-xs font-bold hover:bg-retro-yellow transition-colors"
                >
                  Buka Nilai & Progres
                </Link>
              </div>

              <div className="p-3.5 rounded-lg border border-retro-border bg-retro-surface shadow-retro space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Sertifikat & Prestasi</span>
                  <Award className="h-4 w-4 text-info" />
                </div>
                <p className="text-[11px] text-muted-foreground">Daftar sertifikat dan pencapaian akademik.</p>
                <Link
                  href="/certificates"
                  className="block text-center w-full py-1.5 rounded border border-retro-border bg-retro-warm text-xs font-bold hover:bg-retro-yellow transition-colors"
                >
                  Buka Sertifikat
                </Link>
              </div>
            </div>
          </RetroWindow>
        </div>

        {/* KOLOM KANAN (1 SPAN): HAK AKSES PERAN & KEAMANAN AKUN */}
        <div className="space-y-6">
          {/* MULTI-PERAN AKTIF */}
          <RetroWindow
            title="peran_akses_rbac.config"
            headerClassName="bg-retro-purple/40"
            bodyClassName="p-5 space-y-3.5"
          >
            <h2 className="font-heading font-black text-sm text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-retro-orange" />
              <span>Hak Akses Peran Aktif ({roles.length})</span>
            </h2>

            <p className="text-xs text-muted-foreground">
              Akun Anda memiliki izin multi-peran (Super Admin). Anda dapat berpindah ruang kerja kapan saja:
            </p>

            <div className="space-y-2">
              {roles.map((r) => {
                const roleCode = (r.roles as { code?: string })?.code || 'STUDENT';
                const isCurrent = roleCode === activeRole;
                return (
                  <div
                    key={roleCode}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-retro-border bg-retro-surface shadow-xs text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-retro-orange" />
                      <span className="font-bold text-foreground">{roleCode}</span>
                    </div>
                    {isCurrent ? (
                      <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-[10px]">
                        Sedang Aktif
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Tersedia</span>
                    )}
                  </div>
                );
              })}
            </div>

            <Link
              href="/workspace"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-md border-[1.5px] border-retro-border bg-retro-orange text-white font-bold text-xs shadow-retro hover:bg-retro-orange/90 transition-all text-center mt-3"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Buka Menu Ganti Workspace</span>
            </Link>
          </RetroWindow>

          {/* KEAMANAN & SESI LOGIN */}
          <RetroWindow
            title="keamanan_sesi.lock"
            headerClassName="bg-retro-warm"
            bodyClassName="p-5 space-y-3 text-xs"
          >
            <h2 className="font-heading font-black text-sm text-foreground flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-retro-orange" />
              <span>Keamanan & Sesi</span>
            </h2>

            <div className="space-y-2 text-muted-foreground">
              <div className="flex justify-between py-1 border-b border-retro-border/40">
                <span>Status Password</span>
                <span className="font-bold text-success">Kuat & Terverifikasi</span>
              </div>
              <div className="flex justify-between py-1 border-b border-retro-border/40">
                <span>Perangkat Anda</span>
                <span className="font-medium text-foreground">Windows / Desktop</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Lokasi Terakhir</span>
                <span className="font-medium text-foreground">Pekanbaru, Riau</span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <Link
                href="/devices"
                className="flex items-center justify-between p-2 rounded border border-retro-border bg-retro-warm hover:bg-retro-yellow transition-colors font-bold text-xs"
              >
                <span>Kelola Perangkat & Sesi</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/notifications/preferences"
                className="flex items-center justify-between p-2 rounded border border-retro-border bg-retro-warm hover:bg-retro-yellow transition-colors font-bold text-xs"
              >
                <span>Preferensi Notifikasi</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </RetroWindow>
        </div>
      </div>
    </div>
  );
}
