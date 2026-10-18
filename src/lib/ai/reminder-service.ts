import { createClient } from '@/lib/supabase/server';
import { AI_REMINDER_SYSTEM_PROMPT } from './prompts';
import {
  ReminderKind,
  ReminderPayload,
  getStaticReminderMessage,
  adjustScheduledTimeForQuietHours,
} from './reminder-templates';

export interface GenerateReminderResult {
  message: string;
  isAiGenerated: boolean;
  scheduledFor: Date;
  dedupeKey: string;
}

/**
 * Membentuk dedupe_key unik untuk menjamin idempoten pengingat
 */
export function buildReminderDedupeKey(
  studentId: string,
  kind: ReminderKind,
  refType?: string,
  refId?: string,
  extraKey?: string
): string {
  const parts = [studentId, kind, refType || 'none', refId || 'none'];
  if (extraKey) parts.push(extraKey);
  return parts.join(':');
}

/**
 * Layanan pembuat pesan pengingat cerdas dengan batas waktu 5 detik dan fallback aman.
 */
export async function generateReminderMessage(
  studentId: string,
  kind: ReminderKind,
  payload: ReminderPayload,
  scheduledTime: Date = new Date()
): Promise<GenerateReminderResult> {
  const adjustedScheduledTime = adjustScheduledTimeForQuietHours(scheduledTime, kind);
  const fallbackMessage = getStaticReminderMessage(kind, payload);

  const aiModel = process.env.AI_MODEL;
  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

  if (!aiModel || !apiKey) {
    return {
      message: fallbackMessage,
      isAiGenerated: false,
      scheduledFor: adjustedScheduledTime,
      dedupeKey: buildReminderDedupeKey(studentId, kind, payload.title, payload.courseName),
    };
  }

  // Panggil AI dengan batas waktu (timeout) 5 detik
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  let finalMessage = fallbackMessage;
  let isAi = false;
  let inputTokens = 0;
  let outputTokens = 0;
  let isSuccess = false;

  try {
    const userPrompt = JSON.stringify({
      jenis_pengingat: kind,
      data: payload,
    });

    // Panggilan fail-safe REST bila ada endpoint AI atau mock
    // Kita gunakan fallback jika fetch gagal
    inputTokens = Math.ceil(userPrompt.length / 4);
    
    // Bila API key disetel, coba request
    if (process.env.AI_API_URL) {
      const resp = await fetch(process.env.AI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: aiModel,
          messages: [
            { role: 'system', content: AI_REMINDER_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      if (resp.ok) {
        const json = await resp.json();
        const content = json.choices?.[0]?.message?.content || json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed.pesan && typeof parsed.pesan === 'string') {
            finalMessage = parsed.pesan.trim();
            isAi = true;
            isSuccess = true;
            outputTokens = Math.ceil(finalMessage.length / 4);
          }
        }
      }
    }
  } catch {
    // Timeout atau galat jaringan: aman menggunakan fallback templat
    finalMessage = fallbackMessage;
    isAi = false;
    isSuccess = false;
  } finally {
    clearTimeout(timeoutId);
  }

  // Catat konsumsi token di ai_usage_logs (asinkron)
  try {
    const supabase = await createClient();
    await (supabase.from('ai_usage_logs') as any).insert({
      student_id: studentId,
      kind,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      ok: isSuccess,
    });
  } catch {
    // Jangan gagalkan alur pengingat jika pencatatan log gagal
  }

  return {
    message: finalMessage,
    isAiGenerated: isAi,
    scheduledFor: adjustedScheduledTime,
    dedupeKey: buildReminderDedupeKey(studentId, kind, payload.title, payload.courseName),
  };
}
