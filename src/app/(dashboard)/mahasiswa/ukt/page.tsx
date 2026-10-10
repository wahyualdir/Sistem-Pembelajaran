import { getSession } from "@/lib/auth/session";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { UktStore } from "@/features/ukt/ukt-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";
import { CreditCard, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

export default async function MahasiswaUktPage() {
  const session = await getSession();
  const mahasiswaId = session?.subId || "mhs-1";
  const tagihan = UktStore.getTagihanByMahasiswa(mahasiswaId);

  return (
    <DashboardShell
      role="MAHASISWA"
      userName={session?.name || "Mahasiswa"}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Informasi Pembayaran UKT
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Status tagihan Uang Kuliah Tunggal (UKT) dan administrasi keuangan perkuliahan
          </p>
        </div>

        {tagihan ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Rincian Tagihan Semester Berjalan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-[8px] bg-muted p-4 space-y-2 border border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tahun Akademik:</span>
                    <span className="font-semibold text-foreground">{tagihan.tahunAjaranKode}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Nama Mahasiswa:</span>
                    <span className="font-semibold text-foreground">{tagihan.namaMahasiswa}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Nomor Induk (NIM):</span>
                    <span className="font-semibold text-foreground">{tagihan.nimMahasiswa}</span>
                  </div>
                  <div className="flex justify-between text-base pt-2 border-t border-border">
                    <span className="font-bold text-foreground">Nominal UKT:</span>
                    <span className="font-bold text-primary">{formatRupiah(tagihan.jumlah)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-[8px] border border-border">
                  <div>
                    <span className="text-xs text-muted-foreground block">Status Administrasi Keuangan:</span>
                    <Badge
                      variant={
                        tagihan.status === "LUNAS"
                          ? "success"
                          : tagihan.status === "DISPENSASI"
                          ? "warning"
                          : "danger"
                      }
                      className="mt-1"
                    >
                      {tagihan.status === "LUNAS"
                        ? "LUNAS TERVERIFIKASI"
                        : tagihan.status === "DISPENSASI"
                        ? "DISPENSASI DISETUJUI"
                        : "BELUM DILUNASI"}
                    </Badge>
                  </div>

                  {tagihan.status === "LUNAS" && (
                    <div className="text-right text-xs text-muted-foreground">
                      <p>Tanggal: {tagihan.tanggalBayar || "-"}</p>
                      <p className="font-mono text-[11px] text-foreground mt-0.5">
                        Ref: {tagihan.buktiPembayaran || "-"}
                      </p>
                    </div>
                  )}
                </div>

                {tagihan.catatan && (
                  <div className="rounded-[8px] bg-primary-tint/50 border border-primary/20 p-3 text-xs text-foreground">
                    <span className="font-semibold text-primary">Keterangan: </span>
                    {tagihan.catatan}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Panduan & Syarat KRS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    Pelunasan UKT membuka kunci pengisian Kartu Rencana Studi (KRS) online.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>
                    Pembayaran dapat dilakukan melalui Virtual Account Bank Riau Kepri Syariah atau Bank Mitra.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <span>
                    Mahasiswa yang membutuhkan keringanan jadwal pembayaran dapat mengajukan dispensasi ke Bagian Keuangan Kampus.
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-xs text-muted-foreground">
              Tidak ada data tagihan yang ditemukan untuk semester ini.
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
