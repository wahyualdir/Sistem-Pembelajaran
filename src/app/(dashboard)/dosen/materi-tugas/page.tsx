"use client";

import React, { useState } from "react";
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
import { JadwalStore } from "@/features/jadwal/jadwal-store";
import {
  MateriTugasStore,
  TugasItem,
  PengumpulanTugasItem,
} from "@/features/materi-tugas/materi-tugas-store";
import {
  tambahMateriAction,
  tambahTugasAction,
  beriNilaiTugasAction,
} from "@/features/materi-tugas/actions";

export default function DosenMateriTugasPage() {
  const dosenId = "dsn-1";
  const daftarKelas = JadwalStore.getKelasByDosen(dosenId);

  const [selectedKelasId, setSelectedKelasId] = useState<string>(
    daftarKelas[0]?.id || "kls-tif101-a"
  );
  const kelas = JadwalStore.getKelasById(selectedKelasId);

  const [activeTab, setActiveTab] = useState<"materi" | "tugas">("materi");

  const daftarMateri = MateriTugasStore.getMateriByKelas(selectedKelasId);
  const daftarTugas = MateriTugasStore.getTugasByKelas(selectedKelasId);

  // State Modal Tambah Materi
  const [isMateriModalOpen, setIsMateriModalOpen] = useState(false);
  const [judulMateri, setJudulMateri] = useState("");
  const [deskripsiMateri, setDeskripsiMateri] = useState("");
  const [linkMateri, setLinkMateri] = useState("");
  const [ukuranMateri, setUkuranMateri] = useState(2.5);

  // State Modal Tambah Tugas
  const [isTugasModalOpen, setIsTugasModalOpen] = useState(false);
  const [judulTugas, setJudulTugas] = useState("");
  const [deskripsiTugas, setDeskripsiTugas] = useState("");
  const [tenggatTugas, setTenggatTugas] = useState("2026-10-30T23:59");

  // State Modal Pengumpulan & Penilaian Tugas
  const [viewTugasTarget, setViewTugasTarget] = useState<TugasItem | null>(null);
  const [nilaiTarget, setNilaiTarget] = useState<PengumpulanTugasItem | null>(null);
  const [inputNilai, setInputNilai] = useState<number>(85);
  const [inputCatatan, setInputCatatan] = useState("");

  const [pesanNotif, setPesanNotif] = useState<{ teks: string; tipe: "sukses" | "galat" } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Tambah Materi
  const handleTambahMateri = async () => {
    if (!judulMateri.trim() || !linkMateri.trim()) {
      setPesanNotif({ teks: "Judul dan tautan berkas materi wajib diisi.", tipe: "galat" });
      return;
    }

    setIsLoading(true);
    setPesanNotif(null);

    const res = await tambahMateriAction({
      kelasId: selectedKelasId,
      judul: judulMateri.trim(),
      deskripsi: deskripsiMateri.trim() || undefined,
      pathFile: linkMateri.trim(),
      ukuranMb: ukuranMateri,
    });

    setIsLoading(false);
    if (res.success) {
      setIsMateriModalOpen(false);
      setJudulMateri("");
      setDeskripsiMateri("");
      setLinkMateri("");
      setPesanNotif({ teks: res.message, tipe: "sukses" });
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

  // Simpan Nilai Tugas
  const handleSimpanNilai = async () => {
    if (!nilaiTarget) return;

    setIsLoading(true);
    setPesanNotif(null);

    const res = await beriNilaiTugasAction({
      pengumpulanId: nilaiTarget.id,
      nilai: Number(inputNilai),
      catatanDosen: inputCatatan.trim(),
    });

    setIsLoading(false);
    if (res.success) {
      setNilaiTarget(null);
      setPesanNotif({ teks: res.message, tipe: "sukses" });
    } else {
      setPesanNotif({ teks: res.message, tipe: "galat" });
    }
  };

  const daftarPengumpulan = viewTugasTarget
    ? MateriTugasStore.getPengumpulanByTugas(viewTugasTarget.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Materi & Tugas Perkuliahan
          </h1>
          <p className="text-sm text-muted-foreground">
            Distribusi bahan perkuliahan digital, pembuatan instruksi penugasan, dan penilaian hasil pekerjaan mahasiswa.
          </p>
        </div>

        {/* Pilihan Kelas */}
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
            {daftarKelas.map((k) => (
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

      {/* Tab Switcher & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("materi")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-[8px] transition-colors ${
              activeTab === "materi"
                ? "bg-primary text-white"
                : "bg-surface text-muted-foreground border border-border hover:bg-muted"
            }`}
          >
            <FolderArchive className="h-4 w-4" />
            Materi Perkuliahan ({daftarMateri.length})
          </button>
          <button
            onClick={() => setActiveTab("tugas")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-[8px] transition-colors ${
              activeTab === "tugas"
                ? "bg-primary text-white"
                : "bg-surface text-muted-foreground border border-border hover:bg-muted"
            }`}
          >
            <FileText className="h-4 w-4" />
            Tugas & Evaluasi ({daftarTugas.length})
          </button>
        </div>

        {activeTab === "materi" ? (
          <Button
            size="sm"
            onClick={() => setIsMateriModalOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Plus className="h-4 w-4" />
            Unggah Materi Baru
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => setIsTugasModalOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Plus className="h-4 w-4" />
            Buat Tugas Baru
          </Button>
        )}
      </div>

      {/* TAB 1: MATERI */}
      {activeTab === "materi" && (
        <div className="space-y-3">
          {daftarMateri.length > 0 ? (
            daftarMateri.map((mat) => (
              <Card key={mat.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FolderArchive className="h-4 w-4 text-primary shrink-0" />
                      <h3 className="font-semibold text-sm text-foreground">
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
                      Diunggah oleh: {mat.diunggahOleh} • Tanggal: {mat.tanggalUpload}
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
                      Buka Materi
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))
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
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <h3 className="font-semibold text-sm text-foreground">
                          {tug.judul}
                        </h3>
                        <Badge variant="outline" className="text-[10px] text-muted-foreground gap-1">
                          <Clock className="h-3 w-3" />
                          Tenggat: {tug.tenggat.replace("T", " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground pl-6 leading-relaxed">
                        {tug.deskripsi}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
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
                Belum ada tugas kuliah untuk kelas ini. Klik &quot;Buat Tugas Baru&quot; di atas.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* MODAL LIHAT PENGUMPULAN TUGAS */}
      <Dialog
        open={!!viewTugasTarget}
        onOpenChange={(open) => !open && setViewTugasTarget(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Users className="h-5 w-5 text-primary" />
              Pengumpulan Tugas: {viewTugasTarget?.judul}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="overflow-x-auto max-h-72 overflow-y-auto border border-border rounded-[8px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="w-12 text-center text-xs">No</TableHead>
                    <TableHead className="w-28 text-xs">NIM</TableHead>
                    <TableHead className="text-xs">Nama Mahasiswa</TableHead>
                    <TableHead className="w-32 text-xs">Waktu Kumpul</TableHead>
                    <TableHead className="w-24 text-center text-xs">Status</TableHead>
                    <TableHead className="w-20 text-center text-xs">Nilai</TableHead>
                    <TableHead className="w-24 text-center text-xs">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {daftarPengumpulan.length > 0 ? (
                    daftarPengumpulan.map((item, idx) => (
                      <TableRow key={item.id} className="text-xs">
                        <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                        <TableCell className="font-mono">{item.nim}</TableCell>
                        <TableCell className="font-medium">{item.namaMahasiswa}</TableCell>
                        <TableCell className="text-[11px] text-muted-foreground">
                          {item.waktuKumpul}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={item.terlambat ? "danger" : "success"} className="text-[10px]">
                            {item.terlambat ? "Terlambat" : "Tepat Waktu"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-bold text-primary">
                          {item.nilai ?? "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setNilaiTarget(item);
                              setInputNilai(item.nilai || 85);
                              setInputCatatan(item.catatanDosen || "");
                            }}
                            className="h-7 text-[11px] gap-1"
                          >
                            <Award className="h-3 w-3" />
                            {item.nilai ? "Ubah" : "Nilai"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="py-6 text-center text-muted-foreground text-xs">
                        Belum ada mahasiswa yang mengumpulkan tugas ini.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewTugasTarget(null)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL BERI NILAI TUGAS */}
      <Dialog open={!!nilaiTarget} onOpenChange={(open) => !open && setNilaiTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Award className="h-5 w-5 text-primary" />
              Penilaian Tugas Mahasiswa
            </DialogTitle>
          </DialogHeader>

          {nilaiTarget && (
            <div className="space-y-4 py-2">
              <div className="rounded-[8px] bg-muted p-3 text-xs border border-border space-y-1">
                <p>
                  <strong>Mahasiswa:</strong> {nilaiTarget.namaMahasiswa} ({nilaiTarget.nim})
                </p>
                <p>
                  <strong>Waktu Kumpul:</strong> {nilaiTarget.waktuKumpul}{" "}
                  {nilaiTarget.terlambat && <span className="text-danger font-bold">(Terlambat)</span>}
                </p>
                <p>
                  <strong>Berkas Jawaban:</strong>{" "}
                  <a
                    href={nilaiTarget.pathFile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline font-medium"
                  >
                    Unduh Berkas
                  </a>
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Nilai Angka (0 - 100):
                </label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={inputNilai}
                  onChange={(e) => setInputNilai(Number(e.target.value))}
                  className="text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Catatan Evaluasi / Feedback Dosen:
                </label>
                <textarea
                  value={inputCatatan}
                  onChange={(e) => setInputCatatan(e.target.value)}
                  placeholder="Beri catatan mengenai kelebihan atau perbaikan program mahasiswa..."
                  rows={3}
                  className="w-full rounded-[8px] border border-border p-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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

      {/* MODAL UNGGAH MATERI */}
      <Dialog open={isMateriModalOpen} onOpenChange={setIsMateriModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
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
                className="w-full rounded-[8px] border border-border p-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Tautan / Path Berkas Materi (PDF/Slides):
              </label>
              <Input
                value={linkMateri}
                onChange={(e) => setLinkMateri(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Perkiraan Ukuran File (MB):
              </label>
              <Input
                type="number"
                step={0.1}
                min={0.1}
                max={50}
                value={ukuranMateri}
                onChange={(e) => setUkuranMateri(Number(e.target.value))}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsMateriModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="default"
              onClick={handleTambahMateri}
              disabled={isLoading || !judulMateri.trim() || !linkMateri.trim()}
              className="text-xs"
            >
              Simpan Materi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL BUAT TUGAS BARU */}
      <Dialog open={isTugasModalOpen} onOpenChange={setIsTugasModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <FileText className="h-5 w-5 text-primary" />
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
                placeholder="Misal: Tugas 02 - Studi Kasus Normalisasi"
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Petunjuk / Deskripsi Pengerjaan:
              </label>
              <textarea
                value={deskripsiTugas}
                onChange={(e) => setDeskripsiTugas(e.target.value)}
                placeholder="Jelaskan spesifikasi tugas, format berkas, dan ketentuan pengerjaan..."
                rows={4}
                className="w-full rounded-[8px] border border-border p-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Batas Waktu Pengumpulan (Deadline):
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
              disabled={isLoading || !judulTugas.trim() || !deskripsiTugas.trim()}
              className="text-xs"
            >
              Terbitkan Tugas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
