'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

// Bilah atas ringkas untuk layar kecil: isi halaman langsung terlihat, menu terbuka lewat tombol.
export function MobileMenu({ brand, children }: { brand: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-surface md:hidden">
      <div className="flex items-center justify-between px-4 py-2.5">
        {brand}
        <button
          type="button"
          aria-expanded={open}
          aria-controls="menu-ponsel"
          aria-label={open ? 'Tutup menu' : 'Buka menu'}
          onClick={() => setOpen(!open)}
          className="flex h-11 w-11 items-center justify-center rounded-control transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      <div id="menu-ponsel" hidden={!open} className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-border animate-fade-up">
        {children}
      </div>
    </div>
  );
}
