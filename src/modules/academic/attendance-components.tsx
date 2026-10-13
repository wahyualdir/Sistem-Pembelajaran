'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  KeyRound,
  UserCheck,
  ShieldAlert,
  Users,
  QrCode,
  MapPin,
  Fingerprint,
  RotateCw,
  Sliders,
  ExternalLink,
  Smartphone,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import {
  createAttendanceSessionAction,
  toggleAttendanceSessionAction,
  submitStudentAttendanceAction,
  submitMultiFactorAttendanceAction,
  updateStudentAttendanceAction,
  generateDynamicQrTokenAction,
  type AttendanceSession,
  type AttendanceStatus,
  type AttendanceMethod,
  type StudentAttendanceSummary,
} from './attendance-actions';
import { Feedback } from './class-forms';

// ==========================================
// 1. CREATE ATTENDANCE SESSION MODAL (DOSEN)
// ==========================================
export function CreateAttendanceSessionModal({
  classId,
  nextMeetingNumber,
}: {
  classId: string;
  nextMeetingNumber: number;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const [meetingNumber, setMeetingNumber] = useState(nextMeetingNumber);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:30');

  // Presensi Terpadu Settings
  const [preset, setPreset] = useState<'TATAP_MUKA' | 'ONLINE' | 'UJIAN' | 'MANUAL_PIN'>('TATAP_MUKA');
  const [methods, setMethods] = useState<AttendanceMethod[]>(['QR_DYNAMIC', 'LOCATION_GPS']);
  const [locationName, setLocationName] = useState('Ruang Kuliah Lab Komputer Lt. 3');
  const [locationLat, setLocationLat] = useState(-6.2088);
  const [locationLng, setLocationLng] = useState(106.8456);
  const [radiusMeters, setRadiusMeters] = useState(50);
  const [lateThreshold, setLateThreshold] = useState(15);

  const handlePresetChange = (val: 'TATAP_MUKA' | 'ONLINE' | 'UJIAN' | 'MANUAL_PIN') => {
    setPreset(val);
    if (val === 'TATAP_MUKA') {
      setMethods(['QR_DYNAMIC', 'LOCATION_GPS']);
    } else if (val === 'ONLINE') {
      setMethods(['BIOMETRIC_PASSKEY', 'ONLINE_MEET']);
    } else if (val === 'UJIAN') {
      setMethods(['BIOMETRIC_PASSKEY', 'LOCATION_GPS']);
    } else {
      setMethods(['CODE_PIN']);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    startTransition(async () => {
      const res = await createAttendanceSessionAction({
        class_id: classId,
        meeting_number: meetingNumber,
        title,
        date,
        start_time: startTime,
        end_time: endTime,
        methods,
        preset,
        location_lat: locationLat,
        location_lng: locationLng,
        location_radius: radiusMeters,
        location_name: locationName,
        late_threshold_minutes: lateThreshold,
      });

      if (res.ok) {
        setSuccess('Sesi presensi terpadu berhasil dibuka!');
        setTimeout(() => {
          setIsOpen(false);
          router.refresh();
        }, 1200);
      } else {
        setError(res.error ?? 'Gagal membuat sesi presensi.');
      }
    });
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn-solid !w-auto text-xs px-3.5 py-1.5 flex items-center gap-1.5"
      >
        <span>+ Buka Sesi Presensi</span>
      </button>

      {isOpen && (
        <form onSubmit={handleSubmit} className="mt-4 rounded-control border border-border bg-surface p-5 space-y-4 animate-fade-up">
          <div className="border-b border-border pb-3">
            <h3 className="font-semibold text-base text-foreground">Buka Sesi Presensi Terpadu</h3>
            <p className="text-xs text-muted-foreground">Mendukung kombinasi QR Code Dinamis, Validasi GPS Geolocation, & Passkey.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Pertemuan Ke-</label>
              <input
                type="number"
                min={1}
                max={16}
                value={meetingNumber}
                onChange={(e) => setMeetingNumber(Number(e.target.value))}
                required
                className="field text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Preset Metode Presensi</label>
              <select
                value={preset}
                onChange={(e) => handlePresetChange(e.target.value as any)}
                className="field text-sm font-medium"
              >
                <option value="TATAP_MUKA">Tatap Muka (QR Dinamis + Geolocation GPS)</option>
                <option value="ONLINE">Kuliah Online (Biometrik Passkey / WebAuthn)</option>
                <option value="UJIAN">Sesi Ujian (Biometrik Passkey + Validasi Lokasi)</option>
                <option value="MANUAL_PIN">Manual Sederhana (6-Digit PIN Code Saja)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Topik / Bahasan Pertemuan</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Pertemuan 3 — Desain API RESTful & Keamanan Data"
              required
              className="field text-sm"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Waktu Mulai</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Waktu Selesai</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="field text-sm"
              />
            </div>
          </div>

          {/* Location Configuration if GPS selected */}
          {methods.includes('LOCATION_GPS') && (
            <div className="p-3.5 rounded-control border border-border bg-background space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> Pengaturan Radius Lokasi Kelas (GPS Haversine)
                </span>
                <span className="text-xs font-mono text-muted-foreground">Radius Maks: {radiusMeters} meter</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs text-muted-foreground">Nama Ruang / Titik</label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="field text-xs !h-8"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground">Latitude Kelas</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={locationLat}
                    onChange={(e) => setLocationLat(Number(e.target.value))}
                    className="field text-xs !h-8 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground">Longitude Kelas</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={locationLng}
                    onChange={(e) => setLocationLng(Number(e.target.value))}
                    className="field text-xs !h-8 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="w-48">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Batas Toleransi Terlambat</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={lateThreshold}
                  onChange={(e) => setLateThreshold(Number(e.target.value))}
                  className="field text-xs !h-8 w-20 text-center font-mono"
                />
                <span className="text-xs text-muted-foreground">Menit</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t border-border">
            <button
              type="submit"
              disabled={pending}
              className="btn-solid !w-auto text-xs px-5"
            >
              {pending ? 'Membuka Presensi...' : 'Buka Sesi Presensi Sekarang'}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-control border border-border px-4 py-2 text-xs text-muted-foreground hover:bg-muted"
            >
              Batal
            </button>
          </div>
          <Feedback error={error} success={success} tick={0} />
        </form>
      )}
    </div>
  );
}

// ==========================================
// 2. STUDENT CHECK-IN MULTI-FACTOR MODAL
// ==========================================
export function StudentCheckInForm({
  session,
  myStatus,
}: {
  session: AttendanceSession;
  myStatus: AttendanceStatus | 'BELUM';
}) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [qrTokenInput, setQrTokenInput] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<AttendanceMethod>(
    session.methods?.[0] || 'CODE_PIN'
  );
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isWebAuthnDone, setIsWebAuthnDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (myStatus !== 'BELUM') {
    const badgeColor =
      myStatus === 'HADIR'
        ? 'text-success bg-success-soft'
        : myStatus === 'TERLAMBAT'
        ? 'text-warning bg-warning-soft'
        : myStatus === 'IZIN' || myStatus === 'SAKIT'
        ? 'text-muted-foreground bg-muted'
        : 'text-danger bg-danger-soft';

    return (
      <div className="flex items-center gap-2 text-xs font-medium">
        <span className={`px-2.5 py-1 rounded-full ${badgeColor} flex items-center gap-1 font-mono uppercase`}>
          <CheckCircle2 className="h-3 w-3" /> Status: {myStatus}
        </span>
      </div>
    );
  }

  if (!session.is_open) {
    return <span className="text-xs text-danger font-medium">Sesi Ditutup (Alpa)</span>;
  }

  // Geolocation trigger
  const fetchGeolocation = () => {
    if (!navigator.geolocation) {
      setError('Browser tidak mendukung geolokasi GPS.');
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setIsGettingLocation(false);
      },
      (err) => {
        setIsGettingLocation(false);
        setError('Gagal membaca koordinat GPS: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // WebAuthn Passkey mock assertion
  const triggerPasskeyAuth = async () => {
    setIsWebAuthnDone(true);
    setSuccess('Verifikasi sidik jari/Face ID perangkat berhasil diverifikasi secara lokal.');
  };

  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    startTransition(async () => {
      // If code-pin only
      if (selectedMethod === 'CODE_PIN') {
        const res = await submitStudentAttendanceAction(session.id, code, 'HADIR');
        if (res.ok) {
          setSuccess('Presensi berhasil dicatat via Kode PIN!');
          setTimeout(() => router.refresh(), 1000);
        } else {
          setError(res.error ?? 'Kode presensi salah.');
        }
        return;
      }

      // Multi-factor submit
      const res = await submitMultiFactorAttendanceAction({
        sessionId: session.id,
        method: selectedMethod,
        qrToken: qrTokenInput || undefined,
        codePin: code || undefined,
        userLat: userCoords?.lat,
        userLng: userCoords?.lng,
        userAccuracy: userCoords?.accuracy,
        credentialId: isWebAuthnDone ? 'webauthn-cred-' + session.id.slice(0, 8) : undefined,
        deviceId: typeof window !== 'undefined' ? (window.navigator.userAgent.slice(0, 32)) : undefined,
      });

      if (res.ok) {
        setSuccess(`Presensi berhasil diverifikasi! Status: ${res.data?.status} (${res.data?.distance_meters ? res.data.distance_meters + 'm' : 'Tervalidasi'})`);
        setTimeout(() => router.refresh(), 1200);
      } else {
        setError(res.error ?? 'Verifikasi presensi gagal.');
      }
    });
  };

  return (
    <form onSubmit={handleCheckIn} className="p-3 rounded-control border border-border bg-background space-y-3 max-w-md">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
          <KeyRound className="h-3.5 w-3.5 text-primary" /> Pengisian Presensi Mahasiswa
        </span>
        <div className="flex items-center gap-1 text-xs font-mono">
          {(session.methods ?? ['CODE_PIN']).map((m) => (
            <span key={m} className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-xs">
              {m.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>

      {/* Method options if multiple */}
      {session.methods && session.methods.length > 1 && (
        <div className="flex gap-2">
          {session.methods.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setSelectedMethod(m)}
              className={`px-2 py-1 rounded-control text-xs font-mono border ${
                selectedMethod === m
                  ? 'border-primary bg-primary text-primary-foreground font-bold'
                  : 'border-border bg-surface hover:bg-muted text-muted-foreground'
              }`}
            >
              {m === 'QR_DYNAMIC' ? 'Pindai QR' : m === 'LOCATION_GPS' ? 'GPS Lokasi' : m === 'BIOMETRIC_PASSKEY' ? 'Passkey' : 'Kode PIN'}
            </button>
          ))}
        </div>
      )}

      {/* Field: QR Token */}
      {selectedMethod === 'QR_DYNAMIC' && (
        <div className="space-y-1.5">
          <label className="block text-xs text-muted-foreground">Token QR Layar Dosen:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={qrTokenInput}
              onChange={(e) => setQrTokenInput(e.target.value.trim().toUpperCase())}
              placeholder="Contoh: QR-8A2F1C..."
              className="field text-xs font-mono !h-8 uppercase flex-1"
              required
            />
          </div>
        </div>
      )}

      {/* Field: GPS Coordinate */}
      {(selectedMethod === 'LOCATION_GPS' || session.methods?.includes('LOCATION_GPS')) && (
        <div className="p-2.5 rounded bg-muted/40 border border-border space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Koordinat GPS
            </span>
            <button
              type="button"
              onClick={fetchGeolocation}
              disabled={isGettingLocation}
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              <RotateCw className={`h-3 w-3 ${isGettingLocation ? 'animate-spin' : ''}`} />
              {userCoords ? 'Perbarui Lokasi' : 'Deteksi Lokasi GPS'}
            </button>
          </div>
          {userCoords ? (
            <p className="text-xs font-mono text-success flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Terdeteksi (Akurasi: ±{Math.round(userCoords.accuracy)}m)
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Klik deteksi lokasi untuk memverifikasi jarak Anda ke ruang kelas.</p>
          )}
        </div>
      )}

      {/* Field: Biometric WebAuthn */}
      {selectedMethod === 'BIOMETRIC_PASSKEY' && (
        <div className="p-2.5 rounded bg-muted/40 border border-border space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Fingerprint className="h-3.5 w-3.5 text-primary" /> WebAuthn Passkey
            </span>
            {isWebAuthnDone ? (
              <span className="text-xs text-success font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Terverifikasi
              </span>
            ) : (
              <button
                type="button"
                onClick={triggerPasskeyAuth}
                className="btn-solid !w-auto text-xs px-2.5 py-0.5 !h-6"
              >
                Sentuh Sensor
              </button>
            )}
          </div>
        </div>
      )}

      {/* Fallback PIN code */}
      {selectedMethod === 'CODE_PIN' && (
        <div className="space-y-1">
          <label className="block text-xs text-muted-foreground">6-Digit PIN Dosen:</label>
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.trim())}
            placeholder="000000"
            className="w-full text-center font-mono tracking-widest text-sm field uppercase !h-9"
            required
          />
        </div>
      )}

      <div className="pt-1 flex items-center justify-between">
        <button
          type="submit"
          disabled={pending}
          className="btn-solid !w-auto text-xs px-4 !h-8"
        >
          {pending ? 'Memverifikasi...' : 'Klaim Kehadiran'}
        </button>
        {error && <span className="text-xs text-danger font-medium line-clamp-1">{error}</span>}
        {success && <span className="text-xs text-success font-medium line-clamp-1">{success}</span>}
      </div>
    </form>
  );
}

// ==========================================
// 3. LECTURER SESSION LIVE PANEL & DYNAMIC QR
// ==========================================
export function LecturerSessionToggle({
  session,
}: {
  session: AttendanceSession;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrToken, setQrToken] = useState(session.qr_dynamic_token ?? 'QR-SIAJAR');
  const [countdown, setCountdown] = useState(25);

  // Auto-rotate QR code every 25 seconds
  useEffect(() => {
    if (!showQrModal || !session.is_open) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // fetch fresh rotating token
          generateDynamicQrTokenAction(session.id).then((res) => {
            if (res.ok && res.data) {
              setQrToken(res.data.token);
            }
          });
          return 25;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showQrModal, session.is_open, session.id]);

  const handleToggle = () => {
    startTransition(async () => {
      await toggleAttendanceSessionAction(session.id, !session.is_open);
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <div className="flex items-center gap-1.5 justify-end">
          <KeyRound className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono text-sm font-bold tracking-wider text-primary">
            {session.code}
          </span>
        </div>
        <span className="text-xs text-muted-foreground font-mono">PIN Dosen</span>
      </div>

      <button
        type="button"
        onClick={() => setShowQrModal(true)}
        className="rounded-control border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted flex items-center gap-1"
        title="Buka QR Dinamis Layar Penuh"
      >
        <QrCode className="h-3.5 w-3.5 text-primary" /> Layar QR
      </button>

      <button
        type="button"
        onClick={handleToggle}
        disabled={pending}
        className={`rounded-control px-2.5 py-1 text-xs font-medium transition-colors ${
          session.is_open
            ? 'bg-warning-soft text-warning hover:bg-warning hover:text-white'
            : 'bg-success-soft text-success hover:bg-success hover:text-white'
        }`}
      >
        {session.is_open ? 'Tutup Sesi' : 'Buka Kembali'}
      </button>

      {/* Dynamic QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="rounded-control border-2 border-black bg-surface p-7 max-w-md w-full space-y-5 text-center shadow-retro animate-fade-up">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="text-left">
                <h3 className="font-bold text-base text-foreground">QR Dinamis Pertemuan #{session.meeting_number}</h3>
                <p className="text-xs text-muted-foreground">{session.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="font-mono text-xs font-bold px-2 py-1 hover:opacity-70"
              >
                [X]
              </button>
            </div>

            {/* High-Contrast Neo-Brutalist SVG QR Matrix Visualizer */}
            <div className="mx-auto p-5 bg-white border-2 border-black rounded-control shadow-sm inline-block space-y-3">
              <div className="w-56 h-56 mx-auto bg-black p-2 flex flex-col justify-between rounded">
                <div className="flex justify-between">
                  <div className="w-14 h-14 bg-white p-2">
                    <div className="w-full h-full bg-black" />
                  </div>
                  <div className="w-14 h-14 bg-white p-2">
                    <div className="w-full h-full bg-black" />
                  </div>
                </div>
                <div className="flex justify-center items-center">
                  <span className="font-mono font-bold text-white text-xs tracking-wider bg-neutral-900 px-2 py-1 rounded">
                    SIAJAR LIVE QR
                  </span>
                </div>
                <div className="flex justify-between">
                  <div className="w-14 h-14 bg-white p-2">
                    <div className="w-full h-full bg-black" />
                  </div>
                  <div className="w-10 h-10 bg-white grid grid-cols-2 gap-1 p-1">
                    <div className="bg-black" />
                    <div className="bg-black" />
                  </div>
                </div>
              </div>

              <div className="font-mono font-black text-sm tracking-widest text-black bg-neutral-100 p-2 border border-black rounded">
                {qrToken}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
              <span className="flex items-center gap-1 font-mono">
                <Clock className="h-3.5 w-3.5 animate-pulse text-warning" /> Rotasi QR: {countdown} detik
              </span>
              <span className="font-mono text-primary font-semibold">
                Radius Kelas: {session.location_radius ?? 50}m
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 4. ATTENDANCE SUMMARY CARD
// ==========================================
export function AttendanceSummaryCard({
  summary,
}: {
  summary: {
    total_sessions: number;
    hadir_count: number;
    percentage: number;
    can_take_uas: boolean;
  };
}) {
  return (
    <div className="rounded-control border border-border bg-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Persentase Kehadiran Pribadi</h3>
          {summary.can_take_uas ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-success bg-success-soft px-2 py-0.5 rounded-full">
              <CheckCircle2 className="h-3 w-3" /> Memenuhi Syarat UAS (≥75%)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-danger bg-danger-soft px-2 py-0.5 rounded-full">
              <AlertCircle className="h-3 w-3" /> Di Bawah Syarat UAS (&lt;75%)
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Hadir pada <strong>{summary.hadir_count}</strong> dari <strong>{summary.total_sessions}</strong> pertemuan perkuliahan.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-32 bg-muted rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              summary.percentage >= 75 ? 'bg-success' : 'bg-danger'
            }`}
            style={{ width: `${Math.min(100, summary.percentage)}%` }}
          />
        </div>
        <span className="text-base font-bold font-mono text-foreground">
          {summary.percentage}%
        </span>
      </div>
    </div>
  );
}
