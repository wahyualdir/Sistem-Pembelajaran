import React from 'react';
import Link from 'next/link';
import {
  CheckSquare,
  Award,
  TrendingUp,
  Download,
  BookOpen,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';

interface CourseGrade {
  code: string;
  name: string;
  sks: number;
  attendancePercent: number;
  assignmentsScore: number;
  quizScore: number;
  midtermScore: number;
  finalScore: number;
  scoreNumber: number;
  gradeLetter: string;
  gradePoint: number;
  status: 'LULUS' | 'SEDANG_BERJALAN' | 'REMEDIAL';
}

const DEMO_GRADES: CourseGrade[] = [
  {
    code: 'TI-301',
    name: 'Pemrograman Web Lanjut',
    sks: 3,
    attendancePercent: 92,
    assignmentsScore: 88,
    quizScore: 90,
    midtermScore: 85,
    finalScore: 87,
    scoreNumber: 87.2,
    gradeLetter: 'A',
    gradePoint: 4.0,
    status: 'LULUS',
  },
  {
    code: 'TI-302',
    name: 'Rekayasa Perangkat Lunak',
    sks: 3,
    attendancePercent: 88,
    assignmentsScore: 82,
    quizScore: 78,
    midtermScore: 84,
    finalScore: 80,
    scoreNumber: 81.5,
    gradeLetter: 'A-',
    gradePoint: 3.7,
    status: 'LULUS',
  },
  {
    code: 'TI-401',
    name: 'Kecerdasan Buatan & Machine Learning',
    sks: 3,
    attendancePercent: 95,
    assignmentsScore: 94,
    quizScore: 88,
    midtermScore: 92,
    finalScore: 90,
    scoreNumber: 91.4,
    gradeLetter: 'A',
    gradePoint: 4.0,
    status: 'LULUS',
  },
  {
    code: 'TI-305',
    name: 'Basis Data Terdistribusi',
    sks: 3,
    attendancePercent: 85,
    assignmentsScore: 76,
    quizScore: 75,
    midtermScore: 78,
    finalScore: 74,
    scoreNumber: 76.0,
    gradeLetter: 'B+',
    gradePoint: 3.3,
    status: 'LULUS',
  },
  {
    code: 'TI-408',
    name: 'Keamanan Siber & Kriptografi',
    sks: 2,
    attendancePercent: 90,
    assignmentsScore: 85,
    quizScore: 80,
    midtermScore: 82,
    finalScore: 85,
    scoreNumber: 83.2,
    gradeLetter: 'A-',
    gradePoint: 3.7,
    status: 'LULUS',
  },
];

export default async function GradesPage() {
  const user = await getCurrentUserWithRoles();
  const totalSks = DEMO_GRADES.reduce((sum, c) => sum + c.sks, 0);
  const totalWeight = DEMO_GRADES.reduce((sum, c) => sum + c.sks * c.gradePoint, 0);
  const ipk = (totalWeight / totalSks).toFixed(2);

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW RETRO */}
      <RetroWindow
        title="nilai_dan_progres_studi.app"
        subtitle="Evaluasi Kinerja Akademik & Capaian Pembelajaran"
        headerBadge="Semester Ganjil 2026/2027"
        headerBadgeVariant="info"
        bodyClassName="p-4 sm:p-6 lg:p-8"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-1.5 sm:space-y-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-black tracking-tight text-foreground flex items-center gap-2.5 sm:gap-3">
              <CheckSquare className="h-6 w-6 sm:h-7 sm:w-7 text-retro-orange shrink-0" />
              <span>Nilai & Progres Pembelajaran</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-black font-medium max-w-2xl leading-relaxed">
              Pantau bobot nilai per komponen (tugas, kuis, ujian, presensi) dan proyeksi capaian indeks prestasi kumulatif semester ini secara transparan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-lg border-2 border-black bg-retro-yellow font-black text-sm sm:text-base text-black shadow-retro hover:bg-black hover:text-white transition-all"
            >
              <Award className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              <span>Portofolio Belajar</span>
            </Link>
          </div>
        </div>
      </RetroWindow>

      {/* 2. STATS GRID (IPK, SKS, KEHADIRAN) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-1.5">
          <div className="text-sm font-mono font-black uppercase text-black">
            Indeks Prestasi (IPS)
          </div>
          <div className="text-3xl sm:text-4xl font-heading font-black text-black">
            {ipk} <span className="text-sm font-bold text-black/70">/ 4.00</span>
          </div>
          <div className="text-sm font-black text-retro-orange flex items-center gap-1.5 pt-1">
            <TrendingUp className="h-4 w-4" />
            <span>Predikat Sangat Memuaskan</span>
          </div>
        </div>

        <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-1.5">
          <div className="text-sm font-mono font-black uppercase text-black">
            Total SKS Semester
          </div>
          <div className="text-3xl sm:text-4xl font-heading font-black text-black">
            {totalSks} <span className="text-sm font-bold text-black/70">SKS</span>
          </div>
          <div className="text-sm font-bold text-black pt-1">
            5 Mata Kuliah Terdaftar
          </div>
        </div>

        <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-1.5">
          <div className="text-sm font-mono font-black uppercase text-black">
            Rata-rata Kehadiran
          </div>
          <div className="text-3xl sm:text-4xl font-heading font-black text-black">
            90%
          </div>
          <div className="text-sm font-black text-black pt-1">
            ✓ Memenuhi Syarat UAS (&ge;75%)
          </div>
        </div>

        <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-1.5">
          <div className="text-sm font-mono font-black uppercase text-black">
            Status Akademik
          </div>
          <div className="text-3xl sm:text-4xl font-heading font-black text-black">
            Aktif
          </div>
          <div className="text-sm font-bold text-black pt-1">
            Bebas Tunggakan & Pelanggaran
          </div>
        </div>
      </div>

      {/* 3. TABEL RINCIAN NILAI MATA KULIAH */}
      <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
        <div className="p-5 bg-retro-warm border-b-2 border-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <h2 className="font-heading font-black text-lg sm:text-xl text-black">
            Rincian Nilai per Mata Kuliah ({DEMO_GRADES.length})
          </h2>
          <span className="text-sm font-mono font-black text-black">
            Bobot: Tugas (25%), Kuis (15%), UTS (30%), UAS (30%)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead className="border-b-2 border-black bg-retro-warm text-sm font-mono font-black uppercase text-black">
              <tr>
                <th className="p-4">Kode & Mata Kuliah</th>
                <th className="p-4 text-center">SKS</th>
                <th className="p-4 text-center">Hadir</th>
                <th className="p-4 text-center">Tugas</th>
                <th className="p-4 text-center">Kuis</th>
                <th className="p-4 text-center">UTS</th>
                <th className="p-4 text-center">UAS</th>
                <th className="p-4 text-center">Nilai Angka</th>
                <th className="p-4 text-center">Huruf</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black/10">
              {DEMO_GRADES.map((course) => (
                <tr key={course.code} className="hover:bg-retro-warm/30 transition-colors font-medium">
                  <td className="p-4">
                    <div className="font-black text-base sm:text-lg text-black">{course.name}</div>
                    <div className="text-sm font-mono font-bold text-black/80">{course.code}</div>
                  </td>
                  <td className="p-4 text-center font-mono font-black text-base text-black">{course.sks}</td>
                  <td className="p-4 text-center font-mono font-bold text-base text-black">{course.attendancePercent}%</td>
                  <td className="p-4 text-center font-mono font-bold text-base text-black">{course.assignmentsScore}</td>
                  <td className="p-4 text-center font-mono font-bold text-base text-black">{course.quizScore}</td>
                  <td className="p-4 text-center font-mono font-bold text-base text-black">{course.midtermScore}</td>
                  <td className="p-4 text-center font-mono font-bold text-base text-black">{course.finalScore}</td>
                  <td className="p-4 text-center font-mono font-black text-lg text-black">{course.scoreNumber.toFixed(1)}</td>
                  <td className="p-4 text-center">
                    <span className="inline-block px-3 py-1 rounded border-2 border-black bg-black text-white font-mono font-black text-sm shadow-xs">
                      {course.gradeLetter}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="inline-flex items-center px-3 py-1 rounded text-sm font-black bg-retro-mint border-2 border-black text-black">
                      {course.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
