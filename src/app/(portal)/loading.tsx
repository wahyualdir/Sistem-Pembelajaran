import React from 'react';

export default function PortalLoading() {
  return (
    <div className="w-full min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E8E5DE]">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-6 rounded-full bg-[#C2553A]" />
            <div className="h-7 w-48 sm:w-64 rounded-lg bg-[#E8E5DE]" />
          </div>
          <div className="h-4 w-60 sm:w-80 rounded-md bg-[#E8E5DE]/60 ml-5" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 rounded-lg bg-[#FAF8F5] border border-[#E8E5DE]" />
          <div className="h-9 w-28 rounded-lg bg-[#E8E5DE]" />
        </div>
      </div>

      {/* Metric / Highlight Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-[#E8E5DE] bg-[#FAF8F5] p-5 space-y-3 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C2553A]/40 to-[#C2553A]" />
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-[#E8E5DE]" />
              <div className="h-7 w-7 rounded-lg bg-[#E8E5DE]/70" />
            </div>
            <div className="h-7 w-16 rounded bg-[#E8E5DE]" />
            <div className="h-3 w-32 rounded bg-[#E8E5DE]/50" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="rounded-xl border border-[#E8E5DE] bg-white p-6 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E5DE]">
          <div className="h-5 w-40 rounded bg-[#E8E5DE]" />
          <div className="h-4 w-20 rounded bg-[#E8E5DE]/60" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between p-3.5 rounded-lg border border-[#E8E5DE]/60 bg-[#FAF8F5]/50"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-[#E8E5DE]" />
                <div className="space-y-1.5">
                  <div className="h-4 w-44 rounded bg-[#E8E5DE]" />
                  <div className="h-3 w-28 rounded bg-[#E8E5DE]/60" />
                </div>
              </div>
              <div className="h-6 w-20 rounded-full bg-[#E8E5DE]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
