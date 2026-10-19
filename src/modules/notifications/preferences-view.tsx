'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Bell,
  Mail,
  Smartphone,
  Save,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { saveNotificationPreferencesAction } from './actions';
import type { UserNotificationPreferences } from './types';

interface PreferencesViewProps {
  initialPreferences: UserNotificationPreferences;
}

export function PreferencesView({ initialPreferences }: PreferencesViewProps) {
  const [preferences, setPreferences] = useState<UserNotificationPreferences>(initialPreferences);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const toggleChannel = (channel: keyof UserNotificationPreferences['channels']) => {
    if (channel === 'in_app') return; // in_app wajib selalu aktif
    setPreferences((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: !prev.channels[channel],
      },
    }));
  };

  const toggleEvent = (eventKey: keyof UserNotificationPreferences['events']) => {
    setPreferences((prev) => ({
      ...prev,
      events: {
        ...prev.events,
        [eventKey]: !prev.events[eventKey],
      },
    }));
  };

  const handleSave = () => {
    startTransition(async () => {
      setFeedback(null);
      const res = await saveNotificationPreferencesAction({
        channels: preferences.channels,
        events: preferences.events,
      });

      if (res.ok && res.data) {
        setPreferences(res.data);
        setFeedback({
          type: 'success',
          message: 'Preferensi notifikasi dan kanal berhasil disimpan.',
        });
        setTimeout(() => setFeedback(null), 4000);
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Gagal menyimpan preferensi notifikasi.',
        });
      }
    });
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border-2 border-ink text-xs sm:text-sm font-bold flex items-center justify-between shadow-xs ${
            feedback.type === 'success'
              ? 'bg-surface text-ink'
              : 'bg-primary text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-primary" />
            ) : (
              <AlertCircle className="h-4 w-4 text-white" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="underline text-xs font-bold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* 1. KANAL PENGIRIMAN (IN-APP, EMAIL, WHATSAPP) */}
      <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4">
        <div className="flex items-center justify-between border-b-2 border-ink/20 pb-3">
          <div className="space-y-0.5">
            <h2 className="font-heading font-bold text-base sm:text-lg text-ink flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <span>Kanal Distribusi Pengiriman</span>
            </h2>
            <p className="text-xs text-gray-dark font-bold">Pilih saluran notifikasi yang diaktifkan untuk akun Anda</p>
          </div>
          <Link
            href="/notifications"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-ink bg-gray-soft text-ink text-xs font-sans font-bold shadow-xs hover:bg-gray-soft/80 transition-all shrink-0"
          >
            <Bell className="h-3.5 w-3.5 text-primary" />
            <span>Kotak Masuk</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {/* KANAL 1: IN-APP (WAJIB) */}
          <div className="p-4 rounded-xl border-2 border-ink bg-gray-soft/40 shadow-retro-sm flex flex-col justify-between space-y-3">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg border-2 border-ink bg-surface text-ink shadow-xs">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <span className="px-2 py-0.5 rounded-full border-2 border-ink bg-ink text-white text-[11px] font-sans font-bold shadow-xs">
                  WAJIB AKTIF
                </span>
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm sm:text-base text-ink">In-App Notification</h3>
                <p className="text-xs text-gray-dark font-bold font-sans mt-1 leading-relaxed">
                  Pemberitahuan instan di bilah navigasi atas web portal SIAJAR secara realtime.
                </p>
              </div>
            </div>
            <div className="pt-2.5 border-t-2 border-ink/10 flex items-center justify-between text-xs font-sans font-bold">
              <span className="text-ink">Status: Selalu Aktif</span>
              <input
                type="checkbox"
                checked={true}
                disabled
                className="h-4 w-4 accent-black rounded cursor-not-allowed"
              />
            </div>
          </div>

          {/* KANAL 2: EMAIL VIA SMTP */}
          <div
            onClick={() => toggleChannel('email')}
            className={`p-4 rounded-xl border-2 border-ink bg-surface shadow-retro-sm flex flex-col justify-between space-y-3 transition-all cursor-pointer hover:bg-gray-soft/20 ${
              preferences.channels.email ? 'border-ink' : 'opacity-70'
            }`}
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg border-2 border-ink bg-surface text-ink shadow-xs">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <span className="px-2 py-0.5 rounded-full border-2 border-ink bg-gray-soft text-ink text-[11px] font-sans font-bold shadow-xs">
                  SMTP INSTITUSI
                </span>
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm sm:text-base text-ink">Email Kampus</h3>
                <p className="text-xs text-gray-dark font-bold font-sans mt-1 leading-relaxed">
                  Rangkuman tugas, surat keputusan akademik, dan pemberitahuan penting perkuliahan.
                </p>
              </div>
            </div>
            <div className="pt-2.5 border-t-2 border-ink/10 flex items-center justify-between text-xs font-sans font-bold">
              <span className="text-ink">
                {preferences.channels.email ? 'Status: Aktif' : 'Status: Nonaktif'}
              </span>
              <input
                type="checkbox"
                checked={preferences.channels.email}
                onChange={() => {}}
                className="h-4 w-4 accent-black rounded cursor-pointer"
              />
            </div>
          </div>

          {/* KANAL 3: WHATSAPP GATEWAY (OPSIONAL) */}
          <div
            onClick={() => toggleChannel('whatsapp')}
            className={`p-4 rounded-xl border-2 border-ink bg-surface shadow-retro-sm flex flex-col justify-between space-y-3 transition-all cursor-pointer hover:bg-gray-soft/20 ${
              preferences.channels.whatsapp ? 'border-ink' : 'opacity-70'
            }`}
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg border-2 border-ink bg-surface text-ink shadow-xs">
                  <Smartphone className="h-5 w-5 text-primary" />
                </div>
                <span className="px-2 py-0.5 rounded-full border-2 border-ink bg-gray-soft text-ink text-[11px] font-sans font-bold shadow-xs">
                  WHATSAPP
                </span>
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm sm:text-base text-ink">WhatsApp Gateway</h3>
                <p className="text-xs text-gray-dark font-bold font-sans mt-1 leading-relaxed">
                  Pengingat darurat langsung saat ujian dibuka atau pergantian ruang mendesak.
                </p>
              </div>
            </div>
            <div className="pt-2.5 border-t-2 border-ink/10 flex items-center justify-between text-xs font-sans font-bold">
              <span className="text-ink">
                {preferences.channels.whatsapp ? 'Status: Aktif' : 'Status: Nonaktif'}
              </span>
              <input
                type="checkbox"
                checked={preferences.channels.whatsapp}
                onChange={() => {}}
                className="h-4 w-4 accent-black rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. JENIS PERISTIWA DAN PENGINGAT OTOMATIS */}
      <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4">
        <div className="flex items-center justify-between border-b-2 border-ink/20 pb-3">
          <div className="space-y-0.5">
            <h2 className="font-heading font-bold text-base sm:text-lg text-ink">
              Kategori Peristiwa yang Memicu Notifikasi
            </h2>
            <p className="text-xs text-gray-dark font-bold">Centang peristiwa yang ingin Anda terima pengingatnya</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[
            {
              key: 'assignment_due' as const,
              label: 'Pengingat Tenggat Tugas Kuliah',
              desc: 'Notifikasi otomatis H-3, H-1, dan 3 jam sebelum batas akhir pengumpulan.',
              checked: preferences.events.assignment_due,
            },
            {
              key: 'exam_upcoming' as const,
              label: 'Jadwal Ujian / Kuis Online',
              desc: 'Pemberitahuan H-1 dan peringatan 1 jam sebelum ujian dimulai.',
              checked: preferences.events.exam_upcoming,
            },
            {
              key: 'attendance_open' as const,
              label: 'Pembukaan Sesi Presensi Kuliah',
              desc: 'Notifikasi seketika saat dosen membuka sesi presensi QR / lokasi kelas.',
              checked: preferences.events.attendance_open,
            },
            {
              key: 'grades' as const,
              label: 'Penerbitan & Perubahan Nilai',
              desc: 'Hasil penilaian tugas, nilai ujian, atau persetujuan koreksi nilai akhir.',
              checked: preferences.events.grades,
            },
            {
              key: 'announcement' as const,
              label: 'Pengumuman Resmi Kampus & Prodi',
              desc: 'Edaran rektorat, kalender akademik, dan pengumuman ketua program studi.',
              checked: preferences.events.announcement,
            },
            {
              key: 'forum_and_early_warning' as const,
              label: 'Forum Diskusi & Peringatan Dini',
              desc: 'Balasan diskusi kelas dan notifikasi pemantauan keaktifan akademik.',
              checked: preferences.events.forum_and_early_warning,
            },
            {
              key: 'peta_pulau' as const,
              label: 'Progres Peta Pulau & Bab',
              desc: 'Notifikasi pembukaan pulau baru dan pengingat kelulusan bab materi.',
              checked: preferences.events.peta_pulau ?? true,
            },
            {
              key: 'ringkasan_pagi' as const,
              label: 'Ringkasan Pagi Belajar (07.00 WIB)',
              desc: 'Ringkasan harian pengingat tenggat tugas, jadwal ujian, dan kartu ulasan hari ini.',
              checked: preferences.events.ringkasan_pagi ?? true,
            },
            {
              key: 'flashcard_dan_podcast' as const,
              label: 'Flashcard & Podcast Materi',
              desc: 'Pemberitahuan tersedianya podcast audio baru dan kartu konsep jatuh tempo.',
              checked: preferences.events.flashcard_dan_podcast ?? true,
            },
            {
              key: 'tukar_keahlian' as const,
              label: 'Bantuan Belajar Tukar Keahlian',
              desc: 'Pemberitahuan pertanyaan rekan sekelas dan konfirmasi jawaban yang terbantu.',
              checked: preferences.events.tukar_keahlian ?? true,
            },
            {
              key: 'rekap_semester' as const,
              label: 'Rekapitulasi Semester & Pencapaian',
              desc: 'Pemberitahuan penerbitan kartu Rekap Semester dan pencapaian kebiasaan belajar.',
              checked: preferences.events.rekap_semester ?? true,
            },
          ].map((item) => (
            <label
              key={item.key}
              onClick={() => toggleEvent(item.key)}
              className="flex items-start gap-3 p-3.5 rounded-xl border-2 border-ink bg-surface hover:bg-gray-soft/30 shadow-retro-sm transition-all cursor-pointer"
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => {}}
                className="h-4 w-4 accent-black rounded mt-0.5 shrink-0 cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="text-xs sm:text-sm font-bold text-ink block font-heading">
                  {item.label}
                </span>
                <span className="text-xs text-gray-dark block font-sans font-bold leading-relaxed">
                  {item.desc}
                </span>
              </div>
            </label>
          ))}
        </div>

        <div className="pt-4 border-t-2 border-ink/20 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-dark font-bold font-sans">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Semua notifikasi terproteksi sistem deduplikasi agar tidak terkirim ganda.</span>
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border-2 border-ink bg-ink text-white font-heading font-bold text-xs sm:text-sm shadow-retro-sm hover:bg-gray-dark transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>{isPending ? 'Menyimpan...' : 'Simpan Pengaturan Notifikasi'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
