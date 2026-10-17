"use client";

import React, { useState } from "react";
import {
  CalendarDays,
  Plus,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Layers,
  Lock,
  Unlock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AdministrasiStore,
  JenisKegiatanKalender,
} from "@/features/administrasi/administrasi-store";
import { tambahKalenderAction } from "@/features/administrasi/actions";
import { isPeriodeAktif } from "@/lib/akademik/administrasi";

export default function AdminKalenderPage() {
  const daftarKalender = AdministrasiStore.getSemuaKalender();
  const krsStatus = AdministrasiStore.isKrsBuka();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jenis, setJenis] = useState<JenisKegiatanKalender>("KRS");
  const [keterangan, setKeterangan] = useState("");
  const [mulai, setMulai] = useState("2026-09-01");
  const [selesai, setSelesai] = useState("2026-09-30");

  const [pesanNotif, setPesanNotif] = useState<{ teks: string; tipe: "sukses" | "galat" } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTambah = async () => {
    if (!keterangan.trim()) {
      setPesanNotif({ teks: "Keterangan agenda kegiatan wajib diisi.", tipe: "galat" });
      return;
    }

    setIsLoading(true);
    setPesanNotif(null);

    const res = await tambahKalenderAction({
      jenis,
      keterangan: keterangan.trim(),
      mulai,
      selesai,
    });

    setIsLoading(false);
    if (res.success) {
      setIsModalOpen(false);
      setKeterangan("");
      setPesanNotif({ teks: res.message, tipe: "sukses" });
    } else {
      setPesanNotif({ teks: res.message, tipe: "galat" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Kalender Akademik & Kontrol Periode
          </h1>
          <p className="text-sm text-muted-foreground">
            Pengaturan jadwal tahapan akademik (pembayaran UKT, periode KRS online, UTS, UAS, dan libur perkuliahan).
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="gap-1.5 text-xs">
          <Plus className="h-4 w-4" />
          Tambah Agenda Kalender
        </Button>
      </div>

      {/* Pesan Notifikasi */}
      {pesanNotif && (
        <div
          className={`flex items-center gap-2 rounded-[8px] p-3 text-sm font-medium ${
            pesanNotif.tipe === "sukses"
              ? "bg-surface text-ink border border-ink"
              : "bg-primary/10 text-primary-dark border border-ink"
          }`}
        >
          {pesanNotif.tipe === "sukses" ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          <span>{pesanNotif.teks}</span>
        </div>
      )}

      {/* Banner Kontrol Sistem: Status Pembukaan KRS Realtime */}
      <Card>
        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-[8px] ${
                krsStatus.buka
                  ? "bg-surface text-ink"
                  : "bg-primary/10 text-primary-dark"
              }`}
            >
              {krsStatus.buka ? (
                <Unlock className="h-6 w-6" />
              ) : (
                <Lock className="h-6 w-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-foreground">
                  Status Pengisian KRS Online:
                </span>
                <Badge variant={krsStatus.buka ? "success" : "danger"}>
                  {krsStatus.buka ? "SEDANG DIBUKA" : "TERKUNCI / DITUTUP"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {krsStatus.periode
                  ? `Periode berlaku: ${krsStatus.periode.mulai} s.d. ${krsStatus.periode.selesai} (${krsStatus.periode.keterangan})`
                  : "Belum ada agenda pembatasan periode KRS."}
              </p>
            </div>
          </div>

          <span className="text-xs text-muted-foreground italic">
            *Periode kalender mengendalikan akses pengajuan rencana studi bagi seluruh mahasiswa.
          </span>
        </CardContent>
      </Card>

      {/* Tabel Kalender Akademik */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            Agenda Kalender Akademik Semester Ganjil 2026/2027
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="w-12 text-center">No</TableHead>
                  <TableHead className="w-28 text-center">Kategori</TableHead>
                  <TableHead>Keterangan Kegiatan</TableHead>
                  <TableHead className="w-32 text-center">Tanggal Mulai</TableHead>
                  <TableHead className="w-32 text-center">Tanggal Selesai</TableHead>
                  <TableHead className="w-32 text-center">Status Saat Ini</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {daftarKalender.map((item, idx) => {
                  const isActive = isPeriodeAktif(item.mulai, item.selesai);
                  return (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="text-center font-medium text-xs text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            item.jenis === "KRS"
                              ? "default"
                              : item.jenis === "UTS" || item.jenis === "UAS"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-xs"
                        >
                          {item.jenis}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-foreground">
                        {item.keterangan}
                      </TableCell>
                      <TableCell className="text-center text-xs font-sans text-muted-foreground">
                        {item.mulai}
                      </TableCell>
                      <TableCell className="text-center text-xs font-sans text-muted-foreground">
                        {item.selesai}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={isActive ? "success" : "outline"} className="text-xs">
                          {isActive ? "Sedang Berlangsung" : "Tidak Aktif"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL TAMBAH AGENDA */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Tambah Agenda Kalender Akademik
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Kategori Kegiatan:
              </label>
              <select
                value={jenis}
                onChange={(e) => setJenis(e.target.value as JenisKegiatanKalender)}
                className="w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="KRS">Pengisian & Revisi KRS Online</option>
                <option value="BAYAR_UKT">Pembayaran UKT Semester</option>
                <option value="UTS">Ujian Tengah Semester (UTS)</option>
                <option value="UAS">Ujian Akhir Semester (UAS)</option>
                <option value="LIBUR">Libur Akademik Perkuliahan</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Keterangan Kegiatan:
              </label>
              <Input
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Misal: Masa Pengisian KRS Semester Ganjil 2026/2027"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Tanggal Mulai:
                </label>
                <Input
                  type="date"
                  value={mulai}
                  onChange={(e) => setMulai(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Tanggal Selesai:
                </label>
                <Input
                  type="date"
                  value={selesai}
                  onChange={(e) => setSelesai(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="default"
              onClick={handleTambah}
              disabled={isLoading || !keterangan.trim()}
              className="text-xs"
            >
              Simpan Agenda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
