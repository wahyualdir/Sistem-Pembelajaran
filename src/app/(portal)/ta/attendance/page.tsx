import React from 'react';
import Link from 'next/link';
import { CalendarCheck2, Users, ArrowRight, QrCode, MapPin, Clock, CheckCircle2 } from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';

const ATTENDANCE_SESSIONS = [
  {
    id: 'ses-ta-1',
    code: 'TI-301',
    title: 'Pemrograman Web Lanjut (Kelas A)',
    meeting: 'Pertemuan ke-7: Autentikasi JWT & Middleware',
    time: 'Hari Ini, 08:00 - 10:30 WIB',
    room: 'Lab Komputasi Awan (Gd. Rektorat Lt. 3)',
    status: 'SESI DIBUKA',
    attendedCount: 32,
    totalCount: 36,
    method: 'QR Dinamis + GPS',
  },
  {
    id: 'ses-ta-2',
    code: 'TI-102',
    title: 'Algoritma & Pemrograman Dasar (Kelas C)',
    meeting: 'Pertemuan ke-6: Pointer & Dynamic Memory Allocation',
    time: 'Besok, 10:45 - 13:15 WIB',
    room: 'Lab Komputer 1',
    status: 'TERJADWAL',
    attendedCount: 0,
    totalCount: 40,
    method: 'QR Dinamis + Passkey',
  },
  {
    id: 'ses-ta-3',
    code: 'TI-204',
    title: 'Praktikum Sistem Basis Data (Kelas B)',
    meeting: 'Pertemuan ke-5: Relasi Indeks & Kueri Agregasi',
    time: 'Kemarin, 13:30 - 16:00 WIB',
    room: 'Lab Basis Data',
    status: 'SELESAI DIVERIFIKASI',
    attendedCount: 30,
    totalCount: 32,
    method: 'GPS Haversine',
  },
];

export default function AssistantAttendancePage() {
  return (
    <div className="p-6 sm:p-9 w-full space-y-8 animate-fade-up">
      <RetroWindow
        title="Bantu Presensi Kelas Praktikum"
        headerBadge="Mode Asisten"
        headerBadgeVariant="warning"
      >
        <div className="p-6 sm:p-8 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-foreground flex items-center gap-3">
            <CalendarCheck2 className="h-7 w-7 text-primary" />
            <span>Bantu Presensi Kelas Praktikum</span>
          </h1>
          <p className="text-sm sm:text-base text-black font-bold max-w-3xl leading-relaxed">
            Membantu dosen memverifikasi kehadiran mahasiswa di lab praktikum, mengawasi pemindaian QR dinamis, dan mencatat status izin atau sakit dengan audit terdata.
          </p>
        </div>
      </RetroWindow>

      {/* Grid Sesi Presensi Praktikum Full Width */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ATTENDANCE_SESSIONS.map((ses) => (
          <div
            key={ses.id}
            className="rounded-xl border-2 border-black bg-white p-6 shadow-retro flex flex-col justify-between space-y-5 hover:-translate-y-0.5 transition-transform"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs font-bold px-2.5 py-1 rounded border border-black bg-gray-soft">
                  {ses.code}
                </span>
                <span
                  className={`text-xs font-sans font-bold px-2 py-0.5 rounded border ${
                    ses.status === 'SESI DIBUKA'
                      ? 'bg-surface text-ink border-ink'
                      : ses.status === 'TERJADWAL'
                      ? 'bg-gray-soft text-ink border-ink'
                      : 'bg-neutral-100 text-neutral-800 border-neutral-300'
                  }`}
                >
                  {ses.status}
                </span>
              </div>

              <div>
                <h2 className="font-heading font-bold text-lg text-foreground leading-snug">
                  {ses.title}
                </h2>
                <p className="text-xs font-semibold text-primary mt-1">
                  {ses.meeting}
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-neutral-100 text-xs">
                <p className="text-muted-foreground flex items-center gap-1.5 font-sans">
                  <Clock className="h-3.5 w-3.5 text-neutral-500" />
                  <span>{ses.time}</span>
                </p>
                <p className="text-muted-foreground flex items-center gap-1.5 font-sans">
                  <MapPin className="h-3.5 w-3.5 text-neutral-500" />
                  <span>{ses.room}</span>
                </p>
                <p className="text-muted-foreground flex items-center gap-1.5 font-sans">
                  <QrCode className="h-3.5 w-3.5 text-neutral-500" />
                  <span>Metode: {ses.method}</span>
                </p>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-black/10 flex items-center justify-between">
              <span className="font-sans text-xs font-bold text-foreground">
                Hadir: {ses.attendedCount} / {ses.totalCount} Mahasiswa
              </span>

              <Link
                href="/classes"
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg border-2 border-black bg-black text-white font-bold text-xs shadow-xs hover:bg-neutral-800 transition-all"
              >
                <span>Kelola Presensi</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
