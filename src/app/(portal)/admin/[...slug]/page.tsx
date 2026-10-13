import React from 'react';
import Link from 'next/link';
import {
  Server,
  Code,
  Activity,
  AlertCircle,
  Globe,
  MapPin,
  MessageSquare,
  Key,
  Sliders,
  Laptop,
  ShieldAlert,
  Clock,
  FolderArchive,
  ShieldCheck,
  Users,
  BookOpen,
  Award,
  FileText,
  Bell,
  UserCheck,
  ArrowRight,
  Database,
  Lock,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { ImpersonateUserCard } from '../impersonate-user-card';

interface PageProps {
  params: {
    slug: string[];
  };
}

const SYSTEM_HEALTH_CARDS = [
  {
    name: 'Basis Data PostgreSQL',
    cluster: 'Primary Multi-AZ',
    status: 'ONLINE 100%',
    statusColor: 'bg-emerald-100 text-emerald-900 border-emerald-400',
    latency: '12ms Latency',
    connections: '42 / 200 Pool',
  },
  {
    name: 'Judge0 Sandbox Live Coding',
    cluster: 'Isolated Worker Nodes',
    status: 'READY (0 Antrean)',
    statusColor: 'bg-emerald-100 text-emerald-900 border-emerald-400',
    latency: 'Memory Limit: 256MB',
    connections: 'Timeout: 5s Sandbox',
  },
  {
    name: 'WebSocket & Live Proctoring',
    cluster: 'Event Broadcast Channel',
    status: 'CONNECTED',
    statusColor: 'bg-emerald-100 text-emerald-900 border-emerald-400',
    latency: 'Throughput: 1.2k req/s',
    connections: 'Heartbeat: Aktif',
  },
  {
    name: 'Object Storage & Bukti Presensi',
    cluster: 'S3-Compatible Storage',
    status: 'AMBILAN LANCAR',
    statusColor: 'bg-emerald-100 text-emerald-900 border-emerald-400',
    latency: 'Kapasitas: 48GB / 500GB',
    connections: 'Enkripsi AES-256',
  },
];

import { assertServerRole } from '@/lib/auth/server-guards';

export default async function AdminSubpage({ params }: PageProps) {
  const parts = params.slug || [];
  const fullSlug = parts.join('/');

  const isSystemSubpage =
    fullSlug.startsWith('system') ||
    fullSlug.startsWith('integrations') ||
    fullSlug.startsWith('security') ||
    fullSlug.startsWith('backup') ||
    fullSlug.startsWith('audit');

  if (isSystemSubpage) {
    await assertServerRole(['SYSTEM_ADMIN', 'SUPER_ADMIN', 'SUPERADMIN']);
  } else {
    await assertServerRole(['SUPER_ADMIN', 'SUPERADMIN']);
  }

  const sectionTitles: Record<string, { title: string; subtitle: string; icon: any; desc: string }> = {
    'system/status': {
      title: 'Status Server & Komponen Infrastruktur',
      subtitle: 'Health Check, Uptime & Penggunaan Resource',
      icon: Server,
      desc: 'Pantau kinerja CPU, memori, koneksi basis data Supabase/PostgreSQL, dan latensi endpoint API.',
    },
    'system/sandbox': {
      title: 'Antrean Sandbox Coding Mahasiswa',
      subtitle: 'Isolasi Eksekusi Kode Live Coding (Judge0 / Piston)',
      icon: Code,
      desc: 'Pengawasan antrean eksekusi sandbox kode, batasan memory limit, timeout, dan isolasi jaringan agar server utama aman.',
    },
    'system/realtime': {
      title: 'Koneksi Realtime & WebSocket',
      subtitle: 'Kanal Broadcast Pengawasan Ujian & Presensi',
      icon: Activity,
      desc: 'Metrik throughput saluran realtime, heartbeat aktif, dan latensi pengiriman event ujian.',
    },
    'system/errors': {
      title: 'Log Error & Pengecualian Sistem',
      subtitle: 'Error Tracking & Exception Reporting',
      icon: AlertCircle,
      desc: 'Pelacakan jejak tumpukan error (stack trace) backend dan klien untuk troubleshooting sistem.',
    },
    'integrations/meeting': {
      title: 'Integrasi Video Conference (Zoom / Google Meet)',
      subtitle: 'Sinkronisasi Tautan Kelas Tatap Muka Virtual',
      icon: Globe,
      desc: 'Konfigurasi kredensial OAuth Zoom dan Google Meet untuk pembukaan ruang kelas daring otomatis.',
    },
    'integrations/maps': {
      title: 'Integrasi Peta & Geolokasi (Google Maps API)',
      subtitle: 'Peta Presensi Kampus & Geofencing',
      icon: MapPin,
      desc: 'Konfigurasi Google Maps API Key untuk peta interaktif, fallback OpenStreetMap/Leaflet berdesain retro.',
    },
    'integrations/sandbox': {
      title: 'Konfigurasi Sandbox Live Coding',
      subtitle: 'Runner Bahasa Pemrograman (JS, Python, TS, SQL)',
      icon: Code,
      desc: 'Manajemen host sandbox terisolasi, batasan resource kontainer, dan runtime compiler/interpreter.',
    },
    'integrations/gateway': {
      title: 'Email & WhatsApp Notification Gateway',
      subtitle: 'Kanal Notifikasi Pengingat Tenggat & Ujian',
      icon: MessageSquare,
      desc: 'Pengaturan API WhatsApp Gateway dan SMTP email transaksional untuk notifikasi multi-kanal.',
    },
    'integrations/sso': {
      title: 'Single Sign-On (SSO) & Kredensial Kampus',
      subtitle: 'Integrasi LDAP, SAML, dan OAuth Institusi',
      icon: Key,
      desc: 'Autentikasi terpusat berbasis identitas institusi kampus untuk mahasiswa dan tenaga pendidik.',
    },
    'integrations/api-keys': {
      title: 'Manajemen Kunci API & Webhook',
      subtitle: 'Akses API Terproteksi untuk Sistem Eksternal',
      icon: Sliders,
      desc: 'Pembuatan dan rotasi token otorisasi API untuk integrasi sistem perpustakaan dan keuangan.',
    },
    'security/sessions': {
      title: 'Sesi Login Aktif Seluruh Pengguna',
      subtitle: 'Monitoring Perangkat & IP Sesi Berjalan',
      icon: Laptop,
      desc: 'Pengawasan sesi aktif lintas platform dan kemampuan pemutusan sesi (force revoke) demi keamanan.',
    },
    'security/suspicious': {
      title: 'Deteksi Aktivitas Login Mencurigakan',
      subtitle: 'Anomali Lokasi, Brute Force & Percobaan Ilegal',
      icon: ShieldAlert,
      desc: 'Peringatan otomatis atas percobaan login berulang dengan kredensial salah atau pergantian IP mendadak.',
    },
    'security/rate-limits': {
      title: 'Konfigurasi Rate Limiting',
      subtitle: 'Perlindungan Throttling Endpoint Kritis',
      icon: Clock,
      desc: 'Pembatasan laju pemanggilan API login, submit jawaban kuis, pemindaian QR presensi, dan kirim lokasi.',
    },
    'security/backup': {
      title: 'Cadangan & Pemulihan Basis Data (Backup & Restore)',
      subtitle: 'Snapshot Data Akademik Berkala',
      icon: FolderArchive,
      desc: 'Penjadwalan backup harian basis data dan uji pemulihan bencana (disaster recovery).',
    },
    'settings/branding': {
      title: 'Platform, Nama Kampus & Identitas Visual',
      subtitle: 'Konfigurasi Lembaga & Nama Portal SIAJAR',
      icon: Sliders,
      desc: 'Pengaturan metadata institusi pendidikan tinggi, nama universitas, dan favicon.',
    },
    'settings/ai': {
      title: 'Pengaturan Mesin AI SIAJAR',
      subtitle: 'Konfigurasi Model LLM, Prompt & Token Limit',
      icon: Sliders,
      desc: 'Pengaturan parameter asisten AI untuk pembuatan kuis latihan, ringkasan materi, dan review tugas.',
    },
    'settings/storage': {
      title: 'Penyimpanan Berkas & Media (Object Storage)',
      subtitle: 'Kuota Penyimpanan Tugas, Materi & Bukti Presensi',
      icon: FolderArchive,
      desc: 'Konfigurasi bucket penyimpanan S3 / Supabase Storage, batasan ukuran unggahan berkas (max 20MB).',
    },
    audit: {
      title: 'Jejak Audit Keamanan (Audit Log)',
      subtitle: 'Log Append-Only Perubahan Nilai, Presensi & Hak Akses',
      icon: ShieldCheck,
      desc: 'Rekaman transaksi tak terhapuskan (immutable) untuk transparansi perubahan nilai dan aksi administratif.',
    },
    master: {
      title: 'Kelola Pengguna Institusi',
      subtitle: 'Manajemen Akun Mahasiswa, Dosen, Staf & Admin',
      icon: Users,
      desc: 'Daftar pengguna terdaftar di seluruh tingkatan peran dengan filter NIM, NIDN, NIP, dan username.',
    },
    roles: {
      title: 'Manajemen Peran & Hak Akses (RBAC)',
      subtitle: 'Konfigurasi Izin granular 7 Role SIAJAR',
      icon: ShieldAlert,
      desc: 'Penetapan matriks izin per role: Super Admin, System Admin, Kaprodi, Staf, Dosen, Mhs, dan Asisten.',
    },
    impersonate: {
      title: 'Fitur Impersonate Pengguna (Super Admin)',
      subtitle: 'Masuk Sebagai Pengguna Lain untuk Bantuan Teknis',
      icon: UserCheck,
      desc: 'Kemampuan Super Admin untuk menyamar sementara ke akun pengguna lain. Wajib tercatat di Audit Log dengan banner aktif.',
    },
    kebijakan: {
      title: 'Kebijakan Akademik Universitas',
      subtitle: 'Standar Kelulusan, Beban SKS & Ambang Nilai',
      icon: BookOpen,
      desc: 'Konfigurasi aturan baku institusi: syarat UAS kehadiran 75%, batas maksimal 24 SKS, dan KKM.',
    },
    'kebijakan-ujian': {
      title: 'Kebijakan Ujian & Pengawasan Proctoring',
      subtitle: 'Toleransi Pelanggaran & Batasan Akses Perangkat',
      icon: Award,
      desc: 'Pengaturan batas maksimal pelanggaran ujian, kebijakan fullscreen, dan sanksi diskualifikasi otomatis.',
    },
    retensi: {
      title: 'Kebijakan Privasi & Retensi Data',
      subtitle: 'Penyimpanan Data Sensitif (Biometrik & Koordinat GPS)',
      icon: FileText,
      desc: 'Aturan penghapusan berkala koordinat presensi dan bukti foto sesuai regulasi perlindungan data pribadi (UU PDP).',
    },
    pengumuman: {
      title: 'Pengumuman Global Universitas',
      subtitle: 'Siaran Berita & Pemberitahuan Seluruh Sivitas Akademika',
      icon: Bell,
      desc: 'Penerbitan maklumat resmi rektorat yang tampil di dasbor seluruh sivitas akademika.',
    },
  };

  const current = sectionTitles[fullSlug] || {
    title: 'Administrasi Sistem SIAJAR',
    subtitle: 'Sistem Pembelajaran Terpadu LMS SIAJAR',
    icon: Server,
    desc: 'Pengelolaan infrastruktur, keamanan siber, dan kebijakan platform pembelajaran.',
  };
  const Icon = current.icon;

  return (
    <div className="p-6 sm:p-9 w-full space-y-8 animate-fade-up">
      <RetroWindow
        title={`admin_${fullSlug.replace('/', '_')}.sys`}
        subtitle={current.subtitle}
        headerBadge="Mode Administrator"
        headerBadgeVariant="warning"
      >
        <div className="p-6 sm:p-8 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground flex items-center gap-3">
            <Icon className="h-7 w-7 text-retro-orange" />
            <span>{current.title}</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-3xl leading-relaxed">
            {current.desc}
          </p>
        </div>
      </RetroWindow>

      {/* Tampilan Khusus Impersonate jika diakses */}
      {fullSlug === 'impersonate' ? (
        <div className="space-y-4">
          <div className="rounded-xl border-2 border-black bg-amber-50 p-4 shadow-retro text-xs text-amber-900 font-mono">
            <strong>PERINGATAN AUDIT:</strong> Fitur impersonasi hanya boleh digunakan untuk investigasi kendala teknis resmi. Setiap tindakan yang dilakukan selama impersonasi akan diberi label &quot;IMPERSONATED_BY_SUPERADMIN&quot; pada tabel audit log.
          </div>
          <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro">
            <ImpersonateUserCard />
          </div>
        </div>
      ) : (
        <>
          {/* Grid 4 Kartu Status Infrastruktur Full Width */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SYSTEM_HEALTH_CARDS.map((srv) => (
              <div
                key={srv.name}
                className="rounded-xl border-2 border-black bg-white p-5 shadow-retro space-y-2.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-muted-foreground uppercase">{srv.cluster}</span>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${srv.statusColor}`}>
                      {srv.status}
                    </span>
                  </div>
                  <h3 className="font-heading font-black text-base text-foreground mt-1">{srv.name}</h3>
                </div>

                <div className="pt-2 border-t border-neutral-100 space-y-0.5 text-xs font-mono text-muted-foreground">
                  <p>{srv.latency}</p>
                  <p>{srv.connections}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Grid 3 Kartu Tindakan Kebijakan & Keamanan Full Width */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-retro-orange" />
                  <h3 className="font-heading font-black text-base text-foreground">Audit Log Immutable</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Log append-only transaksi perubahan nilai ujian, presensi geofence, dan eskalasi izin hak akses.
                </p>
              </div>
              <Link
                href="/admin/audit"
                className="inline-flex items-center justify-between p-2.5 rounded-lg border-2 border-black bg-neutral-50 hover:bg-neutral-100 text-xs font-bold font-mono transition-all"
              >
                <span>Periksa Audit Trail</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-retro-orange" />
                  <h3 className="font-heading font-black text-base text-foreground">Proteksi & Throttling</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Proteksi brute-force login, rate limit submission kuis, dan geofencing toleransi presensi GPS.
                </p>
              </div>
              <Link
                href="/admin/security/rate-limits"
                className="inline-flex items-center justify-between p-2.5 rounded-lg border-2 border-black bg-neutral-50 hover:bg-neutral-100 text-xs font-bold font-mono transition-all"
              >
                <span>Kelola Keamanan</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-retro-orange" />
                  <h3 className="font-heading font-black text-base text-foreground">Kelola Pengguna & Peran</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Matriks RBAC multi-role 7 peran pengguna dengan login identitas tunggal NIM, NIDN, dan NIP.
                </p>
              </div>
              <Link
                href="/admin/master"
                className="inline-flex items-center justify-between p-2.5 rounded-lg border-2 border-black bg-neutral-50 hover:bg-neutral-100 text-xs font-bold font-mono transition-all"
              >
                <span>Kelola Akun & RBAC</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
