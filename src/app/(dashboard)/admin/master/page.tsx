import { getSession } from "@/lib/auth/session";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { MasterTabs } from "@/features/master/components/master-tabs";
import { MasterStore } from "@/features/master/master-store";

export default async function AdminMasterPage() {
  const session = await getSession();

  const mahasiswa = MasterStore.getMahasiswa();
  const dosen = MasterStore.getDosen();
  const prodi = MasterStore.getProdi();
  const ruang = MasterStore.getRuang();
  const tahunAjaran = MasterStore.getTahunAjaran();

  return (
    <DashboardShell
      role="ADMIN"
      userName={session?.name || "Administrator"}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Data Master Akademik
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pengelolaan entitas dasar mahasiswa, dosen, program studi, ruang perkuliahan, dan tahun ajaran
          </p>
        </div>

        <MasterTabs
          initialMahasiswa={mahasiswa}
          initialDosen={dosen}
          initialProdi={prodi}
          initialRuang={ruang}
          initialTahunAjaran={tahunAjaran}
        />
      </div>
    </DashboardShell>
  );
}
