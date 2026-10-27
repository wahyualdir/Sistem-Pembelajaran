'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home, ShieldAlert } from 'lucide-react';
import { TechBackground } from '@/components/ui/tech-background';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error terpusat untuk keperluan audit dan monitoring sistem
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 bg-[#FAF8F5] text-[#1C1917] font-sans antialiased relative selection:bg-[#C2553A] selection:text-white">
      <TechBackground />
      <div className="max-w-md w-full bg-[#FFFFFF] border border-[#D6D3CB] rounded-3xl p-6 sm:p-8 shadow-md text-center space-y-5 relative overflow-hidden z-10">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-[#DC2626]" />

        <div className="h-12 w-12 rounded-2xl bg-[#FEF2F2] border border-[#DC2626]/20 text-[#DC2626] flex items-center justify-center mx-auto shadow-2xs">
          <ShieldAlert className="h-6 w-6" />
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#991B1B] bg-[#FEF2F2] px-2.5 py-1 rounded-full border border-[#DC2626]/20">
            Terjadi Kendala Sistem
          </span>
          <h1 className="text-xl sm:text-2xl font-heading font-black text-[#1C1917] tracking-tight">
            Gagal Memuat Halaman
          </h1>
          <p className="text-xs text-[#57534E] font-medium leading-relaxed max-w-xs mx-auto">
            Sistem mendeteksi galat sementara saat memproses sesi perkuliahan Anda. Silakan coba muat ulang atau kembali ke beranda.
          </p>
        </div>

        {error.digest && (
          <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E5DE] text-[11px] font-mono text-[#7A756D] break-all">
            Kode Galat: {error.digest}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:flex-1 h-11 px-4 rounded-xl bg-[#C2553A] hover:bg-[#853827] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Coba Lagi</span>
          </button>

          <Link
            href="/"
            className="w-full sm:flex-1 h-11 px-4 rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-xs font-bold text-[#1C1917] flex items-center justify-center gap-2 transition-all shadow-2xs"
          >
            <Home className="h-3.5 w-3.5 text-[#7A756D]" />
            <span>Beranda</span>
          </Link>
        </div>

        <div className="pt-2 border-t border-[#E8E5DE] text-[11px] text-[#7A756D]">
          RuangKampus · Teknik Informatika Universitas Islam Riau
        </div>
      </div>
    </div>
  );
}
