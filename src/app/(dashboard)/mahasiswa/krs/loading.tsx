import { DashboardShell } from "@/components/shared/dashboard-shell";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function MahasiswaKrsLoading() {
  return (
    <DashboardShell role="MAHASISWA" userName="Memuat...">
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="h-7 w-56 bg-muted rounded-[6px]" />
            <div className="h-4 w-80 bg-muted/70 rounded-[4px]" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-28 bg-muted rounded-[8px]" />
            <div className="h-8 w-28 bg-muted rounded-[8px]" />
          </div>
        </div>

        {/* Ringkasan KRS Skeleton */}
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

        {/* Tabel Mata Kuliah Skeleton */}
        <Card className="border border-border">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="h-5 w-48 bg-muted rounded-[4px]" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/60">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-48 bg-muted rounded-[4px]" />
                    <div className="h-3 w-64 bg-muted/60 rounded-[4px]" />
                  </div>
                  <div className="h-8 w-20 bg-muted rounded-[6px]" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
