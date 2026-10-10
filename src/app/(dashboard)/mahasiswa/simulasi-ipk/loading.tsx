import { DashboardShell } from "@/components/shared/dashboard-shell";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function MahasiswaSimulasiIpkLoading() {
  return (
    <DashboardShell role="MAHASISWA" userName="Memuat...">
      <div className="space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-muted rounded-[6px]" />
          <div className="h-4 w-96 bg-muted/70 rounded-[4px]" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border border-border">
              <CardContent className="p-4 space-y-2">
                <div className="h-4 w-28 bg-muted rounded-[4px]" />
                <div className="h-8 w-16 bg-muted rounded-[6px]" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border border-border">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="h-5 w-48 bg-muted rounded-[4px]" />
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 w-full bg-muted/30 rounded-[8px]" />
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
