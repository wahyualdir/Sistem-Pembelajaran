'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, Mail, Flame } from 'lucide-react';

export default function ResetPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      // Simulasi pengiriman reset password
      await new Promise((resolve) => setTimeout(resolve, 600));
      setIsSubmitted(true);
    });
  };

  return (
    <div className="min-h-[100dvh] bg-retro-bg font-sans text-foreground selection:bg-ink selection:text-black flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mb-4">
          <Link
            href="/login"
            className="text-xs text-foreground hover:text-primary-dark flex items-center gap-1.5 font-bold px-2 py-1 rounded bg-gray-soft border border-retro-border/60 shadow-xs w-fit transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Halaman Masuk
          </Link>
        </div>

        {/* Retro Window Card */}
        <div className="rounded-xl border-[1.5px] border-retro-border bg-retro-surface shadow-retro-lg overflow-hidden transition-all">
          {/* Header Bar Jendela Retro */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b-[1.5px] border-retro-border bg-gray-soft/80">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border border-black/80 bg-primary shadow-retro-sm" />
              <span className="h-3 w-3 rounded-full border border-black/80 bg-gray shadow-retro-sm" />
              <span className="h-3 w-3 rounded-full border border-black/80 bg-gray-dark shadow-retro-sm" />
              <span className="text-xs font-sans font-bold text-muted-foreground ml-2">
                siajar://reset-password
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border-[1.5px] border-retro-border bg-primary text-white shadow-retro">
                <Flame className="h-5 w-5 fill-white" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-heading font-bold text-sm tracking-tight text-foreground leading-tight">
                  SIAJAR
                </span>
                <span className="text-xs text-muted-foreground font-sans">
                  Pemulihan Akun
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <h1 className="text-xl font-heading font-bold text-foreground">
                Pemulihan Kata Sandi
              </h1>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Masukkan email terdaftar atau nomor induk Anda. Instruksi pemulihan akan dikirimkan ke email resmi kampus Anda.
              </p>
            </div>

            {isSubmitted ? (
              <div className="rounded-lg border-[1.5px] border-retro-border bg-retro-mint p-4 text-xs text-foreground space-y-2 shadow-retro">
                <div className="flex items-center gap-2 font-bold text-black">
                  <CheckCircle2 className="h-4 w-4 text-ink" />
                  Instruksi Pemulihan Dikirim
                </div>
                <p className="text-black/80">
                  Jika identifier yang Anda masukkan terdaftar, tautan pengaturan ulang kata sandi telah dikirimkan. Tautan hanya berlaku 15 menit.
                </p>
                <div className="pt-2">
                  <Link href="/login" className="block">
                    <Button variant="outline" size="sm" className="w-full text-xs font-bold border-retro-border bg-retro-surface hover:bg-gray-soft shadow-xs">
                      Kembali ke Login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold font-sans uppercase tracking-wider text-foreground block">
                    Email / NIM / NIDN
                  </label>
                  <input
                    type="text"
                    placeholder="nama@siajar.ac.id atau 2024001"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    disabled={isPending}
                    required
                    className="w-full rounded-lg border-[1.5px] border-retro-border bg-retro-surface px-3.5 py-2.5 text-sm font-semibold text-foreground shadow-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-black transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-2.5 px-4 rounded-lg border-[1.5px] border-retro-border bg-primary text-white font-heading font-bold text-sm shadow-retro-md hover:brightness-105 active:translate-x-0.5 active:translate-y-0.5 transition-all focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  <span>{isPending ? 'Mengirim...' : 'Kirim Tautan Pemulihan'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
