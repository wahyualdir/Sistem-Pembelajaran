import React from 'react';
import Link from 'next/link';
import { RetroWindow } from '@/components/retro/retro-window';
import {
  ShieldCheck,
  ShieldAlert,
  Eye,
  Lock,
  Clock,
  UserCheck,
  MapPin,
  Laptop,
  ArrowLeft,
  FileText,
  AlertCircle,
} from 'lucide-react';

export default function TransparencyPage() {
  return (
    <div className="p-6 sm:p-9 w-full space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW */}
      <RetroWindow
        title="transparansi_data_dan_privasi.doc"
        badge="PRIVASI & AUDIT AKADEMIK"
        headerClassName="bg-gray-soft"
        bodyClassName="p-6 bg-retro-surface"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg border-2 border-black bg-black text-white shadow-retro">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-2xl tracking-tight text-foreground">
                Privasi dan Kebijakan Pemantauan SIAJAR
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Dokumentasi resmi mengenai hak pengguna, parameter pemantauan proctoring ujian, geolokasi presensi, dan retensi data.
              </p>
            </div>
          </div>
        </div>
      </RetroWindow>

      {/* 2. RINGKASAN APA SAJA YANG DIPANTAU */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-[3px] border-2 border-black bg-surface p-5 space-y-3 shadow-retro">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-ink" />
            <h3 className="font-bold text-sm text-foreground">Pemantauan Ujian (Proctoring)</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Sistem memantau perilaku antarmuka browser selama ujian:
          </p>
          <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
            <li>Perpindahan tab (<code className="font-mono text-xs">visibilitychange</code>)</li>
            <li>Kehilangan fokus jendela browser (<code className="font-mono text-xs">blur</code>)</li>
            <li>Keluar dari mode layar penuh (fullscreen)</li>
            <li>Percobaan copy, paste, atau klik kanan</li>
          </ul>
          <div className="p-2.5 rounded bg-muted/50 border border-border text-xs text-muted-foreground">
            <strong>Catatan Penting:</strong> Browser <em>tidak dapat</em> mengakses isi tab lain atau mendeteksi perangkat fisik kedua. Semua data bersifat deteksi perilaku (heuristik).
          </div>
        </div>

        <div className="rounded-[3px] border-2 border-black bg-surface p-5 space-y-3 shadow-retro">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-sm text-foreground">Presensi & Geolokasi GPS</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Pengumpulan koordinat saat mahasiswa mengklaim presensi kelas:
          </p>
          <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
            <li>Koordinat GPS (Latitude & Longitude)</li>
            <li>Estimasi akurasi perangkat (± meter)</li>
            <li>Jarak terhitung (formula Haversine di server)</li>
            <li>Waktu verifikasi presensi (jam server)</li>
          </ul>
          <div className="p-2.5 rounded bg-muted/50 border border-border text-xs text-muted-foreground">
            <strong>Tanpa Pelacakan Berkelanjutan:</strong> Lokasi GPS hanya diminta <em>satu kali</em> pada saat menekan tombol presensi. Tidak ada pelacakan di latar belakang (background tracking).
          </div>
        </div>

        <div className="rounded-[3px] border-2 border-black bg-surface p-5 space-y-3 shadow-retro">
          <div className="flex items-center gap-2">
            <Laptop className="h-5 w-5 text-foreground" />
            <h3 className="font-bold text-sm text-foreground">Perangkat & Autentikasi Passkey</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Sistem keamanan sesi perangkat dan autentikasi FIDO2/WebAuthn:
          </p>
          <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
            <li>User-Agent (tipe sistem operasi & browser)</li>
            <li>Alamat IP terakhir tersamarkan (masked IP)</li>
            <li>ID Kredensial Kunci Publik WebAuthn</li>
            <li>Riwayat pencabutan sesi perangkat aktif</li>
          </ul>
          <div className="p-2.5 rounded bg-muted/50 border border-border text-xs text-muted-foreground">
            <strong>Privasi Biometrik:</strong> Sistem <em>tidak pernah</em> menyimpan sidik jari atau rekaman wajah mentah. Verifikasi biometrik dilakukan secara lokal oleh modul Secure Enclave perangkat Anda.
          </div>
        </div>
      </div>

      {/* 3. RETENSI DAN HAK PENGGUNA */}
      <div className="rounded-[3px] border-2 border-black bg-surface p-6 space-y-4 shadow-retro">
        <h3 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" /> Kebijakan Retensi Data & Hak Mahasiswa
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 text-xs leading-relaxed">
          <div className="p-4 rounded border border-border bg-background space-y-2">
            <h4 className="font-bold text-foreground">Jadwal Retensi Data</h4>
            <p className="text-muted-foreground">
              - <strong>Log Ujian (<code className="font-mono">exam_events</code>):</strong> Disimpan selama 1 semester aktif untuk keperluan akreditasi dan verifikasi nilai akhir, setelah itu diarsipkan.<br />
              - <strong>Rekam Jejak Presensi GPS:</strong> Koordinat spesifik dibersihkan secara berkala setelah audit kehadiran semester selesai.<br />
              - <strong>Kredensial Sesi Login:</strong> Sesi otomatis kedaluwarsa setelah 30 hari tidak aktif atau saat pengguna mencabut akses di menu Perangkat & Sesi.
            </p>
          </div>

          <div className="p-4 rounded border border-border bg-background space-y-2">
            <h4 className="font-bold text-foreground">Hak Pengguna & Banding Akademik</h4>
            <p className="text-muted-foreground">
              - <strong>Hak Transparansi:</strong> Mahasiswa berhak melihat log anomali proctoring yang dicatat sistem saat ujian.<br />
              - <strong>Sengketa Nilai (Dispute):</strong> Jika terjadi kesalahpahaman sistem (mis. koneksi putus dianggap pindah tab), mahasiswa dapat mengajukan sanggahan langsung lewat fitur Sengketa Nilai.<br />
              - <strong>Keputusan Akhir pada Manusia:</strong> Sistem SIAJAR tidak mendiskualifikasi nilai secara sepihak. Dosen pengampu selalu menjadi pengambil keputusan akhir.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-between items-center text-xs text-muted-foreground border-t border-border">
          <span>Terakhir diperbarui: Semester Ganjil 2026/2027</span>
          <Link href="/student" className="font-bold text-foreground hover:underline flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
