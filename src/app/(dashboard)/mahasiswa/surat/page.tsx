"use client";

import React, { useState } from "react";
import {
  FileText,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  AlertTriangle,
  Send,
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
import { SuratStore, JenisSurat } from "@/features/surat/surat-store";
import { ajukanSuratAction } from "@/features/surat/actions";

export default function MahasiswaSuratPage() {
  const mahasiswaId = "mhs-1";
  const daftarSurat = SuratStore.getPengajuanByMahasiswa(mahasiswaId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jenis, setJenis] = useState<JenisSurat>("AKTIF_KULIAH");
  const [keterangan, setKeterangan] = useState("");

  const [pesanNotif, setPesanNotif] = useState<{ teks: string; tipe: "sukses" | "galat" } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAjukan = async () => {
    if (!keterangan.trim()) {
      setPesanNotif({ teks: "Keperluan permohonan surat wajib diisi.", tipe: "galat" });
      return;
    }

    setIsLoading(true);
    setPesanNotif(null);

    const res = await ajukanSuratAction({
      jenis,
      keterangan: keterangan.trim(),
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
            Layanan Surat Keterangan Akademik
          </h1>
          <p className="text-sm text-muted-foreground">
            Ajukan permohonan surat aktif kuliah, cuti, atau rekomendasi secara daring dan unduh dokumen resmi bertanda tangan digital.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="gap-1.5 text-xs">
          <Plus className="h-4 w-4" />
          Ajukan Surat Baru
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

      {/* Tabel Riwayat Pengajuan */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Riwayat Pengajuan Surat Saya ({daftarSurat.length})
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="w-12 text-center">No</TableHead>
                  <TableHead className="w-32">Tanggal Pengajuan</TableHead>
                  <TableHead className="w-48">Jenis Surat</TableHead>
                  <TableHead>Keperluan / Alasan</TableHead>
                  <TableHead className="w-32 text-center">Status</TableHead>
                  <TableHead className="w-48">Nomor Surat</TableHead>
                  <TableHead className="w-32 text-center">Unduhan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {daftarSurat.length > 0 ? (
                  daftarSurat.map((item, idx) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="text-center font-medium text-xs text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {item.tanggalPengajuan}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">
                          {item.jenis.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-foreground">
                        {item.keterangan}
                        {item.status === "DITOLAK" && item.alasanTolak && (
                          <span className="block text-danger font-medium mt-1">
                            Alasan ditolak: {item.alasanTolak}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={item.status} size="sm" />
                      </TableCell>
                      <TableCell className="font-mono text-[11px] font-semibold text-primary">
                        {item.nomorSurat || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.status === "DISETUJUI" ? (
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
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {item.status === "DIAJUKAN" ? "Menunggu Verifikasi" : "Tidak Tersedia"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-xs text-muted-foreground">
                      Anda belum pernah mengajukan surat keterangan. Klik &quot;Ajukan Surat Baru&quot; di atas.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL AJUKAN SURAT */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Ajukan Permohonan Surat Keterangan
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Pilih Jenis Surat:
              </label>
              <select
                value={jenis}
                onChange={(e) => setJenis(e.target.value as JenisSurat)}
                className="w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="AKTIF_KULIAH">Surat Keterangan Aktif Kuliah</option>
                <option value="CUTI_AKADEMIK">Permohonan Cuti Akademik</option>
                <option value="REKOMENDASI_BEASISWA">Surat Rekomendasi Beasiswa / Lomba</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Keperluan / Alasan Pengajuan <span className="text-danger">*</span>:
              </label>
              <textarea
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Misal: Kelengkapan berkas tunjangan pensiun orang tua / pendaftaran beasiswa..."
                rows={4}
                required
                className="w-full rounded-[8px] border border-border p-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-[10px] text-muted-foreground block mt-1">
                Admin akan memverifikasi berkas dan menerbitkan surat resmi dengan nomor registrasi dalam 1-2 hari kerja.
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="default"
              onClick={handleAjukan}
              disabled={isLoading || !keterangan.trim()}
              className="text-xs"
            >
              Kirim Permohonan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
