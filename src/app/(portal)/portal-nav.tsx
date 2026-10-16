'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  getMenuGroupsForRole,
  getRoleHomeHref,
  getRoleDisplayName,
  normalizeRoleCode,
  isNavItemActive,
  type MenuItem,
  type MenuGroup,
  type DynamicMenuBadges,
} from '@/lib/config/menu-config';

export type NavItem = MenuItem;
export type NavGroup = MenuGroup;
export type { DynamicMenuBadges };

export { isNavItemActive };

export function normalizeRole(role?: string | null): string {
  return normalizeRoleCode(role);
}

export function getHomeHref(role?: string | null): string {
  return getRoleHomeHref(role);
}

export function getRoleLabel(role?: string | null): string {
  return getRoleDisplayName(role);
}

/**
 * Mengambil grup navigasi yang telah disaring per peran dari single source of truth menuConfig
 */
export function getNavGroups(
  role?: string | null,
  badgesOrUnread: number | DynamicMenuBadges = 0
): NavGroup[] {
  return getMenuGroupsForRole(role, badgesOrUnread);
}

/**
 * Komponen Navigasi Sidebar Portal (Desain visual retro Macintosh tidak berubah)
 */
export function PortalNav({
  role,
  unread = 0,
  onItemClick,
}: {
  role: string;
  unread?: number;
  onItemClick?: () => void;
}) {
  const pathname = usePathname();
  const groups = getNavGroups(role, unread);
  const allHrefs = useMemo(() => groups.flatMap((g) => g.items.map((i) => i.href)), [groups]);

  return (
    <nav aria-label="Navigasi utama" className="flex-1 space-y-4 overflow-y-auto p-3">
      {groups.map((group) => (
        <div key={group.id} className="space-y-1.5">
          <p className="px-3 text-xs font-black uppercase tracking-wider text-gray-dark font-mono">
            {group.title}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = isNavItemActive(item.href, pathname, allHrefs);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onItemClick}
                  className={cn(
                    'group flex items-center justify-between rounded-control px-3 py-2 min-h-[42px] text-sm sm:text-base font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    isActive
                      ? 'border-2 border-ink border-l-4 border-l-primary bg-ink text-white font-black shadow-retro-sm'
                      : 'text-ink hover:bg-gray-soft hover:text-ink'
                  )}
                >
                  <span className="flex items-center gap-3 truncate">
                    <Icon
                      className={cn(
                        'h-5 w-5 shrink-0 transition-transform group-hover:scale-105',
                        isActive ? 'text-white' : 'text-ink'
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge !== undefined && (
                    <span
                      className={cn(
                        'inline-flex min-w-5 items-center justify-center rounded-full px-2 py-0.5 text-xs font-black font-mono',
                        isActive ? 'bg-surface text-ink' : 'bg-primary text-white'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
