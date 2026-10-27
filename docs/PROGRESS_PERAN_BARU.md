# Laporan Progres Implementasi Peran Baru SIAJAR

Dokumen ini mencatat matriks pelacakan `Menu → Rute → Server Action → Kebijakan RLS / Permission` serta status eksekusi tiap fase.

---

## 1. Status Fase

| Fase | Deskripsi | Status | Catatan / Bukti |
| :--- | :--- | :---: | :--- |
| **Fase 0** | Audit Kode, Identitas, RLS, & Navigasi | **SELESAI** | Hasil audit lengkap di `docs/AUDIT_PERAN_BARU.md`. |
| **Fase 1** | Fondasi Peran dan Lingkup (Enum, Migrasi, Roles, Master Data) | **DALAM PROSES** | Mempersiapkan migrasi SQL dan integrasi TypeScript. |
| **Fase 2** | Dosen Wali sebagai Tugas Dosen (Data, Advisory Notes, Menu Perwalian) | **MENUNGGU** | Menunggu penyelesaian Fase 1. |
| **Fase 3** | Sekretaris Prodi (`PROGRAM_SECRETARY`) | **MENUNGGU** | Menunggu penyelesaian Fase 2. |
| **Fase 4** | Kepala Laboratorium (`LAB_HEAD`) & Reformasi Wewenang Asisten Lab | **MENUNGGU** | Menunggu penyelesaian Fase 3. |
| **Fase 5** | Dekan (`DEAN`) (Pemantauan Agregat Tingkat Fakultas) | **MENUNGGU** | Menunggu penyelesaian Fase 4. |
| **Fase 6** | Penyelarasan Koordinator, Matriks Wewenang, Pengujian, Dokumentasi | **MENUNGGU** | Menunggu penyelesaian Fase 5. |

---

## 2. Matriks Menu → Rute → Server Action → Kebijakan RLS / Permission

| Menu ID | Label Menu | Role Berwenang | Rute Halaman | Server Action / Data Fetcher | Kebijakan RLS / Helper DB |
| :--- | :--- | :--- | :--- | :--- | :--- |
| *(Akan diperbarui secara berurutan pada Fase 1 sampai Fase 6)* |
