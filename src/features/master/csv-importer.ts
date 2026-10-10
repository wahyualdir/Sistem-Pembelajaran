import Papa from "papaparse";
import { z } from "zod";
import { MasterStore } from "./master-store";

export interface CsvPreviewResult<T> {
  validRows: T[];
  invalidRows: {
    rowNumber: number;
    data: Record<string, string>;
    reason: string;
  }[];
  totalParsed: number;
}

const mahasiswaCsvSchema = z.object({
  nim: z.string().min(5, "NIM minimal 5 karakter").regex(/^\d+$/, "NIM harus berupa angka"),
  nama: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Format email tidak valid"),
  angkatan: z.string().regex(/^\d{4}$/, "Angkatan harus berupa 4 digit tahun"),
  prodiId: z.string().min(1, "Prodi ID harus diisi"),
});

const dosenCsvSchema = z.object({
  nidn: z.string().min(5, "NIDN minimal 5 karakter").regex(/^\d+$/, "NIDN harus berupa angka"),
  nama: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Format email tidak valid"),
});

export function parseMahasiswaCsv(csvContent: string): CsvPreviewResult<{
  nim: string;
  nama: string;
  email: string;
  angkatan: number;
  prodiId: string;
}> {
  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const existingMahasiswa = MasterStore.getMahasiswa();
  const validRows: {
    nim: string;
    nama: string;
    email: string;
    angkatan: number;
    prodiId: string;
  }[] = [];
  const invalidRows: {
    rowNumber: number;
    data: Record<string, string>;
    reason: string;
  }[] = [];

  const existingNims = new Set(existingMahasiswa.map((m) => m.nim));
  const existingEmails = new Set(existingMahasiswa.map((m) => m.email.toLowerCase()));

  parsed.data.forEach((row, index) => {
    const rowNum = index + 2; // header baris 1
    const validation = mahasiswaCsvSchema.safeParse(row);

    if (!validation.success) {
      invalidRows.push({
        rowNumber: rowNum,
        data: row,
        reason: validation.error.errors[0]?.message || "Format data tidak sesuai",
      });
      return;
    }

    const { nim, nama, email, angkatan, prodiId } = validation.data;

    if (existingNims.has(nim)) {
      invalidRows.push({
        rowNumber: rowNum,
        data: row,
        reason: `NIM ${nim} sudah terdaftar sebelumnya`,
      });
      return;
    }

    if (existingEmails.has(email.toLowerCase())) {
      invalidRows.push({
        rowNumber: rowNum,
        data: row,
        reason: `Email ${email} sudah terdaftar`,
      });
      return;
    }

    // Hindari duplikat dalam batch CSV yang sama
    existingNims.add(nim);
    existingEmails.add(email.toLowerCase());

    validRows.push({
      nim,
      nama,
      email,
      angkatan: parseInt(angkatan, 10),
      prodiId,
    });
  });

  return {
    validRows,
    invalidRows,
    totalParsed: parsed.data.length,
  };
}

export function parseDosenCsv(csvContent: string): CsvPreviewResult<{
  nidn: string;
  nama: string;
  email: string;
}> {
  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const existingDosen = MasterStore.getDosen();
  const validRows: { nidn: string; nama: string; email: string }[] = [];
  const invalidRows: {
    rowNumber: number;
    data: Record<string, string>;
    reason: string;
  }[] = [];

  const existingNidns = new Set(existingDosen.map((d) => d.nidn));
  const existingEmails = new Set(existingDosen.map((d) => d.email.toLowerCase()));

  parsed.data.forEach((row, index) => {
    const rowNum = index + 2;
    const validation = dosenCsvSchema.safeParse(row);

    if (!validation.success) {
      invalidRows.push({
        rowNumber: rowNum,
        data: row,
        reason: validation.error.errors[0]?.message || "Format data tidak sesuai",
      });
      return;
    }

    const { nidn, nama, email } = validation.data;

    if (existingNidns.has(nidn)) {
      invalidRows.push({
        rowNumber: rowNum,
        data: row,
        reason: `NIDN ${nidn} sudah terdaftar`,
      });
      return;
    }

    if (existingEmails.has(email.toLowerCase())) {
      invalidRows.push({
        rowNumber: rowNum,
        data: row,
        reason: `Email ${email} sudah terdaftar`,
      });
      return;
    }

    existingNidns.add(nidn);
    existingEmails.add(email.toLowerCase());

    validRows.push({ nidn, nama, email });
  });

  return {
    validRows,
    invalidRows,
    totalParsed: parsed.data.length,
  };
}
