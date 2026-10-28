'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Users,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { CoordinatorCohortRiskView } from '@/modules/early-warning/coordinator-cohort-risk-view';
import type { StudentRiskEvaluation } from '@/modules/early-warning/types';

interface AtRiskViewProps {
  cohorts: Array<{
    angkatan: number;
    total: number;
    aman: number;
    perhatian: number;
    risikoTinggi: number;
  }>;
  totalAtRisk: number;
  students: StudentRiskEvaluation[];
  badge?: string;
  title?: string;
}

export function AtRiskView({ cohorts, totalAtRisk, students, badge = "KAPRODI :: EARLY WARNING", title = "Pemantauan Mahasiswa Berisiko (EWS)" }: AtRiskViewProps) {
  const [search, setSearch] = useState('');
  const [selectedCohort, setSelectedCohort] = useState<number | 'ALL'>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<'ALL' | 'RISIKO_TINGGI' | 'PERHATIAN'>('ALL');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.studentName.toLowerCase().includes(search.toLowerCase()) ||
      s.studentNim.includes(search) ||
      (s.classTitle || '').toLowerCase().includes(search.toLowerCase());
    const matchesCohort = selectedCohort === 'ALL' || (s.angkatan || 2024) === selectedCohort;
    const matchesLevel = selectedLevel === 'ALL' || s.riskLevel === selectedLevel;
    return matchesSearch && matchesCohort && matchesLevel;
  });

  function handleScheduleMentoring(studentName: string) {
    setActionSuccess(`Undangan bimbingan akademik untuk ${studentName} berhasil dijadwalkan.`);
    
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-up font-sans">
      <RetroWindow
        title={title}
        badge={badge}
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 bg-white"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-black tracking-tight text-black flex items-center gap-3">
              <ShieldAlert className="h-7 w-7 text-black" />
              <span>Sistem Peringatan Dini Mahasiswa Berisiko</span>
            </h1>
            <p className="text-xs sm:text-sm text-black/75 font-medium max-w-2xl leading-relaxed">
              Deteksi otomatis mahasiswa yang memerlukan intervensi akademik berdasarkan ambang batas kehadiran (&lt;75%), tugas tertunda (&gt;2 tugas), dan tren evaluasi formatif.
            </p>
          </div>
        </div>
      </RetroWindow>

      {/* Cohort Summary Widget */}
      <CoordinatorCohortRiskView cohorts={cohorts} totalAtRisk={totalAtRisk} />

      {/* Feedback Toast */}
      {actionSuccess && (
        <div className="p-4 rounded-xl border-2 border-black bg-gray-soft text-black text-xs font-bold shadow-retro flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-black shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter and Student List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-black/60" />
            <input
              type="text"
              placeholder="Cari nama mahasiswa, NIM, atau kelas…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border-2 border-black bg-white text-xs font-medium text-black focus:outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCohort}
              onChange={(e) => setSelectedCohort(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="px-3 py-2 rounded-xl border-2 border-black bg-white text-xs font-bold text-black focus:outline-hidden"
            >
              <option value="ALL">Semua Angkatan</option>
              <option value={2024}>Angkatan 2024</option>
              <option value={2025}>Angkatan 2025</option>
              <option value={2026}>Angkatan 2026</option>
            </select>

            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as any)}
              className="px-3 py-2 rounded-xl border-2 border-black bg-white text-xs font-bold text-black focus:outline-hidden"
            >
              <option value="ALL">Semua Tingkat Risiko</option>
              <option value="RISIKO_TINGGI">Risiko Tinggi</option>
              <option value="PERHATIAN">Perlu Perhatian</option>
            </select>
          </div>
        </div>

        {/* At-Risk Students Cards */}
        <div className="rounded-2xl border-2 border-black bg-white p-6 shadow-retro space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <h3 className="font-heading font-black text-lg text-black">
              Daftar Mahasiswa Memerlukan Tindak Lanjut ({filteredStudents.length})
            </h3>
            <span className="text-xs font-mono font-bold bg-gray-soft px-3 py-1 rounded border border-black">
              Sinkronisasi Store Riil
            </span>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-black/60 font-medium text-xs">
              Tidak ada mahasiswa yang sesuai dengan kriteria filter saat ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStudents.map((s, idx) => {
                const isHigh = s.riskLevel === 'RISIKO_TINGGI';
                const attIndicator = s.indicators.find((ind) => ind.category === 'KEHADIRAN');
                const taskIndicator = s.indicators.find((ind) => ind.category === 'TUGAS');

                return (
                  <div
                    key={`${s.studentId}-${s.classId}-${idx}`}
                    className="p-5 rounded-xl border-2 border-black bg-white shadow-retro-sm space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border border-black ${
                            isHigh ? 'bg-[#ED1C24] text-white' : 'bg-gray-soft text-black'
                          }`}
                        >
                          {isHigh ? 'RISIKO TINGGI' : 'PERHATIAN'}
                        </span>
                        <span className="text-xs font-mono font-bold text-black/70">
                          Angkatan {s.angkatan || 2024}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-heading font-black text-base text-black">{s.studentName}</h4>
                        <p className="text-xs font-mono text-black/70">NIM: {s.studentNim}</p>
                        <p className="text-xs font-bold text-black mt-1">{s.classTitle}</p>
                      </div>

                      {/* Detail Indikator Risiko */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/20 text-xs font-medium">
                        <div className="p-2 rounded bg-gray-soft/60 border border-black/20">
                          <span className="text-black/70 block text-[11px]">Indikator Kehadiran</span>
                          <strong className={attIndicator?.severity === 'RISIKO_TINGGI' ? 'text-[#ED1C24]' : 'text-black'}>
                            {attIndicator ? `${attIndicator.currentValue}` : 'Kehadiran Terpenuhi'}
                          </strong>
                        </div>
                        <div className="p-2 rounded bg-gray-soft/60 border border-black/20">
                          <span className="text-black/70 block text-[11px]">Indikator Tugas</span>
                          <strong className={taskIndicator?.severity === 'RISIKO_TINGGI' ? 'text-[#ED1C24]' : 'text-black'}>
                            {taskIndicator ? `${taskIndicator.currentValue}` : 'Tugas Terkumpul'}
                          </strong>
                        </div>
                      </div>

                      {/* Rekomendasi & Penyebab */}
                      {s.indicators && s.indicators.length > 0 && (
                        <div className="text-xs text-black/80 space-y-1">
                          <span className="font-bold block">Penyebab Terdeteksi:</span>
                          <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                            {s.indicators.map((ind, i: number) => (
                              <li key={i}>{ind.reason || ind.label}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t-2 border-black/20 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleScheduleMentoring(s.studentName)}
                        className="px-3 py-1.5 rounded-lg border-2 border-black bg-black text-white text-xs font-bold hover:bg-neutral-800 transition-all cursor-pointer shadow-retro-sm"
                      >
                        Jadwalkan Bimbingan
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
