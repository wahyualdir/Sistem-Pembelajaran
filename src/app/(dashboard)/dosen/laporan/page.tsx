import React from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { MasterStore } from "@/features/master/master-store";
import { NilaiStore } from "@/features/nilai/nilai-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  FileSpreadsheet,
  Download,
  Users,
  Award,
  AlertCircle,
  GraduationCap,
  Filter,
} from "lucide-react";

export default async function DosenLaporanProdiPage() {
  const session = await getSession();
  const dosenId = session?.subId || "dsn-1";
  const dosen = MasterStore.getDosen().find((d) => d.id === dosenId);
  const allProdi = MasterStore.getProdi();
  
  // Deteksi jika kaprodi atau tampilkan prodi pertama (Teknik Informatika)
  const prodiDiampu = allProdi.find((p) => p.kaprodiId === dosenId) || allProdi[0];
  const allMahasiswaProdi = MasterStore.getMahasiswa().filter(
    (m) => m.prodiId === prodiDiampu.id
  );

  const allDosen = MasterStore.getDosen();
  // Perhitungan statistik prodi
  const listWithIpk = allMahasiswaProdi.map((m) => {
    const t = NilaiStore.getTranskripMahasiswa(m.id);
    const wali = allDosen.find((d) => d.id === m.dosenWaliId)?.nama || "-";
    return {
      ...m,
      ipk: t.ipk,
      totalSks: t.totalSksLulus,
      dosenWaliNama: wali,
    };
  });

  const totalMhs = listWithIpk.length;
  const totalIpk = listWithIpk.reduce((sum, m) => sum + m.ipk, 0);
  const rataIpk = totalMhs > 0 ? (totalIpk / totalMhs).toFixed(2) : "0.00";
  const mhsPerluPerhatian = listWithIpk.filter((m) => m.ipk < 2.5).length;
  const mhsCumlaude = listWithIpk.filter((m) => m.ipk >= 3.5).length;

  return (
    <DashboardShell
      role="DOSEN"
      userName={session?.name || "Dosen"}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Laporan Akademik Program Studi
              </h1>
              {dosen?.penandaKaprodi && (
                <Badge variant="outline" className="bg-primary-soft text-primary border-primary/30 text-xs">
                  Akses Kaprodi
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Data progres akademik mahasiswa {prodiDiampu.nama} ({prodiDiampu.jenjang})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/export/laporan-akademik"
              download
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[8px] bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors shadow-sm"
            >
              <Download className="h-4 w-4" />
              Ekspor Excel (.xlsx)
            </a>
          </div>
        </div>

        {/* 4 Kartu Metrik Prodi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold font-medium text-muted-foreground">
                Total Mahasiswa Aktif
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{totalMhs}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Program Studi {prodiDiampu.kode}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold font-medium text-muted-foreground">
                Rata-Rata IPK Prodi
              </CardTitle>
              <Award className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{rataIpk}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Skala 4.00 (Kriteria Mutu)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold font-medium text-muted-foreground">
                Mahasiswa IPK &ge; 3.50
              </CardTitle>
              <GraduationCap className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{mhsCumlaude}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Kategori Prestasi Tinggi
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold font-medium text-muted-foreground">
                Perlu Perhatian (IPK &lt; 2.5)
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{mhsPerluPerhatian}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Perlu Bimbingan Intensif Dosen Wali
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabel Data Mahasiswa Prodi */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-base font-semibold">
                Daftar Mahasiswa & Capaian Akademik
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Menampilkan data mahasiswa aktif pada program studi {prodiDiampu.nama}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              <span>Semua Angkatan</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted border-y border-border text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-3 px-4 font-semibold">NIM</th>
                    <th className="py-3 px-4 font-semibold">Nama Mahasiswa</th>
                    <th className="py-3 px-4 font-semibold">Angkatan</th>
                    <th className="py-3 px-4 font-semibold">Dosen Wali</th>
                    <th className="py-3 px-4 font-semibold text-center">SKS Lulus</th>
                    <th className="py-3 px-4 font-semibold text-center">IPK</th>
                    <th className="py-3 px-4 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {listWithIpk.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-foreground">
                        {m.nim}
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground">
                        {m.nama}
                        <div className="text-xs text-muted-foreground">{m.email}</div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{m.angkatan}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {m.dosenWaliNama}
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-foreground">
                        {m.totalSks}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-bold font-mono text-xs px-2 py-0.5 rounded-[6px] ${
                            m.ipk >= 3.5
                              ? "bg-success-soft text-success"
                              : m.ipk >= 3.0
                              ? "bg-primary/10 text-primary"
                              : m.ipk >= 2.5
                              ? "bg-warning/10 text-warning"
                              : "bg-danger/10 text-danger"
                          }`}
                        >
                          {m.ipk.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={m.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
