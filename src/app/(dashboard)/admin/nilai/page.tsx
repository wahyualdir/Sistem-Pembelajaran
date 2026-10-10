"use client";

import React, { useState } from "react";
import {
  GraduationCap,
  ShieldAlert,
  Search,
  CheckCircle,
  AlertTriangle,
  History,
  Lock,
  Edit,
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
import { NilaiStore, NilaiMahasiswa, KelasNilaiData } from "@/features/nilai/nilai-store";
import { koreksiNilaiAdminAction } from "@/features/nilai/actions";
import { JadwalStore } from "@/features/jadwal/jadwal-store";

export default function AdminNilaiPage() {
  const allKelas = JadwalStore.getKelas();

  const [selectedKelasId, setSelectedKelasId] = useState<string>("kls-tif201-a");
  const kelas = NilaiStore.getKelasNilai(selectedKelasId);

  const [searchQuery, setSearchQuery] = useState("");
  const [pesanNotif, setPesanNotif] = useState<{ teks: string; tipe: "sukses" | "galat" } | null>(null);

  // State untuk dialog koreksi nilai
  const [modalKoreksi, setModalKoreksi] = useState<{
    open: boolean;
    peserta: NilaiMahasiswa | null;
    skorBaru: Record<string, number>;
    alasan: string;
  }>({
    open: false,
    peserta: null,
    skorBaru: {},
    alasan: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  // Log Audit riwayat koreksi
  const auditLogs = NilaiStore.getLogAudit(10);

  const handleOpenKoreksi = (peserta: NilaiMahasiswa) => {
    setModalKoreksi({
      open: true,
      peserta,
      skorBaru: { ...peserta.skorKomponen },
      alasan: "",
    });
    setPesanNotif(null);
  };

  const handleSimpanKoreksi = async () => {
    if (!kelas || !modalKoreksi.peserta) return;
    if (!modalKoreksi.alasan.trim() || modalKoreksi.alasan.trim().length < 5) {
      setPesanNotif({
        teks: "Alasan koreksi nilai wajib diisi minimal 5 karakter untuk log audit.",
        tipe: "galat",
      });
      return;
    }

    setIsLoading(true);
    setPesanNotif(null);

    const res = await koreksiNilaiAdminAction({
      kelasId: kelas.kelasId,
      krsDetailId: modalKoreksi.peserta.krsDetailId,
      skorKomponenBaru: modalKoreksi.skorBaru,
      alasan: modalKoreksi.alasan.trim(),
    });

    setIsLoading(false);
    if (res.success) {
      setPesanNotif({ teks: res.message, tipe: "sukses" });
      setModalKoreksi({ open: false, peserta: null, skorBaru: {}, alasan: "" });
    } else {
      setPesanNotif({ teks: res.message, tipe: "galat" });
    }
  };

  const filteredPeserta = kelas?.peserta.filter(
    (p) =>
      p.nim.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nama.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Koreksi Nilai Terkunci & Log Audit
          </h1>
          <p className="text-sm text-muted-foreground">
            Hak istimewa administrator akademik untuk mengoreksi nilai yang telah difinalisasi dosen, disertai pencatatan audit ketat.
          </p>
        </div>

        {/* Pemilihan Kelas */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Pilih Kelas:
          </label>
          <select
            value={selectedKelasId}
            onChange={(e) => {
              setSelectedKelasId(e.target.value);
              setPesanNotif(null);
            }}
            className="rounded-[8px] border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {allKelas.map((k) => (
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

      {/* Info Kelas yang Dipilih */}
      {kelas && (
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-primary text-base">
                  {kelas.kodeMataKuliah}
                </span>
                <span className="text-border">|</span>
                <span className="font-semibold text-foreground text-base">
                  {kelas.namaMataKuliah} (Kelas {kelas.kodeKelas})
                </span>
                <Badge variant={kelas.statusFinal ? "success" : "warning"}>
                  {kelas.statusFinal ? "TERKUNCI / FINAL" : "STATUS: DRAF"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Dosen: {kelas.namaDosen} • {kelas.sks} SKS • Total Peserta: {kelas.peserta.length} Mahasiswa
              </p>
            </div>

            <div className="w-full sm:w-64">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cari NIM atau Nama..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 text-xs"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="w-12 text-center">No</TableHead>
                    <TableHead className="w-32">NIM</TableHead>
                    <TableHead>Nama Mahasiswa</TableHead>
                    {kelas.komponen.map((komp) => (
                      <TableHead key={komp.id} className="w-24 text-center">
                        {komp.nama} ({komp.bobotPersen}%)
                      </TableHead>
                    ))}
                    <TableHead className="w-24 text-center">Nilai Akhir</TableHead>
                    <TableHead className="w-20 text-center">Huruf</TableHead>
                    <TableHead className="w-20 text-center">Bobot</TableHead>
                    <TableHead className="w-28 text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPeserta.length > 0 ? (
                    filteredPeserta.map((peserta, idx) => (
                      <TableRow key={peserta.krsDetailId} className="hover:bg-muted/50">
                        <TableCell className="text-center font-medium text-xs text-muted-foreground">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-semibold text-foreground">
                          {peserta.nim}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-foreground">
                          {peserta.nama}
                        </TableCell>
                        {kelas.komponen.map((komp) => (
                          <TableCell key={komp.id} className="text-center text-xs">
                            {peserta.skorKomponen[komp.id] ?? "-"}
                          </TableCell>
                        ))}
                        <TableCell className="text-center font-bold text-xs text-primary">
                          {peserta.nilaiAkhir ?? "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              peserta.nilaiHuruf === "A" || peserta.nilaiHuruf === "A-"
                                ? "success"
                                : peserta.nilaiHuruf === "E"
                                ? "danger"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {peserta.nilaiHuruf ?? "-"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-medium text-xs text-muted-foreground">
                          {peserta.bobot ? peserta.bobot.toFixed(2) : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenKoreksi(peserta)}
                            className="gap-1 text-xs text-primary hover:text-primary hover:bg-primary-tint"
                          >
                            <Edit className="h-3 w-3" />
                            Koreksi
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={kelas.komponen.length + 5}
                        className="py-8 text-center text-xs text-muted-foreground"
                      >
                        Tidak ada mahasiswa yang cocok dengan pencarian.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SEKSI LOG AUDIT KOREKSI NILAI */}
      <Card>
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Riwayat Log Audit Koreksi & Penguncian Nilai
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="w-36 text-xs">Waktu</TableHead>
                  <TableHead className="w-36 text-xs">Pelaku</TableHead>
                  <TableHead className="w-28 text-xs">Aksi</TableHead>
                  <TableHead className="text-xs">Keterangan & Alasan</TableHead>
                  <TableHead className="w-36 text-xs">Nilai Lama</TableHead>
                  <TableHead className="w-36 text-xs">Nilai Baru</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id} className="text-xs">
                    <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                      {log.waktu}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-foreground block">
                        {log.penggunaNama}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{log.peran}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="text-[10px]">
                        {log.aksi}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground">{log.keterangan}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {log.nilaiLama || "-"}
                    </TableCell>
                    <TableCell className="font-mono font-semibold text-primary">
                      {log.nilaiBaru || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL KOREKSI NILAI ADMIN */}
      <Dialog
        open={modalKoreksi.open}
        onOpenChange={(open) =>
          setModalKoreksi((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-warning" />
              Koreksi Nilai Mahasiswa (Audit Terlacak)
            </DialogTitle>
          </DialogHeader>

          {modalKoreksi.peserta && kelas && (
            <div className="space-y-4 py-2">
              <div className="rounded-[8px] bg-muted p-3 text-xs space-y-1 border border-border">
                <p>
                  <strong>Mahasiswa:</strong> {modalKoreksi.peserta.nama} ({modalKoreksi.peserta.nim})
                </p>
                <p>
                  <strong>Mata Kuliah:</strong> {kelas.namaMataKuliah} (Kelas {kelas.kodeKelas})
                </p>
                <p>
                  <strong>Nilai Saat Ini:</strong> {modalKoreksi.peserta.nilaiAkhir ?? "-"} (
                  {modalKoreksi.peserta.nilaiHuruf ?? "-"})
                </p>
              </div>

              {/* Input Nilai Per Komponen */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground block">
                  Ubah Skor Komponen Nilai (0 - 100):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {kelas.komponen.map((komp) => (
                    <div key={komp.id}>
                      <span className="text-[11px] text-muted-foreground block">
                        {komp.nama} ({komp.bobotPersen}%)
                      </span>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={modalKoreksi.skorBaru[komp.id] ?? ""}
                        onChange={(e) => {
                          const val = e.target.value === "" ? 0 : Number(e.target.value);
                          setModalKoreksi((prev) => ({
                            ...prev,
                            skorBaru: {
                              ...prev.skorBaru,
                              [komp.id]: Math.min(100, Math.max(0, val)),
                            },
                          }));
                        }}
                        className="text-xs mt-0.5"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Input Alasan Koreksi */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Alasan Koreksi Resmi <span className="text-danger">*</span>:
                </label>
                <textarea
                  value={modalKoreksi.alasan}
                  onChange={(e) =>
                    setModalKoreksi((prev) => ({ ...prev, alasan: e.target.value }))
                  }
                  placeholder="Misal: Perbaikan nilai UAS setelah verifikasi lembar jawaban fisik sesuai surat permohonan No. 12/TI/2026."
                  rows={3}
                  className="w-full rounded-[8px] border border-border p-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-[10px] text-muted-foreground">
                  Catatan ini akan tersimpan permanen pada Log Audit sistem.
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setModalKoreksi((prev) => ({ ...prev, open: false }))}
            >
              Batal
            </Button>
            <Button
              variant="default"
              onClick={handleSimpanKoreksi}
              disabled={isLoading || modalKoreksi.alasan.trim().length < 5}
              className="text-xs"
            >
              Simpan Koreksi Nilai
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
