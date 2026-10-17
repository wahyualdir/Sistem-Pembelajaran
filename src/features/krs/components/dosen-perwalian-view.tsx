"use client";

import React, { useState } from "react";
import { KRSItem } from "../krs-store";
import { BimbinganItem } from "@/features/bimbingan/bimbingan-store";
import { tanggapBimbinganAction } from "@/features/bimbingan/actions";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { setujuiKrsAction, tolakKrsAction } from "../actions";
import {
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  MessageSquare,
  ClipboardList,
  Clock,
  Send,
} from "lucide-react";

interface DosenPerwalianViewProps {
  initialKrsList: KRSItem[];
  initialBimbinganList?: BimbinganItem[];
}

export function DosenPerwalianView({
  initialKrsList,
  initialBimbinganList = [],
}: DosenPerwalianViewProps) {
  const [activeTab, setActiveTab] = useState<"krs" | "bimbingan">("krs");

  const [krsList] = useState<KRSItem[]>(initialKrsList);
  const [detailTarget, setDetailTarget] = useState<KRSItem | null>(null);
  const [rejectTarget, setRejectTarget] = useState<KRSItem | null>(null);
  const [rejectCatatan, setRejectCatatan] = useState("");

  // State bimbingan
  const [bimbinganList, setBimbinganList] = useState<BimbinganItem[]>(initialBimbinganList);
  const [modalBimbinganTarget, setModalBimbinganTarget] = useState<BimbinganItem | null>(null);
  const [catatanDosenInput, setCatatanDosenInput] = useState("");

  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleApprove = async (krsId: string) => {
    setLoading(true);
    setFeedback(null);
    setErrorFeedback(null);
    try {
      const res = await setujuiKrsAction(krsId, "Disetujui dosen wali.");
      if (res.success) {
        setFeedback(res.message);
        setDetailTarget(null);
        window.location.reload();
      } else {
        setErrorFeedback(res.message);
      }
    } catch {
      setErrorFeedback("Terjadi kendala saat menyetujui KRS.");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTarget) return;

    setLoading(true);
    setFeedback(null);
    setErrorFeedback(null);
    try {
      const res = await tolakKrsAction(rejectTarget.id, rejectCatatan);
      if (res.success) {
        setFeedback(res.message);
        setRejectTarget(null);
        setRejectCatatan("");
        window.location.reload();
      } else {
        setErrorFeedback(res.message);
      }
    } catch {
      setErrorFeedback("Terjadi kendala saat menolak KRS.");
    } finally {
      setLoading(false);
    }
  };

  // Tanggapi bimbingan mahasiswa
  const handleTanggapBimbinganSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalBimbinganTarget || !catatanDosenInput.trim()) return;

    setLoading(true);
    setFeedback(null);
    setErrorFeedback(null);

    const res = await tanggapBimbinganAction({
      bimbinganId: modalBimbinganTarget.id,
      catatanDosen: catatanDosenInput.trim(),
    });

    setLoading(false);
    if (res.success) {
      setFeedback(res.message);
      setBimbinganList((prev) =>
        prev.map((b) =>
          b.id === modalBimbinganTarget.id
            ? { ...b, catatanDosen: catatanDosenInput.trim(), status: "SELESAI" }
            : b
        )
      );
      setModalBimbinganTarget(null);
      setCatatanDosenInput("");
    } else {
      setErrorFeedback(res.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab("krs")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-[8px] transition-colors ${
            activeTab === "krs"
              ? "bg-primary text-white"
              : "bg-surface text-muted-foreground border border-border hover:bg-muted"
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          Persetujuan KRS ({krsList.length})
        </button>
        <button
          onClick={() => setActiveTab("bimbingan")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-[8px] transition-colors ${
            activeTab === "bimbingan"
              ? "bg-primary text-white"
              : "bg-surface text-muted-foreground border border-border hover:bg-muted"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Bimbingan & Konsultasi ({bimbinganList.length})
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-surface border border-ink text-ink text-xs font-semibold rounded-[8px] flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {errorFeedback && (
        <div className="p-3 bg-surface border border-ink text-primary-dark text-xs font-semibold rounded-[8px] flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorFeedback}</span>
        </div>
      )}

      {/* TAB 1: PERSETUJUAN KRS */}
      {activeTab === "krs" && (
        <div className="rounded-[12px] border border-border bg-surface overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border bg-muted">
            <h3 className="font-semibold text-sm text-foreground">
              Daftar Rencana Studi Mahasiswa Bimbingan
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Validasi batas SKS berdasarkan IPS semester lalu sebelum menyetujui.
            </p>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">No</TableHead>
                  <TableHead>Mahasiswa</TableHead>
                  <TableHead>IPS Lalu</TableHead>
                  <TableHead>Beban SKS</TableHead>
                  <TableHead>Mata Kuliah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {krsList.map((krs, index) => {
                  const isExceeded = krs.totalSks > krs.batasSks;
                  return (
                    <TableRow key={krs.id}>
                      <TableCell className="text-center font-sans text-xs">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-sm text-foreground block">
                          {krs.namaMahasiswa}
                        </span>
                        <span className="font-sans text-xs text-muted-foreground">
                          NIM: {krs.nimMahasiswa}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-xs">
                        {krs.ipsSemesterLalu.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-bold text-xs ${
                            isExceeded ? "text-primary-dark" : "text-foreground"
                          }`}
                        >
                          {krs.totalSks} SKS
                        </span>
                        <span className="text-xs text-muted-foreground block">
                          Maks: {krs.batasSks} SKS
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {krs.items.length} Mata Kuliah
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={krs.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1 text-xs"
                            onClick={() => setDetailTarget(krs)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Detail
                          </Button>
                          {krs.status === "DIAJUKAN" && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                className="h-8 gap-1 text-xs bg-gray-dark hover:bg-gray-dark/90"
                                onClick={() => handleApprove(krs.id)}
                                disabled={loading || isExceeded}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Setujui
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-8 gap-1 text-xs"
                                onClick={() => setRejectTarget(krs)}
                                disabled={loading}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Tolak
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* TAB 2: BIMBINGAN & KONSULTASI MAHASISWA */}
      {activeTab === "bimbingan" && (
        <div className="space-y-4">
          <div className="rounded-[12px] border border-border bg-surface p-4 bg-muted">
            <h3 className="font-semibold text-sm text-foreground">
              Permohonan & Riwayat Konsultasi Akademik Mahasiswa
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Berikan arahan, saran perbaikan, atau catatan rekomendasi studi untuk mahasiswa bimbingan Anda.
            </p>
          </div>

          <div className="space-y-3">
            {bimbinganList.length > 0 ? (
              bimbinganList.map((bim) => (
                <div
                  key={bim.id}
                  className="rounded-[12px] border border-border bg-surface p-4 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">
                          {bim.namaMahasiswa}
                        </span>
                        <span className="font-sans text-xs text-muted-foreground">
                          ({bim.nimMahasiswa})
                        </span>
                        <Badge
                          variant={bim.status === "SELESAI" ? "success" : "warning"}
                          className="text-xs"
                        >
                          {bim.status === "SELESAI" ? "Sudah Ditanggapi" : "Menunggu Arahan"}
                        </Badge>
                      </div>
                      <p className="text-xs font-semibold text-primary mt-1">
                        Topik: {bim.topik}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {bim.tanggal}
                      </span>
                      <Button
                        size="sm"
                        variant={bim.status === "SELESAI" ? "outline" : "default"}
                        className="text-xs gap-1"
                        onClick={() => {
                          setModalBimbinganTarget(bim);
                          setCatatanDosenInput(bim.catatanDosen || "");
                        }}
                      >
                        <Send className="h-3 w-3" />
                        {bim.status === "SELESAI" ? "Edit Catatan" : "Beri Arahan"}
                      </Button>
                    </div>
                  </div>

                  {/* Pertanyaan Mahasiswa */}
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground font-medium block mb-1">
                      Pertanyaan / Keterangan Mahasiswa:
                    </span>
                    <p className="text-xs text-foreground bg-muted p-3 rounded-[8px] border border-border leading-relaxed">
                      {bim.catatanMahasiswa}
                    </p>
                  </div>

                  {/* Arahan Dosen */}
                  {bim.catatanDosen && (
                    <div>
                      <span className="text-xs font-semibold text-primary font-medium block mb-1">
                        Arahan Dosen Wali:
                      </span>
                      <div className="text-xs text-foreground bg-primary-soft/70 p-3 rounded-[8px] border-l-4 border-primary leading-relaxed">
                        {bim.catatanDosen}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground rounded-[12px] border border-border bg-surface">
                Belum ada permohonan konsultasi dari mahasiswa bimbingan.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Beri Tanggapan Bimbingan */}
      <Dialog
        open={!!modalBimbinganTarget}
        onOpenChange={(open) => !open && setModalBimbinganTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Arahan Dosen Pembimbing Akademik
            </DialogTitle>
          </DialogHeader>

          {modalBimbinganTarget && (
            <form onSubmit={handleTanggapBimbinganSubmit} className="space-y-4 py-2">
              <div className="rounded-[8px] bg-muted p-3 text-xs border border-border space-y-1">
                <p>
                  <strong>Mahasiswa:</strong> {modalBimbinganTarget.namaMahasiswa} ({modalBimbinganTarget.nimMahasiswa})
                </p>
                <p>
                  <strong>Topik:</strong> {modalBimbinganTarget.topik}
                </p>
                <p className="text-muted-foreground mt-1 pt-1 border-t border-border">
                  &quot;{modalBimbinganTarget.catatanMahasiswa}&quot;
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Catatan Arahan / Rekomendasi Dosen Wali <span className="text-primary-dark">*</span>:
                </label>
                <textarea
                  value={catatanDosenInput}
                  onChange={(e) => setCatatanDosenInput(e.target.value)}
                  placeholder="Tuliskan saran perbaikan, arahan pemilihan mata kuliah, atau persetujuan topik studi..."
                  rows={4}
                  required
                  className="w-full rounded-[8px] border border-border p-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalBimbinganTarget(null)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !catatanDosenInput.trim()}
                  className="text-xs"
                >
                  Simpan Arahan
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Detail KRS Mahasiswa */}
      <Dialog open={!!detailTarget} onOpenChange={() => setDetailTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Rencana Studi: {detailTarget?.namaMahasiswa}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-2 text-xs bg-muted p-3 rounded-[8px] border border-border">
              <div>
                <span className="text-muted-foreground block">NIM Mahasiswa</span>
                <span className="font-sans font-semibold text-foreground">
                  {detailTarget?.nimMahasiswa}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">IPS Semester Lalu</span>
                <span className="font-semibold text-foreground">
                  {detailTarget?.ipsSemesterLalu.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Total SKS Diambil</span>
                <span className="font-bold text-primary">
                  {detailTarget?.totalSks} SKS
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Batas Maksimal SKS</span>
                <span className="font-semibold text-foreground">
                  {detailTarget?.batasSks} SKS
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground">
                Daftar Mata Kuliah yang Dipilih:
              </h4>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {detailTarget?.items.map((item) => (
                  <div
                    key={item.krsDetailId}
                    className="flex items-center justify-between p-2.5 rounded-[6px] border border-border text-xs bg-surface"
                  >
                    <div>
                      <span className="font-semibold text-foreground block">
                        {item.kelas.namaMataKuliah} (Kelas {item.kelas.kode})
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.kelas.jadwal[0]?.hari}{" "}
                        {item.kelas.jadwal[0]?.jamMulai}-{item.kelas.jadwal[0]?.jamSelesai} WIB •{" "}
                        {item.kelas.jadwal[0]?.namaRuang}
                      </span>
                    </div>
                    <Badge variant="secondary">{item.kelas.sks} SKS</Badge>
                  </div>
                ))}
              </div>
            </div>

            {detailTarget?.catatanWali && (
              <div className="text-xs p-2.5 rounded-[6px] bg-gray-soft border border-ink text-foreground">
                <strong>Catatan Sebelumnya:</strong> {detailTarget.catatanWali}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDetailTarget(null)}>
              Tutup
            </Button>
            {detailTarget?.status === "DIAJUKAN" && (
              <Button
                variant="default"
                onClick={() => detailTarget && handleApprove(detailTarget.id)}
                disabled={loading}
              >
                Setujui KRS Ini
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Tolak KRS dengan Catatan Alasan */}
      <Dialog open={!!rejectTarget} onOpenChange={() => setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Pengajuan KRS dengan Catatan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRejectSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Berikan catatan arahan perbaikan untuk mahasiswa:{" "}
              <strong className="text-foreground">{rejectTarget?.namaMahasiswa}</strong>
            </p>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Catatan Alasan Penolakan / Arahan Dosen Wali
              </label>
              <Input
                value={rejectCatatan}
                onChange={(e) => setRejectCatatan(e.target.value)}
                placeholder="Contoh: Beban SKS terlalu berat atau ada bentrok jadwal eksternal"
                required
              />
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setRejectTarget(null)}>
                Batal
              </Button>
              <Button variant="destructive" type="submit" disabled={loading}>
                Tolak & Minta Revisi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
