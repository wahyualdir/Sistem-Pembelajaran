'use client';

import React, { useState, useEffect } from 'react';
import { RetroWindow } from '@/components/retro/retro-window';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import {
  getActivityPrivacyStatusAction,
  setActivityLoggingAction,
  exportActivityDataAction,
  clearActivityHistoryAction,
  type ActivityPrivacyStatus,
} from './activity-privacy-actions';

export function ActivityPrivacyClient() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState<ActivityPrivacyStatus | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    const res = await getActivityPrivacyStatusAction();
    if (res.success && res.status) {
      setStatus(res.status);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleToggleLogging = async () => {
    if (!status) return;
    const newEnabled = !status.enabled;
    setUpdating(true);
    setFeedback(null);
    const res = await setActivityLoggingAction(newEnabled);
    if (res.success) {
      setStatus({ ...status, enabled: newEnabled });
      setFeedback({
        type: 'success',
        message: newEnabled
          ? 'Pencatatan aktivitas belajar mandiri diaktifkan.'
          : 'Pencatatan aktivitas belajar dinonaktifkan. Data baru tidak akan disimpan.',
      });
    } else {
      setFeedback({ type: 'error', message: res.error || 'Gagal mengubah pengaturan.' });
    }
    setUpdating(false);
  };

  const handleDownload = async () => {
    setDownloading(true);
    setFeedback(null);
    const res = await exportActivityDataAction();
    if (res.success && res.data) {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `aktivitas_belajar_siajar_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setFeedback({ type: 'success', message: 'Berkas data aktivitas belajar berhasil diunduh.' });
    } else {
      setFeedback({ type: 'error', message: res.error || 'Gagal mengunduh berkas data.' });
    }
    setDownloading(false);
  };

  const handleDeleteHistory = async () => {
    setDeleting(true);
    setFeedback(null);
    const res = await clearActivityHistoryAction();
    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Riwayat berhasil dihapus: ${res.deletedEvents} kejadian aktivitas dan ${res.deletedRecaps} rekap semester dibersihkan permanen.`,
      });
      setShowConfirmDelete(false);
      await fetchStatus();
    } else {
      setFeedback({ type: 'error', message: res.error || 'Gagal menghapus riwayat.' });
    }
    setDeleting(false);
  };

  const kindLabels: Record<string, string> = {
    chapter_view: 'Membuka Modul Bab',
    quiz_complete: 'Penyelesaian Kuis Pemahaman',
    flashcard_review: 'Ulasan Kartu Leitner',
    podcast_progress: 'Pemutaran Podcast Materi',
    skill_exchange_interaction: 'Bantuan Tukar Keahlian',
  };

  return (
    <div className="space-y-6">
      <RetroWindow
        title="data_aktivitas_belajar.conf"
        badge="PRIVASI BELAJAR MANDIRI"
        headerClassName="bg-yellow-pale"
        bodyClassName="p-6 bg-surface space-y-6"
      >
        {/* PERNYATAAN TEGAS KEADILAN AKADEMIK */}
        <div className="p-4 rounded border-2 border-primary/30 bg-primary/5 text-foreground space-y-1">
          <div className="flex items-center gap-2 font-bold text-sm text-primary">
            <ShieldCheck className="h-5 w-5" />
            <span>Pernyataan Integritas dan Perlindungan Privasi Mahasiswa</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong>Log tidak pernah dipakai untuk menilai atau menghukum mahasiswa.</strong> Data rekaman aktivitas belajar mandiri di sistem Peta Pulau, Flashcard, dan Podcast murni ditujukan untuk menyajikan jadwal pengulangan berkala (spaced repetition), rekomendasi prioritas belajar harian, serta ringkasan refleksi Rekap Semester Anda sendiri. Dosen maupun pihak program studi dilarang keras dan dibatasi oleh basis data untuk melihat rekaman mentah ini.
          </p>
        </div>

        {feedback && (
          <div
            className={`p-3 rounded border text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-green-50 text-green-800 border-green-300'
                : 'bg-red-50 text-red-800 border-red-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* SAKELAR PENCATATAN AKTIVITAS */}
        <div className="flex items-center justify-between p-4 rounded border-2 border-border bg-background">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h4 className="font-bold text-sm text-foreground">Catat aktivitas belajar mandiri</h4>
            </div>
            <p className="text-xs text-muted-foreground max-w-xl">
              Bila dimatikan, sistem tidak akan menyimpan rekam jejak ulasan kartu, putar podcast, atau pengerjaan kuis ke log aktivitas. Fitur belajar tetap berfungsi normal, namun Rekap Semester hanya menampilkan ringkasan kelulusan bab.
            </p>
          </div>
          <button
            type="button"
            disabled={loading || updating}
            onClick={handleToggleLogging}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-black transition-colors duration-200 ease-in-out focus:outline-none ${
              status?.enabled ? 'bg-primary' : 'bg-gray-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                status?.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* RINGKASAN DATA TERCATAT */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Ringkasan Data Tersimpan Saat Ini
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStatus}
              disabled={loading}
              className="h-7 text-xs gap-1 border-black"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              Segarkan
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="p-3.5 rounded border border-border bg-background space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium">Total Log Aktivitas</span>
              <div className="font-heading font-black text-xl text-foreground">
                {status ? status.totalEvents : '...'} <span className="text-xs font-normal text-muted-foreground">kejadian</span>
              </div>
            </div>
            <div className="p-3.5 rounded border border-border bg-background space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium">Rekapitulasi Semester</span>
              <div className="font-heading font-black text-xl text-foreground">
                {status ? status.recapCount : '...'} <span className="text-xs font-normal text-muted-foreground">rekap</span>
              </div>
            </div>
            <div className="p-3.5 rounded border border-border bg-background space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium">Masa Retensi Otomatis</span>
              <div className="font-heading font-black text-xl text-foreground">
                365 <span className="text-xs font-normal text-muted-foreground">hari (1 tahun)</span>
              </div>
            </div>
          </div>

          {status && Object.keys(status.countsByKind).length > 0 && (
            <div className="p-3 rounded border border-border bg-background text-xs space-y-2">
              <span className="font-semibold text-muted-foreground">Rincian Berdasarkan Jenis Kejadian (Whitelist):</span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(status.countsByKind).map(([kind, count]) => (
                  <Badge key={kind} variant="secondary" className="text-xs border border-border">
                    {kindLabels[kind] || kind}: <strong className="ml-1 text-foreground">{count}</strong>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* HAK UNDUH & HAK HAPUS */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={downloading || loading}
            className="border-2 border-black shadow-retro font-bold text-xs gap-2"
          >
            <Download className="h-4 w-4" />
            {downloading ? 'Menyiapkan Berkas...' : 'Unduh Data Saya (.json)'}
          </Button>

          {!showConfirmDelete ? (
            <Button
              variant="destructive"
              onClick={() => setShowConfirmDelete(true)}
              disabled={deleting || loading}
              className="border-2 border-black shadow-retro font-bold text-xs gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Hapus Riwayat Saya
            </Button>
          ) : (
            <div className="p-3 rounded border-2 border-red-500 bg-red-50 flex flex-col sm:flex-row items-center gap-3">
              <div className="text-xs text-red-900 leading-snug">
                <span className="font-bold flex items-center gap-1">
                  <ShieldAlert className="h-4 w-4 text-red-600 inline" />
                  Konfirmasi Penghapusan Permanen:
                </span>
                Tindakan ini akan menghapus semua log aktivitas, riwayat kartu, progres podcast, dan rekap semester Anda secara permanen.
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDeleteHistory}
                  disabled={deleting}
                  className="text-xs font-bold"
                >
                  {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowConfirmDelete(false)}
                  disabled={deleting}
                  className="text-xs border-black"
                >
                  Batal
                </Button>
              </div>
            </div>
          )}
        </div>
      </RetroWindow>
    </div>
  );
}
