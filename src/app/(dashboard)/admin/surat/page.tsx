"use client";

import React, { useState } from "react";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  AlertTriangle,
  Search,
  Filter,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SuratStore, StatusSurat, PengajuanSuratItem } from "@/features/surat/surat-store";
import { prosesSuratAction } from "@/features/surat/actions";

export default function AdminSuratPage() {
  const [filterStatus, setFilterStatus] = useState<string>("SEMUA");
  const [searchQuery, setSearchQuery] = useState("");

  const [rejectTarget, setRejectTarget] = useState<PengajuanSuratItem | null>(null);
  const [alasanTolak, setAlasanTolak] = useState("");

  const [pesanNotif, setPesanNotif] = useState<{ teks: string; tipe: "sukses" | "galat" } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const daftarSurat = SuratStore.getSemuaPengajuan();

  const handleSetujui = async (suratId: string) => {
    setIsLoading(true);
    setPesanNotif(null);

    const res = await prosesSuratAction({
      suratId,
      aksi: "SETUJUI",
    });

    setIsLoading(false);
    if (res.success) {
      setPesanNotif({ teks: res.message, tipe: "sukses" });
    } else {
      setPesanNotif({ teks: res.message, tipe: "galat" });
    }
  };

  const handleTolakSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTarget || !alasanTolak.trim()) return;

    setIsLoading(true);
    setPesanNotif(null);

    const res = await prosesSuratAction({
      suratId: rejectTarget.id,
      aksi: "TOLAK",
      alasanTolak: alasanTolak.trim(),
    });

    setIsLoading(false);
    if (res.success) {
      setRejectTarget(null);
      setAlasanTolak("");
      setPesanNotif({ teks: res.message, tipe: "sukses" });
    } else {
      setPesanNotif({ teks: res.message, tipe: "galat" });
    }
  };

  const filteredSurat = daftarSurat.filter((s) => {
    const matchStatus = filterStatus === "SEMUA" || s.status === filterStatus;
    const matchSearch =
      s.nim.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.namaMahasiswa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.keterangan.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Layanan Pengajuan Surat Keterangan Mahasiswa
        </h1>
        <p className="text-sm text-muted-foreground">
          Verifikasi permohonan surat aktif kuliah, cuti akademik, dan rekomendasi beasiswa beserta penerbitan nomor surat resmi.
        </p>
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

      {/* Filter & Search */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Filter Status:</span>
            <div className="inline-flex rounded-[8px] border border-border p-1 bg-muted gap-1">
              {["SEMUA", "DIAJUKAN", "DISETUJUI", "DITOLAK"].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 text-xs rounded-[6px] font-semibold transition-colors ${
                    filterStatus === st
                      ? "bg-surface text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full sm:w-64 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari NIM atau Nama..."
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
                  <TableHead className="w-28">Tanggal</TableHead>
                  <TableHead className="w-32">NIM</TableHead>
                  <TableHead>Nama Mahasiswa</TableHead>
                  <TableHead className="w-36">Jenis Surat</TableHead>
                  <TableHead>Keperluan / Alasan</TableHead>
                  <TableHead className="w-28 text-center">Status</TableHead>
                  <TableHead className="w-36">Nomor Surat</TableHead>
                  <TableHead className="w-36 text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSurat.length > 0 ? (
                  filteredSurat.map((item, idx) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="text-center font-medium text-xs text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {item.tanggalPengajuan}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-foreground">
                        {item.nim}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-foreground">
                        {item.namaMahasiswa}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {item.jenis.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={item.keterangan}>
                        {item.keterangan}
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={item.status} size="sm" />
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-primary">
                        {item.nomorSurat || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.status === "DIAJUKAN" && (
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleSetujui(item.id)}
                              disabled={isLoading}
                              className="h-7 text-xs bg-success hover:bg-success/90 gap-1 px-2"
                            >
                              <CheckCircle className="h-3 w-3" />
                              Setujui
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setRejectTarget(item);
                                setAlasanTolak("");
                              }}
                              disabled={isLoading}
                              className="h-7 text-xs gap-1 px-2"
                            >
                              <XCircle className="h-3 w-3" />
                              Tolak
                            </Button>
                          </div>
                        )}

                        {item.status === "DISETUJUI" && (
                          <a
                            href={`/api/pdf/surat?id=${item.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                              <Download className="h-3 w-3" />
                              Unduh PDF
                            </Button>
                          </a>
                        )}

                        {item.status === "DITOLAK" && (
                          <span
                            className="text-xs text-danger cursor-help underline"
                            title={`Alasan tolak: ${item.alasanTolak || "Tidak memenuhi ketentuan"}`}
                          >
                            Ditolak
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-xs text-muted-foreground">
                      Tidak ada pengajuan surat yang ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL TOLAK SURAT DENGAN ALASAN */}
      <Dialog open={!!rejectTarget} onOpenChange={() => setRejectTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-danger">
              <XCircle className="h-5 w-5" />
              Tolak Permohonan Surat Keterangan
            </DialogTitle>
          </DialogHeader>

          {rejectTarget && (
            <form onSubmit={handleTolakSubmit} className="space-y-4 py-2">
              <div className="rounded-[8px] bg-muted p-3 text-xs border border-border space-y-1">
                <p>
                  <strong>Mahasiswa:</strong> {rejectTarget.namaMahasiswa} ({rejectTarget.nim})
                </p>
                <p>
                  <strong>Jenis:</strong> {rejectTarget.jenis.replace(/_/g, " ")}
                </p>
                <p className="text-muted-foreground">
                  <strong>Keperluan:</strong> {rejectTarget.keterangan}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Alasan Penolakan <span className="text-danger">*</span>:
                </label>
                <textarea
                  value={alasanTolak}
                  onChange={(e) => setAlasanTolak(e.target.value)}
                  placeholder="Misal: Mahasiswa belum melunasi tagihan UKT atau berkas lampiran tidak lengkap..."
                  rows={3}
                  required
                  className="w-full rounded-[8px] border border-border p-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRejectTarget(null)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isLoading || alasanTolak.trim().length < 5}
                  className="text-xs"
                >
                  Tolak Pengajuan
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
