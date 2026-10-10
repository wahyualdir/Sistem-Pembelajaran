import { getSession } from "@/lib/auth/session";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { UktStore } from "@/features/ukt/ukt-store";
import { AdminUktView } from "@/features/ukt/components/admin-ukt-view";

export default async function AdminUktPage() {
  const session = await getSession();
  const allTagihan = UktStore.getAllTagihan();

  return (
    <DashboardShell
      role="ADMIN"
      userName={session?.name || "Administrator"}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Manajemen Tagihan UKT & Dispensasi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pencatatan pembayaran UKT mahasiswa dan pemberian izin dispensasi pembuka pengisian KRS
          </p>
        </div>

        <AdminUktView initialTagihan={allTagihan} />
      </div>
    </DashboardShell>
  );
}
