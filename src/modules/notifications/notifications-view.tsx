'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCircle2,
  Clock,
  ArrowRight,
  Inbox,
  AlertTriangle,
  Info,
  Calendar,
  BookOpen,
  GraduationCap,
  Sparkles,
  RefreshCw,
  Check,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
  triggerScheduledRemindersAction,
} from './actions';
import type { NotificationRecord } from './types';

interface NotificationsViewProps {
  initialItems: NotificationRecord[];
  userRole?: string;
}

const fmt = (iso: string) => {
  try {
    return `${new Date(iso).toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      dateStyle: 'medium',
      timeStyle: 'short',
    })} WIB`;
  } catch {
    return iso;
  }
};

function getTypeIcon(type: string) {
  switch (type) {
    case 'ASSIGNMENT_DUE':
    case 'ASSIGNMENT_NEW':
      return <Clock className="h-4 w-4" />;
    case 'EXAM_UPCOMING':
      return <AlertTriangle className="h-4 w-4" />;
    case 'ATTENDANCE_OPEN':
      return <Calendar className="h-4 w-4" />;
    case 'GRADE_PUBLISHED':
    case 'GRADE_CHANGE_DECIDED':
    case 'GRADE_CHANGE_EXECUTED':
      return <GraduationCap className="h-4 w-4" />;
    case 'MATERIAL_NEW':
      return <BookOpen className="h-4 w-4" />;
    case 'ANNOUNCEMENT_NEW':
      return <Info className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
}

function getTypeBadge(type: string) {
  switch (type) {
    case 'ASSIGNMENT_DUE':
      return {
        label: 'TENGGAT TUGAS',
        className: 'bg-primary text-white border-black font-bold',
      };
    case 'EXAM_UPCOMING':
      return {
        label: 'JADWAL UJIAN',
        className: 'bg-primary text-white border-black font-bold',
      };
    case 'ATTENDANCE_OPEN':
      return {
        label: 'SESI PRESENSI',
        className: 'bg-gray-dark text-white border-black font-bold',
      };
    case 'GRADE_PUBLISHED':
    case 'GRADE_CHANGE_EXECUTED':
      return {
        label: 'NILAI KULIAH',
        className: 'bg-surface text-ink border-ink font-bold',
      };
    case 'ANNOUNCEMENT_NEW':
      return {
        label: 'PENGUMUMAN',
        className: 'bg-gray-soft text-ink border-black font-bold',
      };
    default:
      return {
        label: 'AKADEMIK',
        className: 'bg-gray-soft text-ink border-black font-bold',
      };
  }
}

export function NotificationsView({ initialItems, userRole }: NotificationsViewProps) {
  const [items, setItems] = useState<NotificationRecord[]>(initialItems);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const unreadCount = items.filter((n) => !n.read_at).length;
  const filteredItems = filter === 'unread' ? items.filter((n) => !n.read_at) : items;

  const handleMarkAsRead = (id: string) => {
    startTransition(async () => {
      // Optimistic update
      const now = new Date().toISOString();
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read_at: now } : item))
      );
      const res = await markNotificationReadAction(id);
      if (!res.ok) {
        setStatusMessage(res.error || 'Gagal menandai notifikasi.');
      } else {
        setStatusMessage('Notifikasi telah ditandai dibaca.');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    });
  };

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      const now = new Date().toISOString();
      setItems((prev) => prev.map((item) => ({ ...item, read_at: item.read_at || now })));
      const res = await markAllNotificationsReadAction();
      if (!res.ok) {
        setStatusMessage(res.error || 'Gagal menandai seluruh notifikasi.');
      } else {
        setStatusMessage('Seluruh notifikasi telah ditandai dibaca.');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    });
  };

  const handleTriggerScheduler = () => {
    startTransition(async () => {
      setStatusMessage('Memindai pengingat otomatis...');
      const res = await triggerScheduledRemindersAction();
      if (res.ok && res.data) {
        setStatusMessage(
          `Pemindaian selesai: ${res.data.remindersDispatched} pengingat baru terkirim, ${res.data.skippedDuplicates} terdeteksi duplikat aman.`
        );
        setTimeout(() => setStatusMessage(null), 5000);
      } else {
        setStatusMessage(res.error || 'Gagal memicu pengingat otomatis.');
      }
    });
  };

  return (
    <div className="p-6 sm:p-9 w-full space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW NOTIFIKASI */}
      <RetroWindow
        title="pusat_notifikasi_terpadu.app"
        badge={unreadCount > 0 ? `${unreadCount} BELUM DIBACA` : 'SEMUA TELAH DIBACA'}
        headerClassName="bg-gray-soft"
        bodyClassName="p-6 bg-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-lg border-2 border-black bg-primary text-white shadow-retro-sm">
                <Bell className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl text-ink tracking-tight">
                Pusat Notifikasi & Pengingat
              </h1>
            </div>
            <p className="text-sm sm:text-base text-gray-dark font-medium max-w-2xl leading-relaxed">
              Pemberitahuan resmi perkuliahan, peringatan tenggat pengumpulan tugas (H-3, H-1, 3 jam), jadwal pelaksanaan ujian, dan sesi presensi aktif di SIAJAR.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/notifications/preferences"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-2 border-black bg-surface text-ink text-xs sm:text-sm font-bold shadow-retro-sm hover:bg-gray-soft transition-all"
            >
              <span>Atur Preferensi Kanal</span>
              <ArrowRight className="h-4 w-4 text-primary" />
            </Link>

            {unreadCount > 0 ? (
              <button
                type="button"
                disabled={isPending}
                onClick={handleMarkAllAsRead}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-black bg-ink text-white text-xs sm:text-sm font-bold shadow-retro-sm hover:bg-gray-dark transition-all disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Tandai Semua Dibaca</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-2 border-black bg-gray-soft text-ink text-xs sm:text-sm font-bold shadow-retro-sm">
                <CheckCircle2 className="h-4 w-4 text-primary-dark" />
                Semua Terbaca
              </span>
            )}
          </div>
        </div>

        {/* Banner Status Notifikasi / Pesan Aksi */}
        {statusMessage && (
          <div className="mt-4 p-3 rounded-lg border-2 border-black bg-gray-soft text-xs sm:text-sm font-bold text-ink flex items-center justify-between animate-fade-up">
            <span>{statusMessage}</span>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-xs text-gray-dark hover:text-ink font-bold ml-2 underline cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Metrik Ringkas & Tombol Uji Cron */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 border-t-2 border-black/10 mt-5">
          <div className="p-4 rounded-xl border-2 border-black bg-surface shadow-retro-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg border-2 border-black bg-gray-soft text-ink">
              <Inbox className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-dark uppercase tracking-wider">Total Notifikasi</p>
              <p className="font-heading font-bold text-2xl text-ink tabular-nums">{items.length}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border-2 border-black bg-surface shadow-retro-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg border-2 border-black bg-primary text-white">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-dark uppercase tracking-wider">Belum Dibaca</p>
              <p className="font-heading font-bold text-2xl text-ink tabular-nums">{unreadCount}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border-2 border-black bg-gray-soft shadow-retro-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-dark uppercase tracking-wider">Pengingat Otomatis</p>
              <p className="text-xs font-bold text-ink mt-0.5">H-3, H-1, 3 Jam & Presensi</p>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={handleTriggerScheduler}
              title="Jalankan pemindaian pengingat otomatis sekarang"
              className="p-2 rounded-lg border-2 border-black bg-surface hover:bg-gray-soft text-ink font-bold text-xs shadow-retro-sm flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 text-primary ${isPending ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Pindai</span>
            </button>
          </div>
        </div>
      </RetroWindow>

      {/* 2. FILTER TABEL: SEMUA / BELUM DIBACA */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="inline-flex p-1 rounded-xl border-2 border-black bg-surface shadow-retro-sm">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-heading font-bold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-ink text-white border-2 border-black shadow-retro-sm'
                : 'text-ink hover:bg-gray-soft'
            }`}
          >
            Semua ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-heading font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'unread'
                ? 'bg-ink text-white border-2 border-black shadow-retro-sm'
                : 'text-ink hover:bg-gray-soft'
            }`}
          >
            <span>Belum Dibaca</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <span className="text-xs font-bold text-gray-dark">
          Menampilkan {filteredItems.length} pemberitahuan
        </span>
      </div>

      {/* 3. DAFTAR NOTIFIKASI */}
      <RetroWindow
        title={`daftar_notifikasi_${filter}.list`}
        headerClassName="bg-gray-soft"
        bodyClassName="p-6 space-y-4"
      >
        {filteredItems.length === 0 ? (
          <div className="p-10 text-center rounded-xl border-2 border-dashed border-black bg-gray-soft/40 space-y-3">
            <div className="p-3 rounded-full border-2 border-black bg-surface inline-block text-gray-dark">
              <Inbox className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-heading font-bold text-ink">
              {filter === 'unread' ? 'Seluruh Notifikasi Telah Dibaca' : 'Kotak Notifikasi Bersih'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-dark font-medium max-w-md mx-auto leading-relaxed">
              {filter === 'unread'
                ? 'Bagus sekali! Tidak ada pemberitahuan tertunda. Silakan pilih tab "Semua" untuk melihat riwayat lengkap.'
                : 'Belum ada notifikasi yang diterima. Pengumuman perkuliahan, pengingat tenggat tugas, dan jadwal ujian akan muncul di sini.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((n, idx) => {
              const badge = getTypeBadge(n.type);
              const isUnread = !n.read_at;

              return (
                <div
                  key={n.id}
                  className={`p-5 rounded-xl border-2 border-black bg-surface shadow-retro-sm space-y-3 transition-all hover:bg-gray-soft/20 animate-fade-up ${
                    isUnread ? 'border-l-[6px] border-l-primary' : ''
                  }`}
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {isUnread && (
                        <span
                          className="h-2.5 w-2.5 rounded-full bg-primary shrink-0"
                          title="Belum dibaca"
                        />
                      )}

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border text-[11px] font-sans ${badge.className}`}
                      >
                        {getTypeIcon(n.type)}
                        <span>{badge.label}</span>
                      </span>

                      <h3 className="font-heading font-bold text-base sm:text-lg text-ink">
                        {n.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-dark font-sans font-bold flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-primary-dark" />
                        {fmt(n.created_at)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-ink font-medium pl-3 border-l-2 border-black/20 leading-relaxed">
                    {n.body}
                  </p>

                  <div className="pt-2 border-t border-black/10 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      {n.target_url ? (
                        <Link
                          href={n.target_url}
                          className="inline-flex items-center gap-1.5 text-xs font-heading font-bold text-ink hover:text-primary-dark transition-colors"
                        >
                          <span>Buka Tautan Tujuan</span>
                          <ArrowRight className="h-3.5 w-3.5 text-primary" />
                        </Link>
                      ) : n.class_id ? (
                        <Link
                          href={`/classes/${n.class_id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-heading font-bold text-ink hover:text-primary-dark transition-colors"
                        >
                          <span>Buka Kelas Kuliah</span>
                          <ArrowRight className="h-3.5 w-3.5 text-primary" />
                        </Link>
                      ) : (
                        <span className="text-[11px] text-gray font-sans font-medium">
                          Pemberitahuan Sistem
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isUnread ? (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleMarkAsRead(n.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded border border-black bg-surface hover:bg-gray-soft text-ink text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5 text-primary" />
                          <span>Tandai Dibaca</span>
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-gray-dark flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-gray" />
                          <span>Telah Dibaca</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </RetroWindow>
    </div>
  );
}
