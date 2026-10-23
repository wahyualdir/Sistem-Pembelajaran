'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Download,
  Maximize2,
  Minimize2,
  X,
  ZoomIn,
  ZoomOut,
  Sun,
  Moon,
  Coffee,
  Printer,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MarkdownViewer } from '@/components/shared/markdown-viewer';

export interface RetroDocViewerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  authorOrDate?: string;
  docUrl?: string | null;
  markdownContent?: string | null;
  fileType?: 'pdf' | 'markdown' | 'text';
}

export function RetroDocViewer({
  isOpen,
  onClose,
  title,
  authorOrDate,
  docUrl,
  markdownContent,
  fileType = 'markdown',
}: RetroDocViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [readingTheme, setReadingTheme] = useState<'retro' | 'sepia' | 'dark'>('retro');

  if (!isOpen) return null;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 15, 175));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 15, 70));

  const handlePrint = () => {
    window.print();
  };

  const isPdf = fileType === 'pdf' || (docUrl && docUrl.toLowerCase().includes('.pdf'));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Pembaca Dokumen: ${title}`}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs transition-all animate-fade-in font-sans',
        isFullscreen ? 'p-0' : ''
      )}
    >
      <div
        className={cn(
          'w-full border-2 border-ink rounded-2xl shadow-retro overflow-hidden flex flex-col transition-all duration-300',
          isFullscreen
            ? 'h-full w-full rounded-none border-0'
            : 'max-w-4xl h-[90vh] max-h-[860px]',
          readingTheme === 'retro'
            ? 'bg-surface text-ink'
            : readingTheme === 'sepia'
            ? 'bg-amber-50 text-amber-950'
            : 'bg-neutral-900 text-white'
        )}
      >
        {/* ======================================================== */}
        {/* 1. RETRO VIEWER TOOLBAR                                  */}
        {/* ======================================================== */}
        <div
          className={cn(
            'flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b-2 border-ink select-none shrink-0',
            readingTheme === 'retro'
              ? 'bg-gray-soft'
              : readingTheme === 'sepia'
              ? 'bg-amber-100 border-amber-900'
              : 'bg-neutral-800 border-white/20'
          )}
        >
          {/* Judul & Info Dokumen */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                'h-8 w-8 rounded-lg border-2 border-ink flex items-center justify-center shrink-0 shadow-retro-xs',
                readingTheme === 'dark' ? 'bg-white text-ink' : 'bg-ink text-white'
              )}
            >
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-black text-xs sm:text-sm truncate leading-tight">
                {title}
              </h3>
              {authorOrDate && (
                <span className="text-[10px] font-mono opacity-70 block truncate">
                  {authorOrDate} &bull; SIAJAR Reader
                </span>
              )}
            </div>
          </div>

          {/* Action Toolbar Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0">
            {/* Reading Mode Switcher (Light / Sepia / Dark) */}
            <div className="flex items-center rounded-lg border border-ink overflow-hidden p-0.5 bg-surface text-ink">
              <button
                type="button"
                onClick={() => setReadingTheme('retro')}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  readingTheme === 'retro' ? 'bg-ink text-white' : 'hover:bg-gray-soft'
                )}
                title="Mode Normal (Retro White)"
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setReadingTheme('sepia')}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  readingTheme === 'sepia' ? 'bg-amber-700 text-white' : 'hover:bg-gray-soft'
                )}
                title="Mode Sepia (Nyaman untuk Mata)"
              >
                <Coffee className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setReadingTheme('dark')}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  readingTheme === 'dark' ? 'bg-ink text-white' : 'hover:bg-gray-soft'
                )}
                title="Mode Malam (Dark Mode)"
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Zoom Controls */}
            {!isPdf && (
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg border border-ink bg-surface text-ink font-mono text-xs font-bold">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="hover:opacity-70 p-0.5"
                  title="Perkecil Teks"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="w-10 text-center">{zoomLevel}%</span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="hover:opacity-70 p-0.5"
                  title="Perbesar Teks"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 rounded-lg border border-ink bg-surface hover:bg-gray-soft text-ink shadow-2xs transition-colors cursor-pointer"
              title="Cetak Dokumen"
            >
              <Printer className="h-4 w-4" />
            </button>

            {/* Download Link if docUrl exists */}
            {docUrl && (
              <a
                href={docUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg border border-ink bg-surface hover:bg-gray-soft text-ink shadow-2xs transition-colors cursor-pointer"
                title="Unduh Salinan Dokumen"
              >
                <Download className="h-4 w-4" />
              </a>
            )}

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg border border-ink bg-surface hover:bg-gray-soft text-ink shadow-2xs transition-colors cursor-pointer"
              title={isFullscreen ? 'Kecilkan Jendela' : 'Layar Penuh'}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg border-2 border-ink bg-primary text-white hover:bg-primary-dark shadow-2xs transition-colors cursor-pointer"
              title="Tutup Pembaca Dokumen"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. AREA BACA KONTEN (PDF IFRAME ATAU FORMATTED MARKDOWN) */}
        {/* ======================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 relative">
          {isPdf && docUrl ? (
            /* PDF In-Browser Embed */
            <div className="w-full h-full min-h-[500px] rounded-xl border border-ink/30 overflow-hidden bg-white shadow-inner">
              <iframe
                src={`${docUrl}#toolbar=1&navpanes=0`}
                title={title}
                className="w-full h-full border-0 min-h-[550px]"
              />
            </div>
          ) : (
            /* Rich Text / Markdown Reading Container with Zoom */
            <div
              className="max-w-3xl mx-auto transition-transform origin-top space-y-4"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
            >
              <div className="border-b pb-4 mb-6">
                <h1 className="font-heading font-black text-xl sm:text-2xl tracking-tight leading-snug">
                  {title}
                </h1>
                <p className="text-xs opacity-75 mt-1 font-mono">
                  Materi Resmi Perkuliahan &bull; Universitas Islam Riau
                </p>
              </div>

              {markdownContent ? (
                <div className="text-sm leading-relaxed prose max-w-none">
                  <MarkdownViewer content={markdownContent} />
                </div>
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-ink/30 rounded-2xl">
                  <FileText className="h-10 w-10 mx-auto opacity-50 mb-2" />
                  <p className="text-sm font-bold">Konten dokumen tidak memiliki format teks.</p>
                  {docUrl && (
                    <a
                      href={docUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 mt-4 rounded-xl border-2 border-ink bg-ink text-white font-bold text-xs"
                    >
                      <span>Buka File Dokumen Asli</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 3. RETRO FOOTER STATUS                                   */}
        {/* ======================================================== */}
        <div
          className={cn(
            'flex items-center justify-between px-4 sm:px-5 py-2 border-t-2 border-ink text-xs shrink-0 select-none font-mono font-medium',
            readingTheme === 'retro'
              ? 'bg-gray-soft text-ink'
              : readingTheme === 'sepia'
              ? 'bg-amber-100 text-amber-900 border-amber-900'
              : 'bg-neutral-800 text-white border-white/20'
          )}
        >
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
            <span>Mode Baca Web Terpadu (In-Browser Document Reader)</span>
          </div>
          <span className="text-[11px] opacity-75">
            Tekan Esc atau tombol X untuk keluar
          </span>
        </div>
      </div>
    </div>
  );
}
