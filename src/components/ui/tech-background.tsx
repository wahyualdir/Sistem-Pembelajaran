'use client';

import React from 'react';

export const TechBackground = React.memo(function TechBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none bg-[#FAF8F5]"
    />
  );
});
