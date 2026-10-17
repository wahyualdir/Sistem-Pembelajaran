'use client';

import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileDown,
  Send,
  Loader2,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import {
  type StudentRequestItem,
  type RequestType,
  createStudentRequestAction,
} from './actions';

interface RequestsViewProps {
  initialRequests: StudentRequestItem[];
}

const TYPE_LABELS: Record<RequestType, string> = {
  surat_aktif: 'Surat Keterangan Aktif',
  dispensasi: 'Surat Dispensasi Kuliah',
  cuti: 'Cuti Akademik',
  legalisir: 'Legalisasi Dokumen',
};

const STATUS_BADGES: Record<
  string,
  { label: string; bg: string; text: string; icon: any }
> = {
  MENUNGGU: {
    label: 'Menunggu',
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    icon: Clock,
  },
  DIPROSES: {
    label: 'Diproses',
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    icon: AlertCircle,
  },
  DISETUJUI: {
    label: 'Disetujui',
    bg: 'bg-green-100',
    text: 'text-green-800',
    icon: CheckCircle2,
  },
  DITOLAK: {
    label: 'Ditolak',
    bg: 'bg-red-100',
    text: 'text-red-800',
    icon: XCircle,
  },
};

export function RequestsView({ initialRequests }: RequestsViewProps) {
  const [requests, setRequests] = useState<StudentRequestItem[]>(initialRequests);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    type: RequestType;
    purpose: string;
    notes: string;
  }>({
    type: 'surat_aktif',
    purpose: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const res = await createStudentRequestAction(formData);
      if (!res.ok) {
        setFormError(res.error);
      } else if (res.data) {
        setRequests((prev) => [res.data!, ...prev]);
        setIsFormOpen(false);
        setFormData({ type: 'surat_aktif', purpose: '', notes: '' });
      }
    } catch (err: any) {
      setFormError(err?.message || 'Gagal mengirim pengajuan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const approvedCount = requests.filter((r) => r.status === 'DISETUJUI').length;
  const pendingCount = requests.filter(
    (r) => r.status === 'MENUNGGU' || r.status === 'DIPROSES'
  ).length;

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. RETRO HEADER */}
      <RetroWindow
        title="Pengajuan Surat Akademik"
        badge="Layanan Mandiri Mahasiswa"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg border-2 border-black bg-primary text-white shadow-xs">
                <FileText className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight text-foreground">
                Pengajuan
              </h1>
            </div>
            <p className="text-sm sm:text-base text-black font-medium max-w-3xl leading-relaxed">
              Layanan permohonan surat keterangan aktif kuliah, dispensasi kegiatan, cuti semester, dan legalisasi dokumen transkrip secara mandiri.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsFormOpen((prev) => !prev)}
            className="px-4 py-2.5 rounded-lg border-2 border-black bg-black text-white font-sans font-bold text-xs sm:text-sm hover:bg-neutral-800 transition-all flex items-center gap-2 shadow-retro shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{isFormOpen ? 'Tutup Formulir' : 'Buat Pengajuan Baru'}</span>
          </button>
        </div>
      </RetroWindow>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="rounded-xl border-2 border-black bg-white p-5 shadow-retro space-y-1">
          <span className="text-xs font-sans font-bold uppercase text-muted-foreground">Total Pengajuan</span>
          <p className="text-2xl font-bold font-heading text-black">{requests.length}</p>
          <span className="text-xs text-muted-foreground">Semua jenis permohonan surat</span>
        </div>
        <div className="rounded-xl border-2 border-black bg-white p-5 shadow-retro space-y-1">
          <span className="text-xs font-sans font-bold uppercase text-muted-foreground">Menunggu Verifikasi</span>
          <p className="text-2xl font-bold font-heading text-black">{pendingCount}</p>
          <span className="text-xs text-muted-foreground">Dalam antrean staf akademik</span>
        </div>
        <div className="rounded-xl border-2 border-black bg-white p-5 shadow-retro space-y-1">
          <span className="text-xs font-sans font-bold uppercase text-muted-foreground">Selesai Disetujui</span>
          <p className="text-2xl font-bold font-heading text-black">{approvedCount}</p>
          <span className="text-xs text-muted-foreground">Surat siap diunduh</span>
        </div>
      </div>

      {/* 3. FORM PENGAJUAN BARU */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-5 animate-fade-in"
        >
          <div className="border-b-2 border-black pb-3">
            <h2 className="font-heading font-bold text-lg text-black">Formulir Permohonan Dokumen</h2>
            <p className="text-xs text-black/70 mt-0.5">
              Isi data permohonan dengan benar. Staf akademik akan memverifikasi berkas dalam 1-3 hari kerja.
            </p>
          </div>

          {formError && (
            <div className="p-3 rounded-lg border-2 border-black bg-red-100 text-red-900 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-black uppercase">Jenis Surat</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as RequestType })}
                className="w-full rounded-lg border-2 border-black bg-surface px-3 py-2 text-sm font-bold text-black focus:outline-none"
              >
                <option value="surat_aktif">Surat Keterangan Aktif Kuliah</option>
                <option value="dispensasi">Surat Dispensasi Kuliah</option>
                <option value="cuti">Permohonan Cuti Akademik</option>
                <option value="legalisir">Legalisasi Transkrip Nilai</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-black uppercase">Keperluan Pengajuan</label>
              <input
                type="text"
                required
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="Contoh: Pengajuan beasiswa, magang MBKM, lomba..."
                className="w-full rounded-lg border-2 border-black bg-surface px-3 py-2 text-sm font-bold text-black placeholder:font-medium placeholder:text-neutral-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-black uppercase">Catatan Tambahan (Opsional)</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Keterangan tambahan atau nomor surat rujukan jika ada..."
              className="w-full rounded-lg border-2 border-black bg-surface px-3 py-2 text-sm font-bold text-black placeholder:font-medium placeholder:text-neutral-400 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 rounded-lg border-2 border-black bg-surface text-black font-bold text-xs hover:bg-gray-soft transition-all"
            >
              Batalkan
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg border-2 border-black bg-black text-white font-bold text-xs hover:bg-neutral-800 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mengirim...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Kirim Pengajuan</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* 4. DAFTAR RIWAYAT PENGAJUAN */}
      <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
        <div className="p-4 sm:p-5 border-b-2 border-black bg-gray-soft flex items-center justify-between">
          <h2 className="font-heading font-bold text-base text-black">Riwayat Pengajuan Surat</h2>
          <span className="text-xs font-bold text-black/60">{requests.length} Berkas Tercatat</span>
        </div>

        {requests.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
            <h3 className="font-bold text-base text-foreground">Belum Ada Pengajuan</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Anda belum memiliki riwayat pengajuan surat akademik. Tekan tombol &quot;Buat Pengajuan Baru&quot; untuk mengajukan permohonan.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans">
              <thead className="border-b-2 border-black bg-neutral-100 font-bold uppercase text-xs text-black tracking-wide">
                <tr>
                  <th className="py-3.5 px-4">JENIS SURAT</th>
                  <th className="py-3.5 px-4">KEPERLUAN</th>
                  <th className="py-3.5 px-4">TANGGAL</th>
                  <th className="py-3.5 px-4 text-center">STATUS</th>
                  <th className="py-3.5 px-4 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/10 font-medium">
                {requests.map((r) => {
                  const badge = STATUS_BADGES[r.status] || STATUS_BADGES.MENUNGGU;
                  const Icon = badge.icon;
                  const dateStr = new Date(r.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr key={r.id} className="hover:bg-gray-soft/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-black block">{TYPE_LABELS[r.type]}</span>
                        <span className="text-2xs text-muted-foreground font-mono">ID: {r.id}</span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-xs text-black font-semibold truncate">{r.details.purpose}</p>
                        {r.staff_note && (
                          <p className="text-2xs text-black/70 mt-0.5 italic">Catatan Staf: {r.staff_note}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-black/80 whitespace-nowrap">{dateStr}</td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-black text-xs font-bold ${badge.bg} ${badge.text}`}
                        >
                          <Icon className="h-3 w-3" />
                          <span>{badge.label}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {r.status === 'DISETUJUI' ? (
                          <a
                            href={r.result_path || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-black bg-surface hover:bg-gray-soft text-xs font-bold text-black shadow-xs transition-all"
                          >
                            <FileDown className="h-3.5 w-3.5" />
                            <span>Unduh Surat</span>
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Menunggu verifikasi</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
