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

  const userName = profile?.full_name || 'Wahyu Aldiriyanto';
  const normalizedRole = normalizeRole(role);
  const userRoleLabel = getRoleLabel(role);
  const userSubtitle = roleName || userRoleLabel;

  // Inisial avatar (contoh: "WA" untuk Wahyu Aldiriyanto)
  const initials =
    userName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('') || 'WA';

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
          {/* CRT Scanlines Overlay */}
          <div className="fixed inset-0 vt-scanlines pointer-events-none z-30" />

          {/* Drawer Backdrop Overlay (scrim) untuk < 1280px */}
          {isDrawerOpen && (
            <div
              aria-hidden="true"
              onClick={closeDrawer}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs xl:hidden animate-fade-in"
            />
          )}

          {/* ======================================================== */}
          {/* 1. BILAH SAMPING (SIDEBAR - BASELINE 218px+ / RAIL 72px)  */}
          {/* ======================================================== */}
          <aside
            ref={drawerRef}
            tabIndex={-1}
            className={cn(
              'fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r-2 border-r-[#7A756D] border-l-2 border-l-[#FFFFFF] bg-[#FAF8F5] h-[100dvh] shrink-0 outline-none',
              'xl:sticky xl:top-0 xl:h-[100dvh] xl:z-40 shadow-xs',
              'transition-all duration-200 ease-in-out motion-reduce:transition-none',
              'pl-[env(safe-area-inset-left,0px)] pb-[env(safe-area-inset-bottom,0px)]',
              isRailActive ? 'w-sidebar xl:w-rail' : 'w-sidebar',
              isDrawerOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full xl:translate-x-0'
            )}
          >
            {/* Header Sidebar: Brand Block (Full vs Rail) */}
            {isRailActive ? (
              <div className="flex h-header shrink-0 items-center justify-center border-b-2 border-[#7A756D] bg-[#ECE9D8] px-2 box-border">
                <Link
                  href={homeHref}
                  className="flex items-center justify-center group focus-visible:outline-none"
                  title={`RuangKampus - ${userSubtitle}`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-[#7A756D] bg-white p-0.5 shadow-xs group-hover:scale-105 transition-transform shrink-0 overflow-hidden">
                    <img src="/logo-ruangkampus.png" alt="Logo RuangKampus" className="h-full w-full object-contain [image-rendering:-webkit-optimize-contrast]" />
                  </div>
                </Link>
              </div>
            ) : (
              <div className="flex items-center h-header shrink-0 border-b-2 border-[#7A756D] bg-[#ECE9D8] px-4 box-border">
                <Link
                  href={homeHref}
                  className="flex items-center gap-2.5 group focus-visible:outline-none min-w-0"
                  title={`RuangKampus - ${userSubtitle}`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-retro-border bg-white p-0.5 shadow-retro-sm group-hover:scale-105 transition-transform shrink-0 overflow-hidden">
                    <img src="/logo-ruangkampus.png" alt="Logo RuangKampus" className="h-full w-full object-contain [image-rendering:-webkit-optimize-contrast]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-heading font-black text-base sm:text-lg tracking-tight text-[#1C1917] leading-none whitespace-nowrap">
                      Ruang<span className="text-[#C2553A]">Kampus</span>
                    </span>
                    <span className="text-xs font-sans font-extrabold text-[#853827] uppercase tracking-wider mt-1 leading-none">
                      Academic Learning OS
                    </span>
                  </div>
                </Link>
              </div>
            )}

            {/* DAFTAR MENU LENGKAP KATEGORISASI SIAKAD & PERKULIAHAN */}
            <nav aria-label="Navigasi Utama" className="flex-1 overflow-y-auto px-2 sm:px-2.5 py-1 sm:py-1.5 space-y-2.5">
              {navGroups.map((group) => {
                const isGroupCollapsed = hasMountedCollapse
                  ? !!collapsedGroups[group.id]
                  : !!group.defaultCollapsed;
                return (
                  <div key={group.id || group.title} className="space-y-1">
                    {!isRailActive && group.title ? (
                      <div className="flex items-center justify-between px-3 py-1 mb-0.5">
                        <p className="text-xs font-sans font-extrabold tracking-wider text-[#1C1917] uppercase">
                          {group.title}
                        </p>
                        {group.collapsible && (
                          <button
                            type="button"
                            onClick={() => toggleGroupCollapse(group.id)}
                            className="p-1 rounded hover:bg-[#ECE7DF] text-[#7A756D] hover:text-[#1C1917] transition-transform cursor-pointer"
                            title={`Buka/Tutup grup ${group.title}`}
                            aria-label={`Toggle grup ${group.title}`}
                          >
                            <ChevronDown
                              className={cn(
                                'h-3.5 w-3.5 transition-transform duration-200',
                                isGroupCollapsed ? '-rotate-90 text-[#7A756D]' : 'rotate-0 text-[#1C1917]'
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
                                  'flex items-center justify-between rounded-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C2553A]',
                                  isRailActive
                                    ? 'justify-center w-11 h-9 mx-auto'
                                    : 'px-3 py-2 gap-2.5 text-xs sm:text-sm min-h-[38px]',
                                  isActive
                                    ? 'bg-[#C2553A] text-white shadow-xs border-t border-l border-[#EE7257] border-b border-r border-[#6B2D20] font-bold'
                                    : 'text-[#2D2823] hover:text-[#1A1816] hover:bg-[#ECE7DF] border border-transparent font-medium'
                                )}
                              >
                                <span className="flex items-center gap-2.5 truncate">
                                  <Icon
                                    className={cn(
                                      'h-4 w-4 shrink-0 transition-transform',
                                      isActive ? 'text-white' : 'text-[#6E675F] group-hover:text-[#1A1816]'
                                    )}
                                  />
                                  {!isRailActive && <span className="truncate">{item.label}</span>}
                                </span>
                                {!isRailActive && item.badge !== undefined && (
                                  <span
                                    className={cn(
                                      'inline-flex min-w-5 items-center justify-center px-2 py-0.5 text-xs font-sans font-extrabold shrink-0',
                                      isActive
                                        ? 'bg-white/20 text-white border border-white/30'
                                        : 'bg-[#C2553A]/10 text-[#C2553A] border border-[#C2553A]/30'
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
                                  className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:flex group-focus-within:flex items-center z-50 whitespace-nowrap rounded-md border-2 border-ink bg-ink px-2.5 py-1.5 text-xs font-bold text-white shadow-retro animate-fade-in"
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
            <div className="p-2 sm:p-2.5 border-t-2 border-retro-border bg-gray-soft space-y-1.5 shrink-0 sidebar-compact-user-container">
              <div ref={profileMenuRef} className="relative">
                {/* Menu Popover Profil saat Ditekan */}
                {isProfileMenuOpen && (
                  <div
                    className={cn(
                      'absolute bottom-full mb-2 rounded-xl border-2 border-retro-border bg-retro-surface p-2.5 shadow-retro-md z-50 space-y-1.5 animate-fade-up',
                      isRailActive ? 'left-0 w-60' : 'left-0 right-0'
                    )}
                  >
                    <div className="px-2.5 py-2 border-b-2 border-retro-border/30 mb-1">
                      <p className="text-sm font-bold text-foreground truncate">{userName}</p>
                      <p className="text-xs text-muted-foreground font-sans font-medium">{userSubtitle}</p>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        if (!isDesktop) closeDrawer();
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-soft text-sm font-bold text-foreground transition-colors group"
                    >
                      <User className="h-4 w-4 text-black group-hover:scale-110 transition-transform" />
                      <span>Buka Profil Lengkap</span>
                    </Link>

                    <Link
                      href="/workspace"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        if (!isDesktop) closeDrawer();
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-soft text-sm font-bold text-foreground transition-colors group"
                    >
                      <Layers className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span>Ganti Peran / Workspace</span>
                    </Link>

                    <Link
                      href="/notifications/preferences"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        if (!isDesktop) closeDrawer();
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-soft text-sm font-bold text-foreground transition-colors group"
                    >
                      <Settings className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span>Pengaturan Akun</span>
                    </Link>

                    {availableRoles && availableRoles.length > 1 && (
                      <div className="pb-2 mb-2 border-b-2 border-retro-border/30">
                        <p className="px-3 py-1 text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
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
                                  'flex items-center justify-between w-full px-3 py-1.5 rounded-md text-xs font-bold transition-colors text-left cursor-pointer',
                                  isCurrent ? 'bg-black text-white' : 'hover:bg-gray-soft text-foreground'
                                )}
                              >
                                <span>{rLabel}</span>
                                {isCurrent && <span className="text-xs font-sans font-extrabold bg-white/25 px-1.5 py-0.5 rounded">Aktif</span>}
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
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-soft text-sm font-bold text-foreground transition-colors group"
                    >
                      <Laptop className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span>Perangkat dan Sesi</span>
                    </Link>

                    <div className="pt-1.5 border-t-2 border-retro-border/30">
                      <form action={logoutAction}>
                        <button
                          type="submit"
                          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg hover:bg-gray-soft text-black text-sm font-bold transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Keluar Akun</span>
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* Tombol Profil Pill (Membuka / Menutup Popover Menu Profil) */}
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  className={cn(
                    'flex items-center rounded-xl border-2 border-retro-border bg-retro-surface shadow-retro hover:bg-retro-bg transition-all group focus-visible:outline-none w-full text-left',
                    isRailActive ? 'justify-center p-2' : 'gap-2.5 p-2 sm:p-2.5 sidebar-compact-user-card'
                  )}
                  title={isRailActive ? `Profil: ${userName}` : 'Buka Menu Profil Pengguna'}
                >
                  {/* Box Kotak Inisial Avatar */}
                  <div className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-lg border-2 border-retro-border bg-black text-white overflow-hidden flex items-center justify-center text-xs sm:text-sm font-bold shrink-0 shadow-xs sidebar-compact-avatar">
                    {initials}
                  </div>

                  {/* Nama dan Subtitle Role */}
                  {!isRailActive && (
                    <div className="text-left min-w-0 flex-1">
                      <p className="text-base font-extrabold text-black leading-tight truncate transition-colors">
                        {userName}
                      </p>
                      <p className="text-xs sm:text-sm text-black font-sans font-bold leading-tight truncate mt-1">
                        {userSubtitle}
                      </p>
                    </div>
                  )}

                  {/* Panah Dropdown Chevron v */}
                  {!isRailActive && (
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-black group-hover:text-black shrink-0 transition-transform ml-1',
                        isProfileMenuOpen && 'rotate-180 text-black'
                      )}
                    />
                  )}
                </button>
              </div>

              {/* Tombol Logout Ramping */}
              {!isRailActive ? (
                <div className="w-full sidebar-compact-hide-logout">
                  <form action={logoutAction} className="w-full">
                    <button
                      type="submit"
                      className="flex items-center justify-center gap-2 w-full py-1.5 sm:py-2 px-3 rounded-lg border-2 border-retro-border bg-retro-surface hover:bg-gray-soft text-black text-xs sm:text-sm font-bold transition-colors focus-visible:outline-none"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Keluar Akun</span>
                    </button>
                  </form>
                </div>
              ) : (
                <form action={logoutAction} className="flex justify-center">
                  <button
                    type="submit"
                    title="Keluar / Logout"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-retro-border bg-retro-surface text-black hover:bg-gray-soft transition-colors focus-visible:outline-none"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
          </aside>

          {/* ======================================================== */}
          {/* 2. AREA KONTEN UTAMA DENGAN TOPBAR BERSIH */}
          {/* ======================================================== */}
          <div className="flex-1 flex flex-col min-w-0">
            {isImpersonating && (
              <div className="bg-black text-white px-4 py-2.5 text-xs font-bold flex flex-wrap items-center justify-between gap-2 border-b-2 border-black shadow-retro z-40">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
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
                    className="bg-gray-soft text-black px-3 py-1.5 rounded text-xs font-sans hover:bg-retro-surface border-2 border-black cursor-pointer font-bold shadow-xs flex items-center gap-1.5"
                  >
                    <span>Keluar dari Impersonasi</span>
                    <span>&rarr;</span>
                  </button>
                </form>
              </div>
            )}

            {/* ======================================================== */}
            {/* HEADER ATAS: VELQORA ACADEMIC OS TOPBAR                 */}
            {/* ======================================================== */}
            <header
              className={cn(
                'sticky top-0 z-30 flex items-center justify-between border-b-2 border-[#7A756D] bg-[#ECE9D8] px-3.5 sm:px-5 md:px-6 h-header pt-[env(safe-area-inset-top,0px)] box-border transition-all duration-200',
                isScrolled && 'shadow-md border-b-[#4A463F]'
              )}
            >
              {/* SISI KIRI: TOMBOL TOGGLE BILAH SAMPING */}
              <div className="flex items-center shrink-0">
                <button
                  ref={burgerButtonRef}
                  type="button"
                  onClick={handleBurgerClick}
                  className="flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center font-sans font-extrabold bg-[#ECE9D8] text-[#1C1917] border-t border-l border-white border-b border-r border-[#7A756D] hover:bg-[#F2EFE8] active:border-t-[#7A756D] active:border-l-[#7A756D] active:border-b-white active:border-r-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C2553A] shrink-0 cursor-pointer"
                  title={isCollapsed ? 'Perbesar Bilah Samping' : 'Kecilkan Bilah Samping'}
                  aria-label="Toggle Sidebar"
                >
                  <PanelLeft className="h-4 w-4 text-[#1C1917]" />
                </button>
              </div>

              {/* SISI TENGAH: SEARCH BAR LUAS DENGAN KBD SHORTCUT ⌘K (COMMAND CENTER OS) */}
              <div className="flex-1 max-w-2xl mx-3 sm:mx-6 md:mx-8 min-w-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery.trim()) {
                      router.push(`/classes?q=${encodeURIComponent(searchQuery.trim())}`);
                    } else {
                      setIsCommandCenterOpen(true);
                    }
                  }}
                  className="relative w-full"
                >
                  <div
                    onClick={() => setIsCommandCenterOpen(true)}
                    className="flex items-center vt-window-inset px-3 sm:px-3.5 py-1.5 focus-within:ring-2 focus-within:ring-[#C2553A] transition-all bg-white cursor-pointer"
                  >
                    <Search className="h-4 w-4 text-[#7A756D] mr-2.5 shrink-0" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onFocus={() => setIsCommandCenterOpen(true)}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder='Spotlight OS: Ketik "absen", "bingung", "playback", "target 3.8" atau cari MK...'
                      className="w-full bg-transparent text-sm font-medium text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none min-w-0 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCommandCenterOpen(true);
                      }}
                      className="hidden sm:flex items-center gap-1 shrink-0 ml-2 select-none cursor-pointer"
                      title="Buka Command Center (Ctrl + K)"
                    >
                      <kbd className="px-1.5 py-0.2 border border-[#B8B1A5] bg-[#ECE9D8] text-xs font-sans font-extrabold text-[#1C1917] shadow-2xs">
                        ⌘
                      </kbd>
                      <kbd className="px-1.5 py-0.2 border border-[#B8B1A5] bg-[#ECE9D8] text-xs font-sans font-extrabold text-[#1C1917] shadow-2xs">
                        K
                      </kbd>
                    </button>
                  </div>
                </form>
              </div>

              {/* SISI KANAN: SEMESTER BADGE, NOTIFIKASI, & TOMBOL BANTUAN (?) */}
              <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                {/* Badge Semester Velqora Terracotta */}
                <div className="hidden lg:flex items-center">
                  <span className="text-xs font-sans font-extrabold text-white uppercase tracking-wider bg-[#C2553A] px-3.5 py-1.5 border-t border-l border-[#EE7257] border-b border-r border-[#6B2D20] shadow-xs select-none">
                    TA 2026/2027 GANJIL
                  </span>
                </div>

                {/* Tombol Ganti Peran Cepat di Header jika user punya lebih dari 1 peran */}
                {availableRoles && availableRoles.length > 1 && (
                  <Link
                    href="/workspace"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans font-extrabold text-[#1C1917] bg-[#ECE9D8] hover:bg-[#F2EFE8] border-t border-l border-white border-b border-r border-[#7A756D] transition-all shadow-2xs"
                    title="Beralih peran pengguna"
                  >
                    <Layers className="h-3.5 w-3.5 text-[#853827]" />
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
