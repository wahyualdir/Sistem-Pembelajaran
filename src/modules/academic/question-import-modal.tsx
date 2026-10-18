'use client';

import React, { useState, useTransition } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  FileArchive,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FolderArchive,
  X,
  Sparkles,
  Layers
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import {
  getQuestionTemplateBase64Action,
  parseUploadedQuestionFileAction,
  confirmQuestionImportAction,
  exportQuestionBankAction
} from './question-import-actions';
import { ParsedQuestionItem } from '@/lib/akademik/excel-question-parser';

export function QuestionImportExportModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [activeStep, setActiveStep] = useState<'upload' | 'preview' | 'summary'>('upload');

  const [parsedData, setParsedData] = useState<{
    format: 'excel' | 'word' | 'moodle_xml' | 'qti';
    total: number;
    validCount: number;
    warningCount: number;
    errorCount: number;
    items: ParsedQuestionItem[];
  } | null>(null);

  const [message, setMessage] = useState<{ type: 'sukses' | 'galat' | 'info'; text: string } | null>(null);
  const [importSummary, setImportSummary] = useState<{ imported: number; skipped: number } | null>(null);

  const handleDownloadTemplate = () => {
    startTransition(async () => {
      setMessage(null);
      const res = await getQuestionTemplateBase64Action();
      if (!res.ok || !res.data) {
        setMessage({ type: 'galat', text: res.pesan || 'Gagal mengunduh template.' });
        return;
      }

      const byteCharacters = atob(res.data.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: res.data.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.data.filename;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      setMessage(null);
      const fd = new FormData();
      fd.append('file', file);

      const res = await parseUploadedQuestionFileAction(fd);
      if (!res.ok || !res.data) {
        setMessage({ type: 'galat', text: res.pesan || 'Gagal memproses berkas.' });
        return;
      }

      setParsedData(res.data);
      setActiveStep('preview');
    });
  };

  const handleConfirmImport = (mode: 'skip_errors' | 'cancel_on_error') => {
    if (!parsedData) return;

    startTransition(async () => {
      setMessage(null);
      const res = await confirmQuestionImportAction({
        format: parsedData.format,
        items: parsedData.items,
        mode
      });

      if (!res.ok || !res.data) {
        setMessage({ type: 'galat', text: res.pesan || 'Gagal menyimpan soal.' });
        return;
      }

      setImportSummary({
        imported: res.data.importedCount,
        skipped: res.data.skippedCount
      });
      setActiveStep('summary');
      setMessage({ type: 'sukses', text: res.pesan });
    });
  };

  const handleExport = (format: 'moodle_xml' | 'qti') => {
    startTransition(async () => {
      setMessage(null);
      const res = await exportQuestionBankAction({ format });
      if (!res.ok || !res.data) {
        setMessage({ type: 'galat', text: res.pesan || 'Gagal mengekspor soal.' });
        return;
      }

      if (res.data.isBase64) {
        const byteCharacters = atob(res.data.base64!);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: res.data.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.data.filename;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([res.data.content!], { type: res.data.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.data.filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            setIsOpen(true);
            setActiveStep('upload');
            setMessage(null);
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border-2 border-black bg-primary text-white font-bold text-xs shadow-retro hover:bg-emerald-700 transition-all"
        >
          <UploadCloud className="h-4 w-4" />
          <span>Impor Soal Massal</span>
        </button>

        <button
          onClick={() => handleExport('moodle_xml')}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border-2 border-black bg-white text-black font-bold text-xs shadow-retro hover:bg-neutral-100 transition-all"
        >
          <Download className="h-4 w-4" />
          <span>Ekspor Moodle XML</span>
        </button>

        <button
          onClick={() => handleExport('qti')}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border-2 border-black bg-white text-black font-bold text-xs shadow-retro hover:bg-neutral-100 transition-all"
        >
          <FileArchive className="h-4 w-4" />
          <span>Ekspor QTI 2.1 (.zip)</span>
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <RetroWindow
              title="Pusat Impor & Ekspor Bank Soal"
              badge="Standar Mutu"
              headerBadgeVariant="warning"
              headerClassName="bg-gray-soft"
              bodyClassName="p-6 bg-white space-y-6"
            >
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-bold text-xl text-black">Impor Soal Massal</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Mendukung berkas Excel (.xlsx), Word (.docx), Moodle XML (.xml), dan IMS QTI 2.1 (.zip)
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-md hover:bg-neutral-100 text-black border border-black"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {message && (
                <div
                  className={`p-3.5 rounded-lg border-2 text-xs font-bold ${
                    message.type === 'sukses'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                      : 'border-red-600 bg-red-50 text-red-900'
                  }`}
                >
                  {message.text}
                </div>
              )}

              {/* TAHAP 1: UNGGAH */}
              {activeStep === 'upload' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Kotak Unduh Template */}
                    <div className="p-5 rounded-xl border-2 border-dashed border-black bg-neutral-50 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center gap-2 text-black font-bold mb-1">
                          <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                          <span>Format Excel Baku</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Gunakan template resmi SIAJAR dengan dropdown pilihan tipe soal dan tingkat kesulitan untuk menghindari kesalahan format.
                        </p>
                      </div>
                      <button
                        onClick={handleDownloadTemplate}
                        disabled={isPending}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-black bg-white text-black font-bold text-xs shadow-retro hover:bg-neutral-100 transition-all"
                      >
                        <Download className="h-4 w-4" />
                        <span>Unduh Template Excel</span>
                      </button>
                    </div>

                    {/* Area Unggah Berkas */}
                    <div className="p-5 rounded-xl border-2 border-dashed border-black bg-primary/5 flex flex-col items-center justify-center text-center space-y-3">
                      <UploadCloud className="h-8 w-8 text-primary" />
                      <div>
                        <span className="font-bold text-sm text-black block">Pilih Berkas Soal</span>
                        <span className="text-xs text-muted-foreground">Maksimal 10 MB atau 500 butir soal</span>
                      </div>
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-black bg-primary text-white font-bold text-xs shadow-retro hover:bg-emerald-700 transition-all">
                        <span>Pilih Berkas Komputer</span>
                        <input
                          type="file"
                          accept=".xlsx,.xls,.docx,.xml,.zip"
                          onChange={handleFileUpload}
                          disabled={isPending}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="rounded-lg border border-black/20 bg-neutral-50 p-4 text-xs space-y-2">
                    <span className="font-bold text-black block">Aturan Pola Dokumen:</span>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                      <li><strong>Excel:</strong> Isi kolom tipe, pertanyaan, opsi_a sampai opsi_e, kunci, dan bobot.</li>
                      <li><strong>Word (.docx):</strong> Awali nomor soal (1.), baris pilihan (a. sampai e.), dan baris <code>Jawaban: B</code>.</li>
                      <li><strong>Moodle XML:</strong> Mendukung pilihan ganda, benar/salah, isian singkat, dan uraian.</li>
                      <li><strong>QTI 2.1:</strong> Berkas arsip .zip memuat <code>imsmanifest.xml</code> standar IMS Global.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* TAHAP 2: PRATINJAU */}
              {activeStep === 'preview' && parsedData && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg border-2 border-black bg-neutral-100">
                    <div className="flex items-center gap-4 text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-black">
                        <Layers className="h-4 w-4" />
                        Total: {parsedData.total}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Valid: {parsedData.validCount}
                      </span>
                      <span className="flex items-center gap-1 text-amber-700">
                        <AlertTriangle className="h-4 w-4" />
                        Peringatan: {parsedData.warningCount}
                      </span>
                      <span className="flex items-center gap-1 text-red-700">
                        <XCircle className="h-4 w-4" />
                        Galat: {parsedData.errorCount}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveStep('upload')}
                        className="px-3 py-1.5 text-xs font-bold border border-black rounded bg-white hover:bg-neutral-50"
                      >
                        Ganti Berkas
                      </button>
                    </div>
                  </div>

                  {/* Tabel Pratinjau Soal */}
                  <div className="border-2 border-black rounded-lg overflow-x-auto max-h-72">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-neutral-200 sticky top-0 border-b border-black font-bold">
                        <tr>
                          <th className="p-2 border-r border-black w-12 text-center">No</th>
                          <th className="p-2 border-r border-black w-24">Tipe</th>
                          <th className="p-2 border-r border-black">Pertanyaan</th>
                          <th className="p-2 border-r border-black w-24">Kunci</th>
                          <th className="p-2 border-r border-black w-16 text-center">Poin</th>
                          <th className="p-2 border-r border-black w-24 text-center">Status</th>
                          <th className="p-2">Catatan Validasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/20">
                        {parsedData.items.map((item, idx) => (
                          <tr
                            key={idx}
                            className={
                              item.status === 'galat'
                                ? 'bg-red-50/60'
                                : item.status === 'peringatan'
                                ? 'bg-amber-50/60'
                                : 'hover:bg-neutral-50'
                            }
                          >
                            <td className="p-2 border-r border-black/20 text-center font-bold">
                              {item.row_number}
                            </td>
                            <td className="p-2 border-r border-black/20 font-medium">
                              {item.tipe}
                            </td>
                            <td className="p-2 border-r border-black/20 max-w-xs truncate" title={item.pertanyaan}>
                              {item.pertanyaan}
                            </td>
                            <td className="p-2 border-r border-black/20 font-bold">
                              {item.kunci || '-'}
                            </td>
                            <td className="p-2 border-r border-black/20 text-center">
                              {item.bobot}
                            </td>
                            <td className="p-2 border-r border-black/20 text-center">
                              {item.status === 'valid' && (
                                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                                  Valid
                                </span>
                              )}
                              {item.status === 'peringatan' && (
                                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                                  Peringatan
                                </span>
                              )}
                              {item.status === 'galat' && (
                                <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold">
                                  Galat
                                </span>
                              )}
                            </td>
                            <td className="p-2 text-xs text-muted-foreground">
                              {item.issues.length > 0 ? item.issues.join('; ') : 'Siap diimpor'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Tombol Aksi Impor */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t">
                    <span className="text-xs text-muted-foreground">
                      Pilih metode penanganan jika terdapat soal berstatus galat.
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleConfirmImport('skip_errors')}
                        disabled={isPending || parsedData.validCount + parsedData.warningCount === 0}
                        className="px-4 py-2 rounded-lg border-2 border-black bg-primary text-white font-bold text-xs shadow-retro hover:bg-emerald-700 transition-all disabled:opacity-50"
                      >
                        Impor yang Valid & Lewati Galat
                      </button>

                      <button
                        onClick={() => handleConfirmImport('cancel_on_error')}
                        disabled={isPending || parsedData.errorCount > 0}
                        className="px-4 py-2 rounded-lg border-2 border-black bg-ink text-white font-bold text-xs shadow-retro hover:bg-neutral-800 transition-all disabled:opacity-50"
                      >
                        Impor Semua (Batal Jika Ada Galat)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAHAP 3: RINGKASAN */}
              {activeStep === 'summary' && importSummary && (
                <div className="p-6 rounded-xl border-2 border-black bg-neutral-50 text-center space-y-4">
                  <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-xl text-black">Impor Soal Selesai</h4>
                    <p className="text-xs text-muted-foreground">
                      {importSummary.imported} butir soal berhasil ditambahkan ke Bank Soal.
                      {importSummary.skipped > 0 && ` ${importSummary.skipped} butir dilewati.`}
                    </p>
                  </div>

                  <div className="pt-3">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="px-5 py-2.5 rounded-lg border-2 border-black bg-primary text-white font-bold text-xs shadow-retro hover:bg-emerald-700 transition-all"
                    >
                      Tutup dan Segarkan Halaman
                    </button>
                  </div>
                </div>
              )}
            </RetroWindow>
          </div>
        </div>
      )}
    </>
  );
}
