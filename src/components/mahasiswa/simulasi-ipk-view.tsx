"use client";

import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  TrendingUp,
  RotateCcw,
  Info,
  GraduationCap,
  Award,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import {
  hitungSimulasiIpk,
  ItemSimulasiSemester,
  dapatkanBobotHuruf,
} from "@/lib/akademik/simulasi-ipk";
import { NilaiTranskripItem } from "@/lib/akademik/nilai";

const OPSI_NILAI = [
  { huruf: "A", bobot: 4.0, label: "A (4.00) - Sangat Baik" },
  { huruf: "A-", bobot: 3.7, label: "A- (3.70) - Hampir Sangat Baik" },
  { huruf: "B+", bobot: 3.3, label: "B+ (3.30) - Antara Baik & Sangat Baik" },
  { huruf: "B", bobot: 3.0, label: "B (3.00) - Baik" },
  { huruf: "B-", bobot: 2.7, label: "B- (2.70) - Hampir Baik" },
  { huruf: "C+", bobot: 2.3, label: "C+ (2.30) - Lebih dari Cukup" },
  { huruf: "C", bobot: 2.0, label: "C (2.00) - Cukup" },
  { huruf: "D", bobot: 1.0, label: "D (1.00) - Kurang" },
  { huruf: "E", bobot: 0.0, label: "E (0.00) - Gagal" },
];

interface SimulasiIpkViewProps {
  transkripLalu: NilaiTranskripItem[];
  daftarMataKuliahKrs: {
    kodeMataKuliah: string;
    namaMataKuliah: string;
    sks: number;
    kelas: string;
  }[];
}

export function SimulasiIpkView({
  transkripLalu,
  daftarMataKuliahKrs,
}: SimulasiIpkViewProps) {
  // Inisialisasi state target nilai tiap mata kuliah semester berjalan (default: A)
  const [targetNilai, setTargetNilai] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const mk of daftarMataKuliahKrs) {
      initial[mk.kodeMataKuliah] = "A";
    }
    return initial;
  });

  // Susun payload input untuk simulasi
  const itemsSimulasi: ItemSimulasiSemester[] = useMemo(() => {
    return daftarMataKuliahKrs.map((mk) => {
      const huruf = targetNilai[mk.kodeMataKuliah] || "A";
      const bobot = dapatkanBobotHuruf(huruf);
      return {
        kodeMataKuliah: mk.kodeMataKuliah,
        namaMataKuliah: mk.namaMataKuliah,
        sks: mk.sks,
        targetHuruf: huruf,
        targetBobot: bobot,
      };
    });
  }, [daftarMataKuliahKrs, targetNilai]);

  // Kalkulasi proyeksi
  const hasil = useMemo(() => {
    return hitungSimulasiIpk(transkripLalu, itemsSimulasi);
  }, [transkripLalu, itemsSimulasi]);

  // Preset fungsi cepat
  const setSemuaNilai = (huruf: string) => {
    const updated: Record<string, string> = {};
    for (const mk of daftarMataKuliahKrs) {
      updated[mk.kodeMataKuliah] = huruf;
    }
    setTargetNilai(updated);
  };

  const handleUbahNilai = (kodeMk: string, hurufBaru: string) => {
    setTargetNilai((prev) => ({
      ...prev,
      [kodeMk]: hurufBaru,
    }));
  };

  const totalSksKrs = daftarMataKuliahKrs.reduce((sum, item) => sum + item.sks, 0);

  return (
    <div className="space-y-6">
      {/* Banner Penafian / Catatan Resmi */}
      <div className="rounded-[12px] border border-primary/20 bg-primary-soft/30 p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <h4 className="text-xs font-semibold text-primary">
            Perhatian: Simulasi Akademik Mandiri
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Halaman ini adalah kalkulator perencanaan proyeksi prestasi akademik
            mahasiswa. Perhitungan bersifat simulasi proyeksi dan bukan penetapan
            nilai resmi institusi.
          </p>
        </div>
      </div>

      {/* 3 Kartu Proyeksi Hasil Simulasi */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Kartu 1: IPK Saat Ini vs Proyeksi */}
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
              <span>Proyeksi IPK Kumulatif</span>
              <GraduationCap className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground font-heading tabular-nums">
                {hasil.ipkProyeksi.toFixed(2)}
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-[6px] border ${
                  hasil.selisihIpk > 0
                    ? "bg-success-soft text-success border-success/30"
                    : hasil.selisihIpk < 0
                    ? "bg-danger-soft text-danger border-danger/30"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {hasil.selisihIpk > 0 ? `+${hasil.selisihIpk.toFixed(2)}` : hasil.selisihIpk.toFixed(2)}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              IPK Saat Ini: <strong className="text-foreground">{hasil.ipkSaatIni.toFixed(2)}</strong>
            </p>
          </CardContent>
        </Card>

        {/* Kartu 2: Proyeksi IPS Semester Ini */}
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
              <span>Proyeksi IPS Semester Berjalan</span>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-3xl font-extrabold text-primary font-heading tabular-nums">
              {hasil.ipsProyeksi.toFixed(2)}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Beban Semester: <strong className="text-foreground">{totalSksKrs} SKS</strong>
            </p>
          </CardContent>
        </Card>

        {/* Kartu 3: Total SKS Kumulatif Baru */}
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
              <span>Total SKS Lulus Baru</span>
              <Award className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground font-heading tabular-nums">
                {hasil.totalSksLulusProyeksi}
              </span>
              <span className="text-xs text-muted-foreground">/ 144 SKS</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Pertambahan: <strong className="text-success">+{hasil.sksBertambah} SKS</strong>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabel Pemilih Nilai Target KRS */}
      <Card className="border border-border shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-border/50 bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold text-foreground font-heading flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              Target Nilai Mata Kuliah Semester Berjalan
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pilih target nilai huruf untuk setiap mata kuliah yang terdaftar di KRS Anda
            </p>
          </div>

          {/* Tombol Preset Cepat */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSemuaNilai("A")}
              className="text-xs h-8 gap-1.5 border-border hover:bg-primary-soft hover:text-primary"
            >
              <Award className="h-3.5 w-3.5 text-primary" />
              Semua A
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSemuaNilai("B+")}
              className="text-xs h-8 gap-1 border-border hover:bg-muted"
            >
              Semua B+
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSemuaNilai("B")}
              className="text-xs h-8 gap-1 border-border hover:bg-muted"
            >
              Semua B
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSemuaNilai("A")}
              className="text-xs h-8 gap-1 text-muted-foreground hover:text-foreground"
              title="Reset ke pengaturan awal"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Kode & Mata Kuliah</th>
                  <th className="py-3 px-4 w-20 text-center">Kelas</th>
                  <th className="py-3 px-4 w-20 text-center">SKS</th>
                  <th className="py-3 px-4 w-52">Target Nilai</th>
                  <th className="py-3 px-4 w-28 text-center">Bobot Mutu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {daftarMataKuliahKrs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Tidak ada mata kuliah aktif di KRS semester ini.
                    </td>
                  </tr>
                ) : (
                  daftarMataKuliahKrs.map((mk, idx) => {
                    const nilaiPilihan = targetNilai[mk.kodeMataKuliah] || "A";
                    const bobot = dapatkanBobotHuruf(nilaiPilihan);

                    return (
                      <tr key={mk.kodeMataKuliah} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 text-center font-medium text-muted-foreground">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                              {mk.kodeMataKuliah}
                            </Badge>
                            <span className="font-semibold text-foreground">
                              {mk.namaMataKuliah}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-medium text-foreground">
                          {mk.kelas}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-foreground">
                          {mk.sks}
                        </td>
                        <td className="py-2.5 px-4">
                          <select
                            value={nilaiPilihan}
                            onChange={(e) => handleUbahNilai(mk.kodeMataKuliah, e.target.value)}
                            className="w-full rounded-[6px] border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                          >
                            {OPSI_NILAI.map((opt) => (
                              <option key={opt.huruf} value={opt.huruf}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center justify-center font-bold text-primary font-heading tabular-nums bg-primary-soft/50 px-2.5 py-0.5 rounded-[6px] border border-primary/20">
                            {bobot.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
