"use client";

import React, { useState } from "react";
import {
  Bell,
  Plus,
  Send,
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  Filter,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AdministrasiStore,
  TargetPengumuman,
  PengumumanItem,
} from "@/features/administrasi/administrasi-store";
import { tambahPengumumanAction } from "@/features/administrasi/actions";
import { MasterStore } from "@/features/master/master-store";

export default function AdminPengumumanPage() {
  const daftarPengumuman = AdministrasiStore.getSemuaPengumuman();
  const daftarProdi = MasterStore.getProdi();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [judul, setJudul] = useState("");
  const [isi, setIsi] = useState("");
  const [target, setTarget] = useState<TargetPengumuman>("SEMUA");
  const [targetProdiId, setTargetProdiId] = useState(daftarProdi[0]?.id || "");
  const [targetAngkatan, setTargetAngkatan] = useState("2024");

  const [pesanNotif, setPesanNotif] = useState<{ teks: string; tipe: "sukses" | "galat" } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTerbitkan = async () => {
    if (!judul.trim() || !isi.trim()) {
      setPesanNotif({ teks: "Judul dan isi pengumuman wajib diisi.", tipe: "galat" });
      return;
    }

    setIsLoading(true);
    setPesanNotif(null);

    let targetId: string | undefined = undefined;
    let targetNama: string | undefined = undefined;

    if (target === "PRODI") {
      targetId = targetProdiId;
      targetNama = daftarProdi.find((p) => p.id === targetProdiId)?.nama;
    } else if (target === "ANGKATAN") {
      targetId = targetAngkatan;
      targetNama = `Angkatan ${targetAngkatan}`;
    }

    const res = await tambahPengumumanAction({
      judul: judul.trim(),
      isi: isi.trim(),
      target,
      targetId,
      targetNama,
    });

    setIsLoading(false);
    if (res.success) {
      setIsModalOpen(false);
      setJudul("");
      setIsi("");
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
            Pengelolaan Pengumuman Kampus
          </h1>
          <p className="text-sm text-muted-foreground">
            Terbitkan informasi penting dengan target penerima spesifik (seluruh kampus, program studi, atau angkatan tertentu).
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="gap-1.5 text-xs">
          <Plus className="h-4 w-4" />
          Buat Pengumuman Baru
        </Button>
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

      {/* Daftar Pengumuman Terbit */}
      <div className="space-y-4">
        {daftarPengumuman.map((item) => (
          <Card key={item.id} className="border-border">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        item.target === "SEMUA"
                          ? "default"
                          : item.target === "PRODI"
                          ? "secondary"
                          : "outline"
                      }
                      className="text-[10px]"
                    >
                      Target: {item.targetNama || item.target}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.terbitPada}
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold text-foreground">
                    {item.judul}
                  </CardTitle>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  Oleh: <strong>{item.namaPenulis}</strong>
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">
                {item.isi}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MODAL BUAT PENGUMUMAN */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Buat Pengumuman Baru
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Judul Pengumuman:
              </label>
              <Input
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Misal: Jadwal Pengisian KRS Semester Ganjil 2026/2027"
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Sasaran / Target Penerima:
              </label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value as TargetPengumuman)}
                className="w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="SEMUA">Semua Civitas Akademika (Umum)</option>
                <option value="PRODI">Khusus Program Studi</option>
                <option value="ANGKATAN">Khusus Angkatan Tertentu</option>
              </select>
            </div>

            {target === "PRODI" && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Pilih Program Studi:
                </label>
                <select
                  value={targetProdiId}
                  onChange={(e) => setTargetProdiId(e.target.value)}
                  className="w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  {daftarProdi.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama} ({p.kode})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {target === "ANGKATAN" && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Tahun Angkatan Mahasiswa:
                </label>
                <Input
                  type="number"
                  value={targetAngkatan}
                  onChange={(e) => setTargetAngkatan(e.target.value)}
                  placeholder="2024"
                  className="text-xs"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Isi Pengumuman:
              </label>
              <textarea
                value={isi}
                onChange={(e) => setIsi(e.target.value)}
                placeholder="Tuliskan isi pengumuman secara rinci..."
                rows={5}
                className="w-full rounded-[8px] border border-border p-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="default"
              onClick={handleTerbitkan}
              disabled={isLoading || !judul.trim() || !isi.trim()}
              className="text-xs"
            >
              Terbitkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
