"use client";

import React, { useState } from "react";
import { MahasiswaItem, DosenItem, ProgramStudiItem } from "../types";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CsvImportModal } from "./csv-import-modal";
import {
  createMahasiswaAction,
  toggleMahasiswaStatusAction,
  assignDosenWaliAction,
} from "../actions";
import { Plus, Upload, UserCheck, Power, Search } from "lucide-react";

interface MahasiswaTableProps {
  mahasiswaList: MahasiswaItem[];
  dosenList: DosenItem[];
  prodiList: ProgramStudiItem[];
  onRefresh: () => void;
}

export function MahasiswaTable({
  mahasiswaList,
  dosenList,
  prodiList,
  onRefresh,
}: MahasiswaTableProps) {
  const [search, setSearch] = useState("");
  const [prodiFilter, setProdiFilter] = useState("SEMUA");
  const [statusFilter, setStatusFilter] = useState("SEMUA");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<MahasiswaItem | null>(null);
  const [selectedDosenWali, setSelectedDosenWali] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Filter
  const filtered = mahasiswaList.filter((m) => {
    const matchSearch =
      m.nama.toLowerCase().includes(search.toLowerCase()) ||
      m.nim.includes(search) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchProdi = prodiFilter === "SEMUA" || m.prodiId === prodiFilter;
    const matchStatus = statusFilter === "SEMUA" || m.status === statusFilter;
    return matchSearch && matchProdi && matchStatus;
  });

  const handleToggleStatus = async (id: string) => {
    const res = await toggleMahasiswaStatusAction(id);
    if (res.success) {
      setFeedback(res.message);
      onRefresh();
    }
  };

  const handleAssignWali = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTarget) return;
    const res = await assignDosenWaliAction(
      assignTarget.id,
      selectedDosenWali || null
    );
    if (res.success) {
      setFeedback(res.message);
      setAssignTarget(null);
      onRefresh();
    }
  };

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await createMahasiswaAction(formData);
    if (res.success) {
      setFeedback(res.message);
      setIsAddOpen(false);
      onRefresh();
    } else {
      setFeedback(res.message || "Gagal menyimpan data.");
    }
  };

  return (
    <div className="space-y-4">
      {feedback && (
        <div className="rounded-[8px] bg-surface border border-ink p-3 text-xs text-ink flex justify-between items-center">
          <span>{feedback}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold hover:underline"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Kontrol Aksi Atas */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari NIM, nama, atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <select
            value={prodiFilter}
            onChange={(e) => setProdiFilter(e.target.value)}
            className="h-10 rounded-[8px] border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="SEMUA">Semua Prodi</option>
            {prodiList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-[8px] border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="SEMUA">Semua Status</option>
            <option value="AKTIF">Aktif</option>
            <option value="CUTI">Cuti</option>
            <option value="LULUS">Lulus</option>
            <option value="KELUAR">Keluar</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Upload className="h-4 w-4" />
            Impor CSV
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Tambah Mahasiswa
          </Button>
        </div>
      </div>

      {/* Tabel Data Mahasiswa */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>NIM</TableHead>
            <TableHead>Nama Mahasiswa</TableHead>
            <TableHead>Email Student</TableHead>
            <TableHead>Program Studi</TableHead>
            <TableHead>Angkatan</TableHead>
            <TableHead>Dosen Wali</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                Tidak ada data mahasiswa yang cocok dengan kriteria pencarian.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((mhs) => {
              const prodi = prodiList.find((p) => p.id === mhs.prodiId);
              const wali = dosenList.find((d) => d.id === mhs.dosenWaliId);
              return (
                <TableRow key={mhs.id}>
                  <TableCell className="font-semibold">{mhs.nim}</TableCell>
                  <TableCell>{mhs.nama}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{mhs.email}</TableCell>
                  <TableCell>{prodi?.nama || mhs.prodiId}</TableCell>
                  <TableCell>{mhs.angkatan}</TableCell>
                  <TableCell className="text-xs">
                    {wali ? (
                      <span className="font-medium text-foreground">{wali.nama}</span>
                    ) : (
                      <span className="text-muted-foreground italic">Belum ditetapkan</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={mhs.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAssignTarget(mhs);
                          setSelectedDosenWali(mhs.dosenWaliId || "");
                        }}
                        className="h-8 px-2 text-primary"
                        title="Tetapkan Dosen Wali"
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Wali
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(mhs.id)}
                        className={`h-8 px-2 ${
                          mhs.status === "AKTIF" ? "text-primary-dark" : "text-ink"
                        }`}
                        title={mhs.status === "AKTIF" ? "Nonaktifkan" : "Aktifkan"}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Dialog Tambah Mahasiswa */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Data Mahasiswa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Nomor Induk Mahasiswa (NIM)
              </label>
              <Input name="nim" placeholder="Contoh: 223510099" required />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Nama Lengkap
              </label>
              <Input name="nama" placeholder="Nama mahasiswa lengkap" required />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Email Student (@student.uir.ac.id)
              </label>
              <Input
                name="email"
                type="email"
                placeholder="nama@student.uir.ac.id"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Program Studi
                </label>
                <select
                  name="prodiId"
                  className="h-10 w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-sm text-foreground"
                  required
                >
                  {prodiList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Tahun Angkatan
                </label>
                <Input
                  name="angkatan"
                  type="number"
                  defaultValue={2024}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Dosen Pembimbing Akademik / Wali (Opsional)
              </label>
              <select
                name="dosenWaliId"
                className="h-10 w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-sm text-foreground"
              >
                <option value="">-- Pilih Dosen Wali --</option>
                {dosenList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nama}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsAddOpen(false)}
              >
                Batal
              </Button>
              <Button variant="default" type="submit">
                Simpan Mahasiswa
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Tetapkan Dosen Wali */}
      <Dialog open={!!assignTarget} onOpenChange={() => setAssignTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tetapkan Dosen Wali Mahasiswa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssignWali} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Menetapkan dosen wali untuk:{" "}
              <strong className="text-foreground">{assignTarget?.nama}</strong> (
              {assignTarget?.nim})
            </p>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Pilih Dosen Pengajar
              </label>
              <select
                value={selectedDosenWali}
                onChange={(e) => setSelectedDosenWali(e.target.value)}
                className="h-10 w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-sm text-foreground"
              >
                <option value="">-- Hapus Dosen Wali --</option>
                {dosenList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nama} ({d.nidn})
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setAssignTarget(null)}
              >
                Batal
              </Button>
              <Button variant="default" type="submit">
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Impor CSV */}
      <CsvImportModal
        type="MAHASISWA"
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => {
          setFeedback("Impor mahasiswa berhasil diproses.");
          onRefresh();
        }}
      />
    </div>
  );
}
