import React from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  ArrowRight,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Pin,
  Lock,
  Tag,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { getTaForumThreadsAction } from '@/modules/academic/forum-actions';

export default async function AssistantForumPage() {
  const res = await getTaForumThreadsAction();
  const threads = res.threads || [];

  return (
    <div className="p-6 sm:p-9 w-full space-y-8 animate-fade-up">
      <RetroWindow
        title="Moderasi Forum Praktikum"
        badge="ROLE: ASISTEN DOSEN"
        headerClassName="bg-gray-soft"
        bodyClassName="p-6 sm:p-8 space-y-3"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-ink flex items-center gap-3">
              <MessageSquare className="h-7 w-7 text-primary" />
              <span>Jawab Forum Diskusi Praktikum</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-dark font-medium max-w-3xl leading-relaxed">
              Memantau pertanyaan teknis, kendala praktikum, dan klarifikasi tugas dari seluruh kelas asistensi. Gunakan data terintegrasi yang sama dengan forum kelas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg border-2 border-black bg-surface text-ink text-xs font-bold shadow-retro-sm">
              {threads.length} Topik Tersedia
            </span>
          </div>
        </div>
      </RetroWindow>

      {/* Grid Thread Forum Praktikum Full Width */}
      {threads.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border-2 border-dashed border-black bg-surface shadow-retro space-y-2">
          <MessageSquare className="h-10 w-10 text-gray-dark mx-auto" />
          <h3 className="text-base font-bold text-ink">Belum Ada Pertanyaan di Forum Praktikum</h3>
          <p className="text-xs text-gray-dark max-w-md mx-auto">
            Semua topik diskusi praktikum mahasiswa saat ini telah terjawab atau belum ada yang mengajukan pertanyaan baru.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {threads.map((d) => {
            const hasBestAnswer = Boolean(d.best_reply_id);
            const statusLabel = hasBestAnswer
              ? 'SOLUSI TERJAWAB'
              : d.reply_count === 0
              ? 'MENUNGGU TANGGAPAN'
              : 'SEDANG BERLANGSUNG';

            return (
              <div
                key={d.id}
                className="rounded-xl border-2 border-black bg-surface p-6 shadow-retro flex flex-col justify-between space-y-5 hover:-translate-y-0.5 transition-transform"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-sans text-xs font-bold px-2 py-0.5 rounded border border-black bg-gray-soft truncate max-w-[180px]">
                      {d.class_title}
                    </span>
                    <span
                      className={`text-xs font-sans font-bold px-2 py-0.5 rounded border ${
                        hasBestAnswer
                          ? 'bg-surface text-ink border-black'
                          : d.reply_count === 0
                          ? 'bg-primary text-white border-black'
                          : 'bg-gray-soft text-ink border-black'
                      }`}
                    >
                      {d.reply_count} Balasan
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      {d.is_pinned && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-ink text-white text-xs font-bold">
                          <Pin className="h-2.5 w-2.5 fill-white" />
                          Pin
                        </span>
                      )}
                      {d.is_locked && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-soft text-ink text-xs font-bold">
                          <Lock className="h-2.5 w-2.5" />
                          Kunci
                        </span>
                      )}
                    </div>
                    <h2 className="font-heading font-bold text-base text-ink leading-snug line-clamp-2">
                      {d.title}
                    </h2>
                    <p className="text-xs text-gray-dark mt-1 flex items-center gap-1.5 font-sans">
                      <UserCheck className="h-3.5 w-3.5 text-gray" />
                      <span>{d.author_name}</span>
                    </p>
                  </div>

                  <p className="text-xs text-ink bg-gray-soft/40 p-3 rounded border border-black/20 line-clamp-3 leading-relaxed font-medium">
                    &quot;{d.body}&quot;
                  </p>

                  {d.tags && d.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {d.tags.map((t) => (
                        <span key={t} className="text-xs font-bold px-1.5 py-0.5 bg-gray-soft border border-black/30 rounded text-ink">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t-2 border-black/10 flex items-center justify-between">
                  <span className="text-xs font-sans text-ink font-bold flex items-center gap-1">
                    {hasBestAnswer ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-ink" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 text-gray-dark" />
                    )}
                    <span>{statusLabel}</span>
                  </span>

                  <Link
                    href={`/classes/${d.class_id}/discussions/${d.id}`}
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg border-2 border-black bg-ink text-white font-bold text-xs shadow-xs hover:bg-gray-dark transition-all"
                  >
                    <span>Beri Jawaban</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
