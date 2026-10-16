"use client";

import React from "react";
import {
  CheckSquare,
  AlertTriangle,
  CheckCircle,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { RetroWindow } from "@/components/retro/retro-window";
import { PresensiStore } from "@/features/presensi/presensi-store";

export default function MahasiswaPresensiPage() {
  const mahasiswaId = "mhs-1";
  const daftarRekap = PresensiStore.getRekapMahasiswa(mahasiswaId);

  // Cek apakah ada mata kuliah dengan peringatan
  const adaPeringatan = daftarRekap.some((r) => r.peringatan || !r.lolosUas);

  return (
    <div className="space-y-6">
      {/* Header Retro Window */}
      <RetroWindow
        title="siakad://presensi.kehadiran"
        badge="Batas UAS 75%"
        actions={
          <span className="text-xs font-mono font-bold text-primary">
            {daftarRekap.length} Mata Kuliah
          </span>
        }
      >
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              <h1 className="text-xl sm:text-2xl font-black text-foreground font-heading tracking-tight">
                Rekap Kehadiran Kuliah
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Pantau rekap presensi tatap muka setiap mata kuliah. Syarat mutlak mengikuti Ujian Akhir Semester (UAS) adalah kehadiran minimal 75%.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-md border-[1.5px] border-retro-border bg-retro-warm text-foreground text-xs font-bold shadow-xs">
              Semester 2026/2027 Ganjil
            </span>
          </div>
        </div>
      </RetroWindow>

      {/* Banner Peringatan jika ada yang mendekati batas / tidak lolos */}
      {adaPeringatan && (
        <div className="flex items-start gap-3 rounded-lg p-4 bg-retro-yellow/30 border-[1.5px] border-retro-border shadow-retro text-xs text-foreground">
          <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-foreground text-sm mb-1 font-heading">
              Peringatan Ambang Batas Kehadiran UAS
            </p>
            <p className="text-muted-foreground">
              Beberapa mata kuliah Anda memiliki persentase kehadiran mendekati atau di bawah batas minimal (75%). Pastikan hadir pada pertemuan berikutnya agar hak mengikuti UAS tidak terkunci.
            </p>
          </div>
        </div>
      )}

      {/* Tabel Rekap Presensi */}
      <RetroWindow
        title="siakad://presensi.daftar_kelas"
        badge="Kehadiran Resmi"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-retro-warm">
                <TableHead className="w-12 text-center font-bold">No</TableHead>
                <TableHead className="w-28 font-bold">Kode MK</TableHead>
                <TableHead className="font-bold">Mata Kuliah</TableHead>
                <TableHead className="w-20 text-center font-bold">Kelas</TableHead>
                <TableHead className="w-20 text-center font-bold">Pertemuan</TableHead>
                <TableHead className="w-16 text-center text-success font-bold">Hadir</TableHead>
                <TableHead className="w-16 text-center text-primary font-bold">Izin</TableHead>
                <TableHead className="w-16 text-center text-warning font-bold">Sakit</TableHead>
                <TableHead className="w-16 text-center text-danger font-bold">Alpa</TableHead>
                <TableHead className="w-28 text-center font-bold">Persentase</TableHead>
                <TableHead className="w-36 text-center font-bold">Status UAS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {daftarRekap.length > 0 ? (
                daftarRekap.map((item, idx) => (
                  <TableRow key={item.kelasId} className="hover:bg-retro-warm/50">
                    <TableCell className="text-center font-bold font-mono text-xs text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-foreground">
                      {item.kodeMataKuliah}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-foreground">
                      {item.namaMataKuliah}
                      <span className="block text-xs text-muted-foreground font-normal">
                        {item.dosenPengampu} • {item.sks} SKS
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-xs font-bold">
                      <span className="inline-flex px-1.5 py-0.5 rounded border border-retro-border bg-retro-warm text-xs">
                        {item.kodeKelas}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-mono font-bold text-xs text-foreground">
                      {item.totalPertemuan}
                    </TableCell>
                    <TableCell className="text-center font-mono font-bold text-xs text-success">
                      {item.hadir}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs text-primary font-bold">
                      {item.izin}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs text-warning font-bold">
                      {item.sakit}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs text-danger font-bold">
                      {item.alpa}
                    </TableCell>
                    <TableCell className="text-center font-mono font-black text-xs">
                      <span
                        className={
                          item.persentase >= 80
                            ? "text-success"
                            : item.persentase >= 75
                            ? "text-warning"
                            : "text-danger"
                        }
                      >
                        {item.persentase.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.lolosUas ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-retro-border bg-retro-mint text-foreground text-xs font-bold shadow-xs">
                          <ShieldCheck className="h-3 w-3" />
                          Memenuhi Syarat
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-retro-border bg-danger/20 text-danger text-xs font-bold shadow-xs">
                          <ShieldAlert className="h-3 w-3" />
                          Kurang dari 75%
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={11} className="py-8 text-center text-xs text-muted-foreground font-mono">
                    Anda belum memiliki kelas aktif pada KRS yang disetujui.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </RetroWindow>
    </div>
  );
}
