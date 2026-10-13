"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { parseMahasiswaCsv, parseDosenCsv, CsvPreviewResult } from "../csv-importer";
import { confirmImportMahasiswaAction, confirmImportDosenAction } from "../actions";
import { Upload, CheckCircle2, AlertTriangle } from "lucide-react";

interface CsvImportModalProps {
  type: "MAHASISWA" | "DOSEN";
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CsvImportModal({ type, isOpen, onClose, onSuccess }: CsvImportModalProps) {
  const [step, setStep] = useState<"UPLOAD" | "PREVIEW">("UPLOAD");
  const [loading, setLoading] = useState(false);
  const [previewDataMhs, setPreviewDataMhs] = useState<CsvPreviewResult<{
    nim: string;
    nama: string;
    email: string;
    angkatan: number;
    prodiId: string;
  }> | null>(null);

  const [previewDataDsn, setPreviewDataDsn] = useState<CsvPreviewResult<{
    nidn: string;
    nama: string;
    email: string;
  }> | null>(null);

  const [feedback, setFeedback] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (type === "MAHASISWA") {
        const res = parseMahasiswaCsv(content);
        setPreviewDataMhs(res);
      } else {
        const res = parseDosenCsv(content);
        setPreviewDataDsn(res);
      }
      setStep("PREVIEW");
    };
    reader.readAsText(file);
  };

  const handleConfirm = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      if (type === "MAHASISWA" && previewDataMhs) {
        const res = await confirmImportMahasiswaAction(previewDataMhs.validRows);
        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setFeedback(res.message);
        }
      } else if (type === "DOSEN" && previewDataDsn) {
        const res = await confirmImportDosenAction(previewDataDsn.validRows);
        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setFeedback(res.message);
        }
      }
    } catch {
      setFeedback("Gagal memproses impor ke basis data.");
    } finally {
      setLoading(false);
    }
  };

  const validCount =
    type === "MAHASISWA"
      ? previewDataMhs?.validRows.length || 0
      : previewDataDsn?.validRows.length || 0;

  const invalidRows =
    type === "MAHASISWA"
      ? previewDataMhs?.invalidRows || []
      : previewDataDsn?.invalidRows || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Impor Data {type === "MAHASISWA" ? "Mahasiswa" : "Dosen"} dari CSV
          </DialogTitle>
        </DialogHeader>

        {feedback && (
          <div className="rounded-[8px] bg-danger-soft border border-danger-border p-3 text-xs text-danger">
            {feedback}
          </div>
        )}

        {step === "UPLOAD" ? (
          <div className="space-y-4 py-4">
            <div className="rounded-[12px] border-2 border-dashed border-border p-8 text-center hover:bg-muted transition-colors">
              <Upload className="mx-auto h-10 w-10 text-primary mb-3" />
              <p className="text-sm font-semibold text-foreground mb-1">
                Pilih Berkas CSV untuk Diunggah
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                {type === "MAHASISWA"
                  ? "Format kolom: nim, nama, email, angkatan, prodiId"
                  : "Format kolom: nidn, nama, email"}
              </p>
              <label className="cursor-pointer">
                <Button variant="default" size="sm" type="button" className="pointer-events-none">
                  Telusuri Berkas CSV
                </Button>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Ringkasan Pratinjau Bab 6.10 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[8px] border border-success-border bg-success-soft p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-xs font-semibold text-success">
                    {validCount} Baris Valid
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Siap disimpan ke basis data secara aman
                </p>
              </div>

              <div className="rounded-[8px] border border-danger-border bg-danger-soft p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-danger" />
                  <span className="text-xs font-semibold text-danger">
                    {invalidRows.length} Baris Bermasalah
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ditolak karena format tidak sesuai atau data ganda
                </p>
              </div>
            </div>

            {/* Rincian baris bermasalah */}
            {invalidRows.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-foreground">
                  Laporan Baris Gagal & Alasan:
                </h4>
                <div className="max-h-48 overflow-y-auto rounded-[8px] border border-border p-2 space-y-2 bg-muted">
                  {invalidRows.map((inv, idx) => (
                    <div
                      key={idx}
                      className="text-xs rounded-[6px] bg-surface p-2 border border-border flex items-start justify-between gap-2"
                    >
                      <div>
                        <span className="font-semibold text-foreground">
                          Baris {inv.rowNumber}:
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {inv.data.nim || inv.data.nidn || "-"} - {inv.data.nama || "-"}
                        </span>
                      </div>
                      <Badge variant="danger" className="text-xs">
                        {inv.reason}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          {step === "PREVIEW" && (
            <Button
              variant="default"
              onClick={handleConfirm}
              disabled={validCount === 0 || loading}
            >
              {loading ? "Menyimpan..." : `Konfirmasi & Simpan (${validCount} Data)`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
