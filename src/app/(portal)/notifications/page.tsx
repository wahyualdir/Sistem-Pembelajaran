import React from 'react';
import Link from 'next/link';
import { listNotificationsAction } from '@/modules/academic/actions';
import { MarkAllRead } from '@/modules/academic/mark-all-read';
import { RetroWindow } from '@/components/retro/retro-window';
import {
  Bell,
  CheckCircle2,
  Clock,
  ArrowRight,
  Inbox,
} from 'lucide-react';

const fmt = (iso: string) =>
  `${new Date(iso).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'short',
  })} WIB`;

export default async function NotificationsPage() {
  const items = await listNotificationsAction();
  const unread = items.filter((n) => !n.read_at).length;

  return (
    <div className="p-6 sm:p-9 w-full space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW NOTIFIKASI */}
      <RetroWindow
        title="notifikasi_akademik_pusat.app"
        badge={unread > 0 ? `${unread} BARU` : 'SEMUA DIBACA'}
        headerClassName="bg-retro-yellow"
        bodyClassName="p-6 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg border-[1.5px] border-retro-border bg-retro-orange text-white shadow-xs">
                <Bell className="h-5 w-5" />
              </div>
              <h1 className="font-heading font-black text-2xl tracking-tight text-foreground">
                Pusat Notifikasi Akademik
              </h1>
            </div>
            <p className="text-base sm:text-lg text-black font-medium max-w-2xl mt-1 leading-relaxed">
              Pemberitahuan terkini terkait tugas baru, nilai yang telah terbit, pengumuman perkuliahan, dan aktivitas akun Anda di SIAJAR.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unread > 0 ? (
              <MarkAllRead />
            ) : (
              <span className="rounded-full border-2 border-black bg-retro-mint text-black px-4 py-1.5 text-sm font-mono font-black shadow-xs flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-black" />
                Semua Telah Dibaca
              </span>
            )}
          </div>
        </div>

        {/* Metrik Ringkas Notifikasi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5 border-t-2 border-black/20 mt-5">
          <div className="p-4 rounded-lg border-2 border-black bg-retro-warm shadow-xs flex items-center gap-3">
            <div className="p-2.5 rounded border-2 border-black bg-white text-black">
              <Inbox className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-mono font-black text-black uppercase">Total Notifikasi</p>
              <p className="font-heading font-black text-2xl sm:text-3xl text-black leading-tight">{items.length}</p>
            </div>
          </div>

          <div className="p-4 rounded-lg border-2 border-black bg-retro-yellow shadow-xs flex items-center gap-3">
            <div className="p-2.5 rounded border-2 border-black bg-white text-black">
              <Bell className="h-6 w-6 text-retro-orange" />
            </div>
            <div>
              <p className="text-xs font-mono font-black text-black uppercase">Belum Dibaca</p>
              <p className="font-heading font-black text-2xl sm:text-3xl text-black leading-tight">{unread}</p>
            </div>
          </div>
        </div>
      </RetroWindow>

      {/* 2. DAFTAR NOTIFIKASI */}
      <RetroWindow
        title="riwayat_notifikasi.list"
        headerClassName="bg-retro-warm"
        bodyClassName="p-6 space-y-3"
      >
        {items.length === 0 ? (
          <div className="p-8 text-center rounded-lg border-2 border-dashed border-black bg-retro-warm/30 space-y-2">
            <Inbox className="h-8 w-8 text-black/60 mx-auto" />
            <p className="text-base font-black text-black">Kotak Notifikasi Bersih</p>
            <p className="text-sm text-black font-medium max-w-md mx-auto">
              Belum ada notifikasi baru. Pengumuman dosen, tugas kuliah, dan perubahan status nilai akan masuk ke sini.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((n, i) => (
              <div
                key={n.id}
                className={`p-5 rounded-lg border-2 border-black bg-white shadow-xs space-y-2.5 hover:bg-retro-warm/30 transition-all animate-fade-up ${
                  !n.read_at ? 'border-l-[6px] border-l-retro-orange' : ''
                }`}
                style={{ animationDelay: `${i * 35}ms` }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {!n.read_at && (
                      <span className="h-2.5 w-2.5 rounded-full bg-retro-orange shrink-0" />
                    )}
                    {n.class_id ? (
                      <Link
                        href={`/classes/${n.class_id}`}
                        className="font-heading font-black text-base sm:text-lg text-black hover:text-retro-orange transition-colors flex items-center gap-1.5"
                      >
                        <span>{n.title}</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <h3 className="font-heading font-black text-base sm:text-lg text-black">{n.title}</h3>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm text-black font-mono font-bold flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-retro-orange" />
                    {fmt(n.created_at)}
                  </span>
                </div>

                <p className="text-sm sm:text-base text-black font-medium pl-4 border-l-2 border-black/20 leading-relaxed">
                  {n.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </RetroWindow>
    </div>
  );
}
