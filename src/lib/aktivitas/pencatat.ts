import { JenisAktivitas, ItemAktivitasHarian } from './tipe';
import { BOBOT_AKTIVITAS, BATAS_HARIAN_POIN } from './konfigurasi';
import { getTanggalWIB } from './waktu';
import { checkSupabaseOnline } from '../supabase/status';
import { createClient } from '../supabase/server';

export interface ParamCatatAktivitas {
  userId: string;
  kind: JenisAktivitas;
  classId?: string | null;
  date?: string; // Format 'YYYY-MM-DD', default WIB hari ini
  pointsBonus?: number;
  supabaseClient?: any;
}

export interface HasilCatatAktivitas {
  success: boolean;
  recordedPoints: number;
  totalDailyPoints: number;
  isCapped: boolean;
  mode: 'supabase' | 'memory';
}

function getMemoryStore(): ItemAktivitasHarian[] {
  return ((globalThis as any).__siajarAktivitasHarian ??= []);
}

/**
 * Reset memory store (khusus untuk testing).
 */
export function resetAktivitasHarianMemori(): void {
  (globalThis as any).__siajarAktivitasHarian = [];
}

/**
 * Menyuntikkan data aktivitas harian ke memory store (untuk seed/pengujian).
 */
export function seedAktivitasHarianMemori(items: ItemAktivitasHarian[]): void {
  const store = getMemoryStore();
  store.push(...items);
}

/**
 * Mencatat aktivitas pengguna secara atomik dengan penegakan bobot dan batas harian.
 * Mendukung dual-mode (Supabase RPC saat online, in-memory store saat offline/demo).
 */
export async function catatAktivitas(
  params: ParamCatatAktivitas
): Promise<HasilCatatAktivitas> {
  const { userId, kind, classId = null, pointsBonus = 0 } = params;
  const date = params.date || getTanggalWIB();

  const basePoints = (BOBOT_AKTIVITAS[kind] ?? 1) + pointsBonus;
  const cap = BATAS_HARIAN_POIN[kind];

  const isOnline = await checkSupabaseOnline();

  if (isOnline) {
    try {
      const client = params.supabaseClient || (await createClient());
      const { data, error } = await client.rpc('record_daily_activity', {
        p_user_id: userId,
        p_class_id: classId,
        p_date: date,
        p_kind: kind,
        p_points_to_add: basePoints,
        p_cap: cap,
      });

      if (!error && data) {
        return {
          success: true,
          recordedPoints: data.recorded_points ?? basePoints,
          totalDailyPoints: data.total_points ?? basePoints,
          isCapped: Boolean(data.is_capped),
          mode: 'supabase',
        };
      }
    } catch {
      // Fallback ke penyimpanan memori jika RPC gagal atau Supabase tidak responsif
    }
  }

  // Fallback In-Memory
  const store = getMemoryStore();
  const normalizedClassId = classId || null;

  let existing = store.find(
    (item) =>
      item.userId === userId &&
      item.date === date &&
      (item.classId || null) === normalizedClassId &&
      item.kind === kind
  );

  let currentPoints = existing ? existing.points : 0;
  let pointsToAdd = basePoints;
  let isCapped = false;

  if (cap !== null && cap !== undefined) {
    const remaining = Math.max(0, cap - currentPoints);
    if (remaining <= 0) {
      pointsToAdd = 0;
      isCapped = true;
    } else {
      pointsToAdd = Math.min(basePoints, remaining);
    }
  }

  if (existing) {
    existing.count += 1;
    existing.points += pointsToAdd;
  } else {
    existing = {
      id: `act-mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      classId: normalizedClassId,
      date,
      kind,
      count: 1,
      points: pointsToAdd,
    };
    store.push(existing);
  }

  // Hitung total poin harian pengguna pada tanggal tersebut
  const totalDailyPoints = store
    .filter((item) => item.userId === userId && item.date === date)
    .reduce((sum, item) => sum + item.points, 0);

  return {
    success: true,
    recordedPoints: pointsToAdd,
    totalDailyPoints,
    isCapped,
    mode: 'memory',
  };
}

export interface FilterAktivitas {
  userId: string;
  classId?: string | null;
  startDate?: string;
  endDate?: string;
}

/**
 * Mengambil daftar aktivitas harian seorang pengguna dengan filter opsional kelas dan rentang tanggal.
 */
export async function ambilAktivitasUser(
  filter: FilterAktivitas
): Promise<ItemAktivitasHarian[]> {
  const isOnline = await checkSupabaseOnline();

  if (isOnline) {
    try {
      const client = await createClient();
      let query = client
        .from('daily_activities')
        .select('*')
        .eq('user_id', filter.userId);

      if (filter.classId) {
        query = query.eq('class_id', filter.classId);
      }
      if (filter.startDate) {
        query = query.gte('date', filter.startDate);
      }
      if (filter.endDate) {
        query = query.lte('date', filter.endDate);
      }

      const { data, error } = await query.order('date', { ascending: true });
      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          classId: d.class_id,
          date: d.date,
          kind: d.kind as JenisAktivitas,
          count: d.count,
          points: d.points,
        }));
      }
    } catch {
      // Fallback ke memori
    }
  }

  const store = getMemoryStore();
  return store.filter((item) => {
    if (item.userId !== filter.userId) return false;
    if (filter.classId && item.classId !== filter.classId) return false;
    if (filter.startDate && item.date < filter.startDate) return false;
    if (filter.endDate && item.date > filter.endDate) return false;
    return true;
  });
}

/**
 * Mengambil ringkasan aktivitas gabungan seluruh kelas tanpa identitas nama siswa (agregat anonim).
 * Digunakan untuk visualisasi Dosen/Asisten di tab aktivitas kelas.
 */
export async function ambilAktivitasKelasAgregat(params: {
  classId: string;
  startDate?: string;
  endDate?: string;
}): Promise<ItemAktivitasHarian[]> {
  const isOnline = await checkSupabaseOnline();

  if (isOnline) {
    try {
      const client = await createClient();
      let query = client
        .from('daily_activities')
        .select('date, kind, count, points')
        .eq('class_id', params.classId);

      if (params.startDate) query = query.gte('date', params.startDate);
      if (params.endDate) query = query.lte('date', params.endDate);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        // Gabungkan per tanggal dan kind
        const aggregated: Record<string, ItemAktivitasHarian> = {};
        for (const row of data) {
          const key = `${row.date}_${row.kind}`;
          if (!aggregated[key]) {
            aggregated[key] = {
              userId: 'anonymous',
              classId: params.classId,
              date: row.date,
              kind: row.kind as JenisAktivitas,
              count: 0,
              points: 0,
            };
          }
          aggregated[key].count += row.count;
          aggregated[key].points += row.points;
        }
        return Object.values(aggregated);
      }
    } catch {
      // Fallback ke memori
    }
  }

  const store = getMemoryStore();
  const aggregated: Record<string, ItemAktivitasHarian> = {};
  for (const item of store) {
    if (item.classId !== params.classId) continue;
    if (params.startDate && item.date < params.startDate) continue;
    if (params.endDate && item.date > params.endDate) continue;

    const key = `${item.date}_${item.kind}`;
    if (!aggregated[key]) {
      aggregated[key] = {
        userId: 'anonymous',
        classId: params.classId,
        date: item.date,
        kind: item.kind,
        count: 0,
        points: 0,
      };
    }
    aggregated[key].count += item.count;
    aggregated[key].points += item.points;
  }
  return Object.values(aggregated);
}

/**
 * Mengambil ringkasan aktivitas per anggota kelas (untuk daftar drilldown pengajar).
 */
export async function ambilAktivitasAnggotaKelas(params: {
  classId: string;
  startDate?: string;
  endDate?: string;
}): Promise<
  {
    userId: string;
    totalPoints: number;
    totalCount: number;
    activeDays: number;
    lastActiveDate: string | null;
  }[]
> {
  const store = getMemoryStore();
  const perUser: Record<
    string,
    {
      totalPoints: number;
      totalCount: number;
      dates: Set<string>;
    }
  > = {};

  for (const item of store) {
    if (item.classId !== params.classId) continue;
    if (params.startDate && item.date < params.startDate) continue;
    if (params.endDate && item.date > params.endDate) continue;

    if (!perUser[item.userId]) {
      perUser[item.userId] = {
        totalPoints: 0,
        totalCount: 0,
        dates: new Set(),
      };
    }
    perUser[item.userId].totalPoints += item.points;
    perUser[item.userId].totalCount += item.count;
    if (item.points > 0 || item.count > 0) {
      perUser[item.userId].dates.add(item.date);
    }
  }

  return Object.entries(perUser).map(([userId, stats]) => {
    const datesArr = Array.from(stats.dates).sort();
    return {
      userId,
      totalPoints: stats.totalPoints,
      totalCount: stats.totalCount,
      activeDays: stats.dates.size,
      lastActiveDate: datesArr.length > 0 ? datesArr[datesArr.length - 1] : null,
    };
  });
}
