"use client";

import React, { useState } from "react";
import {
  CheckSquare,
  Plus,
  Save,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Users,
  Clock,
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
import { JadwalStore } from "@/features/jadwal/jadwal-store";
import { PresensiStore, StatusKehadiran } from "@/features/presensi/presensi-store";
import { tambahPertemuanAction, simpanPresensiAction } from "@/features/presensi/actions";

export default function DosenPresensiPage() {
  const dosenId = "dsn-1";
  const daftarKelas = JadwalStore.getKelasByDosen(dosenId);

  const [selectedKelasId, setSelectedKelasId] = useState<string>(
    daftarKelas[0]?.id || "kls-tif101-a"
  );
  const kelas = JadwalStore.getKelasById(selectedKelasId);

  const daftarPertemuan = PresensiStore.getPertemuanByKelas(selectedKelasId);
  const [selectedPertemuanId, setSelectedPertemuanId] = useState<string>(
    daftarPertemuan[daftarPertemuan.length - 1]?.id || ""
  );

  const pertemuanAktif = daftarPertemuan.find((p) => p.id === selectedPertemuanId);
  const rawPesertaPresensi = pertemuanAktif
    ? PresensiStore.getPresensiByPertemuan(pertemuanAktif.id, selectedKelasId)
    : [];

  const [presensiState, setPresensiState] = useState<
    { mahasiswaId: string; nim: string; nama: string; status: StatusKehadiran; catatan?: string }[]
  >(rawPesertaPresensi);

  const [isTambahModalOpen, setIsTambahModalOpen] = useState(false);
  const [nomorBaru, setNomorBaru] = useState(daftarPertemuan.length + 1);
  const [tanggalBaru, setTanggalBaru] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [materiBaru, setMateriBaru] = useState("");

  const [pesanNotif, setPesanNotif] = useState<{ teks: string; tipe: "sukses" | "galat" } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync state saat pertemuan berubah
  const handleSelectPertemuan = (pId: string) => {
    setSelectedPertemuanId(pId);
    const records = PresensiStore.getPresensiByPertemuan(pId, selectedKelasId);
    setPresensiState(records);
    setPesanNotif(null);
  };

  const handleSelectKelas = (kId: string) => {
    setSelectedKelasId(kId);
    const pList = PresensiStore.getPertemuanByKelas(kId);
    const defaultP = pList[pList.length - 1]?.id || "";
    setSelectedPertemuanId(defaultP);
    if (defaultP) {
      setPresensiState(PresensiStore.getPresensiByPertemuan(defaultP, kId));
    } else {
      setPresensiState([]);
    }
    setNomorBaru(pList.length + 1);
    setPesanNotif(null);
  };

  // Ubah status satu mahasiswa
  const handleStatusChange = (mhsId: string, status: StatusKehadiran) => {
    setPresensiState((prev) =>
      prev.map((item) => (item.mahasiswaId === mhsId ? { ...item, status } : item))
    );
  };

  // Ubah catatan mahasiswa
  const handleCatatanChange = (mhsId: string, catatan: string) => {
    setPresensiState((prev) =>
      prev.map((item) => (item.mahasiswaId === mhsId ? { ...item, catatan } : item))
    );
  };

  // Tombol aksi cepat: tandai semua hadir (Bab 6.5)
  const handleTandaiSemuaHadir = () => {
    setPresensiState((prev) =>
      prev.map((item) => ({ ...item, status: "HADIR" as const }))
    );
  };

  // Simpan Presensi Pertemuan
  const handleSimpanPresensi = async () => {
    if (!pertemuanAktif) return;
    setIsLoading(true);
    setPesanNotif(null);

    const res = await simpanPresensiAction({
      pertemuanId: pertemuanAktif.id,
      records: presensiState,
    });

    setIsLoading(false);
    if (res.success) {
      setPesanNotif({ teks: res.message, tipe: "sukses" });
    } else {
      setPesanNotif({ teks: res.message, tipe: "galat" });
    }
  };

  // Buka Pertemuan Baru
  const handleTambahPertemuan = async () => {
    if (!materiBaru.trim()) {
      setPesanNotif({ teks: "Materi singkat pertemuan wajib diisi.", tipe: "galat" });
      return;
    }

    setIsLoading(true);
    setPesanNotif(null);

    const res = await tambahPertemuanAction({
      kelasId: selectedKelasId,
      nomor: nomorBaru,
      tanggal: tanggalBaru,
      materiSingkat: materiBaru.trim(),
    });

    setIsLoading(false);
    if (res.success) {
      setIsTambahModalOpen(false);
      setMateriBaru("");
      // Refresh list
      const updatedList = PresensiStore.getPertemuanByKelas(selectedKelasId);
      const newest = updatedList.find((p) => p.nomor === nomorBaru);
      if (newest) {
        setSelectedPertemuanId(newest.id);
        setPresensiState(PresensiStore.getPresensiByPertemuan(newest.id, selectedKelasId));
      }
      setPesanNotif({ teks: res.message, tipe: "sukses" });
    } else {
      setPesanNotif({ teks: res.message, tipe: "galat" });
    }
  };

  // Hitung counter kehadiran
  const countHadir = presensiState.filter((p) => p.status === "HADIR").length;
  const countIzin = presensiState.filter((p) => p.status === "IZIN").length;
  const countSakit = presensiState.filter((p) => p.status === "SAKIT").length;
  const countAlpa = presensiState.filter((p) => p.status === "ALPA").length;

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Presensi Perkuliahan
          </h1>
          <p className="text-sm text-muted-foreground">
            Buka pertemuan perkuliahan, catat status kehadiran mahasiswa, dan pantau pemenuhan syarat UAS (minimal 75%).
          </p>
        </div>

        {/* Pilihan Kelas */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Pilih Kelas:
          </label>
          <select
            value={selectedKelasId}
            onChange={(e) => handleSelectKelas(e.target.value)}
            className="rounded-[8px] border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {daftarKelas.map((k) => (
              <option key={k.id} value={k.id}>
                {k.kodeMataKuliah} - {k.namaMataKuliah} (Kelas {k.kode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pesan Notifikasi */}
      {pesanNotif && (
        <div
          className={`flex items-center gap-2 rounded-[8px] p-3 text-sm font-medium ${
            pesanNotif.tipe === "sukses"
              ? "bg-success-soft text-success border border-success-border"
              : "bg-danger/10 text-danger border border-danger/20"
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

      {/* Info Kelas & Navigasi Pertemuan */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
            <div>
              <span className="font-bold text-primary text-base">
                {kelas?.kodeMataKuliah}
              </span>
              <span className="mx-2 text-border">|</span>
              <span className="font-semibold text-foreground text-base">
                {kelas?.namaMataKuliah} (Kelas {kelas?.kode})
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Dosen: {kelas?.namaDosen} • {kelas?.sks} SKS • Jadwal: {kelas?.jadwal[0]?.hari},{" "}
                {kelas?.jadwal[0]?.jamMulai} - {kelas?.jadwal[0]?.jamSelesai}
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setNomorBaru(daftarPertemuan.length + 1);
                setIsTambahModalOpen(true);
              }}
              className="gap-1.5 text-xs"
            >
              <Plus className="h-4 w-4" />
              Buka Pertemuan Baru
            </Button>
          </div>

          {/* Daftar Tab Pertemuan */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">
              Pilih Pertemuan Kuliah (1 - 16):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {daftarPertemuan.map((ptm) => (
                <button
                  key={ptm.id}
                  onClick={() => handleSelectPertemuan(ptm.id)}
                  className={`flex flex-col items-center justify-center min-w-16 px-3 py-2 rounded-[8px] border text-xs transition-colors ${
                    selectedPertemuanId === ptm.id
                      ? "border-primary bg-primary text-white font-bold"
                      : "border-border bg-surface text-foreground hover:bg-muted"
                  }`}
                >
                  <span>Ke-{ptm.nomor}</span>
                  <span className={`text-[10px] ${selectedPertemuanId === ptm.id ? "text-white/80" : "text-muted-foreground"}`}>
                    {ptm.tanggal.substring(5)}
                  </span>
                </button>
              ))}
              {daftarPertemuan.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  Belum ada pertemuan dibuka. Tekan tombol &quot;Buka Pertemuan Baru&quot; di atas.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lembar Presensi Pertemuan Terpilih */}
      {pertemuanAktif && (
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">
                  Presensi Pertemuan Ke-{pertemuanAktif.nomor}
                </CardTitle>
                <Badge variant={pertemuanAktif.selesai ? "success" : "warning"}>
                  {pertemuanAktif.selesai ? "SUDAH TERCATAT" : "BELUM TERCATAT"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tanggal: <strong>{pertemuanAktif.tanggal}</strong> • Materi: <em>{pertemuanAktif.materiSingkat}</em>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTandaiSemuaHadir}
                className="gap-1.5 text-xs text-success hover:bg-success-soft"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Tandai Semua Hadir
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSimpanPresensi}
                disabled={isLoading}
                className="gap-1.5 text-xs"
              >
                <Save className="h-3.5 w-3.5" />
                Simpan Presensi
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Rekap Angka */}
            <div className="flex flex-wrap items-center gap-4 px-6 py-3 bg-muted border-b border-border text-xs">
              <span className="text-muted-foreground">Ringkasan Kehadiran:</span>
              <span className="font-semibold text-success">Hadir: {countHadir}</span>
              <span className="font-semibold text-primary">Izin: {countIzin}</span>
              <span className="font-semibold text-warning">Sakit: {countSakit}</span>
              <span className="font-semibold text-danger">Alpa: {countAlpa}</span>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="w-12 text-center">No</TableHead>
                    <TableHead className="w-32">NIM</TableHead>
                    <TableHead>Nama Mahasiswa</TableHead>
                    <TableHead className="w-64 text-center">Status Kehadiran</TableHead>
                    <TableHead>Keterangan / Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {presensiState.length > 0 ? (
                    presensiState.map((peserta, idx) => (
                      <TableRow key={peserta.mahasiswaId} className="hover:bg-muted/50">
                        <TableCell className="text-center font-medium text-xs text-muted-foreground">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-semibold text-foreground">
                          {peserta.nim}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-foreground">
                          {peserta.nama}
                        </TableCell>

                        {/* Status Buttons */}
                        <TableCell className="text-center p-2">
                          <div className="inline-flex rounded-[8px] border border-border p-1 bg-muted gap-1">
                            {(["HADIR", "IZIN", "SAKIT", "ALPA"] as StatusKehadiran[]).map(
                              (st) => {
                                const isCurrent = peserta.status === st;
                                const colorClass =
                                  st === "HADIR"
                                    ? isCurrent
                                      ? "bg-success text-white font-bold"
                                      : "text-muted-foreground hover:text-success"
                                    : st === "IZIN"
                                    ? isCurrent
                                      ? "bg-primary text-white font-bold"
                                      : "text-muted-foreground hover:text-primary"
                                    : st === "SAKIT"
                                    ? isCurrent
                                      ? "bg-warning text-white font-bold"
                                      : "text-muted-foreground hover:text-warning"
                                    : isCurrent
                                    ? "bg-danger text-white font-bold"
                                    : "text-muted-foreground hover:text-danger";

                                return (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => handleStatusChange(peserta.mahasiswaId, st)}
                                    className={`px-2.5 py-1 text-[11px] rounded-[6px] transition-colors ${colorClass}`}
                                  >
                                    {st}
                                  </button>
                                );
                              }
                            )}
                          </div>
                        </TableCell>

                        {/* Catatan */}
                        <TableCell className="p-2">
                          <Input
                            type="text"
                            value={peserta.catatan || ""}
                            onChange={(e) =>
                              handleCatatanChange(peserta.mahasiswaId, e.target.value)
                            }
                            placeholder="Catatan izin/keterangan..."
                            className="text-xs h-8"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                        Tidak ada mahasiswa terdaftar pada kelas ini.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MODAL BUKA PERTEMUAN BARU */}
      <Dialog open={isTambahModalOpen} onOpenChange={setIsTambahModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Buka Pertemuan Perkuliahan Baru
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Pertemuan Ke:
              </label>
              <Input
                type="number"
                min={1}
                max={16}
                value={nomorBaru}
                onChange={(e) => setNomorBaru(Number(e.target.value))}
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Tanggal Pelaksanaan:
              </label>
              <Input
                type="date"
                value={tanggalBaru}
                onChange={(e) => setTanggalBaru(e.target.value)}
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Materi Pokok / Bahasan Kuliah:
              </label>
              <textarea
                value={materiBaru}
                onChange={(e) => setMateriBaru(e.target.value)}
                placeholder="Misal: Normalisasi Basis Data 1NF sampai 3NF dan Praktikum SQL"
                rows={3}
                className="w-full rounded-[8px] border border-border p-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsTambahModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="default"
              onClick={handleTambahPertemuan}
              disabled={isLoading || !materiBaru.trim()}
              className="text-xs"
            >
              Buka Pertemuan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
