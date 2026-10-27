'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOBILE_NAV_CONFIG } from '@/lib/config/mobile-nav';
import {
  getNavGroups,
  normalizeRole,
  isNavItemActive,
  type DynamicMenuBadges,
  type NavItem as MenuItem,
} from '@/app/(portal)/portal-nav';

interface MobileBottomNavProps {
  role: string;
  onOpenDrawer: () => void;
  isDrawerOpen?: boolean;
  badges?: DynamicMenuBadges;
  unread?: number;
}

export function MobileBottomNav({
  role,
  onOpenDrawer,
  isDrawerOpen = false,
  badges,
  unread = 0,
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Feature Flag: Aktif secara default kecuali dimatikan via environment variable
  const isFeatureEnabled = process.env.NEXT_PUBLIC_FF_MOBILE_NAV !== 'false';

  // Deteksi kemunculan keyboard virtual (fokus form atau visualViewport menyusut > 25%)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        setIsKeyboardVisible(true);
      }
    };

    const handleFocusOut = () => {
      setIsKeyboardVisible(false);
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);

    const vv = window.visualViewport;
    const handleViewportResize = () => {
      if (vv && window.innerHeight) {
        const isShrunk = vv.height < window.innerHeight * 0.75;
        setIsKeyboardVisible(isShrunk);
      }
    };

    vv?.addEventListener('resize', handleViewportResize);

    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
      vv?.removeEventListener('resize', handleViewportResize);
    };
  }, []);

  // Deteksi mode fokus (kuis/ujian CBT berlangsung atau monitoring)
  const isFocusMode = useMemo(() => {
    if (!pathname) return false;
    return (
      pathname.includes('/quizzes/') ||
      pathname.includes('/cbt/') ||
      pathname.includes('/exam-monitor')
    );
  }, [pathname]);

  // Ambil daftar menu dari MENU_CONFIG sesuai peran
  const normalizedRole = normalizeRole(role);
  const navGroups = useMemo(
    () => getNavGroups(role, badges ?? unread),
    [role, badges, unread]
  );

  // Buat map semua item menu per id
  const itemMap = useMemo(() => {
    const map = new Map<string, MenuItem>();
    for (const group of navGroups) {
      for (const item of group.items) {
        map.set(item.id, item);
      }
    }
    return map;
  }, [navGroups]);

  // Ambil 4 slot menu utama
  const primarySlots = useMemo(() => {
    const configuredIds = MOBILE_NAV_CONFIG[normalizedRole] || [];
    return configuredIds
      .map((id) => itemMap.get(id))
      .filter((item): item is MenuItem => !!item)
      .slice(0, 4);
  }, [normalizedRole, itemMap]);

  // Sembunyikan bila feature flag mati, mode fokus, drawer terbuka, atau keyboard aktif
  if (!isFeatureEnabled || isFocusMode || isDrawerOpen || isKeyboardVisible) {
    return null;
  }

  return (
    <nav
      aria-label="Navigasi Bawah Ponsel"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 md:hidden',
        'bg-[#FAF8F5]/95 backdrop-blur-md border-t border-[#E8E5DE]',
        'pb-[env(safe-area-inset-bottom,0px)] shadow-lg'
      )}
    >
      <div className="grid grid-cols-5 h-[var(--mobile-nav-h,3.5rem)] items-center px-1">
        {primarySlots.map((item) => {
          const isActive = isNavItemActive(item.href, pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 text-center select-none relative group cursor-pointer transition-colors',
                isActive
                  ? 'text-[#C2553A] font-bold'
                  : 'text-[#7A756D] font-medium hover:text-[#1C1917]'
              )}
            >
              {/* Indikator Garis Aktif (M05) */}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 left-2 right-2 h-0.5 bg-[#C2553A] rounded-full transition-all duration-200"
                />
              )}

              <div className="relative flex items-center justify-center">
                <Icon className={cn('h-5 w-5 transition-transform', isActive && 'scale-105')} />
                {typeof item.badge !== 'undefined' && Number(item.badge) > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#EF4444] text-white text-[12px] font-bold leading-none ring-2 ring-[#FAF8F5]">
                    {Number(item.badge) > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>

              <span className="text-xs leading-none mt-1 truncate max-w-[64px]">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Slot ke-5: Lainnya (Membuka Drawer Kiri Penuh) */}
        <button
          type="button"
          onClick={onOpenDrawer}
          aria-label="Buka navigasi lengkap"
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 text-center select-none relative group text-[#7A756D] hover:text-[#1C1917] font-medium cursor-pointer transition-colors"
        >
          <div className="relative flex items-center justify-center">
            <Menu className="h-5 w-5" />
          </div>
          <span className="text-xs leading-none mt-1 truncate max-w-[64px]">
            Lainnya
          </span>
        </button>
      </div>
    </nav>
  );
}
