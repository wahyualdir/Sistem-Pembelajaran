'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LogOut,
  Search,
  ChevronDown,
  Menu,
  PanelLeft,
  ChevronLeft,
  ChevronRight,
  Lock,
  PanelRightOpen,
  User,
  Settings,
  Laptop,
  ShieldAlert,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutAction, stopImpersonatingAction, switchActiveRoleAction } from '@/modules/identity/actions';
import {
  getNavGroups,
  getHomeHref,
  getRoleLabel,
  normalizeRole,
  isNavItemActive,
  type DynamicMenuBadges,
} from './portal-nav';
import { ShellContext } from '@/components/shared/dashboard-shell';
import { TechBackground } from '@/components/ui/tech-background';
import { LiteModeToggle } from '@/components/retro/lite-mode-toggle';
import { CommandCenterOS } from '@/components/shared/command-center-os';

export interface PortalLayoutContextValue {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (v: boolean) => void;
  isRightDrawerOpen: boolean;
  setIsRightDrawerOpen: (v: boolean) => void;
  hasRightPanel: boolean;
  setHasRightPanel: (v: boolean) => void;
}

export const PortalLayoutContext = React.createContext<PortalLayoutContextValue>({
  isSidebarCollapsed: false,
  setIsSidebarCollapsed: () => {},
  isRightDrawerOpen: false,
  setIsRightDrawerOpen: () => {},
  hasRightPanel: false,
  setHasRightPanel: () => {},
});

export const usePortalLayout = () => React.useContext(PortalLayoutContext);

interface PortalShellProps {
  role: string;
  roleName: string;
  roleBlock?: React.ReactNode;
  unread: number;
  badges?: DynamicMenuBadges;
  profile: {
    id?: string;
    full_name?: string | null;
    email?: string | null;
  } | null;
  account: React.ReactNode;
  isImpersonating?: boolean;
  availableRoles?: string[];
  children: React.ReactNode;
}

export function PortalShell({
  role,
  roleName,
  roleBlock,
  unread,
  badges,
  profile,
  isImpersonating,
  availableRoles,
  children,
}: PortalShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [hasUserPreference, setHasUserPreference] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [hasRightPanel, setHasRightPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCommandCenterOpen, setIsCommandCenterOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const burgerButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Deteksi scroll untuk bayangan aktif header
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 15);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Shortcut Cmd/Ctrl + K untuk membuka Velqora OS Command Center
  useEffect(() => {
    const handleSearchKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandCenterOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleSearchKey);
    return () => window.removeEventListener('keydown', handleSearchKey);
  }, []);

  const openDrawer = () => {
    setIsDrawerOpen(true);
    setTimeout(() => {
      const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        drawerRef.current?.focus();
      }
    }, 50);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    burgerButtonRef.current?.focus();
  };

  const handleBurgerClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1280) {
      toggleSidebarCollapse();
    } else {
      if (isDrawerOpen) {
        closeDrawer();
      } else {
        openDrawer();
      }
    }
  };

  useEffect(() => {
    setIsDrawerOpen(false);
    setIsProfileMenuOpen(false);
  }, [pathname]);

  // Muat preferensi sidebar dari localStorage (hanya berlaku untuk desktop >= 1280px)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('siajar_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
        setHasUserPreference(true);
      } else if (typeof window !== 'undefined') {
        setIsCollapsed(false);
      }
    } catch {
      // fallback
    }
    const timer = setTimeout(() => setIsMounted(true), 150);
    return () => clearTimeout(timer);
  }, []);

  // Responsif terhadap perubahan ukuran layar
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1280;
      setIsDesktop(desktop);
      if (desktop && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
      if (!hasUserPreference && desktop && isCollapsed) {
        setIsCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [hasUserPreference, isCollapsed, isDrawerOpen]);

  // Keyboard shortcut: Esc untuk menutup drawer geser atau popover
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isRightDrawerOpen) setIsRightDrawerOpen(false);
        if (isDrawerOpen) closeDrawer();
        if (isProfileMenuOpen) setIsProfileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRightDrawerOpen, isDrawerOpen, isProfileMenuOpen]);

  const toggleSidebarCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    setHasUserPreference(true);
    try {
      localStorage.setItem('siajar_sidebar_collapsed', String(next));
    } catch {}
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const normalizedRole = normalizeRole(role);
  const userRoleLabel = getRoleLabel(role);
  const userName = profile?.full_name || userRoleLabel;
  const userSubtitle = roleName || userRoleLabel;

  // Inisial avatar dinamis sesuai nama profil atau peran aktif
  const initials =
    userName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('') || 'RK';

  // Mode rail hanya aktif pada desktop (>= 1280px) saat collapsed
  const isRailActive = isDesktop && isCollapsed;

  // Grup navigasi dinamis terdedikasi untuk masing-masing peran/aktor
  const navGroups = getNavGroups(role, badges ?? unread);
  const homeHref = getHomeHref(role);
  const allNavHrefs = useMemo(() => navGroups.flatMap((g) => g.items.map((i) => i.href)), [navGroups]);

  // Status grup collapse yang diingat per pengguna / peran (Bagian 1 Prinsip Desain)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [hasMountedCollapse, setHasMountedCollapse] = useState(false);

  useEffect(() => {
    try {
      const storageKey = `siajar_collapsed_groups_${normalizedRole}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setCollapsedGroups(JSON.parse(saved));
      } else {
        const initial: Record<string, boolean> = {};
        navGroups.forEach((g) => {
          if (g.defaultCollapsed) {
            initial[g.id] = true;
          }
        });
        setCollapsedGroups(initial);
      }
    } catch {
      // Fallback
    } finally {
      setHasMountedCollapse(true);
    }
  }, [normalizedRole]);

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      try {
        const storageKey = `siajar_collapsed_groups_${normalizedRole}`;
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  return (
    <ShellContext.Provider value={true}>
      <PortalLayoutContext.Provider
        value={{
          isSidebarCollapsed: isRailActive,
          setIsSidebarCollapsed: setIsCollapsed,
          isRightDrawerOpen,
          setIsRightDrawerOpen,
          hasRightPanel,
          setHasRightPanel,
        }}
      >
        <div className="min-h-screen bg-transparent text-[#1C1917] font-sans flex flex-col md:flex-row antialiased selection:bg-[#C2553A] selection:text-white relative">
          {/* Tech Background Grid & Gradient khas Velqora */}
          <TechBackground />

          {/* Drawer Backdrop Overlay (scrim) untuk < 1280px */}
          {isDrawerOpen && (
            <div
              aria-hidden="true"
              onClick={closeDrawer}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs xl:hidden animate-fade-in"
            />
          )}

          {/* ======================================================== */}
          {/* 1. BILAH SAMPING MODERN (SIDEBAR CLEAN ACADEMIC)         */}
          {/* ======================================================== */}
          <aside
            ref={drawerRef}
            tabIndex={-1}
            className={cn(
              'fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-[#E8E5DE] bg-[#FFFFFF] h-[100dvh] shrink-0 outline-none',
              'xl:sticky xl:top-0 xl:h-[100dvh] xl:z-40',
              'transition-all duration-200 ease-in-out motion-reduce:transition-none',
              'pl-[env(safe-area-inset-left,0px)] pb-[env(safe-area-inset-bottom,0px)]',
              isRailActive ? 'w-sidebar xl:w-rail' : 'w-sidebar',
              isDrawerOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full xl:translate-x-0'
            )}
          >
            {/* Header Sidebar: Brand Block (Full vs Rail) */}
            {isRailActive ? (
              <div className="flex h-header shrink-0 items-center justify-center border-b border-[#E8E5DE] bg-[#FFFFFF] px-2 box-border">
                <Link
                  href={homeHref}
                  className="flex items-center justify-center group focus-visible:outline-none"
                  title={`RuangKampus - ${userSubtitle}`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E8E5DE] bg-[#FAF8F5] p-1 group-hover:border-[#C2553A] transition-colors shrink-0 overflow-hidden">
                    <img src="/logo-ruangkampus.png" alt="Logo RuangKampus" className="h-full w-full object-contain" />
                  </div>
                </Link>
              </div>
            ) : (
              <div className="flex items-center h-header shrink-0 border-b border-[#E8E5DE] bg-[#FFFFFF] px-4 box-border">
                <Link
                  href={homeHref}
                  className="flex items-center gap-2.5 group focus-visible:outline-none min-w-0"
                  title={`RuangKampus - ${userSubtitle}`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E8E5DE] bg-[#FAF8F5] p-1 group-hover:border-[#C2553A] transition-colors shrink-0 overflow-hidden">
                    <img src="/logo-ruangkampus.png" alt="Logo RuangKampus" className="h-full w-full object-contain" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-heading font-bold text-base sm:text-lg tracking-tight text-[#1C1917] leading-none whitespace-nowrap">
                      Ruang<span className="text-[#C2553A]">Kampus</span>
                    </span>
                    <span className="text-[11px] font-sans font-medium text-[#6B6560] mt-1 leading-none">
                      Portal Akademik Terpadu
                    </span>
                  </div>
                </Link>
              </div>
            )}

            {/* DAFTAR MENU LENGKAP KATEGORISASI SIAKAD & PERKULIAHAN */}
            <nav aria-label="Navigasi Utama" className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
              {navGroups.map((group) => {
                const isGroupCollapsed = hasMountedCollapse
                  ? !!collapsedGroups[group.id]
                  : !!group.defaultCollapsed;
                return (
                  <div key={group.id || group.title} className="space-y-1">
                    {!isRailActive && group.title ? (
                      <div className="flex items-center justify-between px-2.5 py-1">
                        <p className="text-[11px] font-sans font-semibold tracking-wider text-[#78716C] uppercase">
                          {group.title}
                        </p>
                        {group.collapsible && (
                          <button
                            type="button"
                            onClick={() => toggleGroupCollapse(group.id)}
                            className="p-1 rounded-lg hover:bg-[#FAF8F5] text-[#78716C] hover:text-[#1C1917] transition-colors cursor-pointer"
                            title={`Buka/Tutup grup ${group.title}`}
                            aria-label={`Toggle grup ${group.title}`}
                          >
                            <ChevronDown
                              className={cn(
                                'h-3.5 w-3.5 transition-transform duration-200',
                                isGroupCollapsed ? '-rotate-90 text-[#78716C]' : 'rotate-0 text-[#1C1917]'
                              )}
                            />
                          </button>
                        )}
                      </div>
                    ) : null}
                    {(!isGroupCollapsed || isRailActive) && (
                      <div className="space-y-0.5">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = isNavItemActive(item.href, pathname, allNavHrefs);

                          return (
                            <div key={item.href} className="relative group">
                              <Link
                                href={item.href}
                                title={isRailActive ? item.label : undefined}
                                onClick={() => {
                                  if (!isDesktop) closeDrawer();
                                }}
                                className={cn(
                                  'flex items-center justify-between rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9F1521]',
                                  isRailActive
                                    ? 'justify-center w-10 h-10 mx-auto'
                                    : 'px-3 py-2 gap-2.5 text-[13px] min-h-[38px]',
                                  isActive
                                    ? 'bg-[#9F1521] text-white font-semibold shadow-2xs'
                                    : 'text-[#58595B] hover:text-[#111111] hover:bg-[#F3F3F4] font-normal'
                                )}
                              >
                                <span className="flex items-center gap-2.5 truncate">
                                  <Icon
                                    className={cn(
                                      'h-4 w-4 shrink-0 transition-colors',
                                      isActive ? 'text-white' : 'text-[#808285] group-hover:text-[#9F1521]'
                                    )}
                                  />
                                  {!isRailActive && <span className="truncate">{item.label}</span>}
                                </span>
                                {!isRailActive && item.badge !== undefined && (
                                  <span
                                    className={cn(
                                      'inline-flex min-w-5 items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-sans font-bold shrink-0',
                                      isActive
                                        ? 'bg-white text-[#9F1521]'
                                        : 'bg-[#FEF2F2] text-[#9F1521]'
                                    )}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                              </Link>

                              {/* Tooltip pada Mode Rail saat Hover/Focus */}
                              {isRailActive && (
                                <div
                                  role="tooltip"
                                  className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:flex group-focus-within:flex items-center z-50 whitespace-nowrap rounded-lg bg-[#1C1917] px-2.5 py-1.5 text-xs font-semibold text-white shadow-md animate-fade-in"
                                >
                                  {item.label}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* ======================================================== */}
            {/* DI BAWAH MENU BAGIAN BAWAH: WIDGET PROFIL INTERAKTIF     */}
            {/* ======================================================== */}
            <div className="p-3 border-t border-[#E8E5DE] bg-[#FAF8F5]/60 shrink-0 sidebar-compact-user-container">
              <div ref={profileMenuRef} className="relative">
                {/* Menu Popover Profil saat Ditekan */}
                {isProfileMenuOpen && (
                  <div
                    className={cn(
                      'absolute bottom-full mb-2 rounded-2xl border border-[#D6D3CB] bg-[#FFFFFF] p-2 shadow-lg z-50 space-y-1 animate-fade-up',
                      isRailActive ? 'left-0 w-60' : 'left-0 right-0'
                    )}
                  >
                    <div className="px-3 py-2 border-b border-[#E8E5DE] mb-1">
                      <p className="text-sm font-bold text-[#1C1917] truncate">{userName}</p>
                      <p className="text-xs text-[#6B6560] font-sans font-medium">{userSubtitle}</p>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        if (!isDesktop) closeDrawer();
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#FAF8F5] text-xs font-semibold text-[#1C1917] transition-colors group"
                    >
                      <User className="h-4 w-4 text-[#6B6560] group-hover:text-[#1C1917]" />
                      <span>Buka Profil Lengkap</span>
                    </Link>

                    <Link
                      href="/workspace"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        if (!isDesktop) closeDrawer();
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#FAF8F5] text-xs font-semibold text-[#1C1917] transition-colors group"
                    >
                      <Layers className="h-4 w-4 text-[#6B6560] group-hover:text-[#1C1917]" />
                      <span>Ganti Peran / Workspace</span>
                    </Link>

                    <Link
                      href="/notifications/preferences"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        if (!isDesktop) closeDrawer();
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#FAF8F5] text-xs font-semibold text-[#1C1917] transition-colors group"
                    >
                      <Settings className="h-4 w-4 text-[#6B6560] group-hover:text-[#1C1917]" />
                      <span>Pengaturan Akun</span>
                    </Link>

                    {availableRoles && availableRoles.length > 1 && (
                      <div className="py-1.5 my-1 border-y border-[#E8E5DE]">
                        <p className="px-3 py-1 text-[10px] font-bold uppercase text-[#78716C] tracking-wider">
                          Pilih Peran Aktif
                        </p>
                        {availableRoles.map((rCode) => {
                          const isCurrent = rCode === role;
                          const rLabel = getRoleLabel(rCode);
                          return (
                            <form key={rCode} action={switchActiveRoleAction}>
                              <input type="hidden" name="role" value={rCode} />
                              <button
                                type="submit"
                                className={cn(
                                  'flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors text-left cursor-pointer',
                                  isCurrent ? 'bg-[#1C1917] text-white' : 'hover:bg-[#FAF8F5] text-[#44403C]'
                                )}
                              >
                                <span>{rLabel}</span>
                                {isCurrent && <span className="text-[10px] font-bold bg-[#C2553A] px-1.5 py-0.5 rounded-full">Aktif</span>}
                              </button>
                            </form>
                          );
                        })}
                      </div>
                    )}

                    <Link
                      href="/devices"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        if (!isDesktop) closeDrawer();
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#FAF8F5] text-xs font-semibold text-[#1C1917] transition-colors group"
                    >
                      <Laptop className="h-4 w-4 text-[#6B6560] group-hover:text-[#1C1917]" />
                      <span>Perangkat dan Sesi</span>
                    </Link>

                    <div className="pt-1 border-t border-[#E8E5DE]">
                      <form action={logoutAction}>
                        <button
                          type="submit"
                          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl hover:bg-[#FEF2F0] text-[#853827] text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Keluar Akun</span>
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* Tombol Profil Bersih */}
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  className={cn(
                    'flex items-center rounded-xl border border-[#E8E5DE] bg-[#FFFFFF] hover:border-[#D6D3CB] transition-all group focus-visible:outline-none w-full text-left cursor-pointer',
                    isRailActive ? 'justify-center p-2' : 'gap-2.5 p-2.5 sidebar-compact-user-card'
                  )}
                  title={isRailActive ? `Profil: ${userName}` : 'Buka Menu Profil Pengguna'}
                >
                  <div className="relative h-9 w-9 rounded-full bg-[#1C1917] text-white overflow-hidden flex items-center justify-center text-xs font-bold shrink-0 sidebar-compact-avatar">
                    {initials}
                  </div>

                  {!isRailActive && (
                    <div className="text-left min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-bold text-[#1C1917] leading-tight truncate">
                        {userName}
                      </p>
                      <p className="text-[11px] text-[#6B6560] font-sans font-medium leading-tight truncate mt-0.5">
                        {userSubtitle}
                      </p>
                    </div>
                  )}

                  {!isRailActive && (
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-[#78716C] group-hover:text-[#1C1917] shrink-0 transition-transform ml-1',
                        isProfileMenuOpen && 'rotate-180 text-[#1C1917]'
                      )}
                    />
                  )}
                </button>
              </div>
            </div>
          </aside>

          {/* ======================================================== */}
          {/* 2. AREA KONTEN UTAMA DENGAN TOPBAR BERSIH                */}
          {/* ======================================================== */}
          <div className="flex-1 flex flex-col min-w-0">
            {isImpersonating && (
              <div className="bg-[#1C1917] text-white px-4 py-2 text-xs font-semibold flex flex-wrap items-center justify-between gap-2 border-b border-[#2D2823] z-40">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-[#C2553A] shrink-0" />
                  <span>
                    Sedang mengimpersonasi: <u>{userName}</u> ({userSubtitle}) — Sisa Waktu 30:00. Tindakan tercatat di Audit Log.
                  </span>
                </div>
                <form
                  action={async () => {
                    await stopImpersonatingAction();
                  }}
                >
                  <button
                    type="submit"
                    className="bg-[#FFFFFF] text-[#1C1917] px-3 py-1 rounded-lg text-xs font-semibold hover:bg-[#FAF8F5] cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Keluar dari Impersonasi</span>
                    <span>&rarr;</span>
                  </button>
                </form>
              </div>
            )}

            {/* ======================================================== */}
            {/* HEADER ATAS: TELKOM UNIVERSITY INSTITUTIONAL TOPBAR      */}
            {/* ======================================================== */}
            <div className="h-1 w-full bg-[#9F1521] shrink-0" />
            <header
              className={cn(
                'sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[#E2E3E4] bg-[#FFFFFF]/95 backdrop-blur-md px-3.5 sm:px-5 md:px-6 h-header pt-[env(safe-area-inset-top,0px)] box-border transition-all duration-200',
                isScrolled && 'shadow-xs border-b-[#D0D6DD]'
              )}
            >
              {/* SISI KIRI & TENGAH: TOMBOL TOGGLE SIDEBAR + SEARCH BAR TERPADU */}
              <div className="flex items-center gap-2.5 sm:gap-3 flex-1 max-w-2xl min-w-0">
                <button
                  ref={burgerButtonRef}
                  type="button"
                  onClick={handleBurgerClick}
                  className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-[#D6D3CB] hover:border-[#7A756D] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-[#1C1917] shadow-2xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C2553A] shrink-0 cursor-pointer"
                  title={isCollapsed ? 'Perbesar Bilah Samping' : 'Kecilkan Bilah Samping'}
                  aria-label="Toggle Sidebar"
                >
                  <PanelLeft className="h-4 w-4 text-[#1C1917]" />
                </button>

                {/* SEARCH BAR BERSIH & PROPORSIONAL (COMMAND CENTER OS) */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery.trim()) {
                      router.push(`/classes?q=${encodeURIComponent(searchQuery.trim())}`);
                    } else {
                      setIsCommandCenterOpen(true);
                    }
                  }}
                  className="relative flex-1 min-w-0"
                >
                  <div
                    onClick={() => setIsCommandCenterOpen(true)}
                    className="flex items-center h-9 sm:h-10 px-3 sm:px-3.5 rounded-xl border border-[#D6D3CB] hover:border-[#7A756D] focus-within:border-[#C2553A] focus-within:ring-2 focus-within:ring-[#C2553A]/20 transition-all bg-[#FFFFFF] shadow-2xs cursor-pointer gap-2.5"
                  >
                    <Search className="h-4 w-4 text-[#78716C] shrink-0" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onFocus={() => setIsCommandCenterOpen(true)}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari mata kuliah, materi, tugas, atau ketik perintah..."
                      className="w-full bg-transparent text-xs sm:text-sm font-medium text-[#1C1917] placeholder:text-[#78716C] focus:outline-none min-w-0 truncate cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCommandCenterOpen(true);
                      }}
                      className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-[#D6D3CB] bg-[#FAF8F5] hover:bg-[#ECE9D8] text-[11px] font-mono font-bold text-[#57534E] shrink-0 select-none cursor-pointer transition-colors"
                      title="Buka Command Center (Ctrl + K)"
                    >
                      <span>⌘</span>
                      <span>K</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* SISI KANAN: SEMESTER BADGE, PERAN AKTIF & MODE CEPAT */}
              <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                {/* Badge Semester Velqora Terracotta */}
                <div className="hidden lg:flex items-center">
                  <span className="inline-flex items-center h-9 px-3.5 rounded-xl text-xs font-sans font-bold text-white uppercase tracking-wider bg-[#C2553A] border border-[#A34530] shadow-2xs select-none">
                    TA 2026/2027 Ganjil
                  </span>
                </div>

                {/* Tombol Ganti Peran Cepat di Header jika user punya lebih dari 1 peran */}
                {availableRoles && availableRoles.length > 1 && (
                  <Link
                    href="/workspace"
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-sans font-bold text-[#1C1917] bg-[#FFFFFF] hover:bg-[#FAF8F5] border border-[#D6D3CB] hover:border-[#7A756D] transition-all shadow-2xs"
                    title="Beralih peran pengguna"
                  >
                    <Layers className="h-3.5 w-3.5 text-[#C2553A]" />
                    <span className="hidden sm:inline">{roleName}</span>
                    <ChevronDown className="h-3 w-3 text-[#7A756D]" />
                  </Link>
                )}

                {/* Sakelar Mode Performa Ringan / Hemat Daya */}
                <LiteModeToggle />

                {/* Tombol Panel Kanan Geser jika halaman memiliki panel kanan */}
                {hasRightPanel && (
                  <button
                    type="button"
                    onClick={() => setIsRightDrawerOpen((prev) => !prev)}
                    className="xl:hidden relative flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border-2 border-retro-border bg-retro-surface shadow-retro-sm hover:bg-gray-soft transition-all focus-visible:outline-none cursor-pointer"
                    title={isRightDrawerOpen ? 'Tutup Panel Ringkasan' : 'Buka Panel Ringkasan dan Detail'}
                    aria-label="Panel Ringkasan dan Detail"
                  >
                    <PanelRightOpen className="h-5 w-5 text-black" />
                  </button>
                )}
              </div>
            </header>

            {/* VIEWPORT KONTEN HALAMAN */}
            <main className="flex-1 bg-transparent min-w-0 pb-20 sm:pb-24 relative z-10">
              {children}
            </main>

            {/* MODAL SPOTLIGHT COMMAND CENTER OS (CTRL + K) */}
            <CommandCenterOS
              isOpen={isCommandCenterOpen}
              onClose={() => setIsCommandCenterOpen(false)}
              role={role}
              roleName={roleName}
              navGroups={navGroups}
            />
          </div>
        </div>
      </PortalLayoutContext.Provider>
    </ShellContext.Provider>
  );
}
