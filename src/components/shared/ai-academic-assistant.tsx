'use client';

import React, { useState, useRef, useEffect, useTransition } from 'react';
import { Bot, X, Send, MessageSquare, ChevronDown } from 'lucide-react';
import { askAiAcademicAssistantAction } from '@/modules/academic/ai-actions';
import { MarkdownViewer } from './markdown-viewer';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

export function AiAcademicAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [pending, startTransition] = useTransition();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Halo! Saya **RuangKampus AI Academic Assistant** 🤖. Tanyakan apa saja tentang materi kuliah, aturan akademik, tugas, kuis, atau tips belajar Anda!',
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = (textToSend?: string) => {
    const q = (textToSend ?? input).trim();
    if (!q || pending) return;

    const userMsg: Message = {
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
      const res = await askAiAcademicAssistantAction(q, historyPayload);
      const aiReply = res.ok && res.response ? res.response : 'Maaf, terjadi gangguan saat memproses jawaban. Silakan coba lagi.';

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiReply,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    });
  };

  const suggestions = [
    'Syarat ikut ujian UAS?',
    'Aturan pengambilan SKS?',
    'Skala konversi nilai?',
    'Informasi tugas & kuis',
  ];

  return (
    <>
      {/* Floating launcher trigger */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="ai-assistant-btn fixed bottom-[calc(var(--mobile-nav-h,3.5rem)+env(safe-area-inset-bottom,0px)+0.75rem)] md:bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] right-[calc(1rem+env(safe-area-inset-right,0px))] sm:bottom-6 sm:right-6 z-40 flex items-center justify-center min-h-[44px] min-w-[44px] gap-2 sm:gap-2.5 rounded-full border-2 border-black bg-black px-3.5 py-2.5 sm:px-4 sm:py-3 text-white shadow-retro hover:bg-neutral-800 transition-all hover:scale-105 active:scale-95 group cursor-pointer"
          aria-label="Buka Asisten AI Akademik"
        >
          <div className="relative shrink-0 flex items-center justify-center">
            <Bot className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-white ring-2 ring-black" />
          </div>
          <span className="ai-assistant-btn-text text-xs font-bold tracking-wide text-white whitespace-nowrap">
            Tanya AI
          </span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-[calc(var(--mobile-nav-h,3.5rem)+env(safe-area-inset-bottom,0px)+0.75rem)] md:bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] right-[calc(1rem+env(safe-area-inset-right,0px))] sm:bottom-6 sm:right-6 z-50 flex h-[min(78dvh,32rem)] w-[calc(100vw-2rem)] sm:w-96 max-w-sm flex-col rounded-2xl border-2 border-ink bg-surface shadow-retro-window overflow-hidden animate-fade-up">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-ink bg-gray-soft px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-black bg-black text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-ink flex items-center gap-1.5">
                  RuangKampus AI Assistant
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </h3>
                <p className="text-xs text-gray-dark">Konsultasi & Panduan Akademik</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages scroll area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs ${
                    m.sender === 'user'
                      ? 'bg-black text-white rounded-br-none'
                      : 'border border-border bg-background text-foreground rounded-bl-none shadow-sm'
                  }`}
                >
                  {m.sender === 'user' ? (
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  ) : (
                    <MarkdownViewer content={m.text} className="text-xs leading-relaxed" />
                  )}
                </div>
                <span className="mt-1 text-xs text-muted-foreground px-1">{m.time}</span>
              </div>
            ))}

            {pending && (
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground w-fit">
                <Bot className="h-3.5 w-3.5 animate-spin text-black" />
                <span>AI sedang berpikir...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="border-t border-border bg-muted/30 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(s)}
                disabled={pending}
                className="shrink-0 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input field */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 border-t border-border bg-surface p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanyakan sesuatu ke AI..."
              disabled={pending}
              className="field !h-9 text-xs flex-1"
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-control bg-black text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
