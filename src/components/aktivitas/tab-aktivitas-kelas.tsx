'use client';

import React, { useState, useEffect } from 'react';
import {
  ItemAktivitasHarian,
  formatTanggalIndo,
} from '@/lib/aktivitas';
import {
  getAktivitasSayaAction,
  getAktivitasKelasAgregatAction,
  getAktivitasAnggotaKelasAction,
} from '@/modules/academic/aktivitas-actions';
import { HeatmapKontribusi } from './heatmap-kontribusi';
import { Activity, Users, Award, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TabAktivitasKelasProps {
  classId: string;
  classTitle: string;
  isLecturerOrTa: boolean;
  members?: Array<{
    id?: string;
    student_id?: string;
    name: string;
    nim?: string;
    identifier?: string;
    role?: string;
  }>;
}

export function TabAktivitasKelas({
  classId,
  classTitle,
  isLecturerOrTa,
  members = [],
}: TabAktivitasKelasProps) {
  const [loading, setLoading] = useState(true);
  const [aktivitasData, setAktivitasData] = useState<ItemAktivitasHarian[]>([]);
  const [anggotaStats, setAnggotaStats] = useState<
    Array<{
      userId: string;
      totalPoints: number;
      totalCount: number;
      activeDays: number;
      lastActiveDate: string | null;
    }>
  >([]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        if (isLecturerOrTa) {
          const [agregat, anggota] = await Promise.all([
            getAktivitasKelasAgregatAction(classId).catch(() => []),
            getAktivitasAnggotaKelasAction(classId).catch(() => []),
          ]);
          if (isMounted) {
            setAktivitasData(agregat);
            setAnggotaStats(anggota);
          }
        } else {
          const res = await getAktivitasSayaAction(classId).catch(() => ({
            aktivitas: [],
            daftarKelas: [],
          }));
          if (isMounted) {
            setAktivitasData(res.aktivitas);
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [classId, isLecturerOrTa]);

  if (loading) {
    return (
      <div className="rounded-xl border-2 border-ink bg-surface p-8 shadow-retro flex flex-col items-center justify-center gap-3">
        <Activity className="h-6 w-6 text-primary animate-pulse" />
        <span className="text-xs font-bold text-gray-dark">Memuat grafik aktivitas kelas...</span>
      </div>
    );
  }

  // TAMPILAN DOSEN / ASISTEN
  if (isLecturerOrTa) {
    return (
      <div className="space-y-6">
        {/* HEATMAP AGREGAT KELAS ANONIM */}
        <HeatmapKontribusi
          data={aktivitasData}
          mode="penuh"
          judul={`Aktivitas Kolektif Kelas (Agregat Anonim)`}
          deskripsi={`Visualisasi denyut frekuensi seluruh aktivitas mahasiswa di ${classTitle} tanpa menampilkan identitas personal per baris data.`}
          tampilkanFilterKelas={false}
          tampilkanStatistik={true}
        />

        {/* TABEL PEMANTAUAN KEAKTIFAN ANGGOTA */}
        <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4">
          <div className="flex items-center justify-between border-b-2 border-ink/10 pb-3">
            <div className="space-y-0.5">
              <h3 className="font-heading font-bold text-base sm:text-lg text-ink flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Rincian Keaktifan Peserta Kelas</span>
              </h3>
              <p className="text-xs text-gray-dark font-medium">
                Daftar ringkasan poin kontribusi dan hari aktif untuk masing-masing anggota kelas.
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full border-2 border-ink bg-gray-soft text-ink shadow-xs">
              {members.length > 0 ? members.length : anggotaStats.length} Mahasiswa
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border-2 border-ink/20">
            <table className="w-full text-left text-xs font-sans divide-y-2 divide-ink/20">
              <thead className="bg-gray-soft/60 text-ink font-bold">
                <tr>
                  <th scope="col" className="px-4 py-3">Mahasiswa</th>
                  <th scope="col" className="px-4 py-3 text-center">Poin Kontribusi</th>
                  <th scope="col" className="px-4 py-3 text-center">Total Aksi</th>
                  <th scope="col" className="px-4 py-3 text-center">Hari Aktif</th>
                  <th scope="col" className="px-4 py-3 text-center">Aktivitas Terakhir</th>
                  <th scope="col" className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10 bg-surface">
                {members.length > 0
                  ? members.map((m, idx) => {
                      const memberId = m.id || m.student_id || `mhs-${idx}`;
                      const memberNim = m.nim || m.identifier || 'Mahasiswa';
                      const stat = anggotaStats.find((s) => s.userId === memberId);
                      const points = stat?.totalPoints || 0;
                      const count = stat?.totalCount || 0;
                      const days = stat?.activeDays || 0;
                      const lastDate = stat?.lastActiveDate;

                      const isGood = points >= 15;
                      const isModerate = points > 0 && points < 15;

                      return (
                        <tr key={memberId} className="hover:bg-gray-soft/30 transition-colors">
                          <td className="px-4 py-3 font-medium">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full border border-ink bg-gray-soft text-primary font-bold flex items-center justify-center text-xs shrink-0">
                                {m.name ? m.name[0].toUpperCase() : 'M'}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-ink block truncate">{m.name}</span>
                                <span className="text-[11px] text-gray-dark block">
                                  {memberNim}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-primary">
                            {points} poin
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-ink">
                            {count} aksi
                          </td>
                          <td className="px-4 py-3 text-center text-gray-dark font-medium">
                            {days} hari
                          </td>
                          <td className="px-4 py-3 text-center text-gray-dark">
                            {lastDate ? formatTanggalIndo(lastDate, { singkatBulan: true }) : '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isGood ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/20 text-ink border border-primary/40">
                                <CheckCircle2 className="h-3 w-3 text-primary" />
                                Sangat Aktif
                              </span>
                            ) : isModerate ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-soft text-ink border border-gray-soft">
                                Aktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-soft/40 text-gray-dark border border-gray-soft">
                                Belum Aktif
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  : anggotaStats.map((stat, idx) => (
                      <tr key={stat.userId || idx} className="hover:bg-gray-soft/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-ink">
                          Mahasiswa #{idx + 1}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-primary">
                          {stat.totalPoints} poin
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-ink">
                          {stat.totalCount} aksi
                        </td>
                        <td className="px-4 py-3 text-center text-gray-dark font-medium">
                          {stat.activeDays} hari
                        </td>
                        <td className="px-4 py-3 text-center text-gray-dark">
                          {stat.lastActiveDate
                            ? formatTanggalIndo(stat.lastActiveDate, { singkatBulan: true })
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-soft text-ink border border-gray-soft">
                            Aktif
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

  // TAMPILAN MAHASISWA
  return (
    <div className="space-y-6">
      <HeatmapKontribusi
        data={aktivitasData}
        mode="penuh"
        judul={`Grafik Kontribusi Anda di ${classTitle}`}
        deskripsi="Rekam jejak pengumpulan tugas, kuis CBT, presensi kuliah, dan diskusi forum Anda pada kelas ini."
        tampilkanFilterKelas={false}
        tampilkanStatistik={true}
      />
    </div>
  );
}
