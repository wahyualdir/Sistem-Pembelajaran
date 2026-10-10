# SIAJAR — Sistem Informasi Ajar Terpadu
**Workflow, Arsitektur & Rencana Pengembangan**  
Perencanaan produk lengkap: kebutuhan, data, RLS, AI agent, keamanan perangkat, pengujian, jadwal — Next.js + Supabase + Vercel  
*Versi 3.0 · 30 September 2026*  
*Proyek perkuliahan — Teknik Informatika*

---

## 1. Latar Belakang, Tujuan, dan Ruang Lingkup
SIAJAR dirancang sebagai satu ruang kerja akademik: satu identitas pengguna, satu model data akademik, beberapa role dengan lingkup akses berbeda, dan satu alur pembelajaran yang dapat ditelusuri dari aktivitas awal sampai hasil akhir.

### Sasaran Terukur (untuk MVP)
- **Alur inti berjalan end-to-end**: Vertical slice pertama lulus uji dari login sampai mahasiswa melihat nilai dan feedback.
- **Otorisasi benar**: 100% test case negatif pada matriks otorisasi (Bagian 14.3) lulus; tidak ada route sensitif yang terbuka lewat URL langsung.
- **Data nyata**: Seluruh angka dashboard berasal dari query data nyata, tanpa placeholder.
- **Keamanan dasar**: Password ter-hash, sesi aman, rate limiting login aktif, upload file tervalidasi.

---

## 2. Struktur Role
Sistem memiliki 6 role:
1. `STUDENT` (Mahasiswa): Kelas, materi, tugas, kuis, ujian, diskusi, nilai, kalender.
2. `LECTURER` (Dosen): Kelas, materi, tugas, kuis, penilaian, kehadiran, analitik.
3. `TEACHING_ASSISTANT` (Asisten Dosen): Review submission, moderasi diskusi, materi, kehadiran sesuai izin.
4. `PROGRAM_COORDINATOR` (Koordinator Prodi): Dosen, kelas, mata kuliah, monitoring, laporan.
5. `ACADEMIC_STAFF` (Staf Akademik): Mahasiswa, dosen, semester, kelas, jadwal, laporan.
6. `SYSTEM_ADMIN` (System Administrator): User, role, permission, konfigurasi, audit, monitoring.

---

## 3. Workflow Login dan Authorization
Alur: Login -> Authentication -> User Identity -> Role -> Permission -> Scope -> Portal yang sesuai.
- Status Akun: `ACTIVE`, `PENDING`, `LOCKED` (setelah 5x gagal dalam 15 menit), `SUSPENDED`, `DEACTIVATED`.
- Password: minimal 10 karakter, tidak boleh sama dengan NIM/email. `must_change_password = true` memaksa ganti password saat login pertama.
- Multi-role: Pengguna dengan >1 role diarahkan ke `/workspace` untuk memilih role aktif.

---

## 6. Arsitektur Data Inti (Identity & Security)
- PK/FK: UUID (`gen_random_uuid()`).
- Waktu: `timestamptz` (UTC).
- RLS aktif di seluruh tabel skema `public` tanpa kecuali.
- Tabel Identity:
  - `profiles` (id, full_name, email, status, must_change_password, locked_until, last_login_at, preferred_locale, timezone, created_at, updated_at)
  - `user_identifiers` (id, user_id, type, value, is_primary, created_at, updated_at)
  - `roles` (id, code, name, description, created_at)
  - `permissions` (id, code, resource, action, description, created_at)
  - `role_permissions` (role_id, permission_id)
  - `user_roles` (id, user_id, role_id, scope_type, scope_id, valid_from, valid_until, granted_by, status, created_at, updated_at)
  - `audit_logs` (id, actor_user_id, actor_role, action, entity_type, entity_id, scope_type, scope_id, before_json, after_json, ip_address, user_agent, request_id, created_at)
  - `user_devices` (id, user_id, device_id_hash, label, first_seen_at, last_seen_at, last_ip_masked, last_country, last_city, last_session_id, trusted, revoked_at, created_at, updated_at)
  - `login_events` (id, user_id, device_id, event_type, is_new_device, risk_level, ip_masked, country, city, notified_at, created_at)
  - `system_settings` (key, value_json, updated_by, updated_at)

---

## 7. Permission Model
- Format permission: `resource.action` (contoh: `class.view`, `assignment.submit`, `grade.finalize`).
- Prinsip pemisahan wewenang: Admin tidak otomatis memiliki wewenang akademik; Asisten tidak dapat memfinalisasi nilai (`grade.finalize`).

---

## 9. Arsitektur Sistem dan Tech Stack
- Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui.
- Supabase Auth + Postgres + RLS + Storage + Realtime + pgvector.
- Tiga Klien Supabase:
  - Browser (`src/lib/supabase/client.ts`)
  - Server (`src/lib/supabase/server.ts`)
  - Admin (`src/lib/supabase/admin.ts` dengan `import 'server-only'`)

---

## 22. Keamanan Perangkat dan Sesi
- Cookie `device_id` (acak, jangka panjang).
- Deteksi perangkat baru, peringatan via email/in-app.
- Halaman Perangkat & Sesi: daftar perangkat, cabut sesi, aksi darurat "Ini bukan saya".
- Skenario Uji D1-D8:
  - D1: Login browser baru -> tercatat + notifikasi terkirim.
  - D2: Login ulang dari perangkat sama -> update `last_seen_at`.
  - D3: Cabut satu perangkat lain -> sesi perangkat tersebut gugur (401).
  - D4: Cabut semua perangkat lain -> hanya perangkat saat ini yang aktif.
  - D5: "Ini bukan saya" -> cabut semua sesi, akun LOCKED, wajib reset password, audit log.
  - D6: 5x gagal login berurutan -> akun LOCKED 15 menit.
  - D7: Pengguna A membaca `user_devices` pengguna B -> ditolak RLS (0 baris).
  - D8: Ganti password -> semua sesi lain dicabut, email terkirim.

---

## 23. Implementasi Next.js + Supabase dan RLS
- Tiga Lapis Otorisasi: Middleware -> Server Action -> Postgres RLS.
- Helper Functions (SECURITY DEFINER with `search_path = ''`):
  `has_global_role(code)`, `is_class_staff(class_id)`, `is_enrolled(class_id)`, `has_class_permission(class_id, code)`, `is_program_coordinator(program_id)`.
- Custom Access Token Hook menyisipkan klaim role ringkas ke JWT.
- Pengujian RLS via pgTAP dan Playwright.
