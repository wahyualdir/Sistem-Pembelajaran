'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { changePasswordAction } from '@/modules/identity/actions';
import { KeyRound, ShieldAlert, ArrowRight, Flame } from 'lucide-react';

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
    <div className="min-h-[100dvh] bg-retro-bg font-sans text-foreground selection:bg-retro-yellow selection:text-black flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Retro Window Card */}
        <div className="rounded-xl border-[1.5px] border-retro-border bg-retro-surface shadow-retro-lg overflow-hidden transition-all">
          {/* Header Bar Jendela Retro */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b-[1.5px] border-retro-border bg-retro-warm/80">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border border-black/80 bg-traffic-red shadow-retro-sm" />
              <span className="h-3 w-3 rounded-full border border-black/80 bg-traffic-yellow shadow-retro-sm" />
              <span className="h-3 w-3 rounded-full border border-black/80 bg-traffic-green shadow-retro-sm" />
              <span className="text-xs font-mono font-bold text-muted-foreground ml-2">
                siajar://keamanan.ganti-sandi
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border-[1.5px] border-retro-border bg-retro-orange text-white shadow-retro">
                <Flame className="h-5 w-5 fill-white" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-heading font-black text-sm tracking-tight text-foreground leading-tight">
                  SIAJAR
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  Keamanan Akun
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-retro-orange" />
                <h1 className="text-xl font-heading font-black text-foreground">
                  Perbarui Kata Sandi Anda
                </h1>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Demi keamanan akun Anda, sistem mewajibkan pembaruan kata sandi awal sebelum Anda dapat mengakses layanan SIAJAR.
              </p>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="rounded-lg border-[1.5px] border-retro-border bg-retro-pink p-3 text-xs text-black shadow-retro flex items-start gap-2.5"
              >
                <ShieldAlert className="h-4 w-4 shrink-0 text-danger mt-0.5" />
                <div className="flex-1 font-bold">{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold font-mono uppercase tracking-wider text-foreground block">
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
                <label className="text-xs font-bold font-mono uppercase tracking-wider text-foreground block">
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
                  <p className="text-xs font-bold text-danger">{fieldErrors.newPassword[0]}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold font-mono uppercase tracking-wider text-foreground block">
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
                  <p className="text-xs font-bold text-danger">{fieldErrors.confirmPassword[0]}</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-2.5 px-4 rounded-lg border-[1.5px] border-retro-border bg-retro-orange text-white font-heading font-black text-sm shadow-retro-md hover:brightness-105 active:translate-x-0.5 active:translate-y-0.5 transition-all focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
