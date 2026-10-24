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
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { deterministicUuid } from '@/lib/akademik/deterministic-uuid';

interface PageProps {
  params: Promise<{ slug: string[] }> | { slug: string[] };
}

const COORDINATOR_METRICS = [
  {
    title: 'Keterlaksanaan Kelas',
    value: '96.2%',
    desc: '24 dari 24 kelas berjalan sesuai silabus',
    badge: 'Tercapai',
    badgeColor: 'bg-white text-[#111111] border border-[#E2E3E4]',
  },
  {
    title: 'Beban Mengajar Dosen (BKD)',
    value: '12 - 16 SKS',
    desc: 'Rata-rata 14.2 SKS per dosen tetap',
    badge: 'Optimal',
    badgeColor: 'bg-white text-[#111111] border border-[#E2E3E4]',
  },
  {
    title: 'Mahasiswa Perlu Perhatian',
    value: '8 Mahasiswa',
    desc: 'Kehadiran <75% atau indeks tugas tertunda',
    badge: 'Perlu Tindakan',
    badgeColor: 'bg-[#9F1521] text-white border border-[#9F1521]',
  },
  {
    title: 'Pengajuan Menunggu Persetujuan',
    value: '3 Berkas',
    desc: 'Soal ujian, revisi nilai, dan kelas baru',
    badge: 'Pending Review',
    badgeColor: 'bg-[#FFFFFF] text-[#111111] border border-[#E2E3E4]',
  },
];

const CONNECTED_PRODI_COURSES = [
  {
    classId: 'c0000000-0000-0000-0000-000000000001',
    code: 'STI2544138',
    name: 'Pemrograman Web & Arsitektur Cloud',
    sks: 3,
    semester: 'Semester 5 (Wajib)',
    cpl: 'CPL-01 · Rekayasa Perangkat Lunak',
    lecturer: 'Dr. Budi Santoso, M.Kom.',
    section: 'IF-3A (45 Mhs)',
  },
  {
    classId: 'c0000000-0000-0000-0000-000000000002',
    code: 'STI2543131',
    name: 'Algoritma & Struktur Data Lanjut',
    sks: 3,
    semester: 'Semester 3 (Wajib)',
    cpl: 'CPL-02 · Analisis Algoritmik',
    lecturer: 'Dr. Budi Santoso, M.Kom.',
    section: 'IF-3B (40 Mhs)',
  },
  {
    classId: 'c0000000-0000-0000-0000-000000000003',
    code: 'STI2541114',
    name: 'Basis Data Terdistribusi & Big Data',
    sks: 3,
    semester: 'Semester 3 (Wajib)',
    cpl: 'CPL-03 · Arsitektur Basis Data',
    lecturer: 'Dr. Budi Santoso, M.Kom.',
    section: 'IF-3C (42 Mhs)',
  },
  {
    classId: deterministicUuid('kls-sti2543130-3a'),
    code: 'STI2543130',
    name: 'Sistem Operasi',
    sks: 3,
    semester: 'Semester 3 (Wajib)',
    cpl: 'CPL-04 · Infrastruktur & Sistem',
    lecturer: 'Dr. Eng. Ir. Hendra Gunawan, S.Kom., M.T.',
    section: 'IF-3A (38 Mhs)',
  },
  {
    classId: deterministicUuid('kls-sti2543129-3a'),
    code: 'STI2543129',
    name: 'Pengenalan Kecerdasan Buatan',
    sks: 3,
    semester: 'Semester 3 (Wajib)',
    cpl: 'CPL-05 · Sistem Cerdas & Data',
    lecturer: 'Siti Nurhaliza, M.Cs.',
    section: 'IF-3A (40 Mhs)',
  },
];

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

  const resolvedParams = await Promise.resolve(params);
  const parts = resolvedParams?.slug || [];
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
      desc: 'Pengaturan daftar mata kuliah wajib dan pilihan, bobot SKS, serta silabus mata kuliah yang terhubung langsung ke kelas aktif.',
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
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up font-sans">
      <RetroWindow
        title={current.title}
        badge="Mode Kaprodi"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 bg-white"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-[#111111] flex items-center gap-3">
              <Icon className="h-7 w-7 text-[#9F1521]" />
              <span>{current.title}</span>
            </h1>
            <p className="text-sm sm:text-base text-[#58595B] font-medium max-w-3xl leading-relaxed">
              {current.desc}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/coordinator/assignments"
              className="px-3.5 py-2 rounded-lg border border-[#E2E3E4] bg-[#FFFFFF] hover:bg-[#F3F3F4] text-xs font-semibold text-[#111111] transition-colors"
            >
              Penugasan Dosen
            </Link>
            <Link
              href="/classes"
              className="px-3.5 py-2 rounded-lg bg-[#111111] hover:bg-[#9F1521] text-white text-xs font-semibold transition-colors"
            >
              Semua Rombel Kelas &rarr;
            </Link>
          </div>
        </div>
      </RetroWindow>

      {/* Stat Strip Monitoring Prodi (1 Pita Terpadu, Minim Card) */}
      <div className="rounded-2xl border border-[#E2E3E4] bg-[#FFFFFF] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E2E3E4] overflow-hidden">
        {COORDINATOR_METRICS.map((m) => (
          <div
            key={m.title}
            className="p-5 space-y-2 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase text-[#808285]">{m.title}</span>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${m.badgeColor}`}>
                  {m.badge}
                </span>
              </div>
              <p className="font-heading font-bold text-2xl sm:text-3xl text-[#111111] mt-2">{m.value}</p>
            </div>
            <p className="text-xs text-[#808285] pt-1 font-sans">
              {m.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Tabel Mata Kuliah & Matriks Kurikulum Terhubung */}
      <div className="rounded-xl border border-[#E2E3E4] bg-white overflow-hidden">
        <div className="p-4 sm:p-5 bg-[#FFFFFF] border-b border-[#E2E3E4] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-heading font-bold text-base sm:text-lg text-[#111111]">
              Daftar Mata Kuliah & Rombel Kurikulum Aktif (Teknik Informatika UIR)
            </h2>
            <p className="text-xs text-[#58595B]">
              Klik mata kuliah atau tombol ruang kelas untuk meninjau silabus, pertemuan, dan penugasan langsung di kelas terkait.
            </p>
          </div>
          <Link
            href="/coordinator/reports?tab=capaian-cpl"
            className="text-xs font-semibold text-[#9F1521] hover:underline shrink-0"
          >
            Lihat Analisis Capaian CPL &rarr;
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-sans">
            <thead className="border-b border-[#E2E3E4] bg-[#FFFFFF] text-xs font-bold uppercase text-[#58595B]">
              <tr>
                <th className="py-3.5 px-4">Kode MK</th>
                <th className="py-3.5 px-4">Mata Kuliah</th>
                <th className="py-3.5 px-3 text-center">SKS</th>
                <th className="py-3.5 px-4">Indikator CPL OBE</th>
                <th className="py-3.5 px-4">Dosen Pengampu</th>
                <th className="py-3.5 px-4 text-right">Rombel Terhubung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E3E4]">
              {CONNECTED_PRODI_COURSES.map((course) => (
                <tr key={course.code} className="hover:bg-[#FFFFFF] transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#9F1521]">
                    {course.code}
                  </td>
                  <td className="py-3.5 px-4">
                    <Link
                      href={`/classes/${course.classId}`}
                      className="font-heading font-bold text-sm text-[#111111] hover:text-[#9F1521] transition-colors block"
                    >
                      {course.name}
                    </Link>
                    <span className="text-xs text-[#808285]">{course.semester}</span>
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono font-bold text-xs text-[#111111]">
                    {course.sks} SKS
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-[#FFFFFF] border border-[#E2E3E4] text-xs font-semibold text-[#111111]">
                      {course.cpl}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-semibold text-[#58595B]">
                    {course.lecturer}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/classes/${course.classId}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E3E4] bg-[#FFFFFF] hover:bg-[#111111] hover:text-white text-xs font-semibold text-[#111111] transition-colors"
                    >
                      <span>{course.section}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid 3 Kartu Tindakan & Status Program Studi Full Width */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-xl border border-[#E2E3E4] bg-white p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#9F1521]" />
              <h3 className="font-heading font-bold text-base text-[#111111]">Pemetaan Kurikulum OBE</h3>
            </div>
            <p className="text-xs text-[#58595B] leading-relaxed">
              12 Indikator Capaian Pembelajaran Lulusan (CPL) terhubung dengan 63 mata kuliah kurikulum Teknik Informatika UIR.
            </p>
          </div>
          <Link
            href="/coordinator/reports?tab=capaian-cpl"
            className="inline-flex items-center justify-between p-2.5 rounded-lg border border-[#E2E3E4] bg-[#FFFFFF] hover:bg-[#F3F3F4] text-xs font-semibold text-[#111111] transition-all"
          >
            <span>Buka Matriks CPL</span>
            <ArrowRight className="h-4 w-4 text-[#111111]" />
          </Link>
        </div>

        <div className="rounded-xl border border-[#E2E3E4] bg-white p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-[#9F1521]" />
              <h3 className="font-heading font-bold text-base text-[#111111]">Supervisi Ujian Semester</h3>
            </div>
            <p className="text-xs text-[#58595B] leading-relaxed">
              Seluruh sesi ujian UTS/UAS dipantau real-time dengan standar proctoring anti-kecurangan prodi.
            </p>
          </div>
          <Link
            href="/coordinator/monitoring?tab=ujian"
            className="inline-flex items-center justify-between p-2.5 rounded-lg border border-[#E2E3E4] bg-[#FFFFFF] hover:bg-[#F3F3F4] text-xs font-semibold text-[#111111] transition-all"
          >
            <span>Pantau Ujian Prodi</span>
            <ArrowRight className="h-4 w-4 text-[#111111]" />
          </Link>
        </div>

        <div className="rounded-xl border border-[#E2E3E4] bg-white p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-[#9F1521]" />
              <h3 className="font-heading font-bold text-base text-[#111111]">Antrean Otorisasi Nilai</h3>
            </div>
            <p className="text-xs text-[#58595B] leading-relaxed">
              Verifikasi berita acara perubahan nilai dari dosen pengampu sebelum disahkan ke Biro Akademik.
            </p>
          </div>
          <Link
            href="/coordinator/approvals?tab=perubahan-nilai"
            className="inline-flex items-center justify-between p-2.5 rounded-lg border border-[#E2E3E4] bg-[#FFFFFF] hover:bg-[#F3F3F4] text-xs font-semibold text-[#111111] transition-all"
          >
            <span>Tinjau Pengajuan</span>
            <ArrowRight className="h-4 w-4 text-[#111111]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
