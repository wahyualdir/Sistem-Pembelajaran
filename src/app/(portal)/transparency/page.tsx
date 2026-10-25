import React from 'react';
import Link from 'next/link';
import { ActivityPrivacyClient } from '@/modules/academic/activity-privacy-client';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  MapPin,
  Laptop,
  ArrowLeft,
} from 'lucide-react';

export default function TransparencyPage() {
  return (
    <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0">
      <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
        {/* OPEN HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-0.5">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-ink flex items-center gap-2.5">
              <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7 text-primary inline-block" />
              Privasi dan Kebijakan Pemantauan RuangKampus
            </h1>
            <p className="text-xs sm:text-sm text-gray-dark font-bold">
              Dokumentasi resmi mengenai hak pengguna, parameter pemantauan proctoring ujian, geolokasi presensi, dan retensi data.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-primary text-white border-2 border-ink shadow-xs">
              PRIVASI & AUDIT
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-gray-soft border-2 border-ink text-ink shadow-xs">
              UU PDP KEPATUHAN
            </span>
          </div>
        </div>

        {/* 2. RINGKASAN APA SAJA YANG DIPANTAU (3 KOLOM GRID) */}
        <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
          <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 space-y-3 shadow-retro">
            <div className="flex items-center gap-2 border-b-2 border-ink/20 pb-2.5">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <h3 className="font-heading font-bold text-base text-ink">Pemantauan Ujian (Proctoring)</h3>
            </div>
            <p className="text-xs text-gray-dark font-bold leading-relaxed font-sans">
              Sistem memantau perilaku antarmuka browser selama ujian CBT:
            </p>
            <ul className="text-xs text-ink font-bold list-disc list-inside space-y-1 font-sans">
              <li>Perpindahan tab (<code className="font-mono text-xs text-primary">visibilitychange</code>)</li>
              <li>Kehilangan fokus jendela (<code className="font-mono text-xs text-primary">blur</code>)</li>
              <li>Keluar dari mode layar penuh (fullscreen)</li>
              <li>Percobaan copy, paste, atau klik kanan</li>
            </ul>
            <div className="p-3 rounded-lg bg-gray-soft border-2 border-ink text-xs text-gray-dark font-bold font-sans">
              <strong>Catatan Penting:</strong> Browser <em>tidak dapat</em> mengakses isi tab lain atau mendeteksi perangkat fisik kedua. Semua data bersifat deteksi perilaku (heuristik).
            </div>
          </div>

          <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 space-y-3 shadow-retro">
            <div className="flex items-center gap-2 border-b-2 border-ink/20 pb-2.5">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="font-heading font-bold text-base text-ink">Presensi & Geolokasi GPS</h3>
            </div>
            <p className="text-xs text-gray-dark font-bold leading-relaxed font-sans">
              Pengumpulan koordinat saat mahasiswa mengklaim presensi kelas:
            </p>
            <ul className="text-xs text-ink font-bold list-disc list-inside space-y-1 font-sans">
              <li>Koordinat GPS (Latitude & Longitude)</li>
              <li>Estimasi akurasi perangkat (± meter)</li>
              <li>Jarak terhitung (formula Haversine di server)</li>
              <li>Waktu verifikasi presensi (jam server)</li>
            </ul>
            <div className="p-3 rounded-lg bg-gray-soft border-2 border-ink text-xs text-gray-dark font-bold font-sans">
              <strong>Tanpa Pelacakan Berkelanjutan:</strong> Lokasi GPS hanya diminta <em>satu kali</em> pada saat menekan tombol presensi. Tidak ada pelacakan di latar belakang (background tracking).
            </div>
          </div>

          <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 space-y-3 shadow-retro">
            <div className="flex items-center gap-2 border-b-2 border-ink/20 pb-2.5">
              <Laptop className="h-5 w-5 text-primary" />
              <h3 className="font-heading font-bold text-base text-ink">Perangkat & Passkey FIDO2</h3>
            </div>
            <p className="text-xs text-gray-dark font-bold leading-relaxed font-sans">
              Sistem keamanan sesi perangkat dan autentikasi WebAuthn:
            </p>
            <ul className="text-xs text-ink font-bold list-disc list-inside space-y-1 font-sans">
              <li>User-Agent (tipe sistem operasi & browser)</li>
              <li>Alamat IP terakhir tersamarkan (masked IP)</li>
              <li>ID Kredensial Kunci Publik WebAuthn</li>
              <li>Riwayat pencabutan sesi perangkat aktif</li>
            </ul>
            <div className="p-3 rounded-lg bg-gray-soft border-2 border-ink text-xs text-gray-dark font-bold font-sans">
              <strong>Privasi Biometrik:</strong> Sistem <em>tidak pernah</em> menyimpan sidik jari atau rekaman wajah mentah. Verifikasi biometrik dilakukan secara lokal oleh Secure Enclave perangkat.
            </div>
          </div>
        </div>

        {/* 3. DATA AKTIVITAS BELAJAR (PETA PULAU & FLASHCARD) */}
        <ActivityPrivacyClient />

        {/* 4. RETENSI DAN HAK PENGGUNA */}
        <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 space-y-4 shadow-retro">
          <div className="flex items-center justify-between border-b-2 border-ink/20 pb-3">
            <h3 className="font-heading font-bold text-base sm:text-lg text-ink flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span>Kebijakan Retensi Data & Hak Mahasiswa</span>
            </h3>
            <span className="text-xs font-sans font-bold px-2.5 py-1 rounded-full border-2 border-ink bg-gray-soft text-ink shadow-xs">
              SEMESTER GANJIL 2026/2027
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 text-xs font-sans leading-relaxed">
            <div className="p-4 rounded-xl border-2 border-ink bg-gray-soft/40 space-y-2">
              <h4 className="font-heading font-bold text-sm text-ink">Jadwal Retensi Data</h4>
              <p className="text-gray-dark font-bold space-y-1">
                <span>&bull; <strong>Log Ujian (<code className="font-mono text-primary font-bold">exam_events</code>):</strong> Disimpan selama 1 semester aktif untuk keperluan akreditasi dan verifikasi nilai akhir, setelah itu diarsipkan.</span><br />
                <span>&bull; <strong>Rekam Jejak Presensi GPS:</strong> Koordinat spesifik dibersihkan secara berkala setelah audit kehadiran semester selesai.</span><br />
                <span>&bull; <strong>Kredensial Sesi Login:</strong> Sesi otomatis kedaluwarsa setelah 30 hari tidak aktif atau saat pengguna mencabut akses di menu Perangkat & Sesi.</span>
              </p>
            </div>

            <div className="p-4 rounded-xl border-2 border-ink bg-gray-soft/40 space-y-2">
              <h4 className="font-heading font-bold text-sm text-ink">Hak Pengguna & Banding Akademik</h4>
              <p className="text-gray-dark font-bold space-y-1">
                <span>&bull; <strong>Hak Transparansi:</strong> Mahasiswa berhak melihat log anomali proctoring yang dicatat sistem saat ujian.</span><br />
                <span>&bull; <strong>Sengketa Nilai (Dispute):</strong> Jika terjadi kendala koneksi atau teknis, mahasiswa dapat mengajukan sanggahan langsung lewat fitur Sengketa Nilai dalam 7 hari.</span><br />
                <span>&bull; <strong>Keputusan Akhir pada Manusia:</strong> Sistem RuangKampus tidak mendiskualifikasi nilai secara sepihak. Dosen pengampu selalu menjadi pengambil keputusan akhir.</span>
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center text-xs font-sans font-bold text-gray-dark border-t-2 border-ink/10">
            <span>Terakhir diperbarui: Semester Ganjil 2026/2027</span>
            <Link href="/student" className="text-ink hover:underline flex items-center gap-1 font-bold">
              <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
