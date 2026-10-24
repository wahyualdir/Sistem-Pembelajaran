'use client';

import React from 'react';

export const TechBackground = React.memo(function TechBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none"
    >
      {/* Base Solid Warm Canvas Surface (Menyatu Lembut dengan Kartu) */}
      <div className="absolute inset-0 bg-[#F5F3EE]" />

      {/* Subtle Precision Technical Grid */}
      <div className="absolute inset-0 bg-tech-grid-light opacity-20 radial-mask-vignette" />

      {/* Subtle Warm Radial Ambient Glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_50%_10%,rgba(194,85,58,0.06)_0%,transparent_60%),radial-gradient(ellipse_at_85%_80%,rgba(245,158,11,0.04)_0%,transparent_50%)]"
      />
    </div>
  );
});
