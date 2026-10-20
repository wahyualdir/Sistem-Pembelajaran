'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  Users,
  Plus,
  Shuffle,
  Lock,
  Unlock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Copy,
  LogOut,
  UserPlus,
} from 'lucide-react';
import {
  type GroupSetItem,
  type GroupItem,
  type GroupMemberItem,
  createGroupSetAction,
  joinGroupByCodeAction,
  leaveGroupAction,
  listClassGroupSetsAction,
} from './group-actions';

interface ClassGroupsTabViewProps {
  classId: string;
  initialGroupSets?: GroupSetItem[];
  currentUserId?: string;
  isLecturer?: boolean;
}

export function ClassGroupsTabView({
  classId,
  initialGroupSets = [],
  currentUserId,
  isLecturer = false,
}: ClassGroupsTabViewProps) {
  const [groupSets, setGroupSets] = useState<GroupSetItem[]>(initialGroupSets);
  const [selectedSetId, setSelectedSetId] = useState<string>(
    initialGroupSets[0]?.id || ''
  );

  // State Buat Set Kelompok (Dosen)
  const [isCreatingSet, setIsCreatingSet] = useState(false);
  const [setName, setSetName] = useState('');
  const [formation, setFormation] = useState<'self' | 'random' | 'lecturer'>('self');
  const [minSize, setMinSize] = useState(3);
  const [maxSize, setMaxSize] = useState(5);
  const [lockAt, setLockAt] = useState('');

  // State Mahasiswa Bergabung via Kode
  const [joinCode, setJoinCode] = useState('');

  const [isPending, startTransition] = useTransition();
  const [messageError, setMessageError] = useState<string | null>(null);
  const [messageSuccess, setMessageSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listClassGroupSetsAction(classId).then((res) => {
      if (active && res) {
        setGroupSets(res);
        if (!selectedSetId && res[0]?.id) {
          setSelectedSetId(res[0].id);
        }
      }
    });
    return () => {
      active = false;
    };
  }, [classId, selectedSetId]);

  const activeSet = groupSets.find((s) => s.id === selectedSetId);

  const handleCreateSet = () => {
    if (!setName.trim()) return;
    setMessageError(null);
    setMessageSuccess(null);

    startTransition(async () => {
      const res = await createGroupSetAction({
        classId,
        name: setName.trim(),
        formation,
        minSize,
        maxSize,
        lockAt: lockAt ? new Date(lockAt).toISOString() : undefined,
      });

      if (res.ok) {
        setMessageSuccess('Set kelompok berhasil dibuat.');
        setIsCreatingSet(false);
        setSetName('');
        // Refresh
        const updated = await listClassGroupSetsAction(classId);
        setGroupSets(updated);
        if (res.data?.id) setSelectedSetId(res.data.id);
      } else {
        setMessageError(res.error || 'Gagal membuat set kelompok.');
      }
    });
  };

  const handleJoinByCode = () => {
    if (!activeSet || !joinCode.trim()) return;
    setMessageError(null);
    setMessageSuccess(null);

    startTransition(async () => {
      const res = await joinGroupByCodeAction(activeSet.id, joinCode.trim());
      if (res.ok) {
        setMessageSuccess('Berhasil bergabung ke kelompok!');
        setJoinCode('');
        // Refresh
        const updated = await listClassGroupSetsAction(classId);
        setGroupSets(updated);
      } else {
        setMessageError(res.error || 'Gagal bergabung ke kelompok.');
      }
    });
  };

  const handleLeave = (groupId: string) => {
    setMessageError(null);
    setMessageSuccess(null);

    startTransition(async () => {
      const res = await leaveGroupAction(groupId);
      if (res.ok) {
        setMessageSuccess('Anda telah keluar dari kelompok.');
        const updated = await listClassGroupSetsAction(classId);
        setGroupSets(updated);
      } else {
        setMessageError(res.error || 'Gagal keluar dari kelompok.');
      }
    });
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border-2 border-black p-5 rounded-2xl shadow-retro">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-black bg-gray-soft text-[11px] font-mono font-bold text-black uppercase">
            <Users className="w-3.5 h-3.5 text-black" />
            <span>Kolaborasi Proyek</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-black text-black">Kelompok Mahasiswa</h2>
          <p className="text-xs sm:text-sm text-black/75 font-medium leading-relaxed">
            Pengelolaan set kelompok untuk penugasan kolaboratif, studi kasus, dan proyek perkuliahan.
          </p>
        </div>

        {isLecturer && (
          <button
            type="button"
            onClick={() => {
              setIsCreatingSet(!isCreatingSet);
              setMessageError(null);
              setMessageSuccess(null);
            }}
            className="px-4 py-2.5 rounded-xl border-2 border-black bg-black text-white hover:bg-neutral-800 text-xs font-bold shadow-retro flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{isCreatingSet ? 'Tutup Formulir' : 'Buat Set Kelompok'}</span>
          </button>
        )}
      </div>

      {messageError && (
        <div className="p-3.5 bg-white text-black text-xs rounded-xl border-2 border-black font-bold shadow-retro-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-black shrink-0" />
          <span>{messageError}</span>
        </div>
      )}
      {messageSuccess && (
        <div className="p-3.5 bg-gray-soft text-black text-xs rounded-xl border-2 border-black font-bold shadow-retro-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
          <span>{messageSuccess}</span>
        </div>
      )}

      {/* Form Buat Set Kelompok Dosen */}
      {isCreatingSet && isLecturer && (
        <div className="p-6 rounded-2xl border-2 border-black bg-white space-y-4 shadow-retro-md">
          <h3 className="font-heading font-black text-base text-black border-b-2 border-black pb-2.5">
            Atur Set Kelompok Baru
          </h3>
          <div className="grid gap-3.5 sm:grid-cols-2 text-xs">
            <div className="space-y-1">
              <label className="font-mono font-bold text-black uppercase tracking-wider block">Nama Set Kelompok *</label>
              <input
                type="text"
                placeholder="Contoh: Kelompok Proyek Akhir"
                value={setName}
                onChange={(e) => setSetName(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 border-2 border-black rounded-lg bg-white text-black font-bold shadow-retro-sm outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono font-bold text-black uppercase tracking-wider block">Mode Pembentukan</label>
              <select
                value={formation}
                onChange={(e) => setFormation(e.target.value as any)}
                disabled={isPending}
                className="w-full px-3 py-2 border-2 border-black rounded-lg bg-white text-black font-mono font-bold shadow-retro-sm outline-none cursor-pointer"
              >
                <option value="self">Mandiri oleh Mahasiswa (Kode Undangan)</option>
                <option value="random">Otomatis / Acak oleh Sistem</option>
                <option value="lecturer">Manual oleh Dosen</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-3 text-xs">
            <div className="space-y-1">
              <label className="font-mono font-bold text-black uppercase tracking-wider block">Ukuran Minimal</label>
              <input
                type="number"
                min="2"
                max="10"
                value={minSize}
                onChange={(e) => setMinSize(Number(e.target.value))}
                disabled={isPending}
                className="w-full px-3 py-2 border-2 border-black rounded-lg bg-white text-black font-mono font-bold shadow-retro-sm outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono font-bold text-black uppercase tracking-wider block">Ukuran Maksimal</label>
              <input
                type="number"
                min="2"
                max="15"
                value={maxSize}
                onChange={(e) => setMaxSize(Number(e.target.value))}
                disabled={isPending}
                className="w-full px-3 py-2 border-2 border-black rounded-lg bg-white text-black font-mono font-bold shadow-retro-sm outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono font-bold text-black uppercase tracking-wider block">Batas Waktu Penguncian</label>
              <input
                type="datetime-local"
                value={lockAt}
                onChange={(e) => setLockAt(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 border-2 border-black rounded-lg bg-white text-black font-mono font-bold shadow-retro-sm outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t-2 border-black">
            <button
              type="button"
              onClick={() => setIsCreatingSet(false)}
              className="px-4 py-2 text-xs border-2 border-black rounded-xl bg-white hover:bg-gray-soft text-black font-bold shadow-retro-sm cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              onClick={handleCreateSet}
              disabled={isPending || !setName.trim()}
              className="px-5 py-2 text-xs bg-black text-white font-bold border-2 border-black rounded-xl hover:bg-neutral-800 shadow-retro cursor-pointer disabled:opacity-50"
            >
              {isPending ? 'Menyimpan...' : 'Simpan Set Kelompok'}
            </button>
          </div>
        </div>
      )}

      {/* Tabs antar-Set Kelompok jika ada lebih dari 1 */}
      {groupSets.length > 1 && (
        <div className="flex border-b-2 border-black overflow-x-auto gap-2 pb-2">
          {groupSets.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSetId(s.id)}
              className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-lg border-2 border-black transition-all cursor-pointer shadow-retro-sm ${
                s.id === selectedSetId
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-gray-soft'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Konten Utama Kelompok */}
      {groupSets.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border-2 border-dashed border-black bg-gray-soft/40 text-black space-y-2 shadow-retro">
          <Users className="mx-auto h-8 w-8 text-black mb-2" />
          <p className="text-base font-heading font-black text-black">Belum ada pembagian kelompok</p>
          <p className="text-xs text-black/75 font-medium max-w-md mx-auto">
            {isLecturer
              ? 'Tekan tombol "Buat Set Kelompok" di kanan atas untuk memulai penugasan tim kolaboratif.'
              : 'Dosen belum membuat kelompok tugas untuk kelas ini.'}
          </p>
        </div>
      ) : activeSet ? (
        <div className="space-y-5">
          {/* Header Info Set */}
          <div className="p-4 sm:p-5 rounded-2xl border-2 border-black bg-gray-soft/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-retro">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-base text-black">{activeSet.name}</span>
                <span className="text-xs px-2.5 py-0.5 bg-white border border-black rounded font-mono font-bold text-black uppercase shadow-xs">
                  Mode: {activeSet.formation}
                </span>
              </div>
              <p className="text-xs text-black/75 font-medium mt-1">
                Kapasitas: <strong className="text-black">{activeSet.min_size} s.d. {activeSet.max_size}</strong> anggota per kelompok
                {activeSet.lock_at && ` · Dikunci pada ${new Date(activeSet.lock_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}`}
              </p>
            </div>

            {/* Mahasiswa: Input Kode Gabung jika mode self */}
            {!isLecturer && activeSet.formation === 'self' && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Kode 6 digit"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  disabled={isPending}
                  className="px-3 py-1.5 border-2 border-black rounded-lg text-xs uppercase font-mono font-bold bg-white text-black shadow-retro-sm max-w-[130px] outline-none"
                />
                <button
                  type="button"
                  onClick={handleJoinByCode}
                  disabled={isPending || joinCode.trim().length !== 6}
                  className="px-3.5 py-1.5 rounded-lg border-2 border-black bg-black text-white hover:bg-neutral-800 text-xs font-bold flex items-center gap-1.5 shadow-retro-sm cursor-pointer disabled:opacity-50"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Gabung</span>
                </button>
              </div>
            )}
          </div>

          {/* Daftar Kelompok dalam Set */}
          {(!activeSet.groups || activeSet.groups.length === 0) ? (
            <div className="p-8 text-center rounded-2xl border-2 border-black bg-white text-black text-xs font-bold shadow-retro">
              Belum ada kelompok yang terdaftar pada set ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeSet.groups.map((g: GroupItem) => {
                const isMember = currentUserId
                  ? (g.members || []).some((m: GroupMemberItem) => m.student_id === currentUserId)
                  : false;
                const isUnderMin = (g.members || []).length < activeSet.min_size;
                return (
                  <div
                    key={g.id}
                    className={`p-5 rounded-2xl border-2 border-black space-y-3.5 transition-transform hover:-translate-y-0.5 shadow-retro ${
                      isMember
                        ? 'bg-gray-soft/60 ring-2 ring-black'
                        : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between border-b-2 border-black/10 pb-3">
                      <div>
                        <h4 className="font-heading font-black text-base text-black flex items-center gap-1.5">
                          <span>{g.name}</span>
                          {isMember && (
                            <span className="text-[10px] font-mono font-bold bg-black text-white px-1.5 py-0.5 rounded border border-black">
                              Kelompok Anda
                            </span>
                          )}
                        </h4>
                        <span className="text-xs font-mono text-black/70 font-bold block mt-0.5">
                          Kode: {g.join_code}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border border-black shadow-xs">
                        {(g.members || []).length}/{activeSet.max_size}
                      </span>
                    </div>

                    {isUnderMin && (
                      <p className="text-[11px] text-black font-mono font-bold bg-gray-soft px-2 py-1 rounded border border-black">
                        Di bawah kuota minimum ({activeSet.min_size} orang)
                      </p>
                    )}

                    {/* Daftar Anggota */}
                    <div className="space-y-1.5 border-t-2 border-black/10 pt-2.5">
                      {(g.members || []).map((m: GroupMemberItem) => (
                        <div
                          key={m.student_id}
                          className="flex items-center justify-between text-xs py-1"
                        >
                          <span className="text-black font-bold flex items-center gap-1.5">
                            <span>{m.student_name}</span>
                            {m.role === 'leader' && (
                              <span className="text-[10px] font-mono font-bold bg-black text-white px-1 py-0.2 rounded">
                                Ketua
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Tombol keluar untuk anggota sebelum dikunci */}
                    {isMember && !isLecturer && (
                      <div className="pt-2.5 border-t-2 border-black/10">
                        <button
                          type="button"
                          onClick={() => handleLeave(g.id)}
                          disabled={isPending}
                          className="text-black font-bold hover:underline text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Keluar dari Kelompok</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
