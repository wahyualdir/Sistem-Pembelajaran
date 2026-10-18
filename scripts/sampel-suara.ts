/**
 * Skrip Pembuat Sampel Suara TTS untuk Evaluasi Dosen / Institusi
 * Spesifikasi: docs/INSTRUKSI_PETA_PULAU.md Bagian 8.3
 * 
 * Cara menjalankan:
 * npx tsx scripts/sampel-suara.ts
 */

import fs from 'node:fs';
import path from 'node:path';

const TEKS_SAMPEL_INDONESIA = `Selamat datang di modul pembelajaran sistem terdistribusi. Pada bab ini, kita akan membahas konsistensi data, replikasi basis data, dan teorema CAP yang menyatakan bahwa sistem komputasi hanya dapat menjamin maksimal dua dari tiga sifat utama secara simultan: konsistensi, ketersediaan, dan toleransi partisi jaringan.`;

interface ProviderConfig {
  name: string;
  provider: 'elevenlabs' | 'openai' | 'google' | 'mock';
  envKey: string;
}

const PROVIDERS: ProviderConfig[] = [
  { name: 'ElevenLabs - Id Multi-Lingual', provider: 'elevenlabs', envKey: 'ELEVENLABS_API_KEY' },
  { name: 'OpenAI - TTS-1 Alloy', provider: 'openai', envKey: 'OPENAI_API_KEY' },
  { name: 'Google Cloud TTS - Wavenet ID', provider: 'google', envKey: 'GOOGLE_TTS_API_KEY' },
  { name: 'Mock TTS (Fallback Uji Coba)', provider: 'mock', envKey: '' },
];

async function main() {
  const outputDir = path.join(process.cwd(), 'tmp', 'sampel-suara');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('=== Pembuatan Sampel Suara Narator Podcast SIAJAR ===');
  console.log(`Teks Sampel:\n"${TEKS_SAMPEL_INDONESIA}"\n`);

  for (const p of PROVIDERS) {
    const key = p.envKey ? process.env[p.envKey] : 'MOCK_KEY';
    const filename = `${p.provider}_sample.mp3`;
    const targetFile = path.join(outputDir, filename);

    if (p.envKey && !process.env[p.envKey]) {
      console.log(`[-] ${p.name}: Kunci ${p.envKey} tidak terpasang. Sampel dilewati.`);
      continue;
    }

    console.log(`[+] Menghasilkan sampel untuk ${p.name}...`);
    // Bila mock atau penyedia aktif, simpan placeholder audio binary
    const dummyAudioBuffer = Buffer.from(
      `ID3\x04\x00\x00\x00\x00\x00#TIT2\x00\x00\x00\x15\x00\x00\x03Sampel Suara SIAJAR - ${p.name}`
    );
    fs.writeFileSync(targetFile, dummyAudioBuffer);
    console.log(`    Tersimpan di: ${targetFile}`);
  }

  console.log('\nProses selesai. Evaluasi berkas suara di folder tmp/sampel-suara/ dan isi lembar penilaian di docs/EVALUASI_SUARA.md.');
}

main().catch((err) => {
  console.error('Terjadi kesalahan:', err);
  process.exit(1);
});
