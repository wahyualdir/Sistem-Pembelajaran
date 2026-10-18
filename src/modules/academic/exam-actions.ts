'use server';

import { createClient } from '@/lib/supabase/server';
import { recordSystemAuditLog } from '@/lib/audit';
import {
  generateExamToken,
  analyzeExamItems,
  calcStudentCpmkScores,
  calcStudentCplScores,
  extractTextShingles,
  calcTextJaccardSimilarity,
  extractCodeFingerprints,
  extractStarterCodeKgrams,
  calcCodeSimilarity,
} from '@/lib/akademik/exam-utils';
import { getCodeRunner } from '@/lib/judge/coderunner';

// In-memory rate limiter untuk 'Coba Jalankan' koding: 1x per 5s per user
const codingRunRateLimit = new Map<string, number>();

// ============================================================================
// 1. AUTOSAVE DAN SESI UJIAN (11.1)
// ============================================================================

export async function claimAttemptSessionAction(attemptId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await (supabase.rpc as any)('claim_attempt_session', {
      p_attempt_id: attemptId,
    });

    if (error) {
      return { ok: false, pesan: error.message };
    }

    if (!data || !data.ok) {
      return { ok: false, code: data?.code || 'ERROR', pesan: 'Gagal mengklaim sesi ujian.' };
    }

    return {
      ok: true,
      sessionId: data.session_id as string,
      expiresAt: data.expires_at as string,
      extraTimeSeconds: data.extra_time_seconds as number,
      serverNow: data.server_now as string,
    };
  } catch (err: any) {
    return { ok: false, pesan: err?.message || 'Terjadi kesalahan sistem.' };
  }
}

export async function saveExamAnswersAction(
  attemptId: string,
  sessionId: string,
  items: { questionId: string; answer: any; revision: number }[]
) {
  try {
    const supabase = await createClient();
    const formattedItems = items.map((it) => ({
      question_id: it.questionId,
      answer: it.answer,
      revision: it.revision,
    }));

    const { data, error } = await (supabase.rpc as any)('save_exam_answers', {
      p_attempt_id: attemptId,
      p_session_id: sessionId,
      p_items: formattedItems,
    });

    if (error) {
      return { ok: false, pesan: error.message };
    }

    if (!data || !data.ok) {
      return { ok: false, code: data?.code || 'ERROR', pesan: 'Gagal menyimpan jawaban.' };
    }

    return {
      ok: true,
      acceptedRevisions: data.accepted_revisions,
      serverNow: data.server_now as string,
      expiresAt: data.expires_at as string,
    };
  } catch (err: any) {
    return { ok: false, pesan: err?.message || 'Gagal menyimpan jawaban.' };
  }
}

export async function examHeartbeatAction(attemptId: string, sessionId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await (supabase.rpc as any)('exam_heartbeat', {
      p_attempt_id: attemptId,
      p_session_id: sessionId,
    });

    if (error) return { ok: false, pesan: error.message };
    if (!data || !data.ok) {
      return { ok: false, code: data?.code || 'ERROR', pesan: 'Sesi heartbeat tidak valid.' };
    }

    return { ok: true, serverNow: data.server_now as string };
  } catch (err: any) {
    return { ok: false, pesan: err?.message || 'Gagal mengirim detak jantung.' };
  }
}

export async function submitExamAction(attemptId: string, sessionId: string, idempotencyKey: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await (supabase.rpc as any)('submit_exam', {
      p_attempt_id: attemptId,
      p_session_id: sessionId,
      p_idempotency_key: idempotencyKey,
    });

    if (error) return { ok: false, pesan: error.message };
    if (!data || !data.ok) return { ok: false, pesan: 'Gagal mengumpulkan ujian.' };

    return {
      ok: true,
      status: data.status,
      finishedAt: data.finished_at,
      alreadySubmitted: data.already_submitted || false,
    };
  } catch (err: any) {
    return { ok: false, pesan: err?.message || 'Gagal mengumpulkan ujian.' };
  }
}

export async function recordExamEventAction(
  attemptId: string,
  kind: 'offline' | 'online' | 'tab_hidden' | 'tab_visible' | 'fullscreen_exit',
  meta: any = {}
) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('exam_events').insert({
      attempt_id: attemptId,
      kind,
      meta,
      client_time: new Date().toISOString(),
    });
    if (error) return { ok: false, pesan: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, pesan: err?.message || 'Gagal mencatat kejadian.' };
  }
}

export async function grantExamExtraTimeAction(attemptId: string, seconds: number, reason: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await (supabase.rpc as any)('grant_exam_extra_time', {
      p_attempt_id: attemptId,
      p_seconds: seconds,
      p_reason: reason,
    });

    if (error) return { ok: false, pesan: error.message };
    if (!data || !data.ok) return { ok: false, pesan: 'Gagal menambah waktu ujian.' };

    return { ok: true, extraTimeSeconds: data.extra_time_seconds as number };
  } catch (err: any) {
    return { ok: false, pesan: err?.message || 'Gagal menambah waktu ujian.' };
  }
}

export async function getExamMonitoringSummaryAction(quizId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await (supabase.rpc as any)('get_exam_monitoring_summary', {
      p_quiz_id: quizId,
    });

    if (error) return { ok: false, pesan: error.message, data: [] };
    return { ok: true, data: Array.isArray(data) ? data : [] };
  } catch (err: any) {
    return { ok: false, pesan: err?.message || 'Gagal memuat data pantau ujian.', data: [] };
  }
}

// ============================================================================
// 2. TOKEN MASUK, UJIAN SUSULAN & REMEDIAL (11.2)
// ============================================================================

export async function enterExamAction(quizId: string, token: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await (supabase.rpc as any)('enter_exam', {
      p_quiz_id: quizId,
      p_token: token,
    });

    if (error) return { ok: false, pesan: error.message };
    if (!data || !data.ok) {
      return { ok: false, code: data?.code || 'INVALID_TOKEN', pesan: data?.pesan || 'Token ujian tidak valid.' };
    }

    return { ok: true };
  } catch (err: any) {
    return { ok: false, pesan: err?.message || 'Gagal verifikasi token masuk.' };
  }
}

export async function rotateExamTokenAction(quizId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, pesan: 'Sesi pengguna tidak valid.' };

    const newToken = generateExamToken();

    const { error } = await supabase.from('exam_access_tokens').upsert({
      quiz_id: quizId,
      token: newToken,
      rotated_at: new Date().toISOString(),
    });

    if (error) return { ok: false, pesan: error.message };

    await recordSystemAuditLog({
      actorId: user.id,
      actorRole: 'LECTURER',
      actorName: user.email || 'Dosen',
      action: 'exam.token_rotate',
      entityType: 'quizzes',
      entityId: quizId,
      description: 'Putar token ujian baru',
      scopeType: 'CLASS',
      scopeId: quizId,
      valueAfter: JSON.stringify({ token: newToken }),
    });

    return { ok: true, token: newToken };
  } catch (err: any) {
    return { ok: false, pesan: err?.message || 'Gagal memutar token ujian.' };
  }
}

export async function getExamTokenDetailAction(quizId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('exam_access_tokens')
      .select('*')
      .eq('quiz_id', quizId)
      .maybeSingle();

    if (error) return { ok: false, pesan: error.message };
    return { ok: true, data };
  } catch (err: any) {
    return { ok: false, pesan: err?.message || 'Gagal memuat token.' };
  }
}

export async function createMakeupExamAction(data: {
  parentQuizId: string;
  title: string;
  kind: 'susulan' | 'remedial';
  startTime: string;
  endTime: string;
  durationMinutes: number;
  scoreCap?: number | null;
  combinePolicy?: 'tertinggi' | 'ganti' | 'rata_rata';
  participants: { studentId: string; reason: string }[];
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, pesan: 'Sesi pengguna tidak valid.' };

    // Ambil data ujian induk
    const { data: parentQuiz, error: pqErr } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', data.parentQuizId)
      .single();

    if (pqErr || !parentQuiz) return { ok: false, pesan: 'Ujian induk tidak ditemukan.' };

    // Buat kuis anak
    const { data: newQuiz, error: nqErr } = await supabase
      .from('quizzes')
      .insert({
        class_id: parentQuiz.class_id,
        title: data.title,
        description: parentQuiz.description,
        exam_type: data.kind === 'remedial' ? 'REMEDIAL' : parentQuiz.exam_type,
        duration_minutes: data.durationMinutes,
        start_time: data.startTime,
        end_time: data.endTime,
        max_attempts: 1,
        shuffle_questions: parentQuiz.shuffle_questions,
        shuffle_options: parentQuiz.shuffle_options,
        is_published: true,
        strict_proctoring: parentQuiz.strict_proctoring,
        proctoring_level: parentQuiz.proctoring_level,
        access_mode: parentQuiz.access_mode,
        parent_quiz_id: data.parentQuizId,
        kind: data.kind,
        score_cap: data.scoreCap ?? null,
        combine_policy: data.combinePolicy ?? 'tertinggi',
        created_by: user.id,
      })
      .select()
      .single();

    if (nqErr || !newQuiz) return { ok: false, pesan: nqErr?.message || 'Gagal membuat sesi susulan/remedial.' };

    // Salin soal-soal ujian induk
    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', data.parentQuizId);

    if (questions && questions.length > 0) {
      const qInserts = questions.map((q) => ({
        quiz_id: newQuiz.id,
        question_text: q.question_text,
        question_type: q.question_type,
        points: q.points,
        order_index: q.order_index,
        code_language: q.code_language,
        starter_code: q.starter_code,
        time_limit_ms: q.time_limit_ms,
        memory_limit_mb: q.memory_limit_mb,
        compare_mode: q.compare_mode,
      }));
      await supabase.from('quiz_questions').insert(qInserts);
    }

    // Masukkan daftar peserta terdaftar
    if (data.participants.length > 0) {
      const pInserts = data.participants.map((p) => ({
        quiz_id: newQuiz.id,
        student_id: p.studentId,
        reason: p.reason,
        approved_by: user.id,
      }));
      await supabase.from('exam_makeup_participants').insert(pInserts);
    }

    await recordSystemAuditLog({
      actorId: user.id,
      actorRole: 'LECTURER',
      actorName: user.email || 'Dosen',
      action: `exam.${data.kind}_create`,
      entityType: 'quizzes',
      entityId: newQuiz.id,
      description: `Membuat sesi ujian ${data.kind}`,
      scopeType: 'CLASS',
      scopeId: parentQuiz.class_id,
      valueAfter: JSON.stringify({ parent_quiz_id: data.parentQuizId, kind: data.kind, participant_count: data.participants.length }),
    });

    return { ok: true, quizId: newQuiz.id };
  } catch (err: any) {
    return { ok: false, pesan: err?.message || 'Gagal membuat ujian susulan/remedial.' };
  }
}

// ============================================================================
// 3. AUTO-GRADER KODING (11.3)
// ============================================================================

export async function submitCodingCodeAction(data: {
  attemptId: string;
  questionId: string;
  language: 'python' | 'javascript' | 'java' | 'c' | 'cpp' | 'php';
  sourceCode: string;
  purpose: 'coba' | 'final';
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, pesan: 'Sesi pengguna tidak valid.' };

    // Rate limiting untuk 'coba': 1x per 5 detik
    if (data.purpose === 'coba') {
      const now = Date.now();
      const lastRun = codingRunRateLimit.get(user.id) || 0;
      if (now - lastRun < 5000) {
        const sisa = Math.ceil((5000 - (now - lastRun)) / 1000);
        return { ok: false, pesan: `Harap tunggu ${sisa} detik sebelum mencoba jalankan kode kembali.` };
      }
      codingRunRateLimit.set(user.id, now);
    }

    // Ambil parameter soal & test cases
    const { data: question } = await supabase
      .from('quiz_questions')
      .select('time_limit_ms, memory_limit_mb, compare_mode')
      .eq('id', data.questionId)
      .single();

    let tcQuery = supabase.from('coding_test_cases').select('*').eq('question_id', data.questionId);
    if (data.purpose === 'coba') {
      tcQuery = tcQuery.eq('is_hidden', false);
    }
    const { data: testCases, error: tcErr } = await tcQuery;

    if (tcErr || !testCases || testCases.length === 0) {
      return { ok: false, pesan: 'Tidak ada kasus uji yang terdaftar untuk soal ini.' };
    }

    const runner = getCodeRunner();
    const executionResult = await runner.run({
      language: data.language,
      sourceCode: data.sourceCode,
      timeLimitMs: question?.time_limit_ms || 2000,
      memoryLimitMb: question?.memory_limit_mb || 128,
      compareMode: (question?.compare_mode as any) || 'trim',
      testCases: testCases.map((tc) => ({
        id: tc.id,
        stdin: tc.stdin,
        expectedStdout: tc.expected_stdout,
        isHidden: tc.is_hidden,
        weight: tc.weight,
      })),
    });

    // Simpan hasil ke coding_submissions
    await supabase.from('coding_submissions').insert({
      attempt_id: data.attemptId,
      question_id: data.questionId,
      language: data.language,
      source_code: data.sourceCode,
      purpose: data.purpose,
      status: executionResult.status,
      compile_output: executionResult.compileOutput || null,
      results: executionResult.results as any,
      score: executionResult.scorePercent,
      judged_at: new Date().toISOString(),
    });

    return {
      ok: true,
      executionResult,
    };
  } catch (err: any) {
    return { ok: false, pesan: err?.message || 'Gagal mengeksekusi kode.' };
  }
}

// ============================================================================
// 4. ANALISIS BUTIR SOAL (11.4)
// ============================================================================

export async function runItemAnalysisAction(quizId: string) {
  try {
    const supabase = await createClient();

    // Ambil daftar soal
    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('id, points, metadata')
      .eq('quiz_id', quizId)
      .order('order_index', { ascending: true });

    if (!questions || questions.length === 0) {
      return { ok: false, pesan: 'Belum ada soal pada ujian ini.' };
    }

    // Ambil attempts yang sudah selesai
    const { data: attempts } = await supabase
      .from('exam_attempts')
      .select('id, student_id, total_score')
      .eq('quiz_id', quizId)
      .in('status', ['SUBMITTED', 'TIMED_OUT']);

    if (!attempts || attempts.length === 0) {
      return { ok: false, pesan: 'Belum ada peserta yang menyelesaikan ujian ini.' };
    }

    const attemptIds = attempts.map((a) => a.id);
    const { data: answers } = await supabase
      .from('exam_answers')
      .select('attempt_id, question_id, score_earned, selected_option_id, essay_text')
      .in('attempt_id', attemptIds);

    const questionIds = questions.map((q) => q.id);
    const maxScores: Record<string, number> = {};
    for (const q of questions) {
      maxScores[q.id] = q.points;
    }

    // Format partisipan
    const participants = attempts.map((att) => {
      const attAnswers = (answers || []).filter((ans) => ans.attempt_id === att.id);
      const itemScores: Record<string, number> = {};
      const itemChoices: Record<string, string> = {};

      for (const ans of attAnswers) {
        itemScores[ans.question_id] = ans.score_earned;
        if (ans.selected_option_id) {
          itemChoices[ans.question_id] = ans.selected_option_id;
        }
      }

      return {
        studentId: att.student_id,
        totalScore: att.total_score,
        itemScores,
        itemChoices,
      };
    });

    const analysis = analyzeExamItems(questionIds, maxScores, participants);

    // Simpan ke exam_summary_stats
    await supabase.from('exam_summary_stats').upsert({
      quiz_id: quizId,
      n: analysis.summary.n,
      mean: analysis.summary.mean,
      median: analysis.summary.median,
      stddev: analysis.summary.stddev,
      min: analysis.summary.min,
      max: analysis.summary.max,
      kr20: analysis.summary.kr20,
      histogram: analysis.summary.histogram as any,
      computed_at: new Date().toISOString(),
    });

    // Simpan ke exam_item_stats
    for (const item of Object.values(analysis.items)) {
      await supabase.from('exam_item_stats').upsert({
        quiz_id: quizId,
        question_id: item.questionId,
        n: item.n,
        difficulty_p: item.difficultyP,
        discrimination_d: item.discriminationD,
        point_biserial: item.pointBiserial,
        option_counts: item.optionCounts as any,
        computed_at: new Date().toISOString(),
      });

      if (item.needsRevision) {
        await supabase.from('quiz_questions').update({ needs_revision: true }).eq('id', item.questionId);
      }
    }

    return { ok: true, data: analysis };
  } catch (err: any) {
    return { ok: false, pesan: err?.message || 'Gagal menghitung analisis butir soal.' };
  }
}

export async function markQuestionNeedsRevisionAction(questionId: string, needsRevision: boolean) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('quiz_questions').update({ needs_revision: needsRevision }).eq('id', questionId);
    if (error) return { ok: false, pesan: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, pesan: err?.message || 'Gagal memperbarui status soal.' };
  }
}

// ============================================================================
// 5. PEMETAAN CPMK KE CPL (11.5)
// ============================================================================

export async function getCpmkCplReportAction(classId: string) {
  try {
    const supabase = await createClient();

    // Ambil CPMK kelas (melalui mata kuliah kelas)
    const { data: cls } = await supabase.from('classes').select('course_id').eq('id', classId).single();
    if (!cls?.course_id) return { ok: false, pesan: 'Kelas tidak terhubung ke mata kuliah.' };

    const { data: cpmkList } = await supabase.from('cpmk').select('*').eq('course_id', cls.course_id);
    const { data: mappings } = await supabase.from('cpmk_cpl_map').select('*');
    const { data: cplList } = await supabase.from('cpl').select('*');
    const { data: assessmentMaps } = await supabase.from('assessment_cpmk_map').select('*').eq('class_id', classId);

    // Periksa CPMK yang belum memiliki penilaian terpetakan
    const unmappedCpmk = (cpmkList || []).filter(
      (c) => !(assessmentMaps || []).some((am) => am.cpmk_id === c.id)
    );

    return {
      ok: true,
      data: {
        cpmkList: cpmkList || [],
        cplList: cplList || [],
        mappings: mappings || [],
        unmappedCpmk: unmappedCpmk.map((u) => u.code),
      },
    };
  } catch (err: any) {
    return { ok: false, pesan: err?.message || 'Gagal memuat laporan CPMK & CPL.' };
  }
}

// ============================================================================
// 6. CEK KEMIRIPAN TUGAS (11.6)
// ============================================================================

export async function triggerSimilarityCheckAction(assignmentId: string, threshold: number = 0.6) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, pesan: 'Sesi pengguna tidak valid.' };

    // Buat similarity run
    const { data: run, error: rErr } = await supabase
      .from('similarity_runs')
      .insert({
        assignment_id: assignmentId,
        started_by: user.id,
        threshold,
        status: 'berjalan',
      })
      .select()
      .single();

    if (rErr || !run) return { ok: false, pesan: rErr?.message || 'Gagal membuat sesi pemeriksaan kemiripan.' };

    // Ambil pengumpulan tugas
    const { data: submissions } = await supabase
      .from('submissions')
      .select('id, student_id, content')
      .eq('assignment_id', assignmentId);

    if (!submissions || submissions.length < 2) {
      await supabase.from('similarity_runs').update({ status: 'selesai', finished_at: new Date().toISOString() }).eq('id', run.id);
      return { ok: true, runId: run.id, pairsCount: 0, pesan: 'Pengumpulan kurang dari 2, tidak ada pasangan untuk dibandingkan.' };
    }

    // Ekstraksi sidik jari teks per pengumpulan
    const fingerprintsMap = new Map<string, number[]>();
    for (const sub of submissions) {
      const text = typeof sub.content === 'string' ? sub.content : JSON.stringify(sub.content || '');
      const shingles = extractTextShingles(text);
      fingerprintsMap.set(sub.id, shingles);
    }

    // Bandingkan pairwise
    const pairs: Array<{
      run_id: string;
      submission_a: string;
      submission_b: string;
      score: number;
      review_status: 'baru';
    }> = [];

    for (let i = 0; i < submissions.length; i++) {
      for (let j = i + 1; j < submissions.length; j++) {
        const subA = submissions[i];
        const subB = submissions[j];
        const shinglesA = fingerprintsMap.get(subA.id) || [];
        const shinglesB = fingerprintsMap.get(subB.id) || [];

        const score = calcTextJaccardSimilarity(shinglesA, shinglesB);
        if (score >= threshold) {
          pairs.push({
            run_id: run.id,
            submission_a: subA.id,
            submission_b: subB.id,
            score,
            review_status: 'baru',
          });
        }
      }
    }

    if (pairs.length > 0) {
      await supabase.from('similarity_pairs').insert(pairs);
    }

    await supabase.from('similarity_runs').update({
      status: 'selesai',
      finished_at: new Date().toISOString(),
    }).eq('id', run.id);

    await recordSystemAuditLog({
      actorId: user.id,
      actorRole: 'LECTURER',
      actorName: user.email || 'Dosen',
      action: 'similarity.run',
      entityType: 'similarity_runs',
      entityId: run.id,
      description: 'Menjalankan pemeriksaan kemiripan tugas',
      scopeType: 'ASSIGNMENT',
      scopeId: assignmentId,
      valueAfter: JSON.stringify({ pairs_found: pairs.length, threshold }),
    });

    return { ok: true, runId: run.id, pairsCount: pairs.length };
  } catch (err: any) {
    return { ok: false, pesan: err?.message || 'Gagal menjalankan pemeriksaan kemiripan.' };
  }
}

export async function updateSimilarityReviewAction(
  runId: string,
  subA: string,
  subB: string,
  reviewStatus: 'baru' | 'wajar' | 'perlu_ditinjau',
  note?: string
) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('similarity_pairs')
      .update({
        review_status: reviewStatus,
        review_note: note ?? null,
      })
      .match({ run_id: runId, submission_a: subA, submission_b: subB });

    if (error) return { ok: false, pesan: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, pesan: err?.message || 'Gagal memperbarui ulasan kemiripan.' };
  }
}

export async function getSimilarityResultsAction(assignmentId: string) {
  try {
    const supabase = await createClient();
    const { data: runs } = await supabase
      .from('similarity_runs')
      .select('*')
      .eq('assignment_id', assignmentId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!runs || runs.length === 0) return { ok: true, pairs: [], run: null };

    const latestRun = runs[0];
    const { data: pairs } = await supabase
      .from('similarity_pairs')
      .select('*')
      .eq('run_id', latestRun.id)
      .order('score', { ascending: false });

    return { ok: true, run: latestRun, pairs: pairs || [] };
  } catch (err: any) {
    return { ok: false, pesan: err?.message || 'Gagal memuat hasil kemiripan.', pairs: [], run: null };
  }
}
