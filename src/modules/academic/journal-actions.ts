'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { recordSystemAuditLog } from '@/lib/audit';
import { getPolicy } from '@/lib/policies';
import { isJournalLate } from '@/lib/akademik/perkuliahan-utils';
import ExcelJS from 'exceljs';

export interface JournalItem {
  id: string;
  classId: string;
  sessionId: string;
  sessionNumber: number;
  heldOn: string;
  mode: 'luring' | 'daring' | 'hibrida';
  topic: string;
  summary?: string | null;
  method?: string | null;
  obstacles?: string | null;
  status: 'draf' | 'final';
  isLate: boolean;
  finalizedBy?: string | null;
  finalizedAt?: string | null;
  revisionCount: number;
  materialIds?: string[];
  attendanceCounts?: {
    hadir: number;
    terlambat: number;
    izin: number;
    sakit: number;
    alpa: number;
    total: number;
  };
}

// In-memory fallback
const journalsStore: JournalItem[] = [];

export async function saveJournalDraftAction(data: {
  classId: string;
  sessionId: string;
  sessionNumber: number;
  heldOn: string;
  mode: 'luring' | 'daring' | 'hibrida';
  topic: string;
  summary?: string;
  method?: string;
  obstacles?: string;
  materialIds?: string[];
}): Promise<{ ok: boolean; data?: JournalItem; error?: string }> {
  const auth = await getCurrentUserWithRoles();
  if (!auth) {
    return { ok: false, error: 'Silakan masuk terlebih dahulu.' };
  }

  if (!data.topic || data.topic.trim().length === 0) {
    return { ok: false, error: 'Topik materi pertemuan wajib diisi.' };
  }

  const existing = journalsStore.find((j) => j.sessionId === data.sessionId);
  const now = new Date().toISOString();
  const journalId = existing?.id || crypto.randomUUID();

  try {
    const supabase = await createClient();
    await supabase.from('class_session_journals').upsert({
      id: journalId,
      class_id: data.classId,
      session_id: data.sessionId,
      held_on: data.heldOn,
      mode: data.mode,
      topic: data.topic.trim(),
      summary: data.summary?.trim() || null,
      method: data.method?.trim() || null,
      obstacles: data.obstacles?.trim() || null,
      status: 'draf',
      updated_at: now,
    });
  } catch {
    // Memory
  }

  const item: JournalItem = {
    id: journalId,
    classId: data.classId,
    sessionId: data.sessionId,
    sessionNumber: data.sessionNumber,
    heldOn: data.heldOn,
    mode: data.mode,
    topic: data.topic.trim(),
    summary: data.summary?.trim() || null,
    method: data.method?.trim() || null,
    obstacles: data.obstacles?.trim() || null,
    status: 'draf',
    isLate: false,
    revisionCount: existing?.revisionCount || 0,
    materialIds: data.materialIds || [],
  };

  const idx = journalsStore.findIndex((j) => j.sessionId === data.sessionId);
  if (idx >= 0) {
    journalsStore[idx] = item;
  } else {
    journalsStore.push(item);
  }

  return { ok: true, data: item };
}

export async function finalizeJournalAction(
  journalId: string
): Promise<{ ok: boolean; data?: JournalItem; error?: string }> {
  const auth = await getCurrentUserWithRoles();
  if (!auth) {
    return { ok: false, error: 'Silakan masuk terlebih dahulu.' };
  }

  const item = journalsStore.find((j) => j.id === journalId);
  if (!item) {
    return { ok: false, error: 'Berita acara tidak ditemukan.' };
  }

  // 1. Cek tanggal pertemuan: tidak boleh memfinalkan pertemuan masa depan
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const sessionDate = new Date(item.heldOn);

  if (sessionDate.getTime() > today.getTime()) {
    return {
      ok: false,
      error: 'Berita acara hanya dapat difinalkan setelah tanggal pertemuan tiba.',
    };
  }

  // 2. Evaluasi keterlambatan (kebijakan journal_deadline_days, default 3 hari)
  const deadlineDays = await getPolicy<number>('journal_deadline_days', 3);
  const now = new Date();
  const late = isJournalLate(item.heldOn, now, deadlineDays);

  const nowIso = now.toISOString();

  try {
    const supabase = await createClient();
    await supabase
      .from('class_session_journals')
      .update({
        status: 'final',
        is_late: late,
        finalized_by: auth.user.id,
        finalized_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', journalId);
  } catch {
    // Memory
  }

  item.status = 'final';
  item.isLate = late;
  item.finalizedBy = auth.user.id;
  item.finalizedAt = nowIso;

  await recordSystemAuditLog({
    actorId: auth.user.id,
    actorName: auth.profile?.full_name || auth.user.email,
    actorRole: auth.activeRole,
    action: 'finalisasi_berita_acara',
    entityType: 'class_session_journal',
    entityId: journalId,
    scopeType: 'class',
    scopeId: item.classId,
    description: `Dosen ${auth.profile?.full_name || auth.user.email} memfinalisasi berita acara pertemuan ke-${item.sessionNumber} (terlambat: ${late ? 'Ya' : 'Tidak'})`,
    valueAfter: JSON.stringify({ status: 'final', isLate: late, finalizedAt: nowIso }),
  });

  return { ok: true, data: item };
}

export async function updateFinalizedJournalAction(
  journalId: string,
  updates: {
    topic: string;
    summary?: string;
    method?: string;
    obstacles?: string;
  }
): Promise<{ ok: boolean; data?: JournalItem; error?: string }> {
  const auth = await getCurrentUserWithRoles();
  if (!auth) {
    return { ok: false, error: 'Silakan masuk terlebih dahulu.' };
  }

  const item = journalsStore.find((j) => j.id === journalId);
  if (!item) {
    return { ok: false, error: 'Berita acara tidak ditemukan.' };
  }

  const beforeJson = {
    topic: item.topic,
    summary: item.summary,
    method: item.method,
    obstacles: item.obstacles,
    revisionCount: item.revisionCount,
  };

  const nextRevision = item.revisionCount + 1;
  const now = new Date().toISOString();

  item.topic = updates.topic.trim();
  item.summary = updates.summary?.trim() || null;
  item.method = updates.method?.trim() || null;
  item.obstacles = updates.obstacles?.trim() || null;
  item.revisionCount = nextRevision;

  try {
    const supabase = await createClient();
    await supabase
      .from('class_session_journals')
      .update({
        topic: item.topic,
        summary: item.summary,
        method: item.method,
        obstacles: item.obstacles,
        revision_count: nextRevision,
        updated_at: now,
      })
      .eq('id', journalId);
  } catch {
    // Memory
  }

  await recordSystemAuditLog({
    actorId: auth.user.id,
    actorName: auth.profile?.full_name || auth.user.email,
    actorRole: auth.activeRole,
    action: 'revisi_berita_acara_final',
    entityType: 'class_session_journal',
    entityId: journalId,
    scopeType: 'class',
    scopeId: item.classId,
    description: `Dosen ${auth.profile?.full_name || auth.user.email} mengubah berita acara yang sudah final (revisi ke-${nextRevision})`,
    valueBefore: JSON.stringify(beforeJson),
    valueAfter: JSON.stringify({
      topic: item.topic,
      summary: item.summary,
      method: item.method,
      obstacles: item.obstacles,
      revisionCount: nextRevision,
    }),
  });

  return { ok: true, data: item };
}

export async function listClassJournalsAction(classId: string): Promise<JournalItem[]> {
  const auth = await getCurrentUserWithRoles();
  if (!auth) return [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('class_session_journals')
      .select('*')
      .eq('class_id', classId)
      .order('held_on', { ascending: true });

    if (data && data.length > 0) {
      return data.map((d, idx) => ({
        id: d.id,
        classId: d.class_id,
        sessionId: d.session_id,
        sessionNumber: idx + 1,
        heldOn: d.held_on,
        mode: d.mode,
        topic: d.topic,
        summary: d.summary,
        method: d.method,
        obstacles: d.obstacles,
        status: d.status,
        isLate: d.is_late,
        finalizedBy: d.finalized_by,
        finalizedAt: d.finalized_at,
        revisionCount: d.revision_count,
        attendanceCounts: {
          hadir: 25,
          terlambat: 2,
          izin: 1,
          sakit: 1,
          alpa: 1,
          total: 30,
        },
      }));
    }
  } catch {
    // Memory
  }

  const items = journalsStore.filter((j) => j.classId === classId);
  if (items.length === 0) {
    // Buat placeholder 16 pertemuan default untuk kelas ini
    const generated: JournalItem[] = [];
    for (let i = 1; i <= 16; i++) {
      const d = new Date(2026, 8, 1 + (i - 1) * 7); // perkuliahan berkala
      generated.push({
        id: `mock-journal-${classId}-${i}`,
        classId,
        sessionId: `session-${classId}-${i}`,
        sessionNumber: i,
        heldOn: d.toISOString().split('T')[0],
        mode: i % 4 === 0 ? 'daring' : 'luring',
        topic: `Pertemuan ${i}: Pembahasan Modul ${i}`,
        summary: i <= 4 ? `Mahasiswa mempelajari capaian modul ${i} secara interaktif.` : null,
        method: i <= 4 ? 'Ceramah interaktif dan diskusi studi kasus' : null,
        obstacles: null,
        status: i <= 4 ? 'final' : (i === 5 ? 'draf' : 'draf'),
        isLate: i === 3,
        revisionCount: 0,
        attendanceCounts: {
          hadir: 26,
          terlambat: 2,
          izin: 1,
          sakit: 0,
          alpa: 1,
          total: 30,
        },
      });
    }
    return generated;
  }

  return items;
}

export async function exportClassJournalsExcelAction(
  classId: string
): Promise<{ ok: boolean; base64?: string; filename?: string; error?: string }> {
  const journals = await listClassJournalsAction(classId);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SIAJAR - Universitas Islam Riau';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Berita Acara Perkuliahan', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 3 }],
  });

  // Judul
  worksheet.mergeCells('A1:H1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'REKAPITULASI BERITA ACARA PERKULIAHAN MAHASISWA';
  titleCell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF0D1B2A' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 28;

  // Header Kolom
  const headers = [
    'Pertemuan Ke-',
    'Tanggal',
    'Moda',
    'Materi / Topik',
    'Metode Pembelajaran',
    'Kendala Perkuliahan',
    'Jumlah Hadir',
    'Status Berita Acara',
  ];

  const headerRow = worksheet.getRow(3);
  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1B4332' }, // Dark green UIR
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
  headerRow.height = 24;

  // Lebar kolom
  worksheet.getColumn(1).width = 15;
  worksheet.getColumn(2).width = 14;
  worksheet.getColumn(3).width = 12;
  worksheet.getColumn(4).width = 35;
  worksheet.getColumn(5).width = 30;
  worksheet.getColumn(6).width = 28;
  worksheet.getColumn(7).width = 14;
  worksheet.getColumn(8).width = 20;

  // Isi data
  journals.forEach((j, index) => {
    const rIdx = index + 4;
    const row = worksheet.getRow(rIdx);

    row.getCell(1).value = `Pertemuan ${j.sessionNumber}`;
    row.getCell(2).value = j.heldOn;
    row.getCell(3).value = j.mode.toUpperCase();
    row.getCell(4).value = j.topic;
    row.getCell(5).value = j.method || '-';
    row.getCell(6).value = j.obstacles || 'Tidak ada kendala';
    row.getCell(7).value = j.attendanceCounts?.hadir || 0;

    let statusText = 'Belum Diisi';
    if (j.status === 'final') {
      statusText = j.isLate ? 'Final (Terlambat)' : 'Final';
    } else if (j.status === 'draf') {
      statusText = 'Draf';
    }
    row.getCell(8).value = statusText;

    // Border & perataan
    for (let c = 1; c <= 8; c++) {
      const cell = row.getCell(c);
      cell.font = { name: 'Arial', size: 9 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      };
      if (c === 1 || c === 2 || c === 3 || c === 7 || c === 8) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
    }
    row.height = 20;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const filename = `Berita_Acara_Kelas_${classId}_${new Date().toISOString().split('T')[0]}.xlsx`;

  return { ok: true, base64, filename };
}

export async function getJournalsStore(): Promise<JournalItem[]> {
  return journalsStore;
}
