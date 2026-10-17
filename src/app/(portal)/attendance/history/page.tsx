import React from 'react';
import Link from 'next/link';
import {
  CalendarCheck2,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  QrCode,
  Fingerprint,
  ArrowRight,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';

interface AttendanceRecord {
  id: string;
  courseTitle: string;
  meetingNumber: number;
  date: string;
  time: string;
  method: 'QR' | 'LOKASI' | 'BIOMETRIK' | 'MANUAL';
  status: 'HADIR' | 'TERLAMBAT' | 'IZIN' | 'SAKIT' | 'ALFA';
  room: string;
}

const DEMO_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-1',
    courseTitle: 'Pemrograman Web Lanjut',
    meetingNumber: 7,
    date: 'Senin, 05 Okt 2026',
    time: '08:05 WIB',
    method: 'QR',
    status: 'HADIR',
    room: 'Lab Komputer 2',
  },
  {
    id: 'att-2',
    courseTitle: 'Rekayasa Perangkat Lunak',
    meetingNumber: 7,
    date: 'Selasa, 06 Okt 2026',
    time: '10:50 WIB',
    method: 'LOKASI',
    status: 'HADIR',
    room: 'Ruang Teori 304',
  },
  {
    id: 'att-3',
    courseTitle: 'Kecerdasan Buatan & Machine Learning',
    meetingNumber: 7,
    date: 'Rabu, 07 Okt 2026',
    time: '13:40 WIB',
    method: 'BIOMETRIK',
    status: 'HADIR',
    room: 'Lab Riset AI',
  },
  {
    id: 'att-4',
    courseTitle: 'Basis Data Terdistribusi',
    meetingNumber: 6,
    date: 'Kamis, 01 Okt 2026',
    time: '08:25 WIB',
    method: 'QR',
    status: 'TERLAMBAT',
    room: 'Lab Basis Data 1',
  },
  {
    id: 'att-5',
    courseTitle: 'Keamanan Siber & Kriptografi',
    meetingNumber: 6,
    date: 'Jumat, 02 Okt 2026',
    time: '08:35 WIB',
    method: 'LOKASI',
    status: 'HADIR',
    room: 'Ruang Cyber Defense',
  },
];

export default function AttendanceHistoryPage() {
  const totalHadir = DEMO_ATTENDANCE.filter((a) => a.status === 'HADIR' || a.status === 'TERLAMBAT').length;
  const attendanceRate = Math.round((totalHadir / DEMO_ATTENDANCE.length) * 100);

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-5 sm:space-y-6 animate-fade-up">
      {/* 1. HEADER WINDOW RETRO */}
      <RetroWindow
        title="riwayat_presensi_kehadiran.app"
        badge={`Kehadiran ${attendanceRate}%`}
        headerClassName="bg-gray-soft"
        bodyClassName="p-4 sm:p-6 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 sm:p-2.5 rounded-lg border-2 border-black bg-primary text-white shadow-xs">
                <CalendarCheck2 className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-foreground">
                Riwayat Presensi Kuliah
              </h1>
            </div>
            <p className="text-sm sm:text-base text-black/80 font-medium max-w-2xl mt-1 leading-relaxed">
              Catatan autentik presensi perkuliahan yang tercatat di server SIAJAR. Seluruh sesi tervalidasi menggunakan verifikasi waktu nyata.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/classes"
              className="inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2 rounded-lg border-2 border-black bg-black text-white font-bold text-xs sm:text-sm shadow-retro hover:bg-neutral-800 transition-all shrink-0"
            >
              <span>Buka Kelas untuk Absen</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </RetroWindow>

      {/* 2. STATS KEHADIRAN (PROPORTIONAL CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <div className="rounded-xl border-2 border-black bg-white p-5 sm:p-6 shadow-retro space-y-2 hover:-translate-y-0.5 transition-all">
          <div className="text-xs sm:text-sm font-sans font-bold uppercase text-neutral-800 tracking-wider">
            Total Sesi Diikuti
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-bold text-black">
            {DEMO_ATTENDANCE.length} <span className="text-xs sm:text-sm font-sans font-bold text-neutral-700">Pertemuan</span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-800 font-medium">Semester Ganjil 2026/2027</p>
        </div>

        <div className="rounded-xl border-2 border-black bg-white p-5 sm:p-6 shadow-retro space-y-2 hover:-translate-y-0.5 transition-all">
          <div className="text-xs sm:text-sm font-sans font-bold uppercase text-neutral-800 tracking-wider">
            Persentase Hadir
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-bold text-black">
            {attendanceRate}%
          </div>
          <div className="inline-flex items-center gap-1 text-xs font-sans font-bold text-ink bg-surface border-2 border-black px-2.5 py-1 rounded shadow-xs">
            ✓ Lolos Ambang Batas Ujian (&ge;75%)
          </div>
        </div>

        <div className="rounded-xl border-2 border-black bg-white p-5 sm:p-6 shadow-retro space-y-2 hover:-translate-y-0.5 transition-all">
          <div className="text-xs sm:text-sm font-sans font-bold uppercase text-neutral-800 tracking-wider">
            Metode Paling Sering
          </div>
          <div className="text-xl sm:text-2xl font-heading font-bold text-black truncate">
            QR Dinamis & Lokasi
          </div>
          <p className="text-xs sm:text-sm text-neutral-800 font-medium">Validasi Koordinat GPS Haversine</p>
        </div>
      </div>

      {/* 3. TABEL RIWAYAT LOG PRESENSI */}
      <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
        <div className="p-4 sm:p-5 bg-gray-soft border-b-2 border-black flex items-center justify-between">
          <h2 className="font-heading font-bold text-base sm:text-lg text-black">
            Log Presensi Terbaru ({DEMO_ATTENDANCE.length})
          </h2>
          <span className="text-xs sm:text-sm font-sans font-bold text-neutral-800">
            Timestamp Server Terverifikasi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b-2 border-black bg-gray-soft text-xs sm:text-sm font-sans font-bold uppercase text-black">
              <tr>
                <th className="p-4">Mata Kuliah & Pertemuan</th>
                <th className="p-4">Tanggal & Jam</th>
                <th className="p-4">Ruang Kelas</th>
                <th className="p-4 text-center">Metode</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black/10">
              {DEMO_ATTENDANCE.map((record) => (
                <tr key={record.id} className="hover:bg-gray-soft/30 transition-colors font-medium">
                  <td className="p-4">
                    <div className="font-heading font-bold text-sm sm:text-base text-black">{record.courseTitle}</div>
                    <div className="text-xs font-sans font-bold text-neutral-800 mt-0.5">Pertemuan ke-{record.meetingNumber}</div>
                  </td>
                  <td className="p-4 font-sans text-xs sm:text-sm font-bold text-neutral-900">
                    <div>{record.date}</div>
                    <div className="text-neutral-700">{record.time}</div>
                  </td>
                  <td className="p-4 text-xs sm:text-sm font-bold text-black">{record.room}</td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded border-2 border-black bg-white text-xs font-sans font-bold shadow-xs">
                      {record.method === 'QR' && <QrCode className="h-3.5 w-3.5 text-black" />}
                      {record.method === 'LOKASI' && <MapPin className="h-3.5 w-3.5 text-black" />}
                      {record.method === 'BIOMETRIK' && <Fingerprint className="h-3.5 w-3.5 text-black" />}
                      <span>{record.method}</span>
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded text-xs font-sans font-bold border-2 border-black shadow-xs ${
                        record.status === 'HADIR'
                          ? 'bg-retro-mint text-black'
                          : record.status === 'TERLAMBAT'
                          ? 'bg-gray-soft text-black'
                          : 'bg-gray-soft text-black'
                      }`}
                    >
                      {record.status}
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
