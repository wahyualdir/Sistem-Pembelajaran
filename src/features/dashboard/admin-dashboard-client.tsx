"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  BookOpen,
  CreditCard,
  TrendingUp,
  FileSpreadsheet,
  ShieldCheck,
  Award,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AdminDashboardClientProps {
  stats: {
    totalMahasiswa: number;
    totalDosen: number;
    totalKelas: number;
    totalProdi: number;
    totalUktLunas: number;
    totalKrsDiajukan: number;
  };
  mhsPerProdiData: { prodi: string; total: number }[];
  ipkPerAngkatanData: { angkatan: string; rataIpk: number }[];
}

export function AdminDashboardClient({
  stats,
  mhsPerProdiData,
  ipkPerAngkatanData,
}: AdminDashboardClientProps) {
  return (
    <div className="space-y-6">
      {/* Header Halaman & Tombol Aksi Cepat */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Dashboard Administrator
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Ringkasan data operasional kampus dan visualisasi capaian akademik
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/admin/audit">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              <span>Log Audit</span>
            </Button>
          </Link>
          <a href="/api/export/laporan-akademik" download>
            <Button variant="default" size="sm" className="flex items-center gap-1.5">
              <FileSpreadsheet className="h-4 w-4" />
              <span>Ekspor Excel (.xlsx)</span>
            </Button>
          </a>
        </div>
      </div>

      {/* 4 Kartu Metrik Statistik Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Mahasiswa Aktif
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="font-heading text-2xl font-bold text-foreground tabular-nums">
              {stats.totalMahasiswa}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tersebar di {stats.totalProdi} Program Studi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Dosen Pengajar
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="font-heading text-2xl font-bold text-foreground tabular-nums">
              {stats.totalDosen}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Termasuk Dosen Pembimbing Wali & Kaprodi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Kelas Kuliah Aktif
            </CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="font-heading text-2xl font-bold text-foreground tabular-nums">
              {stats.totalKelas}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Jadwal kuliah semester ganjil 2026/2027
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Pelunasan UKT
            </CardTitle>
            <CreditCard className="h-4 w-4 text-ink" />
          </CardHeader>
          <CardContent>
            <div className="font-heading text-2xl font-bold text-ink tabular-nums">
              {stats.totalUktLunas} / {stats.totalMahasiswa}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalKrsDiajukan} KRS diajukan/diproses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 2 Grafik Analitik Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grafik 1: Mahasiswa per Program Studi */}
        <Card>
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Jumlah Mahasiswa per Program Studi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-6">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mhsPerProdiData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" vertical={false} />
                  <XAxis
                    dataKey="prodi"
                    tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                    interval={0}
                    angle={-10}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-surface)",
                      borderColor: "var(--border-main)",
                      color: "var(--text-primary)",
                      borderRadius: "var(--radius-control)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Mahasiswa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Grafik 2: Sebaran Rata-Rata IPK per Angkatan */}
        <Card>
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-ink" />
              Sebaran Rata-Rata IPK per Angkatan
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-6">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ipkPerAngkatanData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" vertical={false} />
                  <XAxis dataKey="angkatan" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                  <YAxis domain={[0, 4]} ticks={[1, 2, 3, 4]} tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-surface)",
                      borderColor: "var(--border-main)",
                      color: "var(--text-primary)",
                      borderRadius: "var(--radius-control)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="rataIpk" fill="var(--status-success)" radius={[4, 4, 0, 0]} name="Rata-rata IPK" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
