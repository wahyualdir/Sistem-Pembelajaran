import React from 'react';
import Link from 'next/link';
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

export default function StaffSubpage({ params }: PageProps) {
  const parts = params.slug || [];
  const fullSlug = parts.join('/');

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
    'master/departments': {
      title: 'Data Master Program Studi',
      subtitle: 'Fakultas, Jenjang & Kode Prodi',
      icon: Compass,
      desc: 'Struktur departemen akademik, jenjang pendidikan (D3/S1/S2), dan kepemimpinan prodi.',
    },
    'master/courses': {
      title: 'Data Master Mata Kuliah',
      subtitle: 'Katalog Mata Kuliah & Kode MK',
      icon: BookOpen,
      desc: 'Repositori mata kuliah institusi, bobot SKS teori/praktikum, dan deskripsi kompetensi.',
    },
    'master/academic-years': {
      title: 'Data Master Tahun Ajaran & Semester',
      subtitle: 'Kalender Akademik & Periode Aktif',
      icon: Calendar,
      desc: 'Penetapan semester ganjil/genap aktif, batas pengisian nilai, dan tanggal mulai perkuliahan.',
    },
    'master/rooms': {
      title: 'Data Master Ruang & Titik Lokasi Kampus',
      subtitle: 'Geolokasi GPS, Gedung & Kapasitas Kursi',
      icon: MapPin,
      desc: 'Kelola koordinat GPS ruang kuliah untuk validasi presensi geofencing serta kapasitas ruang.',
    },
    'schedules/classes': {
      title: 'Penjadwalan Kuliah Mingguan',
      subtitle: 'Alokasi Hari, Jam, Ruang & Dosen Pengampu',
      icon: CalendarDays,
      desc: 'Penyusunan jadwal kuliah terhindar dari bentrok ruang maupun bentrok dosen.',
    },
    'schedules/exams': {
      title: 'Penjadwalan Ujian (UTS & UAS)',
      subtitle: 'Distribusi Waktu & Ruang Ujian Terpadu',
      icon: Award,
      desc: 'Jadwal pelaksanaan ujian semester beserta penugasan dosen pengawas ruang.',
    },
    'schedules/rooms': {
      title: 'Monitoring Penggunaan Ruang Kuliah',
      subtitle: 'Okupansi Ruang & Pemakaian Laboratorium',
      icon: Layers,
      desc: 'Pantau pemanfaatan ruang kelas dan laboratorium komputer secara real-time.',
    },
    'classes/enroll': {
      title: 'Pendaftaran Peserta Kelas (Enroll)',
      subtitle: 'Registrasi Mahasiswa ke Rombongan Belajar',
      icon: Users,
      desc: 'Pendaftaran manual atau batch mahasiswa ke dalam kelas kuliah aktif semester berjalan.',
    },
    'classes/import': {
      title: 'Impor Data Kelas & Mahasiswa via CSV',
      subtitle: 'Batch Import & Sinkronisasi Massal',
      icon: Download,
      desc: 'Unggah berkas spreadsheet CSV untuk registrasi massal mahasiswa, kelas, atau nilai.',
    },
    'classes/transfer': {
      title: 'Pindah Kelas & Rombongan Belajar',
      subtitle: 'Mutasi Peserta Antar Kelas Paralel',
      icon: ArrowRight,
      desc: 'Pemindahan mahasiswa dari satu kelas paralel ke kelas lain tanpa kehilangan riwayat belajar.',
    },
    'grades/recap': {
      title: 'Rekapitulasi Nilai Tingkat Universitas',
      subtitle: 'Laporan Nilai Bersih & Transkrip',
      icon: GraduationCap,
      desc: 'Kompilasi nilai akhir seluruh mata kuliah sebelum penerbitan KHS resmi.',
    },
    'attendance/recap': {
      title: 'Rekapitulasi Presensi Perkuliahan',
      subtitle: 'Statistik Kehadiran Mahasiswa Institusi',
      icon: CheckSquare,
      desc: 'Audit kepatuhan kehadiran mahasiswa dan verifikasi kelayakan mengikuti ujian akhir.',
    },
    'grades/change-requests': {
      title: 'Pengajuan Perubahan Nilai',
      subtitle: 'Alur Administratif Revisi Nilai Dosen',
      icon: Clock,
      desc: 'Staf memverifikasi kelengkapan berkas berita acara perubahan nilai yang telah disetujui Kaprodi.',
    },
    'reports/export': {
      title: 'Ekspor Laporan Akademik Terpadu',
      subtitle: 'Laporan Feeder PDDIKTI & Format Resmi',
      icon: FileSpreadsheet,
      desc: 'Ekspor data transaksi akademik untuk pelaporan PDDIKTI dan audit internal universitas.',
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
    <div className="p-6 sm:p-9 w-full space-y-8 animate-fade-up">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Grid 3 Kartu Alur Kerja Administrasi Full Width */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-retro-orange" />
              <h3 className="font-heading font-black text-base text-foreground">Enroll Peserta & CSV Batch</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Daftarkan rombongan belajar baru atau lakukan sinkronisasi massal via impor berkas spreadsheet CSV.
            </p>
          </div>
          <Link
            href="/staff/classes/enroll"
            className="inline-flex items-center justify-between p-2.5 rounded-lg border-2 border-black bg-neutral-50 hover:bg-neutral-100 text-xs font-bold font-mono transition-all"
          >
            <span>Buka Pendaftaran Kelas</span>
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
            href="/staff/schedules/classes"
            className="inline-flex items-center justify-between p-2.5 rounded-lg border-2 border-black bg-neutral-50 hover:bg-neutral-100 text-xs font-bold font-mono transition-all"
          >
            <span>Buka Penjadwalan</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-retro-orange" />
              <h3 className="font-heading font-black text-base text-foreground">Ekspor PDDIKTI & Feeder</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Generate laporan transaksional nilai dan presensi semester untuk pelaporan resmi Pangkalan Data Dikti.
            </p>
          </div>
          <Link
            href="/staff/reports/export"
            className="inline-flex items-center justify-between p-2.5 rounded-lg border-2 border-black bg-neutral-50 hover:bg-neutral-100 text-xs font-bold font-mono transition-all"
          >
            <span>Buka Ekspor Laporan</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
