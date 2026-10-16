import React from 'react';
import Link from 'next/link';
import { listCalendarAction } from '@/modules/academic/actions';
import { RetroWindow } from '@/components/retro/retro-window';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowRight,
  Calendar as CalendarIcon,
} from 'lucide-react';

const tanggal = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const jam = (iso: string) =>
  `${new Date(iso).toLocaleTimeString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
  })} WIB`;

export default async function CalendarPage() {
  const items = await listCalendarAction();
  const now = Date.now();
  const groups = new Map<string, typeof items>();
  for (const it of items) {
    const k = tanggal(it.due_at);
    groups.set(k, [...(groups.get(k) ?? []), it]);
  }

  const totalTugas = items.length;
  const sudahSelesai = items.filter((i) => i.done).length;
  const belumSelesai = totalTugas - sudahSelesai;

  return (
    <div className="p-4 sm:p-6 lg:p-10 w-full space-y-6 sm:space-y-8 lg:space-y-9 animate-fade-up">
      {/* 1. HEADER WINDOW KALENDER */}
      <RetroWindow
        title="Kalender Pembelajaran"
        badge="AGENDA PEMBELAJARAN"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-4 sm:p-6 lg:p-8 bg-retro-surface"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-2.5 sm:p-3 rounded-xl border-2 border-black bg-primary text-white shadow-retro-md shrink-0">
                <CalendarDays className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <h1 className="font-heading font-black text-xl sm:text-2xl lg:text-4xl tracking-tight text-black">
                Kalender Pembelajaran & Tenggat
              </h1>
            </div>
            <p className="text-sm sm:text-base lg:text-xl text-black font-bold max-w-3xl leading-relaxed">
              Jadwal sesi perkuliahan terintegrasi, tenggat pengumpulan tugas, kuis, dan pelaksanaan ujian semester.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="rounded-xl border-2 border-black bg-white px-3.5 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-base lg:text-lg font-black text-black shadow-retro">
              Semester Ganjil 2026/2027
            </span>
          </div>
        </div>

        {/* 3 Kartu Metrik Tenggat - Responsif Phone, iPad & Desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-5 pt-6 sm:pt-8 border-t-2 border-black mt-6 sm:mt-8">
          {/* Card 1: Total Agenda */}
          <div className="p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl border-2 border-black bg-white shadow-retro flex items-center justify-between gap-4 hover:-translate-y-0.5 transition-all">
            <div className="space-y-0.5 sm:space-y-1">
              <p className="text-xs sm:text-sm lg:text-base font-black uppercase tracking-wide text-black">
                Total Agenda
              </p>
              <p className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-black tracking-tight leading-none">
                {totalTugas}
              </p>
              <p className="text-xs sm:text-xs lg:text-sm font-bold text-black pt-1">
                Semua kegiatan semester
              </p>
            </div>
            <div className="p-3 sm:p-3.5 lg:p-4 rounded-xl border-2 border-black bg-retro-warm text-black shrink-0 shadow-xs">
              <CalendarIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
            </div>
          </div>

          {/* Card 2: Perlu Diselesaikan */}
          <div className="p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl border-2 border-black bg-white shadow-retro flex items-center justify-between gap-4 hover:-translate-y-0.5 transition-all">
            <div className="space-y-0.5 sm:space-y-1">
              <p className="text-xs sm:text-sm lg:text-base font-black uppercase tracking-wide text-black">
                Perlu Diselesaikan
              </p>
              <p className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-black tracking-tight leading-none">
                {belumSelesai}
              </p>
              <p className="text-xs sm:text-xs lg:text-sm font-black text-primary pt-1">
                Tenggat tugas aktif
              </p>
            </div>
            <div className="p-3 sm:p-3.5 lg:p-4 rounded-xl border-2 border-black bg-retro-yellow text-black shrink-0 shadow-xs">
              <Clock className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-black" />
            </div>
          </div>

          {/* Card 3: Sudah Dikumpulkan */}
          <div className="p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl border-2 border-black bg-white shadow-retro flex items-center justify-between gap-4 hover:-translate-y-0.5 transition-all">
            <div className="space-y-0.5 sm:space-y-1">
              <p className="text-xs sm:text-sm lg:text-base font-black uppercase tracking-wide text-black">
                Sudah Dikumpulkan
              </p>
              <p className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-black tracking-tight leading-none">
                {sudahSelesai}
              </p>
              <p className="text-xs sm:text-xs lg:text-sm font-bold text-black pt-1">
                Tuntas terverifikasi
              </p>
            </div>
            <div className="p-3 sm:p-3.5 lg:p-4 rounded-xl border-2 border-black bg-retro-mint text-black shrink-0 shadow-xs">
              <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-black" />
            </div>
          </div>
        </div>
      </RetroWindow>

      {/* 2. DAFTAR AGENDA BERDASARKAN TANGGAL */}
      <RetroWindow
        title="Daftar Agenda & Tenggat Perkuliahan"
        badge="TIMELINE & TENGGAT"
        headerClassName="bg-retro-warm"
        bodyClassName="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-7"
      >
        {groups.size === 0 ? (
          <div className="p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-black bg-retro-warm/40 space-y-4">
            <CalendarIcon className="h-10 w-10 sm:h-12 sm:w-12 text-black mx-auto" />
            <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-black">Belum Ada Tenggat Perkuliahan</h3>
            <p className="text-sm sm:text-base lg:text-lg text-black font-bold max-w-lg mx-auto leading-relaxed">
              Tidak ada tenggat pengumpulan tugas atau kuis dalam waktu dekat. Semua tugas yang diterbitkan dosen akan muncul otomatis di sini.
            </p>
          </div>
        ) : (
          [...groups.entries()].map(([hari, rows], gi) => (
            <div key={hari} className="space-y-3 sm:space-y-4 animate-fade-up" style={{ animationDelay: `${gi * 50}ms` }}>
              <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                <span className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full bg-primary border-2 border-black" />
                <h2 className="font-heading font-black text-lg sm:text-xl lg:text-2xl text-black">{hari}</h2>
                <span className="rounded-full border-2 border-black bg-white px-3 py-0.5 text-xs sm:text-sm lg:text-base font-black text-black shadow-xs">
                  {rows.length} kegiatan
                </span>
              </div>

              <div className="space-y-3 sm:space-y-4 pl-2.5 sm:pl-5 border-l-2 sm:border-l-3 border-black">
                {rows.map((r) => {
                  const isClosed = now > Date.parse(r.close_at);
                  return (
                    <div
                      key={r.assignment_id}
                      className="p-4 sm:p-6 lg:p-7 rounded-xl sm:rounded-2xl border-2 border-black bg-white shadow-retro flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-5 hover:bg-retro-warm/30 transition-all"
                    >
                      <div className="space-y-2 sm:space-y-3 flex-1 min-w-0 w-full">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <span className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-md sm:rounded-lg border-2 border-black bg-retro-yellow text-xs sm:text-sm lg:text-base font-black text-black shadow-xs">
                            {r.class_title}
                          </span>
                          <Link
                            href={`/classes/${r.class_id}`}
                            className="font-heading font-black text-base sm:text-lg lg:text-2xl text-black hover:text-primary-dark transition-colors truncate block"
                          >
                            {r.title}
                          </Link>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-base lg:text-lg text-black font-bold bg-retro-warm/70 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-lg border border-black/20 w-fit">
                          <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          <span>Pukul: {jam(r.due_at)}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3 shrink-0 w-full lg:w-auto justify-between sm:justify-start pt-2 lg:pt-0 border-t border-black/10 lg:border-t-0">
                        {r.done ? (
                          <span className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border-2 border-black bg-retro-mint text-black font-black text-xs sm:text-sm lg:text-base shadow-xs flex items-center gap-1.5 sm:gap-2">
                            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                            Sudah Dikumpulkan
                          </span>
                        ) : isClosed ? (
                          <span className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border-2 border-black bg-danger text-white font-black text-xs sm:text-sm lg:text-base shadow-xs flex items-center gap-1.5 sm:gap-2">
                            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                            Ditutup
                          </span>
                        ) : (
                          <span className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border-2 border-black bg-retro-yellow text-black font-black text-xs sm:text-sm lg:text-base shadow-xs flex items-center gap-1.5 sm:gap-2">
                            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            Menunggu Pengumpulan
                          </span>
                        )}
                        <Link
                          href={`/classes/${r.class_id}`}
                          className="px-3.5 py-1.5 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl border-2 border-black bg-black text-white hover:bg-primary-dark transition-all font-black text-xs sm:text-sm lg:text-base shadow-xs flex items-center gap-2"
                          title="Buka Ruang Kelas"
                        >
                          <span>Buka Kelas</span>
                          <ArrowRight className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </RetroWindow>
    </div>
  );
}
