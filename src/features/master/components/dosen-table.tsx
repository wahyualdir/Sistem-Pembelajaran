"use client";

import React, { useState } from "react";
import { DosenItem } from "../types";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CsvImportModal } from "./csv-import-modal";
import { createDosenAction, toggleDosenStatusAction } from "../actions";
import { Plus, Upload, Power, Search } from "lucide-react";

interface DosenTableProps {
  dosenList: DosenItem[];
  onRefresh: () => void;
}

export function DosenTable({ dosenList, onRefresh }: DosenTableProps) {
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const filtered = dosenList.filter((d) => {
    return (
      d.nama.toLowerCase().includes(search.toLowerCase()) ||
      d.nidn.includes(search) ||
      d.email.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleToggleStatus = async (id: string) => {
    const res = await toggleDosenStatusAction(id);
    if (res.success) {
      setFeedback(res.message);
      onRefresh();
    }
  };

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await createDosenAction(formData);
    if (res.success) {
      setFeedback(res.message);
      setIsAddOpen(false);
      onRefresh();
    } else {
      setFeedback(res.message || "Gagal menyimpan dosen.");
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
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari NIDN, nama dosen, atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
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
            Tambah Dosen
          </Button>
        </div>
      </div>

      {/* Tabel Data Dosen */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>NIDN</TableHead>
            <TableHead>Nama Dosen & Gelar</TableHead>
            <TableHead>Email Resmi</TableHead>
            <TableHead>Penugasan Tambahan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                Tidak ada data dosen yang ditemukan.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((dsn) => (
              <TableRow key={dsn.id}>
                <TableCell className="font-semibold">{dsn.nidn}</TableCell>
                <TableCell className="font-medium text-foreground">{dsn.nama}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{dsn.email}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    {dsn.penandaKaprodi && (
                      <Badge variant="warning">Ketua Program Studi</Badge>
                    )}
                    {dsn.penandaWali && (
                      <Badge variant="secondary">Dosen Wali</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={dsn.statusAktif ? "success" : "danger"}>
                    {dsn.statusAktif ? "AKTIF" : "NONAKTIF"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(dsn.id)}
                    className={`h-8 px-2 ${
                      dsn.statusAktif ? "text-primary-dark" : "text-ink"
                    }`}
                    title={dsn.statusAktif ? "Nonaktifkan Dosen" : "Aktifkan Dosen"}
                  >
                    <Power className="h-4 w-4 mr-1" />
                    {dsn.statusAktif ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Dialog Tambah Dosen */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Data Tenaga Pengajar (Dosen)</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Nomor Induk Dosen Nasional (NIDN)
              </label>
              <Input name="nidn" placeholder="Contoh: 0012058001" required />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Nama Lengkap dan Gelar
              </label>
              <Input name="nama" placeholder="Contoh: Dr. Budi Santoso, M.Kom." required />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Email Resmi Dosen (@dosen.uir.ac.id)
              </label>
              <Input
                name="email"
                type="email"
                placeholder="nama@dosen.uir.ac.id"
                required
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  name="penandaWali"
                  defaultChecked
                  className="rounded-[4px] border-border text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-foreground">Dapat bertugas sebagai Dosen Wali (Pembimbing Akademik)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  name="penandaKaprodi"
                  className="rounded-[4px] border-border text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-foreground">Menjabat sebagai Kepala Program Studi (Kaprodi)</span>
              </label>
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
                Simpan Dosen
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Impor CSV */}
      <CsvImportModal
        type="DOSEN"
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => {
          setFeedback("Impor dosen berhasil diproses.");
          onRefresh();
        }}
      />
    </div>
  );
}
