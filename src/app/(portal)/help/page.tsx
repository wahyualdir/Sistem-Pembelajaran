'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  BookOpen,
  ShieldCheck,
  FileQuestion,
  Users,
  GraduationCap,
  FileSpreadsheet,
  Server,
} from 'lucide-react';

interface FAQItem {
  kategori: string;
  pertanyaan: string;
  jawaban: string;
}

const FAQS_UMUM: FAQItem[] = [
  {
    kategori: 'PRESENSI KELAS',
    pertanyaan: 'Bagaimana cara melakukan presensi dengan QR Dinamis dan Lokasi GPS?',
    jawaban:
      'Buka menu Presensi pada bilah sisi atau di dalam kelas, masukkan kode sesi 6 karakter atau pindai kode QR yang ditampilkan dosen. Izinkan akses peramban ke lokasi GPS untuk memastikan posisi Anda berada dalam radius aman (kurang dari 50 meter dari titik koordinat ruang kelas).',
  },
  {
    kategori: 'UJIAN TERAWASI',
    pertanyaan: 'Bagaimana cara mengikuti ujian terstandarisasi Computer Based Test?',
    jawaban:
      'Masuk ke menu Ujian, pilih jadwal ujian yang sedang berlangsung, lalu masukkan token akses dinamis yang diberikan pengawas. Selama pengerjaan, jawaban tersimpan otomatis secara berkala di penyimpanan lokal peramban (IndexedDB) dan server. Hindari berpindah tab atau meminimalkan jendela agar tidak memicu peringatan pelanggaran.',
  },
  {
    kategori: 'KEAMANAN AKUN',
    pertanyaan: 'Apa yang harus dilakukan jika menerima notifikasi login dari perangkat asing?',
    jawaban:
      'Segera buka menu Privasi, periksa daftar sesi aktif pada menu Sesi Login, lalu klik tombol darurat "Ini bukan saya". Tindakan ini akan mencabut seluruh sesi aktif lainnya secara instan dan mengunci akun untuk perlindungan data pribadi Anda.',
  },
  {
    kategori: 'SANGGAHAN NILAI',
    pertanyaan: 'Kapan batas waktu pengajuan sanggahan nilai dan bagaimana mekanismenya?',
    jawaban:
      'Mahasiswa dapat mengajukan sanggahan nilai resmi dalam jendela waktu 7 hari sejak nilai dipublikasikan oleh dosen pengampu. Sertakan alasan akademik yang jelas dan bukti pendukung. Dosen pengampu akan meninjau dan memberikan keputusan tertulis.',
  },
  {
    kategori: 'JAM TENANG',
    pertanyaan: 'Apa aturan komunikasi pesan pada jam tenang malam hari?',
    jawaban:
      'Sistem memberlakukan jam tenang komunikasi akademik antara pukul 21.00 sampai 06.00 WIB. Notifikasi pesan non-mendesak akan ditahan sementara dan dikirimkan kembali pada pukul 06.00 WIB pagi berikutnya untuk menjaga kenyamanan seluruh sivitas.',
  },
  {
    kategori: 'EVALUASI DOSEN',
    pertanyaan: 'Apakah kerahasiaan identitas terjamin saat mengisi evaluasi dosen?',
    jawaban:
      'Ya, pengisian kuesioner evaluasi dosen (EDOM) menerapkan pemisahan data mutlak (True Anonymity Decoupling). Sistem hanya mencatat bahwa Anda telah mengisi untuk membuka akses nilai akhir, tanpa menautkan jawaban survei ke identitas mahasiswa.',
  },
];

interface RoleWorkflow {
  judul: string;
  langkah: string[];
}

const WORKFLOWS_PER_ROLE: Record<string, { peran: string; ikon: React.ElementType; alur: RoleWorkflow[] }> = {
  mahasiswa: {
    peran: 'Mahasiswa',
    ikon: GraduationCap,
    alur: [
      {
        judul: 'Alur Pembelajaran dan Rilis Terjadwal',
        langkah: [
          'Buka menu Kelas Saya untuk melihat mata kuliah semester aktif.',
          'Materi perkuliahan terbuka secara bertahap sesuai rilis terjadwal dosen.',
          'Pelajari materi secara sekuensial; modul berikutnya akan terbuka setelah materi sebelumnya ditandai selesai dibaca.',
          'Unduh berkas pendukung atau tonton video pengantar yang disematkan dosen.',
        ],
      },
      {
        judul: 'Alur Tugas Individu dan Kelompok',
        langkah: [
          'Periksa batas waktu penyerahan tugas pada kartu tugas di kelas atau kalender.',
          'Untuk tugas kelompok, pastikan Anda telah bergabung ke dalam kelompok resmi menggunakan kode gabung 6 karakter.',
          'Kirimkan berkas tugas sebelum tenggat; jika terlambat, sistem menerapkan penalti keterlambatan otomatis sesuai kebijakan dosen.',
          'Jika Anda menerima perpanjangan tenggat dari dosen pengampu, tenggat baru akan otomatis tertera pada layar tugas Anda.',
        ],
      },
      {
        judul: 'Alur Izin, Sakit, dan Sanggahan Nilai',
        langkah: [
          'Jika berhalangan hadir kuliah, ajukan surat permohonan melalui tab Izin dan Sakit pada menu Presensi dengan melampirkan berkas bukti (PDF atau gambar).',
          'Permohonan izin diajukan maksimal 7 hari ke belakang sejak tanggal pertemuan.',
          'Periksa nilai pada menu Nilai Saya; jika terdapat kekeliruan penilaian, klik tombol Ajukan Sanggahan dalam batas waktu 7 hari.',
        ],
      },
      {
        judul: 'Alur Peta Pulau, Flashcard, dan Rekap Semester',
        langkah: [
          'Buka Kelas Saya lalu pilih tab Peta (atau sakelar Tampilan Daftar) untuk memantau perjalanan belajar per bab.',
          'Kerjakan kuis bab untuk meraih skor ambang (standar 70) agar bab pulau berikutnya terbuka; percobaan ulang tidak dibatasi.',
          'Buka menu Flashcard untuk mengulas konsep materi dengan metode pengulangan berkala 5 kotak Leitner (maksimal 20 kartu baru per hari).',
          'Buka menu Tukar Keahlian untuk bertanya konsep materi kepada rekan sekelas; jawaban yang terbantu mendapatkan +50 XP (forum otomatis terkunci saat ujian aktif).',
          'Buka menu Pencapaian tab Rekap Semester untuk melihat rangkuman autentik aktivitas belajar Anda secara tenang dan privat.',
        ],
      },
    ],
  },
  asisten: {
    peran: 'Asisten Dosen',
    ikon: Users,
    alur: [
      {
        judul: 'Alur Asistensi dan Pembukaan Presensi',
        langkah: [
          'Buka menu Kelas Asistensi untuk memantau rombongan belajar praktikum yang ditugaskan.',
          'Jika dosen memberikan wewenang pembukaan presensi, tombol Buka Sesi Presensi akan muncul pada jadwal pertemuan terkait.',
          'Aktivitas pembukaan presensi oleh asisten tercatat permanen pada catatan log audit universitas.',
        ],
      },
      {
        judul: 'Alur Pemeriksaan Draf Nilai Berbasis Rubrik',
        langkah: [
          'Buka menu Koreksi untuk melihat daftar berkas pengumpulan praktikum mahasiswa.',
          'Pilih kriteria skor pada lembar rubrik analitik dan berikan catatan umpan balik formatif.',
          'Simpan skor sebagai draf evaluasi; pengesahan dan publikasi nilai akhir tetap menjadi wewenang penuh dosen pengampu.',
        ],
      },
      {
        judul: 'Alur Pengawasan Ruang Ujian CBT',
        langkah: [
          'Buka menu Pantau Ujian saat jadwal evaluasi praktikum atau kuis berlangsung.',
          'Tampilkan token dinamis di layar proyektor laboratorium (token berotasi otomatis tiap menit).',
          'Pantau status peserta ujian dan catat mahasiswa yang memerlukan penambahan waktu khusus.',
        ],
      },
      {
        judul: 'Alur Pendampingan Belajar dan Moderasi Tukar Keahlian',
        langkah: [
          'Akses menu Flashcard untuk memeriksa butir kartu konsep praktikum yang aktif di kelas asistensi.',
          'Pantau ruang Tukar Keahlian untuk memberikan petunjuk konsep materi dan memoderasi pertanyaan atau jawaban mahasiswa.',
        ],
      },
    ],
  },
  dosen: {
    peran: 'Dosen Pengampu',
    ikon: BookOpen,
    alur: [
      {
        judul: 'Alur Manajemen Kelas dan Kloning Semester',
        langkah: [
          'Gunakan fitur Salin Kelas untuk menyalin materi, penugasan, rubrik, dan pengaturan dari semester sebelumnya.',
          'Tentukan jumlah hari pergeseran tanggal agar jadwal tugas dan kuis otomatis menyesuaikan kalender akademik aktif.',
          'Unggah materi baru dengan opsi rilis terjadwal agar terbuka otomatis pada jam perkuliahan yang ditentukan.',
          'Setelah perkuliahan selesai, gunakan tombol Arsipkan Kelas agar ruang kelas beralih ke status hanya-baca.',
        ],
      },
      {
        judul: 'Alur Peta Pulau dan Tinjau Konten AI',
        langkah: [
          'Aktifkan sakelar Peta Pulau, Flashcard, Podcast, dan Tukar Keahlian pada tab Pengaturan Fitur di kelas Anda.',
          'Kelola urutan bab pembelajaran, tautkan materi kuliah, dan atur ambang batas kelulusan kuis bab (bawaan 70) pada tab Bab.',
          'Buka menu Tinjau Konten untuk memverifikasi draf flashcard dan naskah podcast (450 sampai 900 kata) hasil kurasi kecerdasan buatan.',
          'Periksa skor keterikatan sumber (grounding score) dan gunakan pintasan tombol (A untuk Setuju, E untuk Sunting, R untuk Tolak, J/K untuk Navigasi).',
          'Setujui pernyataan kepatuhan kebijakan sebelum menerbitkan konten flashcard dan suara podcast ke mahasiswa.',
        ],
      },
      {
        judul: 'Alur Bank Soal dan Impor Massal',
        langkah: [
          'Buka menu Bank Soal untuk mengelola butir pertanyaan (pilihan ganda, benar salah, isian singkat, esai, dan koding).',
          'Unduh templat resmi Excel untuk mengimpor hingga 500 soal sekaligus dengan validasi dropdown tingkat kesulitan dan tipe soal.',
          'Gunakan dokumen Word dengan format pola baku (nomor, pilihan a sampai e, dan baris kunci jawaban) untuk impor instan.',
          'Manfaatkan ekspor dan impor standar Moodle XML atau paket QTI 2.1 zip untuk memindahkan bank soal antarplatform.',
        ],
      },
      {
        judul: 'Alur Pengisian Berita Acara dan Buku Nilai',
        langkah: [
          'Isi Berita Acara perkuliahan harian dalam batas waktu maksimal 3 hari setelah tatap muka selesai.',
          'Kelola pembobotan komponen nilai (Tugas, Kuis, UTS, UAS = 100%) pada menu Buku Nilai.',
          'Periksa hasil deteksi kemiripan teks shingling/winnowing pada tugas esai untuk mencegah plagiarisme.',
          'Klik tombol Finalisasi Buku Nilai; jika terdapat koreksi setelah final, ajukan Permohonan Revisi Nilai ke Kaprodi.',
        ],
      },
    ],
  },
  kaprodi: {
    peran: 'Koordinator Program Studi',
    ikon: CompassIconWrapper,
    alur: [
      {
        judul: 'Alur Kurikulum dan Pemetaan CPL/CPMK',
        langkah: [
          'Buka menu Kurikulum untuk mengelola struktur mata kuliah program studi berbasis Outcome-Based Education.',
          'Tetapkan matriks Capaian Pembelajaran Lulusan (CPL) dan Capaian Pembelajaran Mata Kuliah (CPMK).',
          'Atur prasyarat mata kuliah dengan validasi otomatis pencegahan dependensi melingkar.',
        ],
      },
      {
        judul: 'Alur Laporan Adopsi Peta Pulau dan Pembelajaran',
        langkah: [
          'Buka menu Laporan & Evaluasi lalu pilih tab Adopsi Peta Pulau untuk meninjau keterpakaian fitur per kelas di program studi.',
          'Pantau rasio kelas yang mengaktifkan Peta, Flashcard, Podcast, dan Tukar Keahlian.',
          'Untuk menjaga kepatuhan privasi (K-Anonymity), persentase kelulusan kelas dengan jumlah mahasiswa kurang dari 5 otomatis disamarkan (< 5 (Privasi Terjaga)).',
        ],
      },
      {
        judul: 'Alur Persetujuan Revisi Nilai Pasca-Final',
        langkah: [
          'Buka menu Persetujuan Nilai saat menerima pengajuan perubahan nilai dari dosen pengampu.',
          'Pelajari berkas bukti koreksi dan justifikasi akademik yang diajukan.',
          'Berikan keputusan persetujuan atau penolakan; keputusan yang disetujui akan diteruskan ke Staf Akademik untuk eksekusi basis data.',
        ],
      },
      {
        judul: 'Alur Periode Evaluasi Dosen (EDOM)',
        langkah: [
          'Buka menu Evaluasi Dosen untuk membentuk periode survei kepuasan mahasiswa dari templat instrumen.',
          'Tentukan tanggal buka dan tutup periode survei menjelang akhir semester perkuliahan.',
          'Pantau tingkat kelengkapan pengisian dan moderasi komentar teks yang melanggar tata tertib dengan alasan ter-audit.',
          'Unduh rekapitulasi laporan agregat per dosen untuk evaluasi mutu pembelajaran program studi.',
        ],
      },
    ],
  },
  staf: {
    peran: 'Staf Akademik',
    ikon: FileSpreadsheet,
    alur: [
      {
        judul: 'Alur Penjadwalan Bebas Bentrok',
        langkah: [
          'Buka menu Jadwal untuk memplot perkuliahan dan ujian semester aktif.',
          'Sistem secara otomatis mendeteksi dan mencegah bentrok jadwal mengajar dosen, pemakaian ruang kuliah, dan rombel mahasiswa.',
          'Pastikan seluruh kelas memiliki ruang dan alokasi waktu yang sesuai kapasitas daya tampung.',
        ],
      },
      {
        judul: 'Alur Kelas dan Penutupan Semester',
        langkah: [
          'Buka menu Kelas dan Peserta untuk membentuk rombel kelas baru dan mendaftarkan peserta secara batch melalui berkas CSV.',
          'Di akhir masa semester, gunakan tombol Tutup Semester untuk mengarsipkan seluruh kelas aktif menjadi hanya-baca.',
          'Pembatalan arsip kelas hanya dapat dilakukan oleh Staf Akademik dengan menyertakan alasan resmi yang masuk ke log audit.',
        ],
      },
      {
        judul: 'Alur Pemrosesan Pengajuan Surat Mahasiswa',
        langkah: [
          'Buka menu Pengajuan Masuk untuk memverifikasi permohonan surat keterangan aktif kuliah, izin dispensasi, dan cuti akademik.',
          'Periksa kelengkapan berkas bukti yang diunggah mahasiswa.',
          'Terbitkan surat resmi bertanda tangan digital ber-QR code yang dapat diverifikasi keasliannya oleh pihak eksternal.',
        ],
      },
    ],
  },
  admin: {
    peran: 'Administrator Sistem',
    ikon: Server,
    alur: [
      {
        judul: 'Alur Operasional dan Pemutaran Kredensial',
        langkah: [
          'Lakukan rotasi rahasia CRON_SECRET secara berkala pada konfigurasi lingkungan server.',
          'Verifikasi keberhasilan eksekusi pekerjaan terjadwal latar (notifikasi terjadwal, pengarsipan otomatis, dan pembersihan berkas sementara).',
          'Pastikan konektor Judge autograder koding terhubung dan merespon eksekusi pengujian pemrograman sandbox.',
        ],
      },
      {
        judul: 'Alur Pemantauan Keamanan dan Cadangan Data',
        langkah: [
          'Pantau daftar sesi login terdaftar dan terapkan penguncian akun otomatis jika terjadi 5 kali kegagalan login beruntun.',
          'Jalankan jadwal pencadangan skema basis data publik dan lakukan uji pemulihan darurat sesuai panduan dokumen RUNBOOK.',
          'Periksa rekaman log audit; System Admin membaca versi dengan penyamaran data akademik, sedangkan Super Admin memiliki hak baca penuh.',
        ],
      },
      {
        judul: 'Alur Impersonasi Hanya-Lihat Super Admin',
        langkah: [
          'Fitur impersonasi hanya tersedia untuk Super Admin guna penyelidikan kendala operasional tingkat lanjut.',
          'Wajib memasukkan alasan investigasi minimal 20 karakter sebelum sesi dimulai.',
          'Sesi berlangsung maksimal 30 menit dalam mode hanya-lihat (seluruh aksi penulisan data ditolak di tingkat server).',
        ],
      },
    ],
  },
};

function CompassIconWrapper(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

export default function HelpCenterPage() {
  const [activeRole, setActiveRole] = useState<string>('mahasiswa');

  const currentRoleData = WORKFLOWS_PER_ROLE[activeRole] || WORKFLOWS_PER_ROLE.mahasiswa;
  const ActiveRoleIcon = currentRoleData.ikon;

  return (
    <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0">
      <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
        {/* OPEN HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-0.5">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-ink flex items-center gap-2.5">
              <HelpCircle className="h-6 w-6 sm:h-7 sm:w-7 text-primary inline-block" />
              Bantuan dan Panduan Operasional
            </h1>
            <p className="text-xs sm:text-sm text-gray-dark font-bold">
              Panduan lengkap operasional sistem akademik RuangKampus untuk seluruh peran: pembelajaran terstruktur, CBT, dan privasi.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-primary text-white border-2 border-ink shadow-xs">
              SOP AKADEMIK AKTIF
            </span>
          </div>
        </div>

        {/* 1. PANDUAN WORKFLOW ALUR KERJA PER PERAN */}
        <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between border-b-2 border-ink/20 pb-3">
            <div className="space-y-0.5">
              <h2 className="font-heading font-bold text-base sm:text-lg text-ink flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span>Alur Operasional Berdasarkan Peran Pengguna</span>
              </h2>
              <p className="text-xs text-gray-dark font-bold">Pilih peran untuk melihat pedoman langkah operasional</p>
            </div>
            <span className="text-xs font-sans font-bold px-2.5 py-1 rounded-full border-2 border-ink bg-gray-soft text-ink shadow-xs shrink-0">
              6 KATEGORI PERAN
            </span>
          </div>

          {/* Tab Buttons Peran */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b-2 border-ink/20">
            {Object.entries(WORKFLOWS_PER_ROLE).map(([key, data]) => {
              const isActive = activeRole === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveRole(key)}
                  className={`px-3.5 py-1.5 rounded-lg border-2 border-ink font-heading font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-ink text-white shadow-retro border-b-4 border-b-primary'
                      : 'bg-surface text-ink hover:bg-gray-soft shadow-xs'
                  }`}
                >
                  {data.peran}
                </button>
              );
            })}
          </div>

          {/* Banner Peran Aktif */}
          <div className="flex items-center gap-3 p-3.5 bg-gray-soft/40 border-2 border-ink rounded-xl shadow-xs">
            <div className="p-2 bg-surface rounded-lg border-2 border-ink text-primary shadow-xs">
              <ActiveRoleIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm sm:text-base text-ink">
                Pedoman Operasional: {currentRoleData.peran}
              </h3>
              <p className="text-xs text-gray-dark font-bold font-sans">
                Ikuti langkah-langkah terstruktur di bawah untuk menjalankan aktivitas akademik sesuai wewenang.
              </p>
            </div>
          </div>

          {/* Grid Alur Langkah */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {currentRoleData.alur.map((wf, idx) => (
              <div
                key={idx}
                className="rounded-xl border-2 border-ink bg-surface p-4 shadow-retro-sm flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-ink text-white text-xs font-bold font-mono shrink-0">
                      {idx + 1}
                    </span>
                    <h4 className="font-heading font-bold text-sm text-ink leading-snug">
                      {wf.judul}
                    </h4>
                  </div>
                  <ul className="space-y-2 pt-2 border-t-2 border-ink/10">
                    {wf.langkah.map((step, sIdx) => (
                      <li key={sIdx} className="text-xs text-gray-dark font-bold font-sans leading-relaxed flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. TANYA JAWAB UMUM (FAQ) */}
        <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4">
          <div className="flex items-center justify-between border-b-2 border-ink/20 pb-3">
            <div className="space-y-0.5">
              <h2 className="font-heading font-bold text-base sm:text-lg text-ink flex items-center gap-2">
                <FileQuestion className="h-5 w-5 text-primary" />
                <span>Pertanyaan yang Sering Diajukan (FAQ)</span>
              </h2>
              <p className="text-xs text-gray-dark font-bold">Kanal informasi dan panduan teknis umum</p>
            </div>
            <span className="text-xs font-sans font-bold px-2.5 py-1 rounded-full border-2 border-ink bg-gray-soft text-ink shadow-xs">
              {FAQS_UMUM.length} PANDUAN
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {FAQS_UMUM.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border-2 border-ink bg-surface p-4 shadow-retro-sm flex flex-col justify-between space-y-3 hover:-translate-y-0.5 transition-all"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full border-2 border-ink text-[11px] font-sans font-bold shadow-xs bg-gray-soft text-ink">
                      {faq.kategori}
                    </span>
                    <HelpCircle className="h-4 w-4 text-primary" />
                  </div>

                  <h3 className="font-heading font-bold text-sm sm:text-base text-ink leading-snug">
                    {faq.pertanyaan}
                  </h3>

                  <p className="text-xs text-gray-dark font-bold font-sans leading-relaxed pt-2 border-t-2 border-ink/10">
                    {faq.jawaban}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. BANNER TRANSPARANSI PRIVASI DAN KEAMANAN DATA */}
        <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-retro">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-heading font-bold text-base sm:text-lg text-ink flex items-center justify-center sm:justify-start gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span>Transparansi Privasi dan Pelindungan Data Pribadi</span>
            </h3>
            <p className="text-xs sm:text-sm text-gray-dark font-bold max-w-2xl leading-relaxed">
              Sistem RuangKampus mematuhi Undang-Undang Pelindungan Data Pribadi (UU PDP). Pelajari parameter telemetri pengerjaan ujian, batas retensi arsip surat izin sakit (180 hari), serta mekanisme anonimitas mutlak pada evaluasi dosen.
            </p>
          </div>

          <Link
            href="/transparency"
            className="rounded-xl border-2 border-ink bg-primary px-5 py-2.5 font-heading font-bold text-white shadow-retro-sm hover:brightness-105 transition-all text-xs sm:text-sm shrink-0 whitespace-nowrap"
          >
            Lihat Lembar Privasi
          </Link>
        </div>
      </div>
    </div>
  );
}
