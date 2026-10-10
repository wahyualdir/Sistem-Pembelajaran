import { getSession } from "@/lib/auth/session";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { JadwalStore } from "@/features/jadwal/jadwal-store";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Users } from "lucide-react";

export default async function DosenKelasPage() {
  const session = await getSession();
  const dosenId = session?.subId || "dsn-1";

  const allKelas = JadwalStore.getKelas();
  // Filter kelas yang diampu dosen ini, atau tampilkan semua jika demo dosen pengampu
  const dosenKelas = allKelas.filter((k) => k.dosenId === dosenId || dosenId === "dsn-1");

  return (
    <DashboardShell
      role="DOSEN"
      userName={session?.name || "Dosen Pengajar"}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Daftar Kelas Perkuliahan Diampu
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Informasi rombongan belajar, alokasi ruang perkuliahan, dan kuota mahasiswa semester berjalan
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode MK</TableHead>
              <TableHead>Nama Mata Kuliah</TableHead>
              <TableHead>Kelas</TableHead>
              <TableHead>SKS</TableHead>
              <TableHead>Jadwal Pertemuan</TableHead>
              <TableHead>Ruang Kuliah</TableHead>
              <TableHead>Peserta Terdaftar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dosenKelas.map((k) => (
              <TableRow key={k.id}>
                <TableCell className="font-semibold text-foreground">
                  {k.kodeMataKuliah}
                </TableCell>
                <TableCell className="font-medium">{k.namaMataKuliah}</TableCell>
                <TableCell>
                  <Badge variant="secondary">Kelas {k.kode}</Badge>
                </TableCell>
                <TableCell>{k.sks} SKS</TableCell>
                <TableCell>
                  {k.jadwal.map((j) => (
                    <div key={j.id} className="flex items-center gap-1.5 text-xs text-foreground">
                      <Clock className="h-3 w-3 text-primary" />
                      <span>{j.hari}, {j.jamMulai} - {j.jamSelesai} WIB</span>
                    </div>
                  ))}
                </TableCell>
                <TableCell>
                  {k.jadwal.map((j) => (
                    <div key={j.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{j.namaRuang}</span>
                    </div>
                  ))}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    <span>{k.terisi} / {k.kuota} Mahasiswa</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </DashboardShell>
  );
}
