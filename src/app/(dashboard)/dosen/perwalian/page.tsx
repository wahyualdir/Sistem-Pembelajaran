import { getSession } from "@/lib/auth/session";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { KrsStore } from "@/features/krs/krs-store";
import { BimbinganStore } from "@/features/bimbingan/bimbingan-store";
import { DosenPerwalianView } from "@/features/krs/components/dosen-perwalian-view";

export default async function DosenPerwalianPage() {
  const session = await getSession();
  const dosenId = session?.subId || "dsn-1";

  // Ambil data KRS dan Bimbingan mahasiswa bimbingan wali
  const perwalianKrs = KrsStore.getKrsByDosenWali(dosenId);
  const bimbinganList = BimbinganStore.getBimbinganByDosen(dosenId);

  return (
    <DashboardShell
      role="DOSEN"
      userName={session?.name || "Dosen Wali"}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Persetujuan KRS & Bimbingan Perwalian
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tinjauan rencana studi semester ganjil 2026/2027, persetujuan KRS, dan konsultasi akademik mahasiswa bimbingan.
          </p>
        </div>

        <DosenPerwalianView
          initialKrsList={perwalianKrs}
          initialBimbinganList={bimbinganList}
        />
      </div>
    </DashboardShell>
  );
}
