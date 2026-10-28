'use client';

import React, { useState, useTransition } from 'react';
import {
  GraduationCap,
  UserCheck,
  UserPlus,
  Users,
  Search,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import {
  assignAdvisorAction,
  revokeAdvisorAction,
  type AdviseeItem,
} from './advisory-actions';

interface AdvisoryManagementHubViewProps {
  initialAdvisees: AdviseeItem[];
  userRole?: string;
}

export function AdvisoryManagementHubView({
  initialAdvisees = [],
  userRole = 'PROGRAM_SECRETARY',
}: AdvisoryManagementHubViewProps) {
  const [advisees, setAdvisees] = useState<AdviseeItem[]>(initialAdvisees);
  const [search, setSearch] = useState('');
  const [selectedCohort, setSelectedCohort] = useState<number | 'ALL'>('ALL');
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'assign' | 'change'>('assign');
  const [formData, setFormData] = useState({
    student_id: '',
    advisor_id: '',
    student_name: '',
    advisor_name: '',
    angkatan: 2024,
  });

  const cohorts = Array.from(new Set(advisees.map((a) => a.angkatan || 2024))).sort((a, b) => b - a);

  const filteredAdvisees = advisees.filter((a) => {
    const matchesSearch =
      a.student_name.toLowerCase().includes(search.toLowerCase()) ||
      a.student_nim.includes(search) ||
      (a.advisor_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesCohort = selectedCohort === 'ALL' || (a.angkatan || 2024) === selectedCohort;
    return matchesSearch && matchesCohort;
  });

  const handleOpenAssignModal = (target?: AdviseeItem) => {
    if (target) {
      setModalMode('change');
      setFormData({
        student_id: target.student_id,
        advisor_id: target.advisor_id,
        student_name: target.student_name,
        advisor_name: target.advisor_name || '',
        angkatan: target.angkatan || 2024,
      });
    } else {
      setModalMode('assign');
      setFormData({
        student_id: '',
        advisor_id: '',
        student_name: '',
        advisor_name: '',
        angkatan: 2024,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmitAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_id.trim() || !formData.advisor_id.trim()) {
      toast({
        variant: 'destructive',
        title: 'Form Belum Lengkap',
        description: 'ID Mahasiswa dan ID Dosen Wali wajib diisi.',
      });
      return;
    }

    startTransition(async () => {
      const res = await assignAdvisorAction({
        student_id: formData.student_id.trim(),
        advisor_id: formData.advisor_id.trim(),
        angkatan: formData.angkatan,
      });

      if (res.ok) {
        toast({
          title: 'Berhasil',
          description: modalMode === 'change'
            ? 'Dosen Wali berhasil diperbarui.'
            : 'Penetapan Dosen Wali baru berhasil disimpan.',
        });

        // Update list
        setAdvisees((prev) => {
          const existingIdx = prev.findIndex((a) => a.student_id === formData.student_id.trim());
          const updatedItem: AdviseeItem = {
            id: res.data?.id || `adv-${Date.now()}`,
            advisory_id: res.data?.id || `adv-${Date.now()}`,
            student_id: formData.student_id.trim(),
            student_name: formData.student_name.trim() || 'Mahasiswa Terpilih',
            student_nim: formData.student_id.trim(),
            advisor_id: formData.advisor_id.trim(),
            advisor_name: formData.advisor_name.trim() || 'Dosen Wali Ditugaskan',
            status: 'ACTIVE',
            angkatan: formData.angkatan,
            valid_from: new Date().toISOString(),
          };

          if (existingIdx >= 0) {
            const next = [...prev];
            next[existingIdx] = updatedItem;
            return next;
          }
          return [updatedItem, ...prev];
        });

        setIsModalOpen(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Gagal Menetapkan Wali',
          description: res.pesan || res.error || 'Terjadi kesalahan pada sistem.',
        });
      }
    });
  };

  const handleRevoke = (studentId: string, studentName: string) => {
    if (!confirm(`Cabut penetapan Dosen Wali untuk ${studentName}? Mahasiswa akan berstatus tanpa Dosen Wali aktif.`)) {
      return;
    }

    startTransition(async () => {
      const res = await revokeAdvisorAction({ student_id: studentId });
      if (res.ok) {
        toast({
          title: 'Wali Dicabut',
          description: `Penetapan Dosen Wali untuk ${studentName} berhasil dicabut.`,
        });
        setAdvisees((prev) => prev.filter((a) => a.student_id !== studentId));
      } else {
        toast({
          variant: 'destructive',
          title: 'Gagal Mencabut Wali',
          description: res.pesan || res.error || 'Terjadi kesalahan sistem.',
        });
      }
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-up font-sans">
      <RetroWindow
        title="Manajemen Dosen Wali & Bimbingan Akademik"
        badge={userRole === 'PROGRAM_SECRETARY' ? 'SEKPRODI :: PERWALIAN' : 'KAPRODI :: PERWALIAN'}
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 bg-white space-y-6"
      >
        {/* Header Deskripsi */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-black pb-5">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-heading font-black tracking-tight text-[#111111] flex items-center gap-2.5">
              <GraduationCap className="h-6 w-6 text-[#ED1C24]" />
              <span>Distribusi & Otoritas Dosen Wali Mahasiswa</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#111111] font-medium">
              Kelola penugasan dosen wali per mahasiswa atau per angkatan program studi. Riwayat pergantian tersimpan otomatis.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleOpenAssignModal()}
            className="px-4 py-2 border-2 border-black bg-[#111111] text-white font-bold text-xs uppercase tracking-wider hover:bg-black transition-all shadow-retro-sm cursor-pointer flex items-center gap-2 shrink-0 active:translate-x-0.5 active:translate-y-0.5"
          >
            <UserPlus className="h-4 w-4" />
            <span>Tetapkan Wali Baru</span>
          </button>
        </div>

        {/* Ringkasan Statistik */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 border-2 border-black bg-gray-soft shadow-retro-sm flex items-center gap-3.5">
            <div className="p-2.5 border-2 border-black bg-white">
              <Users className="h-5 w-5 text-[#111111]" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase text-[#111111] block">Total Bimbingan</span>
              <span className="text-2xl font-heading font-black text-[#111111]">{advisees.length}</span>
            </div>
          </div>

          <div className="p-4 border-2 border-black bg-gray-soft shadow-retro-sm flex items-center gap-3.5">
            <div className="p-2.5 border-2 border-black bg-white">
              <UserCheck className="h-5 w-5 text-[#111111]" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase text-[#111111] block">Dosen Wali Aktif</span>
              <span className="text-2xl font-heading font-black text-[#111111]">
                {new Set(advisees.map((a) => a.advisor_id)).size}
              </span>
            </div>
          </div>

          <div className="p-4 border-2 border-black bg-gray-soft shadow-retro-sm flex items-center gap-3.5">
            <div className="p-2.5 border-2 border-black bg-white">
              <CheckCircle2 className="h-5 w-5 text-[#111111]" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase text-[#111111] block">Status Otoritas</span>
              <span className="text-xs font-bold text-[#111111] block mt-1">
                Terhubung Database RLS
              </span>
            </div>
          </div>
        </div>

        {/* Filter dan Pencarian */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#111111]/50" />
            <input
              type="text"
              placeholder="Cari nama mahasiswa, NIM, atau nama dosen wali..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border-2 border-black text-xs font-sans placeholder:text-[#111111]/40 focus:outline-hidden focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-[#111111]">Angkatan:</span>
            <select
              value={selectedCohort}
              onChange={(e) => setSelectedCohort(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="border-2 border-black px-2.5 py-1.5 text-xs font-bold bg-white focus:outline-hidden"
            >
              <option value="ALL">Semua Angkatan</option>
              {cohorts.map((c) => (
                <option key={c} value={c}>
                  Angkatan {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabel Penetapan */}
        <div className="border-2 border-black overflow-hidden shadow-retro">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="border-b-2 border-black bg-gray-soft font-bold uppercase text-[#111111]">
                <tr>
                  <th className="p-3.5">Mahasiswa</th>
                  <th className="p-3.5">NIM</th>
                  <th className="p-3.5 text-center">Angkatan</th>
                  <th className="p-3.5">Dosen Wali (PA)</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/10">
                {filteredAdvisees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#111111] font-medium">
                      Tidak ada data perwalian yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredAdvisees.map((adv) => (
                    <tr key={adv.id} className="hover:bg-gray-soft/40 transition-colors">
                      <td className="p-3.5 font-bold text-[#111111]">
                        {adv.student_name}
                      </td>
                      <td className="p-3.5 font-semibold text-[#111111]">
                        {adv.student_nim}
                      </td>
                      <td className="p-3.5 text-center font-bold text-[#111111]">
                        {adv.angkatan || 2024}
                      </td>
                      <td className="p-3.5 font-bold text-[#111111]">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="h-4 w-4 text-[#ED1C24]" />
                          <span>{adv.advisor_name || adv.advisor_id}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 border border-black bg-white text-xs font-bold shadow-retro-sm">
                          {adv.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenAssignModal(adv)}
                            disabled={isPending}
                            className="px-2.5 py-1 border border-black bg-white text-xs font-bold hover:bg-gray-soft transition-colors cursor-pointer shadow-retro-sm"
                            title="Ganti Dosen Wali"
                          >
                            <Edit2 className="h-3 w-3 inline mr-1" />
                            <span>Ganti</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRevoke(adv.student_id, adv.student_name)}
                            disabled={isPending}
                            className="px-2.5 py-1 border border-black bg-[#ED1C24] text-white text-xs font-bold hover:bg-[#A91117] transition-colors cursor-pointer shadow-retro-sm"
                            title="Cabut Penetapan Wali"
                          >
                            <Trash2 className="h-3 w-3 inline mr-1" />
                            <span>Cabut</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </RetroWindow>

      {/* Modal Tetapkan / Ganti Wali */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-sans backdrop-blur-2xs">
          <div className="w-full max-w-lg border-2 border-black bg-white p-6 shadow-retro space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <h3 className="font-heading font-black text-lg text-[#111111] flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-[#ED1C24]" />
                <span>{modalMode === 'change' ? 'Ganti Dosen Wali' : 'Tetapkan Dosen Wali Baru'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 border border-black hover:bg-gray-soft cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAssign} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-[#111111] block">
                  ID Mahasiswa / User ID <span className="text-[#ED1C24]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  placeholder="Contoh: 00000000-0000-0000-0000-000000000001"
                  className="w-full p-2 border-2 border-black text-xs font-mono focus:outline-hidden"
                  disabled={modalMode === 'change'}
                />
              </div>

              {modalMode === 'change' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#111111] block">
                    Nama Mahasiswa
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formData.student_name}
                    className="w-full p-2 border-2 border-black text-xs bg-gray-soft font-bold"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-[#111111] block">
                  ID Dosen Wali (Pemegang Peran LECTURER) <span className="text-[#ED1C24]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.advisor_id}
                  onChange={(e) => setFormData({ ...formData, advisor_id: e.target.value })}
                  placeholder="Contoh: 00000000-0000-0000-0000-000000000002"
                  className="w-full p-2 border-2 border-black text-xs font-mono focus:outline-hidden"
                />
                <span className="text-xs text-[#111111]/70 block font-medium">
                  Pastikan user ID yang dimasukkan memiliki peran aktif Dosen (LECTURER).
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-[#111111] block">
                  Angkatan Mahasiswa
                </label>
                <input
                  type="number"
                  min={2000}
                  max={2100}
                  value={formData.angkatan}
                  onChange={(e) => setFormData({ ...formData, angkatan: Number(e.target.value) })}
                  className="w-full p-2 border-2 border-black text-xs font-bold focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-gray-soft border-2 border-black text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-[#111111]">
                  <Clock className="h-4 w-4 text-[#ED1C24]" />
                  <span>Jaminan Integritas Transaksional:</span>
                </div>
                <p className="text-[#111111] font-medium leading-relaxed">
                  Operasi penetapan ini dieksekusi secara atomik. Bila mahasiswa telah memiliki Dosen Wali aktif sebelumnya, penugasan lama otomatis berstatus ENDED dan tercatat pada jejak audit sistem.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border-2 border-black bg-white text-xs font-bold hover:bg-gray-soft cursor-pointer shadow-retro-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 border-2 border-black bg-[#111111] text-white text-xs font-bold uppercase hover:bg-black cursor-pointer shadow-retro-sm"
                >
                  {isPending ? 'Menyimpan...' : 'Simpan Penetapan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
