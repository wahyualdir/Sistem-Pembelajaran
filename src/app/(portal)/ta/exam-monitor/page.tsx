import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Eye, AlertCircle, Clock, CheckCircle2, UserCheck, Shield, Laptop, Activity } from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';

const PROCTOR_TELEMETRY = [
  {
    nim: '2024001',
    name: 'Ahmad Fauzi',
    question: 'Soal 4 (Live Coding)',
    status: 'Normal · Fullscreen Aktif',
    statusColor: 'text-ink bg-surface border-ink',
    activity: 'Mengetik fungsi solusi() di sandbox JavaScript',
    time: 'Baru saja',
  },
  {
    nim: '2024018',
    name: 'Rian Hidayat',
    question: 'Soal 2 (Pilihan Ganda)',
    status: 'Peringatan Tercatat (1x)',
    statusColor: 'text-ink bg-gray-soft border-ink',
    activity: 'Fokus jendela beralih (blur) selama 4 detik',
    time: '2 menit yang lalu',
  },
  {
    nim: '2024025',
    name: 'Siti Rahma',
    question: 'Soal 3 (Essay Arsitektur)',
    status: 'Normal',
    statusColor: 'text-ink bg-surface border-ink',
    activity: 'Menyimpan draf jawaban otomatis di server',
    time: '3 menit yang lalu',
  },
  {
    nim: '2024039',
    name: 'Dimas Aditya',
    question: 'Soal 4 (Live Coding)',
    status: 'Normal · Fullscreen Aktif',
    statusColor: 'text-ink bg-surface border-ink',
    activity: 'Menjalankan test case publik #1 dan #2 (Lolos 2/2)',
    time: '5 menit yang lalu',
  },
];

export default function AssistantExamMonitorPage() {
  return (
    <div className="p-6 sm:p-9 w-full space-y-8 animate-fade-up">
      <RetroWindow
        title="Pantau Ujian Kelas Asistensi"
        headerBadge="Mode Asisten"
        headerBadgeVariant="warning"
      >
        <div className="p-6 sm:p-8 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-1 rounded border-2 border-black bg-gray-soft font-sans text-xs font-bold text-ink flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Akses Pengawasan: Read-Only (Hanya Pantau)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-foreground flex items-center gap-3">
            <ShieldAlert className="h-7 w-7 text-primary" />
            <span>Pantau Ujian Kelas Asistensi</span>
          </h1>
          <p className="text-sm sm:text-base text-black font-bold max-w-3xl leading-relaxed">
            Sebagai asisten, Anda dapat memantau jalannya kuis dan ujian secara langsung (read-only) untuk mendeteksi kendala koneksi atau anomali mahasiswa. Tindakan penalti tetap merupakan wewenang dosen pengampu.
          </p>
        </div>
      </RetroWindow>

      {/* 3 Metric Cards Full Width */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="rounded-xl border-2 border-black bg-white p-5 shadow-retro space-y-1">
          <span className="text-xs font-sans font-bold text-muted-foreground uppercase">Peserta Mengerjakan</span>
          <p className="font-heading font-bold text-3xl text-foreground">34 <span className="text-xs font-sans text-muted-foreground font-normal">/ 36 Mahasiswa</span></p>
          <span className="text-xs text-ink font-bold flex items-center gap-1 pt-1">
            <span className="w-2 h-2 rounded-full bg-gray-dark animate-pulse" /> 94.4% Hadir
          </span>
        </div>

        <div className="rounded-xl border-2 border-black bg-white p-5 shadow-retro space-y-1">
          <span className="text-xs font-sans font-bold text-muted-foreground uppercase">Sisa Waktu Ujian</span>
          <p className="font-heading font-bold text-3xl text-foreground font-sans">54:20</p>
          <span className="text-xs text-neutral-600 font-sans pt-1 block">
            Dari total durasi 90 menit
          </span>
        </div>

        <div className="rounded-xl border-2 border-black bg-white p-5 shadow-retro space-y-1">
          <span className="text-xs font-sans font-bold text-muted-foreground uppercase">Anomali Terdeteksi</span>
          <p className="font-heading font-bold text-3xl text-ink font-sans">1 Event</p>
          <span className="text-xs text-ink font-sans pt-1 block">
            Tab Switch / Window Blur
          </span>
        </div>
      </div>

      {/* Sesi Ujian Aktif & Live Telemetry Feed Full Width */}
      <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-black pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-dark animate-pulse" />
              <span className="text-xs font-sans font-bold uppercase text-ink">Sedang Berlangsung</span>
            </div>
            <h2 className="font-heading font-bold text-xl text-foreground mt-1">UTS Praktikum: Arsitektur Backend & API (TI-301)</h2>
            <p className="text-xs text-muted-foreground">Dosen Pengampu: Dr. Ardiansyah, S.T., M.Kom. · Pengawasan Standar</p>
          </div>
          <Link
            href="/classes"
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border-2 border-black bg-neutral-100 hover:bg-neutral-200 text-foreground font-bold text-xs transition-all shadow-xs"
          >
            <span>Buka Hub Kelas</span>
          </Link>
        </div>

        {/* Live Proctoring Read-Only Feed Cards */}
        <div className="space-y-3">
          <h3 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span>Feed Pemantauan Aktivitas Real-Time Peserta</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PROCTOR_TELEMETRY.map((p) => (
              <div
                key={p.nim}
                className="p-4 rounded-lg border-2 border-black bg-neutral-50 shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-bold text-xs text-neutral-900 bg-white px-2 py-0.5 rounded border border-neutral-300">
                      {p.nim}
                    </span>
                    <span className="font-heading font-bold text-sm text-foreground">
                      {p.name}
                    </span>
                  </div>
                  <span className={`text-xs font-sans font-bold px-2 py-0.5 rounded border ${p.statusColor}`}>
                    {p.status}
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <p className="text-muted-foreground font-sans">
                    Posisi: <strong className="text-foreground">{p.question}</strong>
                  </p>
                  <p className="text-foreground/90 bg-white p-2.5 rounded border border-neutral-200 font-sans text-xs">
                    {p.activity}
                  </p>
                </div>

                <div className="text-xs text-muted-foreground font-sans text-right pt-1">
                  Pembaruan: {p.time}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-lg border border-neutral-200 bg-neutral-50 text-xs text-muted-foreground flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-neutral-500 shrink-0 mt-0.5" />
          <p>
            Catatan: Tindakan administratif seperti penambahan waktu khusus, penghentian sesi ujian, atau pembatalan percobaan hanya dapat dilakukan oleh Dosen Pengampu melalui Panel Live Dosen.
          </p>
        </div>
      </div>
    </div>
  );
}
