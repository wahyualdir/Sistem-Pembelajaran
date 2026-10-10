import { getSession } from "@/lib/auth/session";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { KurikulumView } from "@/features/master/components/kurikulum-view";
import { MasterStore } from "@/features/master/master-store";

export default async function AdminKurikulumPage() {
  const session = await getSession();

  const mataKuliah = MasterStore.getMataKuliah();
  const prodi = MasterStore.getProdi();

  return (
    <DashboardShell
      role="ADMIN"
      userName={session?.name || "Administrator"}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Kurikulum & Mata Kuliah
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pengelolaan mata kuliah per program studi, semester paket, dan aturan prasyarat kelulusan
          </p>
        </div>

        <KurikulumView mataKuliahList={mataKuliah} prodiList={prodi} />
      </div>
    </DashboardShell>
  );
}
