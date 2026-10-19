'use client';

import React, { useState, useRef, useEffect, useTransition } from 'react';
import Link from 'next/link';
import {
  Bot,
  Send,
  BookOpen,
  Sparkles,
  HelpCircle,
  Clock,
  ExternalLink,
  ShieldAlert,
  GraduationCap,
  RotateCcw,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { MarkdownViewer } from '@/components/shared/markdown-viewer';
import { askAiAcademicAssistantAction } from '@/modules/academic/ai-actions';
import { cn } from '@/lib/utils';

interface ClassOption {
  id: string;
  title: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
  citations?: Array<{ title: string; meeting: string | number; url: string }>;
  isExamBlocked?: boolean;
}

interface AiAssistantPageViewProps {
  enrolledClasses: ClassOption[];
  initialHistory?: any[];
}

export function AiAssistantPageView({ enrolledClasses, initialHistory = [] }: AiAssistantPageViewProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (initialHistory.length > 0) {
      return initialHistory.map((h, i) => ({
        id: h.id || `hist-${i}`,
        sender: h.sender,
        text: h.text,
        time: new Date(h.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        citations: h.citations,
      }));
    }
    return [
      {
        id: 'welcome',
        sender: 'ai',
        text: 'Halo! Saya **SIAJAR AI Academic Assistant** 🤖.\n\nSaya telah mengindeks seluruh materi, silabus, dan modul perkuliahan yang Anda ikuti. Silakan pilih kelas spesifik atau mode umum, lalu tanyakan hal apa pun seputar materi kuliah Anda!',
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPending]);

  const handleSend = (textToSend?: string) => {
    const q = (textToSend ?? input).trim();
    if (!q || isPending) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: q,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    startTransition(async () => {
      const historyPayload = messages.slice(-4).map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.text,
      }));

      const res = await askAiAcademicAssistantAction(q, historyPayload, selectedClassId);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.ok && res.response ? res.response : 'Maaf, terjadi kendala saat memproses jawaban.',
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        citations: res.citations,
        isExamBlocked: res.isExamBlocked,
      };

      setMessages((prev) => [...prev, aiMsg]);
    });
  };

  const samplePrompts = [
    'Jelaskan konsep REST API dan solusi error CORS',
    'Apa keunggulan Next.js Server Components dibanding CSR?',
    'Berapa syarat persentase kehadiran minimal UAS?',
    'Jelaskan materi caching dan replikasi database',
  ];

  return (
    <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0">
      <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
        {/* 1. HEADER BERANDA STYLE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-0.5">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-ink flex items-center gap-2.5">
              <Bot className="h-6 w-6 sm:h-7 sm:w-7 text-primary inline-block" />
              Tanya AI Akademik SIAJAR
            </h1>
            <p className="text-xs sm:text-sm text-gray-dark font-bold">
              Asisten belajar cerdas yang menjawab pertanyaan berdasarkan materi, silabus, dan modul resmi kelas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="p-2 sm:p-2.5 rounded-xl border-2 border-ink bg-surface shadow-retro space-y-1 min-w-[220px]">
              <label className="text-[10px] font-bold text-gray-dark uppercase tracking-wider block">
                Konteks Materi Kuliah:
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full text-xs font-bold text-ink bg-transparent outline-none cursor-pointer"
              >
                <option value="ALL">Semua Kelas Terdaftar (Umum)</option>
                {enrolledClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-gray-soft border-2 border-ink text-ink shadow-xs">
              AI ACTIVE (RAG)
            </span>
          </div>
        </div>

        {/* 2. CHAT STREAM RETRO CONTAINER */}
        <div className="rounded-xl border-2 border-ink bg-surface shadow-retro overflow-hidden flex flex-col h-[650px]">
          {/* Sub-header status bar */}
          <div className="p-3 bg-gray-soft border-b-2 border-ink flex items-center justify-between text-xs font-bold text-ink">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              Mode Grounding RAG: Menjawab hanya dari materi kelas resmi (Anti-Halusinasi)
            </span>
            <span className="text-xs text-gray-dark">
              Proteksi Ujian Aktif Otomatis
            </span>
          </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                'flex flex-col',
                m.sender === 'user' ? 'items-end' : 'items-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl p-4 shadow-sm space-y-2',
                  m.sender === 'user'
                    ? 'border-2 border-black bg-primary text-white rounded-br-none'
                    : m.isExamBlocked
                    ? 'border-2 border-primary bg-primary text-white rounded-bl-none'
                    : 'border-2 border-black bg-surface text-ink rounded-bl-none shadow-retro-sm'
                )}
              >
                {m.sender === 'user' ? (
                  <p className="whitespace-pre-wrap font-medium">{m.text}</p>
                ) : (
                  <MarkdownViewer content={m.text} className="text-xs sm:text-sm leading-relaxed" />
                )}

                {/* Pill Rujukan Materi */}
                {m.citations && m.citations.length > 0 && (
                  <div className="pt-2 border-t border-black/15 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-dark uppercase">
                      Rujukan Resmi:
                    </span>
                    {m.citations.map((c, i) => (
                      <Link
                        key={i}
                        href={c.url}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-black bg-gray-soft text-xs font-bold text-ink hover:underline"
                      >
                        <BookOpen className="h-3 w-3 text-primary" />
                        <span>{c.title} (Pertemuan {c.meeting})</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <span className="mt-1 text-xs font-sans text-gray-dark px-1">
                {m.time}
              </span>
            </div>
          ))}

          {isPending && (
            <div className="flex items-center gap-2 p-3 rounded-2xl border-2 border-black bg-gray-soft text-xs font-bold text-ink w-fit animate-pulse">
              <Bot className="h-4 w-4 animate-spin text-primary" />
              <span>AI sedang menelusuri modul kelas dan merumuskan jawaban...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick Suggestions Chips */}
        <div className="p-3 bg-gray-soft/50 border-t border-black/20 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-xs font-bold text-gray-dark uppercase shrink-0">
            Saran Cepat:
          </span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(p)}
              disabled={isPending}
              className="px-3 py-1 rounded-full border border-black bg-surface text-xs font-medium text-ink hover:bg-ink hover:text-white transition-all shrink-0 cursor-pointer shadow-xs"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 sm:p-4 bg-surface border-t-2 border-black flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanyakan materi perkuliahan, kode praktikum, atau aturan akademik..."
            disabled={isPending}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-black text-xs sm:text-sm font-medium text-ink focus:outline-none"
          />
          <button
            type="submit"
            disabled={isPending || !input.trim()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-black bg-primary text-white font-bold text-xs sm:text-sm shadow-retro-sm hover:bg-primary-dark disabled:opacity-50 transition-all shrink-0 cursor-pointer"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Kirim</span>
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}
