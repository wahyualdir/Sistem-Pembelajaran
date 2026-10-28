'use client';

import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Search,
  Download,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import {
  StudentRequestItem,
  updateStudentRequestStatusAction,
} from '@/modules/requests/actions';

interface VerificationClientProps {
  initialRequests: StudentRequestItem[];
}

export function VerificationClient({ initialRequests }: VerificationClientProps) {
  const [requests, setRequests] = useState<StudentRequestItem[]>(initialRequests);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<StudentRequestItem | null>(null);
  const [staffNote, setStaffNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ ok?: boolean; text?: string } | null>(null);

  const filtered = requests.filter((r) => {
    const matchesFilter = activeFilter === 'ALL' || r.status === activeFilter;
    const matchesSearch =
      (r.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.student_nim || '').includes(search) ||
      (r.details?.purpose || '').toLowerCase().includes(search.toLowerCase()) ||
      r.type.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  async function handleUpdateStatus(status: 'DISETUJUI' | 'DITOLAK') {
    if (!selectedItem) return;
    setIsSubmitting(true);
    setFeedback(null);

    const regNumber = `SRT/UIR-TI/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
    const resultDoc = status === 'DISETUJUI' ? `/documents/legalisir-${selectedItem.id}.pdf` : null;

    const res = await updateStudentRequestStatusAction({
      id: selectedItem.id,
      status,
      staff_note: staffNote || (status === 'DISETUJUI' ? `Disetujui dengan nomor registrasi ${regNumber}.` : 'Pengajuan ditolak karena persyaratan belum lengkap.'),
      result_path: resultDoc,
    });

    setIsSubmitting(false);

    if (res.ok) {
      setFeedback({
        ok: true,
        text: `Pengajuan surat ${selectedItem.type.replace('_', ' ')} berhasil di-${status.toLowerCase()}.`,
      });
      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedItem.id
            ? {
                ...r,
                status,
                staff_note: staffNote || (status === 'DISETUJUI' ? `Disetujui (${regNumber})` : 'Ditolak'),
                result_path: resultDoc,
              }
            : r
        )
      );
      setSelectedItem(null);
      setStaffNote('');
      setFeedback(null);
    } else {
      setFeedback({ ok: false, text: res.error || 'Gagal memperbarui status pengajuan.' });
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-up font-sans">
      <RetroWindow
        title="Layanan & Verifikasi Pengajuan Masuk"
        badge="BAAK / STAF AKADEMIK"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 space-y-2 bg-white"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-black tracking-tight text-black flex items-center gap-3">
              <FileCheck className="h-7 w-7 text-black" />
              <span>Verifikasi Pengajuan Surat & Legalisasi</span>
            </h1>
            <p className="text-xs sm:text-sm text-black/75 font-medium max-w-3xl leading-relaxed">
              Verifikasi berkas permohonan surat aktif kuliah, dispensasi kegiatan, cuti akademik, dan legalisasi transkrip nilai dengan penomoran registrasi otomatis.
            </p>
          </div>
          <span className="px-4 py-2 rounded-xl border-2 border-black bg-white text-xs font-mono font-bold shadow-retro">
            Menunggu Verifikasi: <strong>{requests.filter((r) => r.status === 'MENUNGGU').length} Berkas</strong>
          </span>
        </div>
      </RetroWindow>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-black/60" />
          <input
            type="text"
            placeholder="Cari nama pemohon, NIM, keperluan surat…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border-2 border-black bg-white text-xs font-medium text-black focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all cursor-pointer ${
              activeFilter === 'ALL'
                ? 'border-black bg-black text-white shadow-retro-sm'
                : 'border-black/30 bg-white text-black hover:bg-gray-soft'
            }`}
          >
            Semua ({requests.length})
          </button>
          <button
            onClick={() => setActiveFilter('MENUNGGU')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all cursor-pointer ${
              activeFilter === 'MENUNGGU'
                ? 'border-black bg-black text-white shadow-retro-sm'
                : 'border-black/30 bg-white text-black hover:bg-gray-soft'
            }`}
          >
            Menunggu ({requests.filter((r) => r.status === 'MENUNGGU').length})
          </button>
          <button
            onClick={() => setActiveFilter('DISETUJUI')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all cursor-pointer ${
              activeFilter === 'DISETUJUI'
                ? 'border-black bg-black text-white shadow-retro-sm'
                : 'border-black/30 bg-white text-black hover:bg-gray-soft'
            }`}
          >
            Disetujui ({requests.filter((r) => r.status === 'DISETUJUI').length})
          </button>
          <button
            onClick={() => setActiveFilter('DITOLAK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all cursor-pointer ${
              activeFilter === 'DITOLAK'
                ? 'border-black bg-black text-white shadow-retro-sm'
                : 'border-black/30 bg-white text-black hover:bg-gray-soft'
            }`}
          >
            Ditolak ({requests.filter((r) => r.status === 'DITOLAK').length})
          </button>
        </div>
      </div>

      {/* Queue Items */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-black bg-white p-10 text-center space-y-3 shadow-retro">
            <CheckCircle2 className="h-10 w-10 text-black/40 mx-auto" />
            <h3 className="font-heading font-black text-base text-black">Tidak Ada Pengajuan Masuk</h3>
            <p className="text-xs text-black/70 max-w-md mx-auto font-medium">
              Seluruh permohonan administrasi mahasiswa telah ditinjau dan diverifikasi.
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border-2 border-black bg-white p-5 sm:p-6 shadow-retro flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase px-2.5 py-0.5 rounded border border-black bg-gray-soft text-black">
                    {item.type.replace('_', ' ')}
                  </span>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded border border-black ${
                      item.status === 'DISETUJUI'
                        ? 'bg-white text-black'
                        : item.status === 'DITOLAK'
                        ? 'bg-[#C2553A] text-white border-[#853827]'
                        : 'bg-black text-white'
                    }`}
                  >
                    {item.status}
                  </span>
                  <span className="text-xs text-black/60 font-mono">
                    Diajukan: {new Date(item.created_at).toLocaleDateString('id-ID')}
                  </span>
                </div>

                <div>
                  <h3 className="font-heading font-black text-base text-black">
                    {item.student_name || 'Mahasiswa'}{' '}
                    <span className="text-xs font-mono font-normal text-black/70">
                      ({item.student_nim || item.student_id})
                    </span>
                  </h3>
                  <p className="text-xs sm:text-sm text-black/80 font-medium mt-1 leading-relaxed">
                    <strong>Keperluan:</strong> {item.details?.purpose}
                  </p>
                </div>

                {item.staff_note && (
                  <p className="text-xs font-mono text-black bg-gray-soft/50 p-2 rounded border border-black/20">
                    <strong>Catatan Staf:</strong> {item.staff_note}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {item.attachment_path && (
                  <a
                    href={item.attachment_path}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-xl border-2 border-black bg-white hover:bg-gray-soft text-xs font-bold text-black flex items-center gap-1.5 transition-all cursor-pointer shadow-retro-sm"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Lihat Bukti</span>
                  </a>
                )}

                {item.result_path && (
                  <a
                    href={item.result_path}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-xl border-2 border-black bg-white hover:bg-gray-soft text-xs font-bold text-black flex items-center gap-1.5 transition-all cursor-pointer shadow-retro-sm"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Unduh Surat PDF</span>
                  </a>
                )}

                {item.status === 'MENUNGGU' && (
                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setStaffNote('');
                    }}
                    className="px-4 py-2 rounded-xl border-2 border-black bg-black text-white hover:bg-neutral-800 text-xs font-bold transition-all cursor-pointer shadow-retro"
                  >
                    Tindak Lanjut &rarr;
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Verifikasi / Putusan */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border-2 border-black bg-white p-6 shadow-retro space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <h3 className="font-heading font-black text-lg text-black">
                Verifikasi Pengajuan: {selectedItem.student_name}
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-black font-bold text-sm hover:opacity-70 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-xl border-2 text-xs font-bold ${
                  feedback.ok
                    ? 'border-black bg-gray-soft text-black'
                    : 'border-[#C2553A] bg-[#C2553A]/10 text-[#C2553A]'
                }`}
              >
                {feedback.text}
              </div>
            )}

            <div className="p-3 rounded-xl bg-gray-soft/50 border border-black/20 text-xs space-y-1">
              <p>
                <strong>Jenis:</strong> {selectedItem.type.replace('_', ' ').toUpperCase()}
              </p>
              <p>
                <strong>Keperluan:</strong> {selectedItem.details?.purpose}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block font-bold text-black">Catatan Verifikasi Staf</label>
              <textarea
                rows={3}
                placeholder="Tuliskan nomor registrasi surat, catatan persetujuan, atau alasan jika ditolak..."
                value={staffNote}
                onChange={(e) => setStaffNote(e.target.value)}
                className="w-full rounded-xl border-2 border-black bg-white p-2.5 font-medium text-black focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t-2 border-black/20">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-xl border-2 border-black bg-white font-bold text-xs text-black hover:bg-gray-soft cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleUpdateStatus('DITOLAK')}
                className="px-4 py-2 rounded-xl border-2 border-[#C2553A] bg-white text-[#C2553A] font-bold text-xs hover:bg-[#C2553A]/10 disabled:opacity-50 cursor-pointer shadow-retro-sm"
              >
                Tolak Pengajuan
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleUpdateStatus('DISETUJUI')}
                className="px-5 py-2 rounded-xl border-2 border-black bg-black text-white font-bold text-xs hover:bg-neutral-800 disabled:opacity-50 cursor-pointer shadow-retro"
              >
                {isSubmitting ? 'Menyimpan…' : 'Setujui & Terbitkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
