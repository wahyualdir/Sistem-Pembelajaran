'use client';

import React from 'react';

/**
 * Template untuk portal SIAJAR (Bab 6.5 & M01)
 * Next.js template me-remount setiap kali navigasi rute berubah,
 * menjalankan animasi masuk halaman (page enter: fade + translateY 8px)
 * secara konsisten dan hemat performa tanpa reflow atau delay.
 */
export default function PortalTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="portal-page-enter w-full min-w-0 flex-1">
      {children}
    </div>
  );
}
