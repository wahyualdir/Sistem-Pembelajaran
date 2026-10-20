'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Clock, Plus, CheckCircle2, User, Users, AlertCircle } from 'lucide-react';
import {
  type AssignmentExtensionItem,
  grantAssignmentExtensionAction,
  listAssignmentExtensionsAction,
} from './assignment-late-actions';

interface AssignmentExtensionsCardProps {
  assignmentId: string;
  isLecturer: boolean;
  members: Array<{ student_id: string; name: string }>;
}

export function AssignmentExtensionsCard({
  assignmentId,
  isLecturer,
  members = [],
}: AssignmentExtensionsCardProps) {
  const [extensions, setExtensions] = useState<AssignmentExtensionItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [studentId, setStudentId] = useState('');
  const [newDueAt, setNewDueAt] = useState('');
  const [newCloseAt, setNewCloseAt] = useState('');
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listAssignmentExtensionsAction(assignmentId).then((res) => {
      if (active) setExtensions(res);
    });
    return () => {
      active = false;
    };
  }, [assignmentId]);

  const handleGrant = () => {
    if (!studentId || !newDueAt || !reason.trim()) {
      setErrorMsg('Pilih mahasiswa, tenggat baru, dan isi alasan perpanjangan.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await grantAssignmentExtensionAction({
        assignmentId,
        studentId,
        newDueAt: new Date(newDueAt).toISOString(),
        newCloseAt: newCloseAt ? new Date(newCloseAt).toISOString() : null,
        reason: reason.trim(),
      });

      if (res.ok && res.data) {
        setSuccessMsg('Perpanjangan tenggat berhasil diberikan.');
        setExtensions((prev) => [res.data!, ...prev]);
        setIsAdding(false);
        setReason('');
        setNewDueAt('');
        setNewCloseAt('');
      } else {
        setErrorMsg(res.error || 'Gagal memberikan perpanjangan.');
      }
    });
  };

  if (!isLecturer && extensions.length === 0) return null;

  return (
    <div className="rounded-2xl border-2 border-black bg-white p-5 sm:p-6 space-y-4 shadow-retro font-sans">
      <div className="flex items-center justify-between border-b-2 border-black/15 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg border-2 border-black bg-gray-soft text-black flex items-center justify-center shadow-retro-sm">
            <Clock className="w-4 h-4 text-black" />
          </div>
          <div>
            <h3 className="font-heading font-black text-sm sm:text-base text-black">Perpanjangan Tenggat Tugas</h3>
            <p className="text-xs text-black/70 font-medium">Dispensasi tenggat waktu untuk mahasiswa tertentu.</p>
          </div>
        </div>

        {isLecturer && (
          <button
            type="button"
            onClick={() => {
              setIsAdding(!isAdding);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className="px-3.5 py-1.5 rounded-xl border-2 border-black bg-black text-white hover:bg-neutral-800 text-xs font-bold shadow-retro-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAdding ? 'Batal' : 'Beri Perpanjangan'}</span>
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="text-xs text-black font-bold bg-white p-3 rounded-xl border-2 border-black shadow-retro-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-black shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="text-xs text-black font-bold bg-gray-soft p-3 rounded-xl border-2 border-black shadow-retro-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {isAdding && isLecturer && (
        <div className="p-4 sm:p-5 rounded-xl border-2 border-black bg-gray-soft/40 space-y-3.5 shadow-retro-sm text-xs">
          <p className="font-heading font-black text-sm text-black border-b-2 border-black/10 pb-2">Formulir Dispensasi Tenggat Mahasiswa</p>
          <div className="grid gap-3.5 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="font-mono font-bold text-black uppercase tracking-wider block">Mahasiswa *</label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 border-2 border-black rounded-lg bg-white text-black font-bold shadow-retro-sm outline-none cursor-pointer"
              >
                <option value="">Pilih Mahasiswa...</option>
                {members.map((m) => (
                  <option key={m.student_id} value={m.student_id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-mono font-bold text-black uppercase tracking-wider block">Tenggat Baru *</label>
              <input
                type="datetime-local"
                value={newDueAt}
                onChange={(e) => setNewDueAt(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 border-2 border-black rounded-lg bg-white text-black font-mono font-bold shadow-retro-sm outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono font-bold text-black uppercase tracking-wider block">Penutupan Akhir (opsional)</label>
              <input
                type="datetime-local"
                value={newCloseAt}
                onChange={(e) => setNewCloseAt(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 border-2 border-black rounded-lg bg-white text-black font-mono font-bold shadow-retro-sm outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-mono font-bold text-black uppercase tracking-wider block">Alasan Perpanjangan * (minimal 5 karakter)</label>
            <input
              type="text"
              placeholder="Contoh: Dispensasi medis rawat inap / delegasi lomba universitas"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isPending}
              className="w-full px-3 py-2 border-2 border-black rounded-lg bg-white text-black font-sans font-medium shadow-retro-sm outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t-2 border-black/10">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border-2 border-black rounded-xl bg-white hover:bg-gray-soft text-black font-bold text-xs shadow-retro-sm cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleGrant}
              disabled={isPending || !studentId || !newDueAt || reason.trim().length < 5}
              className="px-5 py-2 rounded-xl border-2 border-black bg-black text-white hover:bg-neutral-800 font-bold text-xs shadow-retro cursor-pointer disabled:opacity-50"
            >
              {isPending ? 'Menyimpan...' : 'Berikan Perpanjangan'}
            </button>
          </div>
        </div>
      )}

      {extensions.length === 0 ? (
        <p className="text-xs text-black/60 italic font-medium py-1">
          Belum ada perpanjangan tenggat yang diberikan pada tugas ini.
        </p>
      ) : (
        <div className="space-y-2.5">
          {extensions.map((ext) => (
            <div
              key={ext.id}
              className="p-3.5 rounded-xl border-2 border-black bg-white text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-retro-sm"
            >
              <div>
                <span className="font-heading font-black text-black text-sm">
                  {ext.student_name || ext.student_id?.slice(0, 8)}
                </span>
                <p className="text-black/75 mt-0.5 font-medium">Alasan: {ext.reason}</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-black font-bold bg-gray-soft px-2.5 py-1 rounded border border-black shadow-xs inline-block">
                  s.d. {new Date(ext.new_due_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
