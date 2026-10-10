"use client";

import React, { useState } from "react";
import { TagihanItem } from "../ukt-store";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { bayarUktAction, beriDispensasiAction } from "../actions";
import { formatRupiah } from "@/lib/utils";
import { CheckCircle2, ShieldCheck, Clock, Search } from "lucide-react";

interface AdminUktViewProps {
  initialTagihan: TagihanItem[];
}

export function AdminUktView({ initialTagihan }: AdminUktViewProps) {
  const [tagihanList] = useState<TagihanItem[]>(initialTagihan);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("SEMUA");

  const [payTarget, setPayTarget] = useState<TagihanItem | null>(null);
  const [dispensasiTarget, setDispensasiTarget] = useState<TagihanItem | null>(null);

  const [buktiBayar, setBuktiBayar] = useState("");
  const [alasanDispensasi, setAlasanDispensasi] = useState("");
  const [batasDispensasi, setBatasDispensasi] = useState("2026-11-30");

  const [feedback, setFeedback] = useState<string | null>(null);

  const filtered = tagihanList.filter((t) => {
    const matchSearch =
      t.namaMahasiswa.toLowerCase().includes(search.toLowerCase()) ||
      t.nimMahasiswa.includes(search);
    const matchStatus = statusFilter === "SEMUA" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payTarget) return;

    const res = await bayarUktAction(payTarget.id, buktiBayar || "MANUAL-KASIR-001");
    if (res.success) {
      setFeedback(res.message);
      setPayTarget(null);
      window.location.reload();
    }
  };

  const handleDispensasiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispensasiTarget) return;

    const res = await beriDispensasiAction(
      dispensasiTarget.id,
      alasanDispensasi,
      batasDispensasi
    );
    if (res.success) {
      setFeedback(res.message);
      setDispensasiTarget(null);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-4">
      {feedback && (
        <div className="rounded-[8px] bg-success-soft border border-success-border p-3 text-xs text-success flex justify-between items-center">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="font-semibold">
            Tutup
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari NIM atau nama mahasiswa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-[8px] border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="SEMUA">Semua Status</option>
            <option value="LUNAS">Lunas</option>
            <option value="DISPENSASI">Dispensasi</option>
            <option value="BELUM">Belum Lunas</option>
          </select>
        </div>

        <div className="text-xs text-muted-foreground">
          Menampilkan {filtered.length} data tagihan mahasiswa
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>NIM</TableHead>
            <TableHead>Nama Mahasiswa</TableHead>
            <TableHead>Program Studi</TableHead>
            <TableHead>Semester / TA</TableHead>
            <TableHead>Jumlah Tagihan</TableHead>
            <TableHead>Status Pembayaran</TableHead>
            <TableHead>Keterangan / Bukti</TableHead>
            <TableHead className="text-right">Aksi Kelola</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="font-semibold">{t.nimMahasiswa}</TableCell>
              <TableCell className="font-medium text-foreground">
                {t.namaMahasiswa}
              </TableCell>
              <TableCell>{t.prodiNama}</TableCell>
              <TableCell className="text-xs">{t.tahunAjaranKode}</TableCell>
              <TableCell className="font-semibold text-foreground">
                {formatRupiah(t.jumlah)}
              </TableCell>
              <TableCell>
                <StatusBadge status={t.status} />
              </TableCell>
              <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                {t.catatan || t.buktiPembayaran || "-"}
              </TableCell>
              <TableCell className="text-right">
                <div className="inline-flex items-center gap-1.5">
                  {t.status !== "LUNAS" && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setPayTarget(t);
                          setBuktiBayar(`TRX-${Date.now()}`);
                        }}
                        className="h-8 px-2 text-xs"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Lunas
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDispensasiTarget(t);
                          setAlasanDispensasi("Permohonan cicilan pembayaran UKT");
                        }}
                        className="h-8 px-2 text-xs text-warning hover:text-warning"
                      >
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        Dispensasi
                      </Button>
                    </>
                  )}
                  {t.status === "LUNAS" && (
                    <span className="text-xs text-success flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4" />
                      Terverifikasi
                    </span>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Dialog Konfirmasi Pelunasan */}
      <Dialog open={!!payTarget} onOpenChange={() => setPayTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verifikasi Pelunasan Tagihan UKT</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePaySubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Mencatat pembayaran lunas untuk mahasiswa:{" "}
              <strong className="text-foreground">{payTarget?.namaMahasiswa}</strong> (
              {payTarget?.nimMahasiswa}) sejumlah{" "}
              <strong className="text-foreground">{formatRupiah(payTarget?.jumlah || 0)}</strong>.
            </p>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Nomor Referensi Transaksi / Bukti Bayar
              </label>
              <Input
                value={buktiBayar}
                onChange={(e) => setBuktiBayar(e.target.value)}
                placeholder="Contoh: TRX-BANK-123456"
                required
              />
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setPayTarget(null)}>
                Batal
              </Button>
              <Button variant="default" type="submit">
                Simpan & Buka Akses KRS
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Beri Dispensasi */}
      <Dialog
        open={!!dispensasiTarget}
        onOpenChange={() => setDispensasiTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pemberian Dispensasi Tagihan UKT</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleDispensasiSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Dispensasi membuka izin pengisian KRS mahasiswa:{" "}
              <strong className="text-foreground">
                {dispensasiTarget?.namaMahasiswa}
              </strong>
            </p>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Alasan Dispensasi (Wajib Dicatat ke Audit Log)
              </label>
              <Input
                value={alasanDispensasi}
                onChange={(e) => setAlasanDispensasi(e.target.value)}
                placeholder="Contoh: Surat permohonan penundaan karena kendala ekonomi"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Batas Waktu Pelunasan Akhir
              </label>
              <Input
                type="date"
                value={batasDispensasi}
                onChange={(e) => setBatasDispensasi(e.target.value)}
                required
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setDispensasiTarget(null)}
              >
                Batal
              </Button>
              <Button variant="default" type="submit">
                Setujui Dispensasi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
