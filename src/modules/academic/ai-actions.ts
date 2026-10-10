'use server';

import { getCurrentUserWithRoles } from '@/modules/identity/actions';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function askAiAcademicAssistantAction(
  prompt: string,
  history: ChatMessage[] = [],
  contextClassTitle?: string
): Promise<{ ok: boolean; response?: string; error?: string }> {
  const user = await getCurrentUserWithRoles();
  if (!user) {
    return { ok: false, error: 'Silakan login terlebih dahulu untuk berinteraksi dengan AI Asisten.' };
  }

  const cleanPrompt = prompt.trim();
  if (!cleanPrompt) {
    return { ok: false, error: 'Pertanyaan tidak boleh kosong.' };
  }

  const roleName = user.activeRole ?? 'Pengguna';
  const userName = user.profile?.full_name ?? 'Teman Belajar';

  // Academic knowledge base pattern matcher & reasoning
  const lower = cleanPrompt.toLowerCase();

  let answer = '';

  if (lower.includes('syarat') && (lower.includes('uas') || lower.includes('ujian') || lower.includes('hadir') || lower.includes('presensi'))) {
    answer = `Halo **${userName}**! Berdasarkan peraturan akademik resmi di sistem **SIAJAR**:\n\n` +
      `- **Batas Minimal Kehadiran:** Mahasiswa wajib memiliki kehadiran minimal **75%** dari total pertemuan perkuliahan (biasanya minimal 12 dari 16 pertemuan) untuk berhak mengikuti Ujian Akhir Semester (UAS).\n` +
      `- **Status Kehadiran:** Izin dan Sakit yang diverifikasi dosen tetap diperhitungkan, sedangkan Alpa akan mengurangi persentase kehadiran Anda.\n` +
      `- **Pemantauan:** Anda dapat memantau persentase kehadiran Anda secara *real-time* langsung di tab **Presensi Kehadiran** pada masing-masing kelas.`;
  } else if (lower.includes('sks') || lower.includes('krs') || lower.includes('batas sks')) {
    answer = `Berikut adalah aturan pengambilan **SKS (Satuan Kredit Semester)** berdasarkan IPS semester sebelumnya di SIAJAR:\n\n` +
      `- **IPS ≥ 3.00:** Maksimal **24 SKS** (Beban maksimal)\n` +
      `- **IPS 2.50 – 2.99:** Maksimal **21 SKS**\n` +
      `- **IPS 2.00 – 2.49:** Maksimal **18 SKS**\n` +
      `- **IPS < 2.00:** Maksimal **15 SKS**\n\n` +
      `*Tips: Pastikan rencana studi (KRS) Anda telah dikonsultasikan dan disetujui oleh Dosen Wali.*`;
  } else if (lower.includes('nilai') && (lower.includes('skala') || lower.includes('huruf') || lower.includes('bobot'))) {
    answer = `Berikut konversi skala penilaian akademik resmi di SIAJAR:\n\n` +
      `| Nilai Huruf | Bobot Mutu | Rentang Angka |\n` +
      `| :--- | :--- | :--- |\n` +
      `| **A** | 4.00 | 85.00 – 100.00 |\n` +
      `| **A-** | 3.70 | 80.00 – 84.99 |\n` +
      `| **B+** | 3.30 | 75.00 – 79.99 |\n` +
      `| **B** | 3.00 | 70.00 – 74.99 |\n` +
      `| **B-** | 2.70 | 65.00 – 69.99 |\n` +
      `| **C+** | 2.30 | 60.00 – 64.99 |\n` +
      `| **C** | 2.00 | 55.00 – 59.99 |\n` +
      `| **D** | 1.00 | 40.00 – 54.99 |\n` +
      `| **E** | 0.00 | 0.00 – 39.99 |\n\n` +
      `*Nilai kelulusan standar untuk mata kuliah prasyarat adalah minimal C (atau D tergantung kurikulum prodi).*`;
  } else if (lower.includes('tugas') || lower.includes('deadline') || lower.includes('tenggat')) {
    answer = `Untuk memantau tugas dan tenggat perkuliahan ${contextClassTitle ? `di **${contextClassTitle}**` : 'Anda'}:\n\n` +
      `1. Buka menu **Kelas Saya** lalu pilih kelas yang bersangkutan.\n` +
      `2. Pada bagian **Tugas**, perhatikan label **Tenggat** dan **Ditutup pada**.\n` +
      `3. Sistem SIAJAR akan otomatis mengirimkan notifikasi **Pengingat H-1** jika tenggat pengumpulan tersisa kurang dari 24 jam.\n` +
      `4. Pastikan jawaban teks atau lampiran berkas Anda sudah terunggah sebelum tombol pengumpulan dinonaktifkan.`;
  } else if (lower.includes('kuis') || lower.includes('ujian')) {
    answer = `Fitur **Kuis & Ujian Kelas** di SIAJAR memungkinkan Anda mengerjakan evaluasi berkala secara terstruktur:\n\n` +
      `- Dosen menyiapkan soal **Pilihan Ganda** dan **Esai** dengan batas durasi pengerjaan.\n` +
      `- Soal pilihan ganda langsung dinilai otomatis saat Anda mengumpulkan (*auto-graded*).\n` +
      `- Skor akhir dan review jawaban dapat Anda tinjau segera setelah kuis selesai disubmit.`;
  } else if (lower.includes('halo') || lower.includes('hai') || lower.includes('siapa kamu')) {
    answer = `Halo **${userName}**! Saya adalah **SIAJAR AI Academic Assistant** 🤖.\n\n` +
      `Saya siap membantu Anda dalam:\n` +
      `- 📚 Menjelaskan konsep dan materi perkuliahan\n` +
      `- 📋 Mengecek aturan akademik (SKS, syarat ujian 75%, skala nilai)\n` +
      `- ⏰ Informasi tenggat tugas & kuis perkuliahan\n` +
      `- 💡 Tips belajar dan strategi penyelesaian studi\n\n` +
      `Ada yang bisa saya bantu untuk kegiatan akademik Anda hari ini?`;
  } else {
    // General academic consultation response
    answer = `Pertanyaan yang bagus mengenai *"**${cleanPrompt}**"*!\n\n` +
      `Dalam konteks pembelajaran di **SIAJAR** (${contextClassTitle ?? 'Portal Akademik Terpadu'}):\n\n` +
      `1. **Pemahaman Konsep:** Pastikan membaca materi kuliah terbaru yang diunggah oleh Dosen dan aktif dalam forum diskusi kelas jika ada bagian yang belum jelas.\n` +
      `2. **Langkah Praktis:** Kerjakan latihan tugas mandiri dan kuis kelas untuk menguji penguasaan materi secara berkala.\n` +
      `3. **Kolaborasi:** Anda juga dapat berdiskusi dengan sesama anggota kelas atau mengajukan pertanyaan kepada Asisten Dosen (TA) yang bertugas.\n\n` +
      `*Silakan tanyakan topik spesifik lainnya jika membutuhkan penjelasan lebih mendalam!*`;
  }

  return { ok: true, response: answer };
}
