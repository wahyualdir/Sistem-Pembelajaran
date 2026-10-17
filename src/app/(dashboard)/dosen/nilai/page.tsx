"use client";

import React, { useState } from "react";
import {
  GraduationCap,
  Save,
  Lock,
  Upload,
  CheckCircle,
  AlertTriangle,
  Plus,
  Trash2,
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
import { NilaiStore, KelasNilaiData } from "@/features/nilai/nilai-store";
import {
  updateKomponenAction,
  simpanDrafNilaiAction,
  finalisasiNilaiAction,
} from "@/features/nilai/actions";
import { konversiNilaiKeHuruf } from "@/lib/akademik/nilai";
import Papa from "papaparse";

export default function DosenNilaiPage() {
  // Dosen default Dr. Ardiansyah (dsn-1)
  const dosenId = "dsn-1";
  const daftarKelas = NilaiStore.getKelasByDosen(dosenId);

  const [selectedKelasId, setSelectedKelasId] = useState<string>(
    daftarKelas[0]?.kelasId || "kls-tif101-a"
  );
  const kelas = NilaiStore.getKelasNilai(selectedKelasId);

  // State untuk edit komponen nilai
  const [komponenList, setKomponenList] = useState(
    kelas?.komponen.map((k) => ({ nama: k.nama, bobotPersen: k.bobotPersen })) || []
  );

  // State nilai sementara (input per mahasiswa)
  const [nilaiState, setNilaiState] = useState<Record<string, Record<string, number>>>(() => {
    const initial: Record<string, Record<string, number>> = {};
    if (kelas) {
      for (const p of kelas.peserta) {
        initial[p.krsDetailId] = { ...p.skorKomponen };
      }
    }
    return initial;
  });

  const [activeTab, setActiveTab] = useState<"nilai" | "komponen">("nilai");
  const [pesanNotif, setPesanNotif] = useState<{ teks: string; tipe: "sukses" | "galat" } | null>(null);
  const [isFinalisasiOpen, setIsFinalisasiOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvContent, setCsvContent] = useState("");
  const [csvPreview, setCsvPreview] = useState<{ nim: string; skor: Record<string, number>; valid: boolean; pesan?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Ganti kelas yang dipilih
  const handleSelectKelas = (id: string) => {
    setSelectedKelasId(id);
    const k = NilaiStore.getKelasNilai(id);
    if (k) {
      setKomponenList(k.komponen.map((item) => ({ nama: item.nama, bobotPersen: item.bobotPersen })));
      const initial: Record<string, Record<string, number>> = {};
      for (const p of k.peserta) {
        initial[p.krsDetailId] = { ...p.skorKomponen };
      }
      setNilaiState(initial);
      setPesanNotif(null);
    }
  };

  // Hitung total bobot komponen saat ini
  const totalBobot = komponenList.reduce((sum, item) => sum + (Number(item.bobotPersen) || 0), 0);
  const isBobotValid = Math.abs(totalBobot - 100) < 0.01;

  // Ubah skor mahasiswa pada baris tabel
  const handleScoreChange = (krsDetailId: string, komponenId: string, val: string) => {
    const num = val === "" ? 0 : Math.min(100, Math.max(0, Number(val)));
    setNilaiState((prev) => ({
      ...prev,
      [krsDetailId]: {
        ...(prev[krsDetailId] || {}),
        [komponenId]: num,
      },
    }));
  };

  // Simpan Draf
  const handleSimpanDraf = async () => {
    if (!kelas) return;
    setIsLoading(true);
    setPesanNotif(null);

    const nilaiData = Object.entries(nilaiState).map(([krsDetailId, skorKomponen]) => ({
      krsDetailId,
      skorKomponen,
    }));

    const res = await simpanDrafNilaiAction({
      kelasId: kelas.kelasId,
      nilaiData,
    });

    setIsLoading(false);
    if (res.success) {
      setPesanNotif({ teks: res.message, tipe: "sukses" });
    } else {
      setPesanNotif({ teks: res.message, tipe: "galat" });
    }
  };

  // Simpan Komponen Nilai
  const handleSimpanKomponen = async () => {
    if (!kelas) return;
    if (!isBobotValid) {
      setPesanNotif({ teks: `Total bobot komponen harus 100%, saat ini ${totalBobot}%`, tipe: "galat" });
      return;
    }

    setIsLoading(true);
    setPesanNotif(null);

    const res = await updateKomponenAction({
      kelasId: kelas.kelasId,
      komponen: komponenList.map((k) => ({
        nama: k.nama,
        bobotPersen: Number(k.bobotPersen),
      })),
    });

    setIsLoading(false);
    if (res.success) {
      setPesanNotif({ teks: res.message, tipe: "sukses" });
      setActiveTab("nilai");
    } else {
      setPesanNotif({ teks: res.message, tipe: "galat" });
    }
  };

  // Finalisasi Nilai
  const handleFinalisasi = async () => {
    if (!kelas) return;
    setIsLoading(true);
    setIsFinalisasiOpen(false);
    setPesanNotif(null);

    // Simpan draf terbaru terlebih dahulu
    const nilaiData = Object.entries(nilaiState).map(([krsDetailId, skorKomponen]) => ({
      krsDetailId,
      skorKomponen,
    }));
    await simpanDrafNilaiAction({ kelasId: kelas.kelasId, nilaiData });

    const res = await finalisasiNilaiAction({ kelasId: kelas.kelasId });
    setIsLoading(false);

    if (res.success) {
      setPesanNotif({ teks: res.message, tipe: "sukses" });
    } else {
      setPesanNotif({ teks: res.message, tipe: "galat" });
    }
  };

  // Parser CSV Nilai
  const handleParseCsv = () => {
    if (!csvContent.trim() || !kelas) return;

    Papa.parse(csvContent.trim(), {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const previewList: { nim: string; skor: Record<string, number>; valid: boolean; pesan?: string }[] = [];

        for (const row of results.data as Record<string, string>[]) {
          const nim = row.nim || row.NIM || row.Nim;
          if (!nim) {
            previewList.push({ nim: "-", skor: {}, valid: false, pesan: "Kolom NIM tidak ditemukan" });
            continue;
          }

          const mhs = kelas.peserta.find((p) => p.nim === nim.trim());
          if (!mhs) {
            previewList.push({ nim, skor: {}, valid: false, pesan: `NIM ${nim} bukan peserta kelas ini` });
            continue;
          }

          const skor: Record<string, number> = {};
          let isValid = true;
          let pesan = "";

          // Cari kolom yang cocok dengan nama komponen
          for (const komp of kelas.komponen) {
            const rawVal =
              row[komp.nama] ||
              row[komp.nama.toLowerCase()] ||
              row[komp.nama.toUpperCase()];

            if (rawVal !== undefined && rawVal !== "") {
              const num = Number(rawVal);
              if (isNaN(num) || num < 0 || num > 100) {
                isValid = false;
                pesan = `Nilai ${komp.nama} (${rawVal}) tidak valid (harus 0-100)`;
              } else {
                skor[komp.id] = num;
              }
            }
          }

          previewList.push({ nim, skor, valid: isValid, pesan: isValid ? undefined : pesan });
        }

        setCsvPreview(previewList);
      },
    });
  };

  // Terapkan hasil CSV
  const handleTerapkanCsv = () => {
    if (!kelas) return;
    const newState = { ...nilaiState };

    for (const item of csvPreview) {
      if (item.valid) {
        const peserta = kelas.peserta.find((p) => p.nim === item.nim);
        if (peserta) {
          newState[peserta.krsDetailId] = {
            ...(newState[peserta.krsDetailId] || {}),
            ...item.skor,
          };
        }
      }
    }

    setNilaiState(newState);
    setIsCsvModalOpen(false);
    setCsvContent("");
    setCsvPreview([]);
    setPesanNotif({
      teks: "Nilai dari berkas CSV berhasil dimuat ke lembar kerja. Jangan lupa simpan draf.",
      tipe: "sukses",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Input & Finalisasi Nilai Kelas
          </h1>
          <p className="text-sm text-muted-foreground">
            Pengelolaan bobot penilaian, pengisian nilai mahasiswa per komponen, dan penguncian nilai resmi.
          </p>
        </div>

        {/* Pilihan Kelas */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Pilih Kelas:
          </label>
          <select
            value={selectedKelasId}
            onChange={(e) => handleSelectKelas(e.target.value)}
            className="rounded-[8px] border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {daftarKelas.map((k) => (
              <option key={k.kelasId} value={k.kelasId}>
                {k.kodeMataKuliah} - {k.namaMataKuliah} (Kelas {k.kodeKelas})
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

      {kelas ? (
        <div className="space-y-6">
          {/* Card Info Kelas */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary text-base">
                      {kelas.kodeMataKuliah}
                    </span>
                    <span className="text-border">|</span>
                    <span className="font-semibold text-foreground text-base">
                      {kelas.namaMataKuliah} (Kelas {kelas.kodeKelas})
                    </span>
                    <Badge variant={kelas.statusFinal ? "success" : "warning"}>
                      {kelas.statusFinal ? "TERKUNCI / FINAL" : "STATUS: DRAF"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dosen Pengampu: {kelas.namaDosen} • Bobot: {kelas.sks} SKS • Semester: {kelas.tahunAjaranKode} • Peserta: {kelas.peserta.length} Mahasiswa
                  </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center gap-2 bg-muted p-1 rounded-[8px] border border-border">
                  <button
                    onClick={() => setActiveTab("nilai")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-colors ${
                      activeTab === "nilai"
                        ? "bg-surface text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Lembar Nilai ({kelas.peserta.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("komponen")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-colors ${
                      activeTab === "komponen"
                        ? "bg-surface text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Atur Komponen Nilai ({kelas.komponen.length})
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TAB 1: LEMBAR NILAI */}
          {activeTab === "nilai" && (
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Lembar Penilaian Mahasiswa
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Masukkan nilai rentang 0-100 pada setiap komponen. Nilai akhir dihitung otomatis.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {!kelas.statusFinal && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCsvModalOpen(true)}
                        className="gap-1.5 text-xs"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        Impor CSV Nilai
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleSimpanDraf}
                        disabled={isLoading}
                        className="gap-1.5 text-xs"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Simpan Draf
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setIsFinalisasiOpen(true)}
                        disabled={isLoading || !isBobotValid}
                        className="gap-1.5 text-xs bg-gray-dark hover:bg-gray-dark/90"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        Finalisasi Nilai
                      </Button>
                    </>
                  )}
                  {kelas.statusFinal && (
                    <Badge variant="success" className="text-xs py-1 px-3">
                      Nilai Terkunci Permanen
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {kelas.statusFinal && (
                  <div className="bg-surface p-3 mx-4 my-3 rounded-[8px] border border-ink text-xs text-ink flex items-center gap-2">
                    <Lock className="h-4 w-4 shrink-0" />
                    <span>
                      Nilai kelas ini telah difinalisasi pada <strong>{kelas.tanggalFinal}</strong>. Lembar nilai telah terkunci. Koreksi nilai hanya dapat diajukan melalui Administrator Akademik.
                    </span>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted">
                        <TableHead className="w-12 text-center">No</TableHead>
                        <TableHead className="w-32">NIM</TableHead>
                        <TableHead>Nama Mahasiswa</TableHead>
                        {kelas.komponen.map((komp) => (
                          <TableHead key={komp.id} className="w-28 text-center">
                            {komp.nama}
                            <span className="block text-xs font-normal text-muted-foreground">
                              ({komp.bobotPersen}%)
                            </span>
                          </TableHead>
                        ))}
                        <TableHead className="w-24 text-center">Nilai Akhir</TableHead>
                        <TableHead className="w-20 text-center">Huruf</TableHead>
                        <TableHead className="w-20 text-center">Bobot</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {kelas.peserta.map((peserta, idx) => {
                        const skorMhs = nilaiState[peserta.krsDetailId] || {};

                        // Kalkulasi pratinjau nilai akhir secara lokal
                        const isLengkap = kelas.komponen.every(
                          (k) => skorMhs[k.id] !== undefined && skorMhs[k.id] !== null
                        );
                        let previewAkhir = peserta.nilaiAkhir ?? "-";
                        let previewHuruf = peserta.nilaiHuruf ?? "-";
                        let previewBobot = peserta.bobot ? peserta.bobot.toFixed(2) : "-";

                        if (isLengkap && isBobotValid) {
                          let total = 0;
                          for (const k of kelas.komponen) {
                            total += ((skorMhs[k.id] || 0) * k.bobotPersen) / 100;
                          }
                          const na = Math.round(total * 100) / 100;
                          const { huruf, bobot } = konversiNilaiKeHuruf(na);
                          previewAkhir = na.toFixed(2);
                          previewHuruf = huruf;
                          previewBobot = bobot.toFixed(2);
                        }

                        return (
                          <TableRow key={peserta.krsDetailId} className="hover:bg-muted/50">
                            <TableCell className="text-center font-medium text-xs text-muted-foreground">
                              {idx + 1}
                            </TableCell>
                            <TableCell className="font-sans text-xs font-semibold text-foreground">
                              {peserta.nim}
                            </TableCell>
                            <TableCell className="text-xs font-medium text-foreground">
                              {peserta.nama}
                            </TableCell>

                            {/* Kolom per komponen nilai */}
                            {kelas.komponen.map((komp) => (
                              <TableCell key={komp.id} className="p-2 text-center">
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  step={0.5}
                                  disabled={kelas.statusFinal}
                                  value={skorMhs[komp.id] ?? ""}
                                  onChange={(e) =>
                                    handleScoreChange(peserta.krsDetailId, komp.id, e.target.value)
                                  }
                                  className="h-8 text-center text-xs font-semibold w-20 mx-auto"
                                  placeholder="0-100"
                                />
                              </TableCell>
                            ))}

                            <TableCell className="text-center font-bold text-xs text-primary">
                              {previewAkhir}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={
                                  previewHuruf === "A" || previewHuruf === "A-"
                                    ? "success"
                                    : previewHuruf === "E"
                                    ? "danger"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {previewHuruf}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center font-medium text-xs text-muted-foreground">
                              {previewBobot}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 2: ATUR KOMPONEN NILAI */}
          {activeTab === "komponen" && (
            <Card>
              <CardHeader className="border-b border-border pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      Pengaturan Komponen & Bobot Nilai Kelas
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tentukan nama komponen dan persentase bobot. Total bobot harus tepat 100%.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Total Bobot:</span>
                    <Badge variant={isBobotValid ? "success" : "danger"} className="text-xs font-bold">
                      {totalBobot}% {isBobotValid ? "(Valid 100%)" : "(Belum 100%)"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="space-y-3">
                  {komponenList.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-[8px] bg-muted border border-border"
                    >
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground block mb-1">
                          Nama Komponen #{idx + 1}
                        </label>
                        <Input
                          disabled={kelas.statusFinal}
                          value={item.nama}
                          onChange={(e) => {
                            const updated = [...komponenList];
                            updated[idx].nama = e.target.value;
                            setKomponenList(updated);
                          }}
                          placeholder="Misal: Tugas, UTS, UAS, Praktikum"
                          className="text-xs"
                        />
                      </div>

                      <div className="w-32">
                        <label className="text-xs text-muted-foreground block mb-1">
                          Bobot (%)
                        </label>
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          disabled={kelas.statusFinal}
                          value={item.bobotPersen}
                          onChange={(e) => {
                            const updated = [...komponenList];
                            updated[idx].bobotPersen = Number(e.target.value);
                            setKomponenList(updated);
                          }}
                          className="text-xs text-center"
                        />
                      </div>

                      {!kelas.statusFinal && komponenList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = komponenList.filter((_, i) => i !== idx);
                            setKomponenList(updated);
                          }}
                          className="mt-5 p-2 rounded-[8px] text-primary-dark hover:bg-primary/10"
                          title="Hapus Komponen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {!kelas.statusFinal && (
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setKomponenList([...komponenList, { nama: "Komponen Baru", bobotPersen: 10 }])
                      }
                      className="gap-1.5 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Tambah Komponen
                    </Button>

                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSimpanKomponen}
                      disabled={isLoading || !isBobotValid}
                      className="gap-1.5 text-xs"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Simpan Komponen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Kelas tidak ditemukan atau Anda belum mengampu kelas pada semester ini.
          </CardContent>
        </Card>
      )}

      {/* MODAL KONFIRMASI FINALISASI NILAI */}
      <Dialog open={isFinalisasiOpen} onOpenChange={setIsFinalisasiOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary-dark">
              <Lock className="h-5 w-5" />
              Konfirmasi Finalisasi Nilai Kelas
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm text-foreground">
            <p>
              Apakah Anda yakin ingin memfinalisasi nilai untuk kelas{" "}
              <strong>
                {kelas?.kodeMataKuliah} - {kelas?.namaMataKuliah} (Kelas {kelas?.kodeKelas})
              </strong>
              ?
            </p>
            <div className="rounded-[8px] bg-primary/10 p-3 text-xs text-primary-dark space-y-1 border border-ink">
              <p className="font-bold">Perhatian Penting:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Nilai akan terkunci permanen dan tidak dapat diubah lagi oleh dosen.</li>
                <li>Seluruh mahasiswa akan langsung melihat nilai ini pada KHS dan Transkrip.</li>
                <li>Koreksi nilai setelah ini hanya bisa dilakukan oleh Admin Akademik dengan alasan audit.</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsFinalisasiOpen(false)}>
              Batal
            </Button>
            <Button
              variant="default"
              onClick={handleFinalisasi}
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Ya, Finalisasi dan Kunci Nilai
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL IMPOR CSV NILAI */}
      <Dialog open={isCsvModalOpen} onOpenChange={setIsCsvModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Impor Nilai Mahasiswa dari CSV
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">
              Format CSV harus memiliki header: <code>nim</code>, diikuti kolom nama komponen persis seperti yang terdaftar di kelas (contoh: <code>Tugas,UTS,UAS</code>).
            </p>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Tempel Isi CSV atau Unggah Berkas:
              </label>
              <textarea
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder={`nim,Tugas,UTS,UAS\n223510001,85,82,88\n223510002,80,78,75`}
                rows={5}
                className="w-full rounded-[8px] border border-border p-3 font-sans text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end">
              <Button size="sm" variant="secondary" onClick={handleParseCsv} className="text-xs">
                Periksa Format & Pratinjau
              </Button>
            </div>

            {/* Pratinjau Hasil CSV */}
            {csvPreview.length > 0 && (
              <div className="border border-border rounded-[8px] overflow-hidden max-h-48 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted">
                      <TableHead className="text-xs">NIM</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Keterangan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvPreview.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-sans text-xs">{row.nim}</TableCell>
                        <TableCell>
                          <Badge variant={row.valid ? "success" : "danger"} className="text-xs">
                            {row.valid ? "Valid" : "Galat"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {row.valid ? "Siap diimpor" : row.pesan}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCsvModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="default"
              onClick={handleTerapkanCsv}
              disabled={csvPreview.filter((p) => p.valid).length === 0}
              className="text-xs"
            >
              Terapkan {csvPreview.filter((p) => p.valid).length} Baris Valid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
