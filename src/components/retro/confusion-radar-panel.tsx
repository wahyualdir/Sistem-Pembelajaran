'use client';

import React, { useState } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  RotateCcw,
  HelpCircle,
  Zap,
  Code2,
  MessageSquareWarning,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ConfusionSignalType = 'TOO_FAST' | 'NEED_EXAMPLE' | 'LOGIC_CONFUSED' | 'CLEAR';

interface ConfusionBreakdown {
  tooFast: number;
  needExample: number;
  logicConfused: number;
  clear: number;
}

interface AnonymousTopicSignal {
  id: string;
  type: Exclude<ConfusionSignalType, 'CLEAR'>;
  topicNote: string;
  timestamp: string;
  resolved: boolean;
}

interface ConfusionRadarPanelProps {
  classId: string;
  classTitle: string;
  isLecturerOrTa: boolean;
  totalStudents?: number;
}

const SIGNAL_OPTIONS: Array<{
  type: ConfusionSignalType;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    type: 'TOO_FAST',
    label: 'Penjelasan Terlalu Cepat',
    desc: 'Tempo penyampaian materi terlalu cepat untuk dicatat/diikuti',
    icon: Zap,
  },
  {
    type: 'NEED_EXAMPLE',
    label: 'Butuh Contoh Konkret / Kode',
    desc: 'Konsep dasar tertangkap, tetapi perlu contoh studi kasus nyata',
    icon: Code2,
  },
  {
    type: 'LOGIC_CONFUSED',
    label: 'Alur Logika / Rumus Bingung',
    desc: 'Masih bingung pada langkah penurunan logika atau algoritma ini',
    icon: HelpCircle,
  },
  {
    type: 'CLEAR',
    label: 'Sudah Paham & Jelas',
    desc: 'Penjelasan dapat dipahami dengan baik, siap lanjut ke sub-bab berikutnya',
    icon: CheckCircle2,
  },
];

export function ConfusionRadarPanel({
  classTitle,
  isLecturerOrTa,
  totalStudents = 36,
}: ConfusionRadarPanelProps) {
  const [selectedSignal, setSelectedSignal] = useState<ConfusionSignalType | null>(null);
  const [topicNote, setTopicNote] = useState('');
  const [submittedNotice, setSubmittedNotice] = useState<string | null>(null);

  const [counts, setCounts] = useState<ConfusionBreakdown>({
    tooFast: 4,
    needExample: 5,
    logicConfused: 2,
    clear: 25,
  });

  const [topicSignals, setTopicSignals] = useState<AnonymousTopicSignal[]>([
    {
      id: 'sig-1',
      type: 'NEED_EXAMPLE',
      topicNote: 'Implementasi Abstract Class vs Interface pada studi kasus pembayaran',
      timestamp: 'Baru saja · Anonim ID-A9F2',
      resolved: false,
    },
    {
      id: 'sig-2',
      type: 'TOO_FAST',
      topicNote: 'Kompleksitas waktu Big-O pada rekursi pohon biner',
      timestamp: '4 menit lalu · Anonim ID-C4D1',
      resolved: false,
    },
    {
      id: 'sig-3',
      type: 'LOGIC_CONFUSED',
      topicNote: 'Bagian pemanggilan constructor superclass (keyword super)',
      timestamp: '8 menit lalu · Anonim ID-7B1E',
      resolved: false,
    },
  ]);

  const totalResponses = counts.tooFast + counts.needExample + counts.logicConfused + counts.clear;
  const confusedCount = counts.tooFast + counts.needExample + counts.logicConfused;
  const confusedPercent = totalResponses > 0 ? Math.round((confusedCount / totalResponses) * 100) : 0;
  const clearPercent = 100 - confusedPercent;
  const isHighConfusion = confusedPercent >= 25;

  const handleSendSignal = (type: ConfusionSignalType) => {
    setSelectedSignal(type);
    setCounts((prev) => ({
      ...prev,
      tooFast: type === 'TOO_FAST' ? prev.tooFast + 1 : prev.tooFast,
      needExample: type === 'NEED_EXAMPLE' ? prev.needExample + 1 : prev.needExample,
      logicConfused: type === 'LOGIC_CONFUSED' ? prev.logicConfused + 1 : prev.logicConfused,
      clear: type === 'CLEAR' ? prev.clear + 1 : prev.clear,
    }));

    if (type !== 'CLEAR' && topicNote.trim()) {
      const anonHash = Math.random().toString(16).substring(2, 6).toUpperCase();
      setTopicSignals((prev) => [
        {
          id: `sig-${Date.now()}`,
          type,
          topicNote: topicNote.trim(),
          timestamp: `Baru saja · Anonim ID-${anonHash}`,
          resolved: false,
        },
        ...prev,
      ]);
      setTopicNote('');
    }

    setSubmittedNotice(
      type === 'CLEAR'
        ? 'Respons "Sudah Paham" tercatat secara anonim di radar kelas.'
        : 'Sinyal kebingungan terkirim 100% anonim ke layar Dosen Pengampu.'
    );
    setTimeout(() => setSubmittedNotice(null), 4000);
  };

  const handleResolveAll = () => {
    setCounts((prev) => ({
      tooFast: 0,
      needExample: 0,
      logicConfused: 0,
      clear: prev.clear + prev.tooFast + prev.needExample + prev.logicConfused,
    }));
    setTopicSignals((prev) => prev.map((s) => ({ ...s, resolved: true })));
    setSubmittedNotice('Barometer kelas telah di-reset setelah penjelasan ulang.');
    setTimeout(() => setSubmittedNotice(null), 4000);
  };

  const handleToggleResolveItem = (id: string) => {
    setTopicSignals((prev) =>
      prev.map((s) => (s.id === id ? { ...s, resolved: !s.resolved } : s))
    );
  };

  return (
    <div className="border-2 border-[#1C1917] bg-[#FFFFFF] shadow-retro overflow-hidden font-sans">
      {/* Header Bar Retro Velqora */}
      <div className="px-4 sm:px-5 py-3 bg-[#ECE9D8] border-b-2 border-[#1C1917] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-[#C2553A] text-white border border-[#6B2D20]">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-black text-sm sm:text-base text-[#1C1917]">
                Anonim Confusion Radar — Barometer Pemahaman Kelas Real-Time
              </h3>
              <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 bg-[#FEF2F0] text-[#853827] border border-[#C2553A]">
                100% ANONIM
              </span>
            </div>
            <p className="text-xs text-[#57534E] font-medium">
              Sinyal dua arah tanpa identitas agar mahasiswa berani jujur saat materi sulit dipahami ({classTitle})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-xs font-extrabold px-3 py-1 border-2 border-[#1C1917]',
              isHighConfusion
                ? 'bg-[#FEF2F2] text-[#991B1B]'
                : 'bg-[#E8F5E9] text-[#065F46]'
            )}
          >
            {isHighConfusion
              ? `PERHATIAN: ${confusedPercent}% Butuh Penjelasan Ulang`
              : `KONDUSIF: ${clearPercent}% Kelas Paham`}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5 bg-[#FAF8F5]">
        {submittedNotice && (
          <div className="p-3 bg-[#E8F5E9] border-2 border-[#059669] text-[#065F46] text-xs font-extrabold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>{submittedNotice}</span>
          </div>
        )}

        {/* Barometer Pulse Bar */}
        <div className="p-4 bg-[#FFFFFF] border-2 border-[#7A756D] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#1C1917]">
              Indeks Pemahaman Kelas Saat Ini ({totalResponses} Respons Sesi Aktif / {totalStudents} Mahasiswa)
            </span>
            <span className="text-xs font-mono font-bold text-[#57534E]">
              {clearPercent}% Paham · {confusedPercent}% Bingung
            </span>
          </div>

          <div className="w-full h-4 bg-[#E8E5DE] border border-[#1C1917] flex overflow-hidden">
            <div
              style={{ width: `${clearPercent}%` }}
              className="bg-[#10B981] h-full transition-all duration-300"
              title={`Sudah Paham: ${clearPercent}%`}
            />
            <div
              style={{ width: `${confusedPercent}%` }}
              className="bg-[#C2553A] h-full transition-all duration-300"
              title={`Butuh Penjelasan Ulang: ${confusedPercent}%`}
            />
          </div>

          {/* 4 Metrik Rincian */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="p-2.5 bg-[#FAF8F5] border border-[#D6D3CB]">
              <p className="text-[11px] font-bold text-[#57534E]">Sudah Paham</p>
              <p className="text-lg font-black text-[#059669]">{counts.clear} Mhs</p>
            </div>
            <div className="p-2.5 bg-[#FAF8F5] border border-[#D6D3CB]">
              <p className="text-[11px] font-bold text-[#57534E]">Terlalu Cepat</p>
              <p className="text-lg font-black text-[#D97706]">{counts.tooFast} Mhs</p>
            </div>
            <div className="p-2.5 bg-[#FAF8F5] border border-[#D6D3CB]">
              <p className="text-[11px] font-bold text-[#57534E]">Butuh Contoh Kode</p>
              <p className="text-lg font-black text-[#C2553A]">{counts.needExample} Mhs</p>
            </div>
            <div className="p-2.5 bg-[#FAF8F5] border border-[#D6D3CB]">
              <p className="text-[11px] font-bold text-[#57534E]">Logika/Rumus Bingung</p>
              <p className="text-lg font-black text-[#DC2626]">{counts.logicConfused} Mhs</p>
            </div>
          </div>
        </div>

        {/* Alert untuk Dosen jika Kebingungan >= 25% */}
        {isLecturerOrTa && isHighConfusion && (
          <div className="p-4 bg-[#FEF2F0] border-2 border-[#C2553A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <MessageSquareWarning className="h-5 w-5 text-[#C2553A] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs sm:text-sm font-black text-[#853827]">
                  Rekomendasi Pedagogis: {confusedCount} Mahasiswa Mengalami Kendala Pemahaman
                </h4>
                <p className="text-xs text-[#57534E] font-medium mt-0.5">
                  Mayoritas meminta contoh implementasi konkret atau tempo penjelasan sedikit diperlambat.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResolveAll}
              className="px-3.5 py-2 bg-[#1C1917] hover:bg-[#3F3F46] text-white text-xs font-extrabold border border-[#1C1917] inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Tandai Sudah Dijelaskan Ulang</span>
            </button>
          </div>
        )}

        {/* Panel Kirim Sinyal untuk Mahasiswa (atau Simulasi Dosen) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1C1917] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#C2553A]" />
              <span>Kirim Sinyal Pemahaman Anonim Anda Sekarang</span>
            </h4>
            <span className="text-[11px] text-[#57534E] font-medium">
              Nama &amp; NIM Anda disembunyikan dari dosen
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={topicNote}
              onChange={(e) => setTopicNote(e.target.value)}
              placeholder="Opsional: Tulis bagian/istilah yang membuat bingung (misal: Polimorfisme, Rekursi, Pointer)..."
              className="flex-1 px-3 py-2 text-xs sm:text-sm font-medium bg-[#FFFFFF] border-2 border-[#7A756D] text-[#1C1917] placeholder:text-[#78716C] focus:outline-none focus:border-[#C2553A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {SIGNAL_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedSignal === opt.type;
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => handleSendSignal(opt.type)}
                  className={cn(
                    'p-3 text-left border-2 transition-all cursor-pointer flex flex-col justify-between gap-2',
                    isSelected
                      ? 'border-[#1C1917] bg-[#FEF2F0] shadow-retro-xs'
                      : 'border-[#7A756D] bg-[#FFFFFF] hover:bg-[#F5F3EE]'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-[#1C1917]">{opt.label}</span>
                    <Icon className="h-4 w-4 text-[#C2553A] shrink-0" />
                  </div>
                  <p className="text-[11px] text-[#57534E] font-medium leading-snug">
                    {opt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Daftar Titik Kebingungan Spesifik */}
        <div className="space-y-2.5 pt-2 border-t border-[#D6D3CB]">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1C1917]">
            Titik Topik yang Ditandai Mahasiswa (Anonim)
          </h4>
          <div className="space-y-2">
            {topicSignals.map((sig) => (
              <div
                key={sig.id}
                className={cn(
                  'p-3 border flex flex-col sm:flex-row sm:items-center justify-between gap-2',
                  sig.resolved
                    ? 'bg-[#F5F3EE] border-[#D6D3CB] opacity-75'
                    : 'bg-[#FFFFFF] border-[#7A756D]'
                )}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        'text-[10px] font-mono font-extrabold px-1.5 py-0.5 border',
                        sig.resolved
                          ? 'bg-[#E8F5E9] text-[#065F46] border-[#059669]'
                          : 'bg-[#FEF2F0] text-[#853827] border-[#C2553A]'
                      )}
                    >
                      {sig.resolved
                        ? 'SUDAH DIJELASKAN'
                        : sig.type === 'TOO_FAST'
                        ? 'TERLALU CEPAT'
                        : sig.type === 'NEED_EXAMPLE'
                        ? 'BUTUH CONTOH'
                        : 'LOGIKA BINGUNG'}
                    </span>
                    <span className="text-[11px] font-mono text-[#78716C]">{sig.timestamp}</span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-[#1C1917]">{sig.topicNote}</p>
                </div>

                {isLecturerOrTa && (
                  <button
                    type="button"
                    onClick={() => handleToggleResolveItem(sig.id)}
                    className="px-2.5 py-1 text-xs font-bold border border-[#1C1917] bg-[#ECE9D8] hover:bg-[#D6D3CB] text-[#1C1917] shrink-0 cursor-pointer"
                  >
                    {sig.resolved ? 'Buka Kembali' : 'Tandai Terjawab'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
