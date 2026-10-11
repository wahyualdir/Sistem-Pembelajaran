"use client";

import React, { useState } from "react";
import { KRSItem } from "../krs-store";
import { KelasItem } from "../../jadwal/jadwal-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  tambahKelasAction,
  hapusKelasAction,
  ajukanKrsAction,
} from "../actions";
import {
  Plus,
  Trash2,
  Send,
  Printer,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  User,
} from "lucide-react";

interface MahasiswaKrsViewProps {
  initialKrs: KRSItem;
  availableKelas: KelasItem[];
  isUktLunas: boolean;
  uktMessage?: string;
}

export function MahasiswaKrsView({
  initialKrs,
  availableKelas,
  isUktLunas,
  uktMessage,
}: MahasiswaKrsViewProps) {
  const [krs] = useState<KRSItem>(initialKrs);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  const [showConfirmAjukan, setShowConfirmAjukan] = useState(false);

  const selectedClassIds = new Set(krs.items.map((i) => i.kelasId));

  const handleTambah = async (kelasId: string) => {
    setLoading(true);
    setFeedback(null);
    setErrorFeedback(null);
    try {
      const res = await tambahKelasAction(kelasId);
      if (res.success) {
        setFeedback(res.message);
        window.location.reload();
      } else {
        setErrorFeedback(res.message || "Gagal menambahkan mata kuliah.");
      }
    } catch {
      setErrorFeedback("Terjadi kendala saat menambahkan kelas.");
    } finally {
      setLoading(false);
    }
  };

  const handleHapus = async (kelasId: string) => {
    setLoading(true);
    setFeedback(null);
    setErrorFeedback(null);
    try {
      const res = await hapusKelasAction(kelasId);
      if (res.success) {
        setFeedback(res.message);
        window.location.reload();
      } else {
        setErrorFeedback(res.message || "Gagal menghapus mata kuliah.");
      }
    } catch {
      setErrorFeedback("Terjadi kendala saat menghapus kelas.");
    } finally {
      setLoading(false);
    }
  };

  const handleAjukan = () => {
    setShowConfirmAjukan(true);
  };

  const executeAjukan = async () => {
    setShowConfirmAjukan(false);
    setLoading(true);
    setFeedback(null);
    setErrorFeedback(null);
    try {
      const res = await ajukanKrsAction();
      if (res.success) {
        setFeedback(res.message);
        window.location.reload();
      } else {
        setErrorFeedback(res.message || "Gagal mengajukan KRS.");
      }
    } catch {
      setErrorFeedback("Terjadi kendala saat mengajukan KRS.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isReadOnly = krs.status === "DIAJUKAN" || krs.status === "DISETUJUI";

  return (
    <div className="space-y-6">
      {/* Banner Peringatan UKT Belum Lunas (Bab 2.3) */}
      {!isUktLunas && (
        <div className="rounded-[8px] border border-danger-border bg-danger-soft p-4 text-danger flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Pengisian KRS Terkunci</h4>
            <p className="text-xs mt-1">
              {uktMessage ||
                "Tagihan UKT semester berjalan belum lunas. Selesaikan pembayaran atau ajukan dispensasi untuk membuka pengisian rencana studi."}
            </p>
          </div>
        </div>
      )}

      {/* Banner Notifikasi Aksi */}
      {feedback && (
        <div className="rounded-[8px] bg-success-soft border border-success-border p-3 text-xs text-success flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-semibold">
            Tutup
          </button>
        </div>
      )}

      {errorFeedback && (
        <div className="rounded-[8px] bg-danger-soft border border-danger-border p-3 text-xs text-danger flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorFeedback}</span>
        </div>
      )}

      {/* Header Info KRS & Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold font-medium text-muted-foreground">
                  Kartu Rencana Studi (KRS)
                </span>
                <StatusBadge status={krs.status} />
              </div>
              <h2 className="text-xl font-bold text-foreground">
                {krs.namaMahasiswa} ({krs.nimMahasiswa})
              </h2>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <span>Dosen Wali: <strong>{krs.namaDosenWali}</strong></span>
                <span>•</span>
                <span>Tahun Akademik: <strong>{krs.tahunAjaranKode}</strong></span>
              </p>
            </div>

            {/* Penghitung SKS Berjalan (Bab 7.7) */}
            <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
              <div>
                <span className="text-xs text-muted-foreground block">SKS Dipilih</span>
                <span className="text-2xl font-bold text-primary">{krs.totalSks}</span>
                <span className="text-xs text-muted-foreground font-medium"> SKS</span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block">Batas Maksimal</span>
                <span className="text-2xl font-bold text-foreground">{krs.batasSks}</span>
                <span className="text-xs text-muted-foreground font-medium"> SKS</span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block">Sisa Jatah</span>
                <span className="text-2xl font-bold text-success">
                  {krs.batasSks - krs.totalSks}
                </span>
                <span className="text-xs text-muted-foreground font-medium"> SKS</span>
              </div>
            </div>
          </div>

          {/* Catatan Dosen Wali jika ada */}
          {krs.catatanWali && (
            <div className="mt-4 rounded-[8px] bg-muted border border-border p-3 text-xs text-foreground">
              <span className="font-semibold text-primary">Catatan Dosen Wali: </span>
              {krs.catatanWali}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid 2 Kolom: Daftar Kelas Tersedia vs Keranjang KRS (Bab 7.7) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Kelas Tersedia (7 Kolom) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground text-base">
              Daftar Kelas Perkuliahan Tersedia
            </h3>
            <span className="text-xs text-muted-foreground">
              Pilih kelas yang sesuai jadwal Anda
            </span>
          </div>

          <div className="space-y-3">
            {availableKelas.map((kelas) => {
              const isSelected = selectedClassIds.has(kelas.id);
              const isFull = kelas.terisi >= kelas.kuota;

              return (
                <Card
                  key={kelas.id}
                  className={`transition-all ${
                    isSelected ? "border-primary bg-primary-tint/30" : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground text-sm">
                            {kelas.namaMataKuliah}
                          </span>
                          <Badge variant="secondary">Kelas {kelas.kode}</Badge>
                          <Badge variant="outline">{kelas.sks} SKS</Badge>
                        </div>

                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3 text-primary" />
                          <span>{kelas.namaDosen}</span>
                        </div>

                        <div className="space-y-0.5 pt-1">
                          {kelas.jadwal.map((j) => (
                            <div
                              key={j.id}
                              className="flex items-center gap-3 text-xs text-muted-foreground"
                            >
                              <span className="font-medium text-foreground">
                                {j.hari}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-primary" />
                                {j.jamMulai} - {j.jamSelesai} WIB
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                {j.namaRuang}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="text-[11px] text-muted-foreground pt-1">
                          Kuota:{" "}
                          <span
                            className={
                              isFull ? "font-bold text-danger" : "font-semibold text-foreground"
                            }
                          >
                            {kelas.terisi} / {kelas.kuota} Kursi
                          </span>
                          {isFull && <span className="text-danger ml-1">(Penuh)</span>}
                        </div>
                      </div>

                      <div>
                        {isSelected ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={isReadOnly || loading}
                            onClick={() => handleHapus(kelas.id)}
                            className="w-full sm:w-auto"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Batal
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            disabled={
                              !isUktLunas ||
                              isReadOnly ||
                              isFull ||
                              krs.totalSks + kelas.sks > krs.batasSks ||
                              loading
                            }
                            onClick={() => handleTambah(kelas.id)}
                            className="w-full sm:w-auto"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Ambil
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Kolom Kanan: Keranjang KRS Terpilih (5 Kolom) */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Rencana Studi Terpilih</CardTitle>
                <span className="text-xs font-semibold text-primary">
                  {krs.items.length} Mata Kuliah
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {krs.items.length === 0 ? (
                <div className="rounded-[8px] border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                  Belum ada kelas yang dipilih. Silakan pilih kelas dari daftar di sebelah kiri.
                </div>
              ) : (
                krs.items.map((item) => (
                  <div
                    key={item.krsDetailId}
                    className="flex items-center justify-between p-3 rounded-[8px] border border-border bg-muted"
                  >
                    <div>
                      <h4 className="font-semibold text-xs text-foreground">
                        {item.kelas.namaMataKuliah}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Kelas {item.kelas.kode} • {item.kelas.sks} SKS •{" "}
                        {item.kelas.jadwal[0]?.hari}{" "}
                        {item.kelas.jadwal[0]?.jamMulai}-{item.kelas.jadwal[0]?.jamSelesai}
                      </p>
                    </div>

                    {!isReadOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleHapus(item.kelasId)}
                        disabled={loading}
                        className="h-7 w-7 p-0 text-danger hover:text-danger hover:bg-danger-soft"
                        title="Hapus"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))
              )}

              {/* Tombol Aksi Ajukan & Cetak */}
              <div className="pt-3 border-t border-border space-y-2">
                {krs.status === "DRAF" || krs.status === "DITOLAK" ? (
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={handleAjukan}
                    disabled={krs.items.length === 0 || !isUktLunas || loading}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Ajukan KRS ke Dosen Wali
                  </Button>
                ) : null}

                {krs.status === "DIAJUKAN" && (
                  <div className="rounded-[8px] bg-warning-soft border border-warning-border p-3 text-center text-xs text-warning font-medium">
                    KRS sedang menunggu tinjauan dan persetujuan Dosen Wali Anda.
                  </div>
                )}

                {krs.status === "DISETUJUI" && (
                  <div className="space-y-2">
                    <div className="rounded-[8px] bg-success-soft border border-success-border p-3 text-center text-xs text-success font-medium">
                      KRS telah disetujui Dosen Wali resmi.
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handlePrint}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Cetak Kartu Rencana Studi (PDF)
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {showConfirmAjukan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white border-2 border-black rounded-xl p-5 shadow-retro space-y-4">
            <h3 className="font-heading font-black text-base text-black">Konfirmasi Pengajuan KRS</h3>
            <p className="text-xs text-black/80 leading-relaxed">
              Apakah Anda yakin ingin mengajukan rencana studi ini ke Dosen Pembimbing Akademik (Wali)? Setelah diajukan, perubahan mata kuliah memerlukan persetujuan dosen wali.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t-2 border-black">
              <Button variant="outline" size="sm" onClick={() => setShowConfirmAjukan(false)}>
                Batal
              </Button>
              <Button variant="default" size="sm" onClick={executeAjukan} disabled={loading}>
                {loading ? "Mengajukan..." : "Ya, Ajukan KRS"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
