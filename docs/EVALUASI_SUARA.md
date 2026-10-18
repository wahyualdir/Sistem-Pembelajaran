# SIAJAR — Panduan Evaluasi Kualitas Suara Narator Podcast (TTS)

Versi 1.0 · Oktober 2026 · Dokumen Evaluasi Human-in-the-Loop

Dokumen ini memuat panduan bagi tim kurikulum dan pengajar institusi dalam menguji dan menilai kesesuaian penyedia sintesis teks-ke-suara (*Text-to-Speech* / TTS) untuk narasi materi pembelajaran bab pulau SIAJAR.

> [!IMPORTANT]
> **ATURAN PEMILIHAN**:
> Sistem tidak memilih penyedia suara secara sepihak. Keputusan pemilihan penyedia narator diserahkan seutuhnya kepada pertimbangan evaluator manusia (dosen dan pengelola kurikulum) berdasarkan kualitas pelafalan Bahasa Indonesia, intonasi ilmiah, dan efisiensi anggaran institusi.

---

## 1. Cara Menghasilkan Sampel Suara

1. Pastikan kunci API penyedia yang ingin diuji telah terpasang di berkas `.env.local` atau variabel lingkungan server:
   ```bash
   ELEVENLABS_API_KEY=kunci_anda
   OPENAI_API_KEY=kunci_anda
   GOOGLE_TTS_API_KEY=kunci_anda
   ```
2. Jalankan skrip pembuatan sampel suara:
   ```bash
   npx tsx scripts/sampel-suara.ts
   ```
3. Berkas audio pengujian akan tersimpan di direktori:
   ```
   tmp/sampel-suara/
   ```

---

## 2. Paragraf Teks Uji Coba Standar

Setiap penyedia suara mengonversi teks ilmiah Bahasa Indonesia yang sama persis:

> *"Selamat datang di modul pembelajaran sistem terdistribusi. Pada bab ini, kita akan membahas konsistensi data, replikasi basis data, dan teorema CAP yang menyatakan bahwa sistem komputasi hanya dapat menjamin maksimal dua dari tiga sifat utama secara simultan: konsistensi, ketersediaan, dan toleransi partisi jaringan."*

Teks ini menguji:
- Pelafalan kata serapan teknologi (*database*, replikasi, teorema CAP, simultan, partisi).
- Kejernihan artikulasi vokal dan konsonan Bahasa Indonesia.
- Kesinambungan intonasi (tidak terdengar terputus-putus atau kaku).

---

## 3. Matriks Penilaian Suara (Diisi oleh Evaluator Manusia)

Skala Penilaian: 1 (Sangat Kurang) hingga 5 (Sangat Baik).

| Nama Penyedia & Model | Kejelasan Artikulasi (1–5) | Ketenangan & Intonasi (1–5) | Pelafalan Istilah Teknis (1–5) | Estimasi Biaya per 1.000 Karakter (USD / IDR) | Rekomendasi (Ya / Tidak) | Catatan Khusus Evaluator |
|---|---|---|---|---|---|---|
| **ElevenLabs (Multilingual v2)** | [ ... ] | [ ... ] | [ ... ] | ~ \$0.15 - \$0.30 | [ ... ] | [ Catatan ] |
| **OpenAI (TTS-1 / TTS-1-HD)** | [ ... ] | [ ... ] | [ ... ] | ~ \$0.015 - \$0.030 | [ ... ] | [ Catatan ] |
| **Google Cloud TTS (Neural2/Wavenet ID)** | [ ... ] | [ ... ] | [ ... ] | ~ \$0.016 | [ ... ] | [ Catatan ] |
| **Edge TTS / Open Source Fallback** | [ ... ] | [ ... ] | [ ... ] | Gratis / Bebas Biaya API | [ ... ] | [ Catatan ] |

---

## 4. Langkah Pasca-Penetapan Penyedia

Setelah tim pengajar menentukan penyedia dan ID suara terpilih:
1. Pasang penyedia terpilih pada konfigurasi server:
   ```bash
   TTS_PROVIDER=elevenlabs # atau openai / google
   TTS_API_KEY=kunci_resmi_institusi
   TTS_VOICE_ID=voice_id_terpilih
   ```
2. Aktifkan sakelar podcast global di basis data:
   ```sql
   UPDATE public.institution_policies
   SET value = 'true'::jsonb
   WHERE key = 'feature_podcast_enabled';
   ```
3. Dosen pengampu dapat mulai menerbitkan naskah podcast di menu **Tinjau Konten** dan mahasiswa dapat mendengarkan audio di drawer pulau yang terbuka.
