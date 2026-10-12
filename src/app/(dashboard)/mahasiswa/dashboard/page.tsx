import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { MasterStore } from "@/features/master/master-store";
import { NilaiStore } from "@/features/nilai/nilai-store";
import { KrsStore } from "@/features/krs/krs-store";
import { UktStore } from "@/features/ukt/ukt-store";
import { PresensiStore } from "@/features/presensi/presensi-store";
import { AdministrasiStore } from "@/features/administrasi/administrasi-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { pilihJadwalTerdekat, InputJadwalKuliah } from "@/lib/akademik/jadwal-terdekat";
import { IpsTrendChart } from "@/components/mahasiswa/ips-trend-chart";
import {
  Calendar,
  Bell,
  Clock,
  AlertTriangle,
  GraduationCap,
  CreditCard,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  MapPin,
  User,
  CheckCircle2,
  TrendingUp,
  Award,
  ArrowRight,
  CalendarDays,
} from "lucide-react";

export default async function MahasiswaDashboardPage() {
  const session = await getSession();
  const mahasiswaId = session?.subId || "mhs-1";
  const mahasiswa = MasterStore.getMahasiswaById(mahasiswaId);

  // 1. Data Akademik Terpadu
  const transkrip = NilaiStore.getTranskripMahasiswa(mahasiswaId);
  const krs = KrsStore.getKrsByMahasiswa(mahasiswaId);
  const tagihan = UktStore.getTagihanByMahasiswa(mahasiswaId);
  const rekapPresensi = PresensiStore.getRekapMahasiswa(mahasiswaId);
  const riwayatIps = NilaiStore.getRiwayatIpsMahasiswa(mahasiswaId);

  // 2. Filter Pengumuman Relevan
  const userProfile = {
    peran: "MAHASISWA" as const,
    prodiId: mahasiswa?.prodiId,
    angkatan: mahasiswa?.angkatan,
  };
  const pengumuman = AdministrasiStore.getPengumumanForUser(
    userProfile,
    session?.userId || "user-3"
  ).slice(0, 3);

  const prodiNama =
    MasterStore.getProdi().find((p) => p.id === mahasiswa?.prodiId)?.nama ||
    "Teknik Informatika";

  // 3. Deteksi Peringatan Presensi (< 80%) & Rata-rata Presensi
  const presensiPeringatan = rekapPresensi.filter((r) => r.peringatan || r.persentase < 80);
  const totalPresensi = rekapPresensi.reduce((acc, curr) => acc + curr.persentase, 0);
  const rataRataPresensi = rekapPresensi.length > 0 ? Math.round(totalPresensi / rekapPresensi.length) : 100;

  // 4. Kumpulkan Seluruh Jadwal KRS Mahasiswa
  const semuaJadwalKrs: InputJadwalKuliah[] = [];
  if (krs && (krs.status === "DISETUJUI" || krs.status === "DIAJUKAN")) {
    for (const item of krs.items) {
      for (const j of item.kelas.jadwal || []) {
        semuaJadwalKrs.push({
          mataKuliah: item.kelas.namaMataKuliah,
          kodeMk: item.kelas.kodeMataKuliah,
          kelas: item.kelas.kode,
          sks: item.kelas.sks,
          hari: j.hari,
          jamMulai: j.jamMulai,
          jamSelesai: j.jamSelesai,
          ruang: j.namaRuang || "Ruang Kuliah",
          dosen: item.kelas.namaDosen,
        });
      }
    }
  }

  // 5. Eksekusi Algoritma Pemilihan Jadwal Terdekat
  const waktuSekarang = new Date();
  const infoJadwal = pilihJadwalTerdekat(semuaJadwalKrs, waktuSekarang, 4);

  // 6. Nama Depan Mahasiswa untuk Sapaan Personal
  const namaLengkap = mahasiswa?.nama || session?.name || "Mahasiswa";
  const namaDepan = namaLengkap.split(" ")[0];

  // 7. Kalkulasi Target SKS Kelulusan S1 (144 SKS)
  const targetSksTotal = 144;
  const persenSksLulus = Math.min(100, Math.round((transkrip.totalSksLulus / targetSksTotal) * 100));

  return (
    <DashboardShell
      role="MAHASISWA"
      userName={namaLengkap}
    >
      <div className="space-y-6 animate-fade-up">
        {/* ======================================================== */}
        {/* HEADER: Retro Window Sticker Header (Image 2 & 3)       */}
        {/* ======================================================== */}
        <div className="rounded-lg border-[1.5px] border-retro-border bg-retro-surface shadow-retro-md overflow-hidden transition-all">
          {/* Header Bar Jendela Retro dengan Titik Sticker */}
          <div className="flex items-center justify-between px-4 py-2 border-b-[1.5px] border-retro-border bg-retro-warm/70">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border border-retro-border bg-traffic-red shadow-retro-sm" />
              <span className="h-3 w-3 rounded-full border border-retro-border bg-traffic-yellow shadow-retro-sm" />
              <span className="h-3 w-3 rounded-full border border-retro-border bg-traffic-green shadow-retro-sm" />
              <span className="text-[11px] font-mono font-bold text-muted-foreground ml-2">
                siakad://dashboard.mahasiswa
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-retro-orange uppercase tracking-wider">
              ONLINE
            </span>
          </div>

          <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-heading">
                  {infoJadwal.salamWaktu}, {namaDepan}!
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full border-[1.5px] border-retro-border bg-retro-mint text-foreground text-xs font-bold shadow-xs">
                  Semester 5
                </span>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <span>{infoJadwal.pesanKontekstual}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-retro-border/40">
              <span className="inline-flex items-center px-3 py-1 rounded-md border-[1.5px] border-retro-border bg-retro-warm text-foreground text-xs font-bold shadow-xs">
                {prodiNama}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-md border-[1.5px] border-retro-border bg-retro-warm text-foreground text-xs font-bold shadow-xs">
                NIM: {mahasiswa?.nim || "223510001"}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-md border-[1.5px] border-retro-border bg-retro-warm text-foreground text-xs font-bold shadow-xs">
                Angkatan {mahasiswa?.angkatan || 2022}
              </span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* HERO SECTION: Metrik IPK, Kemajuan SKS & Tren IPS        */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Kartu 1: IPK, Kelulusan SKS & Tren IPS (7 Kolom) */}
          <Card className="lg:col-span-7 overflow-hidden border border-border shadow-sm hover:border-primary/40 transition-all duration-200">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  Pencapaian Akademik Kumulatif
                </CardTitle>
                <span className="text-xs font-medium text-success flex items-center gap-1">
                  <Award className="h-3.5 w-3.5" />
                  Status: Mahasiswa Aktif
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                {/* Metrik Angka IPK */}
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Indeks Prestasi Kumulatif (IPK)
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-primary font-heading tabular-nums tracking-tight">
                      {transkrip.ipk.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">/ 4.00</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Beban Maksimal Semester Ini: <strong className="text-foreground">{krs.batasSks} SKS</strong>
                  </p>
                </div>

                {/* Kemajuan Kelulusan SKS */}
                <div className="space-y-2 p-3 rounded-[8px] bg-muted/30 border border-border/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">Kemajuan Kelulusan</span>
                    <span className="font-bold text-foreground font-heading tabular-nums">
                      {transkrip.totalSksLulus} / {targetSksTotal} SKS ({persenSksLulus}%)
                    </span>
                  </div>
                  {/* Progress Bar SKS */}
                  <div className="w-full bg-border rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${persenSksLulus}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground flex justify-between">
                    <span>Sisa SKS menuju wisuda:</span>
                    <strong className="text-foreground">{Math.max(0, targetSksTotal - transkrip.totalSksLulus)} SKS</strong>
                  </p>
                </div>
              </div>

              {/* Sparkline Tren IPS Semester */}
              <div className="pt-2 border-t border-border/50">
                <IpsTrendChart data={riwayatIps} />
              </div>
            </CardContent>
          </Card>

          {/* Kartu 2: Daftar Periksa Semester Ini / Checklist (5 Kolom) */}
          <Card className="lg:col-span-5 overflow-hidden border border-border shadow-sm hover:border-primary/40 transition-all duration-200">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Daftar Periksa Semester Ini
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono py-0">
                  2026/2027 Ganjil
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {/* Item 1: Status KRS */}
              <div className="flex items-start justify-between p-3 rounded-[8px] border border-border/60 bg-surface hover:bg-muted/30 transition-colors">
                <div className="flex items-start gap-2.5">
                  <FileCheck className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Kartu Rencana Studi (KRS)</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {krs.totalSks} SKS • Wali: {krs.namaDosenWali?.split(",")[0] || "Dosen Wali"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={krs.status} />
                  <Link href="/mahasiswa/krs" className="text-[11px] text-primary hover:underline font-medium inline-flex items-center">
                    Detail <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              {/* Item 2: Status UKT */}
              <div className="flex items-start justify-between p-3 rounded-[8px] border border-border/60 bg-surface hover:bg-muted/30 transition-colors">
                <div className="flex items-start gap-2.5">
                  <CreditCard className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Status Keuangan UKT</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {tagihan?.status === "LUNAS" ? "Bebas administrasi keuangan" : "Harap periksa tagihan"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={tagihan?.status || "LUNAS"} />
                  <Link href="/mahasiswa/ukt" className="text-[11px] text-primary hover:underline font-medium inline-flex items-center">
                    Cek <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              {/* Item 3: Status Presensi UAS */}
              <div className="flex items-start justify-between p-3 rounded-[8px] border border-border/60 bg-surface hover:bg-muted/30 transition-colors">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Syarat Kehadiran UAS</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Rata-rata: <strong className="text-foreground">{rataRataPresensi}%</strong> (Batas min. 75%)
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className={`text-[11px] font-medium py-0.5 px-2 ${rataRataPresensi >= 75 ? "bg-success-soft text-success border-success/30" : "bg-danger-soft text-danger border-danger/30"}`}>
                    {rataRataPresensi >= 75 ? "Aman" : "Kritis"}
                  </Badge>
                  <Link href="/mahasiswa/presensi" className="text-[11px] text-primary hover:underline font-medium inline-flex items-center">
                    Rekap <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ======================================================== */}
        {/* PERINGATAN PRESENSI & JADWAL PENTING                      */}
        {/* ======================================================== */}
        {presensiPeringatan.length > 0 && (
          <div className="rounded-[12px] border border-warning/30 bg-warning/10 p-4 transition-all">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <h3 className="text-sm font-semibold text-warning">
                  Peringatan Kehadiran Mendekati Batas Minimal UAS (75%)
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Terdapat {presensiPeringatan.length} mata kuliah dengan kehadiran di bawah 80%. Pastikan Anda tidak melebihi batas toleransi ketidakhadiran agar dapat mengikuti Ujian Akhir Semester.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {presensiPeringatan.map((p) => (
                    <span
                      key={p.kelasId}
                      className="inline-flex items-center gap-1.5 rounded-[8px] bg-surface px-2.5 py-1 text-xs font-medium text-warning border border-warning/20 shadow-sm"
                    >
                      <span>{p.namaMataKuliah}</span>
                      <strong className="text-danger font-bold">{p.persentase}%</strong>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2 KOLOM UTAMA: Jadwal Terdekat & Pengumuman / Kalender    */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Kolom Kiri: Jadwal Kuliah Terdekat (7 Kolom) */}
          <Card className="lg:col-span-7 border border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50">
              <div className="space-y-0.5">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground font-heading">
                  <Clock className="h-4 w-4 text-primary" />
                  Jadwal Kuliah Terdekat
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {infoJadwal.adaHariIni
                    ? `${infoJadwal.jumlahKelasHariIni} kelas terjadwal untuk hari ini`
                    : "Menampilkan jadwal sesi perkuliahan berikutnya"}
                </p>
              </div>
              <Link
                href="/mahasiswa/jadwal"
                className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5"
              >
                Kalender Lengkap
                <ChevronRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {infoJadwal.jadwalTerdekat.length === 0 ? (
                <div className="rounded-[8px] border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                  Tidak ada jadwal perkuliahan terdaftar untuk semester ini.
                </div>
              ) : (
                infoJadwal.jadwalTerdekat.map((j, idx) => (
                  <div
                    key={idx}
                    className={`rounded-[10px] border p-3.5 transition-all hover:translate-y-[-2px] hover:shadow-sm ${
                      j.sedangBerlangsung
                        ? "border-success/40 bg-success-soft/30"
                        : j.adalahHariIni
                        ? "border-primary/30 bg-primary-soft/20"
                        : "border-border bg-surface hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-[6px] border ${
                              j.sedangBerlangsung
                                ? "bg-success text-white border-transparent"
                                : j.adalahHariIni
                                ? "bg-primary text-white border-transparent"
                                : "bg-muted text-muted-foreground border-border"
                            }`}
                          >
                            {j.labelRelatif}
                          </span>
                          <span className="text-xs font-mono font-medium text-muted-foreground">
                            {j.kodeMk} • Kls {j.kelas}
                          </span>
                        </div>
                        <h4 className="font-semibold text-foreground text-sm mt-1 font-heading">
                          {j.mataKuliah}
                        </h4>
                      </div>
                      <Badge variant="secondary" className="text-xs flex-shrink-0 font-medium">
                        {j.sks} SKS
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-2 border-t border-border/50 mt-2">
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        {j.jamMulai} - {j.jamSelesai} WIB
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {j.ruang}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        {j.dosen}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Kolom Kanan: Pengumuman & Tenggat Penting (5 Kolom) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Widget Tenggat Penting */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground font-heading">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Yang Perlu Diperhatikan
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5">
                <div className="flex items-center justify-between p-2.5 rounded-[8px] bg-muted/40 border border-border/60">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground block">
                      Batas Perubahan / Revisi KRS
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      31 Oktober 2026
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[11px] bg-primary-soft text-primary font-medium">
                    Sedang Berjalan
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-[8px] bg-muted/40 border border-border/60">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground block">
                      Pekan Ujian Tengah Semester (UTS)
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      1 - 15 November 2026
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[11px] bg-muted text-muted-foreground font-medium">
                    Mendatang
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Widget Pengumuman Akademik */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground font-heading">
                  <Bell className="h-4 w-4 text-primary" />
                  Pengumuman Akademik
                </CardTitle>
                <Link
                  href="/mahasiswa/pengumuman"
                  className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5"
                >
                  Semua
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {pengumuman.length === 0 ? (
                  <div className="rounded-[8px] border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                    Belum ada pengumuman terbaru untuk program studi Anda.
                  </div>
                ) : (
                  pengumuman.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[8px] border border-border/70 p-3 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-foreground text-xs line-clamp-1">
                          {item.judul}
                        </h4>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">
                          {item.terbitPada}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.isi}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ======================================================== */}
        {/* AKSES CEPAT LAYANAN AKADEMIK                             */}
        {/* ======================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/mahasiswa/krs"
            className="flex items-center justify-between p-3.5 rounded-lg bg-retro-surface border-[1.5px] border-retro-border hover:bg-retro-warm hover:translate-y-[-2px] transition-all text-xs font-bold text-foreground shadow-retro"
          >
            <span className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-retro-orange" />
              Kartu Rencana Studi
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            href="/mahasiswa/nilai"
            className="flex items-center justify-between p-3.5 rounded-lg bg-retro-surface border-[1.5px] border-retro-border hover:bg-retro-warm hover:translate-y-[-2px] transition-all text-xs font-bold text-foreground shadow-retro"
          >
            <span className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-retro-orange" />
              KHS & Transkrip
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            href="/mahasiswa/presensi"
            className="flex items-center justify-between p-3.5 rounded-lg bg-retro-surface border-[1.5px] border-retro-border hover:bg-retro-warm hover:translate-y-[-2px] transition-all text-xs font-bold text-foreground shadow-retro"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-retro-orange" />
              Rekap Kehadiran
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            href="/mahasiswa/ujian"
            className="flex items-center justify-between p-3.5 rounded-lg bg-retro-surface border-[1.5px] border-retro-border hover:bg-retro-warm hover:translate-y-[-2px] transition-all text-xs font-bold text-foreground shadow-retro"
          >
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-retro-orange" />
              Jadwal & Kartu Ujian
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
