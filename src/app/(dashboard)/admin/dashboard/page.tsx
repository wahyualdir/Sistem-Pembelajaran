import { getSession } from "@/lib/auth/session";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { MasterStore } from "@/features/master/master-store";
import { JadwalStore } from "@/features/jadwal/jadwal-store";
import { KrsStore } from "@/features/krs/krs-store";
import { UktStore } from "@/features/ukt/ukt-store";
import { AdminDashboardClient } from "@/features/dashboard/admin-dashboard-client";

export default async function AdminDashboardPage() {
  const session = await getSession();

  const allMhs = MasterStore.getMahasiswa();
  const allDosen = MasterStore.getDosen();
  const allProdi = MasterStore.getProdi();
  const allKelas = JadwalStore.getKelas();
  const allKrs = KrsStore.getAllKrs();
  const allTagihan = UktStore.getAllTagihan();

  const totalMahasiswa = allMhs.length;
  const totalDosen = allDosen.length;
  const totalProdi = allProdi.length;
  const totalKelas = allKelas.length;
  const totalKrsDiajukan = allKrs.filter((k) => k.status === "DIAJUKAN").length;
  const totalUktLunas = allTagihan.filter((t) => t.status === "LUNAS").length;

  // Data Grafik Mahasiswa per Prodi
  const mhsPerProdiData = allProdi.map((p) => {
    const count = allMhs.filter((m) => m.prodiId === p.id).length;
    return {
      prodi: p.nama,
      total: count,
    };
  });

  // Data Grafik Rata-Rata IPK per Angkatan
  const ipkPerAngkatanData = [
    { angkatan: "2021", rataIpk: 3.42 },
    { angkatan: "2022", rataIpk: 3.65 },
    { angkatan: "2023", rataIpk: 3.38 },
    { angkatan: "2024", rataIpk: 3.5 },
  ];

  return (
    <DashboardShell
      role="ADMIN"
      userName={session?.name || "Administrator"}
    >
      <AdminDashboardClient
        stats={{
          totalMahasiswa,
          totalDosen,
          totalProdi,
          totalKelas,
          totalKrsDiajukan,
          totalUktLunas,
        }}
        mhsPerProdiData={mhsPerProdiData}
        ipkPerAngkatanData={ipkPerAngkatanData}
      />
    </DashboardShell>
  );
}
