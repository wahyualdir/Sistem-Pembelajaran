'use client';

import React, { useState, useTransition } from 'react';
import {
  FolderArchive,
  AlertTriangle,
  CheckCircle2,
  X,
  ShieldAlert
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { bulkArchiveSemesterAction } from './class-clone-actions';

interface StaffArchiveSemesterModalProps {
  activeCount: number;
}

export function StaffArchiveSemesterModal({ activeCount }: StaffArchiveSemesterModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState('Penutupan semester resmi akademik');
  const [message, setMessage] = useState<{ type: 'sukses' | 'galat'; text: string } | null>(null);

  const handleConfirm = () => {
    startTransition(async () => {
      setMessage(null);
      const res = await bulkArchiveSemesterAction('default-sem', reason);
      if (!res.ok) {
        setMessage({ type: 'galat', text: res.pesan || 'Gagal mengarsipkan kelas semester.' });
        return;
      }

      setMessage({ type: 'sukses', text: res.pesan });
      setTimeout(() => setIsOpen(false), 2000);
    });
  };

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          setMessage(null);
        }}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border-2 border-black bg-amber-500 text-black font-bold text-xs shadow-retro hover:bg-amber-400 transition-all"
      >
        <FolderArchive className="h-4 w-4" />
        <span>Tutup Semester</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg">
            <RetroWindow
              title="Tutup Semester & Arsipkan Kelas"
              badge="Administratif"
              headerBadgeVariant="warning"
              headerClassName="bg-gray-soft"
              bodyClassName="p-6 bg-white space-y-5"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2.5 text-black">
                  <ShieldAlert className="h-5 w-5 text-amber-600" />
                  <h3 className="font-bold text-lg">Konfirmasi Penutupan Semester</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-md hover:bg-neutral-100 text-black border border-black"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {message && (
                <div
                  className={`p-3 rounded-lg border-2 text-xs font-bold ${
                    message.type === 'sukses'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                      : 'border-red-600 bg-red-50 text-red-900'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tindakan ini akan mengarsipkan seluruh kelas aktif (<strong>{activeCount} kelas</strong>).
                  Setelah diarsipkan, kelas bersifat <strong>hanya-baca</strong> bagi Dosen, Asisten, dan Mahasiswa.
                  Mahasiswa tetap dapat melihat riwayat materi dan nilai selama 365 hari.
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-black block">Alasan Penutupan Semester:</label>
                  <textarea
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full text-xs font-medium border-2 border-black rounded-lg p-2.5 bg-white"
                    placeholder="Contoh: Akhir perkuliahan Semester Ganjil 2026/2027"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-lg border border-black bg-white text-black font-bold text-xs hover:bg-neutral-100"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isPending || !reason.trim()}
                  className="px-5 py-2 rounded-lg border-2 border-black bg-amber-500 text-black font-bold text-xs shadow-retro hover:bg-amber-400 transition-all disabled:opacity-50"
                >
                  {isPending ? 'Mengarsipkan...' : 'Arsipkan Semua Kelas'}
                </button>
              </div>
            </RetroWindow>
          </div>
        </div>
      )}
    </>
  );
}
