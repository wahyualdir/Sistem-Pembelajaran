'use client';

import { WindowTrafficLights } from '@/components/retro/window-traffic-lights';
import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { changePasswordAction } from '@/modules/identity/actions';
import { KeyRound, ShieldAlert, ArrowRight } from 'lucide-react';

export default function MustChangePasswordPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setFieldErrors({});

    startTransition(async () => {
      const res = await changePasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (!res.ok) {
        setErrorMessage(res.error || 'Gagal mengubah kata sandi.');
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
      } else if (res.redirectTo) {
        router.push(res.redirectTo);
        router.refresh();
      }
    });
  };

  return (
    <div className="min-h-[100dvh] bg-retro-bg font-sans text-foreground selection:bg-ink selection:text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Retro Window Card */}
        <div className="rounded-xl border-[1.5px] border-retro-border bg-retro-surface shadow-retro-lg overflow-hidden transition-all">
          {/* Header Bar Jendela Retro */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b-[1.5px] border-retro-border bg-gray-soft/80">
            <div className="flex items-center gap-2">
              <WindowTrafficLights size="sm" />
              <span className="text-xs font-sans font-bold text-muted-foreground ml-2">
                ruangkampus://keamanan.ganti-sandi
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-retro-border bg-white p-1 shadow-retro shrink-0 overflow-hidden">
                <img
                  src="/logo-ruangkampus.png"
                  alt="Logo RuangKampus"
                  className="h-full w-full object-contain [image-rendering:-webkit-optimize-contrast]"
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-heading font-black text-base tracking-tight text-foreground leading-tight">
                  Ruang<span style={{ color: '#ED1C24' }} className="text-[#ED1C24]">Kampus</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                  Keamanan Akun
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" />
                <h1 className="text-xl font-heading font-bold text-foreground">
                  Perbarui Kata Sandi Anda
                </h1>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Demi keamanan akun Anda, sistem mewajibkan pembaruan kata sandi awal sebelum Anda dapat mengakses layanan RuangKampus.
              </p>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="rounded-lg border-[1.5px] border-retro-border bg-gray-soft p-3 text-xs text-black shadow-retro flex items-start gap-2.5"
              >
                <ShieldAlert className="h-4 w-4 shrink-0 text-primary-dark mt-0.5" />
                <div className="flex-1 font-bold">{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold font-sans uppercase tracking-wider text-foreground block">
                  Kata Sandi Sementara / Saat Ini
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isPending}
                  required
                  className="w-full rounded-lg border-[1.5px] border-retro-border bg-retro-surface px-3.5 py-2 text-sm font-semibold text-foreground shadow-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-black transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold font-sans uppercase tracking-wider text-foreground block">
                  Kata Sandi Baru
                </label>
                <input
                  type="password"
                  placeholder="Minimal 10 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isPending}
                  required
                  className="w-full rounded-lg border-[1.5px] border-retro-border bg-retro-surface px-3.5 py-2 text-sm font-semibold text-foreground shadow-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-black transition-all"
                />
                {fieldErrors.newPassword && (
                  <p className="text-xs font-bold text-primary-dark">{fieldErrors.newPassword[0]}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold font-sans uppercase tracking-wider text-foreground block">
                  Konfirmasi Kata Sandi Baru
                </label>
                <input
                  type="password"
                  placeholder="Ulangi kata sandi baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isPending}
                  required
                  className="w-full rounded-lg border-[1.5px] border-retro-border bg-retro-surface px-3.5 py-2 text-sm font-semibold text-foreground shadow-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-black transition-all"
                />
                {fieldErrors.confirmPassword && (
                  <p className="text-xs font-bold text-primary-dark">{fieldErrors.confirmPassword[0]}</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-2.5 px-4 rounded-lg border-[1.5px] border-retro-border bg-primary text-white font-heading font-bold text-sm shadow-retro-md hover:brightness-105 active:translate-x-0.5 active:translate-y-0.5 transition-all focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    'Menyimpan...'
                  ) : (
                    <>
                      <span>Simpan & Masuk</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
