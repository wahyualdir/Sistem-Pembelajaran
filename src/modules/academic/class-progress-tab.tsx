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
    <div className="space-y-6 font-sans">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border-2 border-black p-5 rounded-2xl shadow-retro">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-black bg-gray-soft text-[11px] font-mono font-bold text-black uppercase">
            <BarChart3 className="w-3.5 h-3.5 text-black" />
            <span>Monitoring Kemajuan Mahasiswa</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-black text-black">
            Progres Belajar Kelas
          </h2>
          <p className="text-xs sm:text-sm text-black/75 font-medium leading-relaxed">
            Pantau sebaran mahasiswa di peta alur belajar, topik paling menantang, dan intervensi mahasiswa tertinggal.
          </p>
        </div>
        <button
          type="button"
          disabled={isExporting}
          onClick={handleExportExcel}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-2 border-black bg-white hover:bg-gray-soft text-black rounded-xl transition-all shadow-retro self-start sm:self-auto disabled:opacity-50 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'Mengekspor...' : 'Ekspor Laporan (.xlsx)'}</span>
        </button>
      </div>

      {statusMessage && (
        <div
          className={cn(
            'p-3.5 text-xs rounded-xl border-2 border-black font-bold shadow-retro-sm flex items-center gap-2',
            statusMessage.type === 'success'
              ? 'bg-gray-soft text-black'
              : 'bg-white text-black'
          )}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-black shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 1. Sebaran Mahasiswa Per Bab */}
      <div className="bg-white border-2 border-black p-5 sm:p-6 rounded-2xl shadow-retro space-y-4">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <h3 className="text-base font-heading font-black text-black">Sebaran Mahasiswa per Bab</h3>
          <span className="text-xs font-mono font-bold bg-gray-soft text-black px-2.5 py-1 rounded border border-black shadow-retro-sm">
            Total {distribution[0]?.total_students || 0} Mahasiswa
          </span>
        </div>

        {distribution.length === 0 ? (
          <p className="text-xs text-black/70 italic font-medium">Belum ada data sebaran bab.</p>
        ) : (
          <div className="space-y-4">
            {distribution.map((d) => {
              const total = d.total_students || 1;
              const pctSelesai = Math.round((d.selesai_count / total) * 100);
              const pctTerbuka = Math.round((d.terbuka_count / total) * 100);
              const pctTerkunci = Math.round((d.terkunci_count / total) * 100);

              return (
                <div key={d.chapter_id} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-black">
                      Bab {d.position}: {d.title}
                    </span>
                    <span className="font-mono text-black/70">
                      {d.selesai_count} Lulus &bull; {d.terbuka_count} Belajar &bull; {d.terkunci_count} Terkunci
                    </span>
                  </div>

                  {/* Batang Horizontal Tersusun (Monochrome Stacked Bar) */}
                  <div className="w-full h-4 bg-gray-soft rounded-md overflow-hidden flex border border-black shadow-retro-sm">
                    <div
                      style={{ width: `${pctSelesai}%` }}
                      className="bg-black h-full transition-all"
                      title={`Selesai: ${d.selesai_count} (${pctSelesai}%)`}
                    />
                    <div
                      style={{ width: `${pctTerbuka}%` }}
                      className="bg-gray-400 h-full transition-all"
                      title={`Terbuka: ${d.terbuka_count} (${pctTerbuka}%)`}
                    />
                    <div
                      style={{ width: `${pctTerkunci}%` }}
                      className="bg-gray-100 h-full transition-all"
                      title={`Terkunci: ${d.terkunci_count} (${pctTerkunci}%)`}
                    />
                  </div>
                </div>
              );
            })}

            {/* Legenda Batang */}
            <div className="flex items-center gap-5 text-xs pt-3 border-t-2 border-black/10 font-bold text-black">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border border-black bg-black inline-block" /> Selesai ({distribution.reduce((acc, it) => acc + it.selesai_count, 0)})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border border-black bg-gray-400 inline-block" /> Sedang Belajar ({distribution.reduce((acc, it) => acc + it.terbuka_count, 0)})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border border-black bg-gray-100 inline-block" /> Terkunci ({distribution.reduce((acc, it) => acc + it.terkunci_count, 0)})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Topik Paling Menantang */}
      <div className="bg-white border-2 border-black p-5 sm:p-6 rounded-2xl shadow-retro space-y-3">
        <div className="border-b-2 border-black pb-3">
          <h3 className="text-base font-heading font-black text-black">Topik Paling Menantang di Kelas</h3>
          <p className="text-xs text-black/75 font-medium mt-0.5">
            Topik dengan rasio ketepatan kuis terendah (dihitung jika dicoba minimal 5 mahasiswa).
          </p>
        </div>

        {hardestTopics.length === 0 ? (
          <p className="text-xs text-black/70 italic py-2 font-medium">
            Belum cukup data agregat (minimal 5 mahasiswa per topik) untuk menampilkan analisis topik tersulit.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {hardestTopics.map((ht) => (
              <div key={ht.topic_id} className="p-3.5 rounded-xl border-2 border-black bg-white shadow-retro-sm flex items-center justify-between text-xs">
                <div>
                  <div className="font-heading font-black text-black text-sm">{ht.topic_name}</div>
                  <div className="text-black/70 font-mono text-xs">{ht.chapter_title}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-black text-black text-sm">
                    {Math.round(ht.correct_ratio * 100)}% Benar
                  </div>
                  <div className="text-black/60 font-mono text-[11px]">
                    {ht.student_count} mahasiswa
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Mahasiswa Tertinggal & Aksi Dosen */}
      <div className="bg-white border-2 border-black p-5 sm:p-6 rounded-2xl shadow-retro space-y-3">
        <div className="border-b-2 border-black pb-3">
          <h3 className="text-base font-heading font-black text-black">Mahasiswa Memerlukan Perhatian Khusus</h3>
          <p className="text-xs text-black/75 font-medium mt-0.5">
            Daftar mahasiswa yang belum menuntaskan bab meskipun target tanggal penyelesaian telah terlewati.
          </p>
        </div>

        {laggingStudents.length === 0 ? (
          <div className="p-4 bg-gray-soft border-2 border-black rounded-xl text-black text-xs font-bold flex items-center gap-2 shadow-retro-sm">
            <CheckCircle2 className="w-4 h-4 text-black" />
            <span>Seluruh mahasiswa berada dalam jadwal yang sesuai target perkuliahan.</span>
          </div>
        ) : (
          <div className="rounded-xl border-2 border-black overflow-hidden shadow-retro-sm overflow-x-auto overscroll-x-contain table-scroll">
            <table className="w-full text-xs text-left min-w-[560px]">
              <thead className="bg-gray-soft border-b-2 border-black text-black uppercase font-mono font-bold">
                <tr>
                  <th className="p-3">Nama Mahasiswa</th>
                  <th className="p-3">Bab Tertunda</th>
                  <th className="p-3">Keterlambatan</th>
                  <th className="p-3">Skor Terbaik</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/10 font-medium text-black">
                {laggingStudents.map((st) => (
                  <tr key={`${st.student_id}-${st.chapter_id}`} className="hover:bg-gray-soft/40 transition-colors">
                    <td className="p-3 font-bold text-black flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-black shrink-0" />
                      <span>{st.student_name}</span>
                    </td>
                    <td className="p-3 text-black/80 font-bold">{st.chapter_title}</td>
                    <td className="p-3 font-mono font-bold text-black">
                      <span className="px-2 py-0.5 rounded border border-black bg-gray-soft">
                        {st.days_late} hari lewat
                      </span>
                    </td>
                    <td className="p-3 font-mono text-black/70 font-bold">
                      {st.best_score ?? 'Belum coba'}
                    </td>
                    <td className="p-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleRemind(st.student_id, st.chapter_id, st.student_name)}
                        className="px-3 py-1.5 rounded-lg border-2 border-black bg-white hover:bg-gray-soft text-black text-xs font-bold inline-flex items-center gap-1.5 shadow-retro-sm cursor-pointer"
                        title="Kirim notifikasi pengingat belajar"
                      >
                        <Bell className="w-3.5 h-3.5 text-black" />
                        <span>Ingatkan</span>
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
                        className="px-3 py-1.5 rounded-lg border-2 border-black bg-black text-white hover:bg-neutral-800 text-xs font-bold inline-flex items-center gap-1.5 shadow-retro-sm cursor-pointer"
                        title="Buka akses pulau manual untuk mahasiswa ini"
                      >
                        <Unlock className="w-3.5 h-3.5 text-white" />
                        <span>Buka Pulau</span>
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
          <form
            onSubmit={handleGrantOverride}
            className="bg-white border-2 border-black rounded-2xl shadow-retro-lg max-w-md w-full overflow-hidden animate-scale-in"
          >
            <div className="flex items-center justify-between border-b-2 border-black bg-gray-soft p-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full border border-black bg-black inline-block" />
                <span className="h-3 w-3 rounded-full border border-black bg-white inline-block" />
                <h4 className="text-sm font-heading font-black text-black ml-1">Buka Akses Manual</h4>
              </div>
              <button
                type="button"
                onClick={() => setOverrideModal(null)}
                className="p-1 rounded border border-black bg-white hover:bg-gray-soft text-black shadow-retro-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <p className="text-black/80 font-medium leading-relaxed">
                Buka akses bab <strong className="text-black">{overrideModal.chapterTitle}</strong> secara khusus untuk mahasiswa <strong className="text-black">{overrideModal.studentName}</strong>.
              </p>

              <div className="space-y-1">
                <label className="font-mono font-bold text-black uppercase tracking-wider block">
                  Alasan Pembukaan Manual *
                </label>
                <textarea
                  required
                  minLength={5}
                  rows={3}
                  placeholder="Contoh: Mahasiswa memiliki dispensasi medis / penugasan pengganti telah diverifikasi..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white border-2 border-black rounded-lg text-black font-sans font-medium text-xs shadow-retro-sm outline-none"
                />
                <p className="text-[11px] text-black/70 font-medium">
                  Tindakan intervensi ini akan dicatat ke dalam log audit resmi kampus.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t-2 border-black/15">
                <button
                  type="button"
                  onClick={() => setOverrideModal(null)}
                  className="px-4 py-2 text-xs border-2 border-black rounded-xl bg-white hover:bg-gray-soft text-black font-bold shadow-retro-sm cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs bg-black text-white font-bold border-2 border-black rounded-xl hover:bg-neutral-800 shadow-retro cursor-pointer"
                >
                  Buka Akses Pulau
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
