'use server';

import { getCurrentUserWithRoles } from '@/modules/identity/actions';

export interface StudentBadge {
  id: string;
  code: string;
  title: string;
  description: string;
  category: 'PRESENSI' | 'KONSISTENSI' | 'TUGAS' | 'FORUM' | 'AKADEMIK';
  iconName: 'CalendarCheck2' | 'Flame' | 'Clock' | 'Sparkles' | 'Award';
  earnedAt: string;
  isUnlocked: boolean;
  progress: string;
}

export interface CourseCertificate {
  id: string;
  verificationCode: string;
  title: string;
  courseName: string;
  recipientName: string;
  studentNim: string; // Selalu gunakan NIM, TIDAK PERNAH email pribadi
  issuer: string;
  issuerRole: string;
  issueDate: string;
  grade: string;
  creditHours: string;
  signatureHash: string;
  status: 'RESMI' | 'TERVERIFIKASI' | 'DICABUT';
}

// In-memory store untuk lencana & sertifikat (termasuk verifikasi publik)
const certificateStore: {
  certificates: CourseCertificate[];
  badges: StudentBadge[];
} = ((globalThis as any).__siajarCertificates ??= {
  certificates: [
    {
      id: 'cert-1',
      verificationCode: 'UIR-CERT-2026-TI-0018',
      title: 'Sertifikat Kompetensi Pemrograman Web Lanjut (Fullstack)',
      courseName: 'Pemrograman Web Lanjut (TI-301)',
      recipientName: 'Wahyu Aldiriyanto',
      studentNim: '2024001',
      issuer: 'Fakultas Ilmu Komputer Universitas Islam Riau',
      issuerRole: 'Ketua Program Studi Teknik Informatika',
      issueDate: '30 September 2026',
      grade: 'Lulus dengan Pujian (Grade A)',
      creditHours: '64 Jam Pelajaran (3 SKS)',
      signatureHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      status: 'RESMI',
    },
    {
      id: 'cert-2',
      verificationCode: 'UIR-CERT-2026-TI-0024',
      title: 'Sertifikat Kompetensi Rekayasa Perangkat Lunak & Desain Sistem',
      courseName: 'Rekayasa Perangkat Lunak (TI-303)',
      recipientName: 'Wahyu Aldiriyanto',
      studentNim: '2024001',
      issuer: 'Laboratorium Rekayasa Perangkat Lunak UIR',
      issuerRole: 'Kepala Laboratorium Komputer',
      issueDate: '15 September 2026',
      grade: 'Lulus Sangat Memuaskan (Grade A)',
      creditHours: '48 Jam Pelajaran (3 SKS)',
      signatureHash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
      status: 'RESMI',
    },
    {
      id: 'cert-3',
      verificationCode: 'UIR-CERT-2026-TI-0031',
      title: 'Sertifikat Pelatihan Keamanan Siber & Kriptografi Modern',
      courseName: 'Keamanan Siber & Kriptografi (TI-408)',
      recipientName: 'Wahyu Aldiriyanto',
      studentNim: '2024001',
      issuer: 'Pusat Studi Cyber Defense & Forensik Digital',
      issuerRole: 'Direktur Pusat Riset Keamanan Sistem',
      issueDate: '20 Agustus 2026',
      grade: 'Kompeten (Grade A-)',
      creditHours: '32 Jam Praktikum Terpandu',
      signatureHash: '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce',
      status: 'RESMI',
    },
  ],
  badges: [
    {
      id: 'badge-1',
      code: 'KEHADIRAN_PENUH',
      title: 'Kehadiran Penuh Sebulan',
      description: 'Presensi 100% pada seluruh sesi perkuliahan aktif selama 30 hari kalender tanpa keterlambatan.',
      category: 'PRESENSI',
      iconName: 'CalendarCheck2',
      earnedAt: '01 Oktober 2026',
      isUnlocked: true,
      progress: '100% (16/16 Sesi)',
    },
    {
      id: 'badge-2',
      code: 'STREAK_30_HARI',
      title: 'Streak Belajar 30 Hari',
      description: 'Membuka modul kuliah, kuis, atau interaksi belajar secara konsisten selama 30 hari berturut-turut.',
      category: 'KONSISTENSI',
      iconName: 'Flame',
      earnedAt: '12 Oktober 2026',
      isUnlocked: true,
      progress: '30 / 30 Hari',
    },
    {
      id: 'badge-3',
      code: 'TEPAT_WAKTU',
      title: 'Tepat Waktu Sempurna',
      description: 'Semua tugas kuliah dan praktikum dikumpulkan sebelum deadline tanpa ada catatan terlambat.',
      category: 'TUGAS',
      iconName: 'Clock',
      earnedAt: '28 September 2026',
      isUnlocked: true,
      progress: '12 / 12 Tugas',
    },
    {
      id: 'badge-4',
      code: 'BINTANG_DISKUSI',
      title: 'Bintang Diskusi Kelas',
      description: 'Aktif memberikan kontribusi bermutu dan solusi jawaban terbaik di forum diskusi kelas.',
      category: 'FORUM',
      iconName: 'Sparkles',
      earnedAt: '05 Oktober 2026',
      isUnlocked: true,
      progress: '8 Jawaban Terbaik',
    },
  ],
});

/**
 * Mengambil daftar lencana pencapaian mahasiswa (Monochrome palette)
 */
export async function getStudentBadgesAction(studentId?: string): Promise<StudentBadge[]> {
  return certificateStore.badges;
}

/**
 * Mengambil daftar sertifikat kelulusan mata kuliah mahasiswa
 */
export async function getStudentCertificatesAction(studentId?: string): Promise<CourseCertificate[]> {
  return certificateStore.certificates;
}

/**
 * Verifikasi sertifikat publik berdasarkan kode unik (Dapat diakses publik tanpa login)
 */
export async function verifyCertificateByCodeAction(code: string): Promise<{
  isValid: boolean;
  certificate?: CourseCertificate;
  error?: string;
}> {
  if (!code || !code.trim()) {
    return { isValid: false, error: 'Kode verifikasi sertifikat wajib diisi.' };
  }

  const cleanCode = code.trim().toUpperCase();
  const cert = certificateStore.certificates.find(
    (c) => c.verificationCode.toUpperCase() === cleanCode
  );

  if (!cert) {
    return {
      isValid: false,
      error: `Sertifikat dengan kode verifikasi "${cleanCode}" tidak ditemukan atau belum terdaftar dalam pangkalan data ijazah & sertifikat SIAJAR UIR.`,
    };
  }

  return {
    isValid: true,
    certificate: cert,
  };
}


export interface StudentProjectItem {
  id: string;
  title: string;
  course: string;
  type: string;
  description: string;
  tech: string[];
  status: string;
  repo?: string;
}

export async function getStudentProjectsAction(): Promise<StudentProjectItem[]> {
  return [
    {
      id: 'proj-1',
      title: 'RuangKampus: LMS Enterprise & Proctoring',
      course: 'Pemrograman Web & Arsitektur Cloud (STI2544138)',
      type: 'Tugas Akhir Proyek',
      description:
        'Implementasi aplikasi manajemen perkuliahan dengan Next.js App Router, live panel proctoring ujian, compiler live coding sandbox, dan presensi QR haversine.',
      tech: ['Next.js 14', 'TypeScript', 'Prisma', 'PostgreSQL', 'Tailwind CSS'],
      status: 'Selesai (Skor: 95/100)',
      repo: 'github.com/wahyu/ruangkampus-lms',
    },
    {
      id: 'proj-2',
      title: 'AI Resume & Quiz Generator Engine',
      course: 'Pengenalan Kecerdasan Buatan (STI2543129)',
      type: 'Proyek Kelompok Riset',
      description:
        'Aplikasi pembaca modul PDF otomatis dan ekstraksi bank soal kuis bergradasi taksonomi Bloom menggunakan model machine learning dan semantic search.',
      tech: ['Python', 'FastAPI', 'PyTorch', 'Transformers', 'ChromaDB'],
      status: 'Selesai (Skor: 92/100)',
    },
  ];
}
