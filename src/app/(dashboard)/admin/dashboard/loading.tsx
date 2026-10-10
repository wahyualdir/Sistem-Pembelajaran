import { DashboardShell } from "@/components/shared/dashboard-shell";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function AdminDashboardLoading() {
  return (
    <DashboardShell role="ADMIN" userName="Memuat...">
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="h-7 w-64 bg-muted rounded-[6px]" />
            <div className="h-4 w-80 bg-muted/70 rounded-[4px]" />
          </div>
          <div className="h-6 w-36 bg-muted rounded-[4px]" />
        </div>

        {/* 4 Kartu Metrik Admin Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border border-border">
              <CardContent className="p-4 space-y-2">
                <div className="h-4 w-28 bg-muted rounded-[4px]" />
                <div className="h-8 w-14 bg-muted rounded-[6px]" />
                <div className="h-3 w-32 bg-muted/60 rounded-[4px]" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 2 Kolom Grafik & Aktivitas Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border border-border">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="h-5 w-44 bg-muted rounded-[4px]" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-64 w-full bg-muted/30 rounded-[8px]" />
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="h-5 w-44 bg-muted rounded-[4px]" />
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 w-full bg-muted/30 rounded-[8px] border border-border/40" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
