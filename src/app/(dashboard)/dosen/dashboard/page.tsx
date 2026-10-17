import { getSession } from "@/lib/auth/session";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  BookOpen,
  Users,
  ClipboardCheck,
  CheckSquare,
  GraduationCap,
  MessageSquare,
  Clock,
  ArrowRight,
} from "lucide-react";
import { JadwalStore } from "@/features/jadwal/jadwal-store";
import { KrsStore } from "@/features/krs/krs-store";
import { NilaiStore } from "@/features/nilai/nilai-store";
import { BimbinganStore } from "@/features/bimbingan/bimbingan-store";

export default async function DosenDashboardPage() {
  const session = await getSession();
  const dosenId = session?.subId || "dsn-1";

  const daftarKelas = JadwalStore.getKelasByDosen(dosenId);
  const krsPerwalian = KrsStore.getKrsByDosenWali(dosenId);
  const krsMenunggu = krsPerwalian.filter((k) => k.status === "DIAJUKAN").length;

  const kelasNilai = NilaiStore.getKelasByDosen(dosenId);
  const nilaiBelumFinal = kelasNilai.filter((k) => !k.statusFinal).length;

  const bimbinganList = BimbinganStore.getBimbinganByDosen(dosenId);
  const bimbinganMenunggu = bimbinganList.filter((b) => b.status === "DIAJUKAN").length;

  return (
    <DashboardShell
      role="DOSEN"
      userName={session?.name || "Dr. Ardiansyah"}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard Dosen Pengajar & Wali
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Selamat datang, <span className="font-semibold text-foreground">{session?.name}</span>. Kelola kegiatan perkuliahan, evaluasi nilai, dan bimbingan akademik Anda di sini.
          </p>
        </div>

        {/* 4 Kartu Metrik Utama */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                Kelas Diampu
              </CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {daftarKelas.length} Kelas
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Semester Ganjil 2026/2027
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                Persetujuan KRS
              </CardTitle>
              <ClipboardCheck className="h-4 w-4 text-ink" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${krsMenunggu > 0 ? "text-ink" : "text-ink"}`}>
                {krsMenunggu} Menunggu
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Dari {krsPerwalian.length} mahasiswa perwalian
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                Nilai Belum Final
              </CardTitle>
              <GraduationCap className="h-4 w-4 text-primary-dark" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary-dark">
                {nilaiBelumFinal} Kelas
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Perlu input & penguncian nilai
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                Konsultasi Bimbingan
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {bimbinganMenunggu} Pengajuan
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Menunggu arahan pembimbing
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Daftar Kelas Diampu & Jadwal Mengajar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Kelas Kuliah yang Diampu
              </CardTitle>
              <Link href="/dosen/kelas" className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1">
                Lihat Semua <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {daftarKelas.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center justify-between p-3 rounded-[8px] border border-border bg-muted"
                >
                  <div>
                    <span className="font-bold text-xs text-primary block">
                      {k.kodeMataKuliah} (Kelas {k.kode})
                    </span>
                    <span className="text-xs font-medium text-foreground">
                      {k.namaMataKuliah} • {k.sks} SKS
                    </span>
                    <span className="text-xs text-muted-foreground block mt-0.5">
                      Jadwal: {k.jadwal[0]?.hari}, {k.jadwal[0]?.jamMulai}-{k.jadwal[0]?.jamSelesai} ({k.jadwal[0]?.namaRuang})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link href={`/dosen/presensi`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                        <CheckSquare className="h-3 w-3" />
                        Presensi
                      </Button>
                    </Link>
                    <Link href={`/dosen/nilai`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                        <GraduationCap className="h-3 w-3" />
                        Nilai
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Akses Cepat Perwalian & Tugas */}
          <Card>
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Perhatian Akademik Dosen
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {krsMenunggu > 0 ? (
                <div className="p-3 rounded-[8px] bg-gray-soft/10 border border-ink text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-bold text-ink">
                      {krsMenunggu} Mahasiswa Menunggu Persetujuan KRS
                    </p>
                    <p className="text-muted-foreground">
                      Tinjau beban SKS dan mata kuliah sebelum masa pengisian berakhir.
                    </p>
                  </div>
                  <Link href="/dosen/perwalian">
                    <Button size="sm" className="text-xs h-7">
                      Tinjau KRS
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="p-3 rounded-[8px] bg-surface border border-ink text-xs text-ink flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 shrink-0" />
                  <span>Seluruh pengajuan KRS mahasiswa bimbingan telah diproses.</span>
                </div>
              )}

              {bimbinganMenunggu > 0 && (
                <div className="p-3 rounded-[8px] bg-primary/10 border border-primary/20 text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-bold text-primary">
                      {bimbinganMenunggu} Permohonan Bimbingan Baru
                    </p>
                    <p className="text-muted-foreground">
                      Mahasiswa mengajukan pertanyaan terkait konsultasi studi dan tugas akhir.
                    </p>
                  </div>
                  <Link href="/dosen/perwalian">
                    <Button size="sm" variant="outline" className="text-xs h-7">
                      Beri Arahan
                    </Button>
                  </Link>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Perlu mendistribusikan bahan ajar?</span>
                <Link href="/dosen/materi-tugas" className="text-primary font-medium hover:underline inline-flex items-center gap-1">
                  Buka Modul & Tugas <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
