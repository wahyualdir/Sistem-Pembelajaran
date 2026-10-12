# Runbook Pengujian & Verifikasi Supabase Staging (K5)

> [!IMPORTANT]
> **ATURAN KERAS KEAMANAN:**
> Dilarang keras menuliskan kunci API rahasia (`service_role_key`), token akses, kata sandi pangkalan data, atau URL proyek nyata ke dalam repositori git. Seluruh variabel sensitif wajib dikonfigurasikan melalui berkas `.env.local` lokal yang diabaikan oleh `.gitignore` atau disuntikkan via *Environment Variables* di platform deployment.

Dokumen ini adalah panduan standar operasional (*runbook*) untuk menghubungkan lingkungan pengembangan lokal ke proyek **Supabase STAGING** terpisah dan memvalidasi seluruh lapisan keamanan (RLS, Triggers, RPC, dan PostgREST) secara nyata sebelum melanjutkan pengembangan ke Domain 3 (Evaluasi Akademik & Buku Nilai).

---

## 1. Persiapan & Penghubungan Supabase CLI ke Proyek Staging

Pastikan Supabase CLI telah terpasang di komputer pengembang (`supabase --version`).

### Langkah 1.1: Autentikasi Pengembang
Masuk ke akun Supabase organisasi:
```bash
supabase login
```
*Token personal access token (PAT) akan disimpan di mesin lokal pengembang secara aman.*

### Langkah 1.2: Menghubungkan Proyek Staging
Jalankan perintah linking ke proyek Staging khusus (ganti `<STAGING_PROJECT_REF>` dengan ID referensi proyek Anda dari Dashboard Supabase):
```bash
supabase link --project-ref <STAGING_PROJECT_REF>
```
*Saat diminta memasukkan kata sandi database, masukkan kata sandi database Staging yang telah dibuat di Dashboard.*

---

## 2. Urutan Penerapan Migrasi Basis Data (`db push`)

Seluruh berkas migrasi pada direktori `supabase/migrations` (1..18) telah diuji coba dari nol pada mesin lokal (PGlite). Terapkan berkas migrasi ke database Staging dengan urutan deterministik:

```bash
# Periksa status migrasi lokal vs remote staging
supabase migration list

# Terapkan seluruh berkas migrasi secara sekuensial
supabase db push
```

### Verifikasi Kerapian Skema
Pastikan tidak ada perbedaan skema tak terlacak antara migrasi dan remote staging:
```bash
supabase db diff
```
*Keluaran harus bersih (tidak ada diff skema yang tertinggal).*

---

## 3. Daftar Uji Ulang Wajib di Lingkungan Staging (Checklist K5)

Sebelum melanjutkan ke Domain 3 (Fase 3B), lakukan pengujian verifikasi nyata dengan REST API PostgREST & Auth JWT pada proyek Staging:

| No | Kategori Pengujian | Prosedur Uji Staging | Ekspektasi Hasil | Status |
|---|---|---|---|---|
| **1** | **Hak Eksekusi RPC (F4)** | Panggil RPC via REST `/rest/v1/rpc/approve_class` menggunakan request tanpa token (`anon`). | HTTP 401 Unauthorized / HTTP 403 Forbidden (`has_function_privilege` anon = false). | [ ] |
| **2** | **Proteksi UPDATE Sensitif Kelas (F1)** | Login sebagai Dosen, kirim PATCH ke `/rest/v1/classes?id=eq.<CLASS_ID>` dengan payload `{"status": "CLOSED"}` atau `{"lecturer_id": "<ID>"}`. | HTTP 400 / 500 dengan pesan error `DIRECT_UPDATE_RESTRICTED`. Nilai tidak berubah. | [ ] |
| **3** | **Update Non-Sensitif Kelas (F1)** | Login sebagai Dosen kelas, kirim PATCH ke `/rest/v1/classes?id=eq.<CLASS_ID>` dengan payload `{"title": "Nama Baru", "capacity": 50}`. | HTTP 200/204 Berhasil terbarui. | [ ] |
| **4** | **Proteksi UPDATE Enrollment (F1)** | Login sebagai Staf, kirim PATCH langsung ke `/rest/v1/enrollments` untuk mengubah `status` atau `class_id`. | HTTP 400 / 500 dengan pesan error `DIRECT_UPDATE_RESTRICTED`. Wajib lewat RPC resmi. | [ ] |
| **5** | **Pencabutan SUPER_ADMIN (F5)** | Login sebagai Super Admin, kirim POST ke `/rest/v1/rpc/enroll_student` atau `/rest/v1/rpc/approve_class`. | HTTP 400 / 403 `FORBIDDEN`. Super Admin tidak memiliki wewenang eksekusi akademik. | [ ] |
| **6** | **Persetujuan Kelas Kaprodi (F6)** | 1. Kaprodi menyetujui kelas buatannya sendiri (`created_by = auth.uid()`).<br>2. Kaprodi menyetujui transisi ilegal (mis. `OPEN` ke `DRAFT`).<br>3. Kaprodi menolak kelas tanpa alasan (`reason = ''`).<br>4. Kaprodi menolak kelas dengan alasan tertulis. | 1. Ditolak `SELF_APPROVAL_FORBIDDEN`.<br>2. Ditolak `INVALID_STATUS_TRANSITION`.<br>3. Ditolak `REASON_REQUIRED`.<br>4. Berhasil dan `rejection_reason` tersimpan. | [ ] |
| **7** | **Jalur Pengajuan Staf (F6)** | Login sebagai Staf Akademik, kirim POST ke `/rest/v1/rpc/propose_class`. | HTTP 200 Berhasil membuat kelas dengan status `DRAFT` siap tinjau. | [ ] |
| **8** | **Validasi Kelas Paralel (F7)** | Staf memindahkan mahasiswa ke kelas beda mata kuliah/semester via `/rest/v1/rpc/transfer_class`. | HTTP 400 `NOT_PARALLEL_CLASS`. | [ ] |
| **9** | **Validasi Status Kelas Enroll (F7)**| Staf mendaftarkan mahasiswa ke kelas berstatus `CLOSED` via `/rest/v1/rpc/enroll_student`. | HTTP 400 `CLASS_NOT_ACCEPTING_ENROLLMENTS`. | [ ] |
| **10**| **Batas Batch CSV (F7)** | Staf mengirim array JSON > 1000 baris ke `/rest/v1/rpc/batch_enroll_students`. | HTTP 400 `BATCH_LIMIT_EXCEEDED`. | [ ] |
| **11**| **Imutabilitas Audit Log** | Kirim UPDATE / DELETE ke tabel `/rest/v1/audit_logs` dengan token apa pun. | Ditolak trigger `tr_audit_logs_immutable`. | [ ] |

---

## 4. Konfigurasi Lingkungan Server Staging

Di dasbor deployment staging (misal Vercel / Railway Staging environment):
```env
NODE_ENV="production"
ALLOW_DEMO_AUTH="false"
NEXT_PUBLIC_ENABLE_DEMO_LOGIN="false"

# Base URL Staging
NEXT_PUBLIC_APP_URL="https://staging.siajar.ac.id"

# Koneksi Supabase Staging
DATABASE_URL="postgresql://postgres.[STAGING_REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[STAGING_REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[STAGING_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<STAGING_ANON_KEY>"
SUPABASE_SERVICE_ROLE_KEY="<STAGING_SERVICE_ROLE_KEY>"

# Rahasia Token HMAC Impersonasi
APP_SECRET="<GENERATED_STRONG_RANDOM_SECRET_FOR_STAGING>"

# Feature Flags Persistensi Server-Only (Diaktifkan bertahap)
FF_PERSISTENCE_IDENTITY="true"
FF_PERSISTENCE_ACADEMIC="true"
```

---

## 5. Rencana Kontingensi & Rollback Staging

Bila terjadi kegagalan saat migrasi di Staging:
1. Periksa status error migrasi:
   ```bash
   supabase migration list
   ```
2. Reset database staging ke snapshot stabil terakhir (jika diperlukan):
   ```bash
   # HANYA di lingkungan STAGING, JANGAN PERNAH di produksi:
   supabase db reset --linked
   ```
3. Lakukan perbaikan SQL pada berkas migrasi perbaikan baru (tanpa mengubah histori migrasi lama).
