'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Clock, Plus, CheckCircle2, User, Users } from 'lucide-react';
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
    <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-sm text-foreground">Perpanjangan Tenggat</h3>
        </div>

        {isLecturer && (
          <button
            type="button"
            onClick={() => {
              setIsAdding(!isAdding);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className="btn-outline !w-auto text-xs px-3 py-1 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAdding ? 'Batal' : 'Beri Perpanjangan'}</span>
          </button>
        )}
      </div>

      {errorMsg && (
        <p className="text-xs text-danger font-medium bg-danger/10 p-2.5 rounded">
          {errorMsg}
        </p>
      )}
      {successMsg && (
        <p className="text-xs text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded">
          {successMsg}
        </p>
      )}

      {isAdding && isLecturer && (
        <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-3">
          <p className="text-xs font-semibold text-foreground">Form Perpanjangan Tenggat</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Mahasiswa</label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                disabled={isPending}
                className="field text-xs"
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
              <label className="text-xs font-medium">Tenggat Baru</label>
              <input
                type="datetime-local"
                value={newDueAt}
                onChange={(e) => setNewDueAt(e.target.value)}
                disabled={isPending}
                className="field text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Penutupan Baru (opsional)</label>
              <input
                type="datetime-local"
                value={newCloseAt}
                onChange={(e) => setNewCloseAt(e.target.value)}
                disabled={isPending}
                className="field text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Alasan Perpanjangan (minimal 5 karakter)</label>
            <input
              type="text"
              placeholder="Contoh: Dispensasi sakit rawat inap / kegiatan lomba kampus"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isPending}
              className="field text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="btn-outline !w-auto text-xs px-3 py-1.5"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleGrant}
              disabled={isPending || !studentId || !newDueAt || reason.trim().length < 5}
              className="btn-solid !w-auto text-xs px-4 py-1.5"
            >
              {isPending ? 'Menyimpan...' : 'Berikan Perpanjangan'}
            </button>
          </div>
        </div>
      )}

      {extensions.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          Belum ada perpanjangan tenggat yang diberikan pada tugas ini.
        </p>
      ) : (
        <div className="space-y-2">
          {extensions.map((ext) => (
            <div
              key={ext.id}
              className="p-3 rounded-lg border border-border bg-surface text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <span className="font-semibold text-foreground">
                  {ext.student_name || ext.student_id?.slice(0, 8)}
                </span>
                <p className="text-muted-foreground mt-0.5">Alasan: {ext.reason}</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-primary font-bold">
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
