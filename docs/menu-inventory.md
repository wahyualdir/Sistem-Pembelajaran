# INVENTARISASI LENGKAP MENU LAMA & PEMETAAN TRANSISI LMS SIAJAR
**Dokumen Inventarisasi Semua Tempat Menu Didefinisikan & Rencana Tindakan Penggantian**  
*Tanggal: 7 Oktober 2026*  
*Status: Fase 0 — Audit Menyeluruh Sebelum Perubahan Kode*

---

## 1. RINGKASAN EKSEKUTIF

Berdasarkan audit mendalam di seluruh basis kode SIAJAR, menu lama (SIAKAD konvensional seperti KRS, Tagihan UKT, KHS & Transkrip, Simulasi IPK, dsb) ditemukan terdefinisi dan dirender di beberapa lokasi kunci:
1. **Navigasi Sidebar Utama**: `src/app/(portal)/portal-nav.tsx` (`getNavGroups`) dan diekspor ulang di `src/components/shared/sidebar.tsx` serta digunakan oleh `src/app/(portal)/portal-shell.tsx`.
2. **Kategori Chips Beranda**: `src/app/(portal)/student/student-dashboard-client.tsx` (array `CATEGORIES` dan filter mata kuliah).
3. **Pintasan Aksi Panel Kanan & Profil**: 
   - `src/app/(portal)/student/student-dashboard-client.tsx` (tautan `href="/mahasiswa/jadwal"` pada aksi panel kanan).
   - `src/app/(portal)/profile/page.tsx` (tombol aksi cepat ke `/mahasiswa/krs`, `/mahasiswa/nilai`, `/mahasiswa/simulasi-ipk`, `/mahasiswa/surat`, `/mahasiswa/preferensi-notifikasi`).
   - `src/app/(portal)/portal-shell.tsx` (popover profil bawah tautan `/mahasiswa/preferensi-notifikasi`).
4. **Rute-Rute Halaman Legacy**: Seluruh folder `src/app/(dashboard)/` (`mahasiswa/*`, `dosen/*`, `admin/*`).
5. **Unit Test Navigasi**: `tests/nav-roles.test.ts` (masih memverifikasi keberadaan label KRS, UKT, dsb pada role STUDENT).
6. **Konfigurasi Feature Flag**: `src/lib/config/features.ts` (`FEATURES.siakadLegacy`).

---

## 2. INVENTARIS TEMPAT DEFINISI & PENGGUNAAN MENU

Berikut adalah daftar lengkap setiap tempat di repositori yang mendefinisikan, merender, atau merujuk label menu lama:

| No | Path File | Komponen / Fungsi | Lokasi Penggunaan | Label / Item Lama yang Ditemukan | Tindakan Wajib |
|---|---|---|---|---|---|
| 1 | `src/app/(portal)/portal-nav.tsx` | `getNavGroups()`, `PortalNav` | **Sidebar Utama** seluruh 7 peran | - Kategori: `Perkuliahan`, `Akademik (SIAKAD)`, `Layanan & Kemahasiswaan`, `Pengaturan & Akun`, `Akademik Dosen (SIAKAD)`, `Layanan & Perwalian`, `Koordinasi & Mutu Prodi`, `Administrasi Akademik`, `Asistensi Perkuliahan`<br>- Items: `Dashboard Akademik`, `KRS Online`, `Jadwal Kuliah`, `Presensi Kuliah`, `KHS & Transkrip`, `Simulasi IPK`, `Kartu & Jadwal Ujian`, `Materi & Tugas`, `Bimbingan Dosen Wali`, `Tagihan UKT`, `Pengajuan Surat`, `Pengumuman Kampus`, `Preferensi Notifikasi`, `Perangkat & Sesi` | **Ganti Total** dengan satu konfigurasi menu terpusat per role (`menuConfig`) sesuai Bagian 6 prompt. |
| 2 | `src/components/shared/sidebar.tsx` | `Sidebar`, `*_NAV_GROUPS` | **Sidebar Bersama** (Legacy / Standalone) | Mengimpor `getNavGroups` dan mendefinisikan konstanta per-role (`MAHASISWA_NAV_GROUPS`, `DOSEN_NAV_GROUPS`, dsb). | **Sinkronkan** agar mengonsumsi `menuConfig` terpusat. |
| 3 | `src/app/(portal)/portal-shell.tsx` | `PortalShell` | **App Shell & Popover Profil** | - Memanggil `getNavGroups(role, unread)`.<br>- Tautan menu popover profil bawah baris 271: `/mahasiswa/preferensi-notifikasi`. | **Perbarui** pemanggilan navigasi ke `menuConfig` baru; ganti link preferensi notifikasi ke rute akun terpadu. |
| 4 | `src/app/(portal)/student/student-dashboard-client.tsx` | `CATEGORIES`, `COURSES`, Panel Kanan | **Chip Kategori Beranda & Panel Detail** | - Array `CATEGORIES`: `'KRS Online'`, `'Transkrip'`, `'Tagihan UKT'`, `'Kelas Kuliah'`.<br>- Kartu `category: 'Kelas Kuliah'`.<br>- Baris 437: `<Link href="/mahasiswa/jadwal">`. | **Ganti chip** menjadi: `Semua`, `Kelas Saya`, `Tugas & Kuis`, `Ujian`, `Presensi`, `Jadwal`, `Nilai`. Hapus chip KRS Online, Transkrip, dan Tagihan UKT. Ganti tautan panel kanan ke `/calendar`. |
| 5 | `src/app/(portal)/profile/page.tsx` | `ProfilePage` | **Pintasan Aksi Cepat Profil** | - Baris 195: `/mahasiswa/krs` ("Cek KRS Online")<br>- Baris 201: `/mahasiswa/nilai` ("Lihat KHS & Transkrip")<br>- Baris 207: `/mahasiswa/simulasi-ipk` ("Simulasi IPK Kelulusan")<br>- Baris 248: `/mahasiswa/nilai` ("Buka Transkrip")<br>- Baris 262: `/mahasiswa/surat` ("Ajukan Surat")<br>- Baris 361: `/mahasiswa/preferensi-notifikasi` | **Arahkan** ke rute LMS yang relevan: Nilai & Progres (`/grades`), Kalender (`/calendar`), Ujian (`/exams`). |
| 6 | `src/components/shared/topbar.tsx` & `src/app/(portal)/portal-shell.tsx` | Search bar | **Pencarian Global** | Form pencarian diarahkan ke `/classes?q=...`. Tidak menyarankan/menampilkan menu lama. | **Pastikan** pencarian global hanya mengindeks menu & konten LMS baru. |
| 7 | `src/middleware.ts` | `middleware()` | **Route Guard & Redirects** | Memeriksa sesi dan portal prefix (`/student`, `/lecturer`, dsb). Belum memiliki aturan redirect untuk rute legacy. | **Tambahkan redirect otomatis** untuk rute lama (`/mahasiswa/*`, `/dosen/*`, `/admin/*`) ke pengganti LMS terdekat. |
| 8 | `src/lib/config/features.ts` | `FEATURES` | **Feature Flags** | Baris 8: `siakadLegacy: process.env.NEXT_PUBLIC_ENABLE_SIAKAD_LEGACY !== 'false'` (default aktif). | **Ubah default menjadi `false`** sesuai Aturan 4.5 prompt. |
| 9 | `src/app/(dashboard)/` | Rute Halaman Legacy | **Halaman SIAKAD Lama** | - `/mahasiswa/krs`, `/mahasiswa/ukt`, `/mahasiswa/surat`, `/mahasiswa/simulasi-ipk`, `/mahasiswa/bimbingan`, dsb.<br>- `/dosen/perwalian`, `/dosen/laporan`, dsb.<br>- `/admin/ukt`, `/admin/surat`, dsb. | **Lindungi di balik feature flag & redirect**. Jangan hapus kode, jangan buka akses dari UI. |
| 10 | `tests/nav-roles.test.ts` | Test suite vitest | **Verifikasi Menu Per Peran** | Baris 45-53: Menguji keberadaan `KRS Online`, `Presensi Kuliah`, `KHS & Transkrip`, `Simulasi IPK`, `Tagihan UKT` pada role STUDENT. | **Perbarui test** untuk memvalidasi struktur menu baru per role dan memverifikasi ketiadaan menu lama. |

---

## 3. DAFTAR TINDAKAN RINCI PER MENU LAMA (BAGIAN 4 PROMPT)

### 3.1 Sidebar Mahasiswa Lama & Tindakan Wajib

| Kategori Lama | Label Item Lama | Rute Lama | Tindakan Wajib | Pengganti / Rute Baru |
|---|---|---|---|---|
| PERKULIAHAN | Beranda | `/student` | **Ganti** | Beranda baru (`/student`) |
| PERKULIAHAN | Kelas Kuliah | `/classes` | **Ganti** | Kelas Saya (`/classes`) |
| PERKULIAHAN | Kalender Akademik | `/calendar` | **Ganti** | Kalender (`/calendar`) — gabungan jadwal kuliah, tenggat tugas, jadwal ujian |
| PERKULIAHAN | Notifikasi | `/notifications` | **Pertahankan** | Notifikasi (`/notifications`) |
| AKADEMIK (SIAKAD) | Dashboard Akademik | `/mahasiswa/dashboard` | **Hapus** | Diganti dashboard per role (`/student`) |
| AKADEMIK (SIAKAD) | KRS Online | `/mahasiswa/krs` | **Hapus** | Redirect ke Kalender (`/calendar`) |
| AKADEMIK (SIAKAD) | Jadwal Kuliah | `/mahasiswa/jadwal` | **Hapus** | Masuk ke Kalender (`/calendar`) |
| AKADEMIK (SIAKAD) | Presensi Kuliah | `/mahasiswa/presensi` | **Hapus** | Diganti tab Presensi di kelas dan Riwayat Presensi (`/attendance`) |
| AKADEMIK (SIAKAD) | KHS & Transkrip | `/mahasiswa/nilai` | **Hapus** | Diganti Nilai & Progres (`/grades`) |
| AKADEMIK (SIAKAD) | Simulasi IPK | `/mahasiswa/simulasi-ipk` | **Hapus** | Redirect ke Nilai & Progres (`/grades`) |
| AKADEMIK (SIAKAD) | Kartu & Jadwal Ujian | `/mahasiswa/ujian` | **Hapus** | Diganti Ujian Aktif (`/exams`) & Riwayat Ujian (`/exams/history`) |
| AKADEMIK (SIAKAD) | Materi & Tugas | `/mahasiswa/tugas` | **Hapus dari sidebar** | Pindah menjadi tab di dalam Hub Kelas (`/classes/[id]`) |
| LAYANAN & KEMAHASISWAAN | Bimbingan Dosen Wali | `/mahasiswa/bimbingan` | **Hapus** dari Mahasiswa | Hanya ada sebagai "Mahasiswa Bimbingan" di menu Dosen Wali |
| LAYANAN & KEMAHASISWAAN | Tagihan UKT | `/mahasiswa/ukt` | **Hapus** | Redirect ke Beranda (`/student`) |
| LAYANAN & KEMAHASISWAAN | Pengajuan Surat | `/mahasiswa/surat` | **Hapus** | Redirect ke Beranda (`/student`) |
| LAYANAN & KEMAHASISWAAN | Pengumuman Kampus | `/mahasiswa/pengumuman` | **Ganti** | Pengumuman (`/announcements`) di kategori KOMUNITAS |
| PENGATURAN & AKUN | Preferensi Notifikasi | `/mahasiswa/preferensi-notifikasi` | **Pindah** | Pindah ke kategori AKUN & BANTUAN (`/notifications/preferences` atau `/profile`) |
| PENGATURAN & AKUN | Perangkat & Sesi | `/devices` | **Pindah** | Pindah ke kategori AKUN & BANTUAN (`/devices`) |

> **Kategori lama dilarang tampil:**  
> Label `PERKULIAHAN`, `AKADEMIK (SIAKAD)`, `LAYANAN & KEMAHASISWAAN`, dan `PENGATURAN & AKUN` dihapus sepenuhnya dari antarmuka.

---

### 3.2 Chip Kategori di Beranda (Student Dashboard)

| Chip Lama | Status | Keterangan / Pengganti |
|---|---|---|
| `Semua` | **Dipertahankan** | Menampilkan semua kartu |
| `Kelas Kuliah` | **Diganti** | Menjadi **`Kelas Saya`** |
| `Tugas & Kuis` | **Dipertahankan** | Menampilkan tugas & kuis aktif |
| `KRS Online` | **Dihapus** | Tidak relevan di sistem pembelajaran LMS |
| `Transkrip` | **Dihapus** | Diganti chip **`Nilai`** |
| `Presensi` | **Dipertahankan** | Filter kelas berdasarkan presensi/kehadiran |
| `Jadwal` | **Dipertahankan** | Filter kelas berdasarkan jadwal |
| `Tagihan UKT` | **Dihapus** | Tidak relevan di sistem pembelajaran LMS |
| *(Baru)* | **Ditambahkan** | **`Ujian`** |
| *(Baru)* | **Ditambahkan** | **`Nilai`** |

**Daftar Chip Akhir:** `['Semua', 'Kelas Saya', 'Tugas & Kuis', 'Ujian', 'Presensi', 'Jadwal', 'Nilai']`. Komponen visual chip (pill button, active state black fill) tetap sama 100%.

---

### 3.3 Pemetaan Pengalihan Rute Lama (Legacy Redirects)

Agar tidak ada halaman 404 (yatim), semua rute lama dialihkan melalui Next.js Middleware atau konfigurasi rute:

| Rute Lama | Rute Pengalihan Baru | Alasan Pengalihan |
|---|---|---|
| `/mahasiswa/krs` | `/calendar` | Perencanaan & jadwal mata kuliah |
| `/mahasiswa/jadwal` | `/calendar` | Kalender terpadu jadwal kuliah & ujian |
| `/mahasiswa/nilai` | `/grades` | Modul Nilai & Progres pembelajaran |
| `/mahasiswa/simulasi-ipk` | `/grades` | Evaluasi & analisis progres kelulusan |
| `/mahasiswa/ujian` | `/exams` | Modul Ujian Aktif & Riwayat Ujian |
| `/mahasiswa/tugas` | `/classes` | Materi & tugas berada di dalam Hub Kelas |
| `/mahasiswa/bimbingan` | `/student` | Bimbingan kemahasiswaan |
| `/mahasiswa/ukt` | `/student` | Layanan keuangan legacy diarahkan ke beranda |
| `/mahasiswa/surat` | `/student` | Administrasi surat legacy diarahkan ke beranda |
| `/mahasiswa/dashboard` | `/student` | Dashboard mahasiswa utama |
| `/mahasiswa/pengumuman` | `/announcements` | Pengumuman di modul komunitas |
| `/mahasiswa/preferensi-notifikasi` | `/profile` (atau sub-halaman preferensi) | Pengaturan preferensi notifikasi |
| `/dosen/dashboard` | `/lecturer` | Dashboard dosen pengampu |
| `/dosen/kelas` | `/classes` | Kelas diampu dosen |
| `/dosen/presensi` | `/attendance` | Presensi kelas |
| `/dosen/nilai` | `/grades` | Penilaian kelas |
| `/dosen/materi-tugas` | `/classes` | Materi & tugas kelas |
| `/admin/dashboard` | `/admin` | Dashboard admin |
| `/admin/ukt` | `/admin` | Administrasi umum |
| `/admin/surat` | `/admin` | Administrasi umum |

---

## 4. RENCANA STRUKTUR TUNGGAL MENU TERPUSAT (`menuConfig`)

Akan dibuat file konfigurasi terpusat: `src/lib/config/menu-config.ts` yang berisi:
1. Definisi tipe `MenuItem` (id, label, icon, href, roles, permission, badge, isShortcut).
2. Definisi tipe `MenuGroup` (id, title, roles, items).
3. Struktur konfigurasi per role untuk ke-7 peran:
   - `STUDENT`
   - `TEACHING_ASSISTANT` (Mahasiswa + Asisten dengan kategori Mode Asisten)
   - `LECTURER`
   - `PROGRAM_COORDINATOR`
   - `ACADEMIC_STAFF`
   - `SYSTEM_ADMIN`
   - `SUPER_ADMIN`
4. Fungsi penolong:
   - `getMenuGroupsForRole(role, unreadCount, hasActiveExam)`
   - `isRouteAllowedForRole(pathname, role)`
   - `getSearchableMenuItems(role)`

Dengan struktur ini, tidak ada lagi string hardcoded di sidebar, topbar, profil, maupun tes.
