import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Award,
  CheckCircle2,
  XCircle,
  Printer,
  ShieldCheck,
  Calendar,
  Building,
  GraduationCap,
  QrCode,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { verifyCertificateByCodeAction } from '@/modules/academic/badge-certificate-actions';

interface VerifyCertificatePageProps {
  params: Promise<{
    code: string;
  }>;
}

export default async function VerifyCertificatePage({ params }: VerifyCertificatePageProps) {
  const { code } = await params;
  const decodedCode = decodeURIComponent(code);
  const result = await verifyCertificateByCodeAction(decodedCode);

  return (
    <div className="min-h-[100dvh] bg-bg p-4 sm:p-8 flex flex-col items-center justify-center font-sans antialiased text-black">
      <div className="w-full max-w-2xl space-y-6">
        {/* Navigasi Kembali */}
        <div className="flex items-center justify-between">
          <Link
            href="/certificates"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-black hover:text-primary transition-colors underline"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Portal RuangKampus</span>
          </Link>
          <span className="text-xs font-bold text-black/60 font-sans">
            Sistem Verifikasi Ijazah & Sertifikat
          </span>
        </div>

        {result.isValid && result.certificate ? (
          <RetroWindow
            title="verifikasi_resmi_sertifikat.cer"
            badge="TERVALIDASI DIGITAL"
            headerClassName="bg-gray-soft"
            bodyClassName="p-6 sm:p-8 bg-surface space-y-6"
          >
            {/* Header Sertifikat */}
            <div className="text-center space-y-2 border-b-2 border-black pb-5">
              <div className="inline-flex p-3 rounded-xl border-2 border-black bg-surface text-ink shadow-xs mx-auto mb-2">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-ink" />
                <span className="font-heading font-bold text-sm tracking-wider uppercase text-ink">
                  Sertifikat Kelulusan Resmi & Sah
                </span>
              </div>
              <h1 className="font-heading font-bold text-xl sm:text-2xl text-black">
                {result.certificate.title}
              </h1>
              <p className="text-xs font-sans text-black/70">
                Pangkalan Data Sertifikasi Kompetensi & Kelulusan RuangKampus
              </p>
            </div>

            {/* Detail Pemilik & Kredensial */}
            <div className="rounded-xl border-2 border-black bg-white p-5 shadow-retro space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-black/60 block font-bold uppercase text-xs">Nama Mahasiswa:</span>
                  <span className="font-heading font-bold text-base text-black">{result.certificate.recipientName}</span>
                </div>
                <div>
                  <span className="text-black/60 block font-bold uppercase text-xs">Nomor Induk Mahasiswa (NIM):</span>
                  <span className="font-heading font-bold text-base text-black">{result.certificate.studentNim}</span>
                </div>
              </div>

              <div className="border-t border-black/10 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-black/60 block font-bold uppercase text-xs">Mata Kuliah / Kompetensi:</span>
                  <span className="font-bold text-black">{result.certificate.courseName}</span>
                </div>
                <div>
                  <span className="text-black/60 block font-bold uppercase text-xs">Predikat Capaian:</span>
                  <span className="font-bold text-primary">{result.certificate.grade}</span>
                </div>
              </div>

              <div className="border-t border-black/10 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-black/60 block font-bold uppercase text-xs">Beban Jam Pelajaran:</span>
                  <span className="font-bold text-black">{result.certificate.creditHours}</span>
                </div>
                <div>
                  <span className="text-black/60 block font-bold uppercase text-xs">Tanggal Penerbitan:</span>
                  <span className="font-bold text-black">{result.certificate.issueDate}</span>
                </div>
              </div>

              <div className="border-t border-black/10 pt-3">
                <span className="text-black/60 block font-bold uppercase text-xs">Instansi Penerbit:</span>
                <span className="font-bold text-black">{result.certificate.issuer}</span>
                <div className="text-xs text-black/70 mt-0.5">Penandatangan: {result.certificate.issuerRole}</div>
              </div>
            </div>

            {/* QR Code & Kode Kredensial */}
            <div className="rounded-xl border-2 border-black bg-gray-soft p-4 flex flex-col sm:flex-row items-center gap-4">
              {/* Retro SVG QR Code Simulation */}
              <div className="w-20 h-20 bg-white border-2 border-black p-1.5 flex items-center justify-center shrink-0 shadow-xs">
                <svg viewBox="0 0 100 100" className="w-full h-full text-black fill-current">
                  <rect x="5" y="5" width="25" height="25" fill="black" />
                  <rect x="10" y="10" width="15" height="15" fill="white" />
                  <rect x="14" y="14" width="7" height="7" fill="black" />

                  <rect x="70" y="5" width="25" height="25" fill="black" />
                  <rect x="75" y="10" width="15" height="15" fill="white" />
                  <rect x="79" y="14" width="7" height="7" fill="black" />

                  <rect x="5" y="70" width="25" height="25" fill="black" />
                  <rect x="10" y="75" width="15" height="15" fill="white" />
                  <rect x="14" y="79" width="7" height="7" fill="black" />

                  <rect x="40" y="10" width="15" height="8" fill="black" />
                  <rect x="45" y="25" width="10" height="10" fill="black" />
                  <rect x="15" y="45" width="20" height="10" fill="black" />
                  <rect x="45" y="45" width="15" height="15" fill="black" />
                  <rect x="70" y="45" width="20" height="10" fill="black" />
                  <rect x="40" y="70" width="15" height="12" fill="black" />
                  <rect x="65" y="75" width="25" height="15" fill="black" />
                </svg>
              </div>

              <div className="space-y-1 text-center sm:text-left flex-1 min-w-0">
                <span className="text-xs font-bold uppercase text-black/60 font-sans">
                  Nomor Seri Kredensial Unik:
                </span>
                <p className="font-sans font-bold text-base text-black tracking-wide">
                  {result.certificate.verificationCode}
                </p>
                <p className="text-xs text-black/60 truncate font-sans font-bold">
                  Hash SHA-256: {result.certificate.signatureHash}
                </p>
              </div>
            </div>

            {/* Tombol Cetak / PDF */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-black/70 font-sans">
                Dokumen ini merupakan arsip digital tersumpah yang diterbitkan resmi melalui portal RuangKampus.
              </span>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') window.print();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border-2 border-black bg-black text-white text-xs sm:text-sm font-bold shadow-retro hover:bg-neutral-800 transition-all cursor-pointer shrink-0"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak / Simpan PDF</span>
              </button>
            </div>
          </RetroWindow>
        ) : (
          <RetroWindow
            title="verifikasi_gagal.error"
            badge="TIDAK DITEMUKAN"
            headerClassName="bg-primary text-white"
            bodyClassName="p-6 sm:p-8 bg-surface space-y-5"
          >
            <div className="text-center space-y-3">
              <div className="p-3 rounded-xl border-2 border-black bg-primary text-white shadow-xs mx-auto w-fit">
                <XCircle className="h-8 w-8" />
              </div>
              <h2 className="font-heading font-bold text-xl text-black">
                Sertifikat Tidak Ditemukan
              </h2>
              <p className="text-xs sm:text-sm text-black/80 max-w-md mx-auto leading-relaxed">
                {result.error || `Sertifikat dengan kode "${decodedCode}" tidak tercatat di pangkalan data resmi.`}
              </p>
            </div>

            <div className="p-4 rounded-xl border-2 border-black bg-gray-soft space-y-3">
              <label className="text-xs font-bold uppercase text-black font-sans block">
                Cari Kode Sertifikat Lain:
              </label>
              <form
                action="/certificates"
                method="GET"
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  name="code"
                  placeholder="Contoh: CERT-2026-TI-0018"
                  className="flex-1 rounded-lg border-2 border-black p-2.5 text-xs font-bold uppercase font-sans bg-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-lg border-2 border-black bg-black text-white text-xs font-bold shadow-xs hover:bg-neutral-800 transition-all"
                >
                  Cek
                </button>
              </form>
            </div>
          </RetroWindow>
        )}
      </div>
    </div>
  );
}
