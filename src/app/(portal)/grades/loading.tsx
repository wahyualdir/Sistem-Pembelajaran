import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function GradesLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
      <div className="space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-xl border border-border bg-surface space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <Skeleton className="h-6 w-36" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
