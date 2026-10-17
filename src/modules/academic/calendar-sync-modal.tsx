'use client';

import React, { useState, useTransition } from 'react';
import {
  CalendarDays,
  CalendarPlus,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  X,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getPersonalCalendarTokenAction,
  resetPersonalCalendarTokenAction,
} from './calendar-sync-actions';

export function CalendarSyncModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedUrl, setFeedUrl] = useState<string>('');
  const [webcalUrl, setWebcalUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleOpen = () => {
    setIsOpen(true);
    startTransition(async () => {
      const res = await getPersonalCalendarTokenAction();
      if (res.ok && res.feedUrl && res.webcalUrl) {
        setFeedUrl(res.feedUrl);
        setWebcalUrl(res.webcalUrl);
      }
    });
  };

  const handleCopy = () => {
    if (!feedUrl) return;
    navigator.clipboard.writeText(feedUrl);
    setCopied(true);
    setToastMsg('URL langganan iCalendar berhasil disalin ke clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleResetToken = () => {
    if (!confirm('Apakah Anda yakin ingin me-reset tautan kalender pribadi Anda? Tautan kalender lama yang terhubung di Google Calendar / aplikasi lain akan berhenti sinkronisasi.')) {
      return;
    }

    startTransition(async () => {
      const res = await resetPersonalCalendarTokenAction();
      if (res.ok && res.feedUrl && res.webcalUrl) {
        setFeedUrl(res.feedUrl);
        setWebcalUrl(res.webcalUrl);
        setToastMsg('Tautan kalender berhasil di-reset dengan token keamanan baru.');
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 border-black bg-white text-xs sm:text-sm font-bold shadow-retro hover:bg-neutral-100 transition-all cursor-pointer"
      >
        <CalendarPlus className="h-4 w-4 text-primary" />
        <span>Tambahkan ke Google Calendar / Kalender lain</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-xl border-4 border-black bg-white shadow-retro overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gray-soft border-b-2 border-black flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg border-2 border-black bg-primary text-white shadow-xs">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-heading font-bold text-base sm:text-lg text-black">
                    Sinkronisasi Kalender SIAJAR (.ics)
                  </h3>
                  <p className="text-xs text-black/70 font-sans">
                    Jadwal kuliah mingguan, tenggat tugas, dan ujian otomatis tersinkron ke kalender ponsel & laptop Anda.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg border-2 border-black bg-white hover:bg-neutral-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {toastMsg && (
                <div className="p-3 bg-surface border-2 border-black rounded-lg text-xs font-bold text-ink flex items-center justify-between">
                  <span>{toastMsg}</span>
                  <button type="button" onClick={() => setToastMsg(null)} className="cursor-pointer">&times;</button>
                </div>
              )}

              {/* Box URL Langganan */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-black block">
                  Tautan Langganan Kalender Pribadi
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={feedUrl || 'Memuat URL langganan...'}
                    className="flex-1 p-2.5 rounded-lg border-2 border-black bg-gray-soft/50 font-mono text-xs select-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    disabled={!feedUrl}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border-2 border-black bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-dark cursor-pointer disabled:opacity-50"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span>{copied ? 'Tersalin' : 'Salin URL'}</span>
                  </button>
                </div>
                <p className="text-xs text-black/60 font-sans">
                  Format standar iCalendar RFC 5545. Tanpa login OAuth; aplikasi kalender akan membaca pembaruan jadwal secara berkala via URL ini.
                </p>
              </div>

              {/* Petunjuk Penggunaan per Aplikasi */}
              <div className="space-y-3 pt-2 border-t-2 border-black/10">
                <h4 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  <span>Petunjuk Penambahan Kalender:</span>
                </h4>

                <div className="space-y-2.5 text-xs text-black/80 font-sans">
                  <div className="p-3 rounded-lg border border-black/20 bg-neutral-50 space-y-1">
                    <strong className="text-black block font-bold">1. Google Calendar (Web & Android)</strong>
                    <p>Buka <em>Google Calendar</em> di browser &rarr; Pada menu kiri di samping &quot;Kalender lain&quot;, klik tanda (+) &rarr; Pilih <strong>&quot;Dari URL&quot;</strong> &rarr; Tempelkan URL di atas &rarr; Klik <strong>&quot;Tambahkan kalender&quot;</strong>.</p>
                  </div>

                  <div className="p-3 rounded-lg border border-black/20 bg-neutral-50 space-y-1">
                    <strong className="text-black block font-bold">2. Apple Calendar (iPhone, iPad, Mac)</strong>
                    <p>Buka aplikasi <em>Kalender</em> &rarr; Menu <strong>File &gt; Langganan Kalender Baru...</strong> (atau di iOS: Pengaturan &gt; Kalender &gt; Akun &gt; Tambah Akun &gt; Lainnya &gt; Tambah Kalender Berlangganan) &rarr; Tempelkan URL di atas &rarr; Atur pembaruan otomatis per 1 jam.</p>
                  </div>

                  <div className="p-3 rounded-lg border border-black/20 bg-neutral-50 space-y-1">
                    <strong className="text-black block font-bold">3. Microsoft Outlook</strong>
                    <p>Buka <em>Outlook Kalender</em> &rarr; Klik <strong>Tambah Kalender</strong> &rarr; Pilih <strong>&quot;Berlangganan dari web&quot;</strong> &rarr; Tempelkan URL kalender.</p>
                  </div>
                </div>
              </div>

              {/* Reset Token Keamanan */}
              <div className="p-3 bg-neutral-100 rounded-lg border border-black/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-black block">Privasi & Keamanan Token:</span>
                  <span className="text-black/60">Jika URL Anda tersebar, reset token untuk membatalkan akses lama.</span>
                </div>
                <button
                  type="button"
                  onClick={handleResetToken}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black bg-white hover:bg-neutral-200 text-xs font-bold cursor-pointer shrink-0"
                >
                  <RefreshCw className={cn('h-3.5 w-3.5', isPending && 'animate-spin')} />
                  <span>Reset Tautan Kalender</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t-2 border-black flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 rounded-lg border-2 border-black bg-white text-xs font-bold hover:bg-neutral-100 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
