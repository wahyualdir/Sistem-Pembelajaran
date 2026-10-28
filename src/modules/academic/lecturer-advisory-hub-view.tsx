'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  MessageSquare,
  GraduationCap,
  Clock,
  Send,
  Eye,
  PlusCircle,
  Search,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { toast } from '@/components/ui/toast';
import type { StudentRiskEvaluation } from '@/modules/early-warning/types';
import type { AdviseeItem, PendingKrsItem, AdvisoryNoteItem } from './advisory-actions';
import {
  approveAdviseeKrsAction,
  rejectAdviseeKrsAction,
  addAdvisoryNoteAction,
} from './advisory-actions';

interface LecturerAdvisoryHubViewProps {
  advisees: AdviseeItem[];
  riskEvaluations: StudentRiskEvaluation[];
  pendingKrs: PendingKrsItem[];
  initialNotes?: Record<string, AdvisoryNoteItem[]>;
}

export function LecturerAdvisoryHubView({
  advisees = [],
  riskEvaluations = [],
  pendingKrs = [],
  initialNotes = {},
}: LecturerAdvisoryHubViewProps) {
  const [activeTab, setActiveTab] = useState<'bimbingan' | 'krs' | 'catatan'>('bimbingan');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState<'all' | 'at_risk' | 'safe'>('all');

  // State Persetujuan / Penolakan KRS
  const [krsQueue, setKrsQueue] = useState<PendingKrsItem[]>(pendingKrs);
  const [krsRejectModal, setKrsRejectModal] = useState<PendingKrsItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  // State Catatan Perwalian
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    advisees[0]?.student_id || ''
  );
  const [notesMap, setNotesMap] = useState<Record<string, AdvisoryNoteItem[]>>(initialNotes);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteForStudent, setNewNoteForStudent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Map risk level by student_id
  const riskMap = new Map<string, StudentRiskEvaluation>();
  riskEvaluations.forEach((r) => {
    riskMap.set(r.studentId, r);
  });

  const filteredAdvisees = advisees.filter((a) => {
    const matchSearch =
      a.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.student_nim.includes(searchQuery);
    const evalData = riskMap.get(a.student_id);
    const riskLevel = evalData?.riskLevel || 'AMAN';

    if (!matchSearch) return false;
    if (filterRisk === 'at_risk') return riskLevel !== 'AMAN';
    if (filterRisk === 'safe') return riskLevel === 'AMAN';
    return true;
  });

  const highRiskCount = advisees.filter(
    (a) => riskMap.get(a.student_id)?.riskLevel === 'RISIKO_TINGGI'
  ).length;
  const warningCount = advisees.filter(
    (a) => riskMap.get(a.student_id)?.riskLevel === 'PERHATIAN'
  ).length;
  const safeCount = advisees.length - highRiskCount - warningCount;

  // Handler Persetujuan KRS
  async function handleApproveKrs(item: PendingKrsItem) {
    setLoadingAction(true);
    try {
      const res = await approveAdviseeKrsAction({
        krs_id: item.id,
        student_id: item.student_id,
        catatan: 'KRS telah disetujui Dosen Wali.',
      });
      if (res.ok) {
        toast({ title: 'KRS Disetujui', description: `KRS mahasiswa ${item.student_name} berhasil disetujui.` });
        setKrsQueue((prev) =>
          prev.map((k) => (k.id === item.id ? { ...k, status: 'DISETUJUI' } : k))
        );
      } else {
        toast({ title: 'Gagal', description: res.pesan || 'Aksi gagal dilakukan.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Gagal', description: 'Terjadi kesalahan sistem.', variant: 'destructive' });
    } finally {
      setLoadingAction(false);
    }
  }

  // Handler Penolakan KRS
  async function handleRejectKrs() {
    if (!krsRejectModal) return;
    if (rejectReason.trim().length < 5) {
      toast({ title: 'Alasan Kurang', description: 'Catatan penolakan minimal 5 karakter.', variant: 'destructive' });
      return;
    }
    setLoadingAction(true);
    try {
      const res = await rejectAdviseeKrsAction({
        krs_id: krsRejectModal.id,
        student_id: krsRejectModal.student_id,
        catatan: rejectReason.trim(),
      });
      if (res.ok) {
        toast({ title: 'KRS Ditolak', description: `KRS mahasiswa ${krsRejectModal.student_name} ditolak dengan catatan.` });
        setKrsQueue((prev) =>
          prev.map((k) => (k.id === krsRejectModal.id ? { ...k, status: 'DITOLAK', catatan_wali: rejectReason } : k))
        );
        setKrsRejectModal(null);
        setRejectReason('');
      } else {
        toast({ title: 'Gagal', description: res.pesan || 'Aksi gagal dilakukan.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Gagal', description: 'Terjadi kendala sistem.', variant: 'destructive' });
    } finally {
      setLoadingAction(false);
    }
  }

  // Handler Tambah Catatan
  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    const targetAdvisee = advisees.find((a) => a.student_id === selectedStudentId);
    const advisoryId = targetAdvisee?.advisory_id || targetAdvisee?.id || `adv-${selectedStudentId}`;

    setSubmittingNote(true);
    try {
      const res = await addAdvisoryNoteAction({
        advisory_id: advisoryId,
        content: newNoteContent.trim(),
        note_for_student: newNoteForStudent.trim() || undefined,
      });

      if (res.ok) {
        toast({ title: 'Catatan Tersimpan', description: 'Catatan perwalian berhasil ditambahkan.' });
        const newNoteItem: AdvisoryNoteItem = {
          id: res.data?.id || `note-${Date.now()}`,
          advisory_id: advisoryId,
          author_id: 'me',
          author_name: 'Dosen Wali (Saya)',
          content: newNoteContent.trim(),
          note_for_student: newNoteForStudent.trim() || null,
          created_at: new Date().toISOString(),
        };

        setNotesMap((prev) => ({
          ...prev,
          [selectedStudentId]: [newNoteItem, ...(prev[selectedStudentId] || [])],
        }));
        setNewNoteContent('');
        setNewNoteForStudent('');
      } else {
        toast({ title: 'Gagal Simpan', description: res.pesan || 'Gagal menyimpan catatan.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Gagal Simpan', description: 'Terjadi kendala sistem.', variant: 'destructive' });
    } finally {
      setSubmittingNote(false);
    }
  }

  return (
    <div className="space-y-6 font-sans">
      {/* 1. KARTU STATISTIK RINGKAS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border-2 border-ink bg-surface shadow-retro">
          <p className="text-2xs font-mono font-bold text-gray-dark uppercase tracking-wider">Total Bimbingan</p>
          <p className="font-heading font-black text-2xl sm:text-3xl text-ink mt-1 tabular-nums">{advisees.length}</p>
        </div>

        <div className="p-4 rounded-xl border-2 border-ink bg-surface shadow-retro">
          <p className="text-2xs font-mono font-bold text-gray-dark uppercase tracking-wider">Status Aman</p>
          <p className="font-heading font-black text-2xl sm:text-3xl text-ink mt-1 tabular-nums">{safeCount}</p>
        </div>

        <div className="p-4 rounded-xl border-2 border-ink bg-gray-soft shadow-retro">
          <p className="text-2xs font-mono font-bold text-ink uppercase tracking-wider">Perlu Perhatian</p>
          <p className="font-heading font-black text-2xl sm:text-3xl text-ink mt-1 tabular-nums">{warningCount}</p>
        </div>

        <div className="p-4 rounded-xl border-2 border-ink bg-ink text-surface shadow-retro">
          <p className="text-2xs font-mono font-bold uppercase tracking-wider text-surface/80">Risiko Tinggi</p>
          <p className="font-heading font-black text-2xl sm:text-3xl text-surface mt-1 tabular-nums">{highRiskCount}</p>
        </div>
      </div>

      {/* 2. TAB NAVIGASI RUANG PERWALIAN */}
      <div className="flex border-b-2 border-ink bg-surface rounded-t-xl overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('bimbingan')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold border-r-2 border-ink transition-colors cursor-pointer ${
            activeTab === 'bimbingan' ? 'bg-ink text-surface' : 'bg-surface text-ink hover:bg-gray-soft'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Mahasiswa Bimbingan ({advisees.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('krs')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold border-r-2 border-ink transition-colors cursor-pointer ${
            activeTab === 'krs' ? 'bg-ink text-surface' : 'bg-surface text-ink hover:bg-gray-soft'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Persetujuan KRS ({krsQueue.filter((k) => k.status === 'DIAJUKAN').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('catatan')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold transition-colors cursor-pointer ${
            activeTab === 'catatan' ? 'bg-ink text-surface' : 'bg-surface text-ink hover:bg-gray-soft'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Catatan Perwalian</span>
        </button>
      </div>

      {/* 3. KONTEN TAB: 1. MAHASISWA BIMBINGAN */}
      {activeTab === 'bimbingan' && (
        <RetroWindow
          title="daftar_mahasiswa_perwalian.list"
          badge={`${advisees.length} MAHASISWA TERDAFTAR`}
          headerClassName="bg-gray-soft"
          bodyClassName="p-5 sm:p-6 space-y-4 bg-surface"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-ink/10 pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setFilterRisk('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  filterRisk === 'all'
                    ? 'bg-ink text-surface border-2 border-ink shadow-retro-sm'
                    : 'bg-surface text-ink border-2 border-ink hover:bg-gray-soft'
                }`}
              >
                Semua ({advisees.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterRisk('at_risk')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  filterRisk === 'at_risk'
                    ? 'bg-ink text-surface border-2 border-ink shadow-retro-sm'
                    : 'bg-surface text-ink border-2 border-ink hover:bg-gray-soft'
                }`}
              >
                Perlu Perhatian ({highRiskCount + warningCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterRisk('safe')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  filterRisk === 'safe'
                    ? 'bg-ink text-surface border-2 border-ink shadow-retro-sm'
                    : 'bg-surface text-ink border-2 border-ink hover:bg-gray-soft'
                }`}
              >
                Aman ({safeCount})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-dark" />
              <input
                type="text"
                placeholder="Cari nama atau NIM..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs font-sans rounded-lg border-2 border-ink bg-surface focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>
          </div>

          {filteredAdvisees.length === 0 ? (
            <div className="p-8 text-center rounded-xl border-2 border-dashed border-ink bg-gray-soft/40 space-y-2">
              <CheckCircle2 className="h-8 w-8 text-ink mx-auto" />
              <p className="text-sm font-heading font-bold text-ink">Tidak Ada Mahasiswa Ditemukan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAdvisees.map((item) => {
                const evalData = riskMap.get(item.student_id);
                const riskLevel = evalData?.riskLevel || 'AMAN';

                return (
                  <div
                    key={item.student_id}
                    className={`p-4 rounded-xl border-2 border-ink bg-surface shadow-retro-sm space-y-3 transition-all hover:bg-gray-soft/20 ${
                      riskLevel === 'RISIKO_TINGGI'
                        ? 'border-l-[6px] border-l-ink'
                        : riskLevel === 'PERHATIAN'
                        ? 'border-l-[6px] border-l-gray-dark'
                        : ''
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full border-2 border-ink bg-gray-soft flex items-center justify-center font-bold text-xs text-ink shrink-0 shadow-retro-sm">
                          {item.student_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-heading font-bold text-base text-ink">{item.student_name}</h4>
                          <p className="text-xs text-gray-dark font-sans">
                            NIM: {item.student_nim} &bull; Angkatan {item.angkatan || 2024} &bull; {item.program_name || 'Teknik Informatika'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded border-2 border-ink text-xs font-mono font-bold shadow-retro-sm ${
                            riskLevel === 'RISIKO_TINGGI'
                              ? 'bg-ink text-surface'
                              : riskLevel === 'PERHATIAN'
                              ? 'bg-gray-soft text-ink'
                              : 'bg-surface text-ink'
                          }`}
                        >
                          {riskLevel === 'RISIKO_TINGGI'
                            ? 'Risiko Tinggi'
                            : riskLevel === 'PERHATIAN'
                            ? 'Perhatian'
                            : 'Aman'}
                        </span>
                      </div>
                    </div>

                    {/* Indikator Peringatan Dini */}
                    {evalData && evalData.indicators.length > 0 ? (
                      <div className="space-y-1 pl-3 border-l-2 border-ink/20">
                        {evalData.indicators.map((ind, idx) => (
                          <div key={idx} className="text-xs font-medium text-ink flex items-center gap-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-ink shrink-0" />
                            <span>{ind.reason}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-dark pl-3 border-l-2 border-ink/20 font-medium">
                        Kehadiran &ge;75% dan seluruh target akademik semester berjalan dengan baik.
                      </p>
                    )}

                    {/* Tombol Aksi Cepat */}
                    <div className="pt-2 border-t-2 border-ink/10 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-gray-dark font-sans">
                        <span className="font-bold text-ink">Rekomendasi:</span>{' '}
                        {evalData?.recommendations[0] || 'Lakukan evaluasi rencana studi dan konfirmasi KRS semester ini.'}
                      </p>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentId(item.student_id);
                            setActiveTab('catatan');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-ink bg-surface hover:bg-gray-soft text-ink text-xs font-bold transition-all shadow-retro-sm cursor-pointer"
                        >
                          <FileText className="h-3.5 w-3.5 text-primary" />
                          <span>Buka Catatan</span>
                        </button>

                        <Link
                          href={`/messages?tab=konsultasi&studentNim=${item.student_nim}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-ink bg-surface hover:bg-ink hover:text-surface text-ink text-xs font-bold transition-all shadow-retro-sm cursor-pointer"
                        >
                          <MessageSquare className="h-3.5 w-3.5 text-ink" />
                          <span>Kirim Pesan</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </RetroWindow>
      )}

      {/* 4. KONTEN TAB: 2. PERSETUJUAN KRS */}
      {activeTab === 'krs' && (
        <RetroWindow
          title="antrean_persetujuan_krs.list"
          badge={`${krsQueue.filter((k) => k.status === 'DIAJUKAN').length} MENUNGGU PERSETUJUAN`}
          headerClassName="bg-gray-soft"
          bodyClassName="p-5 sm:p-6 space-y-4 bg-surface"
        >
          <div className="p-3 bg-gray-soft border-2 border-ink rounded-xl text-xs text-gray-dark font-medium leading-relaxed">
            Sebagai Dosen Pembimbing Akademik, Anda bertanggung jawab memvalidasi jumlah SKS yang diambil mahasiswa sesuai batas IPK semester lalu dan memeriksa keterpenuhan prasyarat mata kuliah.
          </div>

          {krsQueue.length === 0 ? (
            <div className="p-8 text-center rounded-xl border-2 border-dashed border-ink bg-gray-soft/40 space-y-2">
              <CheckCircle2 className="h-8 w-8 text-ink mx-auto" />
              <p className="text-sm font-heading font-bold text-ink">Tidak Ada Antrean KRS</p>
              <p className="text-xs text-gray-dark font-medium">Seluruh mahasiswa perwalian Anda telah diverifikasi.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {krsQueue.map((krs) => (
                <div
                  key={krs.id}
                  className="p-4 rounded-xl border-2 border-ink bg-surface shadow-retro-sm space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="font-heading font-bold text-base text-ink">{krs.student_name}</h4>
                      <p className="text-xs text-gray-dark font-sans">
                        NIM: {krs.student_nim} &bull; Total SKS Diambil: <strong className="text-ink">{krs.total_sks} SKS</strong> ({krs.items_count} Mata Kuliah) &bull; IPS Lalu: {krs.ips_lalu}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded border-2 border-ink text-xs font-mono font-bold shadow-xs ${
                          krs.status === 'DISETUJUI'
                            ? 'bg-primary text-white'
                            : krs.status === 'DITOLAK'
                            ? 'bg-gray-soft text-ink'
                            : 'bg-ink text-surface'
                        }`}
                      >
                        {krs.status === 'DIAJUKAN'
                          ? 'MENUNGGU PERSETUJUAN'
                          : krs.status === 'DISETUJUI'
                          ? 'DISETUJUI'
                          : 'DITOLAK'}
                      </span>
                    </div>
                  </div>

                  {krs.catatan_wali && (
                    <div className="p-2.5 rounded-lg border-2 border-ink/20 bg-gray-soft/40 text-xs text-gray-dark font-medium">
                      <strong className="text-ink">Catatan Dosen Wali:</strong> {krs.catatan_wali}
                    </div>
                  )}

                  {krs.status === 'DIAJUKAN' && (
                    <div className="pt-2 border-t-2 border-ink/10 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={loadingAction}
                        onClick={() => setKrsRejectModal(krs)}
                        className="px-3.5 py-1.5 rounded-lg border-2 border-ink bg-surface hover:bg-gray-soft text-ink text-xs font-bold transition-all shadow-retro-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <XCircle className="h-3.5 w-3.5 text-gray-dark" />
                        <span>Tolak dengan Catatan</span>
                      </button>

                      <button
                        type="button"
                        disabled={loadingAction}
                        onClick={() => handleApproveKrs(krs)}
                        className="px-3.5 py-1.5 rounded-lg border-2 border-ink bg-ink hover:bg-primary text-surface hover:text-white text-xs font-bold transition-all shadow-retro-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        <span>Setujui KRS Mahasiswa</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </RetroWindow>
      )}

      {/* 5. KONTEN TAB: 3. CATATAN PERWALIAN */}
      {activeTab === 'catatan' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Kolom Kiri: Pemilih Mahasiswa */}
          <div className="space-y-3">
            <h3 className="font-heading font-bold text-sm text-ink uppercase tracking-wider">
              Pilih Mahasiswa Bimbingan
            </h3>
            <div className="border-2 border-ink rounded-xl bg-surface p-2 space-y-1.5 max-h-[500px] overflow-y-auto shadow-retro-sm">
              {advisees.map((a) => (
                <button
                  key={a.student_id}
                  type="button"
                  onClick={() => setSelectedStudentId(a.student_id)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs font-sans transition-all cursor-pointer border-2 ${
                    selectedStudentId === a.student_id
                      ? 'border-ink bg-ink text-surface shadow-xs font-bold'
                      : 'border-transparent hover:bg-gray-soft text-ink font-medium'
                  }`}
                >
                  <p className="truncate font-heading">{a.student_name}</p>
                  <p className="text-2xs opacity-80">NIM: {a.student_nim}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Kolom Kanan: Detail Riwayat Catatan & Form Tambah Catatan */}
          <div className="lg:col-span-2 space-y-4">
            <RetroWindow
              title={`catatan_perwalian_${selectedStudentId}.log`}
              badge="INTERNAL DOSEN WALI & KOORDINATOR"
              headerClassName="bg-gray-soft"
              bodyClassName="p-5 space-y-4 bg-surface"
            >
              {/* Form Tambah Catatan Baru */}
              <form onSubmit={handleAddNote} className="space-y-3 border-b-2 border-ink/10 pb-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink">Catatan Perwalian (Internal Dosen & Kaprodi)</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Tuliskan catatan konsultasi, rencana pengambilan sks, atau pemantauan evaluasi studi..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="w-full p-2.5 text-xs font-sans rounded-lg border-2 border-ink bg-surface focus:outline-none focus:ring-1 focus:ring-ink"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-dark">Pesan Tambahan untuk Mahasiswa (Opsional, terbaca oleh mahasiswa)</label>
                  <input
                    type="text"
                    placeholder="Pesan bimbingan yang akan dilihat oleh mahasiswa pada profilnya..."
                    value={newNoteForStudent}
                    onChange={(e) => setNewNoteForStudent(e.target.value)}
                    className="w-full p-2.5 text-xs font-sans rounded-lg border-2 border-ink bg-surface focus:outline-none focus:ring-1 focus:ring-ink"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingNote || !newNoteContent.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-2 border-ink bg-ink hover:bg-primary text-surface hover:text-white text-xs font-bold transition-all shadow-retro-sm cursor-pointer disabled:opacity-50"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Simpan Catatan Perwalian</span>
                  </button>
                </div>
              </form>

              {/* Riwayat Catatan Mahasiswa Terpilih */}
              <div className="space-y-3 pt-2">
                <h4 className="font-heading font-bold text-sm text-ink">Riwayat Catatan Konsultasi</h4>
                {(!notesMap[selectedStudentId] || notesMap[selectedStudentId].length === 0) ? (
                  <p className="text-xs text-gray-dark font-medium italic p-4 text-center rounded-lg border-2 border-dashed border-ink/20 bg-gray-soft/20">
                    Belum ada riwayat catatan perwalian untuk mahasiswa ini.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {notesMap[selectedStudentId].map((note) => (
                      <div
                        key={note.id}
                        className="p-3 rounded-lg border-2 border-ink bg-surface shadow-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-2xs text-gray-dark font-mono">
                          <span className="font-bold text-ink">{note.author_name || 'Dosen Wali'}</span>
                          <span>{new Date(note.created_at).toLocaleString('id-ID')}</span>
                        </div>
                        <p className="text-xs text-ink font-sans leading-relaxed">{note.content}</p>
                        {note.note_for_student && (
                          <div className="pt-1.5 border-t border-ink/10 text-2xs text-gray-dark">
                            <strong>Pesan untuk Mahasiswa:</strong> &quot;{note.note_for_student}&quot;
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </RetroWindow>
          </div>
        </div>
      )}

      {/* MODAL PENOLAKAN KRS */}
      {krsRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 animate-fade-in font-sans">
          <div className="w-full max-w-md rounded-xl border-2 border-ink bg-surface p-5 shadow-retro space-y-4">
            <div className="flex items-center justify-between border-b-2 border-ink/10 pb-3">
              <h3 className="font-heading font-bold text-base text-ink flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-ink" />
                <span>Tolak Pengajuan KRS</span>
              </h3>
              <button
                type="button"
                onClick={() => setKrsRejectModal(null)}
                className="p-1 rounded hover:bg-gray-soft cursor-pointer text-ink"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-gray-dark font-medium">
              Berikan catatan evaluasi mengapa KRS mahasiswa <strong className="text-ink">{krsRejectModal.student_name}</strong> perlu direvisi:
            </p>

            <textarea
              rows={3}
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Contoh: Beban SKS melebihi ketentuan IPS semester lalu, silakan kurangi 1 mata kuliah pilihan..."
              className="w-full p-2.5 text-xs font-sans rounded-lg border-2 border-ink bg-surface focus:outline-none focus:ring-1 focus:ring-ink"
            />

            <div className="flex justify-end gap-2 pt-2 border-t-2 border-ink/10">
              <button
                type="button"
                onClick={() => setKrsRejectModal(null)}
                className="px-3.5 py-1.5 rounded-lg border-2 border-ink bg-surface hover:bg-gray-soft text-ink text-xs font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={loadingAction || rejectReason.trim().length < 5}
                onClick={handleRejectKrs}
                className="px-3.5 py-1.5 rounded-lg border-2 border-ink bg-ink text-surface hover:bg-primary hover:text-white text-xs font-bold shadow-retro-sm disabled:opacity-50 cursor-pointer"
              >
                Konfirmasi Penolakan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
