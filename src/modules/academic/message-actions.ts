'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { recordSystemAuditLog } from '@/lib/audit';

// In-memory rate limiting: 30 pesan / menit per user
const messageRateLimits = new Map<string, { count: number; resetAt: number }>();

function checkMessageRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = messageRateLimits.get(userId);

  if (!entry || now > entry.resetAt) {
    messageRateLimits.set(userId, { count: 1, resetAt: now + 60000 });
    return { allowed: true };
  }

  if (entry.count >= 30) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count += 1;
  return { allowed: true };
}

import { isLecturerQuietHours } from '@/lib/akademik/message-utils';


export interface ConversationItem {
  id: string;
  classId: string | null;
  classTitle?: string;
  partnerId: string;
  partnerName: string;
  partnerRole: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  body: string;
  attachmentPath: string | null;
  createdAt: string;
  isDeleted: boolean;
  isMine: boolean;
}

// -------------------------------------------------------------
// 1. Mulai Percakapan Baru (RPC start_conversation)
// -------------------------------------------------------------
const startConvSchema = z.object({
  targetUserId: z.string().uuid('ID target tidak valid'),
  classId: z.string().uuid().optional().nullable(),
});

/**
 * Aturan Bisnis 12.1:
 * - Mahasiswa TIDAK diizinkan mengirim pesan langsung ke sesama mahasiswa (hanya diarahkan ke forum komunitas).
 * - Mahasiswa hanya dapat mengirim pesan ke Dosen Pengampu atau Asisten Dosen di kelas yang diikutinya, atau ke Dosen Wali.
 */
export async function validateDirectMessagePermission(
  callerRole: string,
  targetRoles: string[],
  isEnrolledInSameClass: boolean = true
): Promise<{ allowed: boolean; reason?: string }> {
  const isCallerStudent = callerRole === 'STUDENT';
  const isTargetOnlyStudent = targetRoles.every((r) => r === 'STUDENT');

  if (isCallerStudent && isTargetOnlyStudent) {
    return {
      allowed: false,
      reason: 'Akses percakapan ditolak. Mahasiswa tidak dapat mengirim pesan langsung antarmahasiswa. Silakan gunakan forum komunitas.',
    };
  }

  if (isCallerStudent && !isEnrolledInSameClass) {
    return {
      allowed: false,
      reason: 'Akses percakapan ditolak. Anda hanya dapat menghubungi dosen atau asisten pada kelas aktif Anda.',
    };
  }

  return { allowed: true };
}

export async function startConversationAction(input: unknown) {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, error: 'Silakan masuk terlebih dahulu.' };

  const parsed = startConvSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { targetUserId, classId } = parsed.data;
  const supabase = await createClient();

  // 1. Validasi di sisi aplikasi sebelum RPC: Tolak pesan antarmahasiswa
  if (user.activeRole === 'STUDENT') {
    const { data: targetRoleRows } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', targetUserId);

    const targetRoles = (targetRoleRows || []).map((r: any) => r.role);
    const perm = await validateDirectMessagePermission(user.activeRole, targetRoles.length > 0 ? targetRoles : ['STUDENT']);
    if (!perm.allowed) {
      return { ok: false, error: perm.reason || 'Akses percakapan ditolak.' };
    }
  }

  const { data, error } = await (supabase as any).rpc('start_conversation', {
    target_user_id: targetUserId,
    p_class_id: classId || null,
  });

  if (error) {
    return { ok: false, error: error.message || 'Gagal memulai percakapan.' };
  }

  revalidatePath('/messages');
  return { ok: true, conversationId: data as string };
}


// -------------------------------------------------------------
// 2. Daftar Percakapan Pengguna
// -------------------------------------------------------------
export async function listConversationsAction(): Promise<{
  ok: boolean;
  conversations: ConversationItem[];
  error?: string;
}> {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, conversations: [] };

  const supabase = await createClient();

  // Ambil percakapan yang diikuti pengguna
  const { data: participants, error } = await supabase
    .from('conversation_participants')
    .select(`
      conversation_id,
      last_read_at,
      conversations (
        id,
        class_id,
        last_message_at,
        created_at
      )
    `)
    .eq('user_id', user.user.id);

  if (error || !participants) {
    return { ok: true, conversations: [] };
  }

  const items: ConversationItem[] = [];

  for (const p of participants) {
    const conv = (p as any).conversations;
    if (!conv) continue;

    // Ambil partner percakapan
    const { data: partnerPart } = await supabase
      .from('conversation_participants')
      .select('user_id, profiles(id, full_name, role)')
      .eq('conversation_id', conv.id)
      .neq('user_id', user.user.id)
      .limit(1)
      .single();

    // Ambil pesan terakhir
    const { data: lastMsg } = await supabase
      .from('messages')
      .select('body, created_at, deleted_at')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const partnerProfile = (partnerPart as any)?.profiles;

    items.push({
      id: conv.id,
      classId: conv.class_id,
      classTitle: conv.class_id ? 'Kelas Perkuliahan' : 'Konsultasi Bimbingan',
      partnerId: partnerPart?.user_id || '',
      partnerName: partnerProfile?.full_name || 'Rekan Akademik',
      partnerRole: partnerProfile?.role || 'DOSEN',
      lastMessage: lastMsg?.deleted_at ? 'Pesan dihapus' : (lastMsg?.body || null),
      lastMessageAt: lastMsg?.created_at || conv.last_message_at || conv.created_at,
      unreadCount: 0,
    });
  }

  items.sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());

  return { ok: true, conversations: items };
}

// -------------------------------------------------------------
// 3. Ambil Pesan dalam Percakapan (Keyset Pagination, 30 per halaman)
// -------------------------------------------------------------
export async function getConversationMessagesAction(
  conversationId: string,
  limit: number = 30,
  beforeCreatedAt?: string
): Promise<{
  ok: boolean;
  messages: MessageItem[];
  hasMore: boolean;
  error?: string;
}> {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, messages: [], hasMore: false };

  const supabase = await createClient();

  let query = supabase
    .from('messages')
    .select('id, conversation_id, sender_id, body, attachment_path, created_at, deleted_at, profiles(full_name)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (beforeCreatedAt) {
    query = query.lt('created_at', beforeCreatedAt);
  }

  const { data, error } = await query;
  if (error || !data) {
    return { ok: false, messages: [], hasMore: false, error: 'Gagal memuat pesan.' };
  }

  const hasMore = data.length > limit;
  const list = data.slice(0, limit);

  const messages: MessageItem[] = list.map((m: any) => ({
    id: m.id,
    conversationId: m.conversation_id,
    senderId: m.sender_id,
    senderName: m.profiles?.full_name || 'Pengguna',
    body: m.deleted_at ? 'Pesan dihapus' : m.body,
    attachmentPath: m.deleted_at ? null : m.attachment_path,
    createdAt: m.created_at,
    isDeleted: !!m.deleted_at,
    isMine: m.sender_id === user.user.id,
  }));

  // Urutkan kembali dari yang terlama ke terbaru untuk tampilan chat
  messages.reverse();

  // Perbarui last_read_at
  await supabase
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.user.id);

  return { ok: true, messages, hasMore };
}

// -------------------------------------------------------------
// 4. Kirim Pesan Baru
// -------------------------------------------------------------
const sendMsgSchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().trim().min(1, 'Isi pesan tidak boleh kosong').max(2000, 'Maksimal 2000 karakter'),
  attachmentPath: z.string().optional().nullable(),
});

export async function sendMessageAction(input: unknown) {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, error: 'Silakan masuk terlebih dahulu.' };

  // Rate limit: 30 pesan per menit
  const rl = checkMessageRateLimit(user.user.id);
  if (!rl.allowed) {
    return { ok: false, error: `Batas pengiriman pesan terlampaui. Silakan tunggu ${rl.retryAfter} detik.` };
  }

  const parsed = sendMsgSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { conversationId, body, attachmentPath } = parsed.data;
  const supabase = await createClient();

  const now = new Date().toISOString();

  const { data: msg, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.user.id,
      body,
      attachment_path: attachmentPath || null,
      created_at: now,
    })
    .select('id, created_at')
    .single();

  if (error || !msg) {
    return { ok: false, error: error?.message || 'Gagal mengirim pesan.' };
  }

  // Update last_message_at di conversations
  await supabase
    .from('conversations')
    .update({ last_message_at: now })
    .eq('id', conversationId);

  // Catatan jam tenang bila pengirim mahasiswa dan penerima dosen
  let quietHoursNotice: string | null = null;
  if (isLecturerQuietHours() && user.activeRole === 'STUDENT') {
    quietHoursNotice = 'Dosen biasanya membalas pada jam kerja.';
  }

  return { ok: true, messageId: msg.id, quietHoursNotice };
}

// -------------------------------------------------------------
// 5. Hapus Pesan (Soft Delete)
// -------------------------------------------------------------
export async function deleteMessageAction(messageId: string) {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, error: 'Akses ditolak.' };

  const supabase = await createClient();

  const { error } = await supabase
    .from('messages')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', messageId)
    .eq('sender_id', user.user.id);

  if (error) return { ok: false, error: 'Gagal menghapus pesan.' };
  return { ok: true };
}

// -------------------------------------------------------------
// 6. Laporkan Pesan (Moderasi Staf)
// -------------------------------------------------------------
export async function reportMessageAction(messageId: string, reason: string) {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, error: 'Akses ditolak.' };

  if (!reason || reason.trim().length < 5) {
    return { ok: false, error: 'Alasan pelaporan minimal 5 karakter.' };
  }

  const supabase = await createClient();

  // Ambil pesan dan 5 pesan sekitarnya untuk snapshot
  const { data: targetMsg } = await supabase
    .from('messages')
    .select('id, conversation_id, created_at, body, sender_id')
    .eq('id', messageId)
    .single();

  if (!targetMsg) return { ok: false, error: 'Pesan tidak ditemukan.' };

  const { data: contextMsgs } = await supabase
    .from('messages')
    .select('id, sender_id, body, created_at')
    .eq('conversation_id', targetMsg.conversation_id)
    .lte('created_at', targetMsg.created_at)
    .order('created_at', { ascending: false })
    .limit(6);

  const snapshot = {
    reportedMessage: targetMsg,
    surroundingContext: contextMsgs || [],
  };

  const { error } = await supabase.from('message_reports').insert({
    message_id: messageId,
    reporter_id: user.user.id,
    reason: reason.trim(),
    snapshot,
    status: 'baru',
  });

  if (error) return { ok: false, error: 'Gagal mengirim laporan pesan.' };

  await recordSystemAuditLog({
    actorId: user.user.id,
    actorName: user.profile?.full_name || 'Pengguna',
    actorRole: user.activeRole,
    action: 'message.report',
    entityType: 'messages',
    entityId: messageId,
    description: `Pengguna melaporkan pesan dengan alasan: "${reason.trim()}"`,
  });

  return { ok: true, message: 'Laporan berhasil dikirim dan akan ditinjau oleh staf.' };
}

// -------------------------------------------------------------
// 7. Jadwal Konsultasi (Dosen & Mahasiswa)
// -------------------------------------------------------------
export async function createConsultationSlotAction(input: {
  startsAt: string;
  endsAt: string;
  placeOrLink?: string;
  capacity?: number;
}) {
  const user = await getCurrentUserWithRoles();
  if (!user || (user.activeRole !== 'LECTURER' && user.activeRole !== 'SUPER_ADMIN')) {
    return { ok: false, error: 'Hanya dosen yang dapat membuat slot konsultasi.' };
  }

  const start = new Date(input.startsAt);
  const end = new Date(input.endsAt);

  if (end <= start) {
    return { ok: false, error: 'Waktu selesai harus setelah waktu mulai.' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('consultation_slots')
    .insert({
      lecturer_id: user.user.id,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      place_or_link: input.placeOrLink?.trim() || 'Ruang Dosen / Google Meet',
      capacity: Math.min(Math.max(input.capacity || 1, 1), 20),
      status: 'terbuka',
    })
    .select('id')
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message || 'Gagal membuat slot konsultasi.' };
  }

  revalidatePath('/messages');
  return { ok: true, slotId: data.id };
}

export async function listConsultationSlotsAction(lecturerId?: string) {
  const supabase = await createClient();

  let query = supabase
    .from('consultation_slots')
    .select(`
      id,
      lecturer_id,
      starts_at,
      ends_at,
      place_or_link,
      capacity,
      status,
      profiles(full_name),
      consultation_bookings(id, student_id, topic, status, profiles(full_name))
    `)
    .gte('ends_at', new Date().toISOString())
    .order('starts_at', { ascending: true });

  if (lecturerId) {
    query = query.eq('lecturer_id', lecturerId);
  }

  const { data, error } = await query;
  if (error || !data) return { ok: true, slots: [] };

  return { ok: true, slots: data };
}

export async function bookConsultationSlotAction(slotId: string, topic: string) {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, error: 'Silakan masuk terlebih dahulu.' };

  const supabase = await createClient();

  const { data, error } = await (supabase as any).rpc('book_consultation_slot', {
    p_slot_id: slotId,
    p_topic: topic.trim(),
  });

  if (error) {
    return { ok: false, error: error.message || 'Gagal memesan slot konsultasi.' };
  }

  revalidatePath('/messages');
  return { ok: true, bookingId: (data as any)?.booking_id };
}

export async function cancelConsultationBookingAction(bookingId: string) {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, error: 'Silakan masuk terlebih dahulu.' };

  const supabase = await createClient();

  const { error } = await (supabase as any).rpc('cancel_consultation_booking', {
    p_booking_id: bookingId,
  });

  if (error) {
    return { ok: false, error: error.message || 'Gagal membatalkan konsultasi.' };
  }

  revalidatePath('/messages');
  return { ok: true };
}

export async function markConsultationFinishedAction(bookingId: string, lecturerNote?: string) {
  const user = await getCurrentUserWithRoles();
  if (!user || (user.activeRole !== 'LECTURER' && user.activeRole !== 'SUPER_ADMIN')) {
    return { ok: false, error: 'Hanya dosen pengampu yang dapat menandai konsultasi selesai.' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('consultation_bookings')
    .update({
      status: 'selesai',
      lecturer_note: lecturerNote?.trim() || null,
    })
    .eq('id', bookingId);

  if (error) return { ok: false, error: 'Gagal memperbarui status konsultasi.' };

  revalidatePath('/messages');
  return { ok: true };
}
