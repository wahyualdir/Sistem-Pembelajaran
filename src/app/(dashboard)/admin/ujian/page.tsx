"use client";

import React, { useState } from "react";
import {
  Award,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
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
import { MasterStore } from "@/features/master/master-store";
import { UjianStore, JenisUjian, JadwalUjianItem } from "@/features/ujian/ujian-store";
import { tambahJadwalUjianAction } from "@/features/ujian/actions";

export default function AdminUjianPage() {
  const allKelas = JadwalStore.getKelas();
  const allRuang = MasterStore.getRuang();

  const [filterJenis, setFilterJenis] = useState<string>("SEMUA");
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [kelasId, setKelasId] = useState(allKelas[0]?.id || "");
  const [jenis, setJenis] = useState<JenisUjian>("UTS");
  const [tanggal, setTanggal] = useState("2026-10-26");
  const [jamMulai, setJamMulai] = useState("08:00");
  const [jamSelesai, setJamSelesai] = useState("09:40");
  const [ruangId, setRuangId] = useState(allRuang[0]?.id || "");

  const [pesanNotif, setPesanNotif] = useState<{ teks: string; tipe: "sukses" | "galat" } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const daftarUjian = UjianStore.getSemuaJadwal();

  const handleTambah = async () => {
    setIsLoading(true);
    setPesanNotif(null);

    const res = await tambahJadwalUjianAction({
      kelasId,
      jenis,
      tanggal,
      jamMulai,
      jamSelesai,
      ruangId,
    });

    setIsLoading(false);
    if (res.success) {
      setIsModalOpen(false);
      setPesanNotif({ teks: res.message, tipe: "sukses" });
    } else {
      setPesanNotif({ teks: res.message, tipe: "galat" });
    }
  };

  const filteredUjian = daftarUjian.filter((u) => {
    const matchJenis = filterJenis === "SEMUA" || u.jenis === filterJenis;
    const matchSearch =
      u.kodeMataKuliah.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.namaMataKuliah.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.namaRuang.toLowerCase().includes(searchQuery.toLowerCase());
    return matchJenis && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Pengelolaan Jadwal Ujian (UTS & UAS)
          </h1>
          <p className="text-sm text-muted-foreground">
            Pengaturan tanggal, waktu, alokasi ruang, dan pengawas ujian tengah dan akhir semester.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="gap-1.5 text-xs">
          <Plus className="h-4 w-4" />
          Tambah Jadwal Ujian
        </Button>
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

      {/* Filter & Search Card */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Jenis Ujian:</span>
            <div className="inline-flex rounded-[8px] border border-border p-1 bg-muted gap-1">
              {["SEMUA", "UTS", "UAS"].map((j) => (
                <button
                  key={j}
                  onClick={() => setFilterJenis(j)}
                  className={`px-3 py-1 text-xs rounded-[6px] font-semibold transition-colors ${
                    filterJenis === j
                      ? "bg-surface text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {j}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full sm:w-64 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari mata kuliah atau ruang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="w-12 text-center">No</TableHead>
                  <TableHead className="w-20 text-center">Jenis</TableHead>
                  <TableHead className="w-28">Kode MK</TableHead>
                  <TableHead>Mata Kuliah</TableHead>
                  <TableHead className="w-16 text-center">Kelas</TableHead>
                  <TableHead className="w-16 text-center">SKS</TableHead>
                  <TableHead className="w-28 text-center">Tanggal</TableHead>
                  <TableHead className="w-28 text-center">Waktu</TableHead>
                  <TableHead className="w-32">Ruangan</TableHead>
                  <TableHead>Dosen Pengampu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUjian.length > 0 ? (
                  filteredUjian.map((item, idx) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="text-center font-medium text-xs text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={item.jenis === "UTS" ? "secondary" : "default"}
                          className="text-xs"
                        >
                          {item.jenis}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-foreground">
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
                      <TableCell className="text-center text-xs text-muted-foreground font-mono">
                        {item.jamMulai} - {item.jamSelesai}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-primary">
                        {item.namaRuang}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.dosenPengampu}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="py-8 text-center text-xs text-muted-foreground">
                      Tidak ada jadwal ujian yang ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL TAMBAH JADWAL UJIAN */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Tambah Jadwal Ujian Baru
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Pilih Kelas Mata Kuliah:
              </label>
              <select
                value={kelasId}
                onChange={(e) => setKelasId(e.target.value)}
                className="w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {allKelas.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.kodeMataKuliah} - {k.namaMataKuliah} (Kelas {k.kode})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Jenis Ujian:
                </label>
                <select
                  value={jenis}
                  onChange={(e) => setJenis(e.target.value as JenisUjian)}
                  className="w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="UTS">UTS (Tengah Semester)</option>
                  <option value="UAS">UAS (Akhir Semester)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Tanggal Ujian:
                </label>
                <Input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Jam Mulai (HH:mm):
                </label>
                <Input
                  type="time"
                  value={jamMulai}
                  onChange={(e) => setJamMulai(e.target.value)}
                  className="text-xs text-center"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Jam Selesai (HH:mm):
                </label>
                <Input
                  type="time"
                  value={jamSelesai}
                  onChange={(e) => setJamSelesai(e.target.value)}
                  className="text-xs text-center"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Ruang Ujian:
              </label>
              <select
                value={ruangId}
                onChange={(e) => setRuangId(e.target.value)}
                className="w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {allRuang.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nama} ({r.kode}) - Kapasitas: {r.kapasitas} Kursi
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="default"
              onClick={handleTambah}
              disabled={isLoading}
              className="text-xs"
            >
              Simpan Jadwal Ujian
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
