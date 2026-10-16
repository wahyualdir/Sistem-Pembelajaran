'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  revokeDeviceAction,
  revokeOtherSessionsAction,
  reportNotMeAction,
} from '@/modules/identity/actions';
import { RetroWindow } from '@/components/retro/retro-window';
import {
  Laptop,
  Smartphone,
  ShieldAlert,
  AlertTriangle,
  LogOut,
  CheckCircle2,
  Trash2,
  Lock,
  ShieldCheck,
} from 'lucide-react';

interface DeviceItem {
  id: string;
  label: string;
  last_ip_masked: string | null;
  last_country: string | null;
  last_city: string | null;
  last_seen_at: string;
  isCurrent: boolean;
  revoked_at: string | null;
}

export function DeviceManager({
  devices,
  userId: _userId,
}: {
  devices: DeviceItem[];
  userId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmNotMe, setShowConfirmNotMe] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmOthers, setConfirmOthers] = useState(false);
  const [leaving, setLeaving] = useState<string[]>([]);

  const activeDevices = devices.filter((d) => !d.revoked_at);
  const revokedDevices = devices.filter((d) => !!d.revoked_at);

  const handleRevokeSingle = (deviceId: string) => {
    setConfirmId(null);
    startTransition(async () => {
      setMessage(null);
      setErrorMessage(null);
      const res = await revokeDeviceAction(deviceId);
      if (res.ok) {
        setLeaving((l) => [...l, deviceId]);
        setMessage('Akses sesi perangkat berhasil dicabut.');
        router.refresh();
      } else {
        setErrorMessage(res.error || 'Gagal mencabut sesi perangkat.');
      }
    });
  };

  const handleRevokeOthers = () => {
    setConfirmOthers(false);
    startTransition(async () => {
      setMessage(null);
      setErrorMessage(null);
      const res = await revokeOtherSessionsAction();
      if (res.ok) {
        setMessage('Seluruh sesi perangkat lain telah berhasil dicabut.');
        router.refresh();
      } else {
        setErrorMessage(res.error || 'Gagal mencabut sesi perangkat lain.');
      }
    });
  };

  const handleReportNotMe = () => {
    startTransition(async () => {
      setMessage(null);
      setErrorMessage(null);
      const res = await reportNotMeAction();
      if (res.ok) {
        router.push('/login');
      } else {
        setErrorMessage(res.error || 'Gagal mengunci akun.');
      }
    });
  };

  return (
    <div className="space-y-8 w-full animate-fade-up">
      {/* 1. HEADER WINDOW PERANGKAT & SESI */}
      <RetroWindow
        title="manajemen_perangkat_dan_sesi.app"
        badge={`${activeDevices.length} SESI AKTIF`}
        headerClassName="bg-retro-yellow"
        bodyClassName="p-6 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg border-[1.5px] border-retro-border bg-primary text-white shadow-xs">
                <Laptop className="h-5 w-5" />
              </div>
              <h1 className="font-heading font-black text-2xl tracking-tight text-foreground">
                Perangkat & Sesi Terdaftar
              </h1>
            </div>
            <p className="text-xs text-muted-foreground max-w-2xl mt-1">
              Pantau seluruh perangkat yang saat ini masuk ke akun Anda. Anda dapat mencabut sesi perangkat yang tidak dikenal
              atau mencabut seluruh sesi lain sekaligus demi menjaga keamanan akun.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-retro-border bg-retro-warm px-3 py-1 text-xs font-mono font-bold text-foreground">
              Proteksi Aktif
            </span>
          </div>
        </div>

        {/* Banner Pesan Umpan Balik */}
        {message && (
          <div role="status" className="mt-4 animate-fade-up rounded-lg border-[1.5px] border-retro-border bg-retro-mint p-3 text-xs text-black font-bold flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="h-4 w-4 text-black shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {errorMessage && (
          <div role="alert" className="mt-4 animate-fade-up rounded-lg border-[1.5px] border-retro-border bg-danger text-white p-3 text-xs font-bold flex items-center gap-2 shadow-xs">
            <ShieldAlert className="h-4 w-4 text-white shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </RetroWindow>

      {/* 2. DAFTAR PERANGKAT AKTIF */}
      <RetroWindow
        title={`perangkat_aktif.list (${activeDevices.length})`}
        headerClassName="bg-retro-warm"
        bodyClassName="p-5 space-y-4"
        actions={
          activeDevices.length > 1 ? (
            <button
              type="button"
              onClick={() => setConfirmOthers(true)}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded border border-retro-border bg-retro-surface hover:bg-danger/10 text-danger text-xs font-bold transition-all shadow-xs"
            >
              <LogOut className="h-3 w-3" />
              <span>Cabut Sesi Lain</span>
            </button>
          ) : undefined
        }
      >
        {confirmOthers && (
          <div className="animate-fade-up p-3.5 rounded-lg border-[1.5px] border-retro-border bg-retro-yellow/20 space-y-2">
            <p className="text-xs font-bold text-foreground">
              {activeDevices.length - 1} perangkat lain akan keluar seketika. Perangkat yang sedang Anda gunakan tetap aktif. Lanjutkan?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRevokeOthers}
                disabled={isPending}
                className="px-3 py-1 rounded border border-retro-border bg-danger text-white text-xs font-bold shadow-xs hover:brightness-105"
              >
                Ya, Cabut Semua
              </button>
              <button
                type="button"
                onClick={() => setConfirmOthers(false)}
                className="px-3 py-1 rounded border border-retro-border bg-retro-surface text-foreground text-xs font-bold shadow-xs hover:bg-retro-warm"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeDevices.length === 0 ? (
            <p className="col-span-full text-xs text-muted-foreground py-4 text-center border border-dashed border-retro-border rounded">
              Tidak ada perangkat aktif terdata.
            </p>
          ) : (
            activeDevices.map((dev) => {
              const isMobile =
                dev.label.toLowerCase().includes('android') ||
                dev.label.toLowerCase().includes('ios') ||
                dev.label.toLowerCase().includes('iphone');
              const Icon = isMobile ? Smartphone : Laptop;

              return (
                <div
                  key={dev.id}
                  className={`p-4 rounded-lg border-[1.5px] border-retro-border bg-retro-surface shadow-retro flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                    dev.isCurrent ? 'bg-retro-warm/30' : ''
                  } ${leaving.includes(dev.id) ? 'opacity-40 pointer-events-none' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg border border-retro-border bg-retro-warm text-foreground shrink-0 mt-0.5">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-sm text-foreground">{dev.label}</span>
                        {dev.isCurrent && (
                          <span className="text-xs font-mono font-bold bg-retro-mint text-black border border-retro-border px-2 py-0.5 rounded shadow-xs">
                            Perangkat Ini
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                        {dev.last_city ? `${dev.last_city}, ${dev.last_country ?? ''}` : 'Lokasi Terdaftar'} &bull; IP: {dev.last_ip_masked ?? 'Internal'}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        Terakhir aktif: {new Date(dev.last_seen_at).toLocaleString('id-ID')} WIB
                      </p>
                    </div>
                  </div>

                  {!dev.isCurrent && (
                    <div className="w-full sm:w-auto flex justify-end">
                      {confirmId !== dev.id ? (
                        <button
                          type="button"
                          onClick={() => setConfirmId(dev.id)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-retro-border bg-retro-surface hover:bg-danger/10 text-danger text-xs font-bold shadow-xs transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Cabut Sesi</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 p-1 rounded bg-retro-warm border border-retro-border">
                          <button
                            type="button"
                            onClick={() => handleRevokeSingle(dev.id)}
                            disabled={isPending}
                            className="px-2.5 py-1 rounded bg-danger text-white text-xs font-bold shadow-xs"
                          >
                            Ya, Cabut
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmId(null)}
                            className="px-2.5 py-1 rounded bg-retro-surface text-foreground text-xs font-bold"
                          >
                            Batal
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </RetroWindow>

      {/* 3. ZONA TANGGAP DARURAT */}
      <RetroWindow
        title="zona_tanggap_darurat_keamanan.alert"
        badge="DARURAT"
        headerClassName="bg-retro-pink"
        bodyClassName="p-5 space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg border border-retro-border bg-danger text-white shrink-0 mt-0.5">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h2 className="font-heading font-black text-sm text-foreground">
              Aktivitas Tidak Dikenal atau Akun Diretas?
            </h2>
            <p className="text-xs text-muted-foreground">
              Jika Anda mendapati adanya aktivitas mencurigakan dari lokasi yang tidak Anda kenal,
              segera gunakan tombol tindakan darurat untuk mengunci akun seketika dan mencabut semua akses.
            </p>
          </div>
        </div>

        {!showConfirmNotMe ? (
          <button
            type="button"
            onClick={() => setShowConfirmNotMe(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-[1.5px] border-retro-border bg-danger text-white text-xs font-bold shadow-retro hover:brightness-105 transition-all"
          >
            <Lock className="h-4 w-4" />
            <span>Ini Bukan Saya (Kunci Akun & Cabut Semua Sesi)</span>
          </button>
        ) : (
          <div className="p-4 rounded-lg border-[1.5px] border-retro-border bg-danger/10 space-y-3 animate-fade-up">
            <p className="text-xs font-bold text-foreground">
              Peringatan: Seluruh sesi aktif pada semua perangkat akan langsung dihentikan seketika,
              akun Anda akan dikunci sementara, dan Anda diwajibkan mengatur ulang kata sandi saat login berikutnya.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReportNotMe}
                disabled={isPending}
                className="px-4 py-1.5 rounded-lg border border-retro-border bg-danger text-white text-xs font-bold shadow-retro hover:brightness-105"
              >
                {isPending ? 'Mengamankan...' : 'Ya, Amankan Akun Sekarang'}
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmNotMe(false)}
                disabled={isPending}
                className="px-4 py-1.5 rounded-lg border border-retro-border bg-retro-surface text-foreground text-xs font-bold shadow-retro hover:bg-retro-warm"
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </RetroWindow>

      {/* 4. RIWAYAT SESI DICABUT */}
      {revokedDevices.length > 0 && (
        <RetroWindow
          title={`riwayat_sesi_dicabut.log (${revokedDevices.length})`}
          headerClassName="bg-retro-warm"
          bodyClassName="p-4 space-y-2"
        >
          <div className="divide-y divide-retro-border/30 border border-retro-border rounded-lg bg-retro-surface overflow-hidden">
            {revokedDevices.map((dev) => (
              <div
                key={dev.id}
                className="p-3 flex items-center justify-between text-xs text-muted-foreground hover:bg-retro-warm/20"
              >
                <div>
                  <span className="font-bold text-foreground">{dev.label}</span>
                  <span className="mx-2">&bull;</span>
                  <span>{dev.last_city || 'Lokasi Terdaftar'} ({dev.last_ip_masked})</span>
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-retro-warm border border-retro-border text-danger">
                  Sesi Berakhir
                </span>
              </div>
            ))}
          </div>
        </RetroWindow>
      )}
    </div>
  );
}
