'use server';

import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { assertClassMember, ClassAccessError } from '@/lib/auth/class-access';
import {
  checkStudentActiveExamSession,
  searchRelevantClassSnippets,
  saveUserChatHistoryAction,
  type MaterialSnippet,
} from './ai-material-rag';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function askAiAcademicAssistantAction(
  prompt: string,
  history: ChatMessage[] = [],
  contextClassId?: string
): Promise<{
  ok: boolean;
  response?: string;
  citations?: Array<{ title: string; meeting: string | number; url: string }>;
  isExamBlocked?: boolean;
  error?: string;
}> {
  const user = await getCurrentUserWithRoles();
  if (!user) {
    return { ok: false, error: 'Silakan login terlebih dahulu untuk berinteraksi dengan AI Asisten.' };
  }

  if (user.activeRole === 'SYSTEM_ADMIN') {
    return {
      ok: false,
      error: 'Akses ditolak: SYSTEM_ADMIN tidak memiliki izin mengakses materi atau asisten akademik.',
    };
  }

  const cleanPrompt = prompt.trim();
  if (!cleanPrompt) {
    return { ok: false, error: 'Pertanyaan tidak boleh kosong.' };
  }

  // Validasi akses kelas spesifik jika contextClassId dikirim (Tahap B2)
  if (contextClassId && contextClassId !== 'ALL') {
    if (
      user.activeRole === 'STUDENT' ||
      user.activeRole === 'LECTURER' ||
      user.activeRole === 'TEACHING_ASSISTANT'
    ) {
      try {
        await assertClassMember(contextClassId);
      } catch (err) {
        if (err instanceof ClassAccessError) {
          return { ok: false, error: err.message };
        }
        throw err;
      }
    }
  }

  // -----------------------------------------------------------------
  // 1. KEBIJAKAN INTEGRITAS: Blokir AI jika Mahasiswa sedang Ujian Aktif
  // -----------------------------------------------------------------
  if (user.activeRole === 'STUDENT') {
    const examCheck = await checkStudentActiveExamSession(user.user.id);
    if (examCheck.hasActiveExam) {
      const blockedMsg =
        `⛔ **Akses Tanya AI Dinonaktifkan Sementara**\n\n` +
        `Anda saat ini terdeteksi sedang berada di dalam sesi ujian aktif (**${examCheck.examTitle}**). ` +
        `Sesuai pakta integritas akademik institusi, AI dilarang keras membantu menjawab atau memberikan asistensi selama proses evaluasi/ujian berlangsung. ` +
        `Harap kembali fokus mengerjakan ujian secara mandiri.`;

      return {
        ok: true,
        response: blockedMsg,
        isExamBlocked: true,
      };
    }
  }

  // -----------------------------------------------------------------
  // 2. RAG: Ambil Potongan Materi Hanya dari Kelas yang Diikuti Mahasiswa
  // -----------------------------------------------------------------
  const { snippets, contextClassTitle } = await searchRelevantClassSnippets(
    user.user.id,
    user.activeRole,
    cleanPrompt,
    contextClassId
  );

  const roleName = user.activeRole ?? 'Pengguna';
  const userName = user.profile?.full_name ?? 'Teman Belajar';

  // -----------------------------------------------------------------
  // 3. ANTI-HALUSINASI: Jika snippet kosong, SELALU nyatakan tidak ditemukan
  //    (baik contextClassId bernilai 'ALL', undefined, maupun kelas tertentu)
  // -----------------------------------------------------------------
  if (snippets.length === 0) {
    const notFoundMsg =
      `Maaf **${userName}**, informasi mengenai *"**${cleanPrompt}**"* **tidak ditemukan dalam materi resmi perkuliahan kelas ${contextClassTitle}**.\n\n` +
      `Sesuai standar penjaminan mutu akademik SIAJAR, AI tidak diperkenankan mengarang (*hallucinating*) jawaban di luar materi dan silabus yang diunggah dosen pengampu.\n\n` +
      `**Saran Tindakan:**\n` +
      `- Pastikan kata kunci yang Anda masukkan sesuai dengan topik silabus pertemuan.\n` +
      `- Ajukan pertanyaan langsung kepada Dosen Pengampu atau Asisten Dosen di tab **Forum Diskusi Kelas**.`;

    // Simpan ke riwayat percakapan
    await saveUserChatHistoryAction({
      userId: user.user.id,
      sender: 'user',
      text: cleanPrompt,
      contextClassId,
    });
    await saveUserChatHistoryAction({
      userId: user.user.id,
      sender: 'ai',
      text: notFoundMsg,
      contextClassId,
    });

    return { ok: true, response: notFoundMsg };
  }

  // -----------------------------------------------------------------
  // 4. GENERASI JAWABAN BERBASIS RUJUKAN MATERI (LLM / Deterministik)
  // -----------------------------------------------------------------
  const citations = snippets.map((s) => ({
    title: s.materialTitle,
    meeting: s.meetingNumber,
    url: s.materialUrl,
  }));

  let finalAnswer = '';
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey) {
    try {
      const contextExcerpts = snippets
        .map(
          (s) =>
            `[Materi: ${s.materialTitle} | Pertemuan: ${s.meetingNumber} | Kelas: ${s.classTitle}]\n${s.content}`
        )
        .join('\n\n---\n\n');

      const systemInstruction =
        `Anda adalah SIAJAR AI Academic Assistant resmi untuk portal akademik kampus SIAJAR.\n` +
        `Pengguna: ${userName} (${roleName}). Konteks: ${contextClassTitle}.\n` +
        `WAJIB menjawab HANYA berdasarkan potongan materi berikut:\n` +
        `"""\n${contextExcerpts}\n"""\n` +
        `Gunakan Bahasa Indonesia yang terstruktur dan santun. Di akhir jawaban, sertakan rujukan judul materi dan pertemuannya. ` +
        `Jika jawaban tidak ada dalam kutipan di atas, nyatakan dengan jujur bahwa tidak ditemukan di materi.`;

      const contents = [
        ...history.slice(-4).map((msg) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        })),
        { role: 'user', parts: [{ text: cleanPrompt }] },
      ];

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents,
            generationConfig: { temperature: 0.2, maxOutputTokens: 800 },
          }),
          signal: AbortSignal.timeout(8000),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const textOut = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (typeof textOut === 'string' && textOut.trim().length > 0) {
          finalAnswer = textOut.trim();
        }
      }
    } catch {
      // Fallback ke sintesis berbasis rujukan materi lokal jika API error
    }
  }

  // Jika belum terisi dari Gemini API, gunakan pembuat sintesis berbasis rujukan materi kelas
  if (!finalAnswer) {
    const topSnippet = snippets[0];
    finalAnswer =
      `Halo **${userName}**! Berdasarkan materi resmi perkuliahan pada kelas **${topSnippet.classTitle}**:\n\n` +
      `> *"**${topSnippet.content.slice(0, 320)}${topSnippet.content.length > 320 ? '...' : ''}**"*\n\n` +
      `**Penjelasan Inti:**\n` +
      `Topik yang Anda tanyakan dibahas secara spesifik pada **${topSnippet.materialTitle}** (Pertemuan ke-${topSnippet.meetingNumber}). ` +
      `Pastikan Anda memahami prinsip-prinsip dasar yang disampaikan dosen pada modul tersebut untuk persiapan kuis dan tugas mingguan.`;
  }

  // Format Footer Rujukan Materi (Link ke halaman kelas)
  if (citations.length > 0) {
    const citationsList = citations
      .map((c) => `- 📚 [${c.title} (Pertemuan ${c.meeting})](${c.url})`)
      .join('\n');
    finalAnswer += `\n\n---\n**Rujukan Materi Resmi:**\n${citationsList}`;
  }

  // -----------------------------------------------------------------
  // 5. Simpan Riwayat Percakapan Pengguna
  // -----------------------------------------------------------------
  await saveUserChatHistoryAction({
    userId: user.user.id,
    sender: 'user',
    text: cleanPrompt,
    contextClassId,
  });
  await saveUserChatHistoryAction({
    userId: user.user.id,
    sender: 'ai',
    text: finalAnswer,
    contextClassId,
    citations,
  });

  return { ok: true, response: finalAnswer, citations };
}
