'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  MessagesSquare,
  Search,
  Plus,
  Pin,
  Lock,
  CheckCircle2,
  Paperclip,
  Tag,
  AlertCircle,
  EyeOff,
  Clock,
  User,
  Shield,
  Award,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ForumTopic } from './forum-actions';
import {
  createForumTopicAction,
  moderateTopicAction,
} from './forum-actions';

interface ClassForumTabViewProps {
  classId: string;
  initialTopics: ForumTopic[];
  availableTags: string[];
  userRole: 'STUDENT' | 'LECTURER' | 'TEACHING_ASSISTANT';
  currentUserId: string;
}

export function ClassForumTabView({
  classId,
  initialTopics,
  availableTags,
  userRole,
  currentUserId,
}: ClassForumTabViewProps) {
  const [topics, setTopics] = useState<ForumTopic[]>(initialTopics);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newTagsStr, setNewTagsStr] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [formError, setFormError] = useState('');

  const isLecturerOrTa = userRole === 'LECTURER' || userRole === 'TEACHING_ASSISTANT';

  // Filter topics
  const filteredTopics = topics.filter((t) => {
    const matchesSearch =
      search.trim() === '' ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.body.toLowerCase().includes(search.toLowerCase()) ||
      t.author_name.toLowerCase().includes(search.toLowerCase());

    const matchesTag =
      selectedTag === 'all' || (t.tags && t.tags.includes(selectedTag));

    return matchesSearch && matchesTag;
  });

  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (newTitle.trim().length < 5) {
      setFormError('Judul topik minimal 5 karakter.');
      return;
    }
    if (newBody.trim().length < 10) {
      setFormError('Isi pesan topik minimal 10 karakter.');
      return;
    }

    const tagsArray = newTagsStr
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const attachments = attachmentName.trim()
      ? [
          {
            name: attachmentName.trim(),
            url: attachmentUrl.trim() || '#',
            size: 'Lampiran Berkas',
          },
        ]
      : [];

    startTransition(async () => {
      const res = await createForumTopicAction({
        classId,
        title: newTitle.trim(),
        body: newBody.trim(),
        tags: tagsArray,
        attachments,
      });

      if (!res.ok) {
        setFormError(res.error || 'Gagal membuat topik diskusi.');
      } else {
        setIsCreateOpen(false);
        setNewTitle('');
        setNewBody('');
        setNewTagsStr('');
        setAttachmentName('');
        setAttachmentUrl('');

        // Prepend ke list lokal
        const createdTopic: ForumTopic = {
          id: res.topicId!,
          class_id: classId,
          class_title: 'Kelas',
          author_id: currentUserId,
          author_name: 'Anda',
          author_role: userRole,
          title: newTitle.trim(),
          body: newBody.trim(),
          tags: tagsArray,
          attachments,
          is_pinned: false,
          is_locked: false,
          is_hidden: false,
          best_reply_id: null,
          reply_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setTopics((prev) => [createdTopic, ...prev]);
      }
    });
  };

  const handleTogglePin = (topicId: string, currentPin: boolean) => {
    startTransition(async () => {
      const res = await moderateTopicAction(topicId, 'pin', !currentPin);
      if (res.ok) {
        setTopics((prev) =>
          prev.map((t) => (t.id === topicId ? { ...t, is_pinned: !currentPin } : t))
        );
      }
    });
  };

  const handleToggleLock = (topicId: string, currentLock: boolean) => {
    startTransition(async () => {
      const res = await moderateTopicAction(topicId, 'lock', !currentLock);
      if (res.ok) {
        setTopics((prev) =>
          prev.map((t) => (t.id === topicId ? { ...t, is_locked: !currentLock } : t))
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER & ACTIONS BAR */}
      <div className="p-5 sm:p-6 rounded-2xl border-2 border-black bg-surface shadow-retro space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg border-2 border-black bg-primary text-white shadow-retro-sm">
              <MessagesSquare className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg sm:text-xl text-ink">
                Forum Diskusi Kelas
              </h2>
              <p className="text-xs sm:text-sm text-gray-dark font-medium">
                Ruang tanya jawab, pemecahan kendala kode, dan klarifikasi materi antar mahasiswa, dosen, dan asisten.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateOpen(!isCreateOpen)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-black bg-ink text-white font-bold text-xs sm:text-sm shadow-retro hover:bg-gray-dark transition-all cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Topik Baru</span>
          </button>
        </div>

        {/* Form Modal / Inline Buat Topik */}
        {isCreateOpen && (
          <form
            onSubmit={handleCreateTopic}
            className="p-5 rounded-xl border-2 border-black bg-gray-soft/50 shadow-retro-sm space-y-4 animate-fade-up"
          >
            <div className="flex items-center justify-between border-b border-black/15 pb-2">
              <span className="font-heading font-bold text-sm text-ink flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Mulai Diskusi Baru
              </span>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-xs font-bold text-gray-dark hover:text-ink"
              >
                Batal
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg border-2 border-black bg-primary text-white text-xs font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-ink uppercase tracking-wide">
                Judul Pertanyaan / Topik <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Contoh: Mengapa pemanggilan fetch di Next.js Route Handler menghasilkan 404?"
                className="w-full px-3.5 py-2.5 rounded-lg border-2 border-black bg-surface text-xs sm:text-sm font-medium text-ink focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-ink uppercase tracking-wide">
                Isi Penjelasan Kendala / Diskusi <span className="text-primary">*</span>
              </label>
              <textarea
                rows={4}
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="Jelaskan secara rinci kode yang error, langkah yang telah dicoba, atau pertanyaan konsep..."
                className="w-full px-3.5 py-2.5 rounded-lg border-2 border-black bg-surface text-xs sm:text-sm font-medium text-ink focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink uppercase tracking-wide flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />
                  Tag Topik (Pisahkan koma)
                </label>
                <input
                  type="text"
                  value={newTagsStr}
                  onChange={(e) => setNewTagsStr(e.target.value)}
                  placeholder="nextjs, api, tugas-1"
                  className="w-full px-3.5 py-2 rounded-lg border-2 border-black bg-surface text-xs font-medium text-ink"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-ink uppercase tracking-wide flex items-center gap-1">
                  <Paperclip className="h-3.5 w-3.5" />
                  Lampiran Nama Berkas (Opsional)
                </label>
                <input
                  type="text"
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                  placeholder="screenshot-error.png atau snippet.ts"
                  className="w-full px-3.5 py-2 rounded-lg border-2 border-black bg-surface text-xs font-medium text-ink"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 rounded-lg border-2 border-black bg-surface text-xs font-bold text-ink hover:bg-gray-soft"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2 rounded-lg border-2 border-black bg-primary text-white text-xs font-bold shadow-retro-sm hover:bg-primary-dark disabled:opacity-50"
              >
                {isPending ? 'Menerbitkan...' : 'Terbitkan Topik'}
              </button>
            </div>
          </form>
        )}

        {/* 2. FILTER SEARCH & TAGS */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-dark" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari topik diskusi, pertanyaan, atau nama anggota..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border-2 border-black bg-surface text-xs font-medium text-ink focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setSelectedTag('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg border border-black text-xs font-bold shrink-0 transition-colors',
                selectedTag === 'all'
                  ? 'bg-ink text-white'
                  : 'bg-surface text-ink hover:bg-gray-soft'
              )}
            >
              Semua Tag
            </button>
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={cn(
                  'px-3 py-1.5 rounded-lg border border-black text-xs font-bold shrink-0 transition-colors',
                  selectedTag === tag
                    ? 'bg-ink text-white'
                    : 'bg-surface text-ink hover:bg-gray-soft'
                )}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. DAFTAR TOPIK DISKUSI */}
      <div className="space-y-3.5">
        {filteredTopics.length === 0 ? (
          <div className="p-10 rounded-2xl border-2 border-dashed border-black bg-surface text-center space-y-2">
            <MessagesSquare className="h-10 w-10 text-gray-dark mx-auto" />
            <p className="text-sm font-bold text-ink">Tidak Ada Topik Ditemukan</p>
            <p className="text-xs text-gray-dark max-w-md mx-auto">
              Belum ada topik diskusi yang cocok dengan filter atau pencarian Anda. Jadilah yang pertama memulai diskusi!
            </p>
          </div>
        ) : (
          filteredTopics.map((topic) => {
            const isBestAnswered = Boolean(topic.best_reply_id);

            return (
              <div
                key={topic.id}
                className={cn(
                  'p-5 rounded-xl border-2 border-black bg-surface shadow-retro hover:-translate-y-0.5 transition-all space-y-3',
                  topic.is_pinned && 'border-l-8 border-l-primary'
                )}
              >
                {/* Header Topik: Badge Status & Metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {topic.is_pinned && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded border border-black bg-ink text-white font-bold text-xs shadow-xs">
                        <Pin className="h-3 w-3 fill-white" />
                        Tersemat
                      </span>
                    )}

                    {topic.is_locked && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded border border-black bg-gray-soft text-ink font-bold text-xs">
                        <Lock className="h-3 w-3" />
                        Terkunci
                      </span>
                    )}

                    {isBestAnswered && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded border border-black bg-surface text-ink font-bold text-xs shadow-xs">
                        <CheckCircle2 className="h-3 w-3 text-ink" />
                        Solusi Terbaik Terjawab
                      </span>
                    )}

                    <span className="text-xs font-sans font-bold text-gray-dark">
                      Oleh{' '}
                      <strong className="text-ink">
                        {topic.author_name}
                      </strong>{' '}
                      ({topic.author_role === 'LECTURER' ? 'Dosen' : topic.author_role === 'TEACHING_ASSISTANT' ? 'Asdos' : 'Mahasiswa'})
                    </span>
                  </div>

                  <span className="text-xs text-gray-dark font-sans flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(topic.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {/* Konten Topik */}
                <div>
                  <Link
                    href={`/classes/${classId}/discussions/${topic.id}`}
                    className="font-heading font-bold text-base sm:text-lg text-ink hover:text-primary-dark transition-colors block"
                  >
                    {topic.title}
                  </Link>
                  <p className="text-xs sm:text-sm text-gray-dark mt-1 line-clamp-2 leading-relaxed font-medium">
                    {topic.body}
                  </p>
                </div>

                {/* Tags & Lampiran */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
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

                    {topic.attachments && topic.attachments.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-black bg-surface text-xs font-bold text-ink">
                        <Paperclip className="h-3 w-3 text-primary" />
                        {topic.attachments[0].name}
                      </span>
                    )}
                  </div>

                  {/* Actions & Balasan count */}
                  <div className="flex items-center gap-2">
                    {isLecturerOrTa && (
                      <div className="flex items-center gap-1 mr-2">
                        <button
                          type="button"
                          onClick={() => handleTogglePin(topic.id, topic.is_pinned)}
                          title={topic.is_pinned ? 'Lepas Sematan' : 'Sematkan Topik'}
                          className="p-1 rounded border border-black bg-surface text-ink hover:bg-gray-soft text-xs"
                        >
                          <Pin className={cn('h-3.5 w-3.5', topic.is_pinned && 'fill-ink')} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleLock(topic.id, topic.is_locked)}
                          title={topic.is_locked ? 'Buka Kunci' : 'Kunci Topik'}
                          className="p-1 rounded border border-black bg-surface text-ink hover:bg-gray-soft text-xs"
                        >
                          <Lock className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    <Link
                      href={`/classes/${classId}/discussions/${topic.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border-2 border-black bg-surface text-ink font-bold text-xs hover:bg-gray-soft shadow-retro-sm transition-all"
                    >
                      <MessagesSquare className="h-3.5 w-3.5" />
                      <span>{topic.reply_count} Balasan &rarr;</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
