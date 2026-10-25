# Cetak Biru Arsitektur Sistem: RuangKampus LMS & Academic OS
**Program Studi Teknik Informatika — Universitas Islam Riau**  
*Versi Dokumen: 2.0 · Oktober 2026*

---

## 1. Ikhtisar Arsitektur Tingkat Tinggi (High-Level Topology)

RuangKampus dibangun menggunakan arsitektur **Domain-Driven Modular Full-Stack** berbasis **Next.js App Router (React Server Components & Server Actions)** yang dipadukan dengan **Layered Architecture**.

```
[ Client Web / Browser ]
           │
           ▼
[ Next.js Middleware (src/middleware.ts) ]
  ├── 1. Pemeriksaan Sesi & Validasi SSR (Supabase SSR Client)
  ├── 2. Pengalihan Rute Legacy SIAKAD -> Modern Portal (ROLE_PORTAL_MAP)
  └── 3. Penegakan Otorisasi Berbasis Peran (RBAC)
           │
           ├──► [ (auth) Portal Otentikasi ]
           │      └── /login (Minimalist Centered Card, Show/Hide Password, Anti-Autofill Blue)
           │
           └──► [ (portal) Ruang Kerja Peran ]
                  ├── /student    (Mahasiswa: Kain Semester, Presensi, Tugas, KRS)
                  ├── /lecturer   (Dosen: Kelas OBE, Penilaian Rubrik, Validasi Presensi)
                  ├── /ta         (Asisten Dosen: Monitoring CBT, Forum, Asistensi)
                  ├── /coordinator(Kaprodi: Pemetaan CPL/CPMK, Beban Dosen, Akreditasi)
                  ├── /staff      (Tendik: Jadwal, Master Data, Surat Akademik)
                  └── /admin      (Super Admin: Audit Log, Impersonasi, Konfigurasi Sistem)
```

---

## 2. Struktur Direktori & Pemisahan Tanggung Jawab

| Direktori | Tanggung Jawab Arsitektur |
| :--- | :--- |
| **`src/app/`** | Lapisan Presentasi & Routing (Next.js App Router). Menggunakan *Route Groups* `(auth)` dan `(portal)` untuk memisahkan siklus hidup autentikasi dan ruang kerja perkuliahan. Dilengkapi `error.tsx` dan `not-found.tsx` terpusat. |
| **`src/modules/`** | **Logika Bisnis Domain Tingkat Tinggi**. Menyimpan mutasi *Server Actions* terverifikasi (`identity`, `academic`, `admin`, `early-warning`, `notifications`, `requests`). Data mutasi tidak terekspos via REST API publik sembarangan. |
| **`src/features/`** | **Fitur Spesifik Perkuliahan**. Mengisolasi komponen dan logika spesifik per fitur (`presensi`, `nilai`, `krs`, `materi-tugas`, `ujian`, `bimbingan`, `ukt`). |
| **`src/components/`** | **Pustaka Komponen UI Terstandar**. Terbagi menjadi: <br>• `ui/`: Primitif komponen murni (button, card, dialog, badge).<br>• `shared/`: Shell platform (`PortalShell`, `AiAcademicAssistant`, `CommandCenterOS`).<br>• `retro/`: Komponen interaktif bertema Academic OS (window frame, dither, identity card). |
| **`src/lib/`** | **Kernel Platform & Utilitas Sistem**. Mesin pemrosesan inti: koneksi database Prisma (`db/`), autentikasi Supabase (`supabase/`), cron scheduler (`cron/`), mesin penilaian kode (*judge*), serta engine PDF (`pdf/`). |

---

## 3. Strategi Data & Model Pembelajaran Berbasis OBE

Skema relasional data didefinisikan secara komprehensif pada [`prisma/schema.prisma`](file:///c:/Users/ACER/Downloads/implementasi/prisma/schema.prisma) dengan mendukung prinsip **Outcome-Based Education (OBE)**:

1. **Pemetaan Capaian Pembelajaran**:
   - `MataKuliah` terhubung dengan indikator capaian `CPMK` dan profil lulusan `CPL`.
   - `KomponenNilai` dan `Nilai` berbasis rubrik terukur (Tugas, Kuis, UTS, UAS, Praktikum).
2. **Presensi Cerdas Berbasis Radius**:
   - Model `Pertemuan` dan `Presensi` menyimpan koordinat lintang/bujur dan status verifikasi GPS dalam radius geofence kampus Gedung D Fakultas Teknik UIR.
3. **Ujian CBT Berintegritas Tinggi**:
   - Model `Ujian` dilengkapi pengacakan bank soal, token rotasi berkala, dan deteksi kecurangan saat jendela ujian aktif.

---

## 4. Keamanan Autentikasi & Otorisasi Terpadu (Dual-Auth Resilience)

1. **Pemisahan Kredensial & Profil**:
   - Sesi terenkripsi dikelola oleh Supabase Auth via cookie SSR HTTP-Only bertanda tangan.
   - Profil terstruktur mahasiswa (NIM), dosen (NIDN), dan staf (NIP) tersimpan di basis data relasional PostgreSQL (Prisma `Pengguna`).
2. **Proteksi Serangan Siber**:
   - *Rate Limiting*: Pembatasan percobaan login per alamat IP menggunakan sliding window.
   - *Account Lockout*: Penguncian otomatis sementara setelah 5 kali kegagalan kredensial berturut-turut.
3. **Sesi Impersonasi Aman**:
   - Hak impersonasi admin menggunakan *Signed Cryptographic Token* dengan masa kedaluwarsa ketat. Setiap aktivitas impersonasi dicatat dalam tabel `LogAudit` yang tidak dapat dihapus (*tamper-proof*).

---

## 5. Standar Desain Sistem & Tipografi Kampus

- **Tipografi**: Menggunakan font resmi **Apple SF Pro** (`SF Pro Display`, `SF Pro Text`, `SF Pro`) yang disajikan mandiri secara luring dari `/public` dengan bobot tegas (`font-weight: 600` untuk teks umum, `800` untuk judul) berkontras tinggi (`#000000`).
- **Palet Warna**: Seluruh warna dibatasi secara ketat pada palet identitas resmi kampus (Terracotta `#C2553A`, Dark Terracotta `#853827`, Paper Ivory `#FAF8F5`, dan Charcoal Obsidian `#1C1917` / `#000000`), diverifikasi otomatis oleh skrip audit [`scripts/cek-hex.js`](file:///c:/Users/ACER/Downloads/implementasi/scripts/cek-hex.js).
- **Kebijakan Ikonografi**: Bebas dari emoji grafis bawaan OS; 100% menggunakan ikon vektor Lucide SVG yang seragam.

---

## 6. Ketahanan Sistem & Penanganan Galat (Error Boundaries)

- **`src/app/error.tsx`**: Menangkap kegagalan runtime rendering Server Component secara elegan tanpa merusak antarmuka pengguna, menyediakan tombol pemulihan *Coba Lagi* (*reset action*) dan pencatatan kode *digest* untuk penelusuran tim teknis.
- **`src/app/(portal)/not-found.tsx`**: Antarmuka 404 terpadu yang memandu pengguna kembali ke beranda atau ke portal login resmi saat mengakses tautan yang salah atau kedaluwarsa.
