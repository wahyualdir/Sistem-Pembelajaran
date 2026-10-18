'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Clock,
  RotateCw,
  Plus,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  User,
  Users,
  Search,
} from 'lucide-react';
import {
  getExamMonitoringSummaryAction,
  rotateExamTokenAction,
  getExamTokenDetailAction,
  grantExamExtraTimeAction,
} from './exam-actions';

interface ParticipantSummary {
  attempt_id: string;
  student_id: string;
  student_name: string;
  status: string;
  auto_submitted: boolean;
  started_at: string;
  finished_at: string | null;
  last_heartbeat_at: string | null;
  extra_time_seconds: number;
  is_disconnected: boolean;
  answered_count: number;
  tab_exits_count: number;
}

interface ExamProctorViewProps {
  quizId: string;
  quizTitle: string;
  isLecturer: boolean;
  initialToken?: string;
  durationMinutes?: number;
}

export function ExamProctorView({
  quizId,
  quizTitle,
  isLecturer,
  initialToken,
  durationMinutes = 60,
}: ExamProctorViewProps) {
  const [token, setToken] = useState<string>(initialToken || '------');
  const [rotatedAt, setRotatedAt] = useState<string | null>(null);
  const [participants, setParticipants] = useState<ParticipantSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isRotating, setIsRotating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Tambah Waktu
  const [selectedAttempt, setSelectedAttempt] = useState<ParticipantSummary | null>(null);
  const [extraMinutes, setExtraMinutes] = useState<number>(10);
  const [extraReason, setExtraReason] = useState<string>('Kendala jaringan lokal');
  const [isGranting, setIsGranting] = useState(false);

  // 1. Polling ringkasan monitoring setiap 10 detik
  const fetchMonitoringData = useCallback(async () => {
    const res = await getExamMonitoringSummaryAction(quizId);
    if (res.ok && res.data) {
      setParticipants(res.data);
    }
    setIsLoading(false);
  }, [quizId]);

  const fetchTokenDetail = useCallback(async () => {
    const res = await getExamTokenDetailAction(quizId);
    if (res.ok && res.data) {
      setToken(res.data.token);
      setRotatedAt(res.data.rotated_at);
    }
  }, [quizId]);

  useEffect(() => {
    fetchMonitoringData();
    fetchTokenDetail();

    const interval = setInterval(() => {
      fetchMonitoringData();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchMonitoringData, fetchTokenDetail]);

  // 2. Putar token
  const handleRotateToken = async () => {
    if (!isLecturer) return;
    setIsRotating(true);
    const res = await rotateExamTokenAction(quizId);
    if (res.ok && res.token) {
      setToken(res.token);
      setRotatedAt(new Date().toISOString());
    }
    setIsRotating(false);
  };

  // 3. Tambah waktu peserta
  const handleGrantExtraTime = async () => {
    if (!selectedAttempt || !isLecturer) return;
    setIsGranting(true);
    const seconds = extraMinutes * 60;
    const res = await grantExamExtraTimeAction(selectedAttempt.attempt_id, seconds, extraReason);
    if (res.ok) {
      setSelectedAttempt(null);
      await fetchMonitoringData();
    }
    setIsGranting(false);
  };

  // Filter peserta
  const filteredParticipants = participants.filter((p) => {
    const matchSearch = p.student_name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;
    if (filterStatus === 'all') return true;
    if (filterStatus === 'disconnected') return p.is_disconnected;
    if (filterStatus === 'working') return p.status === 'IN_PROGRESS' && !p.is_disconnected;
    if (filterStatus === 'submitted') return p.status === 'SUBMITTED' || p.status === 'TIMED_OUT';
    return true;
  });

  const totalCount = participants.length;
  const inProgressCount = participants.filter((p) => p.status === 'IN_PROGRESS' && !p.is_disconnected).length;
  const disconnectedCount = participants.filter((p) => p.is_disconnected).length;
  const submittedCount = participants.filter((p) => p.status === 'SUBMITTED' || p.status === 'TIMED_OUT').length;

  return (
    <div className="space-y-6">
      {/* Header Pengawas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-primary" />
            <span>Layar Pengawas & Pantau Ujian</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {quizTitle} · Durasi: {durationMinutes} Menit · Pembaruan berkala setiap 10 detik.
          </p>
        </div>

        {/* Panel Token Akses */}
        <div className="flex items-center gap-3 bg-surface border border-border p-3 rounded-[12px] shadow-sm">
          <div>
            <div className="text-xs text-muted-foreground font-medium">Token Masuk Ujian</div>
            <div className="font-mono text-2xl font-bold tracking-widest text-foreground select-all">
              {token}
            </div>
          </div>
          {isLecturer && (
            <button
              onClick={handleRotateToken}
              disabled={isRotating}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-[8px] bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border transition-colors disabled:opacity-50"
              title="Putar token baru"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isRotating ? 'animate-spin' : ''}`} />
              <span>Putar Token</span>
            </button>
          )}
        </div>
      </div>

      {/* Ringkasan Metrik */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-[12px] border border-border bg-surface p-4">
          <div className="text-xs font-medium text-muted-foreground">Total Peserta Masuk</div>
          <div className="text-2xl font-bold text-foreground mt-1">{totalCount}</div>
        </div>
        <div className="rounded-[12px] border border-border bg-surface p-4">
          <div className="text-xs font-medium text-muted-foreground">Sedang Mengerjakan</div>
          <div className="text-2xl font-bold text-success mt-1">{inProgressCount}</div>
        </div>
        <div className="rounded-[12px] border border-border bg-surface p-4">
          <div className="text-xs font-medium text-muted-foreground">Terputus (&gt; 45s)</div>
          <div className="text-2xl font-bold text-destructive mt-1">{disconnectedCount}</div>
        </div>
        <div className="rounded-[12px] border border-border bg-surface p-4">
          <div className="text-xs font-medium text-muted-foreground">Telah Selesai</div>
          <div className="text-2xl font-bold text-muted-foreground mt-1">{submittedCount}</div>
        </div>
      </div>

      {/* Kontrol Pencarian dan Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama mahasiswa…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-[8px] border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'working', label: 'Mengerjakan' },
            { id: 'disconnected', label: 'Terputus' },
            { id: 'submitted', label: 'Selesai' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-[8px] transition-colors whitespace-nowrap ${
                filterStatus === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel Pemantauan Peserta */}
      <div className="rounded-[12px] border border-border bg-surface overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                <th className="py-3 px-4">Nama Mahasiswa</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Soal Terjawab</th>
                <th className="py-3 px-4 text-center">Kejadian Tab Keluar</th>
                <th className="py-3 px-4 text-center">Waktu Tambahan</th>
                <th className="py-3 px-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    Belum ada data peserta sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p) => (
                  <tr key={p.attempt_id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{p.student_name}</div>
                    </td>
                    <td className="py-3 px-4">
                      {p.is_disconnected ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                          <WifiOff className="h-3 w-3" /> Terputus
                        </span>
                      ) : p.status === 'IN_PROGRESS' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-success/10 text-success border border-success/20">
                          <Clock className="h-3 w-3" /> Mengerjakan
                        </span>
                      ) : p.auto_submitted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border border-border">
                          Selesai otomatis
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                          <CheckCircle2 className="h-3 w-3" /> Selesai
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-medium">{p.answered_count}</td>
                    <td className="py-3 px-4 text-center">
                      {p.tab_exits_count > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning">
                          <AlertTriangle className="h-3.5 w-3.5" /> {p.tab_exits_count} kali
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.extra_time_seconds > 0 ? (
                        <span className="text-xs font-semibold text-primary">
                          +{Math.round(p.extra_time_seconds / 60)} mnt
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isLecturer && p.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => setSelectedAttempt(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-[6px] bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Tambah Waktu</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Waktu */}
      {selectedAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[12px] border border-border bg-surface p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-foreground">
              Tambah Waktu Ujian
            </h2>
            <p className="text-sm text-muted-foreground">
              Berikan waktu tambahan khusus untuk mahasiswa{' '}
              <strong className="text-foreground">{selectedAttempt.student_name}</strong>.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Durasi Tambahan (Menit)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={extraMinutes}
                  onChange={(e) => setExtraMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full mt-1 px-3 py-2 text-sm rounded-[8px] border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Alasan Pemberian Waktu
                </label>
                <input
                  type="text"
                  value={extraReason}
                  onChange={(e) => setExtraReason(e.target.value)}
                  placeholder="Misal: Kendala koneksi di ruang lab"
                  className="w-full mt-1 px-3 py-2 text-sm rounded-[8px] border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setSelectedAttempt(null)}
                className="px-4 py-2 text-xs font-medium rounded-[8px] border border-border bg-surface hover:bg-muted text-foreground transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleGrantExtraTime}
                disabled={isGranting}
                className="px-4 py-2 text-xs font-semibold rounded-[8px] bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isGranting ? 'Menyimpan…' : 'Simpan Tambahan Waktu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
