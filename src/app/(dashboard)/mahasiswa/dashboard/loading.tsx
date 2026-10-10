import { DashboardShell } from "@/components/shared/dashboard-shell";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function MahasiswaDashboardLoading() {
  return (
    <DashboardShell role="MAHASISWA" userName="Memuat...">
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-3 rounded-[12px] bg-surface p-5 border border-border md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="h-7 w-64 bg-muted rounded-[6px]" />
            <div className="h-4 w-96 bg-muted/70 rounded-[4px]" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-32 bg-muted rounded-[4px]" />
            <div className="h-6 w-24 bg-muted rounded-[4px]" />
          </div>
        </div>

        {/* Hero Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Card className="lg:col-span-7 border border-border">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="h-5 w-48 bg-muted rounded-[4px]" />
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted rounded-[4px]" />
                  <div className="h-10 w-28 bg-muted rounded-[6px]" />
                  <div className="h-3 w-40 bg-muted/60 rounded-[4px]" />
                </div>
                <div className="p-3 rounded-[8px] bg-muted/20 border border-border/40 space-y-2">
                  <div className="h-4 w-36 bg-muted rounded-[4px]" />
                  <div className="h-2.5 w-full bg-muted rounded-full" />
                  <div className="h-3 w-48 bg-muted/60 rounded-[4px]" />
                </div>
              </div>
              <div className="pt-2 border-t border-border/40">
                <div className="h-20 w-full bg-muted/30 rounded-[8px]" />
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-5 border border-border">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="h-5 w-40 bg-muted rounded-[4px]" />
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 w-full bg-muted/30 rounded-[8px] border border-border/40" />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 2 Kolom Jadwal & Pengumuman Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-7 border border-border">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="h-5 w-44 bg-muted rounded-[4px]" />
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 w-full bg-muted/30 rounded-[10px] border border-border/40" />
              ))}
            </CardContent>
          </Card>

          <div className="lg:col-span-5 space-y-5">
            <Card className="border border-border">
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="h-5 w-40 bg-muted rounded-[4px]" />
              </CardHeader>
              <CardContent className="p-4 space-y-2.5">
                <div className="h-12 w-full bg-muted/30 rounded-[8px]" />
                <div className="h-12 w-full bg-muted/30 rounded-[8px]" />
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="h-5 w-40 bg-muted rounded-[4px]" />
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="h-16 w-full bg-muted/30 rounded-[8px]" />
                <div className="h-16 w-full bg-muted/30 rounded-[8px]" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Akses Cepat Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 rounded-[12px] bg-muted/30 border border-border/40" />
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
