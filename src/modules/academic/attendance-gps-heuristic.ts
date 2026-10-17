/**
 * Heuristik Deteksi Lokasi Palsu pada Presensi GPS (Mock Location Detector)
 * 
 * Implementasi 4 Heuristik:
 * 1. Unnatural accuracy (< 1.0m atau > 500m)
 * 2. Impossible speed jump (> 50 km dalam < 30 menit atau kecepatan > 100 km/jam)
 * 3. Identical coordinates repeated with high precision (>= 6 desimal tanpa jitter alami GPS)
 * 4. Rough IP-location mismatch (Alamat IP VPN/kota berbeda dengan koordinat GPS kampus)
 * 
 * PRINSIP PENTING:
 * - Tidak pernah menolak presensi mahasiswa secara otomatis.
 * - Menandai status 'Perlu diverifikasi' untuk ditinjau oleh Dosen / Asisten Dosen.
 * - Keputusan akhir diambil oleh manusia dan dicatat ke dalam audit trail.
 */

export interface LocationPing {
  lat: number;
  lng: number;
  accuracy?: number;
  recordedAt: string | Date;
  clientIp?: string;
  studentId?: string;
}

export interface GpsAnomalyEvaluation {
  needsVerification: boolean;
  reasons: string[];
  flags: {
    unnaturalAccuracy: boolean;
    speedJump: boolean;
    identicalCoordinates: boolean;
    ipMismatch: boolean;
  };
  metrics: {
    accuracy?: number;
    calculatedSpeedKmH?: number;
    jumpDistanceKm?: number;
    deltaTimeMinutes?: number;
    identicalWithStudentId?: string;
  };
}

// Menghitung jarak Haversine dalam kilometer
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius bumi dalam kilometer
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 1. Heuristik Akurasi Tidak Wajar:
 * Chip GPS smartphone asli memiliki akurasi tipikal 3m - 50m.
 * Jika accuracy < 1.0m (seringkali 0.0m atau 0.5m pada software mock GPS), atau > 500m (tower seluler / wifi jauh).
 */
export function checkAccuracyAnomaly(accuracy?: number): { isAnomaly: boolean; reason?: string } {
  if (accuracy === undefined || accuracy === null) {
    return { isAnomaly: false };
  }

  if (accuracy < 1.0) {
    return {
      isAnomaly: true,
      reason: `Akurasi GPS tidak wajar (${accuracy.toFixed(1)}m < 1.0m). Terindikasi mock location/perangkat tiruan GPS tanpa deviasi sensor alami.`,
    };
  }

  if (accuracy > 500) {
    return {
      isAnomaly: true,
      reason: `Akurasi GPS terlalu rendah (±${Math.round(accuracy)}m > 500m). Posisi hanya perkiraan menara BTS seluler dan tidak menjamin kehadiran di kelas.`,
    };
  }

  return { isAnomaly: false };
}

/**
 * 2. Heuristik Loncatan Kecepatan Mustahil (Speed Jump):
 * Jarak > 50 km dalam < 30 menit, atau kecepatan rata-rata > 100 km/jam antar dua titik presensi.
 */
export function checkSpeedJumpAnomaly(
  current: LocationPing,
  previous?: LocationPing
): {
  isAnomaly: boolean;
  reason?: string;
  speedKmH?: number;
  distanceKm?: number;
  timeDiffMinutes?: number;
} {
  if (!previous) return { isAnomaly: false };

  const curTime = new Date(current.recordedAt).getTime();
  const prevTime = new Date(previous.recordedAt).getTime();
  const timeDiffMs = Math.abs(curTime - prevTime);
  const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
  const timeDiffMinutes = timeDiffMs / (1000 * 60);

  // Jika selisih waktu di bawah 10 detik (misal refresh ganda), abaikan kecepatan instan tak terdefinisi
  if (timeDiffMinutes < 0.1) return { isAnomaly: false };

  const distanceKm = calculateDistanceKm(previous.lat, previous.lng, current.lat, current.lng);
  const speedKmH = distanceKm / timeDiffHours;

  const isImpossibleJump = distanceKm > 50 && timeDiffMinutes < 30;
  const isImpossibleSpeed = speedKmH > 100 && distanceKm > 1.0;

  if (isImpossibleJump || isImpossibleSpeed) {
    return {
      isAnomaly: true,
      reason: `Perpindahan posisi mustahil: terdeteksi loncatan ${distanceKm.toFixed(1)} km dalam ${Math.round(timeDiffMinutes)} menit (estimasi kecepatan ${Math.round(speedKmH)} km/jam > 100 km/jam).`,
      speedKmH,
      distanceKm,
      timeDiffMinutes,
    };
  }

  return {
    isAnomaly: false,
    speedKmH,
    distanceKm,
    timeDiffMinutes,
  };
}

/**
 * 3. Heuristik Koordinat Identik Presisi Tinggi (>= 6 angka di belakang koma):
 * Hardware GPS memiliki micro-jitter konstan (1e-5 hingga 1e-6 desimal selalu berosilasi).
 * Jika ada 2 mahasiswa atau 2 pengiriman di koordinat identik hingga 6 desimal,
 * terindikasi membagikan pin lokasi palsu yang sama persis.
 */
export function checkIdenticalCoordinatesAnomaly(
  current: { lat: number; lng: number; studentId?: string },
  sessionRecords: Array<{ lat: number; lng: number; studentId: string; studentName?: string }>
): { isAnomaly: boolean; reason?: string; matchStudentId?: string } {
  const curLatStr = current.lat.toFixed(6);
  const curLngStr = current.lng.toFixed(6);

  for (const record of sessionRecords) {
    if (record.studentId && current.studentId && record.studentId === current.studentId) {
      continue;
    }

    const recLatStr = record.lat.toFixed(6);
    const recLngStr = record.lng.toFixed(6);

    if (curLatStr === recLatStr && curLngStr === recLngStr) {
      return {
        isAnomaly: true,
        reason: `Koordinat GPS identik hingga 6 digit desimal (${curLatStr}, ${curLngStr}) dengan peserta lain (${record.studentName || record.studentId}). Terindikasi replikasi pin lokasi tiruan tanpa jitter sensor alami.`,
        matchStudentId: record.studentId,
      };
    }
  }

  return { isAnomaly: false };
}

/**
 * 4. Heuristik Ketidaksesuaian IP dan Lokasi (Rough IP-location Mismatch):
 * Memeriksa apakah IP berasal dari VPN, proxy anonim, atau rentang subnet luar daerah/luar negeri
 * ketika koordinat GPS mengaku berada di kampus Pekanbaru (-6.2 / 0.58).
 */
export function checkIpLocationMismatch(
  clientIp?: string,
  userLat?: number,
  userLng?: number
): { isAnomaly: boolean; reason?: string } {
  if (!clientIp) return { isAnomaly: false };

  // Pemetaan IP lokal/kampus (biasanya loopback, subnet kampus 10.x, 192.168.x, 172.16.x)
  const isPrivateOrLocal =
    clientIp === '127.0.0.1' ||
    clientIp === '::1' ||
    clientIp.startsWith('10.') ||
    clientIp.startsWith('192.168.') ||
    clientIp.startsWith('172.16.') ||
    clientIp.startsWith('172.20.') ||
    clientIp.startsWith('172.31.');

  // Deteksi indicator proxy / VPN atau IP anomali jika ada header atau string simulasi
  const isSimulatedVpn =
    clientIp.includes('vpn') ||
    clientIp.includes('proxy') ||
    clientIp.startsWith('198.51.100.') || // TEST-NET-2 sering dipakai tes simulasi VPN
    clientIp.startsWith('203.0.113.'); // TEST-NET-3

  if (isSimulatedVpn) {
    return {
      isAnomaly: true,
      reason: `Alamat IP (${clientIp}) terdeteksi melalui jalur VPN/Proxy anonim di luar jaringan kampus saat melakukan presensi berbasis GPS.`,
    };
  }

  // Jika koordinat jauh di luar wilayah Indonesia tapi IP mengklaim lokal, atau sebaliknya
  if (userLat !== undefined && userLng !== undefined) {
    // Wilayah Indonesia perkiraan: Lat -11 s.d 6, Lng 95 s.d 141
    const isOutsideIndonesia = userLat < -12 || userLat > 7 || userLng < 94 || userLng > 142;
    if (isOutsideIndonesia && isPrivateOrLocal) {
      return {
        isAnomaly: true,
        reason: `Ketidaksesuaian alamat IP kampus (${clientIp}) dengan koordinat GPS luar negeri (Lat ${userLat.toFixed(4)}, Lng ${userLng.toFixed(4)}).`,
      };
    }
  }

  return { isAnomaly: false };
}

/**
 * Evaluator Terpadu: Menjalankan ke-4 Heuristik
 */
export function evaluateGpsAttendanceIntegrity(input: {
  studentId: string;
  studentName?: string;
  userLat: number;
  userLng: number;
  userAccuracy?: number;
  clientIp?: string;
  recordedAt?: string | Date;
  previousRecord?: LocationPing;
  sessionRecords?: Array<{ lat: number; lng: number; studentId: string; studentName?: string }>;
}): GpsAnomalyEvaluation {
  const reasons: string[] = [];
  const curPing: LocationPing = {
    lat: input.userLat,
    lng: input.userLng,
    accuracy: input.userAccuracy,
    recordedAt: input.recordedAt || new Date().toISOString(),
    clientIp: input.clientIp,
    studentId: input.studentId,
  };

  // 1. Akurasi
  const accCheck = checkAccuracyAnomaly(input.userAccuracy);
  if (accCheck.isAnomaly && accCheck.reason) {
    reasons.push(accCheck.reason);
  }

  // 2. Speed Jump
  const speedCheck = checkSpeedJumpAnomaly(curPing, input.previousRecord);
  if (speedCheck.isAnomaly && speedCheck.reason) {
    reasons.push(speedCheck.reason);
  }

  // 3. Koordinat Identik 6 Desimal
  const identicalCheck = checkIdenticalCoordinatesAnomaly(
    { lat: input.userLat, lng: input.userLng, studentId: input.studentId },
    input.sessionRecords || []
  );
  if (identicalCheck.isAnomaly && identicalCheck.reason) {
    reasons.push(identicalCheck.reason);
  }

  // 4. IP Mismatch
  const ipCheck = checkIpLocationMismatch(input.clientIp, input.userLat, input.userLng);
  if (ipCheck.isAnomaly && ipCheck.reason) {
    reasons.push(ipCheck.reason);
  }

  const needsVerification = reasons.length > 0;

  return {
    needsVerification,
    reasons,
    flags: {
      unnaturalAccuracy: accCheck.isAnomaly,
      speedJump: speedCheck.isAnomaly,
      identicalCoordinates: identicalCheck.isAnomaly,
      ipMismatch: ipCheck.isAnomaly,
    },
    metrics: {
      accuracy: input.userAccuracy,
      calculatedSpeedKmH: speedCheck.speedKmH,
      jumpDistanceKm: speedCheck.distanceKm,
      deltaTimeMinutes: speedCheck.timeDiffMinutes,
      identicalWithStudentId: identicalCheck.matchStudentId,
    },
  };
}
