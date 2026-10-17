'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  MessagesSquare,
  Pin,
  Lock,
  CheckCircle2,
  Paperclip,
  Clock,
  User,
  Shield,
  EyeOff,
  AlertTriangle,
  Award,
  Send,
  ArrowLeft,
  Sparkles,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ForumTopic, ForumReply } from './forum-actions';
import {
  replyForumTopicAction,
  markBestAnswerAction,
  moderateTopicAction,
  moderateReplyAction,
} from './forum-actions';

interface ForumThreadClientViewProps {
  topic: ForumTopic;
  initialReplies: ForumReply[];
  viewer: {
    userId: string;
    userName: string;
    role: 'STUDENT' | 'LECTURER' | 'TEACHING_ASSISTANT';
    isLecturer: boolean;
    isTa: boolean;
    isTopicAuthor: boolean;
  };
}

export function ForumThreadClientView({
  topic: initialTopic,
  initialReplies,
  viewer,
}: ForumThreadClientViewProps) {
  const [topic, setTopic] = useState<ForumTopic>(initialTopic);
  const [replies, setReplies] = useState<ForumReply[]>(initialReplies);
  const [replyBody, setReplyBody] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [isPending, startTransition] = useTransition();
  const [reportModalReplyId, setReportModalReplyId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');

  const isModerator = viewer.isLecturer || viewer.isTa;
  const canMarkBest = viewer.isTopicAuthor || viewer.isLecturer;

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;

    const attachments = attachmentName.trim()
      ? [{ name: attachmentName.trim(), url: '#', size: 'Lampiran' }]
      : [];

    startTransition(async () => {
      const res = await replyForumTopicAction({
        topicId: topic.id,
        body: replyBody.trim(),
        attachments,
      });

      if (res.ok) {
        const newRep: ForumReply = {
          id: res.replyId!,
          topic_id: topic.id,
          class_id: topic.class_id,
          author_id: viewer.userId,
          author_name: viewer.userName,
          author_role: viewer.role,
          body: replyBody.trim(),
          attachments,
          is_best_answer: false,
          is_hidden: false,
          created_at: new Date().toISOString(),
        };
        setReplies((prev) => [...prev, newRep]);
        setReplyBody('');
        setAttachmentName('');
        setTopic((prev) => ({ ...prev, reply_count: prev.reply_count + 1 }));
      }
    });
  };

  const handleToggleBest = (replyId: string) => {
    startTransition(async () => {
      const res = await markBestAnswerAction(topic.id, replyId);
      if (res.ok) {
        setReplies((prev) =>
          prev.map((r) => {
            if (r.id === replyId) return { ...r, is_best_answer: Boolean(res.isBestAnswer) };
            return { ...r, is_best_answer: false };
          })
        );
        setTopic((prev) => ({
          ...prev,
          best_reply_id: res.isBestAnswer ? replyId : null,
        }));
      }
    });
  };

  const handleToggleHideReply = (replyId: string) => {
    startTransition(async () => {
      const res = await moderateReplyAction(replyId, 'hide');
      if (res.ok) {
        setReplies((prev) =>
          prev.map((r) => (r.id === replyId ? { ...r, is_hidden: Boolean(res.isHidden) } : r))
        );
      }
    });
  };

  const handleReportReply = (replyId: string) => {
    if (!reportReason.trim()) return;

    startTransition(async () => {
      const res = await moderateReplyAction(replyId, 'report', reportReason.trim());
      if (res.ok) {
        setReplies((prev) =>
          prev.map((r) => (r.id === replyId ? { ...r, is_hidden: true, report_reason: reportReason } : r))
        );
        setReportModalReplyId(null);
        setReportReason('');
      }
    });
  };

  const handleTogglePin = () => {
    startTransition(async () => {
      const res = await moderateTopicAction(topic.id, 'pin', !topic.is_pinned);
      if (res.ok) {
        setTopic((prev) => ({ ...prev, is_pinned: !prev.is_pinned }));
      }
    });
  };

  const handleToggleLock = () => {
    startTransition(async () => {
      const res = await moderateTopicAction(topic.id, 'lock', !topic.is_locked);
      if (res.ok) {
        setTopic((prev) => ({ ...prev, is_locked: !prev.is_locked }));
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. NAVIGASI KEMBALI KE KELAS */}
      <div className="flex items-center justify-between">
        <Link
          href={`/classes/${topic.class_id}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-ink hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Forum Kelas ({topic.class_title})</span>
        </Link>

        {isModerator && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTogglePin}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border-2 border-black text-xs font-bold transition-all shadow-xs',
                topic.is_pinned ? 'bg-ink text-white' : 'bg-surface text-ink hover:bg-gray-soft'
              )}
            >
              <Pin className={cn('h-3.5 w-3.5', topic.is_pinned && 'fill-white')} />
              <span>{topic.is_pinned ? 'Tersemat' : 'Sematkan Topik'}</span>
            </button>
            <button
              type="button"
              onClick={handleToggleLock}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border-2 border-black text-xs font-bold transition-all shadow-xs',
                topic.is_locked ? 'bg-primary text-white' : 'bg-surface text-ink hover:bg-gray-soft'
              )}
            >
              <Lock className="h-3.5 w-3.5" />
              <span>{topic.is_locked ? 'Terkunci' : 'Kunci Topik'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. TOPIK UTAMA WINDOW */}
      <div className="p-6 sm:p-8 rounded-2xl border-2 border-black bg-surface shadow-retro space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full border-2 border-black bg-gray-soft text-ink font-bold text-sm flex items-center justify-center">
              {topic.author_name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="font-heading font-bold text-sm text-ink block">
                {topic.author_name}
              </span>
              <span className="text-xs text-gray-dark font-sans">
                {topic.author_role === 'LECTURER' ? 'Dosen Pengampu' : topic.author_role === 'TEACHING_ASSISTANT' ? 'Asisten Dosen' : 'Mahasiswa'} · {new Date(topic.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })} WIB
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {topic.is_pinned && (
              <span className="px-2.5 py-1 rounded border border-black bg-ink text-white font-bold text-xs">
                Tersemat
              </span>
            )}
            {topic.is_locked && (
              <span className="px-2.5 py-1 rounded border border-black bg-gray-soft text-ink font-bold text-xs">
                Terkunci
              </span>
            )}
          </div>
        </div>

        <h1 className="font-heading font-bold text-xl sm:text-2xl text-ink leading-snug">
          {topic.title}
        </h1>

        <p className="text-xs sm:text-sm text-ink font-medium leading-relaxed whitespace-pre-wrap">
          {topic.body}
        </p>

        {/* Tags & Lampiran Topik */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-black/10">
          <div className="flex flex-wrap items-center gap-1.5">
            {topic.tags &&
              topic.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded border border-black/40 bg-gray-soft text-xs font-bold text-ink"
                >
                  #{tag}
                </span>
              ))}
          </div>

          {topic.attachments && topic.attachments.length > 0 && (
            <div className="flex items-center gap-2">
              {topic.attachments.map((att, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border-2 border-black bg-gray-soft text-xs font-bold text-ink"
                >
                  <Paperclip className="h-3.5 w-3.5 text-primary" />
                  <span>{att.name}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. DAFTAR BALASAN THREAD */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-base sm:text-lg text-ink flex items-center gap-2">
            <MessagesSquare className="h-5 w-5 text-primary" />
            <span>Semua Tanggapan ({replies.length})</span>
          </h2>
        </div>

        {replies.length === 0 ? (
          <div className="p-8 rounded-xl border-2 border-dashed border-black bg-surface text-center space-y-2">
            <p className="text-sm font-bold text-ink">Belum Ada Balasan</p>
            <p className="text-xs text-gray-dark">
              Jadilah yang pertama memberikan solusi atau tanggapan untuk topik diskusi ini.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {replies.map((reply) => (
              <div
                key={reply.id}
                className={cn(
                  'p-5 rounded-xl border-2 border-black bg-surface shadow-retro space-y-3',
                  reply.is_best_answer && 'border-2 border-black bg-surface ring-2 ring-black'
                )}
              >
                {/* Header Balasan */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full border border-black bg-gray-soft font-bold text-xs flex items-center justify-center">
                      {reply.author_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-heading font-bold text-xs sm:text-sm text-ink block">
                        {reply.author_name}
                      </span>
                      <span className="text-xs text-gray-dark font-sans">
                        {reply.author_role === 'LECTURER' ? 'Dosen Pengampu' : reply.author_role === 'TEACHING_ASSISTANT' ? 'Asisten Dosen' : 'Mahasiswa'} · {new Date(reply.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {reply.is_best_answer && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-black bg-surface text-ink font-bold text-xs shadow-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 text-ink" />
                        Jawaban Terbaik
                      </span>
                    )}

                    {reply.is_hidden && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded border border-black bg-gray-soft text-ink font-bold text-xs">
                        <EyeOff className="h-3 w-3" />
                        Disembunyikan
                      </span>
                    )}
                  </div>
                </div>

                {/* Body Balasan */}
                <p className="text-xs sm:text-sm text-ink font-medium leading-relaxed whitespace-pre-wrap">
                  {reply.body}
                </p>

                {/* Lampiran pada Balasan */}
                {reply.attachments && reply.attachments.length > 0 && (
                  <div className="pt-1">
                    {reply.attachments.map((att, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded border border-black bg-gray-soft text-xs font-bold text-ink"
                      >
                        <Paperclip className="h-3 w-3 text-primary" />
                        {att.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Tombol Aksi Balasan: Best Answer & Moderasi */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/10">
                  <div>
                    {canMarkBest && (
                      <button
                        type="button"
                        onClick={() => handleToggleBest(reply.id)}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-black text-xs font-bold transition-all',
                          reply.is_best_answer
                            ? 'bg-ink text-white'
                            : 'bg-surface text-ink hover:bg-gray-soft'
                        )}
                      >
                        <Award className="h-3.5 w-3.5" />
                        <span>{reply.is_best_answer ? 'Batal Jawaban Terbaik' : 'Tandai Jawaban Terbaik'}</span>
                      </button>
                    )}
                  </div>

                  {isModerator && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleHideReply(reply.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-black bg-surface text-ink hover:bg-gray-soft text-xs font-bold"
                      >
                        <EyeOff className="h-3 w-3" />
                        <span>{reply.is_hidden ? 'Tampilkan' : 'Sembunyikan'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setReportModalReplyId(reply.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-black bg-primary text-white hover:bg-primary-dark text-xs font-bold"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        <span>Laporkan</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. FORM BALASAN */}
      {topic.is_locked && !isModerator ? (
        <div className="p-4 rounded-xl border-2 border-black bg-gray-soft text-center text-xs font-bold text-ink">
          Topik diskusi ini telah dikunci. Hanya dosen atau asisten yang dapat menambahkan balasan baru.
        </div>
      ) : (
        <form
          onSubmit={handleSendReply}
          className="p-5 sm:p-6 rounded-2xl border-2 border-black bg-surface shadow-retro space-y-4"
        >
          <h3 className="font-heading font-bold text-sm text-ink flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            <span>Tulis Tanggapan Anda</span>
          </h3>

          <textarea
            rows={3}
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="Ketik solusi, saran perbaikan kode, atau penjelasan materi di sini..."
            className="w-full px-4 py-3 rounded-xl border-2 border-black bg-surface text-xs sm:text-sm font-medium text-ink focus:outline-none"
            required
          />

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                placeholder="Lampiran berkas (contoh: patch.js atau screenshot.png)"
                className="w-full px-3 py-1.5 rounded-lg border border-black bg-surface text-xs font-medium text-ink"
              />
            </div>

            <button
              type="submit"
              disabled={isPending || !replyBody.trim()}
              className="inline-flex items-center justify-center gap-2 px-6 py-2 rounded-lg border-2 border-black bg-primary text-white font-bold text-xs sm:text-sm shadow-retro-sm hover:bg-primary-dark disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>{isPending ? 'Mengirim...' : 'Kirim Balasan'}</span>
            </button>
          </div>
        </form>
      )}

      {/* MODAL LAPOR MODERASI */}
      {reportModalReplyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border-2 border-black bg-surface p-6 shadow-retro-window space-y-4 animate-fade-up">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <AlertTriangle className="h-5 w-5" />
              <span>Laporkan Balasan ke Audit Trail Moderasi</span>
            </div>
            <p className="text-xs text-gray-dark leading-relaxed">
              Tindakan ini akan menyembunyikan postingan dari mahasiswa dan mencatat laporan resmi beserta identitas pelapor ke log audit institusi.
            </p>
            <textarea
              rows={3}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Tuliskan alasan pelanggaran (contoh: plagiarisme kode, bahasa tidak pantas, dll)..."
              className="w-full p-3 rounded-lg border-2 border-black text-xs font-medium text-ink"
              required
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportModalReplyId(null)}
                className="px-4 py-1.5 rounded border border-black text-xs font-bold text-ink hover:bg-gray-soft"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleReportReply(reportModalReplyId)}
                className="px-4 py-1.5 rounded border-2 border-black bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-dark"
              >
                Konfirmasi Laporan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
