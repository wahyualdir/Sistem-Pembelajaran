"use client";

import React, { useState, useEffect } from "react";
import {
  FolderArchive,
  Plus,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Upload,
  ExternalLink,
  Users,
  Award,
  Trash2,
  Download,
  BarChart2,
  FileSpreadsheet,
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
import { FileDropzone } from "@/components/ui/file-dropzone";
import { JadwalStore } from "@/features/jadwal/jadwal-store";
import {
  MateriTugasStore,
  MateriItem,
  TugasItem,
  PengumpulanTugasItem,
} from "@/features/materi-tugas/materi-tugas-store";
import type { RekapProgresKelas } from "@/lib/akademik/hitung-progres";
import {
  tambahMateriAction,
  tambahTugasAction,
  beriNilaiTugasAction,
  hapusMateriAction,
  dapatkanSignedUrlAction,
  ambilMateriByKelasAction,
  ambilTugasByKelasAction,
  ambilPengumpulanByTugasAction,
} from "@/features/materi-tugas/actions";
import { ambilRekapProgresDosenAction } from "@/features/materi-tugas/progres-actions";

export default function DosenMateriTugasPage() {
  const dosenId = "dsn-1";
  const daftarKelas = JadwalStore.getKelasByDosen(dosenId);

  const [selectedKelasId, setSelectedKelasId] = useState<string>(
    daftarKelas[0]?.id || "kls-tif101-a"
  );
  const kelas = JadwalStore.getKelasById(selectedKelasId);

  const [activeTab, setActiveTab] = useState<"materi" | "tugas" | "progres">("materi");

  const [daftarMateri, setDaftarMateri] = useState<MateriItem[]>(() =>
    MateriTugasStore.getMateriByKelas(selectedKelasId)
  );
  const [daftarTugas, setDaftarTugas] = useState<TugasItem[]>(() =>
    MateriTugasStore.getTugasByKelas(selectedKelasId)
  );
  const [rekapProgres, setRekapProgres] = useState<RekapProgresKelas>(() =>
    MateriTugasStore.getRekapProgresKelas(selectedKelasId)
  );

  const refreshData = (kId = selectedKelasId) => {
    ambilMateriByKelasAction(kId).then((res) => {
      if (res.success && res.materi) setDaftarMateri(res.materi);
    });
    ambilTugasByKelasAction(kId).then((res) => {
      if (res.success && res.tugas) setDaftarTugas(res.tugas);
    });
    ambilRekapProgresDosenAction(kId).then((res) => {
      if (res.success && res.rekap) setRekapProgres(res.rekap);
    });
  };

  useEffect(() => {
    refreshData(selectedKelasId);
  }, [selectedKelasId]);

  // State Modal Tambah Materi
  const [isMateriModalOpen, setIsMateriModalOpen] = useState(false);
  const [judulMateri, setJudulMateri] = useState("");
  const [deskripsiMateri, setDeskripsiMateri] = useState("");
  const [linkMateri, setLinkMateri] = useState("");
  const [modeUnggahMateri, setModeUnggahMateri] = useState<"file" | "link">("file");
  const [selectedFileMateri, setSelectedFileMateri] = useState<File | null>(null);

  // State Modal Tambah Tugas
  const [isTugasModalOpen, setIsTugasModalOpen] = useState(false);
  const [judulTugas, setJudulTugas] = useState("");
  const [deskripsiTugas, setDeskripsiTugas] = useState("");
  const [tenggatTugas, setTenggatTugas] = useState("2026-10-30T23:59");

  // State Modal Pengumpulan & Penilaian Tugas
  const [viewTugasTarget, setViewTugasTarget] = useState<TugasItem | null>(null);
  const [daftarPengumpulan, setDaftarPengumpulan] = useState<PengumpulanTugasItem[]>([]);
  const [nilaiTarget, setNilaiTarget] = useState<PengumpulanTugasItem | null>(null);
  const [inputNilai, setInputNilai] = useState<number>(85);
  const [inputCatatan, setInputCatatan] = useState("");

  useEffect(() => {
    if (viewTugasTarget) {
      setDaftarPengumpulan(MateriTugasStore.getPengumpulanByTugas(viewTugasTarget.id));
      ambilPengumpulanByTugasAction(viewTugasTarget.id).then((res) => {
        if (res.success && res.pengumpulan) {
          setDaftarPengumpulan(res.pengumpulan);
        }
      });
    } else {
      setDaftarPengumpulan([]);
    }
  }, [viewTugasTarget]);

  const [pesanNotif, setPesanNotif] = useState<{ teks: string; tipe: "sukses" | "galat" } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Helper buka signed URL berkas
  const handleBukaBerkas = async (pathFile: string) => {
    if (!pathFile) return;
    if (pathFile.startsWith("http://") || pathFile.startsWith("https://")) {
      window.open(pathFile, "_blank");
      return;
    }

    setIsLoading(true);
    const res = await dapatkanSignedUrlAction({ pathFile });
    setIsLoading(false);

    if (res.success && res.signedUrl) {
      window.open(res.signedUrl, "_blank");
    } else {
      setPesanNotif({ teks: res.message || "Gagal membuka berkas.", tipe: "galat" });
    }
  };

  // Tambah Materi
  const handleTambahMateri = async () => {
    if (!judulMateri.trim()) {
      setPesanNotif({ teks: "Judul materi wajib diisi.", tipe: "galat" });
      return;
    }

    if (modeUnggahMateri === "file" && !selectedFileMateri) {
      setPesanNotif({ teks: "Pilih berkas materi untuk diunggah.", tipe: "galat" });
      return;
    }

    if (modeUnggahMateri === "link" && !linkMateri.trim()) {
      setPesanNotif({ teks: "Tautan berkas materi wajib diisi.", tipe: "galat" });
      return;
    }

    setIsLoading(true);
    setPesanNotif(null);

    const formData = new FormData();
    formData.append("kelasId", selectedKelasId);
    formData.append("judul", judulMateri.trim());
    if (deskripsiMateri.trim()) {
      formData.append("deskripsi", deskripsiMateri.trim());
    }

    if (modeUnggahMateri === "file" && selectedFileMateri) {
      formData.append("file", selectedFileMateri);
    } else {
      formData.append("pathFile", linkMateri.trim());
    }

    const res = await tambahMateriAction(formData);

    setIsLoading(false);
    if (res.success) {
      setIsMateriModalOpen(false);
      setJudulMateri("");
      setDeskripsiMateri("");
      setLinkMateri("");
      setSelectedFileMateri(null);
      setPesanNotif({ teks: res.message, tipe: "sukses" });
      if (res.materi) {
        setDaftarMateri((prev) => [res.materi, ...prev]);
      }
      refreshData(selectedKelasId);
    } else {
      setPesanNotif({ teks: res.message, tipe: "galat" });
    }
  };

  // Hapus Materi
  const handleHapusMateri = async (materiId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus materi ini beserta berkasnya?")) {
      return;
    }

    setIsLoading(true);
    const res = await hapusMateriAction({ materiId, kelasId: selectedKelasId });
    setIsLoading(false);

    if (res.success) {
      setDaftarMateri((prev) => prev.filter((m) => m.id !== materiId));
      setPesanNotif({ teks: res.message, tipe: "sukses" });
      refreshData(selectedKelasId);
    } else {
      setPesanNotif({ teks: res.message, tipe: "galat" });
    }
  };

  // Tambah Tugas
  const handleTambahTugas = async () => {
    if (!judulTugas.trim() || !deskripsiTugas.trim() || !tenggatTugas) {
      setPesanNotif({ teks: "Judul, deskripsi, dan batas tenggat wajib diisi.", tipe: "galat" });
      return;
    }

    setIsLoading(true);
    setPesanNotif(null);

    const res = await tambahTugasAction({
      kelasId: selectedKelasId,
      judul: judulTugas.trim(),
      deskripsi: deskripsiTugas.trim(),
      tenggat: tenggatTugas,
    });

    setIsLoading(false);
    if (res.success) {
      setIsTugasModalOpen(false);
      setJudulTugas("");
      setDeskripsiTugas("");
      setPesanNotif({ teks: res.message, tipe: "sukses" });
    } else {
      setPesanNotif({ teks: res.message, tipe: "galat" });
    }
  };

  // Simpan Penilaian Tugas Mahasiswa
  const handleSimpanNilai = async () => {
    if (!nilaiTarget) return;

    if (inputNilai < 0 || inputNilai > 100) {
      setPesanNotif({ teks: "Nilai harus berada dalam rentang 0 - 100.", tipe: "galat" });
      return;
    }

    if (!inputCatatan.trim()) {
      setPesanNotif({ teks: "Catatan evaluasi wajib diisi untuk mahasiswa.", tipe: "galat" });
      return;
    }

    setIsLoading(true);
    setPesanNotif(null);

    const res = await beriNilaiTugasAction({
      pengumpulanId: nilaiTarget.id,
      nilai: Number(inputNilai),
      catatanDosen: inputCatatan.trim(),
    });

    setIsLoading(false);
    if (res.success) {
      try {
        MateriTugasStore.beriNilaiTugas({
          pengumpulanId: nilaiTarget.id,
          nilai: Number(inputNilai),
          catatanDosen: inputCatatan.trim(),
        });
      } catch {
        // Fallback
      }
      setDaftarPengumpulan((prev) =>
        prev.map((p) =>
          p.id === nilaiTarget.id
            ? { ...p, nilai: Number(inputNilai), catatanDosen: inputCatatan.trim() }
            : p
        )
      );
      setNilaiTarget(null);
      setInputCatatan("");
      setPesanNotif({ teks: res.message, tipe: "sukses" });
    } else {
      setPesanNotif({ teks: res.message, tipe: "galat" });
    }
  };

  // Ekspor Rekap Progres Mahasiswa ke CSV
  const handleEksporCsvProgres = () => {
    if (!rekapProgres || rekapProgres.daftarMahasiswa.length === 0) {
      setPesanNotif({ teks: "Tidak ada data mahasiswa untuk diekspor.", tipe: "galat" });
      return;
    }

    const headers = "NIM,Nama Mahasiswa,Total Materi,Materi Selesai,Persentase Progres,Tugas Terkumpul,Status Keaktifan";
    const rows = rekapProgres.daftarMahasiswa.map((m: RekapProgresKelas['daftarMahasiswa'][number]) => {
      const status = m.perluPerhatian ? "Perlu Perhatian (<50%)" : m.persenProgres === 100 ? "Tuntas (100%)" : "Aktif";
      return `"${m.nim}","${m.nama}",${m.totalMateri},${m.materiSelesai},"${m.persenProgres}%",${m.tugasTerkumpul},"${status}"`;
    });

    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `rekap-progres-${kelas?.kodeMataKuliah || "kelas"}-${kelas?.kode || "A"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setPesanNotif({ teks: "Berkas rekap progres CSV berhasil diunduh.", tipe: "sukses" });
  };

  const pengumpulanList = daftarPengumpulan;

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FolderArchive className="h-6 w-6 text-primary" />
            Materi Perkuliahan & Pengumpulan Tugas
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Kelola berkas materi Supabase Storage, pantau progres belajar, dan nilai tugas mahasiswa.
          </p>
        </div>

        {/* Pilihan Rombongan Kelas */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
            Kelas:
          </label>
          <select
            value={selectedKelasId}
            onChange={(e) => setSelectedKelasId(e.target.value)}
            className="rounded border-2 border-black bg-white px-3 py-1.5 text-xs font-bold text-foreground shadow-retro-sm focus:outline-none"
          >
            {daftarKelas.map((k) => (
              <option key={k.id} value={k.id}>
                {k.kodeMataKuliah} - {k.namaMataKuliah} (Kls {k.kode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* NOTIFIKASI FEEDBACK */}
      {pesanNotif && (
        <div
          className={`p-3 text-xs rounded border-2 border-black flex items-center gap-2 shadow-retro-sm ${
            pesanNotif.tipe === "sukses"
              ? "bg-retro-warm text-black"
              : "bg-retro-warm text-danger"
          }`}
        >
          {pesanNotif.tipe === "sukses" ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0 text-danger" />
          )}
          <span className="font-bold">{pesanNotif.teks}</span>
        </div>
      )}

      {/* KARTU RINGKASAN KELAS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Materi Terbit</p>
              <h3 className="text-lg font-bold text-foreground mt-0.5">{daftarMateri.length} Modul</h3>
            </div>
            <FileText className="h-7 w-7 text-primary/70" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Tugas Aktif</p>
              <h3 className="text-lg font-bold text-foreground mt-0.5">{daftarTugas.length} Tugas</h3>
            </div>
            <Clock className="h-7 w-7 text-retro-orange/70" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Rata-Rata Progres</p>
              <h3 className="text-lg font-bold text-foreground mt-0.5">{rekapProgres.rataRataProgres}%</h3>
            </div>
            <BarChart2 className="h-7 w-7 text-retro-green/70" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Perlu Perhatian</p>
              <h3 className="text-lg font-bold text-foreground mt-0.5">
                {rekapProgres.mahasiswaPerluPerhatian} Mahasiswa
              </h3>
            </div>
            <AlertTriangle className="h-7 w-7 text-danger/70" />
          </CardContent>
        </Card>
      </div>

      {/* TAB NAVIGASI */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-2 border-black/20 pb-2 gap-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={activeTab === "materi" ? "default" : "outline"}
            onClick={() => setActiveTab("materi")}
            className="text-xs font-bold"
          >
            Modul & Materi ({daftarMateri.length})
          </Button>
          <Button
            size="sm"
            variant={activeTab === "tugas" ? "default" : "outline"}
            onClick={() => setActiveTab("tugas")}
            className="text-xs font-bold"
          >
            Tugas & Evaluasi ({daftarTugas.length})
          </Button>
          <Button
            size="sm"
            variant={activeTab === "progres" ? "default" : "outline"}
            onClick={() => setActiveTab("progres")}
            className="text-xs font-bold gap-1.5"
          >
            <BarChart2 className="h-3.5 w-3.5" />
            Rekap Progres ({rekapProgres.totalMahasiswa} Mhs)
          </Button>
        </div>

        {activeTab === "materi" && (
          <Button
            size="sm"
            onClick={() => setIsMateriModalOpen(true)}
            className="gap-1.5 text-xs font-bold shadow-retro-sm"
          >
            <Plus className="h-4 w-4" />
            Unggah Materi Baru
          </Button>
        )}

        {activeTab === "tugas" && (
          <Button
            size="sm"
            onClick={() => setIsTugasModalOpen(true)}
            className="gap-1.5 text-xs font-bold shadow-retro-sm"
          >
            <Plus className="h-4 w-4" />
            Buat Tugas Baru
          </Button>
        )}

        {activeTab === "progres" && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleEksporCsvProgres}
            className="gap-1.5 text-xs font-bold shadow-retro-sm"
          >
            <FileSpreadsheet className="h-4 w-4 text-retro-green" />
            Ekspor Rekap Progres (CSV)
          </Button>
        )}
      </div>

      {/* TAB 1: MATERI */}
      {activeTab === "materi" && (
        <div className="space-y-3">
          {daftarMateri.length > 0 ? (
            daftarMateri.map((mat) => {
              const progresMateri = MateriTugasStore.getProgresMateri(mat.id);
              const isStorageFile = !mat.pathFile.startsWith("http://") && !mat.pathFile.startsWith("https://");

              return (
                <Card key={mat.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <FolderArchive className="h-4 w-4 text-primary shrink-0" />
                        <h3 className="font-semibold text-sm text-foreground truncate">
                          {mat.judul}
                        </h3>
                        <Badge variant="secondary" className="text-2xs font-mono">
                          {mat.ukuranMb} MB
                        </Badge>
                        {isStorageFile && (
                          <Badge variant="outline" className="text-2xs font-mono bg-retro-warm">
                            Cloud Storage
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-2xs font-mono">
                          {progresMateri.selesaiCount}/{progresMateri.totalMahasiswa} Mahasiswa Selesai ({progresMateri.persen}%)
                        </Badge>
                      </div>

                      {mat.deskripsi && (
                        <p className="text-xs text-muted-foreground pl-6">
                          {mat.deskripsi}
                        </p>
                      )}
                      <p className="text-2xs text-muted-foreground pl-6">
                        Diunggah oleh: {mat.diunggahOleh} • Tanggal: {mat.tanggalUpload}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBukaBerkas(mat.pathFile)}
                        disabled={isLoading}
                        className="gap-1 text-xs"
                      >
                        {isStorageFile ? <Download className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
                        {isStorageFile ? "Unduh / Pratinjau" : "Buka Tautan"}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleHapusMateri(mat.id)}
                        disabled={isLoading}
                        className="gap-1 text-xs text-danger hover:bg-danger hover:text-white"
                        title="Hapus materi"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Hapus
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-xs text-muted-foreground">
                Belum ada materi perkuliahan diunggah untuk kelas ini. Klik &quot;Unggah Materi Baru&quot; di atas.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: TUGAS */}
      {activeTab === "tugas" && (
        <div className="space-y-3">
          {daftarTugas.length > 0 ? (
            daftarTugas.map((tug) => {
              const kumpulCount = MateriTugasStore.getPengumpulanByTugas(tug.id).length;

              return (
                <Card key={tug.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-retro-orange shrink-0" />
                        <h3 className="font-semibold text-sm text-foreground">
                          {tug.judul}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground pl-6 leading-relaxed">
                        {tug.deskripsi}
                      </p>
                      <div className="flex items-center gap-3 pl-6 text-xs text-muted-foreground pt-1">
                        <span className="flex items-center gap-1 font-medium text-danger">
                          <Clock className="h-3.5 w-3.5" />
                          Tenggat: {tug.tenggat.replace("T", " ")}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-semibold text-foreground">
                          <Users className="h-3.5 w-3.5" />
                          {kumpulCount} Mahasiswa Mengumpulkan
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => setViewTugasTarget(tug)}
                        className="gap-1.5 text-xs"
                      >
                        <Users className="h-3.5 w-3.5" />
                        Lihat Pengumpulan ({kumpulCount})
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-xs text-muted-foreground">
                Belum ada tugas dibuat untuk kelas ini. Klik &quot;Buat Tugas Baru&quot; di atas.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* TAB 3: REKAP PROGRES MAHASISWA */}
      {activeTab === "progres" && (
        <Card>
          <CardHeader className="p-4 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-primary" />
                Daftar Progres Belajar Mahasiswa
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                Total Mahasiswa: {rekapProgres.totalMahasiswa} • Rata-rata Progres: {rekapProgres.rataRataProgres}%
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {rekapProgres.daftarMahasiswa.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">NIM</TableHead>
                    <TableHead className="text-xs">Nama Mahasiswa</TableHead>
                    <TableHead className="text-xs text-center">Materi Selesai</TableHead>
                    <TableHead className="text-xs text-center">Persentase</TableHead>
                    <TableHead className="text-xs text-center">Tugas Kumpul</TableHead>
                    <TableHead className="text-xs">Status Keaktifan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rekapProgres.daftarMahasiswa.map((mhs: RekapProgresKelas['daftarMahasiswa'][number]) => (
                    <TableRow key={mhs.mahasiswaId}>
                      <TableCell className="text-xs font-mono font-bold">{mhs.nim}</TableCell>
                      <TableCell className="text-xs font-medium">{mhs.nama}</TableCell>
                      <TableCell className="text-xs text-center font-bold">
                        {mhs.materiSelesai} / {mhs.totalMateri}
                      </TableCell>
                      <TableCell className="text-xs text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 rounded-full border border-black bg-retro-warm overflow-hidden inline-block">
                            <div
                              className="bg-black h-full rounded-full transition-all"
                              style={{ width: `${mhs.persenProgres}%` }}
                            />
                          </div>
                          <span className="font-bold text-xs">{mhs.persenProgres}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-center font-bold">
                        {mhs.tugasTerkumpul} / {mhs.totalTugas}
                      </TableCell>
                      <TableCell className="text-xs">
                        {mhs.perluPerhatian ? (
                          <Badge variant="danger" className="text-2xs font-bold gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Perlu Perhatian (&lt;50%)
                          </Badge>
                        ) : mhs.persenProgres === 100 ? (
                          <Badge variant="success" className="text-2xs font-bold gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Tuntas 100%
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-2xs font-bold">
                            Aktif
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Belum ada mahasiswa aktif terdaftar di kelas ini.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* MODAL LIHAT PENGUMPULAN TUGAS */}
      <Dialog
        open={viewTugasTarget !== null}
        onOpenChange={(open) => !open && setViewTugasTarget(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Users className="h-5 w-5 text-primary" />
              Daftar Pengumpulan Tugas: {viewTugasTarget?.judul}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="text-xs text-muted-foreground border-b pb-2">
              <p>Tenggat Waktu: {viewTugasTarget?.tenggat.replace("T", " ")}</p>
              <p>Total Pengumpulan Masuk: {pengumpulanList.length} berkas</p>
            </div>

            {pengumpulanList.length > 0 ? (
              <div className="rounded border overflow-x-auto max-h-80">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">NIM / Mahasiswa</TableHead>
                      <TableHead className="text-xs">Waktu Kumpul</TableHead>
                      <TableHead className="text-xs">Berkas</TableHead>
                      <TableHead className="text-xs text-center">Nilai</TableHead>
                      <TableHead className="text-xs text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pengumpulanList.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs">
                          <p className="font-bold text-foreground">{item.namaMahasiswa}</p>
                          <p className="text-2xs text-muted-foreground font-mono">{item.nim}</p>
                        </TableCell>
                        <TableCell className="text-xs">
                          <p>{item.waktuKumpul}</p>
                          {item.terlambat ? (
                            <Badge variant="danger" className="text-2xs mt-0.5">
                              Terlambat
                            </Badge>
                          ) : (
                            <Badge variant="success" className="text-2xs mt-0.5">
                              Tepat Waktu
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBukaBerkas(item.pathFile)}
                            className="text-2xs gap-1"
                          >
                            <Download className="h-3 w-3" />
                            Unduh Berkas
                          </Button>
                        </TableCell>
                        <TableCell className="text-xs text-center">
                          {item.nilai !== null ? (
                            <span className="font-bold text-success bg-success-soft px-2 py-0.5 rounded">
                              {item.nilai}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic text-2xs">Belum dinilai</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setNilaiTarget(item);
                              setInputNilai(item.nilai || 85);
                              setInputCatatan(item.catatanDosen || "");
                            }}
                            className="text-xs gap-1"
                          >
                            <Award className="h-3 w-3" />
                            {item.nilai !== null ? "Ubah Nilai" : "Beri Nilai"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground border rounded">
                Belum ada mahasiswa yang mengumpulkan tugas ini.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewTugasTarget(null)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL BERI NILAI */}
      <Dialog
        open={nilaiTarget !== null}
        onOpenChange={(open) => !open && setNilaiTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Award className="h-5 w-5 text-success" />
              Evaluasi & Nilai Pengumpulan Tugas
            </DialogTitle>
          </DialogHeader>

          {nilaiTarget && (
            <div className="space-y-3 py-2 text-xs">
              {pesanNotif && pesanNotif.tipe === "galat" && (
                <div className="p-2.5 rounded border border-danger/30 bg-danger/10 text-danger text-xs font-semibold">
                  {pesanNotif.teks}
                </div>
              )}
              <div className="rounded bg-muted p-2.5 border space-y-1">
                <p>
                  <strong>Mahasiswa:</strong> {nilaiTarget.namaMahasiswa} ({nilaiTarget.nim})
                </p>
                <p>
                  <strong>Status Waktu:</strong>{" "}
                  {nilaiTarget.terlambat ? "Terlambat Mengumpulkan" : "Tepat Waktu"}
                </p>
                <p>
                  <strong>Berkas Jawaban:</strong>{" "}
                  <button
                    type="button"
                    onClick={() => handleBukaBerkas(nilaiTarget.pathFile)}
                    className="text-primary underline ml-1 font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="h-3 w-3" />
                    Unduh Berkas Mahasiswa
                  </button>
                </p>
              </div>

              <div>
                <label className="font-semibold block mb-1">
                  Nilai Angka (0 - 100):
                </label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={inputNilai}
                  onChange={(e) => setInputNilai(Number(e.target.value))}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">
                  Catatan Evaluasi / Umpan Balik Dosen:
                </label>
                <textarea
                  value={inputCatatan}
                  onChange={(e) => setInputCatatan(e.target.value)}
                  placeholder="Berikan umpan balik terkait solusi yang diserahkan..."
                  rows={3}
                  className="w-full rounded border border-border p-2.5 text-xs text-foreground focus:outline-none"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setNilaiTarget(null)}>
              Batal
            </Button>
            <Button
              variant="default"
              onClick={handleSimpanNilai}
              disabled={isLoading}
              className="text-xs"
            >
              Simpan Penilaian
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL UNGGAH MATERI BARU (SUPABASE STORAGE & LINK) */}
      <Dialog open={isMateriModalOpen} onOpenChange={setIsMateriModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold">
              <Upload className="h-5 w-5 text-primary" />
              Unggah Materi Perkuliahan
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Judul Materi / Modul:
              </label>
              <Input
                value={judulMateri}
                onChange={(e) => setJudulMateri(e.target.value)}
                placeholder="Misal: Modul 03 - Normalisasi Basis Data"
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Deskripsi Singkat (Opsional):
              </label>
              <textarea
                value={deskripsiMateri}
                onChange={(e) => setDeskripsiMateri(e.target.value)}
                placeholder="Rangkuman topik bahasan materi..."
                rows={2}
                className="w-full rounded border border-border p-2.5 text-xs text-foreground focus:outline-none"
              />
            </div>

            {/* Pilihan Metode: Upload Berkas Nyata vs Tempel Link */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground block">
                Metode Penyediaan Berkas:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setModeUnggahMateri("file")}
                  className={`h-9 px-3 rounded border-2 border-black text-xs font-bold transition-all ${
                    modeUnggahMateri === "file"
                      ? "bg-retro-yellow text-black shadow-retro-sm"
                      : "bg-white text-black hover:bg-retro-warm"
                  }`}
                >
                  Unggah Berkas Baru
                </button>
                <button
                  type="button"
                  onClick={() => setModeUnggahMateri("link")}
                  className={`h-9 px-3 rounded border-2 border-black text-xs font-bold transition-all ${
                    modeUnggahMateri === "link"
                      ? "bg-retro-yellow text-black shadow-retro-sm"
                      : "bg-white text-black hover:bg-retro-warm"
                  }`}
                >
                  Tautkan Link Eksternal
                </button>
              </div>
            </div>

            {modeUnggahMateri === "file" ? (
              <FileDropzone
                kategori="materi"
                selectedFile={selectedFileMateri}
                onFileSelect={setSelectedFileMateri}
                disabled={isLoading}
              />
            ) : (
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Tautan URL Eksternal (Google Drive/Slide):
                </label>
                <Input
                  value={linkMateri}
                  onChange={(e) => setLinkMateri(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="text-xs"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsMateriModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="default"
              onClick={handleTambahMateri}
              disabled={
                isLoading ||
                !judulMateri.trim() ||
                (modeUnggahMateri === "file" ? !selectedFileMateri : !linkMateri.trim())
              }
              className="text-xs font-bold shadow-retro-sm"
            >
              {isLoading ? "Mengunggah..." : "Publikasikan Materi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL BUAT TUGAS BARU */}
      <Dialog open={isTugasModalOpen} onOpenChange={setIsTugasModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold">
              <Clock className="h-5 w-5 text-retro-orange" />
              Buat Tugas Perkuliahan Baru
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Judul Tugas:
              </label>
              <Input
                value={judulTugas}
                onChange={(e) => setJudulTugas(e.target.value)}
                placeholder="Misal: Tugas 03 - Rancangan Skema Relasional"
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Instruksi & Deskripsi Soal:
              </label>
              <textarea
                value={deskripsiTugas}
                onChange={(e) => setDeskripsiTugas(e.target.value)}
                placeholder="Tuliskan petunjuk pengerjaan tugas secara rinci..."
                rows={3}
                className="w-full rounded border border-border p-2.5 text-xs text-foreground focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Batas Waktu Tenggat (Deadline):
              </label>
              <Input
                type="datetime-local"
                value={tenggatTugas}
                onChange={(e) => setTenggatTugas(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsTugasModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="default"
              onClick={handleTambahTugas}
              disabled={isLoading || !judulTugas.trim() || !deskripsiTugas.trim() || !tenggatTugas}
              className="text-xs font-bold shadow-retro-sm"
            >
              Simpan Tugas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
