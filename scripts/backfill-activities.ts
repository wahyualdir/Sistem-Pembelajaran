/**
 * Skrip Backfill Idempoten: Mengisi Tabel daily_activities dari Rekam Data Historis
 *
 * Penggunaan:
 *   npx tsx scripts/backfill-activities.ts            # Mode default: Dry-Run (hanya simulasi)
 *   npx tsx scripts/backfill-activities.ts --apply    # Eksekusi migrasi data aktual
 *   npx tsx scripts/backfill-activities.ts --apply --class-id=<uuid>
 */

import { BOBOT_AKTIVITAS, BATAS_HARIAN_POIN, JenisAktivitas } from '../src/lib/aktivitas/konfigurasi';
import { getTanggalWIB } from '../src/lib/aktivitas/waktu';

interface RowKandidat {
  userId: string;
  classId: string | null;
  date: string;
  kind: JenisAktivitas;
}

async function main() {
  const args = process.argv.slice(2);
  const isApply = args.includes('--apply') || args.includes('--write');
  const classIdArg = args.find((a) => a.startsWith('--class-id='))?.split('=')[1];
  const userIdArg = args.find((a) => a.startsWith('--user-id='))?.split('=')[1];

  console.log('================================================================');
  console.log('  SKRIP BACKFILL HISTORIS FITUR GRAFIK KONTRIBUSI SIAJAR        ');
  console.log('================================================================');
  console.log(`Mode Operasi : ${isApply ? '🚀 APPLY (Menulis ke database/store)' : '🔍 DRY-RUN (Hanya simulasi)'}`);
  if (classIdArg) console.log(`Filter Kelas : ${classIdArg}`);
  if (userIdArg) console.log(`Filter User  : ${userIdArg}`);
  console.log('----------------------------------------------------------------');

  const candidates: RowKandidat[] = [];

  // 1. Pindai submissions (kumpul_tugas)
  const tugasStore = (globalThis as any).__siajarTugas ?? { assignments: [], submissions: [] };
  for (const s of tugasStore.submissions || []) {
    if (!s.student_id) continue;
    const assignment = tugasStore.assignments.find((a: any) => a.id === s.assignment_id);
    const date = getTanggalWIB(s.submitted_at || new Date());
    candidates.push({
      userId: s.student_id,
      classId: assignment?.class_id ?? null,
      date,
      kind: 'kumpul_tugas',
    });
  }

  // 2. Pindai presensi (hadir_presensi)
  const presensiStore = (globalThis as any).__siajarPresensi ?? { sessions: [], records: [] };
  for (const r of presensiStore.records || []) {
    if (!r.student_id) continue;
    const session = presensiStore.sessions.find((s: any) => s.id === r.session_id);
    const date = getTanggalWIB(r.recorded_at || r.check_in_at || new Date());
    candidates.push({
      userId: r.student_id,
      classId: session?.class_id ?? null,
      date,
      kind: 'hadir_presensi',
    });
  }

  // 3. Pindai kuis attempts (selesai_kuis)
  const quizStore = (globalThis as any).__siajarKuis ?? { quizzes: [], attempts: [] };
  for (const a of quizStore.attempts || []) {
    if (!a.student_id) continue;
    const quiz = quizStore.quizzes.find((q: any) => q.id === a.quiz_id);
    const date = getTanggalWIB(a.submitted_at || a.finished_at || new Date());
    candidates.push({
      userId: a.student_id,
      classId: quiz?.class_id ?? null,
      date,
      kind: 'selesai_kuis',
    });
  }

  // 4. Pindai forum topik & balasan
  const forumTopics = (globalThis as any).__siajarForumTopics ?? [];
  for (const t of forumTopics) {
    if (!t.author_id) continue;
    candidates.push({
      userId: t.author_id,
      classId: t.class_id ?? null,
      date: getTanggalWIB(t.created_at || new Date()),
      kind: 'topik_diskusi',
    });
  }

  const forumReplies = (globalThis as any).__siajarForumReplies ?? [];
  for (const rep of forumReplies) {
    if (!rep.author_id) continue;
    candidates.push({
      userId: rep.author_id,
      classId: rep.class_id ?? null,
      date: getTanggalWIB(rep.created_at || new Date()),
      kind: 'balas_diskusi',
    });
  }

  // 5. Pindai materi & pengumuman
  const materiStore = (globalThis as any).__siajarMateri ?? [];
  for (const m of materiStore) {
    if (!m.created_by) continue;
    candidates.push({
      userId: m.created_by,
      classId: m.class_id ?? null,
      date: getTanggalWIB(m.created_at || new Date()),
      kind: 'terbit_materi',
    });
  }

  const pengumumanStore = (globalThis as any).__siajarPengumuman ?? [];
  for (const p of pengumumanStore) {
    if (!p.author_id) continue;
    candidates.push({
      userId: p.author_id,
      classId: p.class_id ?? null,
      date: getTanggalWIB(p.created_at || new Date()),
      kind: 'terbit_pengumuman',
    });
  }

  // 6. Pindai tugas & kuis oleh dosen
  for (const a of tugasStore.assignments || []) {
    if (!a.created_by) continue;
    candidates.push({
      userId: a.created_by,
      classId: a.class_id ?? null,
      date: getTanggalWIB(a.created_at || new Date()),
      kind: 'terbit_tugas',
    });
  }

  for (const q of quizStore.quizzes || []) {
    if (!q.created_by) continue;
    candidates.push({
      userId: q.created_by,
      classId: q.class_id ?? null,
      date: getTanggalWIB(q.created_at || new Date()),
      kind: 'buat_kuis',
    });
  }

  // 7. Pindai penilaian
  const nilaiStore = (globalThis as any).__siajarNilai ?? [];
  for (const g of nilaiStore) {
    if (g.graded_by) {
      candidates.push({
        userId: g.graded_by,
        classId: g.class_id ?? null,
        date: getTanggalWIB(g.created_at || new Date()),
        kind: 'review_pengumpulan',
      });
    }
    if (g.finalized_by) {
      candidates.push({
        userId: g.finalized_by,
        classId: g.class_id ?? null,
        date: getTanggalWIB(g.finalized_at || new Date()),
        kind: 'finalisasi_nilai',
      });
    }
  }

  // Filter opsional
  const filtered = candidates.filter((c) => {
    if (classIdArg && c.classId !== classIdArg) return false;
    if (userIdArg && c.userId !== userIdArg) return false;
    return true;
  });

  console.log(`Ditemukan ${filtered.length} riwayat peristiwa aktivitas.`);

  // Agregasi idempoten per (user_id, date, class_id, kind)
  const mapAgregat = new Map<
    string,
    {
      userId: string;
      classId: string | null;
      date: string;
      kind: JenisAktivitas;
      count: number;
      points: number;
    }
  >();

  for (const item of filtered) {
    const key = `${item.userId}_${item.date}_${item.classId || 'null'}_${item.kind}`;
    let entry = mapAgregat.get(key);
    if (!entry) {
      entry = {
        userId: item.userId,
        classId: item.classId,
        date: item.date,
        kind: item.kind,
        count: 0,
        points: 0,
      };
      mapAgregat.set(key, entry);
    }

    const bobot = BOBOT_AKTIVITAS[item.kind] ?? 1;
    const cap = BATAS_HARIAN_POIN[item.kind];

    entry.count += 1;
    if (cap !== null && cap !== undefined) {
      const allowed = Math.max(0, cap - entry.points);
      entry.points += Math.min(bobot, allowed);
    } else {
      entry.points += bobot;
    }
  }

  const listBaris = Array.from(mapAgregat.values());
  console.log(`Dihasilkan ${listBaris.length} baris agregat unik untuk daily_activities.`);

  // Rekap per jenis aktivitas
  const rekapKind: Record<string, number> = {};
  for (const b of listBaris) {
    rekapKind[b.kind] = (rekapKind[b.kind] || 0) + b.count;
  }
  console.log('\nRincian jenis aktivitas yang diproses:');
  for (const [k, c] of Object.entries(rekapKind)) {
    console.log(`  - ${k.padEnd(20)}: ${c} total aksi`);
  }

  if (!isApply) {
    console.log('\n[Dry-Run Selesai] Tidak ada data yang ditulis ke database. Gunakan flag --apply untuk mengeksekusi.');
    return;
  }

  // Eksekusi APPLY
  console.log('\nMengeksekusi penulisan idempoten...');
  const storeAktivitas = ((globalThis as any).__siajarAktivitasHarian ??= []);
  let inserted = 0;
  let updated = 0;

  for (const b of listBaris) {
    const existingIdx = storeAktivitas.findIndex(
      (s: any) =>
        s.userId === b.userId &&
        s.date === b.date &&
        (s.classId || null) === (b.classId || null) &&
        s.kind === b.kind
    );

    if (existingIdx >= 0) {
      storeAktivitas[existingIdx] = {
        ...storeAktivitas[existingIdx],
        count: Math.max(storeAktivitas[existingIdx].count, b.count),
        points: Math.max(storeAktivitas[existingIdx].points, b.points),
      };
      updated++;
    } else {
      storeAktivitas.push({
        id: `backfill-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        ...b,
      });
      inserted++;
    }
  }

  console.log(`✅ SUKSES: ${inserted} baris baru dimasukkan, ${updated} baris diperbarui.`);
}

main().catch((err) => {
  console.error('❌ Gagal menjalankan backfill:', err);
  process.exit(1);
});
