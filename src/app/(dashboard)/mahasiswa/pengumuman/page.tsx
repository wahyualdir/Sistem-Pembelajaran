"use client";

import React, { useState } from "react";
import {
  Bell,
  Clock,
  CheckCircle,
  Eye,
  BookmarkCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AdministrasiStore,
  PengumumanItem,
} from "@/features/administrasi/administrasi-store";
import { tandaiPengumumanDibacaAction } from "@/features/administrasi/actions";

export default function MahasiswaPengumumanPage() {
  const mahasiswaId = "mhs-1";
  const userProfile = {
    peran: "MAHASISWA" as const,
    prodiId: "prodi-tif",
    angkatan: 2022,
  };

  const daftarPengumuman = AdministrasiStore.getPengumumanForUser(
    userProfile,
    mahasiswaId
  );

  const [notifState, setNotifState] = useState(daftarPengumuman);

  const handleTandaiDibaca = async (id: string) => {
    await tandaiPengumumanDibacaAction(id);
    setNotifState((prev) =>
      prev.map((item) => (item.id === id ? { ...item, sudahDibaca: true } : item))
    );
  };

  const belumDibacaCount = notifState.filter((p) => !p.sudahDibaca).length;

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Pengumuman & Informasi Kampus
          </h1>
          <p className="text-sm text-muted-foreground">
            Kumpulan edaran resmi, jadwal kegiatan akademik, dan pengumuman program studi.
          </p>
        </div>

        {belumDibacaCount > 0 && (
          <Badge variant="warning" className="text-xs px-3 py-1 gap-1">
            <Bell className="h-3 w-3" />
            {belumDibacaCount} Belum Dibaca
          </Badge>
        )}
      </div>

      {/* Daftar Pengumuman */}
      <div className="space-y-4">
        {notifState.length > 0 ? (
          notifState.map((item) => (
            <Card
              key={item.id}
              className={`transition-colors ${
                !item.sudahDibaca ? "border-primary/60 bg-surface shadow-sm" : "border-border"
              }`}
            >
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
                        className="text-xs"
                      >
                        {item.targetNama || item.target}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.terbitPada}
                      </span>
                      {!item.sudahDibaca && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gray-soft/20 text-ink">
                          Baru
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-base font-bold text-foreground">
                      {item.judul}
                    </CardTitle>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {!item.sudahDibaca ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTandaiDibaca(item.id)}
                        className="gap-1 text-xs"
                      >
                        <BookmarkCheck className="h-3.5 w-3.5" />
                        Tandai Dibaca
                      </Button>
                    ) : (
                      <span className="text-xs text-ink flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Sudah Dibaca
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-2">
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">
                  {item.isi}
                </p>
                <div className="pt-2 text-xs text-muted-foreground border-t border-border flex items-center justify-between">
                  <span>Diterbitkan oleh: <strong>{item.namaPenulis}</strong></span>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-xs text-muted-foreground">
              Tidak ada pengumuman untuk Anda saat ini.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
