'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  claimAttemptSessionAction,
  saveExamAnswersAction,
  examHeartbeatAction,
  submitExamAction,
  recordExamEventAction,
} from '@/modules/academic/exam-actions';

export interface AnswerItem {
  questionId: string;
  answer: any;
  revision: number;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'offline' | 'error';

interface AutosaveOptions {
  attemptId: string;
  initialExpiresAt?: string | null;
  onSessionExpired?: () => void;
  onAnotherSessionActive?: () => void;
}

/**
 * Penyimpanan lokal persisten menggunakan IndexedDB asli browser dengan fallback aman
 */
async function getStoredLocalAnswers(key: string): Promise<Record<string, AnswerItem>> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback diam
  }
  return {};
}

async function setStoredLocalAnswers(key: string, data: Record<string, AnswerItem>): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // fallback diam
  }
}

export function useExamAutosave({
  attemptId,
  initialExpiresAt,
  onSessionExpired,
  onAnotherSessionActive,
}: AutosaveOptions) {
  const [answers, setAnswers] = useState<Record<string, AnswerItem>>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('Memuat data ujian…');
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [expiresAt, setExpiresAt] = useState<string | null>(initialExpiresAt || null);

  const answersRef = useRef<Record<string, AnswerItem>>({});
  const pendingQueueRef = useRef<Record<string, AnswerItem>>({});
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryIntervalRef = useRef<number>(1000);
  const serverOffsetRef = useRef<number>(0); // server_now - Date.now()
  const lastEventLoggedRef = useRef<Record<string, number>>({});
  const isOnlineRef = useRef<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const storageKey = `exam:${attemptId}`;

  // 1. Klaim sesi aktif dan inisialisasi sinkronisasi
  useEffect(() => {
    let mounted = true;

    async function initSession() {
      // Muat cadangan lokal IndexedDB/localStorage terlebih dahulu
      const localAnswers = await getStoredLocalAnswers(storageKey);
      if (mounted && Object.keys(localAnswers).length > 0) {
        answersRef.current = localAnswers;
        setAnswers(localAnswers);
      }

      const res = await claimAttemptSessionAction(attemptId);
      if (!mounted) return;

      if (res.ok && res.sessionId) {
        setSessionId(res.sessionId);
        if (res.serverNow) {
          serverOffsetRef.current = new Date(res.serverNow).getTime() - Date.now();
        }
        if (res.expiresAt) {
          setExpiresAt(res.expiresAt);
        }
        setStatus('saved');
        setStatusMessage('Tersimpan di server');
      } else if (res.code === 'NOT_IN_PROGRESS') {
        setIsReadOnly(true);
        setStatusMessage('Ujian telah selesai atau ditutup.');
      } else {
        setStatus('error');
        setStatusMessage(res.pesan || 'Gagal memulai sesi ujian.');
      }
    }

    initSession();

    return () => {
      mounted = false;
    };
  }, [attemptId, storageKey]);

  // 2. Log event telemetri dengan rate limiting
  const logTelemetryEvent = useCallback(
    async (kind: 'offline' | 'online' | 'tab_hidden' | 'tab_visible' | 'fullscreen_exit', meta?: any) => {
      const now = Date.now();
      const last = lastEventLoggedRef.current[kind] || 0;
      // Batasi jenis event yang sama minimal 3 detik antar pemanggilan
      if (now - last < 3000) return;
      lastEventLoggedRef.current[kind] = now;

      await recordExamEventAction(attemptId, kind, meta);
    },
    [attemptId]
  );

  // 3. Fungsi pengiriman batch ke server
  const flushPendingQueue = useCallback(async () => {
    if (!sessionId || isReadOnly) return;
    const itemsToSend = Object.values(pendingQueueRef.current);
    if (itemsToSend.length === 0) return;

    setStatus('saving');
    setStatusMessage('Menyimpan…');

    const res = await saveExamAnswersAction(attemptId, sessionId, itemsToSend);

    if (res.ok) {
      // Hapus yang berhasil disimpan dari antrean
      for (const item of itemsToSend) {
        if (pendingQueueRef.current[item.questionId]?.revision <= item.revision) {
          delete pendingQueueRef.current[item.questionId];
        }
      }
      retryIntervalRef.current = 1000; // Reset jeda backoff
      if (res.serverNow) {
        serverOffsetRef.current = new Date(res.serverNow).getTime() - Date.now();
      }
      if (res.expiresAt) {
        setExpiresAt(res.expiresAt);
      }

      const nowTime = new Date();
      const timeStr = `${String(nowTime.getHours()).padStart(2, '0')}.${String(nowTime.getMinutes()).padStart(2, '0')}`;
      setStatus('saved');
      setStatusMessage(`Tersimpan pukul ${timeStr}`);
    } else if (res.code === 'SESI_LAIN') {
      setIsReadOnly(true);
      setStatus('error');
      setStatusMessage('Ujian ini sedang dibuka di tempat lain. Tutup salah satunya.');
      if (onAnotherSessionActive) onAnotherSessionActive();
    } else if (res.code === 'WAKTU_HABIS') {
      setIsReadOnly(true);
      setStatus('error');
      setStatusMessage('Waktu ujian telah habis.');
      if (onSessionExpired) onSessionExpired();
    } else {
      // Gagal koneksi / jaringan: jadwalkan coba lagi dengan exponential backoff
      setStatus('offline');
      setStatusMessage('Tidak ada koneksi. Jawaban disimpan di perangkat ini dan dikirim otomatis saat tersambung.');

      const nextRetry = Math.min(30000, retryIntervalRef.current * 2);
      retryIntervalRef.current = nextRetry;

      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = setTimeout(() => {
        flushPendingQueue();
      }, retryIntervalRef.current);
    }
  }, [attemptId, sessionId, isReadOnly, onAnotherSessionActive, onSessionExpired]);

  // 4. Setter jawaban mahasiswa (menaikkan revisi lokal & menyalin ke IndexedDB)
  const setAnswer = useCallback(
    (questionId: string, value: any) => {
      if (isReadOnly) return;

      const currentRev = answersRef.current[questionId]?.revision || 0;
      const nextRev = currentRev + 1;
      const newItem: AnswerItem = {
        questionId,
        answer: value,
        revision: nextRev,
      };

      answersRef.current = {
        ...answersRef.current,
        [questionId]: newItem,
      };
      setAnswers((prev) => ({ ...prev, [questionId]: newItem }));
      pendingQueueRef.current[questionId] = newItem;

      // Simpan ke cadangan lokal segera
      setStoredLocalAnswers(storageKey, answersRef.current);

      setStatus('saving');
      setStatusMessage('Menyimpan…');

      // Debounce 1,5 detik untuk pengiriman server
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        flushPendingQueue();
      }, 1500);
    },
    [isReadOnly, storageKey, flushPendingQueue]
  );

  // 5. Heartbeat setiap 15 detik
  useEffect(() => {
    if (!sessionId || isReadOnly) return;

    const timer = setInterval(async () => {
      const res = await examHeartbeatAction(attemptId, sessionId);
      if (res.ok && res.serverNow) {
        serverOffsetRef.current = new Date(res.serverNow).getTime() - Date.now();
      } else if (res.code === 'SESI_LAIN') {
        setIsReadOnly(true);
        setStatus('error');
        setStatusMessage('Ujian ini sedang dibuka di tempat lain. Tutup salah satunya.');
        if (onAnotherSessionActive) onAnotherSessionActive();
      }
    }, 15000);

    return () => clearInterval(timer);
  }, [attemptId, sessionId, isReadOnly, onAnotherSessionActive]);

  // 6. Pencatat waktu sisa berdasarkan jam server
  useEffect(() => {
    if (!expiresAt) return;

    const expiryTime = new Date(expiresAt).getTime();

    const interval = setInterval(() => {
      const serverNow = Date.now() + serverOffsetRef.current;
      const remaining = Math.max(0, Math.floor((expiryTime - serverNow) / 1000));
      setRemainingSeconds(remaining);

      if (remaining <= 0 && !isReadOnly) {
        clearInterval(interval);
        if (isOnlineRef.current && sessionId) {
          // Kirim submit otomatis
          submitExamAction(attemptId, sessionId, `auto-expire-${attemptId}`).then(() => {
            setIsReadOnly(true);
            setStatusMessage('Waktu ujian telah berakhir.');
            if (onSessionExpired) onSessionExpired();
          });
        } else {
          setIsReadOnly(true);
          setStatusMessage('Waktu habis. Jawaban akan dikirim otomatis begitu tersambung.');
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, attemptId, sessionId, isReadOnly, onSessionExpired]);

  // 7. Penanganan online/offline dan event jendela/tab
  useEffect(() => {
    const handleOnline = () => {
      isOnlineRef.current = true;
      logTelemetryEvent('online');
      flushPendingQueue();
    };

    const handleOffline = () => {
      isOnlineRef.current = false;
      setStatus('offline');
      setStatusMessage('Tidak ada koneksi. Jawaban disimpan di perangkat ini dan dikirim otomatis saat tersambung.');
      logTelemetryEvent('offline');
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logTelemetryEvent('tab_hidden');
      } else {
        logTelemetryEvent('tab_visible');
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        logTelemetryEvent('fullscreen_exit');
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(pendingQueueRef.current).length > 0) {
        e.preventDefault();
        e.returnValue = 'Masih ada jawaban yang belum tersimpan di server. Tetap tinggalkan halaman?';
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [logTelemetryEvent, flushPendingQueue]);

  // 8. Submit manual oleh mahasiswa
  const submitExam = useCallback(
    async (idempotencyKey?: string) => {
      if (!sessionId) return { ok: false, pesan: 'Sesi ujian belum aktif.' };
      // Kirim jawaban pending terakhir terlebih dahulu
      await flushPendingQueue();

      const key = idempotencyKey || `manual-${attemptId}-${Date.now()}`;
      const res = await submitExamAction(attemptId, sessionId, key);
      if (res.ok) {
        setIsReadOnly(true);
        setStatus('saved');
        setStatusMessage('Ujian berhasil dikumpulkan.');
      }
      return res;
    },
    [attemptId, sessionId, flushPendingQueue]
  );

  return {
    answers,
    setAnswer,
    status,
    statusMessage,
    isReadOnly,
    remainingSeconds,
    expiresAt,
    submitExam,
    flushPendingQueue,
  };
}
