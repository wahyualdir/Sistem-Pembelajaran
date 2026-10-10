"use client";

import React, { useState } from "react";
import { MataKuliahItem, ProgramStudiItem } from "../types";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  createMataKuliahAction,
  addPrasyaratAction,
  deletePrasyaratAction,
} from "../actions";
import { Plus, Link as LinkIcon, Trash2, BookOpen, AlertCircle } from "lucide-react";

interface KurikulumViewProps {
  mataKuliahList: MataKuliahItem[];
  prodiList: ProgramStudiItem[];
}

export function KurikulumView({ mataKuliahList, prodiList }: KurikulumViewProps) {
  const [selectedProdi, setSelectedProdi] = useState<string>(
    prodiList[0]?.id || "prodi-ti"
  );
  const [semesterFilter, setSemesterFilter] = useState<string>("SEMUA");

  const [isAddMKOpen, setIsAddMKOpen] = useState(false);
  const [prasyaratTargetMK, setPrasyaratTargetMK] = useState<MataKuliahItem | null>(null);
  const [selectedPrasyaratId, setSelectedPrasyaratId] = useState("");
  const [selectedNilaiMin, setSelectedNilaiMin] = useState("D");

  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);

  // Filter per prodi & semester
  const filteredMK = mataKuliahList.filter((m) => {
    const matchProdi = m.prodiId === selectedProdi;
    const matchSem =
      semesterFilter === "SEMUA" || m.semesterPaket === parseInt(semesterFilter, 10);
    return matchProdi && matchSem;
  });

  const totalSks = filteredMK.reduce((sum, item) => sum + item.sks, 0);

  const handleAddMKSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);
    setErrorFeedback(null);
    const formData = new FormData(e.currentTarget);
    formData.set("prodiId", selectedProdi);
    const res = await createMataKuliahAction(formData);
    if (res.success) {
      setFeedback(res.message);
      setIsAddMKOpen(false);
      window.location.reload();
    } else {
      setErrorFeedback(res.message || "Gagal menambahkan mata kuliah.");
    }
  };

  const handleAddPrasyaratSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prasyaratTargetMK || !selectedPrasyaratId) return;

    setFeedback(null);
    setErrorFeedback(null);

    const res = await addPrasyaratAction(
      prasyaratTargetMK.id,
      selectedPrasyaratId,
      selectedNilaiMin
    );

    if (res.success) {
      setFeedback(res.message);
      setPrasyaratTargetMK(null);
      window.location.reload();
    } else {
      setErrorFeedback(res.message || "Gagal menambahkan prasyarat.");
    }
  };

  const handleDeletePrasyarat = async (mkId: string, prasyaratId: string) => {
    const res = await deletePrasyaratAction(mkId, prasyaratId);
    if (res.success) {
      setFeedback(res.message);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Pesan Sukses / Error */}
      {feedback && (
        <div className="rounded-[8px] bg-success-soft border border-success-border p-3 text-xs text-success flex justify-between items-center">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="font-semibold">
            Tutup
          </button>
        </div>
      )}

      {errorFeedback && (
        <div className="rounded-[8px] bg-danger-soft border border-danger-border p-3 text-xs text-danger flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorFeedback}</span>
        </div>
      )}

      {/* Kontrol Filter Prodi & Semester */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-surface border border-border rounded-[8px] p-1">
            {prodiList.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProdi(p.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-colors ${
                  selectedProdi === p.id
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.nama}
              </button>
            ))}
          </div>

          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="h-9 rounded-[8px] border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="SEMUA">Semua Semester Paket</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-muted-foreground">
            Total SKS Terdaftar:{" "}
            <strong className="text-foreground">{totalSks} SKS</strong>
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={() => {
              setErrorFeedback(null);
              setIsAddMKOpen(true);
            }}
            className="flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Tambah Mata Kuliah
          </Button>
        </div>
      </div>

      {/* Tabel Kurikulum */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kode MK</TableHead>
            <TableHead>Nama Mata Kuliah</TableHead>
            <TableHead>SKS</TableHead>
            <TableHead>Semester Paket</TableHead>
            <TableHead>Jenis</TableHead>
            <TableHead>Mata Kuliah Prasyarat & Nilai Minimal</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredMK.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                Belum ada mata kuliah yang terdaftar pada kurikulum ini.
              </TableCell>
            </TableRow>
          ) : (
            filteredMK.map((mk) => (
              <TableRow key={mk.id}>
                <TableCell className="font-semibold text-foreground">
                  {mk.kode}
                </TableCell>
                <TableCell className="font-medium">{mk.nama}</TableCell>
                <TableCell>
                  <span className="font-semibold">{mk.sks}</span> SKS
                </TableCell>
                <TableCell>Paket {mk.semesterPaket}</TableCell>
                <TableCell>
                  <Badge variant={mk.jenis === "WAJIB" ? "default" : "secondary"}>
                    {mk.jenis}
                  </Badge>
                </TableCell>
                <TableCell>
                  {mk.prasyarat && mk.prasyarat.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {mk.prasyarat.map((p) => (
                        <div
                          key={p.id}
                          className="inline-flex items-center gap-1 rounded-[6px] border border-border bg-muted px-2 py-0.5 text-xs text-foreground"
                        >
                          <BookOpen className="h-3 w-3 text-primary" />
                          <span>{p.namaPrasyarat}</span>
                          <span className="text-muted-foreground font-semibold">
                            (Min: {p.nilaiMinimal})
                          </span>
                          <button
                            onClick={() => handleDeletePrasyarat(mk.id, p.prasyaratId)}
                            className="text-muted-foreground hover:text-danger ml-1"
                            title="Hapus Prasyarat"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      Tidak ada prasyarat
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPrasyaratTargetMK(mk);
                      setSelectedPrasyaratId("");
                      setErrorFeedback(null);
                    }}
                    className="h-8 px-2 text-primary"
                    title="Atur Prasyarat"
                  >
                    <LinkIcon className="h-3.5 w-3.5 mr-1" />
                    + Prasyarat
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Dialog Tambah Mata Kuliah */}
      <Dialog open={isAddMKOpen} onOpenChange={setIsAddMKOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Mata Kuliah Baru ke Kurikulum</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddMKSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Kode Mata Kuliah
              </label>
              <Input name="kode" placeholder="Contoh: TIF305" required />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Nama Mata Kuliah
              </label>
              <Input name="nama" placeholder="Contoh: Pemrograman Web Lanjut" required />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Bobot SKS
                </label>
                <Input name="sks" type="number" defaultValue={3} min={1} max={6} required />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Semester Paket
                </label>
                <Input
                  name="semesterPaket"
                  type="number"
                  defaultValue={1}
                  min={1}
                  max={8}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Jenis
                </label>
                <select
                  name="jenis"
                  className="h-10 w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-sm text-foreground"
                >
                  <option value="WAJIB">WAJIB</option>
                  <option value="PILIHAN">PILIHAN</option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsAddMKOpen(false)}
              >
                Batal
              </Button>
              <Button variant="default" type="submit">
                Simpan Mata Kuliah
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Tambah Prasyarat dengan Deteksi Siklus (Bab 5.4) */}
      <Dialog
        open={!!prasyaratTargetMK}
        onOpenChange={() => setPrasyaratTargetMK(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tetapkan Prasyarat Kelulusan Mata Kuliah</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPrasyaratSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Mata Kuliah Target:{" "}
              <strong className="text-foreground">
                {prasyaratTargetMK?.kode} - {prasyaratTargetMK?.nama}
              </strong>
            </p>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Pilih Mata Kuliah Prasyarat yang Harus Lulus Dulu
              </label>
              <select
                value={selectedPrasyaratId}
                onChange={(e) => setSelectedPrasyaratId(e.target.value)}
                className="h-10 w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-sm text-foreground"
                required
              >
                <option value="">-- Pilih Mata Kuliah Prasyarat --</option>
                {mataKuliahList
                  .filter((m) => m.id !== prasyaratTargetMK?.id)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.kode} - {m.nama} ({m.sks} SKS, Semester {m.semesterPaket})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Nilai Minimal Kelulusan Prasyarat (Bawaan: D)
              </label>
              <select
                value={selectedNilaiMin}
                onChange={(e) => setSelectedNilaiMin(e.target.value)}
                className="h-10 w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-sm text-foreground"
              >
                <option value="D">D (Nilai Mutu Minimal)</option>
                <option value="C">C (Cukup)</option>
                <option value="B">B (Baik)</option>
                <option value="A">A (Sangat Baik)</option>
              </select>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setPrasyaratTargetMK(null)}
              >
                Batal
              </Button>
              <Button variant="default" type="submit">
                Simpan Prasyarat
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
