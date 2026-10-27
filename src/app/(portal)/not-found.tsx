import React from 'react';
import Link from 'next/link';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import { TechBackground } from '@/components/ui/tech-background';

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 bg-[#FAF8F5] text-[#1C1917] font-sans antialiased relative selection:bg-[#C2553A] selection:text-white">
      <TechBackground />
      <div className="max-w-md w-full bg-[#FFFFFF] border border-[#D6D3CB] rounded-3xl p-6 sm:p-8 shadow-md text-center space-y-5 relative overflow-hidden z-10">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-[#C2553A]" />

        <div className="h-12 w-12 rounded-2xl bg-[#FEF2F0] border border-[#FDDDD7] text-[#C2553A] flex items-center justify-center mx-auto shadow-2xs">
          <Compass className="h-6 w-6" />
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#853827] bg-[#FEF2F0] px-2.5 py-1 rounded-full border border-[#FDDDD7]">
            Galat 404 · Rute Tidak Ditemukan
          </span>
          <h1 className="text-xl sm:text-2xl font-heading font-black text-[#1C1917] tracking-tight">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-xs text-[#57534E] font-medium leading-relaxed max-w-xs mx-auto">
            Tautan perkuliahan yang Anda tuju mungkin telah dipindahkan, tidak lagi aktif, atau memerlukan hak akses khusus.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <Link
            href="/"
            className="w-full sm:flex-1 h-11 px-4 rounded-xl bg-[#C2553A] hover:bg-[#853827] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Ke Beranda</span>
          </Link>

          <Link
            href="/login"
            className="w-full sm:flex-1 h-11 px-4 rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-xs font-bold text-[#1C1917] flex items-center justify-center gap-2 transition-all shadow-2xs"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#7A756D]" />
            <span>Masuk Akun</span>
          </Link>
        </div>

        <div className="pt-2 border-t border-[#E8E5DE] text-[11px] text-[#7A756D]">
          RuangKampus · Teknik Informatika Universitas Islam Riau
        </div>
      </div>
    </div>
  );
}
