import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import {
  FileSpreadsheet,
  Users,
  UserCheck,
  Compass,
  BookOpen,
  Calendar,
  MapPin,
  CalendarDays,
  Award,
  Layers,
  Download,
  ArrowRight,
  GraduationCap,
  CheckSquare,
  Clock,
  FileText,
  Building,
  CheckCircle2,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';

interface PageProps {
  params: {
    slug: string[];
  };
}

const STAFF_STATS = [
  {
    title: 'Mahasiswa Terdaftar',
    value: '2,840 Mhs',
    desc: 'Registrasi aktif semester ganjil',
    badge: '100% Terverifikasi',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-400',
  },
  {
    title: 'Dosen Tetap & Luar Biasa',
    value: '142 Dosen',
    desc: 'Terdaftar NIDN/NUPN nasional',
    badge: 'Aktif Mengajar',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-400',
  },
  {
    title: 'Ruang Kuliah & Lab',
    value: '38 Ruang',
    desc: 'Semua memiliki titik GPS terkalibrasi',
    badge: 'Geofence Siap',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-400',
  },
  {
    title: 'Kelas Perkuliahan',
    value: '94 Rombel',
    desc: 'Jadwal terdistribusi tanpa bentrok',
    badge: 'Jadwal Final',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-400',
  },
];

export default async function StaffSubpage({ params }: PageProps) {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;

  if (role === 'SYSTEM_ADMIN') {
    redirect('/admin/system');
  }
  if (role === 'SUPER_ADMIN' && !user?.isImpersonating) {
    redirect('/admin');
  }
  if (role === 'STUDENT') {
    redirect('/student');
  }
  if (role === 'LECTURER') {
    redirect('/lecturer');
  }
  if (role === 'PROGRAM_COORDINATOR') {
    redirect('/coordinator');
  }
  if (role === 'TEACHING_ASSISTANT') {
    redirect('/ta');
  }

  const parts = params.slug || [];
  const fullSlug = parts.join('/');

  // --- REDIRECTS UNTUK RUTE /staff/* LAMA KE TAB-TAB BARU (Fase 2D) ---
  const LEGACY_REDIRECTS: Record<string, string> = {
    'master/departments': '/staff/master?tab=program-studi',
    'master/courses': '/staff/master?tab=mata-kuliah',
    'master/academic-years': '/staff/master?tab=tahun-ajaran',
    'master/rooms': '/staff/master?tab=ruang-dan-titik-lokasi',
    'schedules/classes': '/staff/schedules?tab=jadwal-kuliah',
    'schedules/exams': '/staff/schedules?tab=jadwal-ujian',
    'schedules/rooms': '/staff/schedules?tab=penggunaan-ruang',
    'classes/enroll': '/staff/classes?tab=enroll-peserta',
    'classes/import': '/staff/classes?tab=impor-csv',
    'classes/transfer': '/staff/classes?tab=pindah-kelas',
    'grades/recap': '/staff/grades?tab=rekap-nilai',
    'attendance/recap': '/staff/grades?tab=rekap-presensi',
    'grades/change-requests': '/staff/grades?tab=perubahan-nilai',
    'reports/export': '/staff/grades?tab=ekspor-laporan',
  };

  if (LEGACY_REDIRECTS[fullSlug]) {
    redirect(LEGACY_REDIRECTS[fullSlug]);
  }

  // --- HALAMAN STANDALONE (Mahasiswa, Dosen, Verifikasi Berkas) ---
  const sectionTitles: Record<string, { title: string; subtitle: string; icon: any; desc: string }> = {
    'master/students': {
      title: 'Data Master Mahasiswa',
      subtitle: 'Direktori Mahasiswa Aktif & Status Registrasi',
      icon: Users,
      desc: 'Pencarian data NIM, status registrasi semester, program studi, dan akun pengguna mahasiswa.',
    },
    'master/lecturers': {
      title: 'Data Master Dosen',
      subtitle: 'Direktori NIDN & Tenaga Pengajar',
      icon: UserCheck,
      desc: 'Kelola data dosen pengampu, NIDN, jabatan fungsional, dan asosiasi program studi.',
    },
    'services/verification': {
      title: 'Layanan Verifikasi Berkas Mahasiswa',
      subtitle: 'Legalisir Transkrip & Surat Keterangan Aktif',
      icon: FileText,
      desc: 'Verifikasi keaslian dokumen akademik dan surat keterangan mahasiswa aktif kuliah.',
    },
  };

  const current = sectionTitles[fullSlug] || {
    title: 'Layanan Administrasi Akademik',
    subtitle: 'Sistem Pembelajaran Terpadu LMS SIAJAR',
    icon: FileSpreadsheet,
    desc: 'Pengelolaan data master, penjadwalan kelas, pendaftaran rombel, dan verifikasi berkas.',
  };
  const Icon = current.icon;

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      <RetroWindow
        title={`staf_akademik_${fullSlug.replace('/', '_')}.app`}
        subtitle={current.subtitle}
        headerBadge="Staf Akademik"
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

      {/* Grid 4 Kartu Metrik Administrasi Kampus Full Width */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {STAFF_STATS.map((s) => (
          <div
            key={s.title}
            className="rounded-xl border-2 border-black bg-white p-5 shadow-retro space-y-2 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-muted-foreground">{s.title}</span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${s.badgeColor}`}>
                  {s.badge}
                </span>
              </div>
              <p className="font-heading font-black text-2xl text-foreground mt-1">{s.value}</p>
            </div>
            <p className="text-xs text-muted-foreground border-t border-neutral-100 pt-2 font-mono">
              {s.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Grid 3 Kartu Navigasi Hub Terkait */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-retro-orange" />
              <h3 className="font-heading font-black text-base text-foreground">Kelas & Peserta Kuliah</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Daftarkan rombongan belajar baru atau lakukan sinkronisasi massal via impor berkas spreadsheet CSV.
            </p>
          </div>
          <Link
            href="/staff/classes"
            className="inline-flex items-center justify-between p-2.5 rounded-lg border-2 border-black bg-neutral-50 hover:bg-neutral-100 text-xs font-bold font-mono transition-all"
          >
            <span>Buka Kelas & Peserta</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-retro-orange" />
              <h3 className="font-heading font-black text-base text-foreground">Jadwal Kuliah & Ujian</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Alokasikan slot waktu dan ruang kuliah dengan proteksi deteksi bentrok ruang dan dosen otomatis.
            </p>
          </div>
          <Link
            href="/staff/schedules"
            className="inline-flex items-center justify-between p-2.5 rounded-lg border-2 border-black bg-neutral-50 hover:bg-neutral-100 text-xs font-bold font-mono transition-all"
          >
            <span>Buka Penjadwalan</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-retro-orange" />
              <h3 className="font-heading font-black text-base text-foreground">Nilai & Presensi Institusi</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Audit nilai akhir, eksekusi perubahan nilai yang disetujui Kaprodi, dan unduh laporan Feeder PDDIKTI.
            </p>
          </div>
          <Link
            href="/staff/grades"
            className="inline-flex items-center justify-between p-2.5 rounded-lg border-2 border-black bg-neutral-50 hover:bg-neutral-100 text-xs font-bold font-mono transition-all"
          >
            <span>Buka Nilai & Presensi</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
