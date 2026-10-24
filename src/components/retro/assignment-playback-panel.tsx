'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  Play,
  Pause,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Terminal,
  Clock,
  Keyboard,
  ClipboardPaste,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PlaybackSnapshot {
  step: number;
  timeLabel: string;
  eventType: 'TYPING' | 'DEBUGGING' | 'PASTE_BURST' | 'FINAL';
  charsDelta: number;
  note: string;
  code: string;
}

interface StudentSubmissionRecord {
  id: string;
  studentName: string;
  nim: string;
  authenticityScore: number;
  activeMinutes: number;
  totalKeystrokes: number;
  pasteBursts: number;
  statusLabel: string;
  snapshots: PlaybackSnapshot[];
}

const DEMO_SUBMISSION_RECORDS: StudentSubmissionRecord[] = [
  {
    id: 'sub-organik',
    studentName: 'Arya Permana Ginting',
    nim: '243510001',
    authenticityScore: 98,
    activeMinutes: 34,
    totalKeystrokes: 1240,
    pasteBursts: 0,
    statusLabel: 'TERVERIFIKASI ORGANIK (KETIKAN ASLI)',
    snapshots: [
      {
        step: 1,
        timeLabel: 'Menit 00:00 — Inisialisasi Struktur Kelas',
        eventType: 'TYPING',
        charsDelta: 112,
        note: 'Mahasiswa mulai mengetik deklarasi class TransaksiKampus dan konstruktor dasar.',
        code: `public class TransaksiKampus {\n  private String nim;\n  private double nominal;\n\n  public TransaksiKampus(String nim, double nominal) {\n    this.nim = nim;\n  }\n}`,
      },
      {
        step: 2,
        timeLabel: 'Menit 09:20 — Penambahan Method Validasi',
        eventType: 'TYPING',
        charsDelta: 245,
        note: 'Menambahkan method hitungPotonganBeasiswa() dengan percabangan IPK.',
        code: `public class TransaksiKampus {\n  private String nim;\n  private double nominal;\n\n  public TransaksiKampus(String nim, double nominal) {\n    this.nim = nim;\n    this.nominal = nominal;\n  }\n\n  public double hitungPotongan(double ipk) {\n    if (ipk >= 3.75) {\n      return nominal * 0.25;\n    }\n    return 0;\n  }\n}`,
      },
      {
        step: 3,
        timeLabel: 'Menit 18:45 — Koreksi Bug & Refactoring',
        eventType: 'DEBUGGING',
        charsDelta: 138,
        note: 'Memperbaiki validasi nilai negatif pada nominal dan menambahkan enkapsulasi getter.',
        code: `public class TransaksiKampus {\n  private final String nim;\n  private final double nominal;\n\n  public TransaksiKampus(String nim, double nominal) {\n    if (nominal < 0) throw new IllegalArgumentException("Nominal tidak valid");\n    this.nim = nim;\n    this.nominal = nominal;\n  }\n\n  public double hitungPotongan(double ipk) {\n    if (ipk >= 3.75) return nominal * 0.25;\n    if (ipk >= 3.50) return nominal * 0.10;\n    return 0;\n  }\n}`,
      },
      {
        step: 4,
        timeLabel: 'Menit 34:10 — Finalisasi & Dokumentasi',
        eventType: 'FINAL',
        charsDelta: 190,
        note: 'Menambahkan method cetakBuktiPembayaran() dan pengujian di method main().',
        code: `public class TransaksiKampus {\n  private final String nim;\n  private final double nominal;\n\n  public TransaksiKampus(String nim, double nominal) {\n    if (nominal < 0) throw new IllegalArgumentException("Nominal tidak valid");\n    this.nim = nim;\n    this.nominal = nominal;\n  }\n\n  public double hitungPotongan(double ipk) {\n    if (ipk >= 3.75) return nominal * 0.25;\n    if (ipk >= 3.50) return nominal * 0.10;\n    return 0;\n  }\n\n  public double totalBayar(double ipk) {\n    return nominal - hitungPotongan(ipk);\n  }\n}`,
      },
    ],
  },
  {
    id: 'sub-pasteburst',
    studentName: 'Sampel Deteksi Copy-Paste / AI Burst',
    nim: 'SIMULASI-01',
    authenticityScore: 28,
    activeMinutes: 2,
    totalKeystrokes: 19,
    pasteBursts: 2,
    statusLabel: 'PERINGATAN: TERDETEKSI PASTE-BURST MASIF',
    snapshots: [
      {
        step: 1,
        timeLabel: 'Menit 00:00 — Lembar Kerja Dibuka',
        eventType: 'TYPING',
        charsDelta: 18,
        note: 'Mahasiswa hanya mengetik komentar singkat di baris pertama.',
        code: `// Jawaban Tugas 1`,
      },
      {
        step: 2,
        timeLabel: 'Menit 01:15 — LONJAKAN PASTE +680 KARAKTER (1 DETIK)',
        eventType: 'PASTE_BURST',
        charsDelta: 680,
        note: 'PERINGATAN TELEMETRI: 680 karakter muncul sekaligus dalam 0.4 detik tanpa event keystroke bertahap.',
        code: `// Jawaban Tugas 1\nimport java.util.*;\npublic class Solution {\n  public static Map<String, Double> process(List<Double> data) {\n    double sum = data.stream().mapToDouble(Double::doubleValue).sum();\n    double avg = sum / Math.max(1, data.size());\n    Map<String, Double> res = new HashMap<>();\n    res.put("sum", sum);\n    res.put("avg", avg);\n    return res;\n  }\n}`,
      },
      {
        step: 3,
        timeLabel: 'Menit 02:05 — Dikumpulkan Tanpa Revisi',
        eventType: 'FINAL',
        charsDelta: 0,
        note: 'Tugas langsung dikirim 50 detik setelah aksi paste tanpa ada proses kompilasi/perbaikan.',
        code: `// Jawaban Tugas 1\nimport java.util.*;\npublic class Solution {\n  public static Map<String, Double> process(List<Double> data) {\n    double sum = data.stream().mapToDouble(Double::doubleValue).sum();\n    double avg = sum / Math.max(1, data.size());\n    Map<String, Double> res = new HashMap<>();\n    res.put("sum", sum);\n    res.put("avg", avg);\n    return res;\n  }\n}`,
      },
    ],
  },
];

interface AssignmentPlaybackPanelProps {
  assignmentTitle?: string;
  isLecturerOrTa?: boolean;
}

export function AssignmentPlaybackPanel({
  assignmentTitle = 'Implementasi Enkapsulasi & Polimorfisme (TIF-2301)',
  isLecturerOrTa = false,
}: AssignmentPlaybackPanelProps) {
  const [activeTabMode, setActiveTabMode] = useState<'playback' | 'editor'>(
    isLecturerOrTa ? 'playback' : 'editor'
  );
  const [selectedRecordId, setSelectedRecordId] = useState<string>(DEMO_SUBMISSION_RECORDS[0].id);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(3);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);

  // State untuk Live Proof-of-Work Editor (Mahasiswa)
  const [liveCode, setLiveCode] = useState<string>(
    `// Ketik kode atau jawaban Anda di sini.\n// Sistem mencatat riwayat ketikan organik sebagai bukti keaslian karya (Anti-Joki).\npublic class TugasUIR {\n  public static void main(String[] args) {\n    \n  }\n}`
  );
  const [organicKeystrokes, setOrganicKeystrokes] = useState<number>(42);
  const [pasteBurstCount, setPasteBurstCount] = useState<number>(0);
  const [liveSnapshots, setLiveSnapshots] = useState<
    Array<{ time: string; type: 'ORGANIK' | 'PASTE_BURST'; info: string }>
  >([
    { time: 'Baru saja', type: 'ORGANIK', info: 'Sesi pengerjaan terverifikasi dimulai (42 ketikan awal)' },
  ]);

  const activeRecord =
    DEMO_SUBMISSION_RECORDS.find((r) => r.id === selectedRecordId) || DEMO_SUBMISSION_RECORDS[0];
  const currentSnapshot =
    activeRecord.snapshots[Math.min(currentStepIndex, activeRecord.snapshots.length - 1)] ||
    activeRecord.snapshots[0];

  useEffect(() => {
    setCurrentStepIndex(activeRecord.snapshots.length - 1);
    setIsPlaying(false);
  }, [selectedRecordId, activeRecord.snapshots.length]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= activeRecord.snapshots.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);
    return () => clearInterval(timer);
  }, [isPlaying, activeRecord.snapshots.length]);

  const handleStartPlayback = () => {
    if (currentStepIndex >= activeRecord.snapshots.length - 1) {
      setCurrentStepIndex(0);
    }
    setIsPlaying(true);
  };

  const handleLiveChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    const diff = newVal.length - liveCode.length;
    setLiveCode(newVal);

    if (diff > 50) {
      setPasteBurstCount((prev) => prev + 1);
      setLiveSnapshots((prev) => [
        {
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          type: 'PASTE_BURST',
          info: `Terdeteksi Paste Burst (+${diff} karakter sekaligus dalam 1 event)`,
        },
        ...prev.slice(0, 5),
      ]);
    } else if (diff > 0) {
      setOrganicKeystrokes((prev) => prev + diff);
    }
  };

  const liveAuthenticity = Math.max(
    15,
    Math.min(100, Math.round(100 - pasteBurstCount * 28))
  );

  return (
    <div className="rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] overflow-hidden font-sans">
      {/* Header Bar Ringkas (Collapsible agar tidak memenuhi halaman) */}
      <div className="px-4 py-3 bg-[#FFFFFF] border-b border-[#E2E3E4] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#111111] text-white">
            <History className="h-4 w-4 text-[#FDE047]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-heading font-bold text-sm text-[#111111]">
                Riwayat Pengerjaan &amp; Verifikasi Keaslian Kode
              </h3>
              <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-[#F3F3F4] text-[#58595B]">
                Telemetri Submisi
              </span>
            </div>
            <p className="text-xs text-[#58595B]">
              Rekam jejak pengetikan bertahap dan pemeriksaan integritas submisi ({assignmentTitle})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPanelOpen && (
            <div className="flex items-center gap-1 bg-[#F3F3F4] p-1 rounded-lg border border-[#E2E3E4]">
              <button
                type="button"
                onClick={() => setActiveTabMode('editor')}
                className={cn(
                  'px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer',
                  activeTabMode === 'editor'
                    ? 'bg-[#9F1521] text-white'
                    : 'text-[#111111] hover:bg-[#FFFFFF]'
                )}
              >
                Editor Mahasiswa
              </button>
              <button
                type="button"
                onClick={() => setActiveTabMode('playback')}
                className={cn(
                  'px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer',
                  activeTabMode === 'playback'
                    ? 'bg-[#111111] text-white'
                    : 'text-[#111111] hover:bg-[#FFFFFF]'
                )}
              >
                Inspektor Dosen
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsPanelOpen((prev) => !prev)}
            className="px-3 py-1.5 rounded-lg border border-[#E2E3E4] bg-[#FFFFFF] hover:bg-[#F3F3F4] text-xs font-semibold text-[#111111] transition-colors cursor-pointer"
          >
            {isPanelOpen ? 'Sembunyikan Panel' : 'Buka Panel Verifikasi'}
          </button>
        </div>
      </div>

      {/* MODE 1: TIME-TRAVEL PLAYBACK INSPECTOR (UNTUK DOSEN & SIMULASI) */}
      {isPanelOpen && activeTabMode === 'playback' && (
        <div className="p-4 sm:p-5 bg-[#FFFFFF] space-y-4">
          {/* Pilihan Rekaman Mahasiswa */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold text-[#111111]">Pilih Rekaman Submisi:</span>
              {DEMO_SUBMISSION_RECORDS.map((rec) => (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => setSelectedRecordId(rec.id)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-bold border transition-all cursor-pointer',
                    selectedRecordId === rec.id
                      ? 'border-2 border-[#111111] bg-[#111111] text-white'
                      : 'border-[#808285] bg-[#FFFFFF] text-[#111111] hover:bg-[#F3F3F4]'
                  )}
                >
                  {rec.studentName} ({rec.authenticityScore}% Organik)
                </button>
              ))}
            </div>

            <span
              className={cn(
                'text-xs font-extrabold px-2.5 py-1 border',
                activeRecord.authenticityScore >= 80
                  ? 'bg-[#E8F5E9] text-[#065F46] border-[#059669]'
                  : 'bg-[#FEF2F2] text-[#991B1B] border-[#DC2626]'
              )}
            >
              {activeRecord.statusLabel}
            </span>
          </div>

          {/* 4 Metrik Telemetri */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-[#FFFFFF] border border-[#808285]">
              <p className="text-[11px] font-bold text-[#58595B]">Skor Keaslian Ketikan</p>
              <p
                className={cn(
                  'text-xl font-black',
                  activeRecord.authenticityScore >= 80 ? 'text-[#059669]' : 'text-[#DC2626]'
                )}
              >
                {activeRecord.authenticityScore}%
              </p>
            </div>
            <div className="p-3 bg-[#FFFFFF] border border-[#808285]">
              <p className="text-[11px] font-bold text-[#58595B]">Durasi Ketik Aktif</p>
              <p className="text-xl font-black text-[#111111]">{activeRecord.activeMinutes} Menit</p>
            </div>
            <div className="p-3 bg-[#FFFFFF] border border-[#808285]">
              <p className="text-[11px] font-bold text-[#58595B]">Total Ketikan Organik</p>
              <p className="text-xl font-black text-[#111111]">{activeRecord.totalKeystrokes} Key</p>
            </div>
            <div className="p-3 bg-[#FFFFFF] border border-[#808285]">
              <p className="text-[11px] font-bold text-[#58595B]">Lonjakan Copy-Paste</p>
              <p
                className={cn(
                  'text-xl font-black',
                  activeRecord.pasteBursts === 0 ? 'text-[#059669]' : 'text-[#DC2626]'
                )}
              >
                {activeRecord.pasteBursts} Kali
              </p>
            </div>
          </div>

          {/* Kontrol Pemutar Time-Travel (Slider & Tombol Play) */}
          <div className="p-4 bg-[#FFFFFF] border-2 border-[#111111] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => (isPlaying ? setIsPlaying(false) : handleStartPlayback())}
                  className="px-3.5 py-1.5 bg-[#9F1521] hover:bg-[#9F1521] text-white text-xs font-extrabold border border-[#8F131E] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  <span>{isPlaying ? 'Jeda Playback' : 'Putar Riwayat Ketikan'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStepIndex(0);
                  }}
                  className="px-2.5 py-1.5 bg-[#F3F3F4] hover:bg-[#E2E3E4] text-[#111111] text-xs font-bold border border-[#808285] inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Ulang dari Menit 0</span>
                </button>
              </div>

              <span className="text-xs font-mono font-extrabold text-[#111111] bg-[#F5F3EE] px-2.5 py-1 border border-[#808285]">
                Tahap {currentSnapshot.step} / {activeRecord.snapshots.length} · {currentSnapshot.timeLabel}
              </span>
            </div>

            {/* Scrubber Bar */}
            <div className="space-y-1.5">
              <input
                type="range"
                min={0}
                max={activeRecord.snapshots.length - 1}
                value={currentStepIndex}
                onChange={(e) => {
                  setIsPlaying(false);
                  setCurrentStepIndex(Number(e.target.value));
                }}
                className="w-full accent-[#9F1521] cursor-pointer"
                aria-label="Time-Travel Scrubber"
              />
              <div className="flex justify-between text-[11px] font-mono font-bold text-[#58595B]">
                {activeRecord.snapshots.map((snap, idx) => (
                  <button
                    key={snap.step}
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentStepIndex(idx);
                    }}
                    className={cn(
                      'px-2 py-0.5 border cursor-pointer',
                      idx === currentStepIndex
                        ? 'bg-[#111111] text-white border-[#111111]'
                        : snap.eventType === 'PASTE_BURST'
                        ? 'bg-[#FEF2F2] text-[#991B1B] border-[#DC2626]'
                        : 'bg-[#FFFFFF] text-[#111111] border-[#E2E3E4]'
                    )}
                  >
                    Tahap #{snap.step} {snap.eventType === 'PASTE_BURST' ? '(!)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Catatan Analisis Tahap Ini */}
            <div
              className={cn(
                'p-3 border text-xs font-bold flex items-start gap-2',
                currentSnapshot.eventType === 'PASTE_BURST'
                  ? 'bg-[#FEF2F2] text-[#991B1B] border-[#DC2626]'
                  : 'bg-[#F5F3EE] text-[#111111] border-[#808285]'
              )}
            >
              {currentSnapshot.eventType === 'PASTE_BURST' ? (
                <AlertCircle className="h-4 w-4 text-[#DC2626] shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-[#059669] shrink-0 mt-0.5" />
              )}
              <div>
                <span>{currentSnapshot.note}</span>
                <span className="ml-2 font-mono text-[11px] opacity-80">
                  ({currentSnapshot.charsDelta >= 0 ? `+${currentSnapshot.charsDelta}` : currentSnapshot.charsDelta} karakter)
                </span>
              </div>
            </div>

            {/* Tampilan Kode pada Titik Waktu Tersebut */}
            <div className="bg-[#18181B] text-[#F4F4F5] p-4 border border-[#111111] font-mono text-xs overflow-x-auto">
              <pre className="leading-relaxed whitespace-pre-wrap">{currentSnapshot.code}</pre>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: WORKSPACE MAHASISWA DENGAN LIVE SENSOR ANTI-JOKI */}
      {isPanelOpen && activeTabMode === 'editor' && (
        <div className="p-4 sm:p-5 bg-[#FFFFFF] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#FFFFFF] border border-[#808285]">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs font-extrabold text-[#111111]">
                <Keyboard className="h-4 w-4 text-[#059669]" />
                <span>Ketikan Organik: {organicKeystrokes} keystrokes</span>
              </span>
              <span className="flex items-center gap-1.5 text-xs font-extrabold text-[#111111]">
                <ClipboardPaste className="h-4 w-4 text-[#9F1521]" />
                <span>Paste Burst (&gt;50 char): {pasteBurstCount}x</span>
              </span>
            </div>
            <span
              className={cn(
                'text-xs font-extrabold px-2.5 py-0.5 border',
                liveAuthenticity >= 80
                  ? 'bg-[#E8F5E9] text-[#065F46] border-[#059669]'
                  : 'bg-[#FEF2F2] text-[#991B1B] border-[#DC2626]'
              )}
            >
              Skor Keaslian Saat Ini: {liveAuthenticity}% Organik
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-[#111111] block">
              Editor Lembar Kerja Berpembuktian (Coba ketik biasa vs tempel/paste teks panjang untuk menguji sensor):
            </label>
            <textarea
              rows={7}
              value={liveCode}
              onChange={handleLiveChange}
              className="w-full p-3.5 bg-[#18181B] text-[#F4F4F5] font-mono text-xs sm:text-sm border-2 border-[#111111] focus:outline-none focus:border-[#9F1521]"
            />
          </div>

          {/* Log Sensor Real-Time */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#58595B]">
              Log Telemetri Keaslian Pengerjaan:
            </p>
            <div className="space-y-1">
              {liveSnapshots.map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'px-3 py-1.5 text-xs font-mono font-bold border flex items-center justify-between',
                    item.type === 'PASTE_BURST'
                      ? 'bg-[#FEF2F2] text-[#991B1B] border-[#DC2626]'
                      : 'bg-[#FFFFFF] text-[#111111] border-[#E2E3E4]'
                  )}
                >
                  <span>{item.info}</span>
                  <span className="text-[10px]">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
