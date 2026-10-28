# Peta Persistensi Data SIAJAR (Fase 6 — Inventarisasi Penuh In-Memory ke Database)

Dokumen ini disusun sebagai audit dan inventarisasi menyeluruh lapisan persistensi data aplikasi SIAJAR per 27 Oktober 2026 sesuai mandat **Fase 6 Instruksi Menu Berfungsi**. Dokumen ini memetakan seluruh store memori `globalThis.__siajar*` terhadap skema tabel Supabase, berkas migrasi (`supabase/migrations/`), flag `FF_PERSISTENCE_*`, dan arsitektur repository dengan dua adapter (Supabase saat online & store memori ber-seed saat mode demo offline).

---

## 1. Inventarisasi Lengkap Store In-Memory (`globalThis.__siajar*`)

Total ditemukan **47 store unik** di 95 titik kode aktif:

| No | Nama Store (`globalThis`) | Modul & Berkas Utama | Tabel Supabase Padanan | Flag Persistensi | Status Skema DB | Pola Adapter & Mekanisme Sinkronisasi |
|---|---|---|---|---|---|---|
| 1 | `__siajarAkademik` | `src/lib/auth/class-access.ts`, `src/modules/academic/actions.ts`, `ai-material-rag.ts` | `public.classes`, `public.enrollments`, `public.courses`, `public.semesters`, `public.programs` | `FF_PERSISTENCE_ACADEMIC` | **Sudah Ada** | Dual Adapter: Supabase RPC / table query saat online; fallback array in-memory saat demo offline |
| 2 | `__siajarAsdos` | `src/lib/auth/class-access.ts`, `src/modules/academic/actions.ts` | `public.class_assistants` | `FF_PERSISTENCE_ACADEMIC` | **Sudah Ada** | Dual Adapter: tabel `class_assistants` dengan RLS; fallback memori kanonis |
| 3 | `__siajarMaster` | `src/modules/academic/actions.ts` | `public.programs`, `public.semesters`, `public.courses` | `FF_PERSISTENCE_ACADEMIC` | **Sudah Ada** | Dual Adapter: master kurikulum & prodi |
| 4 | `__siajarTugas` | `src/lib/auth/class-access.ts`, `src/modules/academic/actions.ts`, `similarity-actions.ts` | `public.assignments`, `public.submissions` | `FF_PERSISTENCE_CONTENT` | **Sudah Ada** | Dual Adapter: penugasan kelas, deadline, lampiran, dan pengumpulan mahasiswa |
| 5 | `__siajarMateri` | `src/lib/auth/class-access.ts`, `src/modules/academic/actions.ts`, `ai-material-rag.ts` | `public.materials`, `public.material_progress` | `FF_PERSISTENCE_CONTENT` | **Sudah Ada** | Dual Adapter: modul perkuliahan markdown/file |
| 6 | `__siajarMateriProgres` | `src/lib/auth/class-access.ts`, `src/modules/early-warning/evaluator.ts` | `public.materi_progres` | `FF_PERSISTENCE_CONTENT` | **Sudah Ada** | Dual Adapter: persentase pembacaan modul per mahasiswa |
| 7 | `__siajarNilai` | `src/modules/academic/actions.ts` | `public.grades`, `public.grade_history`, `public.grade_items` | `FF_PERSISTENCE_GRADES` | **Sudah Ada** | Dual Adapter: penilaian tugas, kuis, UTS, UAS, dan pembukuan nilai |
| 8 | `__siajarUbah` | `src/modules/academic/actions.ts`, `src/app/api/smoke-actions/route.ts` | `public.grade_change_requests` | `FF_PERSISTENCE_GRADES` | **Sudah Ada** | Dual Adapter: permohonan koreksi nilai pasca finalisasi |
| 9 | `__siajarPresensi` | `src/lib/auth/class-access.ts`, `src/modules/academic/attendance-actions.ts` | `public.attendance_sessions`, `public.attendance_records`, `public.leave_permits` | `FF_PERSISTENCE_ATTENDANCE` | **Sudah Ada** | Dual Adapter: sesi presensi GPS/QR, pencatatan hadir, dan perizinan sakit/dispensasi |
| 10 | `__siajarKuis` | `src/lib/auth/class-access.ts`, `src/modules/academic/quiz-store.ts`, `cbt-exam-actions.ts` | `public.quizzes`, `public.quiz_questions`, `public.quiz_options`, `public.exam_attempts`, `public.exam_answers` | `FF_PERSISTENCE_QUIZ` | **Sudah Ada** | Dual Adapter: bank soal, sesi ujian CBT, kunci jawaban, dan rekaman jawaban |
| 11 | `__siajarDisputes` | `src/modules/academic/dispute-actions.ts`, `cbt-dispute-actions.ts` | `public.exam_disputes`, `public.grade_disputes` | `FF_PERSISTENCE_DISPUTES` | **Sudah Ada** | Dual Adapter: sanggahan nomor soal CBT & sanggahan nilai final |
| 12 | `__siajarDisputeMessages` | `src/modules/academic/dispute-actions.ts` | `public.grade_dispute_messages` | `FF_PERSISTENCE_DISPUTES` | **Sudah Ada** | Dual Adapter: utas percakapan sanggah nilai antara mahasiswa & dosen |
| 13 | `__siajarForumTopics` | `src/modules/academic/actions.ts`, `forum-actions.ts` | `public.discussions` | `FF_PERSISTENCE_CONTENT` | **Sudah Ada** | Dual Adapter: utas forum diskusi kelas dan forum terbuka |
| 14 | `__siajarForumReplies` | `src/modules/academic/actions.ts`, `forum-actions.ts` | `public.discussion_replies` | `FF_PERSISTENCE_CONTENT` | **Sudah Ada** | Dual Adapter: balasan komentar forum diskusi |
| 15 | `__siajarDiskusi` | `src/modules/academic/forum-actions.ts` | `public.discussions` | `FF_PERSISTENCE_CONTENT` | **Sudah Ada** | Alias kompatibilitas internal forum |
| 16 | `__siajarBalasan` | `src/modules/academic/forum-actions.ts` | `public.discussion_replies` | `FF_PERSISTENCE_CONTENT` | **Sudah Ada** | Alias kompatibilitas internal balasan forum |
| 17 | `__siajarUmum` | `src/modules/academic/actions.ts` | `public.announcements` | `FF_PERSISTENCE_CONTENT` | **Sudah Ada** | Dual Adapter: pengumuman kelas & institusi |
| 18 | `__siajarNotif` | `src/modules/academic/actions.ts`, `channels/in-app.ts` | `public.notifications` | `FF_PERSISTENCE_CONTENT` | **Sudah Ada** | Dual Adapter: notifikasi in-app pengguna |
| 19 | `__siajarNotifDedup` | `src/modules/notifications/channels/in-app.ts` | Dedup via DB unique constraint `notifications` | `FF_PERSISTENCE_CONTENT` | **Sudah Ada** | Cache pencegah duplikasi notifikasi in-app |
| 20 | `__siajarNotifPrefs` | `src/modules/notifications/preferences.ts` | `public.notification_preferences` | `FF_PERSISTENCE_CONTENT` | **Sudah Ada** | Dual Adapter: preferensi kanal (email, WhatsApp, in-app) per pengguna |
| 21 | `__siajarNotifLegacyItems` | `src/modules/notifications/legacy-bridge.ts` | `public.notifications` | `FF_PERSISTENCE_CONTENT` | **Sudah Ada** | Jembatan kompatibilitas notifikasi sistem legacy |
| 22 | `__siajarNotifLegacyPrefs` | `src/modules/notifications/legacy-bridge.ts` | `public.notification_preferences` | `FF_PERSISTENCE_CONTENT` | **Sudah Ada** | Jembatan kompatibilitas preferensi notifikasi legacy |
| 23 | `__siajarScheduledNotifications` | `src/modules/notifications/scheduled.ts` | `public.scheduled_notifications` | `FF_PERSISTENCE_CONTENT` | **Sudah Ada** | Dual Adapter: antrean notifikasi terjadwal (reminder tugas, kuis) |
| 24 | `__siajarLibraryCatalog` | `src/modules/academic/actions.ts` | `public.library_items`, `public.library_loans` | `FF_PERSISTENCE_CONTENT` | **Sudah Ada** | Dual Adapter: katalog repositori digital buku & modul perkuliahan |
| 25 | `__siajarCertificates` | `src/modules/academic/badge-certificate-actions.ts` | `public.certificates`, `public.student_badges` | `FF_PERSISTENCE_CONTENT` | **Sudah Ada** | Dual Adapter: sertifikat kelulusan mata kuliah & lencana gamifikasi |
| 26 | `__siajarAktivitasHarian` | `src/lib/aktivitas/pencatat.ts`, `seed.ts` | `public.daily_activities` | `FF_PERSISTENCE_ACADEMIC` | **Sudah Ada** | Dual Adapter: pelacakan aktivitas harian mahasiswa & dosen |
| 27 | `__siajarCustomPasswords` | `src/modules/identity/actions.ts` | `auth.users` via Supabase Auth | `FF_PERSISTENCE_IDENTITY` | **Sudah Ada** | **Keamanan Ketat**: Di production sandi wajib disimpan dan diverifikasi via Supabase Auth; dilarang keras menyimpan sandi di memori |
| 28 | `__siajarEarlyWarningPolicy` | `src/modules/early-warning/policies.ts` | `public.institution_policies` | `FF_PERSISTENCE_ACADEMIC` | **Sudah Ada** | Dual Adapter: kebijakan ambang batas IPK & kehadiran drop-out early warning |
| 29 | `__siajarRiskEvaluations` | `src/modules/early-warning/evaluator.ts` | `public.student_risk_evaluations` | `FF_PERSISTENCE_ACADEMIC` | **Sudah Ada** | Dual Adapter: rekaman evaluasi mahasiswa berisiko akademik |
| 30 | `__siajarEvalPeriods` | `src/modules/academic/evaluation-actions.ts` | `public.evaluation_periods` | `FF_PERSISTENCE_ACADEMIC` | **Sudah Ada** | Dual Adapter: periode survei EDOM (Evaluasi Dosen oleh Mahasiswa) |
| 31 | `__siajarEvalReceipts` | `src/modules/academic/evaluation-actions.ts` | `public.evaluation_completions` | `FF_PERSISTENCE_ACADEMIC` | **Sudah Ada** | Dual Adapter: bukti anonim partisipasi pengisian kuesioner evaluasi |
| 32 | `__siajarEvalResponses` | `src/modules/academic/evaluation-actions.ts` | `public.evaluation_responses`, `public.evaluation_answers` | `FF_PERSISTENCE_ACADEMIC` | **Sudah Ada** | Dual Adapter: agregasi skor kuesioner dan umpan balik kualitatif EDOM |
| 33 | `__siajarExtensions` | `src/modules/academic/assignment-late-actions.ts` | `public.assignment_extensions` | `FF_PERSISTENCE_CONTENT` | **Sudah Ada** | Dual Adapter: dispensasi penambahan waktu pengumpulan tugas |
| 34 | `__siajarFeedbackComments` | `src/modules/academic/feedback-comment-actions.ts`, `rubric-actions.ts` | `public.feedback_comments` | `FF_PERSISTENCE_GRADES` | **Sudah Ada** | Dual Adapter: komentar umpan balik terinci pada penilaian tugas |
| 35 | `__siajarRubrics` | `src/modules/academic/rubric-actions.ts` | `public.rubrics`, `public.rubric_criteria`, `public.rubric_levels` | `FF_PERSISTENCE_GRADES` | **Sudah Ada** | Dual Adapter: rubrik penilaian multi-kriteria berbasis CPL/CPMK |
| 36 | `__siajarRubricScores` | `src/modules/academic/rubric-actions.ts` | `public.rubric_scores` | `FF_PERSISTENCE_GRADES` | **Sudah Ada** | Dual Adapter: skor rubrik per kriteria pada tugas mahasiswa |
| 37 | `__siajarGroupSets` | `src/modules/academic/group-actions.ts` | `public.group_sets` | `FF_PERSISTENCE_ACADEMIC` | **Sudah Ada** | Dual Adapter: konfigurasi himpunan kelompok tugas kelas |
| 38 | `__siajarGroups` | `src/modules/academic/group-actions.ts` | `public.groups`, `public.group_members` | `FF_PERSISTENCE_ACADEMIC` | **Sudah Ada** | Dual Adapter: kelompok belajar mahasiswa dan keanggotaan tim |
| 39 | `__siajarSimilarityConfigs` | `src/modules/academic/similarity-engine.ts` | `public.similarity_runs` | `FF_PERSISTENCE_CONTENT` | **Sudah Ada** | Dual Adapter: sesi komputasi kemiripan tugas & esai |
| 40 | `__siajarSimilarityPairs` | `src/modules/academic/similarity-engine.ts` | `public.similarity_pairs` | `FF_PERSISTENCE_CONTENT` | **Sudah Ada** | Dual Adapter: pasangan submission yang terindikasi plagiarisme |
| 41 | `__siajarQuestionRevisionFlags` | `src/modules/academic/item-analysis-actions.ts` | `public.exam_item_stats` | `FF_PERSISTENCE_QUIZ` | **Sudah Ada** | Dual Adapter: status butir soal anomali (daya pembeda buruk / terlalu sulit) |
| 42 | `__siajarUserProfiles` | `src/modules/notifications/service.ts` | `public.profiles` | `FF_PERSISTENCE_IDENTITY` | **Sudah Ada** | Cache pembacaan nama dan kontak profil pengguna |
| 43 | `__siajarCalendarTokens` | `src/modules/academic/calendar-sync-actions.ts` | `public.user_identifiers` | `FF_PERSISTENCE_ACADEMIC` | **Sudah Ada** | Dual Adapter: token privat iCal sinkronisasi kalender perkuliahan |
| 44 | `__siajarTokenToUserMap` | `src/modules/academic/calendar-sync-actions.ts` | `public.user_identifiers` | `FF_PERSISTENCE_ACADEMIC` | **Sudah Ada** | Pemetaan token iCal ke user ID |
| 45 | `__siajarAiChatHistory` | `src/modules/academic/ai-material-rag.ts` | Memori Sesi RAG | - | **In-Memory Sesi** | Riwayat percakapan asistensi RAG berbasis sesi kontekstual aktif |
| 46 | `__siajarAiExamRateLimit` | `src/modules/academic/ai-quiz-generator.ts` | Distributed Redis / Memori | - | **Distributed Cache** | Pembatasan pemanggilan AI Exam Generator per dosen per hari |
| 47 | `__siajarJoinFails` | `src/modules/academic/actions.ts` | Upstash Redis (`join_class:<uid>`) / Memori | - | **Distributed Rate Limit** | Pembatasan percobaan kode gabung kelas (maksimal 8 kegagalan per 10 menit) |

---

## 2. Pola Arsitektur: Repository dengan Dua Adapter

Setiap modul domain mengimplementasikan pemisahan tegas antara logika bisnis (server action) dengan sumber data:
1. **Supabase Adapter**: Aktif ketika koneksi database Supabase tersedia (`checkSupabaseOnline() === true`) dan feature flag domain terkait aktif (`FF_PERSISTENCE_*`). Seluruh manipulasi data diverifikasi oleh Row Level Security (RLS) di level Postgres.
2. **In-Memory Demo Adapter**: Aktif saat aplikasi dijalankan secara lokal tanpa database Supabase atau dalam skenario demo offline. Menyediakan data seed yang konsisten sehingga seluruh fitur antarmuka tetap berfungsi tanpa error.
3. **Penyembunyian Abstraksi**: Komponen UI tidak pernah memeriksa `if (isOnline)`. Seluruh pemanggilan antarmuka menerima bentuk respons standar yang sama (`ActionResponse<T>`).

---

## 3. Pembatas Laju Terdistribusi (Rate Limiter)

- **Login Lockout**: Membatasi 5 kegagalan autentikasi beruntun per akun. Terhubung ke Upstash Redis REST API (`siajar:rl:lockout:<identifier>`) saat `UPSTASH_REDIS_REST_URL` dikonfigurasi, dengan fallback memori lokal terisolasi saat offline.
- **Join Class Lockout**: Membatasi maksimal 8 kesalahan kode kelas per 10 menit per mahasiswa. Terhubung ke Upstash Redis REST API (`siajar:rl:join_class:<userId>`) secara transparan.
