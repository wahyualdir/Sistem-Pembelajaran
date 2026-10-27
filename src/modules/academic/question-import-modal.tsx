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
  Layers,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import {
  getQuestionTemplateBase64Action,
  parseUploadedQuestionFileAction,
  confirmQuestionImportAction,
  exportQuestionBankAction,
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
        mode,
      });

      if (!res.ok || !res.data) {
        setMessage({ type: 'galat', text: res.pesan || 'Gagal menyimpan soal.' });
        return;
      }

      setImportSummary({
        imported: res.data.importedCount,
        skipped: res.data.skippedCount,
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
          type="button"
          onClick={() => {
            setIsOpen(true);
            setActiveStep('upload');
            setMessage(null);
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 border-black bg-white hover:bg-black hover:text-white text-black font-bold text-xs shadow-retro-sm transition-all cursor-pointer"
        >
          <UploadCloud className="h-4 w-4" />
          <span>Impor Soal Massal</span>
        </button>

        <button
          type="button"
          onClick={() => handleExport('moodle_xml')}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 border-black bg-white text-black font-bold text-xs shadow-retro-sm hover:bg-gray-soft transition-all cursor-pointer"
        >
          <Download className="h-4 w-4" />
          <span>Ekspor Moodle XML</span>
        </button>

        <button
          type="button"
          onClick={() => handleExport('qti')}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 border-black bg-white text-black font-bold text-xs shadow-retro-sm hover:bg-gray-soft transition-all cursor-pointer"
        >
          <FileArchive className="h-4 w-4" />
          <span>Ekspor QTI 2.1 (.zip)</span>
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="w-full max-w-4xl max-h-[90dvh] overflow-y-auto rounded-t-2xl sm:rounded-none">
            <RetroWindow
              title="Pusat Impor & Ekspor Bank Soal"
              badge="Standar Mutu"
              headerClassName="bg-gray-soft"
              bodyClassName="p-6 bg-white space-y-6"
            >
              <div className="flex items-center justify-between border-b-2 border-black/10 pb-4">
                <div>
                  <h3 className="font-heading font-black text-xl text-black">Impor Soal Massal</h3>
                  <p className="text-xs text-black/70 font-medium mt-0.5">
                    Mendukung berkas Excel (.xlsx), Word (.docx), Moodle XML (.xml), dan IMS QTI 2.1 (.zip)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center rounded-lg hover:bg-gray-soft text-black border border-black cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {message && (
                <div
                  className={`p-3.5 rounded-xl border-2 border-black text-xs font-bold shadow-retro-sm ${
                    message.type === 'sukses'
                      ? 'bg-white text-black'
                      : 'bg-gray-soft text-black'
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
                    <div className="p-5 rounded-2xl border-2 border-dashed border-black bg-white shadow-retro-sm flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center gap-2 text-black font-bold mb-1">
                          <FileSpreadsheet className="h-5 w-5 text-black" />
                          <span className="font-heading">Format Excel Baku</span>
                        </div>
                        <p className="text-xs text-black/75 font-medium leading-relaxed">
                          Gunakan template resmi SIAJAR dengan dropdown pilihan tipe soal dan tingkat kesulitan untuk menghindari kesalahan format.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        disabled={isPending}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-black bg-white hover:bg-gray-soft text-black font-bold text-xs shadow-retro-sm transition-all cursor-pointer"
                      >
                        <Download className="h-4 w-4" />
                        <span>Unduh Template Excel</span>
                      </button>
                    </div>

                    {/* Area Unggah Berkas */}
                    <div className="p-5 rounded-2xl border-2 border-dashed border-black bg-gray-soft/40 shadow-retro-sm flex flex-col items-center justify-center text-center space-y-3">
                      <UploadCloud className="h-8 w-8 text-black" />
                      <div>
                        <span className="font-heading font-black text-sm text-black block">Pilih Berkas Soal</span>
                        <span className="text-xs text-black/70 font-mono">Maksimal 10 MB atau 500 butir soal</span>
                      </div>
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-black bg-black text-white font-bold text-xs shadow-retro hover:bg-neutral-800 transition-all">
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

                  <div className="rounded-xl border-2 border-black bg-gray-soft/60 p-4 text-xs space-y-2 shadow-retro-sm">
                    <span className="font-mono font-bold text-black uppercase block">Aturan Pola Dokumen:</span>
                    <ul className="list-disc pl-5 space-y-1 text-black/80 font-medium">
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
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border-2 border-black bg-white shadow-retro-sm">
                    <div className="flex items-center gap-4 text-xs font-mono font-bold">
                      <span className="flex items-center gap-1.5 text-black">
                        <Layers className="h-4 w-4" />
                        Total: {parsedData.total}
                      </span>
                      <span className="flex items-center gap-1 text-black">
                        <CheckCircle2 className="h-4 w-4" />
                        Valid: {parsedData.validCount}
                      </span>
                      <span className="flex items-center gap-1 text-black/80">
                        <AlertTriangle className="h-4 w-4" />
                        Peringatan: {parsedData.warningCount}
                      </span>
                      <span className="flex items-center gap-1 text-black">
                        <XCircle className="h-4 w-4" />
                        Galat: {parsedData.errorCount}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveStep('upload')}
                        className="px-3 py-1.5 text-xs font-bold border-2 border-black rounded-xl bg-white hover:bg-gray-soft shadow-retro-sm cursor-pointer"
                      >
                        Ganti Berkas
                      </button>
                    </div>
                  </div>

                  {/* Tabel Pratinjau Soal */}
                  <div className="border-2 border-black rounded-2xl overflow-x-auto max-h-72 shadow-retro">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-neutral-100 sticky top-0 border-b-2 border-black font-mono font-bold uppercase text-black">
                        <tr>
                          <th className="p-2.5 border-r-2 border-black w-12 text-center">No</th>
                          <th className="p-2.5 border-r-2 border-black w-24">Tipe</th>
                          <th className="p-2.5 border-r-2 border-black">Pertanyaan</th>
                          <th className="p-2.5 border-r-2 border-black w-24">Kunci</th>
                          <th className="p-2.5 border-r-2 border-black w-16 text-center">Poin</th>
                          <th className="p-2.5 border-r-2 border-black w-24 text-center">Status</th>
                          <th className="p-2.5">Catatan Validasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-black/10">
                        {parsedData.items.map((item, idx) => (
                          <tr
                            key={idx}
                            className={
                              item.status === 'galat'
                                ? 'bg-gray-soft/80'
                                : item.status === 'peringatan'
                                ? 'bg-gray-soft/40'
                                : 'hover:bg-gray-soft/20'
                            }
                          >
                            <td className="p-2.5 border-r-2 border-black/10 text-center font-bold font-mono">
                              {item.row_number}
                            </td>
                            <td className="p-2.5 border-r-2 border-black/10 font-medium">
                              {item.tipe}
                            </td>
                            <td className="p-2.5 border-r-2 border-black/10 max-w-xs truncate font-medium" title={item.pertanyaan}>
                              {item.pertanyaan}
                            </td>
                            <td className="p-2.5 border-r-2 border-black/10 font-bold font-mono">
                              {item.kunci || '-'}
                            </td>
                            <td className="p-2.5 border-r-2 border-black/10 text-center font-mono font-bold">
                              {item.bobot}
                            </td>
                            <td className="p-2.5 border-r-2 border-black/10 text-center">
                              {item.status === 'valid' && (
                                <span className="px-2 py-0.5 rounded border border-black bg-white text-black font-mono font-bold shadow-xs">
                                  Valid
                                </span>
                              )}
                              {item.status === 'peringatan' && (
                                <span className="px-2 py-0.5 rounded border border-black bg-gray-soft text-black font-mono font-bold">
                                  Peringatan
                                </span>
                              )}
                              {item.status === 'galat' && (
                                <span className="px-2 py-0.5 rounded border border-black bg-black text-white font-mono font-bold">
                                  Galat
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-xs text-black/75 font-medium">
                              {item.issues.length > 0 ? item.issues.join('; ') : 'Siap diimpor'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Tombol Aksi Impor */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t-2 border-black/10">
                    <span className="text-xs text-black/70 font-medium">
                      Pilih metode penanganan jika terdapat soal berstatus galat.
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleConfirmImport('skip_errors')}
                        disabled={isPending || parsedData.validCount + parsedData.warningCount === 0}
                        className="px-4 py-2 rounded-xl border-2 border-black bg-white hover:bg-black hover:text-white text-black font-bold text-xs shadow-retro-sm transition-all disabled:opacity-50 cursor-pointer"
                      >
                        Impor yang Valid & Lewati Galat
                      </button>

                      <button
                        type="button"
                        onClick={() => handleConfirmImport('cancel_on_error')}
                        disabled={isPending || parsedData.errorCount > 0}
                        className="px-4 py-2 rounded-xl border-2 border-black bg-black text-white font-bold text-xs shadow-retro hover:bg-neutral-800 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        Impor Semua (Batal Jika Ada Galat)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAHAP 3: RINGKASAN */}
              {activeStep === 'summary' && importSummary && (
                <div className="p-6 rounded-2xl border-2 border-black bg-white text-center space-y-4 shadow-retro">
                  <CheckCircle2 className="h-12 w-12 text-black mx-auto" />
                  <div className="space-y-1">
                    <h4 className="font-heading font-black text-xl text-black">Impor Soal Selesai</h4>
                    <p className="text-xs text-black/75 font-medium">
                      {importSummary.imported} butir soal berhasil ditambahkan ke Bank Soal.
                      {importSummary.skipped > 0 && ` ${importSummary.skipped} butir dilewati.`}
                    </p>
                  </div>

                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="px-5 py-2.5 rounded-xl border-2 border-black bg-black text-white font-bold text-xs shadow-retro hover:bg-neutral-800 transition-all cursor-pointer"
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
