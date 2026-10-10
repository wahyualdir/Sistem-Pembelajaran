"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Download,
  FileText,
  Award,
  BookOpen,
  CheckCircle,
  Calendar,
  Layers,
  Calculator,
} from "lucide-react";
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
import { NilaiStore } from "@/features/nilai/nilai-store";
import { IpsTrendChart } from "@/components/mahasiswa/ips-trend-chart";
import { ProgresKelulusanCard } from "@/components/mahasiswa/progres-kelulusan-card";
import { hitungProgresKelulusan } from "@/lib/akademik/progres-kelulusan";

export default function MahasiswaNilaiPage() {
  // Mahasiswa default Wahyu Aldi (mhs-1)
  const mahasiswaId = "mhs-1";

  const pilihanSemester = NilaiStore.getPilihanSemesterMahasiswa(mahasiswaId);
  const [selectedSemester, setSelectedSemester] = useState<string>(
    pilihanSemester[pilihanSemester.length - 1] || "2025/2026 Ganjil"
  );

  const [activeTab, setActiveTab] = useState<"khs" | "transkrip">("khs");

  const khsData = NilaiStore.getKhsMahasiswa(mahasiswaId, selectedSemester);
  const transkripData = NilaiStore.getTranskripMahasiswa(mahasiswaId);
  const riwayatIps = NilaiStore.getRiwayatIpsMahasiswa(mahasiswaId);

  // Hitung progres kelulusan S1
  const daftarMataKuliahProgres = transkripData.daftarMataKuliah.map((mk) => ({
    kodeMataKuliah: mk.kodeMataKuliah,
    namaMataKuliah: mk.namaMataKuliah,
    sks: mk.sks,
    jenis: (mk.kodeMataKuliah === "TIF401" || mk.kodeMataKuliah === "TIF402" || mk.kodeMataKuliah === "TIF405" ? "PILIHAN" : "WAJIB") as "WAJIB" | "PILIHAN",
    lulus: mk.bobot >= 1.0,
  }));
  const progresData = hitungProgresKelulusan(daftarMataKuliahProgres, 21);

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight font-heading">
            Hasil Studi & Transkrip Akademik
          </h1>
          <p className="text-sm text-muted-foreground">
            Pantau perolehan nilai semester (KHS), perkembangan Indeks Prestasi (IPS/IPK), dan unduh dokumen resmi.
          </p>
        </div>

        {/* Action Controls & Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/mahasiswa/simulasi-ipk"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[6px] border border-border bg-surface text-foreground hover:bg-primary-soft hover:border-primary hover:text-primary transition-colors shadow-sm"
          >
            <Calculator className="h-3.5 w-3.5 text-primary" />
            Simulasi IPK
          </Link>

          <div className="flex items-center gap-1 bg-muted p-1 rounded-[8px] border border-border w-fit">
            <button
              onClick={() => setActiveTab("khs")}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-colors ${
                activeTab === "khs"
                  ? "bg-surface text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Kartu Hasil Studi (KHS)
            </button>
            <button
              onClick={() => setActiveTab("transkrip")}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-colors ${
                activeTab === "transkrip"
                  ? "bg-surface text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              Transkrip Kumulatif
            </button>
          </div>
        </div>
      </div>

      {/* Ringkasan Statistik Akademik */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Indeks Prestasi Kumulatif</p>
              <p className="text-2xl font-bold text-primary mt-1">
                {transkripData.ipk.toFixed(2)}
              </p>
              <span className="text-[10px] text-success font-medium">Predikat Sangat Memuaskan</span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-primary-tint text-primary">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total SKS Lulus</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {transkripData.totalSksLulus} <span className="text-xs font-normal text-muted-foreground">SKS</span>
              </p>
              <span className="text-[10px] text-muted-foreground">Dari {transkripData.totalSksDitempuh} SKS ditempuh</span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-success-soft text-success">
              <CheckCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">IPS Semester Dipilih</p>
              <p className="text-2xl font-bold text-primary mt-1">
                {khsData.ips.toFixed(2)}
              </p>
              <span className="text-[10px] text-muted-foreground">{khsData.totalSks} SKS diambil</span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-primary-tint text-primary">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Status Akademik</p>
              <p className="text-base font-bold text-success mt-1">AKTIF</p>
              <span className="text-[10px] text-muted-foreground">Dosen Wali: Dr. Ardiansyah</span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-success-soft text-success">
              <BookOpen className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visualisasi Progres Kelulusan S1 & Tren IPS Kumulatif */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <ProgresKelulusanCard progres={progresData} />
        </div>
        <div className="lg:col-span-5">
          <Card className="border border-border shadow-sm h-full flex flex-col justify-between p-5">
            <IpsTrendChart data={riwayatIps} />
            <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground mt-3">
              <span>Beban SKS Rata-rata:</span>
              <strong className="text-foreground">~22 SKS / Semester</strong>
            </div>
          </Card>
        </div>
      </div>

      {/* TAB 1: KARTU HASIL STUDI (KHS) */}
      {activeTab === "khs" && (
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div>
                <CardTitle className="text-base font-semibold">
                  Kartu Hasil Studi (KHS)
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Laporan hasil studi per semester dengan rincian nilai mutu.
                </p>
              </div>

              {/* Selector Semester */}
              <div className="flex items-center gap-1.5 ml-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="rounded-[8px] border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  {pilihanSemester.map((sem) => (
                    <option key={sem} value={sem}>
                      {sem}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tombol Cetak PDF KHS */}
            <a
              href={`/api/pdf/khs?mhsId=${mahasiswaId}&semester=${encodeURIComponent(selectedSemester)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" className="gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" />
                Cetak KHS (PDF)
              </Button>
            </a>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="w-12 text-center">No</TableHead>
                    <TableHead className="w-32">Kode MK</TableHead>
                    <TableHead>Mata Kuliah</TableHead>
                    <TableHead className="w-20 text-center">SKS</TableHead>
                    <TableHead className="w-24 text-center">Nilai Angka</TableHead>
                    <TableHead className="w-24 text-center">Nilai Huruf</TableHead>
                    <TableHead className="w-24 text-center">Bobot Mutu</TableHead>
                    <TableHead className="w-28 text-center">Nilai Mutu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {khsData.daftarNilai.map((item, idx) => (
                    <TableRow key={item.kodeMataKuliah} className="hover:bg-muted/50">
                      <TableCell className="text-center font-medium text-xs text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-foreground">
                        {item.kodeMataKuliah}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-foreground">
                        {item.namaMataKuliah}
                      </TableCell>
                      <TableCell className="text-center text-xs font-semibold">
                        {item.sks}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs text-muted-foreground">
                        {item.nilaiAngka}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            item.nilaiHuruf === "A" || item.nilaiHuruf === "A-"
                              ? "success"
                              : item.nilaiHuruf === "E"
                              ? "danger"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {item.nilaiHuruf}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-xs font-medium text-muted-foreground">
                        {item.bobot.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center font-bold text-xs text-primary">
                        {item.nilaiMutu.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Baris Ringkasan Semester */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-4 bg-muted border-t border-border">
              <div className="text-xs text-muted-foreground">
                Jumlah Mata Kuliah: <strong>{khsData.daftarNilai.length}</strong>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Total SKS Semester: </span>
                  <span className="font-bold text-foreground">{khsData.totalSks} SKS</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Indeks Prestasi Semester (IPS): </span>
                  <span className="font-bold text-primary text-base">{khsData.ips.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: TRANSKRIP AKADEMIK KUMULATIF */}
      {activeTab === "transkrip" && (
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
            <div>
              <CardTitle className="text-base font-semibold">
                Transkrip Prestasi Akademik Sementara
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Daftar nilai kumulatif seluruh semester. Mata kuliah yang diulang menggunakan nilai mutu tertinggi.
              </p>
            </div>

            {/* Tombol Cetak PDF Transkrip */}
            <a
              href={`/api/pdf/transkrip?mhsId=${mahasiswaId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" className="gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" />
                Cetak Transkrip Resmi (PDF)
              </Button>
            </a>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="w-12 text-center">No</TableHead>
                    <TableHead className="w-16 text-center">Sem</TableHead>
                    <TableHead className="w-28">Kode MK</TableHead>
                    <TableHead>Nama Mata Kuliah</TableHead>
                    <TableHead className="w-20 text-center">SKS</TableHead>
                    <TableHead className="w-24 text-center">Nilai</TableHead>
                    <TableHead className="w-24 text-center">Bobot Mutu</TableHead>
                    <TableHead className="w-40 text-center">Status Mata Kuliah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transkripData.daftarMataKuliah.map((item, idx) => (
                    <TableRow key={item.kodeMataKuliah} className="hover:bg-muted/50">
                      <TableCell className="text-center font-medium text-xs text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="text-center font-medium text-xs text-muted-foreground">
                        {item.semesterPaket ?? "-"}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-foreground">
                        {item.kodeMataKuliah}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-foreground">
                        {item.namaMataKuliah}
                      </TableCell>
                      <TableCell className="text-center text-xs font-semibold">
                        {item.sks}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            item.huruf === "A" || item.huruf === "A-"
                              ? "success"
                              : item.huruf === "E"
                              ? "danger"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {item.huruf}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-xs font-bold text-primary">
                        {(item.bobot * item.sks).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.diulang ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary-tint px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                            Diulang (Nilai Terbaik)
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">Reguler</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Baris Ringkasan Kumulatif */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-4 bg-primary-soft/50 border-t border-border">
              <div className="text-xs text-muted-foreground">
                Total Mata Kuliah Tertera: <strong>{transkripData.daftarMataKuliah.length}</strong>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Total SKS Ditempuh: </span>
                  <span className="font-bold text-foreground">{transkripData.totalSksDitempuh} SKS</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Total SKS Lulus: </span>
                  <span className="font-bold text-success">{transkripData.totalSksLulus} SKS</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">IPK Kumulatif: </span>
                  <span className="font-bold text-primary text-base">{transkripData.ipk.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
