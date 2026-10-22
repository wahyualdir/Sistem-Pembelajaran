'use server';

import { randomUUID } from 'crypto';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { recordSystemAuditLog } from '@/lib/audit';
import { notify } from '@/modules/notifications';
import { catatAktivitas } from '@/lib/aktivitas';
import {
  assertClassMember,
  getAcademicStore,
  getAuthorizedClassesForUser,
  requireRole,
} from '@/lib/auth/class-access';

export interface ForumAttachment {
  name: string;
  url: string;
  size?: string;
  type?: string;
}

export interface ForumTopic {
  id: string;
  class_id: string;
  class_title: string;
  author_id: string;
  author_name: string;
  author_role: 'STUDENT' | 'LECTURER' | 'TEACHING_ASSISTANT';
  title: string;
  body: string;
  tags: string[];
  attachments: ForumAttachment[];
  is_pinned: boolean;
  is_locked: boolean;
  is_hidden: boolean;
  best_reply_id: string | null;
  reply_count: number;
  created_at: string;
  updated_at: string;
}

export interface ForumReply {
  id: string;
  topic_id: string;
  class_id: string;
  author_id: string;
  author_name: string;
  author_role: 'STUDENT' | 'LECTURER' | 'TEACHING_ASSISTANT';
  body: string;
  attachments: ForumAttachment[];
  is_best_answer: boolean;
  is_hidden: boolean;
  report_reason?: string | null;
  reported_by?: string | null;
  created_at: string;
}

// -------------------------------------------------------------
// In-Memory Store Global untuk Forum Diskusi Terpadu
// -------------------------------------------------------------
const forumTopicsStore: ForumTopic[] = ((globalThis as any).__siajarForumTopics ??= []);
const forumRepliesStore: ForumReply[] = ((globalThis as any).__siajarForumReplies ??= []);

/**
 * Migrasikan data forum lama (jika ada di __siajarDiskusi / __siajarBalasan) ke store forum baru,
 * dan inisialisasi data percontohan jika store kosong.
 */
function syncAndSeedForumStore() {
  const store = getAcademicStore();
  const defaultClassId = 'c0000000-0000-0000-0000-000000000001';
  const defaultClassTitle = 'Pemrograman Web & Arsitektur Cloud (IF-3A)';

  if (forumTopicsStore.length === 0) {
    const topicId1 = 'top-demo-001';
    const topicId2 = 'top-demo-002';
    const migratedLegacyId = 'dis-demo-001';

    forumTopicsStore.push(
      {
        id: topicId1,
        class_id: defaultClassId,
        class_title: defaultClassTitle,
        author_id: 'a0000001-0000-0000-0000-000000000001',
        author_name: 'Ahmad Mahasiswa',
        author_role: 'STUDENT',
        title: 'Solusi Penanganan CORS Preflight pada Endpoint REST API Next.js Route Handlers',
        body: 'Saat mencoba memanggil API dari klien eksternal dengan header Authorization Bearer token, browser memblokir request karena OPTIONS preflight response tidak mengembalikan header Access-Control-Allow-Headers yang lengkap. Bagaimana implementasi middleware yang direkomendasikan?',
        tags: ['api', 'nextjs', 'tugas-1'],
        attachments: [
          { name: 'cors-error-console.png', url: '/images/mock-error.png', size: '240 KB' },
        ],
        is_pinned: true,
        is_locked: false,
        is_hidden: false,
        best_reply_id: 'rep-demo-002',
        reply_count: 2,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
      {
        id: topicId2,
        class_id: defaultClassId,
        class_title: defaultClassTitle,
        author_id: 'a0000002-0000-0000-0000-000000000002',
        author_name: 'Dr. Budi Santoso, M.Kom.',
        author_role: 'LECTURER',
        title: 'Pengumuman Ketentuan Format Pengumpulan Proyek Akhir Cloud Architecture',
        body: 'Seluruh kelompok wajib menyertakan diagram arsitektur C4-Model level 1 & 2 beserta Dockerfile mandiri. Format penamaan repositori: IF3A_KelompokXX_ProyekAkhir.',
        tags: ['pengumuman', 'proyek-akhir', 'penting'],
        attachments: [
          { name: 'rubrik-penilaian-proyek.pdf', url: '/docs/rubrik-proyek.pdf', size: '1.2 MB' },
        ],
        is_pinned: true,
        is_locked: false,
        is_hidden: false,
        best_reply_id: null,
        reply_count: 0,
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: migratedLegacyId,
        class_id: defaultClassId,
        class_title: defaultClassTitle,
        author_id: 'a0000002-0000-0000-0000-000000000002',
        author_name: 'Dr. Budi Santoso, M.Kom.',
        author_role: 'LECTURER',
        title: 'Ruang Diskusi & Tanya Jawab: Proyek Akhir & Modul 1',
        body: 'Silakan ajukan pertanyaan seputar materi arsitektur cloud dan ketentuan proyek akhir semester di thread ini.',
        tags: ['modul-1', 'proyek-akhir'],
        attachments: [],
        is_pinned: true,
        is_locked: false,
        is_hidden: false,
        best_reply_id: null,
        reply_count: 0,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      }
    );

    forumRepliesStore.push(
      {
        id: 'rep-demo-001',
        topic_id: topicId1,
        class_id: defaultClassId,
        author_id: 'a0000003-0000-0000-0000-000000000003',
        author_name: 'Citra Asisten',
        author_role: 'TEACHING_ASSISTANT',
        body: 'Apakah Anda sudah mencoba mengatur NextResponse pada file middleware.ts di root proyek? Saya sempat mengalami kendala serupa.',
        attachments: [],
        is_best_answer: false,
        is_hidden: false,
        created_at: new Date(Date.now() - 86400000 * 1.5).toISOString(),
      },
      {
        id: 'rep-demo-002',
        topic_id: topicId1,
        class_id: defaultClassId,
        author_id: 'a0000002-0000-0000-0000-000000000002',
        author_name: 'Dr. Budi Santoso, M.Kom.',
        author_role: 'LECTURER',
        body: 'Untuk Next.js App Router, tambahkan fungsi `export async function OPTIONS()` khusus di route.ts atau buat helper response yang mengembalikan header `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`, dan `Access-Control-Allow-Headers: Content-Type, Authorization`. Gunakan status 204 atau 200 pada request preflight.',
        attachments: [
          { name: 'cors-middleware-snippet.ts', url: '/docs/snippet.ts', size: '4 KB' },
        ],
        is_best_answer: true,
        is_hidden: false,
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      }
    );
  }

  // Migrasikan sisa data dari store lama (jika pernah dibuat secara dinamis) tanpa menghapus datanya
  const legacyDiscussions = (globalThis as any).__siajarDiskusi as any[] | undefined;
  const legacyReplies = (globalThis as any).__siajarBalasan as any[] | undefined;

  if (Array.isArray(legacyDiscussions) && legacyDiscussions.length > 0) {
    for (const d of legacyDiscussions) {
      if (!forumTopicsStore.some((t) => t.id === d.id)) {
        const cls = store.classes.find((c) => c.id === d.class_id);
        const isOwner = cls?.created_by === d.author_id || cls?.lecturer_id === d.author_id;
        forumTopicsStore.push({
          id: d.id,
          class_id: d.class_id,
          class_title: cls?.title || defaultClassTitle,
          author_id: d.author_id,
          author_name: d.author_name || 'Anggota Kelas',
          author_role: isOwner ? 'LECTURER' : 'STUDENT',
          title: d.title,
          body: d.body || '',
          tags: [],
          attachments: [],
          is_pinned: Boolean(d.is_pinned),
          is_locked: Boolean(d.is_locked),
          is_hidden: false,
          best_reply_id: null,
          reply_count: Number(d.reply_count || 0),
          created_at: d.created_at || new Date().toISOString(),
          updated_at: d.created_at || new Date().toISOString(),
        });
      }
    }
    delete (globalThis as any).__siajarDiskusi;
  }

  if (Array.isArray(legacyReplies) && legacyReplies.length > 0) {
    for (const r of legacyReplies) {
      if (!forumRepliesStore.some((fr) => fr.id === r.id)) {
        const cls = store.classes.find((c) => c.id === r.class_id);
        const isOwner = cls?.created_by === r.author_id || cls?.lecturer_id === r.author_id;
        forumRepliesStore.push({
          id: r.id,
          topic_id: r.discussion_id,
          class_id: r.class_id,
          author_id: r.author_id,
          author_name: r.author_name || 'Anggota Kelas',
          author_role: isOwner ? 'LECTURER' : 'STUDENT',
          body: r.body || '',
          attachments: [],
          is_best_answer: false,
          is_hidden: Boolean(r.is_hidden),
          created_at: r.created_at || new Date().toISOString(),
        });
      }
    }
    delete (globalThis as any).__siajarBalasan;
  }
}

// -------------------------------------------------------------
// 1. Ambil Daftar Topik Diskusi per Kelas (Dengan Pencarian & Tag)
// -------------------------------------------------------------
export async function listClassForumTopicsAction(
  classId: string,
  searchQuery = '',
  tagFilter = ''
): Promise<{ ok: boolean; topics: ForumTopic[]; tags: string[]; error?: string }> {
  syncAndSeedForumStore();
  let access;
  try {
    access = await assertClassMember(classId);
  } catch (err: any) {
    return {
      ok: false,
      topics: [],
      tags: [],
      error: err?.message || 'Hanya anggota kelas yang dapat mengakses forum diskusi.',
    };
  }

  let list = forumTopicsStore.filter((t) => t.class_id === classId);

  // Jika bukan dosen/asdos kelas ini, sembunyikan topik yang di-hide
  if (!access.isLecturer && !access.isTa) {
    list = list.filter((t) => !t.is_hidden);
  }

  // Ekstraksi seluruh tag unik di kelas
  const allTags = Array.from(new Set(list.flatMap((t) => t.tags || []))).sort();

  // Filter Search
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.body.toLowerCase().includes(q) ||
        t.author_name.toLowerCase().includes(q)
    );
  }

  // Filter Tag
  if (tagFilter.trim()) {
    list = list.filter((t) => t.tags?.includes(tagFilter.trim()));
  }

  // Urutkan: Pinned di atas, lalu terbaru
  list.sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return Date.parse(b.created_at) - Date.parse(a.created_at);
  });

  return { ok: true, topics: list, tags: allTags };
}

// -------------------------------------------------------------
// 2. Buat Topik Baru (Mahasiswa, Dosen, Asdos yang terdaftar di kelas)
// -------------------------------------------------------------
const createTopicSchema = z.object({
  classId: z.string().uuid(),
  title: z.string().trim().min(5, 'Judul topik minimal 5 karakter.').max(200),
  body: z.string().trim().min(10, 'Isi pesan diskusi minimal 10 karakter.').max(10000),
  tags: z.array(z.string().trim()).optional().default([]),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        url: z.string(),
        size: z.string().optional(),
        type: z.string().optional(),
      })
    )
    .optional()
    .default([]),
});

export async function createForumTopicAction(input: unknown) {
  syncAndSeedForumStore();
  const parsed = createTopicSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { classId, title, body, tags, attachments } = parsed.data;
  let access;
  try {
    access = await assertClassMember(classId);
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Akses ditolak. Anda bukan anggota kelas ini.' };
  }

  const newTopic: ForumTopic = {
    id: randomUUID(),
    class_id: classId,
    class_title: access.cls.title,
    author_id: access.viewer.userId,
    author_name: access.viewer.userName,
    author_role: access.memberRole,
    title,
    body,
    tags: tags.map((t) => t.toLowerCase().replace(/[^a-z0-9_-]/g, '')).filter(Boolean),
    attachments,
    is_pinned: false,
    is_locked: false,
    is_hidden: false,
    best_reply_id: null,
    reply_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  forumTopicsStore.unshift(newTopic);

  catatAktivitas({ userId: access.viewer.userId, kind: 'topik_diskusi', classId }).catch(() => {});

  revalidatePath(`/classes/${classId}`);
  revalidatePath('/ta/forum');

  return { ok: true, topicId: newTopic.id };
}

// -------------------------------------------------------------
// 3. Ambil Thread Detail & Balasan
// -------------------------------------------------------------
export async function getForumTopicDetailAction(classId: string, topicId: string) {
  syncAndSeedForumStore();
  let access;
  try {
    access = await assertClassMember(classId);
  } catch (err: any) {
    return {
      ok: false,
      topic: null,
      replies: [],
      viewer: null,
      error: err?.message || 'Akses ditolak.',
    };
  }

  const topic = forumTopicsStore.find((t) => t.id === topicId && t.class_id === classId);
  if (!topic) {
    return { ok: false, topic: null, replies: [], viewer: null, error: 'Topik diskusi tidak ditemukan.' };
  }

  if (topic.is_hidden && !access.isLecturer && !access.isTa) {
    return { ok: false, topic: null, replies: [], viewer: null, error: 'Topik diskusi tidak ditemukan.' };
  }

  let replies = forumRepliesStore.filter((r) => r.topic_id === topicId);

  // Filter hidden untuk mahasiswa
  if (!access.isLecturer && !access.isTa) {
    replies = replies.filter((r) => !r.is_hidden);
  }

  // Urutkan: Jawaban terbaik di atas, lalu kronologis
  replies.sort((a, b) => {
    if (a.is_best_answer !== b.is_best_answer) return a.is_best_answer ? -1 : 1;
    return Date.parse(a.created_at) - Date.parse(b.created_at);
  });

  return {
    ok: true,
    topic,
    replies,
    viewer: {
      userId: access.viewer.userId,
      userName: access.viewer.userName,
      role: access.memberRole,
      isLecturer: access.isLecturer,
      isTa: access.isTa,
      isTopicAuthor: topic.author_id === access.viewer.userId,
    },
  };
}

// -------------------------------------------------------------
// 4. Balas Topik Diskusi & Kirim Notifikasi
// -------------------------------------------------------------
const replySchema = z.object({
  topicId: z.string().min(1, 'ID topik wajib diisi.'),
  body: z.string().trim().min(3, 'Isi balasan minimal 3 karakter.').max(5000),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        url: z.string(),
        size: z.string().optional(),
      })
    )
    .optional()
    .default([]),
});

export async function replyForumTopicAction(input: unknown) {
  syncAndSeedForumStore();
  const parsed = replySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { topicId, body, attachments } = parsed.data;
  const topic = forumTopicsStore.find((t) => t.id === topicId);
  if (!topic) return { ok: false, error: 'Topik diskusi tidak ditemukan.' };

  let access;
  try {
    access = await assertClassMember(topic.class_id);
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Akses ditolak.' };
  }

  if (topic.is_locked && !access.isLecturer && !access.isTa) {
    return { ok: false, error: 'Topik ini telah dikunci oleh dosen/asisten. Tidak dapat menambah balasan baru.' };
  }

  const newReply: ForumReply = {
    id: randomUUID(),
    topic_id: topicId,
    class_id: topic.class_id,
    author_id: access.viewer.userId,
    author_name: access.viewer.userName,
    author_role: access.memberRole,
    body,
    attachments,
    is_best_answer: false,
    is_hidden: false,
    created_at: new Date().toISOString(),
  };

  forumRepliesStore.push(newReply);
  topic.reply_count = forumRepliesStore.filter((r) => r.topic_id === topicId && !r.is_hidden).length;
  topic.updated_at = newReply.created_at;

  // Notifikasi ke pembuat topik (jika bukan pembuat topik sendiri yang membalas)
  if (topic.author_id !== access.viewer.userId) {
    await notify({
      userId: topic.author_id,
      type: 'FORUM_REPLY',
      title: `[Forum Kelas] Balasan Baru di Topik Anda: ${topic.title}`,
      body: `${access.viewer.userName} (${access.memberRole}): "${body.slice(0, 120)}${body.length > 120 ? '...' : ''}"`,
      targetUrl: `/classes/${topic.class_id}/discussions/${topic.id}`,
      classId: topic.class_id,
      dedupKey: `${topic.author_id}:FORUM_REPLY:${newReply.id}`,
    });
  }

  catatAktivitas({ userId: access.viewer.userId, kind: 'balas_diskusi', classId: topic.class_id }).catch(() => {});

  revalidatePath(`/classes/${topic.class_id}`);
  revalidatePath(`/classes/${topic.class_id}/discussions/${topic.id}`);
  revalidatePath('/ta/forum');

  return { ok: true, replyId: newReply.id };
}

// -------------------------------------------------------------
// 5. Tandai Jawaban Terbaik (Penanya Topik atau Dosen Pengampu Kelas)
// -------------------------------------------------------------
export async function markBestAnswerAction(topicId: string, replyId: string) {
  syncAndSeedForumStore();
  const topic = forumTopicsStore.find((t) => t.id === topicId);
  if (!topic) return { ok: false, error: 'Topik diskusi tidak ditemukan.' };

  const reply = forumRepliesStore.find((r) => r.id === replyId && r.topic_id === topicId);
  if (!reply) return { ok: false, error: 'Balasan tidak ditemukan.' };

  let access;
  try {
    access = await assertClassMember(topic.class_id);
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Akses ditolak.' };
  }

  const isAuthor = topic.author_id === access.viewer.userId;
  const isLecturer = access.isLecturer;

  if (!isAuthor && !isLecturer) {
    return { ok: false, error: 'Hanya pembuat topik atau dosen pengampu yang berhak menandai jawaban terbaik.' };
  }

  // Toggle atau tetapkan jawaban terbaik
  const isAlreadyBest = reply.is_best_answer;

  // Reset jawaban terbaik lainnya di topik ini
  forumRepliesStore.forEach((r) => {
    if (r.topic_id === topicId) r.is_best_answer = false;
  });

  if (!isAlreadyBest) {
    reply.is_best_answer = true;
    topic.best_reply_id = reply.id;

    // Notifikasi ke pembuat balasan bahwa jawabannya ditandai terbaik
    if (reply.author_id !== access.viewer.userId) {
      await notify({
        userId: reply.author_id,
        type: 'BEST_ANSWER_MARKED',
        title: `[Forum Kelas] Jawaban Anda Ditandai Sebagai Jawaban Terbaik! 🌟`,
        body: `Jawaban Anda pada topik "${topic.title}" diapresiasi oleh ${access.viewer.userName} sebagai solusi terbaik.`,
        targetUrl: `/classes/${topic.class_id}/discussions/${topic.id}`,
        classId: topic.class_id,
        dedupKey: `${reply.author_id}:BEST_ANSWER:${reply.id}`,
      });
    }
  } else {
    topic.best_reply_id = null;
  }

  revalidatePath(`/classes/${topic.class_id}`);
  revalidatePath(`/classes/${topic.class_id}/discussions/${topic.id}`);
  revalidatePath('/ta/forum');

  return { ok: true, isBestAnswer: !isAlreadyBest };
}

// -------------------------------------------------------------
// 6. Moderasi: Pin, Lock, Sembunyikan, dan Laporkan (Khusus Dosen Pengampu & Asdos Kelas)
// -------------------------------------------------------------
export async function moderateTopicAction(
  topicId: string,
  action: 'pin' | 'lock' | 'hide',
  value: boolean
) {
  syncAndSeedForumStore();
  const topic = forumTopicsStore.find((t) => t.id === topicId);
  if (!topic) return { ok: false, error: 'Topik tidak ditemukan.' };

  let access;
  try {
    access = await assertClassMember(topic.class_id);
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Akses moderasi hanya untuk Dosen Pengampu dan Asisten Dosen kelas ini.',
    };
  }

  if (!access.isLecturer && !access.isTa) {
    return { ok: false, error: 'Akses moderasi hanya untuk Dosen Pengampu dan Asisten Dosen kelas ini.' };
  }

  if (action === 'pin') topic.is_pinned = value;
  else if (action === 'lock') topic.is_locked = value;
  else if (action === 'hide') topic.is_hidden = value;

  // Catat ke Audit Trail
  await recordSystemAuditLog({
    actorId: access.viewer.userId,
    actorName: access.viewer.userName,
    actorRole: access.memberRole,
    action: `forum.topic_${action}`,
    entityType: 'forum_topics',
    entityId: topic.id,
    description: `${action.toUpperCase()} topik "${topic.title}" disetel ke ${value}`,
    valueBefore: null,
    valueAfter: JSON.stringify({ action, value }),
  });

  revalidatePath(`/classes/${topic.class_id}`);
  revalidatePath(`/classes/${topic.class_id}/discussions/${topic.id}`);
  revalidatePath('/ta/forum');

  return { ok: true };
}

export async function moderateReplyAction(
  replyId: string,
  action: 'hide' | 'report',
  reason?: string
) {
  syncAndSeedForumStore();
  const reply = forumRepliesStore.find((r) => r.id === replyId);
  if (!reply) return { ok: false, error: 'Balasan tidak ditemukan.' };

  let access;
  try {
    access = await assertClassMember(reply.class_id);
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Akses moderasi hanya untuk Dosen Pengampu dan Asisten Dosen kelas ini.',
    };
  }

  if (!access.isLecturer && !access.isTa) {
    return { ok: false, error: 'Akses moderasi hanya untuk Dosen Pengampu dan Asisten Dosen kelas ini.' };
  }

  if (action === 'hide') {
    reply.is_hidden = !reply.is_hidden;
  } else if (action === 'report') {
    reply.report_reason = reason || 'Konten tidak sesuai kode etik perkuliahan.';
    reply.reported_by = access.viewer.userName;
    reply.is_hidden = true; // Sembunyikan otomatis jika dilaporkan
  }

  const topic = forumTopicsStore.find((t) => t.id === reply.topic_id);
  if (topic) {
    topic.reply_count = forumRepliesStore.filter((r) => r.topic_id === topic.id && !r.is_hidden).length;
  }

  // Catat ke Audit Trail
  await recordSystemAuditLog({
    actorId: access.viewer.userId,
    actorName: access.viewer.userName,
    actorRole: access.memberRole,
    action: action === 'report' ? 'forum.post_reported' : 'forum.post_hidden',
    entityType: 'forum_replies',
    entityId: reply.id,
    description: `Moderasi balasan oleh ${access.viewer.userName}: ${action} (Alasan: ${reason || '-'})`,
    valueBefore: null,
    valueAfter: JSON.stringify({ action, reason, is_hidden: reply.is_hidden }),
  });

  revalidatePath(`/classes/${reply.class_id}`);
  revalidatePath(`/classes/${reply.class_id}/discussions/${reply.topic_id}`);
  revalidatePath('/ta/forum');

  return { ok: true, isHidden: reply.is_hidden };
}

// -------------------------------------------------------------
// 7. Data Forum untuk Panel Asisten Dosen (/ta/forum)
//    Hanya mengembalikan topik dari kelas tempat TA ditugaskan
// -------------------------------------------------------------
export async function getTaForumThreadsAction(): Promise<{
  ok: boolean;
  threads: ForumTopic[];
  error?: string;
}> {
  syncAndSeedForumStore();
  let viewer;
  try {
    viewer = await requireRole(['TEACHING_ASSISTANT', 'LECTURER']);
  } catch (err: any) {
    return { ok: false, threads: [], error: err?.message || 'Akses ditolak.' };
  }

  // Ambil daftar kelas tempat TA ditugaskan (atau kelas yang diampu dosen)
  const authorizedClasses = getAuthorizedClassesForUser(viewer.userId, viewer.activeRole);
  const authorizedClassIds = new Set(authorizedClasses.map((c) => c.id));

  if (authorizedClassIds.size === 0) {
    return { ok: true, threads: [] };
  }

  const threads = forumTopicsStore
    .filter((t) => authorizedClassIds.has(t.class_id))
    .slice()
    .sort((a, b) => {
      // Prioritaskan topik yang belum memiliki balasan atau belum ada best answer
      const aNeedsHelp = a.reply_count === 0 || !a.best_reply_id;
      const bNeedsHelp = b.reply_count === 0 || !b.best_reply_id;
      if (aNeedsHelp !== bNeedsHelp) return aNeedsHelp ? -1 : 1;
      return Date.parse(b.created_at) - Date.parse(a.created_at);
    });

  return { ok: true, threads };
}
