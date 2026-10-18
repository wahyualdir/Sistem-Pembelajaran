import ExcelJS from 'exceljs';
import { sanitizeQuestionHtml, computeQuestionHash } from './question-sanitizer';

export interface ParsedQuestionItem {
  row_number: number;
  tipe: 'pilihan_ganda' | 'benar_salah' | 'isian_singkat' | 'esai';
  pertanyaan: string;
  opsi_a?: string;
  opsi_b?: string;
  opsi_c?: string;
  opsi_d?: string;
  opsi_e?: string;
  kunci: string;
  bobot: number;
  tingkat: 'mudah' | 'sedang' | 'sukar';
  topik?: string;
  cpmk?: string;
  pembahasan?: string;
  status: 'valid' | 'peringatan' | 'galat';
  issues: string[];
  hash: string;
}

export interface ParseExcelResult {
  total_rows: number;
  valid_count: number;
  warning_count: number;
  error_count: number;
  items: ParsedQuestionItem[];
}

/**
 * Membuat berkas template Excel (.xlsx) untuk impor soal massal SIAJAR
 */
export async function generateQuestionExcelTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SIAJAR - Universitas Islam Riau';
  workbook.lastModifiedBy = 'SIAJAR';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet('Bank Soal', {
    properties: { tabColor: { argb: 'FF006633' } },
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  worksheet.columns = [
    { header: 'tipe', key: 'tipe', width: 16 },
    { header: 'pertanyaan', key: 'pertanyaan', width: 45 },
    { header: 'opsi_a', key: 'opsi_a', width: 25 },
    { header: 'opsi_b', key: 'opsi_b', width: 25 },
    { header: 'opsi_c', key: 'opsi_c', width: 25 },
    { header: 'opsi_d', key: 'opsi_d', width: 25 },
    { header: 'opsi_e', key: 'opsi_e', width: 25 },
    { header: 'kunci', key: 'kunci', width: 15 },
    { header: 'bobot', key: 'bobot', width: 10 },
    { header: 'tingkat', key: 'tingkat', width: 14 },
    { header: 'topik', key: 'topik', width: 20 },
    { header: 'cpmk', key: 'cpmk', width: 15 },
    { header: 'pembahasan', key: 'pembahasan', width: 35 }
  ];

  // Format header baris 1
  const headerRow = worksheet.getRow(1);
  headerRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1F2937' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 26;

  // Dua baris contoh realistis
  worksheet.addRow({
    tipe: 'pilihan_ganda',
    pertanyaan: 'Manakah dari struktur data berikut yang beroperasi berdasarkan prinsip First-In, First-Out (FIFO)?',
    opsi_a: 'Stack',
    opsi_b: 'Queue',
    opsi_c: 'Tree',
    opsi_d: 'Graph',
    opsi_e: 'Hash Table',
    kunci: 'B',
    bobot: 10,
    tingkat: 'mudah',
    topik: 'Struktur Data',
    cpmk: 'CPMK-01',
    pembahasan: 'Queue (antrean) menerapkan prinsip FIFO di mana elemen pertama yang masuk akan keluar pertama kali.'
  });

  worksheet.addRow({
    tipe: 'benar_salah',
    pertanyaan: 'Protokol HTTPS menggunakan port standar 443 secara default.',
    opsi_a: 'Benar',
    opsi_b: 'Salah',
    opsi_c: '',
    opsi_d: '',
    opsi_e: '',
    kunci: 'Benar',
    bobot: 10,
    tingkat: 'mudah',
    topik: 'Jaringan Komputer',
    cpmk: 'CPMK-02',
    pembahasan: 'HTTPS menggunakan port 443 dengan enkripsi TLS/SSL.'
  });

  worksheet.addRow({
    tipe: 'esai',
    pertanyaan: 'Jelaskan mekanisme ACID dalam sistem manajemen basis data relasional dan pentingnya terhadap integritas transaksi.',
    opsi_a: '',
    opsi_b: '',
    opsi_c: '',
    opsi_d: '',
    opsi_e: '',
    kunci: 'Jawaban harus memuat Atomicity, Consistency, Isolation, dan Durability beserta contoh transaksi finansial.',
    bobot: 20,
    tingkat: 'sedang',
    topik: 'Basis Data',
    cpmk: 'CPMK-03',
    pembahasan: 'ACID menjamin transaksi diproses secara handal dan konsisten meskipun terjadi crash server.'
  });

  // Validasi data (Dropdown) untuk kolom tipe (A) dan tingkat (J) baris 2-500
  for (let i = 2; i <= 500; i++) {
    worksheet.getCell(`A${i}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"pilihan_ganda,benar_salah,isian_singkat,esai"'],
      showErrorMessage: true,
      errorTitle: 'Tipe Soal Tidak Valid',
      error: 'Pilih tipe soal yang valid: pilihan_ganda, benar_salah, isian_singkat, atau esai.'
    };

    worksheet.getCell(`J${i}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"mudah,sedang,sukar"'],
      showErrorMessage: true,
      errorTitle: 'Tingkat Kesulitan Tidak Valid',
      error: 'Pilih tingkat kesulitan: mudah, sedang, atau sukar.'
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Membaca dan memvalidasi berkas Excel soal massal
 */
export async function parseQuestionExcelBuffer(
  buffer: Buffer,
  existingHashes: Set<string> = new Set()
): Promise<ParseExcelResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('Berkas Excel kosong atau tidak memiliki lembar kerja (sheet).');
  }

  const items: ParsedQuestionItem[] = [];
  let validCount = 0;
  let warningCount = 0;
  let errorCount = 0;

  worksheet.eachRow((row, rowNumber) => {
    // Lewati header (baris 1)
    if (rowNumber === 1) return;

    const rawTipe = String(row.getCell(1).value || '').trim().toLowerCase();
    const rawPertanyaan = String(row.getCell(2).value || '').trim();
    const rawOpsiA = String(row.getCell(3).value || '').trim();
    const rawOpsiB = String(row.getCell(4).value || '').trim();
    const rawOpsiC = String(row.getCell(5).value || '').trim();
    const rawOpsiD = String(row.getCell(6).value || '').trim();
    const rawOpsiE = String(row.getCell(7).value || '').trim();
    const rawKunci = String(row.getCell(8).value || '').trim();
    const rawBobot = row.getCell(9).value;
    const rawTingkat = String(row.getCell(10).value || '').trim().toLowerCase();
    const rawTopik = String(row.getCell(11).value || '').trim();
    const rawCpmk = String(row.getCell(12).value || '').trim();
    const rawPembahasan = String(row.getCell(13).value || '').trim();

    // Abaikan baris kosong
    if (!rawTipe && !rawPertanyaan && !rawKunci) return;

    const issues: string[] = [];
    let status: 'valid' | 'peringatan' | 'galat' = 'valid';

    // 1. Validasi Tipe
    let tipe: 'pilihan_ganda' | 'benar_salah' | 'isian_singkat' | 'esai' = 'pilihan_ganda';
    if (['pilihan_ganda', 'multiple_choice', 'pg', 'mc'].includes(rawTipe)) {
      tipe = 'pilihan_ganda';
    } else if (['benar_salah', 'true_false', 'tf', 'bs'].includes(rawTipe)) {
      tipe = 'benar_salah';
    } else if (['isian_singkat', 'short_answer', 'isian', 'sa'].includes(rawTipe)) {
      tipe = 'isian_singkat';
    } else if (['esai', 'essay', 'uraian'].includes(rawTipe)) {
      tipe = 'esai';
    } else {
      issues.push(`Baris ${rowNumber}: tipe '${rawTipe}' tidak dikenali. Pilih: pilihan_ganda, benar_salah, isian_singkat, atau esai.`);
      status = 'galat';
    }

    // 2. Validasi Pertanyaan
    if (!rawPertanyaan) {
      issues.push(`Baris ${rowNumber}: pertanyaan wajib diisi.`);
      status = 'galat';
    }

    // 3. Validasi Opsi dan Kunci untuk Pilihan Ganda
    if (tipe === 'pilihan_ganda') {
      const availableOptions: string[] = [];
      if (rawOpsiA) availableOptions.push('A');
      if (rawOpsiB) availableOptions.push('B');
      if (rawOpsiC) availableOptions.push('C');
      if (rawOpsiD) availableOptions.push('D');
      if (rawOpsiE) availableOptions.push('E');

      if (availableOptions.length < 2) {
        issues.push(`Baris ${rowNumber}: pilihan ganda minimal harus memiliki 2 pilihan (A dan B).`);
        status = 'galat';
      }

      const cleanKey = rawKunci.toUpperCase().trim();
      if (!cleanKey) {
        issues.push(`Baris ${rowNumber}: kunci jawaban belum diisi.`);
        status = 'galat';
      } else if (!availableOptions.includes(cleanKey)) {
        issues.push(`Baris ${rowNumber}: kunci '${cleanKey}' tidak ada di pilihan. Pilihan yang tersedia: ${availableOptions.join(', ')}.`);
        status = 'galat';
      }
    } else if (tipe === 'benar_salah') {
      const cleanKey = rawKunci.toLowerCase();
      if (!['benar', 'salah', 'true', 'false', 'b', 's'].includes(cleanKey)) {
        issues.push(`Baris ${rowNumber}: kunci untuk benar/salah harus 'Benar' atau 'Salah'.`);
        status = 'galat';
      }
    } else {
      if (!rawKunci && status !== 'galat') {
        issues.push(`Baris ${rowNumber}: kunci jawaban kosong.`);
        status = 'peringatan';
      }
    }

    // 4. Bobot
    let bobot = 10;
    if (rawBobot !== null && rawBobot !== undefined && rawBobot !== '') {
      const num = Number(rawBobot);
      if (isNaN(num) || num <= 0) {
        issues.push(`Baris ${rowNumber}: bobot harus berupa angka positif. Nilai diatur ke bawaan (10).`);
        if (status !== 'galat') status = 'peringatan';
      } else {
        bobot = num;
      }
    } else {
      issues.push(`Baris ${rowNumber}: bobot kosong. Menggunakan bobot bawaan 10.`);
      if (status !== 'galat') status = 'peringatan';
    }

    // 5. Tingkat
    let tingkat: 'mudah' | 'sedang' | 'sukar' = 'sedang';
    if (['mudah', 'easy'].includes(rawTingkat)) {
      tingkat = 'mudah';
    } else if (['sedang', 'medium'].includes(rawTingkat)) {
      tingkat = 'sedang';
    } else if (['sukar', 'sulit', 'hard'].includes(rawTingkat)) {
      tingkat = 'sukar';
    } else if (rawTingkat) {
      issues.push(`Baris ${rowNumber}: tingkat '${rawTingkat}' tidak baku. Menggunakan bawaan 'sedang'.`);
      if (status !== 'galat') status = 'peringatan';
    }

    // 6. Deteksi Duplikat
    const hash = computeQuestionHash(rawPertanyaan);
    if (existingHashes.has(hash)) {
      issues.push(`Baris ${rowNumber}: terdeteksi kemiripan tinggi atau duplikat dengan soal yang sudah ada di Bank Soal.`);
      if (status !== 'galat') status = 'peringatan';
    }

    if (status === 'valid') validCount++;
    else if (status === 'peringatan') warningCount++;
    else errorCount++;

    items.push({
      row_number: rowNumber,
      tipe,
      pertanyaan: sanitizeQuestionHtml(rawPertanyaan),
      opsi_a: sanitizeQuestionHtml(rawOpsiA),
      opsi_b: sanitizeQuestionHtml(rawOpsiB),
      opsi_c: sanitizeQuestionHtml(rawOpsiC),
      opsi_d: sanitizeQuestionHtml(rawOpsiD),
      opsi_e: sanitizeQuestionHtml(rawOpsiE),
      kunci: rawKunci,
      bobot,
      tingkat,
      topik: rawTopik || undefined,
      cpmk: rawCpmk || undefined,
      pembahasan: sanitizeQuestionHtml(rawPembahasan) || undefined,
      status,
      issues,
      hash
    });
  });

  return {
    total_rows: items.length,
    valid_count: validCount,
    warning_count: warningCount,
    error_count: errorCount,
    items
  };
}
