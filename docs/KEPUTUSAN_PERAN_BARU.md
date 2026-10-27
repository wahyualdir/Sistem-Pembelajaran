# SIAJAR — Catatan Keputusan Penambahan Peran Baru

Dokumen ini mencatat keputusan arsitektural dan teknis yang diambil selama implementasi penambahan peran baru (`PROGRAM_SECRETARY`, `LAB_HEAD`, `DEAN`) dan penugasan Dosen Wali, sesuai panduan `docs/INSTRUKSI_PERAN_BARU.md`.

---

## Log Keputusan

| No | Tanggal | Fase | Topik / Masalah | Keputusan yang Diambil | Alasan / Dampak Keamanan |
| :---: | :---: | :---: | :--- | :--- | :--- |
| 1 | 2026-10-27 | Fase 0 | Inisialisasi Tahapan | Pemisahan migrasi DDL enum `scope_type` dari DDL tabel baru; penegakan RLS ketat dan audit log untuk setiap mutasi peran jabatan. | Mengikuti aturan Postgres bahwa nilai enum baru tidak dapat dipakai dalam transaksi yang sama, serta kepatuhan matriks wewenang Bagian 6.2. |
| 2 | 2026-10-27 | Fase 0 / Penyelarasan | Pembedaan Kaprodi dan Koordinator Prodi | Memisahkan peran Kaprodi (HEAD_OF_PROGRAM / KAPRODI) dan Koordinator Prodi (PROGRAM_COORDINATOR) menjadi 2 peran tersendiri. Kaprodi memegang wewenang pimpinan struktural dan keputusan/persetujuan akhir (final approval nilai, kurikulum, penetapan wali), sedangkan Koordinator Prodi memegang koordinasi operasional akademik dan pemantauan tanpa hak persetujuan akhir. | Pemisahan tugas (Separation of Duties) yang jelas antara pimpinan pengambil keputusan definitif dan koordinator pelaksana/operasional akademik. |
