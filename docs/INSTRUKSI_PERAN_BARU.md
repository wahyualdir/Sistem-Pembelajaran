# SIAJAR — Instruksi Peran Baru untuk Antigravity

Versi 1 · Oktober 2026 · Bahasa antarmuka dan dokumentasi: Indonesia

Berkas ini satu-satunya sumber instruksi untuk tahap penambahan peran. Taruh di `docs/INSTRUKSI_PERAN_BARU.md`, lalu tempel prompt pembuka di bawah ke chat Antigravity.

## Prompt pembuka (tempel ke Antigravity)

```
Baca seluruh isi docs/INSTRUKSI_PERAN_BARU.md sebelum menyentuh kode apa pun.

Kerjakan Fase 0 sampai Fase 6 secara berurutan dan mandiri. Jangan berhenti untuk meminta
konfirmasi di antara fase. Kalau ada hal yang tidak jelas, pilih opsi paling aman, catat
keputusannya di docs/KEPUTUSAN_PERAN_BARU.md, lalu lanjut.

Mulai dengan audit kode (Fase 0). Jangan berasumsi nama tabel, kolom, fungsi, atau rute:
semua nama di dokumen ini adalah sketsa, nama sebenarnya ikuti yang ada di repo.

Desain web TIDAK boleh berubah: pakai token, komponen, dan pola halaman yang sudah ada. Menu
dan fitur tiap peran harus sesuai wewenang dan benar-benar berfungsi (lihat Bagian 3).

Setelah tiap fase: jalankan `npm run cek`, `npm run cek:hex`, dan `npm run build`, perbaiki sampai hijau, commit,
lalu tulis ringkasan di docs/PROGRESS_PERAN_BARU.md. Jangan menghapus atau mengubah perilaku
fitur yang sudah ada kecuali dinyatakan eksplisit di dokumen ini.
```

---

## 1. Tujuan

Menambah tiga peran baru dan satu penugasan baru, tanpa merusak tujuh peran yang sudah ada.

| Item | Jenis | Kode | Lingkup |
| --- | --- | --- | --- |
| Sekretaris Prodi | Peran baru | `PROGRAM_SECRETARY` | `PROGRAM` |
| Kepala/Ketua Laboratorium | Peran baru | `LAB_HEAD` | `LAB` (baru) |
| Dekan | Peran baru | `DEAN` | `FACULTY` (baru) |
| Dosen Wali | **Bukan peran.** Tugas yang melekat pada `LECTURER` | — | per mahasiswa |
| Koordinator | Sudah ada: `PROGRAM_COORDINATOR` (Koordinator Prodi). Dipertahankan dan diselaraskan | — | `PROGRAM` |

Catatan penting soal Dosen Wali: **jangan membuat baris baru di tabel `roles`** dan jangan membuat workspace baru. Dosen Wali adalah relasi dosen–mahasiswa (perwalian) yang dikelola sebagai data, dan menunya muncul di workspace Dosen.

Catatan soal Asisten Lab: pengelolaan Asisten Lab dipindahkan dari Staf Akademik dan Dosen menjadi **Dosen Pengampu dan Kepala Lab saja** (rincian di Fase 4.1).

Catatan soal rangkap peran: di kampus, Sekretaris Prodi, Kepala Lab, dan Dekan hampir selalu juga dosen. Satu akun boleh memegang `LECTURER` ditambah peran jabatan. Fitur dosen jangan disalin ke peran jabatan; pengguna berpindah lewat pemilih workspace/peran aktif yang sudah ada.

## 2. Cara kerja yang diminta

1. **Audit dulu, baru ubah.** Hasil audit ditulis ke `docs/AUDIT_PERAN_BARU.md` (maksimal dua halaman).
2. **Pakai yang sudah ada.** Pakai helper RLS, pola server action, komponen `coordinator-*-hub-view.tsx`, pola menu, dan pola audit log yang sudah ada. Jangan membuat versi kedua.
3. **Migrasi selalu berkas baru** bernomor di `supabase/migrations` (lanjutkan setelah nomor terakhir). Jangan edit migrasi lama. Idempoten sejauh mungkin, dan di komentar atas berkas tulis cara membatalkannya.
4. **RLS wajib untuk setiap tabel baru**, diaktifkan di migrasi yang sama dengan pembuatan tabel. Fungsi helper baru: `SECURITY DEFINER`, `SET search_path = ''`, `STABLE`, lalu `REVOKE ALL ... FROM PUBLIC, anon` dan `GRANT EXECUTE ... TO authenticated`, sama seperti `is_program_coordinator`.
5. Validasi input server action dengan Zod. Format hasil seragam `{ ok: true, data }` atau `{ ok: false, pesan, kolom? }`. Pesan galat berbahasa Indonesia yang natural.
6. Aksi sensitif (tetapkan/cabut wali, beri/cabut peran jabatan, setujui/tolak) wajib masuk `audit_logs` dengan aktor, peran aktif, entitas, nilai sebelum dan sesudah.
7. Semua daftar yang bisa lebih dari 50 baris memakai pagination. Tidak boleh ada N+1.
8. Ikuti `docs/PRIVASI_DATA_AKTIVITAS.md`: peran baru tidak otomatis boleh melihat detail aktivitas harian mahasiswa.
9. **Jangan menambah fitur di luar dokumen.** Ide tambahan dicatat di `docs/IDE_LANJUTAN.md`, tidak dikerjakan.
10. Folder `(dashboard)/` dan `src/lib/auth/session.ts` adalah sisa auth lama (peran `ADMIN/DOSEN/MAHASISWA`). **Jangan dikembangkan dan jangan dipakai untuk peran baru.** Semua peran baru hanya hidup di `(portal)/` dan alur Supabase Auth. Kalau terpaksa menyentuh file lama, catat di KEPUTUSAN.

---

## 3. Aturan desain dan menu (wajib di semua fase)

### 3.1 Desain web tetap sama

Penambahan peran **tidak boleh mengubah tampilan aplikasi**. Halaman peran baru harus terlihat seperti bagian dari aplikasi yang sudah ada.

- Jangan mengubah tema, palet warna, tipografi, bentuk sidebar/header, ukuran, spasi, atau animasi yang ada.
- Jangan mengedit `tailwind.config.ts`, variabel tema di CSS global, dan isi `src/components/ui`, `src/components/retro`, `src/components/os`. Kalau benar-benar perlu komponen yang belum ada, **tambah** komponen kecil baru (jangan ubah yang lama) dan catat alasannya di KEPUTUSAN.
- Pakai kelas berbasis token yang sudah dipakai halaman lain (misalnya `bg-surface`, `text-ink`, `bg-primary`, `border-border`, `text-gray-dark`) dan komponen dari `ui/` dan `shared/`. Tidak ada warna hex mentah, tidak ada gaya baru. `npm run cek:hex` wajib lolos.
- Mode terang/gelap ikut mekanisme yang sudah ada (`darkMode: class`). Jangan membuat penanganan tema sendiri.
- Susunan halaman meniru halaman peran lain yang setara: pola hub view (`coordinator-*-hub-view`, `staff-*-hub-view`), header, kartu, tabel, empty state, loading, dan galat. Tampilan di layar ponsel harus sama responsifnya dengan halaman yang ada.
- Jangan mengerjakan instruksi redesain mana pun (misalnya `INSTRUKSI_REDESAIN_*.md`) dalam tahap ini. Karena semua halaman baru memakai token, redesain di masa depan otomatis ikut berlaku.

### 3.2 Menu dan fitur harus sesuai

- Satu sumber navigasi: `src/lib/config/menu-config.ts`. Untuk tiap peran baru, lengkapi semua yang di sana terkait peran: entri `MENU_CONFIG`, `normalizeRoleCode`, `getRoleHomeHref`, `getRoleDisplayName`, `isRouteAllowedForRole`, serta `BERANDA_CHIPS` dan `SHARED_SUPPORT_GROUP` bila relevan. Ikuti pola grup yang dipakai peran lain (judul grup, ikon `lucide-react`, label Indonesia yang singkat).
- **Satu item menu = satu fitur yang benar-benar jalan.** Setiap item menu harus membuka halaman fungsional yang membaca data nyata. Dilarang menambah item menu yang halamannya cangkang, placeholder, atau "segera hadir". Kalau suatu fitur belum selesai di fase itu, item menunya **jangan** ditambahkan.
- **Menu mengikuti wewenang.** Item yang ada di menu hanya yang diizinkan matriks di Fase 6.2. Sebaliknya, setiap izin dalam matriks harus punya jalan masuk di menu. Tidak boleh ada fitur yang hanya bisa dicapai lewat mengetik URL.
- **Penjagaan di server, bukan hanya UI.** Setiap rute baru dilindungi `isRouteAllowedForRole`, dan setiap server action memeriksa peran/lingkup sendiri, ditambah RLS di database. Menyembunyikan menu saja tidak dianggap cukup.
- Item bersama (Beranda, Kalender, Notifikasi, Pengumuman) memakai komponen dan rute bersama yang sudah ada, bukan salinan baru.
- Tambahan menu "Perwalian" di workspace Dosen tidak boleh mengubah, memindahkan, atau menghapus item dosen yang sudah ada.
- Hasil akhir tiap fase dicatat di `PROGRESS_PERAN_BARU.md` sebagai tabel **menu → rute → server action → kebijakan RLS/permission**, supaya terlihat tidak ada menu yatim dan tidak ada fitur tanpa menu.

---

## Fase 0 — Audit (wajib, sebelum mengubah apa pun)

Baca dan tulis temuan ke `docs/AUDIT_PERAN_BARU.md`:

1. Skema identitas: `roles`, `user_roles` (kolom `scope_type`, `scope_id`, `valid_until`, `status`), enum `scope_type` (saat ini `GLOBAL`, `PROGRAM`, `CLASS`), `permissions`, `role_permissions`, seed di `supabase/seed.sql`, dan migrasi yang menambah `SUPER_ADMIN`.
2. Semua tempat yang menyebut peran, supaya tidak ada yang terlewat:
   ```
   grep -rn "PROGRAM_COORDINATOR" src supabase scripts tests
   grep -rn "ACADEMIC_STAFF" src supabase scripts tests
   grep -rn "has_active_role\|has_global_role\|is_program_coordinator" supabase/migrations
   grep -rn "activeRole" src
   ```
   Untuk **setiap** kemunculan, catat keputusan: peran baru ikut diberi akses, tidak diberi akses, atau diberi akses terbatas. Jangan menambahkan peran baru ke daftar mana pun secara otomatis.
3. Tipe peran di TypeScript (union/konstanta) dan semua tempat yang membuat tipe itu "tertutup" (switch, record, map menu).
4. `src/lib/config/menu-config.ts`, pemilih workspace/peran aktif, dan halaman manajemen pengguna (tempat peran diberikan).
5. Tabel `programs`, `rooms`, `class_assistants` (termasuk kolom `assistant_type` dengan nilai `ASISTEN_DOSEN`/`ASISTEN_LAB`), fungsi `set_assistant` (versi terbaru di migrasi `20261020000036`), policy `class_assistants_select`, server action `setAssistantAction` di `src/modules/academic/actions.ts`, UI penugasan di `assistant-forms.tsx`, `staff-classes-hub-view.tsx`, dan `class-hub-tabs.tsx` (cabang `isStaff`), tabel kelas dan jadwal (`class_schedule_slots`), serta `is_class_coordinator`.
6. Modul perwalian yang sudah ada di jalur baru: `getMentoringAdviseesRisk`, `mentoring-risk-view`, `getMentoringRiskListAction`, status "Menunggu Persetujuan Wali"/"Disetujui Dosen Wali" di `requests-view.tsx`, `community/mentoring`, dan pesan di `message-actions.ts`. Catat dari mana data wali sebenarnya diambil sekarang. Di kode lama, wali ada sebagai `dosenWaliId` di `MasterStore`; itu jalur legacy.
7. Desain dan navigasi: token warna di `tailwind.config.ts` dan variabel tema, isi `scripts/cek-hex.js`, komponen di `src/components/ui` dan `shared`, pola hub view, serta semua fungsi di `menu-config.ts` (`MENU_CONFIG`, `getMenuGroupsForRole`, `isRouteAllowedForRole`, `LEGACY_ROUTE_REDIRECTS`). Catat halaman peran lain yang akan dijadikan acuan tampilan untuk tiap peran baru.
8. Skrip pemeriksaan: `scripts/check-rls.ts`, `generate-schema-snapshot.mjs`, `check-plan-vs-snapshot.mjs`, serta pola tes di `tests/` dan `supabase/tests`.

**Selesai bila:** `AUDIT_PERAN_BARU.md` berisi tabel "kemunculan peran → keputusan" yang lengkap.

---

## Fase 1 — Fondasi peran dan lingkup

### 1.1 Migrasi

Pisahkan menjadi berkas-berkas berikut (urutan penting):

1. **Berkas khusus enum:** `ALTER TYPE public.scope_type ADD VALUE IF NOT EXISTS 'FACULTY';` dan `... 'LAB';`. Taruh di berkas sendiri, tanpa pernyataan lain yang memakai nilai baru itu, karena nilai enum baru tidak boleh dipakai dalam transaksi yang sama.
2. **Berkas master data:**
   - `faculties` (id, code unik, name, is_active, timestamps).
   - `programs.faculty_id` (nullable, FK ke `faculties`, indeks). Backfill: buat satu fakultas bawaan dan hubungkan program yang ada hanya kalau dari seed bisa dipastikan; kalau tidak, biarkan null dan catat.
   - `laboratories` (id, program_id, code unik, name, room_id nullable ke `rooms`, is_active, timestamps).
   - `class_laboratories` (class_id, laboratory_id, PK gabungan) untuk menghubungkan kelas praktikum dengan lab.
3. **Berkas peran:** seed ke `roles` dengan `ON CONFLICT (code) DO UPDATE`:
   - `PROGRAM_SECRETARY` — "Sekretaris Program Studi" — id `10000000-0000-0000-0000-000000000011`
   - `LAB_HEAD` — "Kepala Laboratorium" — id `10000000-0000-0000-0000-000000000012`
   - `DEAN` — "Dekan" — id `10000000-0000-0000-0000-000000000013`

   Tambahkan permission baru ke `permissions` dan `role_permissions` mengikuti pola matriks di `seed.sql`, sesuai matriks wewenang di Fase 6.2. Taruh di migrasi (bukan hanya di `seed.sql`), seperti yang dilakukan untuk `SUPER_ADMIN`.
4. **Berkas helper:** `is_program_secretary(program_id)`, `is_dean_of_program(program_id)` (benar bila Dekan fakultas yang menaungi program itu), `is_lab_head(lab_id)`, `is_lab_head_of_class(class_id)`. Tiru struktur `is_program_coordinator`, termasuk pemeriksaan `status = 'ACTIVE'`, `valid_until`, dan fallback `GLOBAL` hanya bila pola lama memakainya.

### 1.2 Kode

- Perbarui tipe peran di TypeScript dan semua tempat yang memaksa tipe itu lengkap (compile error adalah daftar kerja Anda).
- Pemilih workspace/peran aktif harus menampilkan peran baru dengan label Indonesia.
- Daftarkan tiga peran di helper `menu-config.ts` sesuai Bagian 3.2 (kerangka dulu; item menu diisi di fase masing-masing, hanya setelah fiturnya berfungsi).
- Halaman manajemen pengguna: peran baru bisa diberikan dengan pemilih lingkup yang sesuai (program, fakultas, lab). **Hanya `SUPER_ADMIN` yang boleh memberi atau mencabut tiga peran baru.** Setiap pemberian dan pencabutan masuk audit log.
- Halaman master data fakultas dan laboratorium (CRUD sederhana) untuk `SUPER_ADMIN` dan `ACADEMIC_STAFF`, memakai komponen tabel dan form yang sudah ada.
- Impersonasi oleh `SUPER_ADMIN` harus bisa meniru peran baru dengan lingkupnya, memakai mekanisme yang sudah ada.

**Selesai bila:** akun demo dengan peran baru bisa login, muncul di pemilih workspace, dan `npm run cek` hijau (termasuk `check:rls` dan `check:snapshot`; jalankan `npm run snapshot` untuk memperbarui `docs/schema-snapshot.md`).

---

## Fase 2 — Dosen Wali sebagai tugas Dosen

### 2.1 Data

Tabel baru `academic_advisories` (nama bebas, ikuti konvensi repo):

- `id`, `advisor_user_id` (FK profiles, harus pemegang `LECTURER`), `student_user_id` (FK profiles, harus pemegang `STUDENT`), `program_id`, `angkatan` (opsional), `valid_from`, `valid_until` nullable, `status` (`ACTIVE`/`ENDED`), `assigned_by`, timestamps.
- Indeks unik parsial: satu mahasiswa hanya punya **satu** wali berstatus `ACTIVE`.
- Tabel `advisory_notes` untuk catatan perwalian (advisory_id, author, isi, created_at). Catatan hanya dibaca oleh wali yang bersangkutan, plus Koordinator Prodi dan Sekretaris Prodi program itu. Mahasiswa tidak melihat catatan internal; tetapi lihat kolom terpisah `catatan_untuk_mahasiswa` bila fitur KRS sudah memakainya (cek `catatanWali` di `requests-view.tsx`).
- Helper: `is_advisor_of(student_id)` dan `advisor_of_current_student()`.
- RLS:
  - Wali: melihat hanya mahasiswa bimbingannya yang `ACTIVE`.
  - Mahasiswa: melihat wali miliknya sendiri.
  - `PROGRAM_COORDINATOR`, `PROGRAM_SECRETARY`: melihat dan mengelola untuk program lingkupnya.
  - `ACADEMIC_STAFF`, `SUPER_ADMIN`: seperti pola yang sudah ada.
  - `DEAN`: tidak membaca baris per mahasiswa; hanya agregat lewat fungsi/view (Fase 5).
  - `SYSTEM_ADMIN`: tidak ada akses isi.

### 2.2 Fitur

- **Penetapan wali** (oleh `PROGRAM_COORDINATOR`, `PROGRAM_SECRETARY`, `ACADEMIC_STAFF`): tetapkan per mahasiswa dan massal per angkatan (impor CSV memakai pola impor yang sudah ada), ganti wali (wali lama otomatis `ENDED`, riwayat tersimpan), cabut. Operasi ganti wali ditulis sebagai fungsi Postgres atomik. Audit log wajib.
- **Menu "Perwalian" di workspace Dosen** (`LECTURER`), item baru di `menu-config.ts`:
  - Daftar mahasiswa bimbingan beserta status risiko (alihkan `getMentoringAdviseesRisk` agar membaca tabel baru, bukan sumber lama).
  - Antrean persetujuan KRS/pengajuan yang berstatus "Menunggu Persetujuan Wali" (hubungkan `requests-view.tsx` dengan relasi baru; pemberi persetujuan = wali aktif mahasiswa itu).
  - Catatan perwalian per mahasiswa.
  - Kirim pesan ke mahasiswa bimbingan lewat modul pesan yang sudah ada.
- **Sisi mahasiswa:** kartu "Dosen Wali Saya" di profil/beranda (nama, kontak yang diizinkan), memakai relasi baru. Nilai "Belum Ditetapkan" bila belum ada.
- `getMentoringRiskListAction`: ubah otorisasinya. Data dibatasi oleh `advisor_user_id = pengguna saat ini`, jadi peran lain yang kebetulan juga wali hanya melihat bimbingannya sendiri. Jangan lagi memberi daftar ke semua `PROGRAM_COORDINATOR`/`ACADEMIC_STAFF` lewat jalur ini.
- Jalur legacy `dosenWaliId` di `MasterStore`: jangan dihapus. Tulis skrip migrasi data sekali jalan (`scripts/`) yang memindahkan relasi itu ke tabel baru bila datanya ada, lalu catat di KEPUTUSAN.

**Selesai bila:** wali hanya melihat bimbingannya, mahasiswa hanya melihat walinya, pergantian wali tercatat di audit log, dan tes RLS membuktikan dosen lain serta Dekan tidak bisa membaca baris perwalian orang lain. Tampilan memakai token dan komponen yang ada (`cek:hex` lolos) dan menu Perwalian membuka halaman yang berfungsi.

---

## Fase 3 — Sekretaris Prodi (`PROGRAM_SECRETARY`)

Posisi: membantu Koordinator Prodi pada program yang sama. **Memverifikasi dan menyiapkan, bukan memutuskan akhir.**

Menu (awalan id `sek-`), memakai ulang komponen `coordinator-*-hub-view` dengan prop kemampuan (misalnya `bolehMenyetujui={false}`), bukan menyalin:

- Beranda, Kalender, Notifikasi, Pengumuman (set standar seperti peran lain)
- Monitoring Prodi (baca)
- Jadwal dan Penugasan Kelas (kelola untuk program sendiri, sama seperti subset Staf Akademik, **kecuali** penugasan Asisten Lab)
- Perwalian (tetapkan dan ganti wali, Fase 2)
- Pengajuan (verifikasi tahap awal; keputusan akhir tetap di Koordinator)
- Risiko Mahasiswa (nama dan status, sesuai kebijakan privasi)
- Laporan Akademik (lihat dan ekspor)

Batasan tegas:
- **Tidak** menyetujui atau menolak perubahan nilai. Tidak mengubah nilai.
- **Tidak** melihat log audit.
- Lingkup selalu program miliknya (`scope_type = PROGRAM`). Tanpa kebocoran ke program lain, dibuktikan tes.

**Selesai bila:** semua halaman di atas jalan untuk Sekprodi pada programnya, tombol setujui akhir tidak muncul, dan percobaan memanggil server action persetujuan langsung ditolak di server (bukan hanya disembunyikan di UI). Tampilan identik gayanya dengan halaman Koordinator, dan tiap item menu Sekprodi membuka halaman berfungsi.

---

## Fase 4 — Kepala/Ketua Laboratorium (`LAB_HEAD`)

Posisi: mengelola satu laboratorium dan asisten labnya. Memakai ulang konsep `ASISTEN_LAB` yang sudah ada.

Menu (awalan id `lab-`):

- Beranda, Kalender, Notifikasi, Pengumuman
- **Laboratorium Saya:** profil lab (kode, nama, ruang terkait).
- **Asisten Lab:** daftar dan penugasan asisten lab untuk kelas praktikum yang terhubung ke lab ini. Kepala Lab menugaskan `ASISTEN_LAB` **hanya** pada kelas yang terhubung ke lab miliknya (`is_lab_head_of_class`). Aturan wewenang mengikuti Fase 4.1: hanya Dosen Pengampu dan Kepala Lab.
- **Kelas Praktikum:** daftar kelas yang terhubung lewat `class_laboratories` (hubungan diatur oleh Staf Akademik/Koordinator/Sekprodi, bukan Kepala Lab).
- **Jadwal dan Penggunaan Lab:** baca jadwal dari `class_schedule_slots` untuk ruang lab. Tidak membuat sistem pemesanan baru.
- **Rekap Praktikum:** presensi dan nilai praktikum, **baca saja**.

Batasan tegas: tidak mengubah nilai, tidak menyetujui perubahan nilai, tidak melihat kelas di luar lab-nya.

### 4.1 Perubahan wewenang Asisten Lab

**Keadaan sekarang (dari kode):** Asisten Lab ditugaskan lewat RPC `set_assistant(p_class, p_identifier, p_permissions, p_assistant_type)` oleh Dosen Pengampu **atau** Staf Akademik/Super Admin. Server action `setAssistantAction` menerima `LECTURER`, `ACADEMIC_STAFF`, dan `SUPER_ADMIN`. UI penugasannya ada di `assistant-forms.tsx` (label "Staf Akademik & Dosen"), panel Asisten Lab di `staff-classes-hub-view.tsx`, dan cabang `isStaff` di `class-hub-tabs.tsx`.

**Keputusan:** Asisten Lab **hanya ditugaskan, diubah, dan dicabut oleh Dosen Pengampu kelas itu dan Kepala Lab** (untuk kelas yang terhubung ke lab-nya). Staf Akademik dan Super Admin tidak lagi mengelola Asisten Lab. Penugasan **Asisten Dosen tidak berubah** (tetap Dosen Pengampu, dan Super Admin seperti sekarang).

Pekerjaan:

1. **Migrasi baru** yang `CREATE OR REPLACE` fungsi `public.set_assistant(uuid, text, text[], text)` dengan signature yang sama agar pemanggil lama tidak rusak:
   - `ASISTEN_DOSEN`: `is_class_lecturer(p_class)` atau `SUPER_ADMIN` (tetap seperti sekarang).
   - `ASISTEN_LAB`: `is_class_lecturer(p_class)` **atau** `is_lab_head_of_class(p_class)`. Jalur `ACADEMIC_STAFF` dan `SUPER_ADMIN` untuk `ASISTEN_LAB` dihapus.
   - `actor_role` di audit log: `LECTURER` bila pelaku adalah dosen pengampu kelas itu, `LAB_HEAD` bila bukan tetapi Kepala Lab kelas itu, `SUPER_ADMIN` hanya untuk Asisten Dosen. Seseorang yang merangkap dosen pengampu dan Kepala Lab dicatat `LECTURER`.
   - Validasi izin, pencarian pengguna, pencabutan (daftar izin kosong), dan penulisan `user_roles` tidak berubah. Ubah dan cabut memakai aturan wewenang yang sama, **termasuk untuk penugasan lama yang dulu dibuat Staf**.
2. **Policy `class_assistants_select`:** Staf Akademik dan Super Admin tetap boleh **membaca** (supaya laporan dan tampilan lama tidak rusak). Tambahkan `is_lab_head_of_class(class_id)`. Pastikan tidak ada policy INSERT/UPDATE/DELETE yang memberi Staf akses tulis langsung ke tabel ini; kalau ada, cabut.
3. **Server action `setAssistantAction`:** untuk `ASISTEN_LAB` terima hanya `LECTURER` dan `LAB_HEAD`. `ACADEMIC_STAFF` dan `SUPER_ADMIN` menerima pesan Indonesia yang jelas, misalnya "Asisten Lab hanya dapat ditugaskan oleh Dosen Pengampu atau Kepala Lab." Jalur demo/offline (`mem`) di fungsi yang sama harus mengikuti aturan yang sama, termasuk batas Kepala Lab pada kelas yang terhubung ke lab-nya.
4. **UI** (tanpa mengubah tampilan lain, Bagian 3.1):
   - `assistant-forms.tsx`: ganti teks "Staf Akademik & Dosen" menjadi "Dosen Pengampu & Kepala Lab".
   - `class-hub-tabs.tsx`: hapus cabang `isStaff` untuk Asisten Lab. Tombol tambah, ubah, dan cabut hanya muncul untuk dosen pengampu kelas itu dan Kepala Lab kelas itu.
   - `staff-classes-hub-view.tsx`: hapus kontrol tambah, ubah, dan cabut Asisten Lab. Daftar boleh tetap tampil bila sudah ada, tetapi hanya baca dan tanpa tombol.
   - Pengelolaan dipindah ke item menu "Asisten Lab" milik Kepala Lab (Fase 4).
5. **Menu:** tidak boleh ada item menu Staf Akademik yang mengarah ke pengelolaan Asisten Lab. Pakai hasil audit Fase 0 untuk menemukannya.
6. **Data lama:** penugasan Asisten Lab yang sudah ada **tidak dihapus** dan tetap berlaku; kini dikelola Dosen Pengampu atau Kepala Lab. Kelas praktikum yang belum terhubung ke lab hanya bisa dikelola Dosen Pengampu sampai tautan `class_laboratories` dibuat oleh Staf Akademik/Koordinator/Sekprodi. Catat semua ini di KEPUTUSAN, termasuk bahwa Super Admin yang butuh bertindak harus memakai impersonasi yang sudah tercatat di audit.
7. **Tes** (RPC, RLS, dan server action):
   - Staf Akademik dan Super Admin ditolak saat menugaskan, mengubah, dan mencabut Asisten Lab, tetapi tetap bisa membaca daftarnya.
   - Dosen yang bukan pengampu kelas itu ditolak.
   - Kepala Lab lab A ditolak pada kelas lab B dan pada kelas yang belum terhubung ke lab mana pun.
   - Dosen Pengampu dan Kepala Lab yang berwenang berhasil, dan audit log mencatat `actor_role` yang benar.
   - Penugasan Asisten Dosen berperilaku persis seperti sebelumnya.
8. **Dokumentasi:** perbarui wewenang Asisten Lab di `docs/USE_CASE_SIAJAR.md`, `docs/ARSITEKTUR_PER_ROLE.md`, serta `docs/SIAJAR_Fitur_dan_Menu_Role.md` dan `.csv`.

**Selesai bila:** hanya Dosen Pengampu dan Kepala Lab yang bisa mengelola Asisten Lab (dibuktikan tes di tingkat database dan server action, bukan hanya UI), Kepala Lab hanya melihat kelas dan asisten pada lab-nya, RLS menolak akses lintas lab, tampilan memakai token dan komponen yang ada, dan tiap item menu Kepala Lab membuka halaman berfungsi.

---

## Fase 5 — Dekan (`DEAN`)

Posisi: **hanya memantau** tingkat fakultas. Tidak ada aksi mengubah data akademik.

Menu (awalan id `dkn-`):

- Beranda, Kalender, Notifikasi, Pengumuman
- **Beranda Fakultas:** indikator ringkas per program studi di bawah fakultasnya (jumlah mahasiswa aktif, kehadiran rata-rata, distribusi risiko, kelas berjalan).
- **Perbandingan Prodi:** tabel dan grafik per program (pakai library chart yang sudah dipakai repo).
- **Risiko Mahasiswa (agregat):** hanya jumlah per kategori per program dan angkatan. **Tanpa nama mahasiswa.** Pakai fungsi/view agregat atau `getCohortRiskSummaries` yang sudah ada, dibatasi ke program di bawah fakultasnya.
- **Evaluasi Dosen (agregat):** hanya rata-rata per program; sembunyikan ringkasan bila jumlah responden di bawah ambang yang Anda tetapkan dan catat di KEPUTUSAN.
- **Laporan Akademik:** lihat dan ekspor memakai `api/export/laporan-akademik` yang sudah ada, dibatasi ke fakultasnya.

Batasan tegas: tidak ada tombol setujui/tolak apa pun, tidak melihat nilai per mahasiswa, tidak melihat log audit. Alur persetujuan laporan oleh Dekan dicatat di `IDE_LANJUTAN.md`, tidak dibuat sekarang.

**Selesai bila:** Dekan melihat semua program di fakultasnya dan tidak melihat program fakultas lain, dan tidak ada query yang mengembalikan data per mahasiswa untuk peran ini. Tampilan memakai token dan komponen yang ada, dan tiap item menu Dekan membuka halaman berfungsi.

---

## Fase 6 — Penyelarasan Koordinator, lintas peran, dokumentasi

### 6.1 Koordinator Prodi (`PROGRAM_COORDINATOR`)

Peran ini sudah ada dan **tidak diganti namanya**. Pekerjaan di fase ini:
- Pastikan Koordinator adalah pemberi persetujuan akhir (perubahan nilai dan pengajuan) dan satu-satunya dari tiga peran jabatan program yang melihat log audit lingkup prodinya (perilaku sekarang dipertahankan).
- Tambahkan akses penetapan wali (Fase 2) ke menu Koordinator bila belum ada.
- Koordinator boleh memegang peran di atas bersama `LECTURER`.

### 6.2 Matriks wewenang (wajib dipatuhi dan diuji)

| Aksi | Koordinator | Sekprodi | Dekan | Kepala Lab | Dosen (tugas wali) |
| --- | --- | --- | --- | --- | --- |
| Monitoring perkuliahan | Prodi | Prodi (baca) | Fakultas (agregat) | Lab (baca) | — |
| Setujui/tolak perubahan nilai | Ya (final) | Tidak | Tidak | Tidak | Tidak |
| Ubah nilai langsung | Tidak | Tidak | Tidak | Tidak | Hanya sebagai dosen pengampu kelasnya |
| Tetapkan/ganti Dosen Wali | Ya | Ya | Tidak | Tidak | Tidak |
| Lihat mahasiswa bimbingan, catatan, setujui KRS tahap wali | Tidak | Tidak | Tidak | Tidak | Ya (bimbingannya saja) |
| Jadwal, peserta, penugasan kelas | Prodi | Prodi | Tidak | Tidak | — |
| Tugaskan/ubah/cabut Asisten Lab | Tidak | Tidak | Tidak | Ya (kelas lab-nya) | Ya, dosen pengampu kelasnya |
| Risiko mahasiswa | Prodi (nama) | Prodi (nama) | Agregat tanpa nama | Tidak | Bimbingannya saja |
| Log audit | Prodi | Tidak | Tidak | Tidak | Tidak |
| Ekspor laporan akademik | Prodi | Prodi | Fakultas | Rekap lab | Tidak |

Catatan matriks: Staf Akademik dan Super Admin **tidak** lagi menugaskan Asisten Lab (hanya membaca). "Penugasan kelas" untuk Sekprodi tidak mencakup Asisten Lab.

### 6.3 Lintas peran

- Notifikasi: pastikan pengiriman berbasis peran (pengumuman, pengingat) memperlakukan peran baru dengan benar.
- Seed data demo: satu akun demo per peran baru (lengkap dengan lingkup), satu fakultas dengan minimal dua program, satu lab dengan satu kelas praktikum, dan beberapa relasi perwalian. Tulis cara menjalankannya di laporan akhir.
- Tes:
  - Unit test untuk validasi Zod dan logika penetapan wali.
  - Tes RLS (pola yang sudah ada di repo, termasuk `pglite` bila dipakai) yang membuktikan **setiap baris matriks 6.2**, termasuk kasus negatif: lintas program, lintas fakultas, lintas lab, dan Dekan mencoba membaca baris per mahasiswa.
  - Tes menu: untuk tiap peran (lama dan baru), panggil `getMenuGroupsForRole` lalu pastikan setiap `href` lolos `isRouteAllowedForRole` untuk peran itu, ditolak untuk peran yang tidak berwenang, dan tidak ada item yang mengarah ke halaman cangkang. Pastikan menu tujuh peran lama tidak berubah selain tambahan "Perwalian" pada Dosen.
  - Tes e2e Playwright minimal: login tiap peran baru, menu yang tampil, satu aksi utama, satu aksi yang harus ditolak.
- Dokumentasi: perbarui `docs/USE_CASE_SIAJAR.md` (aktor baru, relasi pewarisan bila ada, use case Perwalian), `docs/ARSITEKTUR_PER_ROLE.md`, dan `docs/SIAJAR_Fitur_dan_Menu_Role.md` serta `.csv`. Jangan membuat ulang `.pdf/.xlsx/.html`; catat di KEPUTUSAN bahwa itu perlu diekspor ulang manual.
- Perbarui README bagian peran (tujuh peran menjadi sepuluh).

**Selesai bila:** `npm run cek` dan `npm run build` hijau, semua tes matriks lolos, dokumentasi sudah mencerminkan kode.

---

## Laporan akhir

Tulis `docs/LAPORAN_PERAN_BARU.md` berisi tabel menu → rute → aksi → kebijakan (Bagian 3.2), konfirmasi bahwa tidak ada berkas tema/token/komponen dasar yang diubah (sertakan hasil `git diff --stat` untuk `tailwind.config.ts`, `src/components/ui`, `src/components/retro`, `src/components/os`), serta: fitur yang selesai per fase, yang sengaja ditunda beserta alasannya, daftar keputusan di `KEPUTUSAN_PERAN_BARU.md`, hasil audit kemunculan peran (Fase 0) yang akhirnya diubah, dan cara menjalankan seed demo.
