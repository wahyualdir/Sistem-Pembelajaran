'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileSpreadsheet,
  Award,
  TrendingUp,
  Download,
  BarChart3,
  CheckCircle2,
  BookOpen,
  Send,
  Bell,
  Sliders,
  FileCheck,
  Compass,
  Layers,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { cn } from '@/lib/utils';
import {
  getCoordinatorEvaluationReportAction,
  toggleEvaluationPeriodStatusAction,
  sendEvaluationRemindersAction,
  exportCoordinatorEvaluationCsvAction,
  type CoordinatorEdomRecapItem,
  type EvaluationPeriod,
} from './evaluation-actions';
import {
  getKaprodiAdoptionReportAction,
  type KaprodiReportItem,
} from './kaprodi-report-actions';

export const COORDINATOR_REPORTS_TABS = [
  { id: 'laporan-prodi', label: 'Laporan Prodi', icon: FileSpreadsheet },
  { id: 'evaluasi-dosen', label: 'Evaluasi Dosen', icon: Award },
  { id: 'capaian-cpl', label: 'Capaian CPL', icon: TrendingUp },
  { id: 'adopsi-peta-pulau', label: 'Adopsi Peta Pulau', icon: Compass },
] as const;

export type CoordinatorReportsTabId = (typeof COORDINATOR_REPORTS_TABS)[number]['id'];

interface CoordinatorReportsHubViewProps {
  isDemo?: boolean;
}

export function CoordinatorReportsHubView({
  isDemo = true,
}: CoordinatorReportsHubViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab') as CoordinatorReportsTabId;
  const validTabs: CoordinatorReportsTabId[] = [
    'laporan-prodi',
    'evaluasi-dosen',
    'capaian-cpl',
    'adopsi-peta-pulau',
  ];
  const activeTab: CoordinatorReportsTabId = validTabs.includes(tabParam)
    ? tabParam
    : 'laporan-prodi';

  const setTab = (tab: CoordinatorReportsTabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/coordinator/reports?${params.toString()}`);
  };

  const [edomPeriod, setEdomPeriod] = React.useState<EvaluationPeriod | null>(null);
  const [edomRecap, setEdomRecap] = React.useState<CoordinatorEdomRecapItem[]>([]);
  const [edomToast, setEdomToast] = React.useState<string | null>(null);
  const [adoptionItems, setAdoptionItems] = React.useState<KaprodiReportItem[]>([]);
  const [isLoadingAdoption, setIsLoadingAdoption] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    getCoordinatorEvaluationReportAction().then((res) => {
      if (res.ok) {
        if (res.period) setEdomPeriod(res.period);
        setEdomRecap(res.lecturerRecap);
      }
    });
  }, []);

  React.useEffect(() => {
    if (activeTab === 'adopsi-peta-pulau' && adoptionItems.length === 0 && !isLoadingAdoption) {
      setIsLoadingAdoption(true);
      getKaprodiAdoptionReportAction().then((res) => {
        setIsLoadingAdoption(false);
        if (res.ok) {
          setAdoptionItems(res.items);
        }
      });
    }
  }, [activeTab]);

  const handleTogglePeriod = () => {
    if (!edomPeriod) return;
    const newStatus = edomPeriod.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    startTransition(async () => {
      const res = await toggleEvaluationPeriodStatusAction(edomPeriod.id, newStatus);
      if (res.ok) {
        setEdomPeriod((prev) => (prev ? { ...prev, status: newStatus } : null));
        setEdomToast(`Periode kuesioner berhasil diubah menjadi ${newStatus}.`);
      }
    });
  };

  const handleSendReminders = () => {
    startTransition(async () => {
      const res = await sendEvaluationRemindersAction();
      if (res.ok) {
        setEdomToast(res.message || 'Pengingat berhasil dikirim.');
      } else {
        setEdomToast(res.error || 'Gagal mengirim pengingat.');
      }
    });
  };

  const handleExportCsv = () => {
    startTransition(async () => {
      const res = await exportCoordinatorEvaluationCsvAction();
      if (res.ok && res.csvContent && res.filename) {
        const blob = new Blob([res.csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.filename;
        a.click();
        URL.revokeObjectURL(url);
        setEdomToast('File CSV laporan akreditasi berhasil diunduh.');
      }
    });
  };

  const PRODI_REPORTS = isDemo
    ? [
        {
          id: 'rep-1',
          title: 'Laporan Kinerja Akademik Semester Ganjil 2026/2027',
          period: 'Semester Ganjil 2026',
          metrics: '96.2% Kelas Tuntas • Rata-rata IPK 3.42 • Lulus Tepat Waktu 88%',
          date: '05 Oktober 2026',
          fileFormat: 'PDF (2.4 MB)',
        },
        {
          id: 'rep-2',
          title: 'Rekapitulasi Rasio Dosen-Mahasiswa & BKD Prodi',
          period: 'Tahun Ajaran 2026/2027',
          metrics: 'Rasio 1 : 24.5 • 100% Dosen Memenuhi Beban BKD',
          date: '28 September 2026',
          fileFormat: 'XLSX (850 KB)',
        },
        {
          id: 'rep-3',
          title: 'Laporan Evaluasi Pembelajaran & Drop-out Early Warning',
          period: 'Mid-Semester Ganjil 2026',
          metrics: '8 Mahasiswa Berisiko Teridentifikasi & Diberi Pembinaan',
          date: '02 Oktober 2026',
          fileFormat: 'PDF (1.8 MB)',
        },
      ]
    : [];

  const LECTURER_EVALUATIONS = isDemo
    ? [
        {
          id: 'eval-1',
          name: 'Dr. Budi Santoso, M.Kom.',
          subject: 'Pemrograman Web Lanjut (IF-3A)',
          respondents: '36 dari 38 Mahasiswa (94.7%)',
          pedagogy: 4.8,
          professional: 4.9,
          social: 4.7,
          scoreTotal: '4.80 / 5.00',
          category: 'SANGAT BAIK',
        },
        {
          id: 'eval-2',
          name: 'Prof. Dewi Lestari, Ph.D.',
          subject: 'Basis Data Terdistribusi (IF-3B)',
          respondents: '39 dari 40 Mahasiswa (97.5%)',
          pedagogy: 4.9,
          professional: 5.0,
          social: 4.8,
          scoreTotal: '4.90 / 5.00',
          category: 'SANGAT BAIK',
        },
        {
          id: 'eval-3',
          name: 'Ir. Hendra Wijaya, M.T.',
          subject: 'Jaringan Komputer & Cloud (IF-3C)',
          respondents: '30 dari 36 Mahasiswa (83.3%)',
          pedagogy: 4.1,
          professional: 4.2,
          social: 4.0,
          scoreTotal: '4.10 / 5.00',
          category: 'BAIK',
        },
      ]
    : [];

  const CPL_ACHIEVEMENTS = isDemo
    ? [
        {
          code: 'CPL-01',
          name: 'Kemampuan Menerapkan Prinsip Matematika, Sains, dan Komputasi untuk Solusi Rekayasa Kompleks',
          target: '80%',
          achievement: '85.4%',
          status: 'TERCAPAI',
        },
        {
          code: 'CPL-02',
          name: 'Kemampuan Merancang, Mengimplementasikan, dan Mengevaluasi Sistem Berbasis Komputer & Perangkat Lunak',
          target: '75%',
          achievement: '82.1%',
          status: 'TERCAPAI',
        },
        {
          code: 'CPL-03',
          name: 'Kemampuan Berkomunikasi Efektif dan Berkolaborasi dalam Tim Multidisiplin Berstandar Industri',
          target: '80%',
          achievement: '88.0%',
          status: 'TERCAPAI',
        },
        {
          code: 'CPL-04',
          name: 'Pemahaman Tanggung Jawab Etis, Profesional, Keamanan Informasi, dan Pembelajaran Sepanjang Hayat',
          target: '85%',
          achievement: '84.2%',
          status: 'MENDEKATI',
        },
      ]
    : [];

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER RETRO */}
      <RetroWindow
        title="laporan_dan_evaluasi_prodi.app"
        badge="Evaluasi Mutu Prodi"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg border-2 border-black bg-primary text-white shadow-xs">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight text-foreground">
                Laporan & Evaluasi Mutu Prodi
              </h1>
            </div>
            <p className="text-sm sm:text-base text-black font-medium max-w-3xl leading-relaxed">
              Agregasi performa akademik program studi, hasil kuesioner evaluasi dosen oleh mahasiswa (EDOM), dan ketercapaian butir Capaian Pembelajaran Lulusan (CPL OBE).
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="rounded-lg border-2 border-black bg-white px-4 py-2 text-xs sm:text-sm font-sans font-bold text-black shadow-retro">
              Akreditasi Unggul (LAM-INFOKOM)
            </span>
          </div>
        </div>
      </RetroWindow>

      {/* 2. TAB CONTROLLER */}
      <div className="flex items-center gap-2 border-b-2 border-black pb-2 overflow-x-auto">
        {COORDINATOR_REPORTS_TABS.map((tab) => {
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

      {/* 3. TAB 1: LAPORAN PRODI */}
      {activeTab === 'laporan-prodi' && (
        <div className="space-y-5">
          <div className="p-4 bg-gray-soft border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-bold text-base text-black flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <span>Dokumen Laporan Kinerja Akademik Program Studi</span>
              </h2>
              <p className="text-xs text-black/70 mt-1">
                Unduh berkas laporan berkala untuk keperluan rapat dekanat, SPMI, dan akreditasi prodi.
              </p>
            </div>
          </div>

          {PRODI_REPORTS.length === 0 ? (
            <div className="p-10 text-center space-y-3 rounded-xl border-2 border-dashed border-black bg-white">
              <FileSpreadsheet className="h-10 w-10 text-black/40 mx-auto" />
              <h3 className="font-heading font-bold text-base sm:text-lg text-black">Belum Ada Dokumen Laporan</h3>
              <p className="text-xs sm:text-sm text-black/70 max-w-md mx-auto">
                Laporan kinerja semesteran belum digenerate untuk program studi ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {PRODI_REPORTS.map((rep) => (
                <div key={rep.id} className="rounded-xl border-2 border-black bg-white p-5 shadow-retro space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="px-2 py-0.5 rounded border border-black bg-neutral-100 text-xs font-sans font-bold">
                      {rep.period}
                    </span>
                    <h3 className="font-heading font-bold text-base text-black">{rep.title}</h3>
                    <p className="text-xs text-black/70">{rep.metrics}</p>
                  </div>
                  <div className="pt-3 border-t border-black/10 flex items-center justify-between">
                    <span className="text-xs font-sans text-black/60">{rep.date}</span>
                    <button
                      type="button"
                      onClick={() => alert(`Mengunduh dokumen: ${rep.title}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-black bg-gray-soft text-black text-xs font-bold hover:bg-gray-soft transition-all cursor-pointer shadow-xs"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>{rep.fileFormat}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 2: EVALUASI DOSEN (EDOM) */}
      {activeTab === 'evaluasi-dosen' && (
        <div className="space-y-5">
          {edomToast && (
            <div className="p-3 bg-surface border-2 border-black rounded-lg text-xs font-sans font-bold text-ink flex items-center justify-between">
              <span>{edomToast}</span>
              <button type="button" onClick={() => setEdomToast(null)} className="cursor-pointer">
                &times;
              </button>
            </div>
          )}

          <div className="p-4 bg-gray-soft border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-bold text-base text-black flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <span>Hasil Evaluasi Dosen Oleh Mahasiswa (EDOM)</span>
              </h2>
              <p className="text-xs text-black/70 mt-1">
                Kuesioner evaluasi kompetensi pedagogik, profesionalitas, dan kepuasan mahasiswa per kelas kuliah.
              </p>
            </div>

            {/* Aksi Kaprodi: Buka/Tutup Periode, Kirim Notifikasi Pengingat, dan Ekspor CSV */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {edomPeriod && (
                <button
                  type="button"
                  onClick={handleTogglePeriod}
                  disabled={isPending}
                  className={cn(
                    'px-3 py-1.5 rounded-lg border-2 border-black text-xs font-bold transition-all shadow-xs cursor-pointer',
                    edomPeriod.status === 'OPEN'
                      ? 'bg-surface text-ink hover:bg-neutral-100'
                      : 'bg-primary text-white hover:bg-primary-dark'
                  )}
                >
                  {edomPeriod.status === 'OPEN' ? 'Tutup Periode' : 'Buka Periode'}
                </button>
              )}

              <button
                type="button"
                onClick={handleSendReminders}
                disabled={isPending || edomPeriod?.status !== 'OPEN'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-black bg-white text-xs font-bold hover:bg-neutral-100 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Bell className="h-3.5 w-3.5 text-primary" />
                <span>Kirim Pengingat</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-black bg-ink text-white text-xs font-bold hover:bg-black transition-all shadow-xs cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-white" />
                <span>Ekspor Akreditasi (CSV)</span>
              </button>
            </div>
          </div>

          {/* Banner Status Periode */}
          {edomPeriod && (
            <div className="p-3 bg-white border-2 border-black rounded-lg flex items-center justify-between text-xs font-sans">
              <div>
                <span className="font-bold text-black">{edomPeriod.title}</span>
                <span className="text-black/60 block sm:inline sm:ml-2">
                  Status: <strong className={edomPeriod.status === 'OPEN' ? 'text-primary' : 'text-black/70'}>{edomPeriod.status === 'OPEN' ? 'SEDANG DIBUKA' : 'DITUTUP'}</strong>
                </span>
              </div>
              <span className="text-xs text-black/50">
                Responden Minimal untuk Akses Dosen: 5 Mahasiswa
              </span>
            </div>
          )}

          {edomRecap.length === 0 ? (
            <div className="p-10 text-center space-y-3 rounded-xl border-2 border-dashed border-black bg-white">
              <Award className="h-10 w-10 text-black/40 mx-auto" />
              <h3 className="font-heading font-bold text-base sm:text-lg text-black">Belum Ada Rekap Kuesioner EDOM</h3>
              <p className="text-xs sm:text-sm text-black/70 max-w-md mx-auto">
                Pengisian kuesioner evaluasi dosen oleh mahasiswa belum memiliki data responden untuk semester ini.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b-2 border-black bg-neutral-100 font-sans font-bold uppercase text-black">
                    <tr>
                      <th className="p-3.5 sm:p-4">Dosen & Mata Kuliah</th>
                      <th className="p-3.5 sm:p-4 text-center">Tingkat Respons Mhs</th>
                      <th className="p-3.5 sm:p-4 text-center">Pedagogik</th>
                      <th className="p-3.5 sm:p-4 text-center">Profesional</th>
                      <th className="p-3.5 sm:p-4 text-center">Sosial</th>
                      <th className="p-3.5 sm:p-4 text-center">Skor Total</th>
                      <th className="p-3.5 sm:p-4 text-center">Kategori Mutu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black/10 font-medium">
                    {edomRecap.map((ev) => (
                      <tr key={ev.id} className="hover:bg-gray-soft/30 transition-colors">
                        <td className="p-3.5 sm:p-4">
                          <span className="font-bold text-black block">{ev.lecturerName}</span>
                          <span className="text-xs text-black/60 font-sans">{ev.subjectTitle}</span>
                        </td>
                        <td className="p-3.5 sm:p-4 text-center font-sans text-xs font-bold">{ev.respondentsCount} Mahasiswa</td>
                        <td className="p-3.5 sm:p-4 text-center font-sans font-bold">{ev.pedagogyScore.toFixed(2)}</td>
                        <td className="p-3.5 sm:p-4 text-center font-sans font-bold">{ev.professionalScore.toFixed(2)}</td>
                        <td className="p-3.5 sm:p-4 text-center font-sans font-bold">{ev.socialScore.toFixed(2)}</td>
                        <td className="p-3.5 sm:p-4 text-center font-sans font-bold text-sm text-ink">
                          {ev.totalScore.toFixed(2)}
                        </td>
                        <td className="p-3.5 sm:p-4 text-center">
                          <span className="px-2.5 py-0.5 rounded border border-ink bg-surface text-ink text-xs font-sans font-bold">
                            {ev.category}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 3: CAPAIAN CPL OBE */}
      {activeTab === 'capaian-cpl' && (
        <div className="space-y-5">
          <div className="p-4 bg-gray-soft border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-bold text-base text-black flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span>Ketercapaian Capaian Pembelajaran Lulusan (CPL Kurikulum OBE)</span>
              </h2>
              <p className="text-xs text-black/70 mt-1">
                Agregasi penilaian berbasis portofolio dan asesmen ketercapaian kompetensi lulusan program studi.
              </p>
            </div>
            <span className="text-xs font-sans font-bold px-3 py-1 bg-retro-mint border border-black rounded-lg">
              Kurikulum OBE 2024
            </span>
          </div>

          {CPL_ACHIEVEMENTS.length === 0 ? (
            <div className="p-10 text-center space-y-3 rounded-xl border-2 border-dashed border-black bg-white">
              <TrendingUp className="h-10 w-10 text-black/40 mx-auto" />
              <h3 className="font-heading font-bold text-base sm:text-lg text-black">Belum Ada Pemetaan CPL</h3>
              <p className="text-xs sm:text-sm text-black/70 max-w-md mx-auto">
                Data ketercapaian CPL belum dihitung untuk angkatan aktif semester ini.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {CPL_ACHIEVEMENTS.map((cpl) => (
                <div key={cpl.code} className="rounded-xl border-2 border-black bg-white p-5 shadow-retro space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded border-2 border-black bg-primary text-white font-sans font-bold text-xs">
                        {cpl.code}
                      </span>
                      <h3 className="font-heading font-bold text-sm sm:text-base text-black">{cpl.name}</h3>
                    </div>
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded border text-xs font-sans font-bold shrink-0 self-start sm:self-auto',
                        cpl.status === 'TERCAPAI'
                          ? 'border-ink bg-surface text-ink'
                          : 'border-ink bg-gray-soft text-ink'
                      )}
                    >
                      {cpl.status === 'TERCAPAI' ? 'Target Tercapai' : 'Mendekati Target'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-black/10 font-sans text-xs">
                    <div>
                      <span className="text-black/60 text-xs block">Target Minimum:</span>
                      <span className="font-bold">{cpl.target}</span>
                    </div>
                    <div>
                      <span className="text-black/60 text-xs block">Realisasi Capaian:</span>
                      <span className="font-bold text-ink text-sm">{cpl.achievement}</span>
                    </div>
                    <div className="sm:col-span-2 flex items-center">
                      <div className="h-3 w-full bg-neutral-200 rounded-full overflow-hidden border border-black/20">
                        <div
                          className="h-full bg-gray-dark rounded-full"
                          style={{ width: cpl.achievement }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. TAB 4: ADOPSI PETA PULAU & FITUR BELAJAR */}
      {activeTab === 'adopsi-peta-pulau' && (
        <div className="space-y-5">
          <div className="p-4 bg-gray-soft border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-bold text-base text-black flex items-center gap-2">
                <Compass className="h-5 w-5 text-primary" />
                <span>Laporan Penggunaan & Adopsi Fitur Peta Pulau</span>
              </h2>
              <p className="text-xs text-black/70 mt-1">
                Agregasi adopsi fitur pembelajaran mandiri per kelas mata kuliah di program studi.
              </p>
            </div>
            <span className="text-xs font-sans font-bold px-3 py-1 bg-white border border-black rounded-lg">
              Privasi K-Anonymity (N ≥ 5)
            </span>
          </div>

          {isLoadingAdoption ? (
            <div className="p-10 text-center text-xs font-sans text-black/60 rounded-xl border-2 border-black bg-white">
              Memuat data adopsi fitur program studi...
            </div>
          ) : adoptionItems.length === 0 ? (
            <div className="p-10 text-center space-y-3 rounded-xl border-2 border-dashed border-black bg-white">
              <Compass className="h-10 w-10 text-black/40 mx-auto" />
              <h3 className="font-heading font-bold text-base sm:text-lg text-black">Belum Ada Kelas Mengaktifkan Fitur</h3>
              <p className="text-xs sm:text-sm text-black/70 max-w-md mx-auto">
                Dosen pengampu dapat mengaktifkan fitur Peta Pulau, Flashcard, Podcast, dan Tukar Keahlian melalui tab Pengaturan Fitur di kelas masing-masing.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border-2 border-black bg-white overflow-hidden shadow-retro">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-xs">
                    <thead className="bg-gray-soft border-b-2 border-black text-black uppercase font-bold text-[11px]">
                      <tr>
                        <th className="p-3.5">Mata Kuliah / Kelas</th>
                        <th className="p-3.5">Dosen Pengampu</th>
                        <th className="p-3.5">Fitur Aktif</th>
                        <th className="p-3.5 text-center">Jumlah Bab</th>
                        <th className="p-3.5 text-center">Mahasiswa Terdaftar</th>
                        <th className="p-3.5 text-right">Rata-rata Kelulusan Bab</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/10">
                      {adoptionItems.map((item) => (
                        <tr key={item.class_id} className="hover:bg-retro-surface/50 transition-colors">
                          <td className="p-3.5 font-bold text-foreground">
                            {item.class_title}
                          </td>
                          <td className="p-3.5 text-muted-foreground">
                            {item.lecturer_name}
                          </td>
                          <td className="p-3.5">
                            <div className="flex flex-wrap gap-1">
                              {item.is_peta_enabled && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                                  Peta
                                </span>
                              )}
                              {item.is_flashcard_enabled && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                  Flashcard
                                </span>
                              )}
                              {item.is_podcast_enabled && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                                  Podcast
                                </span>
                              )}
                              {item.is_tukar_keahlian_enabled && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                  Tukar Keahlian
                                </span>
                              )}
                              {!item.is_peta_enabled && !item.is_flashcard_enabled && !item.is_podcast_enabled && !item.is_tukar_keahlian_enabled && (
                                <span className="text-[10px] text-muted-foreground">Tidak aktif</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 text-center tabular-nums">
                            {item.total_chapters}
                          </td>
                          <td className="p-3.5 text-center tabular-nums">
                            {item.total_students}
                          </td>
                          <td className="p-3.5 text-right font-bold tabular-nums">
                            {item.is_masked ? (
                              <span className="text-muted-foreground text-[11px] font-normal italic">
                                {item.avg_completion_pct}
                              </span>
                            ) : (
                              <span className="text-emerald-700 dark:text-emerald-400">
                                {item.avg_completion_pct}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Catatan Privasi K-Anonymity */}
              <div className="p-4 rounded-xl border-2 border-black bg-retro-surface text-xs text-black/80 leading-relaxed font-sans shadow-xs">
                <span className="font-bold text-black block mb-0.5">Penjelasan Perlindungan Privasi K-Anonymity:</span>
                Sesuai dengan ketentuan perlindungan data pembelajaran, kelas yang memiliki jumlah mahasiswa terdaftar di bawah 5 disamarkan nilainya (<span className="font-semibold">&lt; 5 (Privasi Terjaga)</span>). Kebijakan ini memastikan bahwa pimpinan program studi dapat meninjau adopsi kurikulum secara sehat tanpa risiko de-anonimisasi terhadap mahasiswa perseorangan.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
