"use client";

import React, { useState } from "react";
import { KelasItem } from "../jadwal-store";
import { MataKuliahItem, DosenItem, RuangItem } from "../../master/types";
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
import { createKelasAction } from "../actions";
import { Plus, Calendar, Clock, MapPin, User, AlertCircle } from "lucide-react";

interface AdminJadwalViewProps {
  initialKelas: KelasItem[];
  mataKuliahList: MataKuliahItem[];
  dosenList: DosenItem[];
  ruangList: RuangItem[];
}

export function AdminJadwalView({
  initialKelas,
  mataKuliahList,
  dosenList,
  ruangList,
}: AdminJadwalViewProps) {
  const [kelasList] = useState<KelasItem[]>(initialKelas);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);
    setErrorFeedback(null);

    const formData = new FormData(e.currentTarget);
    const res = await createKelasAction(formData);

    if (res.success) {
      setFeedback(res.message);
      setIsAddOpen(false);
      window.location.reload();
    } else {
      setErrorFeedback(res.message || "Gagal menyusun jadwal.");
    }
  };

  return (
    <div className="space-y-4">
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

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Total Rombongan Belajar:{" "}
          <strong className="text-foreground">{kelasList.length} Kelas</strong>
        </p>

        <Button
          variant="default"
          size="sm"
          onClick={() => {
            setErrorFeedback(null);
            setIsAddOpen(true);
          }}
          className="flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Buka Kelas & Susun Jadwal
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mata Kuliah</TableHead>
            <TableHead>Kelas</TableHead>
            <TableHead>SKS</TableHead>
            <TableHead>Dosen Pengampu</TableHead>
            <TableHead>Jadwal Kuliah & Ruang</TableHead>
            <TableHead>Kapasitas & Kuota</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {kelasList.map((k) => (
            <TableRow key={k.id}>
              <TableCell>
                <div className="font-semibold text-foreground">
                  {k.namaMataKuliah}
                </div>
                <div className="text-xs text-muted-foreground">{k.kodeMataKuliah}</div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">Kelas {k.kode}</Badge>
              </TableCell>
              <TableCell className="font-semibold">{k.sks} SKS</TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <User className="h-3.5 w-3.5 text-primary" />
                  {k.namaDosen}
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {k.jadwal.map((j) => (
                    <div
                      key={j.id}
                      className="inline-flex items-center gap-2 rounded-[6px] bg-muted border border-border px-2 py-1 text-xs"
                    >
                      <span className="font-semibold text-primary">{j.hari}</span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {j.jamMulai} - {j.jamSelesai}
                      </span>
                      <span className="flex items-center gap-1 text-foreground font-medium">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {j.namaRuang}
                      </span>
                    </div>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-xs">
                  <span className="font-semibold text-foreground">{k.terisi}</span>
                  <span className="text-muted-foreground"> / {k.kuota} Kursi</span>
                </div>
                <div className="mt-1 h-1.5 w-24 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${Math.min(100, (k.terisi / k.kuota) * 100)}%` }}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Dialog Buka Kelas & Susun Jadwal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Buka Kelas Baru & Susun Jadwal Perkuliahan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Pilih Mata Kuliah
              </label>
              <select
                name="mataKuliahId"
                className="h-10 w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-sm text-foreground"
                required
              >
                {mataKuliahList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.kode} - {m.nama} ({m.sks} SKS, Semester {m.semesterPaket})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Kode Rombongan Belajar (Kelas)
                </label>
                <Input name="kode" defaultValue="A" placeholder="Contoh: A, B, atau TI-3A" required />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Kapasitas Kuota Mahasiswa
                </label>
                <Input name="kuota" type="number" defaultValue={35} min={5} max={100} required />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Dosen Pengampu Perkuliahan
              </label>
              <select
                name="dosenId"
                className="h-10 w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-sm text-foreground"
                required
              >
                {dosenList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nama} ({d.nidn})
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-[8px] border border-border p-3 space-y-3 bg-muted">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Calendar className="h-4 w-4 text-primary" />
                Pengaturan Waktu & Tempat (Deteksi Bentrok Otomatis)
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Hari
                  </label>
                  <select
                    name="hari"
                    className="h-9 w-full rounded-[8px] border border-border bg-surface px-2 py-1 text-xs text-foreground"
                    required
                  >
                    <option value="Senin">Senin</option>
                    <option value="Selasa">Selasa</option>
                    <option value="Rabu">Rabu</option>
                    <option value="Kamis">Kamis</option>
                    <option value="Jumat">Jumat</option>
                    <option value="Sabtu">Sabtu</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Jam Mulai (HH:mm)
                  </label>
                  <Input name="jamMulai" defaultValue="08:00" className="h-9 text-xs" required />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Jam Selesai (HH:mm)
                  </label>
                  <Input name="jamSelesai" defaultValue="09:40" className="h-9 text-xs" required />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Ruang Perkuliahan
                </label>
                <select
                  name="ruangId"
                  className="h-9 w-full rounded-[8px] border border-border bg-surface px-2 py-1 text-xs text-foreground"
                  required
                >
                  {ruangList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.kode} - {r.nama} (Kapasitas: {r.kapasitas} orang)
                    </option>
                  ))}
                </select>
              </div>
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
                Simpan & Cek Bentrok
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
