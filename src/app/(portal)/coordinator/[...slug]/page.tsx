import React from 'react';
import Link from 'next/link';
import {
  Compass,
  BookOpen,
  Layers,
  Users,
  FolderArchive,
  Activity,
  UserCheck,
  AlertCircle,
  ShieldAlert,
  FileSpreadsheet,
  CheckCircle2,
  Award,
  CheckSquare,
  FileText,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';

interface PageProps {
  params: {
    slug: string[];
  };
}

const COORDINATOR_METRICS = [
  {
    title: 'Keterlaksanaan Kelas',
    value: '96.2%',
    desc: '24 dari 24 kelas berjalan sesuai silabus',
    badge: 'Tercapai',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-400',
  },
  {
    title: 'Beban Mengajar Dosen (BKD)',
    value: '12 - 16 SKS',
    desc: 'Rata-rata 14.2 SKS per dosen tetap',
    badge: 'Optimal',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-400',
  },
  {
    title: 'Mahasiswa Perlu Perhatian',
    value: '8 Mahasiswa',
    desc: 'Kehadiran <75% atau indeks tugas tertunda',
    badge: 'Perlu Tindakan',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-400',
  },
  {
    title: 'Pengajuan Menunggu Persetujuan',
    value: '3 Berkas',
    desc: 'Soal ujian, revisi nilai, dan kelas baru',
    badge: 'Pending Review',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-400',
  },
];

import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';

export default async function CoordinatorSubpage({ params }: PageProps) {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;

  if (role === 'SYSTEM_ADMIN') {
    redirect('/admin/system');
  }
  if (role === 'SUPER_ADMIN' && !user?.isImpersonating) {
    redirect('/admin');
  }
  if (role !== 'PROGRAM_COORDINATOR' && !user?.isImpersonating) {
    if (role === 'LECTURER') redirect('/lecturer');
    if (role === 'STUDENT') redirect('/student');
    if (role === 'TEACHING_ASSISTANT') redirect('/ta');
    if (role === 'ACADEMIC_STAFF') redirect('/staff');
    redirect('/login');
  }

  const parts = params.slug || [];
  const fullSlug = parts.join('/');

  // Redirection mappings for merged subroutes into new tabbed hubs
  if (fullSlug === 'lecturers') {
    redirect('/coordinator/assignments?tab=dosen-pengampu');
  }
  if (fullSlug === 'classes') {
    redirect('/coordinator/assignments?tab=kelas-prodi');
  }
  if (fullSlug === 'monitoring/classes') {
    redirect('/coordinator/monitoring?tab=kelas');
  }
  if (fullSlug === 'monitoring/lecturers') {
    redirect('/coordinator/monitoring?tab=dosen');
  }
  if (fullSlug === 'monitoring/attendance') {
    redirect('/coordinator/monitoring?tab=presensi');
  }
  if (fullSlug === 'monitoring/exams') {
    redirect('/coordinator/monitoring?tab=ujian');
  }
  if (fullSlug === 'monitoring/at-risk') {
    redirect('/coordinator/monitoring?tab=kelas');
  }
  if (fullSlug === 'approvals/classes') {
    redirect('/coordinator/approvals?tab=kelas-baru');
  }
  if (fullSlug === 'approvals/exams') {
    redirect('/coordinator/approvals?tab=soal-ujian');
  }
  if (fullSlug === 'approvals/grades') {
    redirect('/coordinator/approvals?tab=perubahan-nilai');
  }
  if (fullSlug === 'approvals/other') {
    redirect('/coordinator/approvals?tab=lainnya');
  }
  if (fullSlug === 'evaluations') {
    redirect('/coordinator/reports?tab=evaluasi-dosen');
  }
  if (fullSlug === 'cpl') {
    redirect('/coordinator/reports?tab=capaian-cpl');
  }
  if (fullSlug === 'reports') {
    redirect('/coordinator/reports?tab=laporan-prodi');
  }

  const sectionTitles: Record<string, { title: string; subtitle: string; icon: any; desc: string }> = {
    curriculum: {
      title: 'Kurikulum & Capaian Pembelajaran (CPL)',
      subtitle: 'Standarisasi Capaian Pembelajaran Lulusan Prodi',
      icon: BookOpen,
      desc: 'Pemetaan butir CPL, keterkaitan dengan mata kuliah, dan matriks kurikulum berbasis Outcome-Based Education (OBE).',
    },
    courses: {
      title: 'Mata Kuliah Program Studi',
      subtitle: 'Struktur Mata Kuliah & Prasyarat',
      icon: Layers,
      desc: 'Pengaturan daftar mata kuliah wajib dan pilihan, bobot SKS, serta silabus mata kuliah.',
    },
    lecturers: {
      title: 'Penugasan Dosen Pengampu',
      subtitle: 'Distribusi Beban Kerja Dosen (BKD)',
      icon: Users,
      desc: 'Penetapan dosen pengampu kelas, koordinator mata kuliah, dan pembagian kelas paralel prodi.',
    },
    classes: {
      title: 'Kelola Kelas Program Studi',
      subtitle: 'Pengawasan Rombongan Belajar Prodi',
      icon: FolderArchive,
      desc: 'Daftar seluruh kelas aktif di lingkungan program studi untuk semester berjalan.',
    },
    'monitoring/classes': {
      title: 'Monitoring Keterlaksanaan Kelas',
      subtitle: 'Realisasi Pertemuan & Kontrak Kuliah',
      icon: Activity,
      desc: 'Pantau kemajuan jumlah pertemuan perkuliahan per kelas menuju target 16 pertemuan.',
    },
    'monitoring/lecturers': {
      title: 'Monitoring Aktivitas Dosen',
      subtitle: 'Presensi Dosen & Pembaruan Materi',
      icon: UserCheck,
      desc: 'Evaluasi ketepatan jadwal mengajar dosen pengampu dan ketuntasan silabus ajar.',
    },
    'monitoring/at-risk': {
      title: 'Mahasiswa Berisiko Akademik',
      subtitle: 'Deteksi Dini Drop-out & Kehadiran Rendah',
      icon: AlertCircle,
      desc: 'Daftar mahasiswa dengan kehadiran <75%, IPK di bawah standar, atau belum mengumpulkan tugas utama.',
    },
    'monitoring/exams': {
      title: 'Ujian Berlangsung di Prodi',
      subtitle: 'Supervisi Integritas UTS & UAS',
      icon: ShieldAlert,
      desc: 'Pantau status jalannya ujian semester, sesi live proctoring, dan ketaatan jadwal ujian prodi.',
    },
    'monitoring/attendance': {
      title: 'Rekap Presensi Program Studi',
      subtitle: 'Statistik Kehadiran Mahasiswa & Dosen',
      icon: FileSpreadsheet,
      desc: 'Agregasi persentase kehadiran per angkatan, per mata kuliah, dan per dosen pengampu.',
    },
    'approvals/classes': {
      title: 'Persetujuan Pembukaan Kelas Baru',
      subtitle: 'Validasi Kuota & Jadwal Kelas',
      icon: CheckCircle2,
      desc: 'Verifikasi pengajuan kelas tambahan atau pemecahan rombongan belajar.',
    },
    'approvals/exams': {
      title: 'Persetujuan Soal Ujian (Moderasi Soal)',
      subtitle: 'Kesesuaian Soal dengan Indikator CPL',
      icon: Award,
      desc: 'Moderasi naskah soal UTS dan UAS dari dosen pengampu sebelum diterbitkan ke mahasiswa.',
    },
    'approvals/grades': {
      title: 'Persetujuan Perubahan Nilai',
      subtitle: 'Alur Sah Koreksi Nilai Perkuliahan',
      icon: CheckSquare,
      desc: 'Otorisasi resmi atas pengajuan revisi nilai akhir oleh dosen setelah masa sanggah ujian.',
    },
    'approvals/other': {
      title: 'Pengajuan & Dispensasi Lainnya',
      subtitle: 'Dispensasi Akademik & Cuti Kuliah',
      icon: FileText,
      desc: 'Permohonan dispensasi keterlambatan presensi, ujian susulan, dan rekomendasi studi.',
    },
    reports: {
      title: 'Laporan Kinerja Program Studi',
      subtitle: 'Laporan Evaluasi Semester & Akreditasi',
      icon: FileSpreadsheet,
      desc: 'Kompilasi laporan ketercapaian akademik prodi untuk Badan Penjaminan Mutu dan akreditasi.',
    },
    evaluations: {
      title: 'Evaluasi Kinerja Dosen oleh Mahasiswa',
      subtitle: 'Hasil Kuesioner EDOM & Umpan Balik',
      icon: Award,
      desc: 'Rekapitulasi survei kepuasan mahasiswa terhadap proses belajar mengajar dosen.',
    },
    cpl: {
      title: 'Ketercapaian CPL Mahasiswa',
      subtitle: 'Pengukuran Portofolio OBE Mahasiswa',
      icon: Activity,
      desc: 'Analisis spider-web capaian CPL lulusan untuk evaluasi efektivitas kurikulum.',
    },
  };

  const current = sectionTitles[fullSlug] || {
    title: 'Manajemen Program Studi',
    subtitle: 'Sistem Pembelajaran Terpadu LMS SIAJAR',
    icon: Compass,
    desc: 'Pengawasan kurikulum, monitoring mutu perkuliahan, dan persetujuan akademik program studi.',
  };
  const Icon = current.icon;

  return (
    <div className="p-6 sm:p-9 w-full space-y-8 animate-fade-up">
      <RetroWindow
        title={current.title}
        headerBadge="Mode Kaprodi"
        headerBadgeVariant="warning"
      >
        <div className="p-6 sm:p-8 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground flex items-center gap-3">
            <Icon className="h-7 w-7 text-primary" />
            <span>{current.title}</span>
          </h1>
          <p className="text-sm sm:text-base text-black font-bold max-w-3xl leading-relaxed">
            {current.desc}
          </p>
        </div>
      </RetroWindow>

      {/* Grid 4 Kartu Metrik Monitoring Prodi Full Width */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {COORDINATOR_METRICS.map((m) => (
          <div
            key={m.title}
            className="rounded-xl border-2 border-black bg-white p-5 shadow-retro space-y-2 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-muted-foreground">{m.title}</span>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${m.badgeColor}`}>
                  {m.badge}
                </span>
              </div>
              <p className="font-heading font-black text-2xl text-foreground mt-1">{m.value}</p>
            </div>
            <p className="text-xs text-muted-foreground border-t border-neutral-100 pt-2 font-mono">
              {m.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Grid 3 Kartu Tindakan & Status Program Studi Full Width */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h3 className="font-heading font-black text-base text-foreground">Pemetaan Kurikulum OBE</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              12 Indikator Capaian Pembelajaran Lulusan (CPL) terhubung dengan 48 mata kuliah wajib program studi.
            </p>
          </div>
          <Link
            href="/coordinator/curriculum"
            className="inline-flex items-center justify-between p-2.5 rounded-lg border-2 border-black bg-neutral-50 hover:bg-neutral-100 text-xs font-bold font-mono transition-all"
          >
            <span>Buka Matriks CPL</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <h3 className="font-heading font-black text-base text-foreground">Supervisi Ujian Semester</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Seluruh sesi ujian UTS/UAS dipantau real-time dengan standar proctoring anti-kecurangan prodi.
            </p>
          </div>
          <Link
            href="/coordinator/monitoring/exams"
            className="inline-flex items-center justify-between p-2.5 rounded-lg border-2 border-black bg-neutral-50 hover:bg-neutral-100 text-xs font-bold font-mono transition-all"
          >
            <span>Pantau Ujian Prodi</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              <h3 className="font-heading font-black text-base text-foreground">Antrean Otorisasi Nilai</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Verifikasi berita acara perubahan nilai dari dosen pengampu sebelum disahkan ke Biro Akademik.
            </p>
          </div>
          <Link
            href="/coordinator/approvals/grades"
            className="inline-flex items-center justify-between p-2.5 rounded-lg border-2 border-black bg-neutral-50 hover:bg-neutral-100 text-xs font-bold font-mono transition-all"
          >
            <span>Tinjau Pengajuan</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
