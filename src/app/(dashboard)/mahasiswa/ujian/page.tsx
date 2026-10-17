"use client";

import React, { useState } from "react";
import {
  Award,
  Download,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { UjianStore, JenisUjian } from "@/features/ujian/ujian-store";

export default function MahasiswaUjianPage() {
  const mahasiswaId = "mhs-1";

  const [activeJenis, setActiveJenis] = useState<JenisUjian>("UTS");
  const evaluasi = UjianStore.evaluasiKartuUjianMahasiswa(mahasiswaId);
  const daftarJadwal = UjianStore.getJadwalMahasiswa(mahasiswaId, activeJenis);

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Jadwal & Kartu Peserta Ujian
          </h1>
          <p className="text-sm text-muted-foreground">
            Informasi waktu, alokasi ruang ujian, dan verifikasi 3 syarat kelayakan penerbitan Kartu Ujian resmi.
          </p>
        </div>

        {/* Tab Switcher UTS / UAS */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-[8px] border border-border w-fit">
          <button
            onClick={() => setActiveJenis("UTS")}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-colors ${
              activeJenis === "UTS"
                ? "bg-surface text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            Ujian Tengah Semester (UTS)
          </button>
          <button
            onClick={() => setActiveJenis("UAS")}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-colors ${
              activeJenis === "UAS"
                ? "bg-surface text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            Ujian Akhir Semester (UAS)
          </button>
        </div>
      </div>

      {/* CARD STATUS 3 SYARAT KELAYAKAN KARTU UJIAN (Bab 6.6) */}
      <Card>
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Verifikasi 3 Syarat Kelayakan Penerbitan Kartu Ujian
            </span>
            <Badge variant={evaluasi.layak ? "success" : "danger"}>
              {evaluasi.layak ? "KARTU SIAP DITERBITKAN" : "SYARAT BELUM TERPENUHI"}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Syarat 1: KRS Disetujui */}
            <div
              className={`p-3 rounded-[8px] border text-xs ${
                evaluasi.krsTerpenuhi
                  ? "bg-surface/40 border-ink"
                  : "bg-surface/40 border-ink"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-foreground">1. Persetujuan KRS</span>
                {evaluasi.krsTerpenuhi ? (
                  <CheckCircle className="h-4 w-4 text-ink" />
                ) : (
                  <XCircle className="h-4 w-4 text-primary-dark" />
                )}
              </div>
              <p className="text-muted-foreground">
                Status: <strong>{evaluasi.krsStatus}</strong>
              </p>
              {!evaluasi.krsTerpenuhi && (
                <Link
                  href="/mahasiswa/krs"
                  className="text-primary hover:underline font-medium inline-flex items-center gap-1 mt-1"
                >
                  Ajukan KRS <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>

            {/* Syarat 2: Tagihan UKT Lunas / Dispensasi */}
            <div
              className={`p-3 rounded-[8px] border text-xs ${
                evaluasi.uktTerpenuhi
                  ? "bg-surface/40 border-ink"
                  : "bg-surface/40 border-ink"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-foreground">2. Tagihan UKT</span>
                {evaluasi.uktTerpenuhi ? (
                  <CheckCircle className="h-4 w-4 text-ink" />
                ) : (
                  <XCircle className="h-4 w-4 text-primary-dark" />
                )}
              </div>
              <p className="text-muted-foreground">
                Status: <strong>{evaluasi.uktStatus}</strong>
              </p>
              {!evaluasi.uktTerpenuhi && (
                <Link
                  href="/mahasiswa/ukt"
                  className="text-primary hover:underline font-medium inline-flex items-center gap-1 mt-1"
                >
                  Cek Tagihan <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>

            {/* Syarat 3: Kehadiran Presensi >= 75% */}
            <div
              className={`p-3 rounded-[8px] border text-xs ${
                evaluasi.kehadiranTerpenuhi
                  ? "bg-surface/40 border-ink"
                  : "bg-surface/40 border-ink"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-foreground">3. Kehadiran Presensi</span>
                {evaluasi.kehadiranTerpenuhi ? (
                  <CheckCircle className="h-4 w-4 text-ink" />
                ) : (
                  <XCircle className="h-4 w-4 text-primary-dark" />
                )}
              </div>
              <p className="text-muted-foreground">
                Rata-rata: <strong>{evaluasi.persentaseKehadiran}%</strong> (Min. {evaluasi.batasMinimalKehadiran}%)
              </p>
              {!evaluasi.kehadiranTerpenuhi && (
                <Link
                  href="/mahasiswa/presensi"
                  className="text-primary hover:underline font-medium inline-flex items-center gap-1 mt-1"
                >
                  Lihat Presensi <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>

          {/* Banner Aksi */}
          {evaluasi.layak ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-[8px] bg-surface border border-ink text-xs gap-3">
              <div className="flex items-center gap-2 text-ink font-medium">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>
                  Selamat! Seluruh persyaratan akademik terpenuhi. Kartu Ujian resmi Anda telah diterbitkan.
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`/api/pdf/kartu-ujian?mhsId=${mahasiswaId}&jenis=${activeJenis}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="sm" className="gap-1.5 text-xs bg-gray-dark hover:bg-gray-dark/90">
                    <Download className="h-3.5 w-3.5" />
                    Unduh Kartu {activeJenis} (PDF)
                  </Button>
                </a>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-[8px] bg-surface border border-ink text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-primary-dark">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Kartu Ujian Belum Dapat Diterbitkan</span>
              </div>
              <ul className="list-disc list-inside text-muted-foreground space-y-0.5 pl-1">
                {evaluasi.alasanTidakLayak.map((alasan, i) => (
                  <li key={i}>{alasan}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabel Jadwal Ujian Mahasiswa */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Jadwal Mata Ujian {activeJenis} Terdaftar ({daftarJadwal.length})
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="w-12 text-center">No</TableHead>
                  <TableHead className="w-28">Kode MK</TableHead>
                  <TableHead>Mata Kuliah</TableHead>
                  <TableHead className="w-20 text-center">Kelas</TableHead>
                  <TableHead className="w-16 text-center">SKS</TableHead>
                  <TableHead className="w-32 text-center">Tanggal Ujian</TableHead>
                  <TableHead className="w-32 text-center">Waktu</TableHead>
                  <TableHead className="w-36">Ruang Ujian</TableHead>
                  <TableHead>Dosen Pengampu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {daftarJadwal.length > 0 ? (
                  daftarJadwal.map((item, idx) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="text-center font-medium text-xs text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-sans text-xs font-semibold text-foreground">
                        {item.kodeMataKuliah}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-foreground">
                        {item.namaMataKuliah}
                      </TableCell>
                      <TableCell className="text-center text-xs font-semibold">
                        {item.kodeKelas}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {item.sks}
                      </TableCell>
                      <TableCell className="text-center text-xs font-medium">
                        {item.tanggal}
                      </TableCell>
                      <TableCell className="text-center text-xs font-sans text-muted-foreground">
                        {item.jamMulai} - {item.jamSelesai}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-primary">
                        {item.namaRuang}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.dosenPengampu}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-xs text-muted-foreground">
                      Belum ada jadwal {activeJenis} untuk mata kuliah pada KRS Anda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
