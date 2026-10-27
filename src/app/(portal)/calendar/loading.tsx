import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function CalendarLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-9 w-28" />
      </div>

      <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
        <div className="grid grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-16 sm:h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
