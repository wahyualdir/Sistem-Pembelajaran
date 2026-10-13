import React from 'react';
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
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';

export default function NotificationPreferencesPage() {
  return (
    <div className="p-6 sm:p-9 w-full space-y-8 animate-fade-up">
      <RetroWindow
        title="preferensi_kanal_notifikasi.app"
        badge="PENGATURAN AKUN"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-6 sm:p-8 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-lg border-2 border-retro-border bg-retro-orange text-white shadow-xs">
                <Settings className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-foreground">
                Preferensi Kanal Notifikasi
              </h1>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mt-1 leading-relaxed">
              Atur distribusi notifikasi penting terkait jadwal pembukaan sesi ujian online, peringatan tenggat pengumpulan tugas kuliah, edaran resmi kampus, dan rekap nilai akhir.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border-2 border-retro-border bg-retro-warm px-4 py-1.5 text-sm font-mono font-bold text-foreground">
              Gateway Terhubung
            </span>
          </div>
        </div>
      </RetroWindow>

      {/* 1. KANAL DISTRIBUSI FULL CARDS */}
      <RetroWindow
        title="kanal_pengiriman_notifikasi.config"
        headerClassName="bg-retro-warm"
        bodyClassName="p-6 sm:p-7 space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-black text-lg sm:text-xl text-foreground flex items-center gap-2">
            <Bell className="h-5 w-5 text-retro-orange" />
            <span>Kanal Distribusi Notifikasi</span>
          </h2>
          <span className="text-xs font-mono text-muted-foreground">Pilih saluran penerima</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-xl border-2 border-black bg-retro-warm/40 shadow-retro flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg border border-black bg-white">
                  <Bell className="h-6 w-6 text-foreground" />
                </div>
                <span className="px-2 py-0.5 rounded border border-black bg-retro-yellow text-xs font-mono font-bold">
                  WAJIB AKTIF
                </span>
              </div>
              <div>
                <h3 className="font-heading font-black text-base text-foreground">In-App Notification</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Pemberitahuan instan di bilah atas aplikasi web SIAJAR secara realtime.
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-black/20 flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Status: Selalu Aktif</span>
              <input type="checkbox" defaultChecked disabled className="h-5 w-5 accent-black rounded cursor-not-allowed" />
            </div>
          </div>

          <div className="p-5 rounded-xl border-2 border-black bg-white shadow-retro flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg border border-black bg-white">
                  <Mail className="h-6 w-6 text-foreground" />
                </div>
                <span className="px-2 py-0.5 rounded border border-black bg-retro-mint text-xs font-mono font-bold">
                  TERVERIFIKASI
                </span>
              </div>
              <div>
                <h3 className="font-heading font-black text-base text-foreground">Email Institusi</h3>
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  wahyualdiriyanto80@gmail.com
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Rangkuman digest tugas H-24 jam dan surat edaran rektorat.
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-black/20 flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Terima Email</span>
              <input type="checkbox" defaultChecked className="h-5 w-5 accent-black rounded cursor-pointer" />
            </div>
          </div>

          <div className="p-5 rounded-xl border-2 border-black bg-white shadow-retro flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg border border-black bg-white">
                  <Smartphone className="h-6 w-6 text-foreground" />
                </div>
                <span className="px-2 py-0.5 rounded border border-black bg-retro-warm text-xs font-mono font-bold">
                  GATEWAY DARURAT
                </span>
              </div>
              <div>
                <h3 className="font-heading font-black text-base text-foreground">WhatsApp Gateway</h3>
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  +62 822-****-8891
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Peringatan langsung saat ujian online dibuka atau perubahan ruangan kelas mendadak.
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-black/20 flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Terima Pesan WA</span>
              <input type="checkbox" defaultChecked className="h-5 w-5 accent-black rounded cursor-pointer" />
            </div>
          </div>
        </div>
      </RetroWindow>

      {/* 2. JENIS KEJADIAN GRID FULL */}
      <RetroWindow
        title="jenis_kejadian_dan_pemberitahuan.filter"
        headerClassName="bg-retro-warm"
        bodyClassName="p-6 sm:p-7 space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-black text-lg text-foreground">
            Kategori Peristiwa yang Memicu Notifikasi
          </h2>
          <span className="text-xs font-mono text-muted-foreground">Centang yang ingin diterima</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Ujian Baru Dibuka oleh Dosen Pengampu', desc: 'Sesi kuis/UTS/UAS dimulai', checked: true },
            { label: 'Tenggat Tugas Mendekati H-24 Jam', desc: 'Peringatan sisa waktu pengumpulan', checked: true },
            { label: 'Presensi Sesi Kuliah Dimulai', desc: 'Kode QR presensi aktif', checked: true },
            { label: 'Nilai Kuis / Ujian Diterbitkan', desc: 'Hasil evaluasi dan huruf mutu', checked: true },
            { label: 'Balasan Diskusi Forum Kelas', desc: 'Respon dari dosen atau mahasiswa', checked: false },
            { label: 'Pengumuman Resmi Fakultas / Rektorat', desc: 'Edaran kalender akademik resmi', checked: true },
          ].map((item) => (
            <label
              key={item.label}
              className="flex items-start gap-3 p-4 rounded-xl border-2 border-black bg-white hover:bg-retro-warm/30 shadow-retro transition-all cursor-pointer"
            >
              <input
                type="checkbox"
                defaultChecked={item.checked}
                className="h-4 w-4 accent-black rounded mt-1 shrink-0"
              />
              <div className="space-y-1">
                <span className="text-xs sm:text-sm font-bold text-foreground block">
                  {item.label}
                </span>
                <span className="text-xs text-muted-foreground block font-mono">
                  {item.desc}
                </span>
              </div>
            </label>
          ))}
        </div>

        <div className="pt-4 border-t-2 border-black/10 flex justify-end">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border-2 border-black bg-black text-white font-heading font-black text-sm shadow-retro hover:bg-neutral-800 transition-all"
          >
            <Save className="h-4 w-4" />
            <span>Simpan Pengaturan Notifikasi</span>
          </button>
        </div>
      </RetroWindow>
    </div>
  );
}
