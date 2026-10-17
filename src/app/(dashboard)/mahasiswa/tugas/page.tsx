"use client";

import React, { useState, useEffect } from "react";
import NextLink from "next/link";
import {
  FolderArchive,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Upload,
  Award,
  Link as LinkIcon,
  Download,
  Check,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileDropzone } from "@/components/ui/file-dropzone";
import {
  MateriTugasStore,
  MateriItem,
  MateriProgresItem,
} from "@/features/materi-tugas/materi-tugas-store";
import {
  kumpulkanTugasAction,
  dapatkanSignedUrlAction,
  ambilMateriMahasiswaAction,
  ambilTugasMahasiswaAction,
} from "@/features/materi-tugas/actions";
import {
  catatMateriDibukaAction,
  toggleMateriSelesaiAction,
  ambilProgresMahasiswaAction,
} from "@/features/materi-tugas/progres-actions";

type TugasMahasiswaItem = ReturnType<typeof MateriTugasStore.getTugasMahasiswa>[number];

export default function MahasiswaTugasPage() {
  const mahasiswaId = "mhs-1";

  const [activeTab, setActiveTab] = useState<"tugas" | "materi">("tugas");
  const [daftarMateri, setDaftarMateri] = useState<MateriItem[]>([]);
  const [daftarTugas, setDaftarTugas] = useState<TugasMahasiswaItem[]>([]);
  const [progresMap, setProgresMap] = useState<Record<string, MateriProgresItem>>({});
  const [persenProgresTotal, setPersenProgresTotal] = useState(0);
  const [totalMateriSelesai, setTotalMateriSelesai] = useState(0);

  // State Modal Kumpulkan Tugas
  const [targetTugas, setTargetTugas] = useState<TugasMahasiswaItem | null>(null);
  const [modeKumpul, setModeKumpul] = useState<"upload" | "link">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pathFileLink, setPathFileLink] = useState("");

  const [pesanNotif, setPesanNotif] = useState<{ teks: string; tipe: "sukses" | "galat" } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  const refreshData = () => {
    const materi = MateriTugasStore.getAllMateriByMahasiswa(mahasiswaId);
    const tugas = MateriTugasStore.getTugasMahasiswa(mahasiswaId);
    const prog = MateriTugasStore.getProgresMahasiswa(mahasiswaId);

    setDaftarMateri(materi);
    setDaftarTugas(tugas);
    setProgresMap(prog.progresMap);
    setPersenProgresTotal(prog.persenProgres);
    setTotalMateriSelesai(prog.materiSelesai);

    ambilMateriMahasiswaAction(mahasiswaId).then((res) => {
      if (res.success && res.materi) setDaftarMateri(res.materi);
    });
    ambilTugasMahasiswaAction(mahasiswaId).then((res) => {
      if (res.success && res.tugas) setDaftarTugas(res.tugas);
    });
    ambilProgresMahasiswaAction().then((res) => {
      if (res.success && res.data) {
        setProgresMap(res.data.progresMap);
        setPersenProgresTotal(res.data.persenProgres);
        setTotalMateriSelesai(res.data.materiSelesai);
      }
    });
  };

  useEffect(() => {
    refreshData();
  }, []);

  const totalMateri = daftarMateri.length;
  const totalTugas = daftarTugas.length;
  const totalTugasTerkumpul = daftarTugas.filter((t) => !!t.pengumpulan).length;

  const handleBukaUnduhBerkas = async (path: string, materiId?: string) => {
    if (materiId) {
      await catatMateriDibukaAction({ materiId });
      refreshData();
    }

    if (path.startsWith("http://") || path.startsWith("https://")) {
      window.open(path, "_blank", "noopener,noreferrer");
      return;
    }

    setLoadingActionId(path);
    const res = await dapatkanSignedUrlAction({ pathFile: path });
    setLoadingActionId(null);

    if (res.success && res.signedUrl) {
      window.open(res.signedUrl, "_blank", "noopener,noreferrer");
    } else {
      setPesanNotif({
        teks: res.message || "Gagal mendapatkan tautan berkas.",
        tipe: "galat",
      });
    }
  };

  const handleToggleSelesai = async (materiId: string) => {
    const isCurrentlySelesai = !!progresMap[materiId]?.selesai;
    setLoadingActionId(`toggle-${materiId}`);

    const res = await toggleMateriSelesaiAction({
      materiId,
      selesai: !isCurrentlySelesai,
    });
    setLoadingActionId(null);

    if (res.success) {
      refreshData();
      setPesanNotif({
        teks: isCurrentlySelesai
          ? "Status materi diubah menjadi belum selesai."
          : "Selamat! Materi berhasil ditandai selesai.",
        tipe: "sukses",
      });
    } else {
      setPesanNotif({
        teks: res.message || "Gagal mengubah status materi.",
        tipe: "galat",
      });
    }
  };

  const handleKumpulkan = async () => {
    if (!targetTugas) return;

    if (modeKumpul === "upload" && !selectedFile) {
      setPesanNotif({ teks: "Silakan pilih berkas jawaban tugas untuk diunggah.", tipe: "galat" });
      return;
    }

    if (modeKumpul === "link" && !pathFileLink.trim()) {
      setPesanNotif({ teks: "Tautan berkas tugas wajib diisi.", tipe: "galat" });
      return;
    }

    setIsLoading(true);
    setPesanNotif(null);

    let res;
    if (modeKumpul === "upload" && selectedFile) {
      const fd = new FormData();
      fd.append("tugasId", targetTugas.id);
      fd.append("file", selectedFile);
      res = await kumpulkanTugasAction(fd);
    } else {
      res = await kumpulkanTugasAction({
        tugasId: targetTugas.id,
        pathFile: pathFileLink.trim(),
      });
    }

    setIsLoading(false);
    if (res.success) {
      setTargetTugas(null);
      setSelectedFile(null);
      setPathFileLink("");
      refreshData();
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
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-colors min-h-[44px] ${
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
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-colors min-h-[44px] ${
              activeTab === "materi"
                ? "bg-surface text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FolderArchive className="h-3.5 w-3.5" />
            Materi Kuliah ({daftarMateri.length})
          </button>
          <NextLink
            href="/attendance"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-[6px] text-muted-foreground hover:text-foreground hover:bg-surface/60 transition-colors min-h-[44px]"
          >
            <Clock className="h-3.5 w-3.5" />
            Presensi Kuliah &rarr;
          </NextLink>
        </div>
      </div>

      {/* Ringkasan Progres Belajar Mahasiswa */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border p-4 bg-muted/40">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Progres Materi Belajar
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">
                  {persenProgresTotal}%
                </span>
                <span className="text-xs text-muted-foreground">
                  ({totalMateriSelesai} dari {totalMateri} materi diselesaikan)
                </span>
              </div>
            </div>
            <div className="h-10 w-10 rounded-full border border-border bg-surface flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="w-full h-2 rounded-full border border-border bg-muted overflow-hidden mt-3">
            <div
              className="bg-primary h-full transition-all duration-500 rounded-full"
              style={{ width: `${persenProgresTotal}%` }}
            />
          </div>
        </Card>

        <Card className="border-border p-4 bg-muted/40">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Pengumpulan Tugas
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">
                  {totalTugas > 0 ? Math.round((totalTugasTerkumpul / totalTugas) * 100) : 0}%
                </span>
                <span className="text-xs text-muted-foreground">
                  ({totalTugasTerkumpul} dari {totalTugas} tugas terkumpul)
                </span>
              </div>
            </div>
            <div className="h-10 w-10 rounded-full border border-border bg-surface flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-ink" />
            </div>
          </div>
          <div className="w-full h-2 rounded-full border border-border bg-muted overflow-hidden mt-3">
            <div
              className="bg-gray-dark h-full transition-all duration-500 rounded-full"
              style={{ width: `${totalTugas > 0 ? (totalTugasTerkumpul / totalTugas) * 100 : 0}%` }}
            />
          </div>
        </Card>
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

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs gap-1">
                          <Clock className="h-3 w-3" />
                          Tenggat: {tugas.tenggat.replace("T", " ")}
                        </Badge>
                        {isSubmitted ? (
                          <Badge variant={isLate ? "danger" : "success"} className="text-xs">
                            {isLate ? "Terkumpul Terlambat" : "Terkumpul Tepat Waktu"}
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="text-xs">
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
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-muted-foreground">Berkas Jawaban:</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleBukaUnduhBerkas(kumpul.pathFile)}
                              disabled={loadingActionId === kumpul.pathFile}
                              className="text-xs gap-1.5 h-7 min-h-[36px]"
                            >
                              <Download className="h-3.5 w-3.5 text-primary" />
                              <span>Unduh / Buka Jawaban</span>
                            </Button>
                          </div>
                          <span className="text-xs text-muted-foreground">
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
                            <div className="flex items-center gap-1.5 font-bold text-ink bg-surface px-2.5 py-1 rounded-[6px]">
                              <Award className="h-4 w-4" />
                              <span>Nilai: {kumpul.nilai} / 100</span>
                            </div>
                          </div>
                        ) : (
                          <div className="pt-1 text-xs text-muted-foreground italic">
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
                          setSelectedFile(null);
                          setPathFileLink(kumpul?.pathFile || "");
                          setModeKumpul(
                            kumpul?.pathFile?.startsWith("http") ? "link" : "upload"
                          );
                        }}
                        className="gap-1.5 text-xs min-h-[44px]"
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
            daftarMateri.map((mat) => {
              const progres = progresMap[mat.id];
              const isSelesai = !!progres?.selesai;
              const isActionLoading = loadingActionId === `toggle-${mat.id}`;

              return (
                <Card key={mat.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <FolderArchive className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-bold text-xs text-primary">
                          {mat.kodeMataKuliah} (Kelas {mat.kodeKelas})
                        </span>
                        <span className="text-border">|</span>
                        <h3 className="font-semibold text-xs text-foreground">
                          {mat.judul}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {mat.ukuranMb} MB
                        </Badge>
                        {isSelesai ? (
                          <Badge variant="success" className="text-xs gap-1">
                            <Check className="h-3 w-3" />
                            Selesai
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Belum Selesai
                          </Badge>
                        )}
                      </div>
                      {mat.deskripsi && (
                        <p className="text-xs text-muted-foreground pl-6">
                          {mat.deskripsi}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground pl-6">
                        Mata Kuliah: {mat.namaMataKuliah} • Diunggah: {mat.tanggalUpload} oleh {mat.diunggahOleh}
                        {progres?.terakhirDibuka && (
                          <span className="ml-2 font-medium text-foreground">
                            • Terakhir dibuka: {new Date(progres.terakhirDibuka).toLocaleDateString("id-ID")}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBukaUnduhBerkas(mat.pathFile, mat.id)}
                        disabled={loadingActionId === mat.pathFile}
                        className="gap-1 text-xs min-h-[44px]"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Unduh / Buka</span>
                      </Button>

                      <Button
                        variant={isSelesai ? "ghost" : "default"}
                        size="sm"
                        onClick={() => handleToggleSelesai(mat.id)}
                        disabled={isActionLoading}
                        className="gap-1 text-xs min-h-[44px]"
                      >
                        {isSelesai ? (
                          <>
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Batal Selesai</span>
                          </>
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Tandai Selesai</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
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
            <DialogTitle className="flex items-center gap-2 text-sm font-bold">
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
                <p className="text-primary-dark font-semibold">
                  Tenggat Waktu: {targetTugas.tenggat.replace("T", " ")}
                </p>
              </div>

              {/* Mode Pilihan: Unggah Berkas Nyata vs Tempel Tautan */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground block">
                  Metode Pengumpulan Berkas:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModeKumpul("upload")}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-semibold transition-colors min-h-[44px] ${
                      modeKumpul === "upload"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-surface text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    <span>Unggah Berkas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModeKumpul("link")}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-semibold transition-colors min-h-[44px] ${
                      modeKumpul === "link"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-surface text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <LinkIcon className="h-4 w-4" />
                    <span>Tempel Tautan</span>
                  </button>
                </div>
              </div>

              {modeKumpul === "upload" ? (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Pilih Berkas Jawaban (Maks 10MB):
                  </label>
                  <FileDropzone
                    kategori="tugas"
                    selectedFile={selectedFile}
                    onFileSelect={setSelectedFile}
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Tautan Berkas Jawaban (Google Drive / GitHub / URL Berkas):
                  </label>
                  <Input
                    value={pathFileLink}
                    onChange={(e) => setPathFileLink(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="text-xs min-h-[44px]"
                  />
                  <span className="text-xs text-muted-foreground mt-1 block">
                    Pastikan hak akses berkas telah disetel ke publik atau dapat diakses oleh dosen pengampu.
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setTargetTugas(null)}
              className="min-h-[44px]"
            >
              Batal
            </Button>
            <Button
              variant="default"
              onClick={handleKumpulkan}
              disabled={
                isLoading ||
                (modeKumpul === "upload" && !selectedFile) ||
                (modeKumpul === "link" && !pathFileLink.trim())
              }
              className="text-xs min-h-[44px]"
            >
              {isLoading ? "Mengirim..." : "Kirim Jawaban"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
