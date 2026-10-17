'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  Users,
  Plus,
  Lock,
  KeyRound,
  UserPlus,
  LogOut,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import {
  type GroupSetItem,
  type GroupItem,
  createGroupSetAction,
  joinGroupByCodeAction,
  leaveGroupAction,
  listClassGroupSetsAction,
} from './group-actions';

interface ClassGroupsTabViewProps {
  classId: string;
  isLecturer: boolean;
  currentUserId?: string;
}

export function ClassGroupsTabView({
  classId,
  isLecturer,
  currentUserId,
}: ClassGroupsTabViewProps) {
  const [groupSets, setGroupSets] = useState<GroupSetItem[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [isCreatingSet, setIsCreatingSet] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form buat set
  const [setName, setSetName] = useState('');
  const [formation, setFormation] = useState<'lecturer' | 'random' | 'self'>('self');
  const [minSize, setMinSize] = useState(2);
  const [maxSize, setMaxSize] = useState(5);
  const [lockAt, setLockAt] = useState('');

  // Form gabung kelompok (Mahasiswa)
  const [joinCode, setJoinCode] = useState('');
  const [messageError, setMessageError] = useState<string | null>(null);
  const [messageSuccess, setMessageSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listClassGroupSetsAction(classId).then((res) => {
      if (active) {
        setGroupSets(res);
        if (res.length > 0) {
          setSelectedSetId((prev) => prev || res[0].id);
        }
      }
    });
    return () => {
      active = false;
    };
  }, [classId]);

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
        lockAt: lockAt ? new Date(lockAt).toISOString() : null,
      });

      if (res.ok && res.data) {
        setMessageSuccess(`Set kelompok '${res.data.name}' berhasil dibuat.`);
        setGroupSets((prev) => [res.data!, ...prev]);
        setSelectedSetId(res.data.id);
        setIsCreatingSet(false);
        setSetName('');
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Kelompok Mahasiswa</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pengelolaan set kelompok untuk penugasan kolaboratif dan proyek kelas.
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
            className="btn-solid !w-auto text-xs px-3.5 py-2 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{isCreatingSet ? 'Batal' : 'Buat Set Kelompok'}</span>
          </button>
        )}
      </div>

      {messageError && (
        <div className="p-3 bg-danger/10 text-danger text-xs rounded-lg border border-danger/20 font-medium">
          {messageError}
        </div>
      )}
      {messageSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-lg border border-emerald-200 font-medium">
          {messageSuccess}
        </div>
      )}

      {/* Form Buat Set Kelompok Dosen */}
      {isCreatingSet && isLecturer && (
        <div className="p-5 rounded-xl border border-border bg-surface space-y-4">
          <h3 className="font-semibold text-sm text-foreground">Atur Set Kelompok Baru</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">Nama Set Kelompok</label>
              <input
                type="text"
                placeholder="Contoh: Kelompok Proyek Akhir"
                value={setName}
                onChange={(e) => setSetName(e.target.value)}
                disabled={isPending}
                className="field text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Mode Pembentukan</label>
              <select
                value={formation}
                onChange={(e) => setFormation(e.target.value as any)}
                disabled={isPending}
                className="field text-xs"
              >
                <option value="self">Mandiri oleh Mahasiswa (Kode Undangan)</option>
                <option value="random">Otomatis / Acak oleh Sistem</option>
                <option value="lecturer">Manual oleh Dosen</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Ukuran Minimal</label>
              <input
                type="number"
                min="2"
                max="10"
                value={minSize}
                onChange={(e) => setMinSize(Number(e.target.value))}
                disabled={isPending}
                className="field text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Ukuran Maksimal</label>
              <input
                type="number"
                min="2"
                max="15"
                value={maxSize}
                onChange={(e) => setMaxSize(Number(e.target.value))}
                disabled={isPending}
                className="field text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Kunci Pembentukan (opsional)</label>
              <input
                type="datetime-local"
                value={lockAt}
                onChange={(e) => setLockAt(e.target.value)}
                disabled={isPending}
                className="field text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsCreatingSet(false)}
              className="btn-outline !w-auto text-xs px-3 py-1.5"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleCreateSet}
              disabled={isPending || !setName.trim()}
              className="btn-solid !w-auto text-xs px-4 py-1.5"
            >
              {isPending ? 'Menyimpan...' : 'Simpan Set Kelompok'}
            </button>
          </div>
        </div>
      )}

      {/* Tabs antar-Set Kelompok jika ada lebih dari 1 */}
      {groupSets.length > 1 && (
        <div className="flex border-b border-border overflow-x-auto gap-2">
          {groupSets.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSetId(s.id)}
              className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                s.id === selectedSetId
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Konten Utama Kelompok */}
      {groupSets.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-border bg-surface text-muted-foreground">
          <Users className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm font-medium text-foreground">Belum ada pembagian kelompok</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isLecturer
              ? 'Tekan tombol "Buat Set Kelompok" untuk memulai penugasan kelompok.'
              : 'Dosen belum membuat kelompok tugas untuk kelas ini.'}
          </p>
        </div>
      ) : activeSet ? (
        <div className="space-y-5">
          {/* Header Info Set */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-foreground">{activeSet.name}</span>
                <span className="text-[11px] px-2 py-0.5 bg-surface border rounded text-muted-foreground uppercase">
                  Mode: {activeSet.formation}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Kapasitas: {activeSet.min_size} s.d. {activeSet.max_size} anggota per kelompok
                {activeSet.lock_at && ` · Dikunci pada ${new Date(activeSet.lock_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}`}
              </p>
            </div>

            {/* Mahasiswa: Input Kode Gabung jika mode self */}
            {!isLecturer && activeSet.formation === 'self' && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Kode 6 karakter"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  disabled={isPending}
                  className="field text-xs uppercase font-mono max-w-[130px]"
                />
                <button
                  type="button"
                  onClick={handleJoinByCode}
                  disabled={isPending || joinCode.trim().length !== 6}
                  className="btn-solid !w-auto text-xs px-3 py-1.5 flex items-center gap-1"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Gabung</span>
                </button>
              </div>
            )}
          </div>

          {/* Daftar Kelompok dalam Set */}
          {(!activeSet.groups || activeSet.groups.length === 0) ? (
            <div className="p-8 text-center rounded-xl border border-border bg-surface text-muted-foreground text-xs">
              Belum ada kelompok yang terdaftar pada set ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeSet.groups.map((g) => {
                const isMember = currentUserId
                  ? g.members.some((m) => m.student_id === currentUserId)
                  : false;
                const isUnderMin = g.members.length < activeSet.min_size;
                return (
                  <div
                    key={g.id}
                    className={`p-4 rounded-xl border space-y-3 ${
                      isMember
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-surface'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                          {g.name}
                          {isMember && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary text-primary-foreground font-semibold">
                              Kelompok Anda
                            </span>
                          )}
                        </h4>
                        <span className="text-xs text-muted-foreground font-mono">
                          Kode: <strong className="text-foreground">{g.join_code}</strong>
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {g.members.length}/{activeSet.max_size}
                      </span>
                    </div>

                    {isUnderMin && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded">
                        Di bawah ukuran minimum ({activeSet.min_size} orang)
                      </p>
                    )}

                    {/* Daftar Anggota */}
                    <div className="space-y-1.5 border-t border-border/60 pt-2">
                      {g.members.map((m) => (
                        <div
                          key={m.student_id}
                          className="flex items-center justify-between text-xs py-0.5"
                        >
                          <span className="text-foreground flex items-center gap-1">
                            {m.student_name}
                            {m.role === 'leader' && (
                              <span className="text-[10px] text-primary font-bold">(Ketua)</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Tombol keluar untuk anggota sebelum dikunci */}
                    {isMember && !isLecturer && (
                      <div className="pt-2 border-t border-border/40">
                        <button
                          type="button"
                          onClick={() => handleLeave(g.id)}
                          disabled={isPending}
                          className="text-danger hover:underline text-xs flex items-center gap-1"
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
