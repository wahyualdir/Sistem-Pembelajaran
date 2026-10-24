'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export const TechBackground = React.memo(function TechBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none"
    >
      {/* Base Solid Warm Paper Surface */}
      <div className="absolute inset-0 bg-[#FAF8F5]" />

      {/* Velqora Precision Technical Grid */}
      <div className="absolute inset-0 bg-tech-grid-light opacity-80 radial-mask-vignette" />

      {/* Subtle Terracotta & Amber Radial Ambient Glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_50%_10%,rgba(194,85,58,0.1)_0%,transparent_60%),radial-gradient(ellipse_at_85%_80%,rgba(245,158,11,0.08)_0%,transparent_50%)]"
      />
    </div>
  );
});
