import React from 'react';
import Link from 'next/link';
import { MessageSquare, ArrowRight, UserCheck, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';

const FORUM_DISCUSSIONS = [
  {
    id: 'disc-1',
    course: 'Pemrograman Web Lanjut (TI-301)',
    title: 'Kendala CORS & Header Authorization pada endpoint /api/auth',
    askedBy: '2024018 - Rian Hidayat',
    time: '2 jam yang lalu',
    replyCount: 3,
    status: 'MENUNGGU TANGGAPAN ASISTEN',
    preview: 'Saya sudah menambahkan Access-Control-Allow-Origin: * di middleware tapi browser tetap melempar pesan Preflight missing. Apakah konfigurasi OPTIONS perlu di-override khusus?',
  },
  {
    id: 'disc-2',
    course: 'Algoritma & Pemrograman (TI-102)',
    title: 'Segmentation Fault pada pemanggilan free() di pointer linked list',
    askedBy: '2024032 - Dinda Kirana',
    time: '5 jam yang lalu',
    replyCount: 1,
    status: 'MENUNGGU TANGGAPAN ASISTEN',
    preview: 'Saat traversal node terakhir dan memanggil free(curr), program langsung crash di compiler GCC Ubuntu. Mohon petunjuk debugging dengan Valgrind.',
  },
  {
    id: 'disc-3',
    course: 'Praktikum Sistem Basis Data (TI-204)',
    title: 'Optimasi EXPLAIN ANALYZE kueri JOIN 3 tabel dengan composite index',
    askedBy: '2024005 - Kevin Pratama',
    time: 'Kemarin, 16:30 WIB',
    replyCount: 4,
    status: 'TERJAWAB SEBAGIAN',
    preview: 'Hasil execution time kueri transaksi masih menunjukkan Seq Scan di tabel orders meskipun indeks idx_orders_customer_date sudah dibuat.',
  },
];

export default function AssistantForumPage() {
  return (
    <div className="p-6 sm:p-9 w-full space-y-8 animate-fade-up">
      <RetroWindow
        title="moderasi_forum_asisten.app"
        subtitle="Jawab Pertanyaan & Moderasi Diskusi Kelas Praktikum"
        headerBadge="Mode Asisten"
        headerBadgeVariant="warning"
      >
        <div className="p-6 sm:p-8 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground flex items-center gap-3">
            <MessageSquare className="h-7 w-7 text-retro-orange" />
            <span>Jawab Forum Diskusi Praktikum</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-3xl leading-relaxed">
            Menjawab kendala teknis mahasiswa terkait instalasi tools praktikum, debugging kode eror, dan klarifikasi ketentuan tugas mingguan.
          </p>
        </div>
      </RetroWindow>

      {/* Grid Thread Forum Praktikum Full Width */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FORUM_DISCUSSIONS.map((d) => (
          <div
            key={d.id}
            className="rounded-xl border-2 border-black bg-white p-6 shadow-retro flex flex-col justify-between space-y-5 hover:-translate-y-0.5 transition-transform"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded border border-black bg-retro-warm truncate max-w-[200px]">
                  {d.course}
                </span>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                    d.status.includes('MENUNGGU')
                      ? 'bg-amber-100 text-amber-900 border-amber-400'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-400'
                  }`}
                >
                  {d.replyCount} Balasan
                </span>
              </div>

              <div>
                <h2 className="font-heading font-black text-base text-foreground leading-snug line-clamp-2">
                  {d.title}
                </h2>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 font-mono">
                  <UserCheck className="h-3.5 w-3.5 text-neutral-500" />
                  <span>{d.askedBy} · {d.time}</span>
                </p>
              </div>

              <p className="text-xs text-foreground/80 bg-neutral-50 p-3 rounded border border-neutral-200 line-clamp-3 leading-relaxed">
                &quot;{d.preview}&quot;
              </p>
            </div>

            <div className="pt-4 border-t-2 border-black/10 flex items-center justify-between">
              <span className="text-xs font-mono text-amber-800 font-bold">
                {d.status}
              </span>

              <Link
                href="/classes"
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg border-2 border-black bg-black text-white font-bold text-xs shadow-xs hover:bg-neutral-800 transition-all"
              >
                <span>Beri Jawaban</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
