"use client";

import React, { useState } from "react";
import {
  Users,
  Plus,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Clock,
  Send,
  UserCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BimbinganStore } from "@/features/bimbingan/bimbingan-store";
import { ajukanBimbinganAction } from "@/features/bimbingan/actions";

export default function MahasiswaBimbinganPage() {
  const mahasiswaId = "mhs-1";
  const daftarBimbingan = BimbinganStore.getBimbinganByMahasiswa(mahasiswaId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [topik, setTopik] = useState("");
  const [catatanMahasiswa, setCatatanMahasiswa] = useState("");

  const [pesanNotif, setPesanNotif] = useState<{ teks: string; tipe: "sukses" | "galat" } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAjukan = async () => {
    if (!topik.trim() || !catatanMahasiswa.trim()) {
      setPesanNotif({ teks: "Topik dan pertanyaan bimbingan wajib diisi.", tipe: "galat" });
      return;
    }

    setIsLoading(true);
    setPesanNotif(null);

    const res = await ajukanBimbinganAction({
      topik: topik.trim(),
      catatanMahasiswa: catatanMahasiswa.trim(),
    });

    setIsLoading(false);
    if (res.success) {
      setIsModalOpen(false);
      setTopik("");
      setCatatanMahasiswa("");
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
            Bimbingan Akademik Dosen Wali
          </h1>
          <p className="text-sm text-muted-foreground">
            Ruang komunikasi dan konsultasi akademik terkait rencana studi, evaluasi prestasi, dan persiapan tugas akhir.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="gap-1.5 text-xs">
          <Plus className="h-4 w-4" />
          Ajukan Bimbingan Baru
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

      {/* Kartu Profil Dosen Wali */}
      <Card>
        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-primary-tint text-primary font-bold text-lg">
              DA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground text-base">
                  Dr. Ardiansyah, S.T., M.Kom.
                </span>
                <Badge variant="secondary" className="text-xs">
                  Dosen Pembimbing Akademik
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                NIDN: 1024088001 • Program Studi: Teknik Informatika • Fakultas Teknik
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <UserCheck className="h-4 w-4 text-ink" />
            <span>Status Perwalian: <strong>Aktif</strong></span>
          </div>
        </CardContent>
      </Card>

      {/* Riwayat Konsultasi & Bimbingan */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">
          Riwayat Bimbingan & Konsultasi ({daftarBimbingan.length})
        </h2>

        {daftarBimbingan.length > 0 ? (
          daftarBimbingan.map((bim) => (
            <Card key={bim.id} className="border-border">
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-bold text-foreground">
                      {bim.topik}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {bim.tanggal}
                    </span>
                    <Badge variant={bim.status === "SELESAI" ? "success" : "warning"}>
                      {bim.status === "SELESAI" ? "Selesai Ditanggapi" : "Menunggu Tanggapan"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3">
                {/* Catatan / Pertanyaan Mahasiswa */}
                <div>
                  <span className="text-xs font-semibold text-muted-foreground font-medium block mb-1">
                    Pertanyaan / Keterangan Mahasiswa:
                  </span>
                  <p className="text-xs text-foreground bg-muted p-3 rounded-[8px] border border-border leading-relaxed">
                    {bim.catatanMahasiswa}
                  </p>
                </div>

                {/* Catatan / Rekomendasi Dosen Wali */}
                {bim.catatanDosen ? (
                  <div className="pt-1">
                    <span className="text-xs font-semibold text-primary font-medium block mb-1">
                      Arahan & Catatan Dosen Wali:
                    </span>
                    <div className="text-xs text-foreground bg-primary-soft/70 p-3 rounded-[8px] border-l-4 border-primary leading-relaxed">
                      {bim.catatanDosen}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Dosen Wali belum memberikan tanggapan tertulis untuk permohonan bimbingan ini.
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground text-xs">
              Belum ada riwayat konsultasi. Klik &quot;Ajukan Bimbingan Baru&quot; untuk memulai konsultasi akademik dengan Dosen Wali Anda.
            </CardContent>
          </Card>
        )}
      </div>

      {/* MODAL AJUKAN BIMBINGAN */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Ajukan Permintaan Bimbingan Akademik
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Topik / Perihal Bimbingan:
              </label>
              <Input
                value={topik}
                onChange={(e) => setTopik(e.target.value)}
                placeholder="Misal: Konsultasi SKS Semester Baru / Topik Skripsi"
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Pertanyaan / Hal yang Ingin Dikonsultasikan:
              </label>
              <textarea
                value={catatanMahasiswa}
                onChange={(e) => setCatatanMahasiswa(e.target.value)}
                placeholder="Tuliskan secara jelas rincian pertanyaan, kendala studi, atau permohonan arahan Anda..."
                rows={4}
                className="w-full rounded-[8px] border border-border p-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="default"
              onClick={handleAjukan}
              disabled={isLoading || !topik.trim() || !catatanMahasiswa.trim()}
              className="text-xs"
            >
              Kirim Pengajuan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
