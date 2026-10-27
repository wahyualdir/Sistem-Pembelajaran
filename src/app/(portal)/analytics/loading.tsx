import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AnalyticsLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
      <div className="space-y-2">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-xl border border-border bg-surface space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl border border-border bg-surface space-y-4">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <div className="p-5 rounded-xl border border-border bg-surface space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
