'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Settings,
  Bell,
  Mail,
  Smartphone,
  Save,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
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
    <div className="p-6 sm:p-9 w-full space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW PREFERENSI */}
      <RetroWindow
        title="preferensi_kanal_notifikasi.app"
        badge="PENGATURAN AKUN"
        headerClassName="bg-gray-soft"
        bodyClassName="p-6 sm:p-8 bg-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-lg border-2 border-black bg-primary text-white shadow-retro-sm">
                <Settings className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-ink">
                Preferensi Notifikasi & Pengingat
              </h1>
            </div>
            <p className="text-sm sm:text-base text-gray-dark max-w-2xl mt-1 leading-relaxed">
              Atur kanal pengiriman (In-App, Email Kampus, WhatsApp Gateway) dan tentukan jenis pengingat otomatis perkuliahan yang ingin Anda terima.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/notifications"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-2 border-black bg-surface text-ink text-xs sm:text-sm font-bold shadow-retro-sm hover:bg-gray-soft transition-all"
            >
              <Bell className="h-4 w-4 text-primary" />
              <span>Lihat Kotak Notifikasi</span>
            </Link>
          </div>
        </div>

        {feedback && (
          <div
            className={`mt-5 p-3.5 rounded-lg border-2 border-black text-xs sm:text-sm font-bold flex items-center justify-between animate-fade-up ${
              feedback.type === 'success'
                ? 'bg-surface text-ink border-black'
                : 'bg-primary text-white border-black'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-primary-dark" />
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
      </RetroWindow>

      {/* 2. KANAL PENGIRIMAN (IN-APP, EMAIL, WHATSAPP) */}
      <RetroWindow
        title="kanal_distribusi_pengiriman.config"
        headerClassName="bg-gray-soft"
        bodyClassName="p-6 sm:p-7 space-y-6 bg-surface"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-lg sm:text-xl text-ink flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <span>Kanal Distribusi Pengiriman</span>
          </h2>
          <span className="text-xs font-sans text-gray-dark font-medium">Pilih saluran yang diaktifkan</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* KANAL 1: IN-APP (WAJIB) */}
          <div className="p-5 rounded-xl border-2 border-black bg-gray-soft/40 shadow-retro-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg border-2 border-black bg-surface text-ink">
                  <Bell className="h-6 w-6" />
                </div>
                <span className="px-2 py-0.5 rounded border border-black bg-gray-dark text-white text-xs font-sans font-bold">
                  WAJIB AKTIF
                </span>
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-ink">In-App Notification</h3>
                <p className="text-xs text-gray-dark mt-1 leading-relaxed">
                  Pemberitahuan instan di bilah navigasi atas web portal SIAJAR secara realtime.
                </p>
              </div>
            </div>
            <div className="pt-3 border-t-2 border-black/10 flex items-center justify-between">
              <span className="text-xs font-bold text-ink">Status: Selalu Aktif</span>
              <input
                type="checkbox"
                checked={true}
                disabled
                className="h-5 w-5 accent-black rounded cursor-not-allowed"
              />
            </div>
          </div>

          {/* KANAL 2: EMAIL VIA SMTP */}
          <div
            onClick={() => toggleChannel('email')}
            className={`p-5 rounded-xl border-2 border-black bg-surface shadow-retro-sm flex flex-col justify-between space-y-4 transition-all cursor-pointer hover:bg-gray-soft/20 ${
              preferences.channels.email ? 'border-black' : 'opacity-70'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg border-2 border-black bg-surface text-ink">
                  <Mail className="h-6 w-6" />
                </div>
                <span className="px-2 py-0.5 rounded border border-black bg-surface text-ink text-xs font-sans font-bold">
                  SMTP INSTITUSI
                </span>
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-ink">Email Kampus</h3>
                <p className="text-xs text-gray-dark mt-1 font-sans">
                  Akun Institusi Civitas Akademika Terverifikasi
                </p>
                <p className="text-xs text-gray-dark mt-1 leading-relaxed">
                  Rangkuman tugas, surat keputusan akademik, dan pemberitahuan penting perkuliahan.
                </p>
              </div>
            </div>
            <div className="pt-3 border-t-2 border-black/10 flex items-center justify-between">
              <span className="text-xs font-bold text-ink">
                {preferences.channels.email ? 'Status: Aktif' : 'Status: Nonaktif'}
              </span>
              <input
                type="checkbox"
                checked={preferences.channels.email}
                onChange={() => {}}
                className="h-5 w-5 accent-black rounded cursor-pointer"
              />
            </div>
          </div>

          {/* KANAL 3: WHATSAPP GATEWAY (OPSIONAL) */}
          <div
            onClick={() => toggleChannel('whatsapp')}
            className={`p-5 rounded-xl border-2 border-black bg-surface shadow-retro-sm flex flex-col justify-between space-y-4 transition-all cursor-pointer hover:bg-gray-soft/20 ${
              preferences.channels.whatsapp ? 'border-black' : 'opacity-70'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg border-2 border-black bg-surface text-ink">
                  <Smartphone className="h-6 w-6" />
                </div>
                <span className="px-2 py-0.5 rounded border border-black bg-gray-soft text-ink text-xs font-sans font-bold">
                  ADAPTER GATEWAY
                </span>
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-ink">WhatsApp Gateway</h3>
                <p className="text-xs text-gray-dark mt-1 font-sans">
                  Nomor Kontak Terdaftar di Profil
                </p>
                <p className="text-xs text-gray-dark mt-1 leading-relaxed">
                  Pengingat darurat langsung saat ujian dibuka atau pergantian ruang mendesak.
                </p>
              </div>
            </div>
            <div className="pt-3 border-t-2 border-black/10 flex items-center justify-between">
              <span className="text-xs font-bold text-ink">
                {preferences.channels.whatsapp ? 'Status: Aktif' : 'Status: Nonaktif'}
              </span>
              <input
                type="checkbox"
                checked={preferences.channels.whatsapp}
                onChange={() => {}}
                className="h-5 w-5 accent-black rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </RetroWindow>

      {/* 3. JENIS PERISTIWA DAN PENGINGAT OTOMATIS */}
      <RetroWindow
        title="jenis_pengingat_dan_kejadian.filter"
        headerClassName="bg-gray-soft"
        bodyClassName="p-6 sm:p-7 space-y-6 bg-surface"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-lg text-ink">
            Kategori Peristiwa yang Memicu Notifikasi & Pengingat
          </h2>
          <span className="text-xs font-sans text-gray-dark font-medium">Centang peristiwa yang ingin diterima</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
          ].map((item) => (
            <label
              key={item.key}
              onClick={() => toggleEvent(item.key)}
              className="flex items-start gap-3 p-4 rounded-xl border-2 border-black bg-surface hover:bg-gray-soft/30 shadow-retro-sm transition-all cursor-pointer"
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => {}}
                className="h-4 w-4 accent-black rounded mt-1 shrink-0 cursor-pointer"
              />
              <div className="space-y-1">
                <span className="text-xs sm:text-sm font-bold text-ink block">
                  {item.label}
                </span>
                <span className="text-xs text-gray-dark block font-sans leading-relaxed">
                  {item.desc}
                </span>
              </div>
            </label>
          ))}
        </div>

        <div className="pt-5 border-t-2 border-black/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-dark font-medium">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Semua notifikasi terproteksi sistem deduplikasi agar tidak terkirim ganda.</span>
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border-2 border-black bg-ink text-white font-heading font-bold text-sm shadow-retro-sm hover:bg-gray-dark transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>{isPending ? 'Menyimpan...' : 'Simpan Pengaturan Notifikasi'}</span>
          </button>
        </div>
      </RetroWindow>
    </div>
  );
}
