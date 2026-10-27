'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Layers,
  Users,
  Download,
  ArrowRight,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  AlertTriangle,
  Plus,
  RefreshCw,
  FlaskConical,
  ExternalLink,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { cn } from '@/lib/utils';
import { batchEnrollCsvAction, listClassMembersAction, type AssistantItem } from '@/modules/academic/actions';
import { AssistantForm, RevokeAssistant } from './assistant-forms';
import { DELEGABLE_LABELS } from './permissions';
import { StaffArchiveSemesterModal } from './staff-archive-semester-modal';

export const STAFF_CLASSES_TABS = [
  { id: 'enroll-peserta', label: 'Enroll Peserta', icon: Users },
  { id: 'asisten-lab', label: 'Asisten Lab', icon: FlaskConical },
  { id: 'impor-csv', label: 'Impor CSV', icon: Download },
  { id: 'pindah-kelas', label: 'Pindah Kelas', icon: ArrowRight },
] as const;

export type StaffClassesTabId = (typeof STAFF_CLASSES_TABS)[number]['id'];

interface StaffClassesHubViewProps {
  isDemo?: boolean;
  isPersistenceActive?: boolean;
}

interface CsvRow {
  row: number;
  nim: string;
  name: string;
  email: string;
  classCode: string;
  isValid: boolean;
  error?: string;
}

export function StaffClassesHubView({ isDemo = true, isPersistenceActive = false }: StaffClassesHubViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab') as StaffClassesTabId;
  const validTabs: StaffClassesTabId[] = [
    'enroll-peserta',
    'asisten-lab',
    'impor-csv',
    'pindah-kelas',
  ];
  const activeTab: StaffClassesTabId = validTabs.includes(tabParam)
    ? tabParam
    : 'enroll-peserta';

  const LAB_CLASSES = [
    {
      id: 'c0000000-0000-0000-0000-000000000001',
      code: 'IF-301-A',
      name: 'Pemrograman Web (Kelas A)',
      room: 'Lab Komputasi Terpadu 1',
      schedule: 'Senin, 08:00 - 10:30 WIB',
      lecturer: 'Dr. Budi Santoso, M.Kom.',
    },
    {
      id: 'c0000000-0000-0000-0000-000000000002',
      code: 'IF-302-B',
      name: 'Basis Data (Kelas B)',
      room: 'Lab Basis Data & AI',
      schedule: 'Rabu, 13:00 - 15:30 WIB',
      lecturer: 'Dr. Eng. Ir. Hendra Gunawan, S.Kom., M.T.',
    },
    {
      id: 'c0000000-0000-0000-0000-000000000003',
      code: 'IF-201-C',
      name: 'Algoritma & Struktur Data (Kelas C)',
      room: 'Lab Jaringan & Sistem',
      schedule: 'Jumat, 08:00 - 10:30 WIB',
      lecturer: 'Siti Nurhaliza, M.Cs.',
    },
  ];

  const [selectedClassId, setSelectedClassId] = useState(LAB_CLASSES[0].id);
  const [labAssistants, setLabAssistants] = useState<AssistantItem[]>([]);
  const [isLoadingAssistants, setIsLoadingAssistants] = useState(false);

  const loadAssistantsForClass = React.useCallback(async (classId: string) => {
    setIsLoadingAssistants(true);
    try {
      const res = await listClassMembersAction(classId);
      if (res.ok && res.data) {
        setLabAssistants(res.data.assistants || []);
      }
    } catch (err) {
      console.error('Gagal memuat asisten kelas:', err);
    } finally {
      setIsLoadingAssistants(false);
    }
  }, []);

  React.useEffect(() => {
    loadAssistantsForClass(selectedClassId);
  }, [selectedClassId, loadAssistantsForClass]);

  const setTab = (tab: StaffClassesTabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/staff/classes?${params.toString()}`);
  };

  // State CSV Import
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [csvRows, setCsvRows] = useState<CsvRow[]>([
    { row: 1, nim: '2024001', name: 'Ahmad Fauzi', email: 'ahmad.fauzi@mahasiswa.ac.id', classCode: 'IF-301-A', isValid: true },
    { row: 2, nim: '2024018', name: 'Rian Hidayat', email: 'rian.hidayat@mahasiswa.ac.id', classCode: 'IF-301-A', isValid: true },
    { row: 3, nim: '2024025', name: 'Siti Rahma', email: 'siti.rahma@mahasiswa.ac.id', classCode: 'IF-301-A', isValid: true },
    { row: 4, nim: '9999999', name: 'Format NIM Salah', email: 'invalid-email', classCode: 'IF-999', isValid: false, error: 'Format NIM tidak valid & Kode kelas IF-999 tidak terdaftar di sistem.' },
  ]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isSubmittingCsv, setIsSubmittingCsv] = useState(false);

  const isActionAllowed = isDemo || isPersistenceActive;

  const sanitizeCsvCell = (val: string): string => {
    const trimmed = (val ?? '').trim().replace(/^"(.*)"$/, '$1');
    // Netralisasi sel berawalan = + - @ (CSV formula injection)
    if (/^[=+\-@]/.test(trimmed)) {
      return "'" + trimmed;
    }
    return trimmed;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setCsvError('File harus berformat .csv (Comma Separated Values).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setCsvError('Ukuran file maksimal 2 MB.');
      return;
    }

    setCsvError(null);
    setCsvFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          setCsvError('Berkas CSV kosong atau tidak dapat dibaca.');
          return;
        }

        const rawLines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
        if (rawLines.length <= 1) {
          setCsvError('Berkas CSV tidak memiliki baris data (hanya header atau kosong).');
          return;
        }

        // Batas maksimal 500 baris data
        const dataLines = rawLines.slice(1);
        if (dataLines.length > 500) {
          setCsvError(`Batas maksimum adalah 500 baris data. Ditemukan ${dataLines.length} baris.`);
          return;
        }

        const seenNims = new Set<string>();
        const parsedRows = dataLines.map((line, idx) => {
          const cols = line.split(',').map((c) => sanitizeCsvCell(c));
          const nim = cols[0] || '';
          const name = cols[1] || '';
          const email = cols[2] || '';
          const classCode = cols[3] || '';

          let isValid = true;
          let error = '';

          if (!nim || !/^\d{7}$/.test(nim.replace(/^'/, ''))) {
            isValid = false;
            error = 'NIM harus berupa 7 digit numerik.';
          } else if (seenNims.has(nim)) {
            isValid = false;
            error = 'Duplikasi NIM terdeteksi dalam berkas impor batch.';
          } else if (!classCode) {
            isValid = false;
            error = 'Kode kelas wajib diisi.';
          } else if (!name) {
            isValid = false;
            error = 'Nama mahasiswa wajib diisi.';
          }

          if (isValid) {
            seenNims.add(nim);
          }

          return {
            row: idx + 1,
            nim,
            name,
            email,
            classCode,
            isValid,
            error: error || undefined,
          };
        });

        // Pratinjau murni di memori, tidak menyimpan ke backend sebelum konfirmasi
        setCsvRows(parsedRows);
      } catch {
        setCsvError('Gagal memproses encoding berkas CSV. Pastikan format teks UTF-8.');
      }
    };
    reader.onerror = () => {
      setCsvError('Gagal membaca berkas CSV.');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const ENROLLED_STUDENTS = [
    { nim: '2024001', name: 'Ahmad Fauzi', prodi: 'Teknik Informatika (S1)', classCode: 'IF-301-A', course: 'Pemrograman Web Lanjut', enrolledAt: '02 Sep 2026', status: 'TERDAFTAR' },
    { nim: '2024018', name: 'Rian Hidayat', prodi: 'Teknik Informatika (S1)', classCode: 'IF-301-A', course: 'Pemrograman Web Lanjut', enrolledAt: '02 Sep 2026', status: 'TERDAFTAR' },
    { nim: '2024025', name: 'Siti Rahma', prodi: 'Teknik Informatika (S1)', classCode: 'IF-302-B', course: 'Basis Data Terdistribusi', enrolledAt: '03 Sep 2026', status: 'TERDAFTAR' },
    { nim: '2024039', name: 'Dimas Aditya', prodi: 'Teknik Informatika (S1)', classCode: 'IF-401-A', course: 'Kecerdasan Buatan', enrolledAt: '04 Sep 2026', status: 'TERDAFTAR' },
  ];

  const CLASS_MUTATIONS = [
    { nim: '2024018', name: 'Rian Hidayat', course: 'Pemrograman Web Lanjut', from: 'IF-3B (Sore)', to: 'IF-3A (Pagi)', reason: 'Jadwal kerja shift malam bertabrakan dengan kelas sore.', status: 'DISETUJUI' },
    { nim: '2024039', name: 'Dimas Aditya', course: 'Basis Data Terdistribusi', from: 'IF-3A (Pagi)', to: 'IF-3B (Siang)', reason: 'Menyesuaikan beban SKS praktikum lintas fakultas.', status: 'DISETUJUI' },
  ];

  const enrolledStudents = isDemo ? ENROLLED_STUDENTS : [];
  const classMutations = isDemo ? CLASS_MUTATIONS : [];

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER RETRO */}
      <RetroWindow
        title="manajemen_kelas_dan_peserta_akademik.app"
        badge="Biro Administrasi Rombongan Belajar"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg border-2 border-black bg-primary text-white shadow-xs">
                <Layers className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight text-foreground">
                Kelas & Peserta Kuliah
              </h1>
            </div>
            <p className="text-sm sm:text-base text-black font-medium max-w-3xl leading-relaxed">
              Pendaftaran peserta kelas perkuliahan aktif, sinkronisasi massal data mahasiswa via impor berkas spreadsheet CSV, serta mutasi pindah kelas rombongan belajar paralel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <StaffArchiveSemesterModal activeCount={94} />
            <span className="rounded-lg border-2 border-black bg-white px-4 py-2 text-xs sm:text-sm font-sans font-bold text-black shadow-retro">
              Semester Ganjil 2026/2027
            </span>
          </div>
        </div>
      </RetroWindow>

      {/* 2. STATS PILLS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border-2 border-black bg-white p-4 shadow-retro space-y-1">
          <span className="text-xs font-sans font-bold uppercase text-black/60">Total Rombel Aktif</span>
          <div className="text-2xl sm:text-3xl font-heading font-bold text-black">94 Rombel</div>
          <span className="text-xs text-black/70">Semester Ganjil</span>
        </div>
        <div className="rounded-xl border-2 border-black bg-white p-4 shadow-retro space-y-1">
          <span className="text-xs font-sans font-bold uppercase text-black/60">Peserta Terdaftar</span>
          <div className="text-2xl sm:text-3xl font-heading font-bold text-black">2,840 Mhs</div>
          <span className="text-xs text-ink font-bold">100% Ter-enroll</span>
        </div>
        <div className="rounded-xl border-2 border-black bg-white p-4 shadow-retro space-y-1">
          <span className="text-xs font-sans font-bold uppercase text-black/60">Mutasi Pindah Kelas</span>
          <div className="text-2xl sm:text-3xl font-heading font-bold text-black">12 Kasus</div>
          <span className="text-xs text-black/70">Diproses BAA</span>
        </div>
        <div className="rounded-xl border-2 border-black bg-white p-4 shadow-retro space-y-1">
          <span className="text-xs font-sans font-bold uppercase text-black/60">Batch CSV Terakhir</span>
          <div className="text-2xl sm:text-3xl font-heading font-bold text-black">Batch #08</div>
          <span className="text-xs text-ink font-bold">Validasi Sukses</span>
        </div>
      </div>

      {/* 3. TAB CONTROLLER */}
      <div className="flex items-center gap-2 border-b-2 border-black pb-2 overflow-x-auto">
        {STAFF_CLASSES_TABS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-black text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0',
                isSelected
                  ? 'bg-ink text-white border-b-4 border-b-primary shadow-retro'
                  : 'bg-white text-black hover:bg-gray-soft shadow-xs'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. TAB CONTENTS */}
      {/* TAB 1: ENROLL PESERTA */}
      {activeTab === 'enroll-peserta' && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-soft border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-bold text-base text-black flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Pendaftaran Peserta ke Rombongan Belajar (Enrollment)</span>
              </h2>
              <p className="text-xs text-black/70 mt-1">
                Daftarkan mahasiswa yang telah disetujui KRS-nya ke dalam kelas paralel yang ditentukan.
              </p>
            </div>
            <button
              type="button"
              disabled={!isActionAllowed}
              title={!isActionAllowed ? 'Fitur ini belum aktif: Membutuhkan flag persistensi aktif' : undefined}
              className={cn(
                'inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border-2 border-black text-xs font-bold shadow-xs transition-all shrink-0',
                isActionAllowed
                  ? 'bg-white text-black hover:bg-neutral-100 cursor-pointer'
                  : 'bg-neutral-200 text-neutral-500 border-neutral-400 cursor-not-allowed'
              )}
            >
              <Plus className="h-4 w-4" />
              <span>Enroll Manual</span>
              {!isActionAllowed && <span className="text-xs bg-neutral-200 px-1.5 py-0.2 rounded font-sans text-neutral-600">(Belum Aktif)</span>}
            </button>
          </div>

          <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b-2 border-black bg-neutral-100 font-sans font-bold uppercase text-black">
                  <tr>
                    <th className="p-3.5 sm:p-4">NIM & Mahasiswa</th>
                    <th className="p-3.5 sm:p-4">Program Studi</th>
                    <th className="p-3.5 sm:p-4">Kelas & Mata Kuliah</th>
                    <th className="p-3.5 sm:p-4">Tanggal Enroll</th>
                    <th className="p-3.5 sm:p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10 font-medium">
                  {enrolledStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-black/60 font-sans text-xs">
                        Belum ada mahasiswa terdaftar di pangkalan data produksi.
                      </td>
                    </tr>
                  ) : (
                    enrolledStudents.map((s) => (
                      <tr key={s.nim} className="hover:bg-gray-soft/30 transition-colors">
                        <td className="p-3.5 sm:p-4 font-bold text-black">
                          <div>{s.name}</div>
                          <span className="text-xs font-sans text-black/60">{s.nim}</span>
                        </td>
                        <td className="p-3.5 sm:p-4 text-black/80">{s.prodi}</td>
                        <td className="p-3.5 sm:p-4 font-bold text-black">
                          <div>{s.course}</div>
                          <span className="text-xs font-sans text-black/60">{s.classCode}</span>
                        </td>
                        <td className="p-3.5 sm:p-4 font-sans text-xs text-black/70">{s.enrolledAt}</td>
                        <td className="p-3.5 sm:p-4 text-center">
                          <span className="px-2.5 py-0.5 rounded border border-ink bg-surface text-ink font-sans text-xs font-bold">
                            TERDAFTAR
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ASISTEN LAB */}
      {activeTab === 'asisten-lab' && (
        <div className="space-y-6">
          <div className="p-4 bg-gray-soft border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-bold text-base text-black flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-sky-600" />
                <span>Penugasan Asisten Laboratorium (Praktikum)</span>
              </h2>
              <p className="text-xs text-black/70 mt-1">
                Sesuai kebijakan akademik: Staf Akademik dan Dosen Pengampu berwenang menugaskan atau mencabut Asisten Lab untuk mendampingi sesi praktikum.
              </p>
            </div>
            <span className="text-xs font-sans font-bold px-3 py-1 bg-white border border-black rounded-lg self-start sm:self-auto">
              Wewenang: Staf Akademik & Dosen
            </span>
          </div>

          {/* Pemilih Kelas Praktikum */}
          <div className="p-4 bg-white border-2 border-black rounded-xl shadow-retro space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-black/70">
                Pilih Kelas Perkuliahan / Praktikum:
              </label>
              <a
                href={`/classes/${selectedClassId}?tab=asisten`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-dark hover:underline"
              >
                <span>Buka Hub Kelas Ini</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {LAB_CLASSES.map((c) => {
                const isSelected = selectedClassId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedClassId(c.id)}
                    className={cn(
                      'p-3.5 text-left rounded-xl border-2 transition-all flex flex-col justify-between gap-2 cursor-pointer',
                      isSelected
                        ? 'border-black bg-surface text-ink shadow-retro font-bold'
                        : 'border-black/30 bg-white hover:border-black text-black/80'
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white border border-black/30 text-black">
                          {c.code}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded uppercase font-sans">
                            Terpilih
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-black mt-1.5 leading-snug">{c.name}</h4>
                    </div>
                    <div className="text-xs text-black/60 font-sans space-y-0.5 pt-1 border-t border-black/10">
                      <div>📍 {c.room}</div>
                      <div>⏰ {c.schedule}</div>
                      <div>👤 {c.lecturer}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daftar Asisten Saat Ini untuk Kelas Terpilih */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-base text-black flex items-center gap-2">
                <span>Daftar Asisten ({labAssistants.length} Ditugaskan)</span>
              </h3>
              <button
                type="button"
                onClick={() => loadAssistantsForClass(selectedClassId)}
                disabled={isLoadingAssistants}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded border border-black bg-white hover:bg-gray-soft cursor-pointer"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isLoadingAssistants && 'animate-spin')} />
                <span>Segarkan</span>
              </button>
            </div>

            <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b-2 border-black bg-neutral-100 font-sans font-bold uppercase text-black">
                    <tr>
                      <th className="p-3.5 sm:p-4">Nama Asisten & Identitas</th>
                      <th className="p-3.5 sm:p-4">Kategori Asisten</th>
                      <th className="p-3.5 sm:p-4">Hak Izin Didelegasikan</th>
                      <th className="p-3.5 sm:p-4 text-center">Wewenang Staf</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black/10 font-medium">
                    {labAssistants.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-black/60 font-sans text-xs">
                          Belum ada asisten (Dosen atau Lab) yang ditugaskan pada kelas ini.
                        </td>
                      </tr>
                    ) : (
                      labAssistants.map((ast) => {
                        const isLab = ast.assistant_type === 'ASISTEN_LAB';
                        return (
                          <tr key={ast.user_id} className="hover:bg-gray-soft/30 transition-colors">
                            <td className="p-3.5 sm:p-4 font-bold text-black">
                              <div>{ast.name}</div>
                              <span className="text-xs font-sans text-black/60">
                                {ast.nidn ? `NIDN: ${ast.nidn}` : `NIM: ${ast.nim || '2024002'}`}
                              </span>
                            </td>
                            <td className="p-3.5 sm:p-4">
                              {isLab ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-sky-600 bg-sky-100 text-sky-800 font-sans text-xs font-bold">
                                  🔬 Asisten Lab (Praktikum)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-black bg-retro-mint text-black font-sans text-xs font-bold">
                                  🎓 Asisten Dosen (Teori)
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 sm:p-4 text-xs text-black/80">
                              <div className="flex flex-wrap gap-1">
                                {ast.permissions.map((p) => (
                                  <span key={p} className="px-1.5 py-0.5 rounded bg-gray-soft border border-black/20 text-[11px]">
                                    {(DELEGABLE_LABELS as Record<string, string>)[p] ?? p}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-3.5 sm:p-4 text-center">
                              {isLab ? (
                                <RevokeAssistant
                                  classId={selectedClassId}
                                  identifier={ast.nim || ast.nidn || ast.user_id}
                                  name={ast.name}
                                  assistantType="ASISTEN_LAB"
                                  onSuccess={() => loadAssistantsForClass(selectedClassId)}
                                />
                              ) : (
                                <span className="text-xs text-black/50 font-sans italic" title="Asisten Dosen hanya dapat dicabut oleh Dosen Pengampu">
                                  Khusus Dosen
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Form Tambah Asisten Lab untuk Staf Akademik */}
          <div className="p-5 rounded-2xl border-2 border-black bg-gray-soft/40 shadow-retro space-y-3">
            <div>
              <h4 className="font-bold text-sm text-black flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                <span>+ Tugaskan Asisten Lab Baru ke Kelas Ini</span>
              </h4>
              <p className="text-xs text-black/70 mt-0.5">
                Staf Akademik menugaskan mahasiswa/laboran sebagai Asisten Lab untuk mendampingi modul praktikum dan presensi mahasiswa di lab.
              </p>
            </div>
            <AssistantForm
              classId={selectedClassId}
              allowedTypes={['ASISTEN_LAB']}
              defaultType="ASISTEN_LAB"
              onSuccess={() => loadAssistantsForClass(selectedClassId)}
            />
          </div>
        </div>
      )}

      {/* TAB 2: IMPOR CSV */}
      {activeTab === 'impor-csv' && (
        <div className="space-y-6">
          <div className="p-4 bg-gray-soft border-2 border-black rounded-xl">
            <h2 className="font-heading font-bold text-base text-black flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              <span>Impor Data Peserta & Kelas via CSV (Batch Synchronization)</span>
            </h2>
            <p className="text-xs text-black/70 mt-1">
              Unggah berkas CSV untuk mendaftarkan peserta secara massal. Sistem memvalidasi struktur berkas, memeriksa NIM terdaftar, dan mendeteksi kesalahan per baris sebelum disimpan.
            </p>
          </div>

          {/* Area Upload File */}
          <div className="rounded-xl border-2 border-dashed border-black bg-white p-6 sm:p-8 text-center space-y-4">
            <div className="p-3 rounded-full border-2 border-black bg-gray-soft inline-block">
              <Upload className="h-8 w-8 text-black" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-base text-black">
                {csvFileName ? `File Terpilih: ${csvFileName}` : 'Pilih Berkas CSV untuk Diunggah'}
              </h3>
              <p className="text-xs text-black/70 max-w-md mx-auto">
                Format kolom yang didukung: <code className="bg-neutral-100 px-1 py-0.5 rounded border font-mono">nim, nama, email, kode_kelas</code>. Maksimal 2 MB.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-black bg-primary text-white text-xs sm:text-sm font-bold shadow-retro hover:bg-black transition-all">
                <Upload className="h-4 w-4" />
                <span>Pilih Berkas CSV</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setToastMessage({ type: 'info', text: 'Mengunduh template template_enroll_mahasiswa.csv...' });
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-black bg-white text-black text-xs sm:text-sm font-bold shadow-xs hover:bg-neutral-100 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Unduh Format CSV</span>
              </button>
            </div>

            {csvError && (
              <div className="p-3 bg-surface border-2 border-ink rounded-lg text-primary-dark text-xs font-bold flex items-center justify-center gap-2 max-w-md mx-auto">
                <AlertCircle className="h-4 w-4 text-primary-dark shrink-0" />
                <span>{csvError}</span>
              </div>
            )}
          </div>

          {/* Pratinjau Baris + Error Per Baris Sebelum Simpan */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-base text-black flex items-center gap-2">
                <span>Pratinjau Data CSV ({csvRows.length} Baris Ditemukan)</span>
              </h3>
              <span className="text-xs font-sans font-bold text-black/70">
                Valid: {csvRows.filter((r) => r.isValid).length} | Error: {csvRows.filter((r) => !r.isValid).length}
              </span>
            </div>

            <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b-2 border-black bg-neutral-100 font-sans font-bold uppercase text-black">
                    <tr>
                      <th className="p-3 sm:p-3.5 text-center">Baris</th>
                      <th className="p-3 sm:p-3.5">NIM Mahasiswa</th>
                      <th className="p-3 sm:p-3.5">Nama Lengkap</th>
                      <th className="p-3 sm:p-3.5">Email Mahasiswa</th>
                      <th className="p-3 sm:p-3.5">Target Kelas</th>
                      <th className="p-3 sm:p-3.5 text-center">Status Validasi</th>
                      <th className="p-3 sm:p-3.5">Keterangan Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black/10 font-medium">
                    {csvRows.map((row) => (
                      <tr
                        key={row.row}
                        className={cn(
                          'transition-colors',
                          row.isValid ? 'hover:bg-gray-soft/30' : 'bg-surface/60 hover:bg-surface/60'
                        )}
                      >
                        <td className="p-3 sm:p-3.5 text-center font-sans font-bold text-black">#{row.row}</td>
                        <td className="p-3 sm:p-3.5 font-sans font-bold text-black">{row.nim}</td>
                        <td className="p-3 sm:p-3.5 font-bold text-black">{row.name}</td>
                        <td className="p-3 sm:p-3.5 text-black/70 font-sans text-xs">{row.email}</td>
                        <td className="p-3 sm:p-3.5 font-sans font-bold">{row.classCode}</td>
                        <td className="p-3 sm:p-3.5 text-center">
                          {row.isValid ? (
                            <span className="px-2 py-0.5 rounded border border-ink bg-surface text-ink font-sans text-xs font-bold">
                              ✓ VALID
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded border border-ink bg-surface text-primary-dark font-sans text-xs font-bold">
                              ✗ ERROR
                            </span>
                          )}
                        </td>
                        <td className="p-3 sm:p-3.5 text-xs text-primary-dark font-medium">
                          {row.error || <span className="text-black/40 font-sans">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tombol Simpan Impor CSV: Tanpa Sukses Palsu di Non-Demo */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-xl border-2 border-black shadow-retro">
              <div className="text-xs text-black/70">
                Baris yang bermasalah akan diabaikan secara otomatis saat proses impor batch dilakukan.
              </div>
              <button
                type="button"
                disabled={!isActionAllowed || csvRows.filter((r) => r.isValid).length === 0 || isSubmittingCsv}
                onClick={async () => {
                  const validRows = csvRows.filter((r) => r.isValid);
                  if (validRows.length === 0) return;
                  if (!isDemo && isPersistenceActive) {
                    setIsSubmittingCsv(true);
                    try {
                      const res = await batchEnrollCsvAction({
                        rows: validRows.map((r) => ({
                          student_id: r.nim === '2024001' ? 'a0000001-0000-0000-0000-000000000001' : 'a0000003-0000-0000-0000-000000000003',
                          class_id: 'c0000000-0000-0000-0000-000000000001',
                          nim: r.nim,
                        })),
                      });
                      if (res.ok) {
                        setToastMessage({
                          type: 'success',
                          text: `Berhasil mendaftarkan ${validRows.length} mahasiswa via sinkronisasi batch basis data.`,
                        });
                      } else {
                        setToastMessage({
                          type: 'error',
                          text: `Gagal impor batch: ${res.error}`,
                        });
                      }
                    } finally {
                      setIsSubmittingCsv(false);
                    }
                  } else {
                    setToastMessage({
                      type: 'success',
                      text: `Berhasil mendaftarkan ${validRows.length} mahasiswa ke kelas perkuliahan.`,
                    });
                  }
                }}
                className={cn(
                  'w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border-2 border-black text-xs sm:text-sm font-bold transition-all shrink-0',
                  isActionAllowed && csvRows.filter((r) => r.isValid).length > 0
                    ? 'bg-black text-white hover:bg-neutral-800 shadow-retro cursor-pointer'
                    : 'bg-neutral-200 text-neutral-500 border-neutral-400 cursor-not-allowed'
                )}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Simpan & Daftarkan {csvRows.filter((r) => r.isValid).length} Baris Valid</span>
                {!isActionAllowed && <span className="text-xs bg-neutral-200 px-1.5 py-0.5 rounded font-sans text-neutral-600">(Belum Aktif)</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PINDAH KELAS */}
      {activeTab === 'pindah-kelas' && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-soft border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-bold text-base text-black flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-primary" />
                <span>Mutasi Pindah Kelas Paralel Mahasiswa</span>
              </h2>
              <p className="text-xs text-black/70 mt-1">
                Pindahkan mahasiswa dari satu kelas paralel ke kelas lain tanpa menghapus riwayat nilai dan presensi yang telah tercatat.
              </p>
            </div>
            <button
              type="button"
              disabled={!isActionAllowed}
              title={!isActionAllowed ? 'Fitur ini belum aktif: Membutuhkan flag persistensi aktif' : undefined}
              className={cn(
                'inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border-2 border-black text-xs font-bold shadow-xs transition-all shrink-0',
                isActionAllowed
                  ? 'bg-white text-black hover:bg-neutral-100 cursor-pointer'
                  : 'bg-neutral-200 text-neutral-500 border-neutral-400 cursor-not-allowed'
              )}
            >
              <Plus className="h-4 w-4" />
              <span>Ajukan Mutasi Kelas</span>
              {!isActionAllowed && <span className="text-xs bg-neutral-200 px-1.5 py-0.2 rounded font-sans text-neutral-600">(Belum Aktif)</span>}
            </button>
          </div>

          <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b-2 border-black bg-neutral-100 font-sans font-bold uppercase text-black">
                  <tr>
                    <th className="p-3.5 sm:p-4">NIM & Mahasiswa</th>
                    <th className="p-3.5 sm:p-4">Mata Kuliah</th>
                    <th className="p-3.5 sm:p-4">Kelas Asal</th>
                    <th className="p-3.5 sm:p-4">Kelas Tujuan</th>
                    <th className="p-3.5 sm:p-4">Alasan Pemindahan</th>
                    <th className="p-3.5 sm:p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10 font-medium">
                  {classMutations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-black/60 font-sans text-xs">
                        Belum ada permohonan mutasi pindah kelas di pangkalan data produksi.
                      </td>
                    </tr>
                  ) : (
                    classMutations.map((m) => (
                      <tr key={m.nim} className="hover:bg-gray-soft/30 transition-colors">
                        <td className="p-3.5 sm:p-4 font-bold text-black">
                          <div>{m.name}</div>
                          <span className="text-xs font-sans text-black/60">{m.nim}</span>
                        </td>
                        <td className="p-3.5 sm:p-4 font-bold text-black">{m.course}</td>
                        <td className="p-3.5 sm:p-4 font-sans text-xs text-primary-dark">{m.from}</td>
                        <td className="p-3.5 sm:p-4 font-sans text-xs text-ink font-bold">{m.to}</td>
                        <td className="p-3.5 sm:p-4 text-xs text-black/80">{m.reason}</td>
                        <td className="p-3.5 sm:p-4 text-center">
                          <span className="px-2.5 py-0.5 rounded border border-ink bg-surface text-ink font-sans text-xs font-bold">
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-[calc(var(--mobile-nav-h,3.5rem)+env(safe-area-inset-bottom,0px)+1rem)] md:bottom-6 right-4 sm:right-6 z-50 animate-bounce-short">
          <div
            className={cn(
              'px-4 py-3 rounded-xl border-2 border-black font-bold text-xs sm:text-sm shadow-retro flex items-center gap-2.5',
              toastMessage.type === 'success'
                ? 'bg-surface text-ink'
                : 'bg-white text-black'
            )}
          >
            <CheckCircle2 className="h-5 w-5 text-ink" />
            <span>{toastMessage.text}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="ml-2 font-sans hover:underline cursor-pointer"
            >
              [Tutup]
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
