import { getSession } from "@/lib/auth/session";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { JadwalStore } from "@/features/jadwal/jadwal-store";
import { MasterStore } from "@/features/master/master-store";
import { AdminJadwalView } from "@/features/jadwal/components/admin-jadwal-view";

export default async function AdminJadwalPage() {
  const session = await getSession();

  const kelasList = JadwalStore.getKelas();
  const mataKuliahList = MasterStore.getMataKuliah();
  const dosenList = MasterStore.getDosen();
  const ruangList = MasterStore.getRuang();

  return (
    <DashboardShell
      role="ADMIN"
      userName={session?.name || "Administrator"}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Jadwal Kuliah & Manajemen Kelas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Penyusunan rombongan belajar dan jadwal perkuliahan bebas bentrok ruang dan dosen
          </p>
        </div>

        <AdminJadwalView
          initialKelas={kelasList}
          mataKuliahList={mataKuliahList}
          dosenList={dosenList}
          ruangList={ruangList}
        />
      </div>
    </DashboardShell>
  );
}
