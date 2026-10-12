"use client";

import React, { useRef, useState, DragEvent, ChangeEvent } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, X, RefreshCw } from "lucide-react";
import { KONFIGURASI_STORAGE, validasiBerkasServer } from "@/lib/akademik/konfigurasi-storage";

export interface FileDropzoneProps {
  kategori: "materi" | "tugas";
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  disabled?: boolean;
  error?: string | null;
  className?: string;
}

export function FileDropzone({
  kategori,
  onFileSelect,
  selectedFile,
  disabled = false,
  error = null,
  className = "",
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const config = KONFIGURASI_STORAGE[kategori];
  const maxMb = config.maxUkuranMb;
  const allowedExts = config.ekstensiDiizinkan.join(", ");

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleProcessFile = (file: File) => {
    setInternalError(null);
    const validasi = validasiBerkasServer(
      { name: file.name, size: file.size, type: file.type },
      kategori
    );

    if (!validasi.valid) {
      setInternalError(validasi.pesanError || "Berkas tidak valid.");
      onFileSelect(null);
      return;
    }

    onFileSelect(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setInternalError(null);
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const displayError = error || internalError;

  return (
    <div className={`space-y-2 select-none ${className}`}>
      <input
        ref={inputRef}
        type="file"
        disabled={disabled}
        onChange={handleFileInputChange}
        className="hidden"
        accept={config.ekstensiDiizinkan.map((ext) => `.${ext}`).join(",")}
      />

      {/* Area Dropzone / Berkas Terpilih */}
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`border-2 border-dashed rounded p-4 sm:p-5 transition-all text-center flex flex-col items-center justify-center gap-2.5 cursor-pointer ${
            isDragging
              ? "border-black bg-retro-yellow/40 shadow-retro-sm"
              : "border-black/50 bg-white hover:border-black hover:bg-retro-warm/30"
          } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded border-2 border-black bg-retro-warm flex items-center justify-center shadow-retro-sm shrink-0">
            <Upload className="h-5 w-5 text-black" />
          </div>

          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-bold text-black">
              Tarik dan lepas berkas di sini, atau klik tombol di bawah
            </p>
            <p className="text-2xs sm:text-xs text-black/70 font-mono">
              Batas ukuran maksimal: <span className="font-bold">{maxMb} MB</span> • Format:{" "}
              <span className="font-bold uppercase">{allowedExts}</span>
            </p>
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            className="h-10 sm:h-11 min-h-[44px] px-4 py-2 rounded border-2 border-black bg-retro-yellow hover:bg-black hover:text-white text-black font-heading font-black text-xs sm:text-sm shadow-retro-sm active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer mt-1"
          >
            <Upload className="h-4 w-4 shrink-0" />
            <span>Pilih Berkas dari Perangkat</span>
          </button>
        </div>
      ) : (
        <div className="rounded border-2 border-black bg-retro-warm p-3 sm:p-4 shadow-retro-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded border-2 border-black bg-retro-green flex items-center justify-center shadow-retro-sm shrink-0">
              <FileText className="h-5 w-5 text-black" />
            </div>

            <div className="overflow-hidden min-w-0">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-retro-green shrink-0 fill-black" />
                <p className="font-bold text-xs sm:text-sm text-black truncate max-w-full">
                  {selectedFile.name}
                </p>
              </div>
              <p className="text-2xs sm:text-xs text-black/70 font-mono mt-0.5">
                Ukuran: <span className="font-bold">{formatFileSize(selectedFile.size)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 justify-end">
            <button
              type="button"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="h-9 sm:h-10 min-h-[40px] px-3 py-1.5 rounded border-2 border-black bg-white hover:bg-retro-yellow text-black font-heading font-black text-xs shadow-retro-sm active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Ganti berkas dengan yang lain"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Ganti</span>
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={handleRemoveFile}
              className="h-9 sm:h-10 min-h-[40px] px-3 py-1.5 rounded border-2 border-black bg-white hover:bg-danger hover:text-white text-danger font-heading font-black text-xs shadow-retro-sm active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Batalkan berkas ini"
            >
              <X className="h-3.5 w-3.5" />
              <span>Batal</span>
            </button>
          </div>
        </div>
      )}

      {/* Notifikasi Galat Validasi Berkas */}
      {displayError && (
        <div className="rounded border-2 border-black bg-retro-warm text-danger p-2 sm:p-2.5 text-xs font-bold flex items-center gap-2 shadow-retro-sm animate-in fade-in-50">
          <AlertCircle className="h-4 w-4 shrink-0 text-danger" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
}
