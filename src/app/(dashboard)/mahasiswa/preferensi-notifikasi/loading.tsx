import React from "react";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function LoadingPreferensiNotifikasi() {
  return (
    <DashboardShell role="MAHASISWA" userName="Memuat...">
      <div className="space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-64 rounded-control bg-muted" />
          <div className="h-4 w-96 rounded-control bg-muted/60" />
        </div>

        <Card className="border-border bg-surface">
          <CardHeader>
            <div className="h-6 w-48 rounded-control bg-muted" />
            <div className="h-4 w-72 rounded-control bg-muted/60" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              <div className="h-10 rounded-control bg-muted" />
              <div className="h-10 rounded-control bg-muted" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-surface">
          <CardHeader>
            <div className="h-6 w-60 rounded-control bg-muted" />
            <div className="h-4 w-80 rounded-control bg-muted/60" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between items-center py-2">
                <div className="space-y-1">
                  <div className="h-4 w-40 rounded-control bg-muted" />
                  <div className="h-3 w-64 rounded-control bg-muted/60" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-20 rounded-control bg-muted" />
                  <div className="h-8 w-20 rounded-control bg-muted" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
