"use client";

import React, { useState, useEffect, useTransition } from "react";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bell,
  Clock,
  Mail,
  ShieldAlert,
  Save,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from "lucide-react";
import {
  JenisNotifikasi,
  PreferensiNotifikasiItem,
  DEFAULT_JENIS_AKTIF,
} from "@/features/notifikasi/types";
import {
  getPreferensiAction,
  simpanPreferensiAction,
} from "@/features/notifikasi/actions";

interface KategoriMeta {
  key: JenisNotifikasi;
  label: string;
  deskripsi: string;
  kunciKeamanan?: boolean;
}

const DAFTAR_KATEGORI: KategoriMeta[] = [
  {
    key: "KEAMANAN",
    label: "Keamanan Akun & Sesi",
    deskripsi: "Peringatan login perangkat baru, perubahan kata sandi, dan aktivitas mencurigakan.",
    kunciKeamanan: true,
  },
  {
    key: "TUGAS_TENGGAT",
    label: "Tenggat Waktu Tugas Kuliah",
    deskripsi: "Pengingat H-3, H-1, dan beberapa jam sebelum batas pengumpulan tugas perkuliahan.",
  },
  {
    key: "KRS",
    label: "Kartu Rencana Studi (KRS)",
    deskripsi: "Pemberitahuan persetujuan atau catatan penolakan dari Dosen Pembimbing Akademik.",
  },
  {
    key: "UKT",
    label: "Administrasi Keuangan & UKT",
    deskripsi: "Pengingat jatuh tempo pembayaran SPP/UKT dan konfirmasi verifikasi kwitansi lunas.",
  },
  {
    key: "NILAI",
    label: "Nilai & Hasil Studi (KHS)",
    deskripsi: "Pemberitahuan ketika dosen memfinalisasi nilai komponen baru atau koreksi nilai.",
  },
  {
    key: "KEHADIRAN",
    label: "Peringatan Batas Kehadiran",
    deskripsi: "Peringatan dini ketika persentase kehadiran kuliah mendekati batas minimal 75%.",
  },
  {
    key: "JADWAL",
    label: "Perubahan Jadwal & Ruang",
    deskripsi: "Pemberitahuan jadwal kuliah pengganti atau perpindahan ruang laboratorium.",
  },
  {
    key: "BRIEFING",
    label: "Briefing Akademik Pagi",
    deskripsi: "Ringkasan agenda perkuliahan hari ini beserta tugas aktif yang disiapkan asisten AI.",
  },
  {
    key: "PENGUMUMAN",
    label: "Pengumuman Resmi Kampus",
    deskripsi: "Surat edaran rektorat, dekanat, kalender akademik, dan kegiatan civitas akademika.",
  },
];

export default function PreferensiNotifikasiPage() {
  const [preferensi, setPreferensi] = useState<PreferensiNotifikasiItem>({
    penggunaId: "mhs-1",
    jamTenangMulai: "22:00",
    jamTenangSelesai: "06:00",
    jenisAktif: { ...DEFAULT_JENIS_AKTIF },
    emailCadangan: null,
  });

  const [jamMulai, setJamMulai] = useState("22:00");
  const [jamSelesai, setJamSelesai] = useState("06:00");
  const [emailCadangan, setEmailCadangan] = useState("");
  const [loading, setLoading] = useState(true);
  const [pesanSukses, setPesanSukses] = useState("");
  const [pesanError, setPesanError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getPreferensiAction();
        if (res.success && res.data) {
          setPreferensi(res.data);
          setJamMulai(res.data.jamTenangMulai || "22:00");
          setJamSelesai(res.data.jamTenangSelesai || "06:00");
          setEmailCadangan(res.data.emailCadangan || "");
        }
      } catch {
        // Fallback default
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleToggleKanal = (key: JenisNotifikasi, kanal: "app" | "email") => {
    // Aturan Mutlak: Peringatan KEAMANAN pada kanal in-app tidak boleh dimatikan
    if (key === "KEAMANAN" && kanal === "app") {
      return;
    }

    setPreferensi((prev) => ({
      ...prev,
      jenisAktif: {
        ...prev.jenisAktif,
        [key]: {
          ...prev.jenisAktif[key],
          [kanal]: !prev.jenisAktif[key]?.[kanal],
        },
      },
    }));
  };

  const handleSimpan = (e: React.FormEvent) => {
    e.preventDefault();
    setPesanSukses("");
    setPesanError("");

    startTransition(async () => {
      try {
        const payload: Partial<PreferensiNotifikasiItem> = {
          jamTenangMulai: jamMulai,
          jamTenangSelesai: jamSelesai,
          emailCadangan: emailCadangan.trim() || null,
          jenisAktif: preferensi.jenisAktif,
        };

        const res = await simpanPreferensiAction(payload);
        if (res.success && res.data) {
          setPreferensi(res.data);
          setPesanSukses("Pengaturan preferensi notifikasi berhasil disimpan.");
        } else {
          setPesanError(res.message || "Gagal menyimpan preferensi.");
        }
      } catch {
        setPesanError("Terjadi kendala jaringan saat menyimpan pengaturan.");
      }
    });
  };

  return (
    <DashboardShell role="MAHASISWA" userName="Wahyu Aldi Riyanto">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
            Preferensi & Saluran Notifikasi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sesuaikan jam tenang, jenis pemberitahuan akademik, dan saluran pengiriman email
          </p>
        </div>

        {/* Notifikasi Pesan Sukses / Galat */}
        {pesanSukses && (
          <div className="rounded-control border border-success-border bg-success-soft p-4 text-sm text-success flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span className="font-medium">{pesanSukses}</span>
          </div>
        )}

        {pesanError && (
          <div className="rounded-control border border-danger-border bg-danger-soft p-4 text-sm text-danger flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span className="font-medium">{pesanError}</span>
          </div>
        )}

        <form onSubmit={handleSimpan} className="space-y-6">
          {/* Kartu 1: Aturan Jam Tenang (Quiet Hours) */}
          <Card className="border-border bg-surface">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-semibold">
                  Jam Tenang Perkuliahan (Quiet Hours)
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Pada rentang waktu ini, notifikasi non-mendesak akan ditahan hingga jam tenang berakhir.
                Peringatan berkategori <strong>Mendesak</strong> dan <strong>Keamanan Akun</strong> tetap dikirimkan seketika.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground block">
                    Jam Tenang Dimulai
                  </label>
                  <Input
                    type="time"
                    value={jamMulai}
                    onChange={(e) => setJamMulai(e.target.value)}
                    disabled={loading || isPending}
                    required
                  />
                  <span className="text-xs text-muted-foreground">
                    Bawaan kampus: 22:00 WIB
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground block">
                    Jam Tenang Berakhir
                  </label>
                  <Input
                    type="time"
                    value={jamSelesai}
                    onChange={(e) => setJamSelesai(e.target.value)}
                    disabled={loading || isPending}
                    required
                  />
                  <span className="text-xs text-muted-foreground">
                    Bawaan kampus: 06:00 WIB
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kartu 2: Saluran Pemberitahuan Per Kategori */}
          <Card className="border-border bg-surface">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-semibold">
                  Jenis Peringatan & Saluran Penerimaan
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Pilih informasi apa saja yang ingin kamu terima melalui aplikasi SIAKAD dan email institusi.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border/60">
                {DAFTAR_KATEGORI.map((kat) => {
                  const statusApp = preferensi.jenisAktif[kat.key]?.app ?? true;
                  const statusEmail = preferensi.jenisAktif[kat.key]?.email ?? false;

                  return (
                    <div
                      key={kat.key}
                      className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-0.5 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {kat.label}
                          </span>
                          {kat.kunciKeamanan && (
                            <span className="rounded-control bg-warning-soft border border-warning-border px-1.5 py-0.5 text-xs font-bold text-warning flex items-center gap-1">
                              <Lock className="h-3 w-3" />
                              Wajib In-App
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {kat.deskripsi}
                        </p>
                      </div>

                      {/* Dua Tombol Kanal: Aplikasi & Email */}
                      <div className="flex items-center gap-3 shrink-0">
                        {/* Kanal Aplikasi */}
                        <label
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-control border text-xs font-medium cursor-pointer transition-colors ${
                            statusApp
                              ? "bg-primary-soft border-primary-border text-primary"
                              : "bg-surface border-border text-muted-foreground hover:bg-muted"
                          } ${kat.kunciKeamanan ? "opacity-90 cursor-not-allowed" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={statusApp}
                            disabled={kat.kunciKeamanan || loading || isPending}
                            onChange={() => handleToggleKanal(kat.key, "app")}
                            className="sr-only"
                          />
                          <Bell className="h-3.5 w-3.5" />
                          <span>Aplikasi</span>
                        </label>

                        {/* Kanal Email */}
                        <label
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-control border text-xs font-medium cursor-pointer transition-colors ${
                            statusEmail
                              ? "bg-primary-soft border-primary-border text-primary"
                              : "bg-surface border-border text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={statusEmail}
                            disabled={loading || isPending}
                            onChange={() => handleToggleKanal(kat.key, "email")}
                            className="sr-only"
                          />
                          <Mail className="h-3.5 w-3.5" />
                          <span>Email</span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Kartu 3: Email Cadangan untuk Keamanan */}
          <Card className="border-border bg-surface">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-warning" />
                <CardTitle className="text-base font-semibold">
                  Email Cadangan Pemulihan & Keamanan
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Opsional. Salinan peringatan keamanan (seperti login dari perangkat tidak dikenal) dapat dikirimkan ke alamat email pribadi cadangan di luar domain kampus.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-lg space-y-1.5">
                <label className="text-xs font-medium text-foreground block">
                  Alamat Email Cadangan
                </label>
                <Input
                  type="email"
                  placeholder="contoh.pribadi@gmail.com"
                  value={emailCadangan}
                  onChange={(e) => setEmailCadangan(e.target.value)}
                  disabled={loading || isPending}
                />
                <span className="text-xs text-muted-foreground block">
                  Kosongkan jika hanya ingin menerima ke email resmi kampus (@student.uir.ac.id).
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Tombol Simpan Perubahan */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading || isPending}
              className="flex items-center gap-2 px-6"
            >
              <Save className="h-4 w-4" />
              {isPending ? "Menyimpan..." : "Simpan Preferensi"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
