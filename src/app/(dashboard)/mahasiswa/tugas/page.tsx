"use client";

import React, { useState } from "react";
import {
  FolderArchive,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Upload,
  ExternalLink,
  Award,
  Send,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MateriTugasStore, TugasItem, PengumpulanTugasItem } from "@/features/materi-tugas/materi-tugas-store";
import { kumpulkanTugasAction } from "@/features/materi-tugas/actions";

export default function MahasiswaTugasPage() {
  const mahasiswaId = "mhs-1";

  const [activeTab, setActiveTab] = useState<"tugas" | "materi">("tugas");
  const daftarMateri = MateriTugasStore.getAllMateriByMahasiswa(mahasiswaId);
  const daftarTugas = MateriTugasStore.getTugasMahasiswa(mahasiswaId);

  // State Modal Kumpulkan Tugas
  const [targetTugas, setTargetTugas] = useState<TugasItem | null>(null);
  const [pathFile, setPathFile] = useState("");

  const [pesanNotif, setPesanNotif] = useState<{ teks: string; tipe: "sukses" | "galat" } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleKumpulkan = async () => {
    if (!targetTugas || !pathFile.trim()) {
      setPesanNotif({ teks: "Tautan atau nama berkas tugas wajib diisi.", tipe: "galat" });
      return;
    }

    setIsLoading(true);
    setPesanNotif(null);

    const res = await kumpulkanTugasAction({
      tugasId: targetTugas.id,
      pathFile: pathFile.trim(),
    });

    setIsLoading(false);
    if (res.success) {
      setTargetTugas(null);
      setPathFile("");
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
            Materi & Tugas Perkuliahan
          </h1>
          <p className="text-sm text-muted-foreground">
            Unduh bahan ajar kuliah, pantau tenggat waktu tugas, dan kumpulkan lembar jawaban secara digital.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-[8px] border border-border w-fit">
          <button
            onClick={() => setActiveTab("tugas")}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-colors ${
              activeTab === "tugas"
                ? "bg-surface text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Daftar Tugas ({daftarTugas.length})
          </button>
          <button
            onClick={() => setActiveTab("materi")}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-colors ${
              activeTab === "materi"
                ? "bg-surface text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FolderArchive className="h-3.5 w-3.5" />
            Materi Kuliah ({daftarMateri.length})
          </button>
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

      {/* TAB 1: DAFTAR TUGAS */}
      {activeTab === "tugas" && (
        <div className="space-y-4">
          {daftarTugas.length > 0 ? (
            daftarTugas.map((tugas) => {
              const kumpul = tugas.pengumpulan;
              const isSubmitted = !!kumpul;
              const isLate = kumpul?.terlambat;
              const hasScore = kumpul?.nilai !== null && kumpul?.nilai !== undefined;

              return (
                <Card key={tugas.id} className="border-border">
                  <CardHeader className="pb-3 border-b border-border">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-primary">
                            {tugas.kodeMataKuliah} (Kelas {tugas.kodeKelas})
                          </span>
                          <span className="text-border">|</span>
                          <span className="font-semibold text-xs text-muted-foreground">
                            {tugas.namaMataKuliah}
                          </span>
                        </div>
                        <CardTitle className="text-sm font-bold text-foreground mt-1">
                          {tugas.judul}
                        </CardTitle>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[11px] gap-1">
                          <Clock className="h-3 w-3" />
                          Tenggat: {tugas.tenggat.replace("T", " ")}
                        </Badge>
                        {isSubmitted ? (
                          <Badge variant={isLate ? "danger" : "success"} className="text-[11px]">
                            {isLate ? "Terkumpul Terlambat" : "Terkumpul Tepat Waktu"}
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="text-[11px]">
                            Belum Mengumpulkan
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {tugas.deskripsi}
                    </p>

                    {/* Jika Sudah Dikumpulkan */}
                    {isSubmitted && (
                      <div className="rounded-[8px] bg-muted p-3 text-xs border border-border space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div>
                            <span className="text-muted-foreground">Berkas Dikumpulkan: </span>
                            <a
                              href={kumpul.pathFile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-primary underline ml-1"
                            >
                              {kumpul.pathFile}
                            </a>
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            Waktu Kumpul: {kumpul.waktuKumpul}
                          </span>
                        </div>

                        {/* Nilai dan Catatan Dosen */}
                        {hasScore ? (
                          <div className="pt-2 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <span className="text-muted-foreground">Catatan Evaluasi Dosen: </span>
                              <span className="font-medium text-foreground">
                                &quot;{kumpul.catatanDosen || "Tugas telah diperiksa."}&quot;
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 font-bold text-success bg-success-soft px-2.5 py-1 rounded-[6px]">
                              <Award className="h-4 w-4" />
                              <span>Nilai: {kumpul.nilai} / 100</span>
                            </div>
                          </div>
                        ) : (
                          <div className="pt-1 text-[11px] text-muted-foreground italic">
                            Sedang dalam proses pemeriksaan oleh Dosen Pengampu.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tombol Kumpulkan / Kumpulkan Ulang */}
                    <div className="flex justify-end pt-1">
                      <Button
                        size="sm"
                        variant={isSubmitted ? "outline" : "default"}
                        onClick={() => {
                          setTargetTugas(tugas);
                          setPathFile(kumpul?.pathFile || "");
                        }}
                        className="gap-1.5 text-xs"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {isSubmitted ? "Kumpulkan Ulang (Perbarui)" : "Kumpulkan Jawaban"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-xs text-muted-foreground">
                Tidak ada tugas kuliah yang perlu dikerjakan saat ini.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: MATERI PERKULIAHAN */}
      {activeTab === "materi" && (
        <div className="space-y-3">
          {daftarMateri.length > 0 ? (
            daftarMateri.map((mat) => (
              <Card key={mat.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FolderArchive className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-bold text-xs text-primary">
                        {mat.kodeMataKuliah} (Kelas {mat.kodeKelas})
                      </span>
                      <span className="text-border">|</span>
                      <h3 className="font-semibold text-xs text-foreground">
                        {mat.judul}
                      </h3>
                      <Badge variant="secondary" className="text-[10px]">
                        {mat.ukuranMb} MB
                      </Badge>
                    </div>
                    {mat.deskripsi && (
                      <p className="text-xs text-muted-foreground pl-6">
                        {mat.deskripsi}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground pl-6">
                      Mata Kuliah: {mat.namaMataKuliah} • Diunggah: {mat.tanggalUpload} oleh {mat.diunggahOleh}
                    </p>
                  </div>

                  <a
                    href={mat.pathFile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <Button variant="outline" size="sm" className="gap-1 text-xs">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Unduh Materi
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-xs text-muted-foreground">
                Belum ada materi perkuliahan untuk kelas yang Anda ambil.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* MODAL KUMPULKAN TUGAS */}
      <Dialog open={!!targetTugas} onOpenChange={(open) => !open && setTargetTugas(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Upload className="h-5 w-5 text-primary" />
              Kumpulkan Tugas Perkuliahan
            </DialogTitle>
          </DialogHeader>

          {targetTugas && (
            <div className="space-y-4 py-2">
              <div className="rounded-[8px] bg-muted p-3 text-xs border border-border space-y-1">
                <p>
                  <strong>Mata Kuliah:</strong> {targetTugas.namaMataKuliah} ({targetTugas.kodeMataKuliah})
                </p>
                <p>
                  <strong>Tugas:</strong> {targetTugas.judul}
                </p>
                <p className="text-danger font-semibold">
                  Tenggat Waktu: {targetTugas.tenggat.replace("T", " ")}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Tautan Berkas Jawaban (Google Drive / GitHub / URL Berkas):
                </label>
                <Input
                  value={pathFile}
                  onChange={(e) => setPathFile(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="text-xs"
                />
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  Pastikan hak akses berkas telah disetel ke publik atau dapat diakses oleh dosen pengampu.
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setTargetTugas(null)}>
              Batal
            </Button>
            <Button
              variant="default"
              onClick={handleKumpulkan}
              disabled={isLoading || !pathFile.trim()}
              className="text-xs"
            >
              Kirim Jawaban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
