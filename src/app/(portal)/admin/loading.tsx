import React from 'react';

export default function AdminLoading() {
  return (
    <div className="w-full min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
      {/* Admin Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E8E5DE]">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-7 rounded-md bg-[#C2553A]" />
            <div className="h-8 w-56 sm:w-72 rounded-lg bg-[#E8E5DE]" />
            <div className="h-5 w-20 rounded-full bg-[#C2553A]/15 border border-[#C2553A]/30" />
          </div>
          <div className="h-4 w-72 sm:w-96 rounded-md bg-[#E8E5DE]/60 ml-5" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-28 rounded-lg bg-[#FAF8F5] border border-[#E8E5DE]" />
          <div className="h-9 w-32 rounded-lg bg-[#E8E5DE]" />
        </div>
      </div>

      {/* Admin KPI Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-[#E8E5DE] bg-[#FAF8F5] p-5 space-y-3 relative overflow-hidden"
          >
            <div className="h-1 w-full bg-[#C2553A] absolute top-0 left-0" />
            <div className="flex items-center justify-between pt-1">
              <div className="h-4 w-28 rounded bg-[#E8E5DE]" />
              <div className="h-7 w-7 rounded-lg bg-[#E8E5DE]" />
            </div>
            <div className="h-8 w-20 rounded bg-[#E8E5DE]" />
            <div className="h-3 w-36 rounded bg-[#E8E5DE]/60" />
          </div>
        ))}
      </div>

      {/* Admin Table / Control Card Skeleton */}
      <div className="rounded-xl border border-[#E8E5DE] bg-white p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#E8E5DE]">
          <div className="h-6 w-48 rounded bg-[#E8E5DE]" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-36 rounded-lg bg-[#FAF8F5] border border-[#E8E5DE]" />
            <div className="h-8 w-24 rounded-lg bg-[#E8E5DE]" />
          </div>
        </div>

        {/* Table Rows */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between p-4 rounded-lg border border-[#E8E5DE]/70 bg-[#FAF8F5]/40"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="h-8 w-8 rounded-full bg-[#E8E5DE]" />
                <div className="space-y-1.5 flex-1 max-w-sm">
                  <div className="h-4 w-full rounded bg-[#E8E5DE]" />
                  <div className="h-3 w-2/3 rounded bg-[#E8E5DE]/50" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-6 w-16 rounded bg-[#E8E5DE]/60 hidden sm:block" />
                <div className="h-6 w-24 rounded-full bg-[#C2553A]/10 border border-[#C2553A]/20" />
                <div className="h-8 w-8 rounded-lg bg-[#E8E5DE]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
