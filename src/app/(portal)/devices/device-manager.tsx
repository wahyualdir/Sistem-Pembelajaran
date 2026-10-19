'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  revokeDeviceAction,
  revokeOtherSessionsAction,
  reportNotMeAction,
} from '@/modules/identity/actions';
import {
  Laptop,
  Smartphone,
  ShieldAlert,
  AlertTriangle,
  LogOut,
  CheckCircle2,
  Trash2,
  Lock,
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
    <div className="space-y-5 sm:space-y-6">
      {/* Banner Pesan Umpan Balik */}
      {message && (
        <div role="status" className="p-3.5 rounded-xl border-2 border-ink bg-surface text-ink text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {errorMessage && (
        <div role="alert" className="p-3.5 rounded-xl border-2 border-ink bg-primary text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs">
          <ShieldAlert className="h-4 w-4 text-white shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. DAFTAR PERANGKAT AKTIF */}
      <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-ink/20 pb-3">
          <div className="space-y-0.5">
            <h2 className="font-heading font-bold text-base sm:text-lg text-ink flex items-center gap-2">
              <Laptop className="h-5 w-5 text-primary" />
              <span>Perangkat & Sesi Terdaftar</span>
            </h2>
            <p className="text-xs text-gray-dark font-bold">
              {activeDevices.length} sesi aktif saat ini. Anda dapat mencabut sesi perangkat yang tidak dikenal.
            </p>
          </div>

          {activeDevices.length > 1 && (
            <button
              type="button"
              onClick={() => setConfirmOthers(true)}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-ink bg-surface hover:bg-gray-soft text-ink text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 text-primary" />
              <span>Cabut Sesi Lain</span>
            </button>
          )}
        </div>

        {confirmOthers && (
          <div className="p-3.5 rounded-xl border-2 border-ink bg-gray-soft/40 space-y-2">
            <p className="text-xs font-bold text-ink font-sans">
              {activeDevices.length - 1} perangkat lain akan keluar seketika. Perangkat yang sedang Anda gunakan tetap aktif. Lanjutkan?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRevokeOthers}
                disabled={isPending}
                className="px-3 py-1 rounded-lg border-2 border-ink bg-primary text-white text-xs font-bold shadow-xs hover:brightness-105 cursor-pointer"
              >
                Ya, Cabut Semua
              </button>
              <button
                type="button"
                onClick={() => setConfirmOthers(false)}
                className="px-3 py-1 rounded-lg border-2 border-ink bg-surface text-ink text-xs font-bold shadow-xs hover:bg-gray-soft cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {activeDevices.length === 0 ? (
            <p className="col-span-full text-xs text-gray-dark font-bold py-6 text-center border-2 border-dashed border-ink/30 rounded-xl">
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
                  className={`p-4 rounded-xl border-2 border-ink bg-surface shadow-retro-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                    dev.isCurrent ? 'bg-gray-soft/20' : ''
                  } ${leaving.includes(dev.id) ? 'opacity-40 pointer-events-none' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg border-2 border-ink bg-gray-soft text-ink shrink-0 mt-0.5">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-sm text-ink">{dev.label}</span>
                        {dev.isCurrent && (
                          <span className="text-[11px] font-sans font-bold bg-surface text-ink border-2 border-ink px-2 py-0.5 rounded-full shadow-xs">
                            Perangkat Ini
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-dark font-bold mt-0.5 font-sans">
                        {dev.last_city ? `${dev.last_city}, ${dev.last_country ?? ''}` : 'Lokasi Terdaftar'} &bull; IP: {dev.last_ip_masked ?? 'Internal'}
                      </p>
                      <p className="text-[11px] text-gray-dark font-sans mt-0.5 font-bold">
                        Terakhir aktif: {new Date(dev.last_seen_at).toLocaleString('id-ID')} WIB
                      </p>
                    </div>
                  </div>

                  {!dev.isCurrent && (
                    <div className="w-full sm:w-auto flex justify-end shrink-0">
                      {confirmId !== dev.id ? (
                        <button
                          type="button"
                          onClick={() => setConfirmId(dev.id)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-ink bg-surface hover:bg-gray-soft text-ink text-xs font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-primary" />
                          <span>Cabut Sesi</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 p-1 rounded-lg bg-gray-soft border-2 border-ink">
                          <button
                            type="button"
                            onClick={() => handleRevokeSingle(dev.id)}
                            disabled={isPending}
                            className="px-2.5 py-1 rounded border-2 border-ink bg-primary text-white text-xs font-bold shadow-xs cursor-pointer"
                          >
                            Ya
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmId(null)}
                            className="px-2.5 py-1 rounded bg-surface text-ink text-xs font-bold cursor-pointer"
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
      </div>

      {/* 2. ZONA TANGGAP DARURAT */}
      <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg border-2 border-ink bg-primary text-white shrink-0 mt-0.5">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-sm sm:text-base text-ink">
              Aktivitas Tidak Dikenal atau Akun Diretas?
            </h3>
            <p className="text-xs text-gray-dark font-bold font-sans">
              Jika Anda mendapati adanya aktivitas mencurigakan dari lokasi yang tidak Anda kenal,
              segera gunakan tombol tindakan darurat untuk mengunci akun seketika dan mencabut semua akses.
            </p>
          </div>
        </div>

        {!showConfirmNotMe ? (
          <button
            type="button"
            onClick={() => setShowConfirmNotMe(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-ink bg-primary text-white text-xs font-bold shadow-retro-sm hover:brightness-105 transition-all cursor-pointer font-heading"
          >
            <Lock className="h-4 w-4" />
            <span>Ini Bukan Saya (Kunci Akun & Cabut Semua Sesi)</span>
          </button>
        ) : (
          <div className="p-4 rounded-xl border-2 border-ink bg-primary/10 space-y-3">
            <p className="text-xs font-bold text-ink font-sans">
              Peringatan: Seluruh sesi aktif pada semua perangkat akan langsung dihentikan seketika,
              akun Anda akan dikunci sementara, dan Anda diwajibkan mengatur ulang kata sandi saat login berikutnya.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReportNotMe}
                disabled={isPending}
                className="px-4 py-2 rounded-lg border-2 border-ink bg-primary text-white text-xs font-bold shadow-retro-sm hover:brightness-105 cursor-pointer font-heading"
              >
                {isPending ? 'Mengamankan...' : 'Ya, Amankan Akun Sekarang'}
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmNotMe(false)}
                disabled={isPending}
                className="px-4 py-2 rounded-lg border-2 border-ink bg-surface text-ink text-xs font-bold shadow-retro-sm hover:bg-gray-soft cursor-pointer font-heading"
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. RIWAYAT SESI DICABUT */}
      {revokedDevices.length > 0 && (
        <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-3">
          <div className="flex items-center justify-between border-b-2 border-ink/20 pb-2.5">
            <h3 className="font-heading font-bold text-sm text-ink">
              Riwayat Sesi Dicabut ({revokedDevices.length})
            </h3>
          </div>

          <div className="divide-y-2 divide-ink/20 border-2 border-ink rounded-xl bg-surface overflow-hidden shadow-xs">
            {revokedDevices.map((dev) => (
              <div
                key={dev.id}
                className="p-3 flex items-center justify-between text-xs text-gray-dark font-sans font-bold hover:bg-gray-soft/30 transition-colors"
              >
                <div>
                  <span className="font-bold text-ink">{dev.label}</span>
                  <span className="mx-2">&bull;</span>
                  <span>{dev.last_city || 'Lokasi Terdaftar'} ({dev.last_ip_masked})</span>
                </div>
                <span className="font-sans text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-soft border-2 border-ink text-primary shadow-xs">
                  Sesi Berakhir
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
