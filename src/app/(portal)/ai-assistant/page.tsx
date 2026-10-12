import React from 'react';
import Link from 'next/link';
import {
  Bot,
  Send,
  BookOpen,
  HelpCircle,
  FileText,
  Lightbulb,
  Code2,
  BrainCircuit,
  GraduationCap,
  ArrowRight,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';

const CAPABILITIES = [
  {
    title: 'Context-Aware RAG Silabus',
    desc: 'Memahami dokumen slide, PDF modul, dan silabus mata kuliah yang Anda ikuti secara terpadu.',
    icon: BookOpen,
    badge: 'Konteks Kurikulum',
    color: 'bg-retro-warm',
  },
  {
    title: 'Code Review & Debugging',
    desc: 'Membantu analisis error kode Java, JavaScript, Python, atau query SQL dengan penjelasan langkah demi langkah.',
    icon: Code2,
    badge: 'Judge0 & IDE Support',
    color: 'bg-retro-yellow/40',
  },
  {
    title: 'Auto Practice Quiz Generator',
    desc: 'Menghasilkan simulasi soal ujian pilihan ganda dan esai berdasarkan pertemuan kuliah terakhir.',
    icon: BrainCircuit,
    badge: 'Evaluasi Mandiri',
    color: 'bg-retro-mint/40',
  },
];

const PROMPTS = [
  'Ringkas materi Pemrograman Web Lanjut Pertemuan 7 tentang Next.js App Router',
  'Buat 3 soal latihan kuis pilihan ganda untuk materi Rekayasa Perangkat Lunak',
  'Jelaskan perbedaan konkurensi vs paralelisme dengan contoh program nyata',
  'Bantu review draf solusi algoritma Dijkstra untuk tugas Struktur Data',
];

export default function AiAssistantPage() {
  return (
    <div className="p-6 sm:p-9 w-full space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW AI */}
      <RetroWindow
        title="tanya_ai_siajar.app"
        badge="AI MODEL: ACTIVE (LLM-RAG)"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-6 sm:p-8 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-lg border-2 border-retro-border bg-retro-orange text-white shadow-xs">
                <Bot className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-foreground">
                Tanya AI Akademik SIAJAR
              </h1>
            </div>
            <p className="text-base sm:text-lg text-black font-medium max-w-2xl mt-1 leading-relaxed">
              Asisten kecerdasan buatan cerdas yang memahami konteks seluruh mata kuliah, materi perkuliahan, dan modul praktikum Anda untuk memfasilitasi pembelajaran mandiri.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border-2 border-black bg-white px-4 py-1.5 text-sm sm:text-base font-mono font-black text-black shadow-xs">
              Semester Ganjil 2026/2027
            </span>
          </div>
        </div>
      </RetroWindow>

      {/* 2. FITUR UTAMA DALAM 3 KARTU RESPONSIVE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {CAPABILITIES.map((cap) => {
          const Icon = cap.icon;
          return (
            <div
              key={cap.title}
              className={`p-6 rounded-xl border-2 border-black ${cap.color} shadow-retro space-y-3 hover:-translate-y-0.5 hover:shadow-retro-md transition-all`}
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg border-2 border-black bg-white">
                  <Icon className="h-6 w-6 text-retro-orange" />
                </div>
                <span className="px-3 py-1 rounded border-2 border-black bg-white text-xs font-mono font-black text-black shadow-xs">
                  {cap.badge}
                </span>
              </div>
              <h3 className="font-heading font-black text-lg sm:text-xl text-black">{cap.title}</h3>
              <p className="text-sm sm:text-base text-black font-medium leading-relaxed">{cap.desc}</p>
            </div>
          );
        })}
      </div>

      {/* 3. INTERACTIVE CHAT CARD WINDOW FULL */}
      <RetroWindow
        title="sesi_tanya_jawab_interaktif.terminal"
        headerClassName="bg-retro-warm"
        bodyClassName="p-6 sm:p-8 space-y-6"
      >
        <div className="space-y-3">
          <h2 className="font-heading font-black text-base uppercase tracking-wider text-black flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-retro-orange" />
            <span>Pertanyaan Rekomendasi Cepat:</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                className="text-left p-4 rounded-lg border-2 border-black bg-white hover:bg-retro-yellow text-sm sm:text-base font-bold text-black transition-colors shadow-retro"
              >
                &ldquo;{p}&rdquo; &rarr;
              </button>
            ))}
          </div>
        </div>

        <div className="p-8 rounded-xl border-2 border-black bg-retro-warm/20 min-h-[220px] flex flex-col justify-center items-center text-center space-y-3">
          <div className="p-4 rounded-full border-2 border-black bg-white shadow-retro">
            <Bot className="h-12 w-12 text-black" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-heading font-black text-xl sm:text-2xl text-black">
              Halo! Saya Asisten AI Akademik SIAJAR.
            </h3>
            <p className="text-base sm:text-lg text-black font-medium max-w-lg leading-relaxed">
              Ketik pertanyaan seputar silabus, tugas, modul praktikum, atau konsultasi materi perkuliahan apa pun. Saya siap memberikan penjelasan terstruktur.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Ketik pertanyaan materi perkuliahan Anda di sini..."
            className="flex-1 px-5 py-3.5 rounded-lg border-2 border-black bg-white text-base font-bold text-black shadow-retro focus:outline-none focus:ring-2 focus:ring-black placeholder:text-black/60"
          />
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg border-2 border-black bg-retro-yellow text-black font-heading font-black text-base shadow-retro hover:bg-black hover:text-white transition-all shrink-0"
          >
            <Send className="h-5 w-5" />
            <span>Kirim Pertanyaan</span>
          </button>
        </div>
      </RetroWindow>
    </div>
  );
}
