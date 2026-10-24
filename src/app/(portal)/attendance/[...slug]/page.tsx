import React from 'react';
import Link from 'next/link';
import {
  Key,
  MapPin,
  FileSpreadsheet,
  FileText,
  Clock,
  CheckCircle2,
  QrCode,
  ArrowRight,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import {
  getAllAttendanceSessionsAction,
} from '@/modules/academic/attendance-actions';

interface PageProps {
  params: Promise<{ slug: string[] }> | { slug: string[] };
}

const DEFAULT_DEMO_SESSIONS = [
  {
    id: 'ses-1',
    classId: 'c0000000-0000-0000-0000-000000000001',
    title: 'Pertemuan 7: Autentikasi JWT & Arsitektur Auth (STI2544138)',
    meeting_number: 7,
    code: '829143',
    time: 'Hari Ini, 08:45 - 11:15 WIB',
    location_name: '3C.2.05 - TEKNIK C',
    late_threshold_minutes: 15,
    methods: ['QR Dinamis', 'GPS Haversine', 'Biometrik WebAuthn'],
  },
  {
    id: 'ses-2',
    classId: 'c0000000-0000-0000-0000-000000000002',
    title: 'Pertemuan 6: Pohon Berimbang AVL & Kompleksitas Graf (STI2543131)',
    meeting_number: 6,
    code: '614920',
    time: 'Besok, 10:30 - 13:00 WIB',
    location_name: 'Computer System LAB - TEKNIK C',
    late_threshold_minutes: 15,
    methods: ['QR Dinamis', 'PIN Kelas'],
  },
  {
    id: 'ses-3',
    classId: 'c0000000-0000-0000-0000-000000000003',
    title: 'Pertemuan 5: Optimasi Indeks B-Tree Basis Data (STI2541114)',
    meeting_number: 5,
    code: '395128',
    time: 'Rabu, 13:00 - 15:30 WIB',
    location_name: 'Mobile Lab - TEKNIK D',
    late_threshold_minutes: 10,
    methods: ['GPS Geofence', 'Passkey'],
  },
];

const CAMPUS_LOCATIONS = [
  {
    code: 'LAB-CLOUD',
    name: '3C.2.05 - TEKNIK C (Lab Komputasi Web)',
    coords: 'Lat: 0.447800 · Lng: 101.453200',
    radius: '50 Meter',
    capacity: '45 Kursi',
    status: 'Aktif & Terverifikasi',
  },
  {
    code: 'LAB-SYS',
    name: 'Computer System LAB - TEKNIK C',
    coords: 'Lat: 0.447950 · Lng: 101.453400',
    radius: '50 Meter',
    capacity: '40 Kursi',
    status: 'Aktif & Terverifikasi',
  },
  {
    code: 'LAB-MOBILE',
    name: 'Mobile Lab - TEKNIK D',
    coords: 'Lat: 0.448100 · Lng: 101.453600',
    radius: '45 Meter',
    capacity: '42 Kursi',
    status: 'Aktif & Terverifikasi',
  },
  {
    code: 'R-TEORI-308',
    name: '3C.2.08 - TEKNIK C (Ruang Kuliah Teori)',
    coords: 'Lat: 0.447650 · Lng: 101.453100',
    radius: '50 Meter',
    capacity: '50 Kursi',
    status: 'Aktif & Terverifikasi',
  },
];

const PERMIT_REQUESTS = [
  {
    id: 'per-1',
    student: '2024018 - Rian Hidayat',
    course: 'Pemrograman Web & Arsitektur Cloud (STI2544138)',
    meeting: 'Pertemuan ke-7',
    reason: 'Rawat inap demam berdarah di RS Citra Medika. Surat dokter terlampir.',
    date: '07 Okt 2026',
    status: 'MENUNGGU VERIFIKASI',
  },
  {
    id: 'per-2',
    student: '2024045 - Aulia Maharani',
    course: 'Algoritma & Struktur Data Lanjut (STI2543131)',
    meeting: 'Pertemuan ke-6',
    reason: 'Dispensasi perwakilan universitas lomba Olimpiade Sains Nasional (OSN).',
    date: '06 Okt 2026',
    status: 'MENUNGGU VERIFIKASI',
  },
  {
    id: 'per-3',
    student: '2024012 - Farhan Pratama',
    course: 'Basis Data Terdistribusi & Big Data (STI2541114)',
    meeting: 'Pertemuan ke-5',
    reason: 'Sakit influenza dengan surat keterangan klinik pratama kampus.',
    date: '05 Okt 2026',
    status: 'DISETUJUI',
  },
];

export default async function AttendanceSubpage({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const subroute = resolvedParams?.slug?.[0] || '';
  const sessions = await getAllAttendanceSessionsAction().catch(() => []);
  const activeSessions = sessions.length > 0 ? sessions : DEFAULT_DEMO_SESSIONS;

  if (subroute === 'open') {
    return (
      <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
        <RetroWindow
          title="Sesi Presensi Terpadu"
          headerBadge="Presensi"
          headerBadgeVariant="warning"
          bodyClassName="p-4 sm:p-6 lg:p-8"
        >
          <div className="p-6 sm:p-8 space-y-2">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-black flex items-center gap-3">
              <Key className="h-7 w-7 text-primary" />
              <span>Buka Sesi Presensi Terpadu</span>
            </h1>
            <p className="text-base sm:text-lg text-black font-bold max-w-3xl leading-relaxed">
              Buka sesi presensi dengan pilihan metode: QR Dinamis (berganti tiap 20-30 detik), Biometrik WebAuthn/Passkey, atau Validasi Radius Geolokasi GPS (maksimal 50 meter).
            </p>
          </div>
        </RetroWindow>

        {/* Grid 3 Kolom Sesi Presensi Aktif Full Width */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-xl sm:text-2xl text-black">Sesi Presensi Aktif & Terjadwal ({activeSessions.length})</h2>
            <Link
              href="/classes"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-black bg-gray-soft text-black font-bold text-sm sm:text-base shadow-xs hover:bg-black hover:text-white transition-all"
            >
              <span>Buka Hub Kelas &rarr;</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeSessions.map((ses: any) => (
              <div
                key={ses.id}
                className="rounded-xl border-2 border-black bg-white p-6 shadow-retro flex flex-col justify-between space-y-5 hover:-translate-y-0.5 transition-transform"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-sans font-bold uppercase bg-surface text-ink border-2 border-ink px-3 py-1 rounded">
                      SESI TERBUKA
                    </span>
                    <span className="font-sans text-sm font-bold text-black">
                      Kode: {ses.code}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-heading font-bold text-xl text-black leading-snug">
                      {ses.title}
                    </h3>
                    <p className="text-sm text-black font-semibold mt-1">
                      Pertemuan ke-{ses.meeting_number || 1} · Batas: {ses.late_threshold_minutes || 15} Menit
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t-2 border-black/10 text-sm font-sans font-bold">
                    <p className="text-black flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>{ses.time || '08:45 - 11:15 WIB'}</span>
                    </p>
                    <p className="text-black flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="truncate">{ses.location_name || '3C.2.05 - TEKNIK C'}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-black/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-sans font-bold text-black">
                    <QrCode className="h-4 w-4" />
                    <span>QR DINAMIS AKTIF</span>
                  </div>

                  <Link
                    href={`/classes/${ses.classId || 'c0000000-0000-0000-0000-000000000001'}?tab=presensi`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-2 border-black bg-black text-white font-bold text-sm shadow-xs hover:bg-neutral-800 transition-all"
                  >
                    <span>Masuk Sesi</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (subroute === 'recap') {
    return (
      <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
        <RetroWindow
          title="Rekapitulasi Kehadiran Mahasiswa"
          headerBadge="Rekap Presensi"
          headerBadgeVariant="warning"
          bodyClassName="p-4 sm:p-6 lg:p-8"
        >
          <div className="p-6 sm:p-8 space-y-2">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-black flex items-center gap-3">
              <FileSpreadsheet className="h-7 w-7 text-primary" />
              <span>Rekapitulasi Kehadiran Mahasiswa</span>
            </h1>
            <p className="text-base sm:text-lg text-black font-bold max-w-3xl leading-relaxed">
              Persentase kehadiran minimum mahasiswa adalah <strong>75%</strong> untuk memenuhi syarat mengikuti Ujian Akhir Semester (UAS). Sistem mengunci kartu ujian otomatis jika kehadiran di bawah ambang batas.
            </p>
          </div>
        </RetroWindow>

        {/* 3 Metric Cards Full Width */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-1.5">
            <span className="text-sm font-sans font-bold text-black uppercase">Tingkat Kehadiran Kelas</span>
            <p className="font-heading font-bold text-3xl sm:text-4xl text-black">92.4%</p>
            <span className="text-sm text-ink font-bold flex items-center gap-1 pt-1">
              ✓ Di atas ambang batas universitas
            </span>
          </div>

          <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-1.5">
            <span className="text-sm font-sans font-bold text-black uppercase">Lolos Syarat UAS (&ge;75%)</span>
            <p className="font-heading font-bold text-3xl sm:text-4xl text-ink font-sans">43 <span className="text-sm font-sans text-black font-bold">/ 45 Mhs</span></p>
            <span className="text-sm text-ink font-sans font-bold pt-1 block">
              95.5% Mahasiswa Memenuhi Syarat
            </span>
          </div>

          <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-1.5">
            <span className="text-sm font-sans font-bold text-black uppercase">Terkunci / Berisiko (&lt;75%)</span>
            <p className="font-heading font-bold text-3xl sm:text-4xl text-ink font-sans">2 Mhs</p>
            <span className="text-sm text-ink font-sans font-bold pt-1 block">
              Perlu Remedial Presensi / Tugas
            </span>
          </div>
        </div>

        {/* Tabel Rekapitulasi Full Width */}
        <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <h2 className="font-heading font-bold text-lg sm:text-xl text-black">Ringkasan Kehadiran Rombongan Belajar (STI2544138)</h2>
            <span className="text-sm font-sans font-bold bg-gray-soft px-3 py-1 rounded border-2 border-black">
              Ambang Batas UAS: &ge; 75%
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm sm:text-base font-sans">
              <thead>
                <tr className="border-b-2 border-black bg-gray-soft font-bold text-black text-sm uppercase">
                  <th className="p-3.5">NIM</th>
                  <th className="p-3.5">Nama Mahasiswa</th>
                  <th className="p-3.5 text-center">Hadir</th>
                  <th className="p-3.5 text-center">Izin</th>
                  <th className="p-3.5 text-center">Sakit</th>
                  <th className="p-3.5 text-center">Alpa</th>
                  <th className="p-3.5 text-center">Persentase</th>
                  <th className="p-3.5 text-right">Syarat UAS</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/10 font-bold">
                <tr className="hover:bg-neutral-50">
                  <td className="p-3.5 font-bold text-black">2024001</td>
                  <td className="p-3.5 font-bold text-black">Ahmad Fauzi</td>
                  <td className="p-3.5 text-center font-bold text-black">14</td>
                  <td className="p-3.5 text-center font-bold text-black">1</td>
                  <td className="p-3.5 text-center font-bold text-black">0</td>
                  <td className="p-3.5 text-center font-bold text-black">0</td>
                  <td className="p-3.5 text-center font-bold text-ink">93.3%</td>
                  <td className="p-3.5 text-right"><span className="px-2.5 py-1 rounded bg-surface text-ink border-2 border-ink font-bold text-xs">MEMENUHI</span></td>
                </tr>
                <tr className="hover:bg-neutral-50">
                  <td className="p-3.5 font-bold text-black">2024002</td>
                  <td className="p-3.5 font-bold text-black">Budi Santoso</td>
                  <td className="p-3.5 text-center font-bold text-black">15</td>
                  <td className="p-3.5 text-center font-bold text-black">0</td>
                  <td className="p-3.5 text-center font-bold text-black">0</td>
                  <td className="p-3.5 text-center font-bold text-black">0</td>
                  <td className="p-3.5 text-center font-bold text-ink">100.0%</td>
                  <td className="p-3.5 text-right"><span className="px-2.5 py-1 rounded bg-surface text-ink border-2 border-ink font-bold text-xs">MEMENUHI</span></td>
                </tr>
                <tr className="hover:bg-neutral-50">
                  <td className="p-3.5 font-bold text-black">2024018</td>
                  <td className="p-3.5 font-bold text-black">Rian Hidayat</td>
                  <td className="p-3.5 text-center font-bold text-black">9</td>
                  <td className="p-3.5 text-center font-bold text-black">2</td>
                  <td className="p-3.5 text-center font-bold text-black">1</td>
                  <td className="p-3.5 text-center font-bold text-black">3</td>
                  <td className="p-3.5 text-center font-bold text-ink">60.0%</td>
                  <td className="p-3.5 text-right"><span className="px-2.5 py-1 rounded bg-gray-soft text-ink border-2 border-ink font-bold text-xs">TERKUNCI (&lt;75%)</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (subroute === 'locations') {
    return (
      <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
        <RetroWindow
          title="Master Titik Lokasi Kampus"
          headerBadge="Master Lokasi"
          headerBadgeVariant="warning"
          bodyClassName="p-4 sm:p-6 lg:p-8"
        >
          <div className="p-6 sm:p-8 space-y-2">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-black flex items-center gap-3">
              <MapPin className="h-7 w-7 text-primary" />
              <span>Pengaturan Titik Lokasi Presensi</span>
            </h1>
            <p className="text-base sm:text-lg text-black font-bold max-w-3xl leading-relaxed">
              Tentukan koordinat lintang/bujur dan radius toleransi (default 50 meter). Server memvalidasi jarak menggunakan rumus Haversine dan menolak presensi jika pengguna berada di luar radius yang ditentukan.
            </p>
          </div>
        </RetroWindow>

        {/* Grid 4 Kolom Titik Lokasi Kampus Full Width */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CAMPUS_LOCATIONS.map((loc) => (
            <div
              key={loc.code}
              className="rounded-xl border-2 border-black bg-white p-6 shadow-retro flex flex-col justify-between space-y-4 hover:-translate-y-0.5 transition-transform"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-xs sm:text-sm font-bold px-2.5 py-1 rounded border-2 border-black bg-gray-soft text-black">
                    {loc.code}
                  </span>
                  <span className="text-xs sm:text-sm font-sans font-bold text-ink bg-surface px-2.5 py-1 rounded border-2 border-ink">
                    {loc.radius}
                  </span>
                </div>

                <h3 className="font-heading font-bold text-lg text-black leading-snug">
                  {loc.name}
                </h3>

                <p className="text-sm font-sans font-bold text-black/80">
                  {loc.coords}
                </p>
              </div>

              <div className="pt-3 border-t-2 border-black/10 flex items-center justify-between text-sm">
                <span className="text-black font-sans font-bold">{loc.capacity}</span>
                <span className="text-ink font-bold">Tervalidasi</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default: Permits (Izin & Sakit)
  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      <RetroWindow
        title="Verifikasi Izin & Sakit"
        headerBadge="Izin & Sakit"
        headerBadgeVariant="warning"
        bodyClassName="p-4 sm:p-6 lg:p-8"
      >
        <div className="p-6 sm:p-8 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-black flex items-center gap-3">
            <FileText className="h-7 w-7 text-primary" />
            <span>Pengajuan Izin & Sakit Mahasiswa</span>
          </h1>
          <p className="text-base sm:text-lg text-black font-bold max-w-3xl leading-relaxed">
            Dosen dapat meninjau unggahan bukti surat sakit dokter atau surat dispensasi kegiatan mahasiswa. Setiap perubahan status kehadiran tercatat lengkap dengan riwayat pengubah dan alasannya.
          </p>
        </div>
      </RetroWindow>

      {/* Grid 3 Kolom Pengajuan Izin/Sakit Full Width */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PERMIT_REQUESTS.map((req) => (
          <div
            key={req.id}
            className="rounded-xl border-2 border-black bg-white p-6 shadow-retro flex flex-col justify-between space-y-4 hover:-translate-y-0.5 transition-transform"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-sans font-bold px-3 py-1 rounded border-2 ${
                  req.status.includes('MENUNGGU')
                    ? 'bg-gray-soft text-ink border-ink'
                    : 'bg-surface text-ink border-ink'
                }`}>
                  {req.status}
                </span>
                <span className="text-sm font-sans font-bold text-black">{req.date}</span>
              </div>

              <div>
                <h3 className="font-heading font-bold text-lg sm:text-xl text-black leading-snug">
                  {req.student}
                </h3>
                <p className="text-sm text-primary font-bold mt-1">
                  {req.course} ({req.meeting})
                </p>
              </div>

              <p className="text-sm text-black bg-gray-soft/60 p-3.5 rounded border-2 border-black/20 leading-relaxed font-medium">
                &quot;{req.reason}&quot;
              </p>
            </div>

            <div className="pt-3 border-t-2 border-black/10 flex items-center gap-2">
              <button className="flex-1 py-2.5 rounded-lg border-2 border-black bg-black text-white text-sm font-bold hover:bg-neutral-800 transition-all flex items-center justify-center gap-1.5 shadow-xs">
                <CheckCircle2 className="h-4 w-4" /> Setujui
              </button>
              <button className="px-4 py-2.5 rounded-lg border-2 border-black bg-white text-black text-sm font-bold hover:bg-neutral-100 transition-all shadow-xs">
                Tolak
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
