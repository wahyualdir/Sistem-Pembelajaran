'use client';

import React, { useState } from 'react';
import ExcelJS from 'exceljs';
import {
  BarChart3,
  Download,
  Bell,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Clock,
  X,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  remindLaggingStudentAction,
  grantChapterUnlockOverrideAction,
  type ChapterDistributionItem,
  type HardestTopicItem,
} from './peta-pulau-actions';

export interface LaggingStudentItem {
  student_id: string;
  student_name: string;
  chapter_id: string;
  chapter_title: string;
  days_late: number;
  best_score?: number | null;
}

export function ClassProgressTab({
  classId,
  distribution,
  hardestTopics,
  laggingStudents,
}: {
  classId: string;
  distribution: ChapterDistributionItem[];
  hardestTopics: HardestTopicItem[];
  laggingStudents: LaggingStudentItem[];
}) {
  const [overrideModal, setOverrideModal] = useState<{
    chapterId: string;
    studentId: string;
    studentName: string;
    chapterTitle: string;
  } | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleRemind = async (studentId: string, chapterId: string, studentName: string) => {
    setStatusMessage(null);
    const res = await remindLaggingStudentAction(classId, studentId, chapterId);
    if (res.ok) {
      setStatusMessage({
        type: 'success',
        text: `Pengingat berhasil dikirimkan kepada ${studentName}.`,
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: res.message || 'Gagal mengirimkan pengingat.',
      });
    }
  };

  const handleGrantOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideModal) return;
    if (overrideReason.trim().length < 5) {
      setStatusMessage({ type: 'error', text: 'Alasan pembukaan manual minimal 5 karakter.' });
      return;
    }

    const res = await grantChapterUnlockOverrideAction(
      overrideModal.chapterId,
      overrideModal.studentId,
      classId,
      overrideReason.trim()
    );

    if (res.ok) {
      setStatusMessage({
        type: 'success',
        text: `Akses ${overrideModal.chapterTitle} berhasil dibuka manual untuk ${overrideModal.studentName}.`,
      });
      setOverrideModal(null);
      setOverrideReason('');
    } else {
      setStatusMessage({
        type: 'error',
        text: res.message || 'Gagal membuka pulau.',
      });
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'SIAJAR LMS';
      workbook.created = new Date();

      // Sheet 1: Sebaran Per Bab
      const distSheet = workbook.addWorksheet('Sebaran Bab');
      distSheet.columns = [
        { header: 'Posisi', key: 'position', width: 10 },
        { header: 'Judul Bab', key: 'title', width: 35 },
        { header: 'Target Selesai', key: 'target_date', width: 18 },
        { header: 'Total Mahasiswa', key: 'total_students', width: 16 },
        { header: 'Selesai', key: 'selesai', width: 12 },
        { header: 'Terbuka', key: 'terbuka', width: 12 },
        { header: 'Terkunci', key: 'terkunci', width: 12 },
      ];

      distribution.forEach((d) => {
        distSheet.addRow({
          position: d.position,
          title: d.title,
          target_date: d.target_date || '-',
          total_students: d.total_students,
          selesai: d.selesai_count,
          terbuka: d.terbuka_count,
          terkunci: d.terkunci_count,
        });
      });

      // Sheet 2: Mahasiswa Tertinggal
      const lagSheet = workbook.addWorksheet('Mahasiswa Tertinggal');
      lagSheet.columns = [
        { header: 'Nama Mahasiswa', key: 'student_name', width: 28 },
        { header: 'Bab Tertunda', key: 'chapter_title', width: 35 },
        { header: 'Terlambat (Hari)', key: 'days_late', width: 16 },
        { header: 'Skor Kuis Terbaik', key: 'best_score', width: 18 },
      ];

      laggingStudents.forEach((s) => {
        lagSheet.addRow({
          student_name: s.student_name,
          chapter_title: s.chapter_title,
          days_late: s.days_late,
          best_score: s.best_score ?? 'Belum mencoba',
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Progres_Peta_Pulau_Kelas_${classId}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-lg">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Progres Belajar Kelas
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pantau sebaran mahasiswa di peta pulau, topik paling menantang, dan mahasiswa yang memerlukan perhatian.
          </p>
        </div>
        <button
          type="button"
          disabled={isExporting}
          onClick={handleExportExcel}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border bg-background hover:bg-muted text-foreground rounded-md transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {isExporting ? 'Mengekspor...' : 'Ekspor Laporan (.xlsx)'}
        </button>
      </div>

      {statusMessage && (
        <div
          className={cn(
            'p-3 text-xs rounded-md border',
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-destructive/10 text-destructive border-destructive/20'
          )}
        >
          {statusMessage.text}
        </div>
      )}

      {/* 1. Sebaran Mahasiswa Per Bab */}
      <div className="bg-card border border-border p-5 rounded-lg space-y-4">
        <h3 className="text-sm font-bold text-foreground">Sebaran Mahasiswa per Bab</h3>
        {distribution.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Belum ada data sebaran bab.</p>
        ) : (
          <div className="space-y-4">
            {distribution.map((d) => {
              const total = d.total_students || 1;
              const pctSelesai = Math.round((d.selesai_count / total) * 100);
              const pctTerbuka = Math.round((d.terbuka_count / total) * 100);
              const pctTerkunci = Math.round((d.terkunci_count / total) * 100);

              return (
                <div key={d.chapter_id} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-foreground">
                      Bab {d.position}: {d.title}
                    </span>
                    <span className="text-muted-foreground">
                      {d.selesai_count} Lulus • {d.terbuka_count} Belajar • {d.terkunci_count} Terkunci
                    </span>
                  </div>

                  {/* Batang Horizontal Tersusun (Stacked Bar) */}
                  <div className="w-full h-3.5 bg-muted rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${pctSelesai}%` }}
                      className="bg-emerald-500 h-full transition-all"
                      title={`Selesai: ${d.selesai_count} (${pctSelesai}%)`}
                    />
                    <div
                      style={{ width: `${pctTerbuka}%` }}
                      className="bg-primary h-full transition-all"
                      title={`Terbuka: ${d.terbuka_count} (${pctTerbuka}%)`}
                    />
                    <div
                      style={{ width: `${pctTerkunci}%` }}
                      className="bg-gray-300 dark:bg-gray-700 h-full transition-all"
                      title={`Terkunci: ${d.terkunci_count} (${pctTerkunci}%)`}
                    />
                  </div>
                </div>
              );
            })}

            {/* Legenda Batang */}
            <div className="flex items-center gap-4 text-xs pt-2 border-t border-border text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Selesai
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Sedang Terbuka
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-400" /> Terkunci
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Topik Paling Menantang (Ambang Minimum >= 5 Mahasiswa) */}
      <div className="bg-card border border-border p-5 rounded-lg space-y-3">
        <h3 className="text-sm font-bold text-foreground">Topik Paling Menantang di Kelas</h3>
        <p className="text-xs text-muted-foreground">
          Topik dengan persentase jawaban benar terendah (hanya ditampilkan jika dicoba minimal 5 mahasiswa).
        </p>

        {hardestTopics.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2">
            Belum cukup data agregat (minimal 5 mahasiswa per topik) untuk menampilkan analisis topik tersulit.
          </p>
        ) : (
          <div className="divide-y divide-border border border-border rounded-md">
            {hardestTopics.map((ht) => (
              <div key={ht.topic_id} className="p-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-foreground">{ht.topic_name}</div>
                  <div className="text-muted-foreground text-[11px]">{ht.chapter_title}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-amber-600">
                    {Math.round(ht.correct_ratio * 100)}% Jawaban Benar
                  </div>
                  <div className="text-muted-foreground text-[11px]">
                    {ht.student_count} mahasiswa
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Mahasiswa Tertinggal & Aksi Dosen */}
      <div className="bg-card border border-border p-5 rounded-lg space-y-3">
        <h3 className="text-sm font-bold text-foreground">Mahasiswa Memerlukan Perhatian</h3>
        <p className="text-xs text-muted-foreground">
          Daftar mahasiswa yang belum menyelesaikan bab dengan target tanggal yang telah terlewati.
        </p>

        {laggingStudents.length === 0 ? (
          <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-md text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Seluruh mahasiswa berada dalam jadwal yang sesuai target perkuliahan.
          </div>
        ) : (
          <div className="overflow-x-auto border border-border rounded-md">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3">Nama Mahasiswa</th>
                  <th className="p-3">Bab Tertunda</th>
                  <th className="p-3">Keterlambatan</th>
                  <th className="p-3">Skor Terbaik</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {laggingStudents.map((st) => (
                  <tr key={`${st.student_id}-${st.chapter_id}`} className="hover:bg-muted/20">
                    <td className="p-3 font-semibold text-foreground flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      {st.student_name}
                    </td>
                    <td className="p-3 text-muted-foreground">{st.chapter_title}</td>
                    <td className="p-3 text-amber-600 font-semibold">{st.days_late} hari lewat</td>
                    <td className="p-3 text-muted-foreground">
                      {st.best_score ?? 'Belum coba'}
                    </td>
                    <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleRemind(st.student_id, st.chapter_id, st.student_name)}
                        className="px-2.5 py-1 rounded border border-border text-xs hover:bg-muted font-medium inline-flex items-center gap-1"
                        title="Kirim notifikasi pengingat belajar"
                      >
                        <Bell className="w-3 h-3 text-amber-600" />
                        Ingatkan
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setOverrideModal({
                            chapterId: st.chapter_id,
                            studentId: st.student_id,
                            studentName: st.student_name,
                            chapterTitle: st.chapter_title,
                          })
                        }
                        className="px-2.5 py-1 rounded bg-primary text-primary-foreground text-xs hover:bg-primary/90 font-medium inline-flex items-center gap-1"
                        title="Buka akses pulau manual untuk mahasiswa ini"
                      >
                        <Unlock className="w-3 h-3" />
                        Buka Pulau
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Buka Pulau Manual */}
      {overrideModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleGrantOverride}
            className="bg-background border border-border rounded-xl shadow-xl max-w-md w-full p-5 space-y-4 animate-scale-in"
          >
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <h4 className="text-sm font-bold text-foreground">Buka Pulau Manual</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Buka akses {overrideModal.chapterTitle} untuk {overrideModal.studentName}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOverrideModal(null)}
                className="p-1 rounded-md text-muted-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-foreground">
                Alasan Pembukaan Manual * (minimal 5 karakter)
              </label>
              <textarea
                required
                minLength={5}
                rows={3}
                placeholder="Contoh: Mahasiswa sakit dengan surat dokter terverifikasi / Dispensasi tugas pengganti..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="text-[11px] text-muted-foreground">
                Tindakan ini akan tercatat dalam log audit resmi kampus.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setOverrideModal(null)}
                className="px-3 py-1.5 text-xs border border-border rounded-md hover:bg-muted"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90"
              >
                Buka Akses Pulau
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
