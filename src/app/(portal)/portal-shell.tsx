'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Flame,
  LogOut,
  Search,
  Bell,
  ChevronDown,
  Menu,
  PanelRightOpen,
  User,
  Settings,
  Laptop,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutAction, stopImpersonatingAction } from '@/modules/identity/actions';
import {
  getNavGroups,
  getHomeHref,
  getRoleLabel,
  normalizeRole,
  isNavItemActive,
} from './portal-nav';
import { ShellContext } from '@/components/shared/dashboard-shell';

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
  roleBlock: React.ReactNode;
  unread: number;
  profile: {
    id?: string;
    full_name?: string | null;
    email?: string | null;
  } | null;
  account: React.ReactNode;
  isImpersonating?: boolean;
  children: React.ReactNode;
}

export function PortalShell({
  role,
  roleName,
  roleBlock,
  unread,
  profile,
  isImpersonating,
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
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const burgerButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const router = useRouter();

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
  const navGroups = getNavGroups(role, unread);
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
        <div className="min-h-screen bg-retro-bg text-foreground font-sans flex flex-col md:flex-row antialiased selection:bg-retro-yellow selection:text-black">
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
              'fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r-2 border-retro-border bg-retro-bg h-[100dvh] shrink-0 outline-none',
              'xl:sticky xl:top-0 xl:h-[100dvh] xl:z-40',
              'transition-all duration-200 ease-in-out motion-reduce:transition-none',
              'pl-[env(safe-area-inset-left,0px)] pb-[env(safe-area-inset-bottom,0px)]',
              isRailActive ? 'w-sidebar xl:w-rail' : 'w-sidebar',
              isDrawerOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full xl:translate-x-0'
            )}
          >
            {/* Header Sidebar: Brand Block (Full vs Rail) */}
            {isRailActive ? (
              <div className="flex h-header shrink-0 items-center justify-center border-b-2 border-retro-border bg-retro-bg px-2 box-border">
                <Link
                  href={homeHref}
                  className="flex items-center justify-center group focus-visible:outline-none"
                  title={`SIAJAR & SIAKAD - ${userSubtitle}`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-retro-border bg-black text-white shadow-retro-sm group-hover:scale-105 transition-transform shrink-0">
                    <Flame className="h-5 w-5 fill-white text-white" />
                  </div>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col justify-between h-header shrink-0 border-b-2 border-retro-border bg-retro-bg px-3 pt-2 pb-2.5 box-border">
                {/* Baris atas tipis: tiga titik jendela (merah, kuning, hijau), rata kiri */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className="h-3 w-3 rounded-full border border-black bg-traffic-red inline-block shadow-retro-sm"
                    title="Tutup"
                  />
                  <span
                    className="h-3 w-3 rounded-full border border-black bg-traffic-yellow inline-block shadow-retro-sm"
                    title="Kecilkan"
                  />
                  <span
                    className="h-3 w-3 rounded-full border border-black bg-traffic-green inline-block shadow-retro-sm"
                    title="Perbesar"
                  />
                </div>

                {/* Baris bawah: kotak logo, lalu teks "SIAJAR" dan "Sistem Akademik" bertumpuk */}
                <Link
                  href={homeHref}
                  className="flex items-center gap-2.5 group focus-visible:outline-none min-w-0 w-full"
                  title={`SIAJAR & SIAKAD - ${userSubtitle}`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-retro-border bg-black text-white shadow-retro-sm group-hover:scale-105 transition-transform shrink-0">
                    <Flame className="h-5 w-5 fill-white text-white" />
                  </div>
                  <div className="flex flex-col justify-center min-w-0 flex-1">
                    <span className="font-heading font-black text-base sm:text-lg tracking-tight text-foreground leading-none whitespace-nowrap">
                      SIAJAR
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold tracking-tight whitespace-nowrap leading-none mt-1">
                      Sistem Akademik
                    </span>
                  </div>
                </Link>
              </div>
            )}

            {/* Workspace role switcher pill (jika mode penuh) */}
            {!isRailActive && (
              <div className="px-3 py-1.5 sm:py-2 border-b-2 border-retro-border bg-retro-warm/30 sidebar-compact-role-block">
                {roleBlock}
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
                    {!isRailActive && (
                      <div className="flex items-center justify-between px-3 py-1 mb-1">
                        <p className="text-xs font-black uppercase tracking-wider text-black font-mono">
                          {group.title}
                        </p>
                        {group.collapsible && (
                          <button
                            type="button"
                            onClick={() => toggleGroupCollapse(group.id)}
                            className="p-1 rounded hover:bg-retro-warm text-black transition-transform cursor-pointer"
                            title={`Buka/Tutup grup ${group.title}`}
                            aria-label={`Toggle grup ${group.title}`}
                          >
                            <ChevronDown
                              className={cn(
                                'h-3.5 w-3.5 transition-transform duration-200',
                                isGroupCollapsed ? '-rotate-90 text-black/60' : 'rotate-0 text-black'
                              )}
                            />
                          </button>
                        )}
                      </div>
                    )}
                    {(!isGroupCollapsed || isRailActive) && (
                      <div className="space-y-0.5 sm:space-y-1">
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
                                  'flex items-center justify-between rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black',
                                  isRailActive
                                    ? 'justify-center w-12 h-10 mx-auto'
                                    : 'px-3 py-2 gap-2.5 text-sm sm:text-base font-bold min-h-[42px]',
                                  isActive
                                    ? 'border-2 border-retro-border bg-retro-orange text-white shadow-retro font-black hover:bg-retro-orange'
                                    : 'text-black hover:bg-retro-warm hover:text-black font-bold'
                                )}
                              >
                                <span className="flex items-center gap-2.5 truncate">
                                  <Icon
                                    className={cn(
                                      'h-5 w-5 shrink-0 transition-transform',
                                      isActive ? 'text-white' : 'text-black'
                                    )}
                                  />
                                  {!isRailActive && <span className="truncate">{item.label}</span>}
                                </span>
                                {!isRailActive && item.badge !== undefined && (
                                  <span
                                    className={cn(
                                      'inline-flex min-w-5 items-center justify-center rounded-full px-2 py-0.5 text-xs font-black font-mono shrink-0',
                                      isActive ? 'bg-white text-black' : 'bg-retro-orange text-white'
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
                                  className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:flex group-focus-within:flex items-center z-50 whitespace-nowrap rounded-md border-2 border-black bg-black px-2.5 py-1.5 text-xs font-bold text-white shadow-retro animate-fade-in"
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
            <div className="p-2 sm:p-2.5 border-t-2 border-retro-border bg-retro-warm/50 space-y-1.5 shrink-0 sidebar-compact-user-container">
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
                      <p className="text-sm font-black text-foreground truncate">{userName}</p>
                      <p className="text-xs text-muted-foreground font-mono font-medium">{userSubtitle}</p>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        if (!isDesktop) closeDrawer();
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-retro-warm text-sm font-bold text-foreground transition-colors group"
                    >
                      <User className="h-4 w-4 text-retro-orange group-hover:scale-110 transition-transform" />
                      <span>Buka Profil Lengkap</span>
                    </Link>

                    <Link
                      href="/notifications/preferences"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        if (!isDesktop) closeDrawer();
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-retro-warm text-sm font-bold text-foreground transition-colors group"
                    >
                      <Settings className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span>Pengaturan Akun</span>
                    </Link>

                    <Link
                      href="/devices"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        if (!isDesktop) closeDrawer();
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-retro-warm text-sm font-bold text-foreground transition-colors group"
                    >
                      <Laptop className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span>Perangkat & Sesi</span>
                    </Link>

                    <div className="pt-1.5 border-t-2 border-retro-border/30">
                      <form action={logoutAction}>
                        <button
                          type="submit"
                          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg hover:bg-danger/10 text-danger text-sm font-black transition-colors"
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
                    'flex items-center rounded-xl border-2 border-retro-border bg-retro-surface shadow-retro hover:bg-retro-warm transition-all group focus-visible:outline-none w-full text-left',
                    isRailActive ? 'justify-center p-2' : 'gap-2.5 p-2 sm:p-2.5 sidebar-compact-user-card'
                  )}
                  title={isRailActive ? `Profil: ${userName}` : 'Buka Menu Profil Pengguna'}
                >
                  {/* Box Kotak Inisial Avatar */}
                  <div className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-lg border-2 border-retro-border bg-retro-surface overflow-hidden flex items-center justify-center text-xs sm:text-sm font-black text-retro-orange shrink-0 shadow-xs sidebar-compact-avatar">
                    {initials}
                  </div>

                  {/* Nama dan Subtitle Role */}
                  {!isRailActive && (
                    <div className="text-left min-w-0 flex-1">
                      <p className="text-base font-black text-black leading-tight truncate group-hover:text-retro-orange transition-colors">
                        {userName}
                      </p>
                      <p className="text-xs text-black/80 font-mono font-bold leading-tight truncate mt-1">
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
                      className="flex items-center justify-center gap-2 w-full py-1.5 sm:py-2 px-3 rounded-lg border-2 border-retro-border/60 bg-retro-surface/80 hover:bg-danger/10 text-danger text-xs sm:text-sm font-bold transition-colors focus-visible:outline-none"
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
                    className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-retro-border/60 bg-retro-surface text-danger hover:bg-danger/10 transition-colors focus-visible:outline-none"
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
              <div className="bg-retro-orange text-white px-4 py-2.5 text-xs font-bold flex flex-wrap items-center justify-between gap-2 border-b-2 border-black shadow-retro z-40">
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
                    className="bg-black text-white px-3 py-1.5 rounded text-[11px] font-mono hover:bg-neutral-800 border-2 border-white cursor-pointer font-bold shadow-xs flex items-center gap-1.5"
                  >
                    <span>Keluar dari Impersonasi</span>
                    <span>&rarr;</span>
                  </button>
                </form>
              </div>
            )}

            {/* HEADER ATAS: SEARCH BAR KUNING & NOTIFIKASI */}
            <header className="sticky top-0 z-30 flex flex-col md:flex-row items-stretch border-b-2 border-retro-border bg-retro-bg md:h-header pt-[env(safe-area-inset-top,0px)]">
              {/* Header Mobile Ringkas (Phone < md): Baris 1: Brand, Drawer & Notifikasi */}
              <div className="flex md:hidden items-center justify-between px-3.5 h-header-mobile border-b-2 border-retro-border bg-retro-yellow">
                <div className="flex items-center gap-2">
                  <Flame className="h-6 w-6 text-retro-orange fill-retro-orange" />
                  <span className="font-heading font-black text-lg text-black tracking-tight">SIAJAR</span>
                </div>

                <div className="flex items-center gap-2">
                  {hasRightPanel && (
                    <button
                      type="button"
                      onClick={() => setIsRightDrawerOpen((prev) => !prev)}
                      className="2xl:hidden relative flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-white shadow-xs cursor-pointer"
                      title="Buka Ringkasan"
                      aria-label="Buka Ringkasan"
                    >
                      <PanelRightOpen className="h-4 w-4 text-black" />
                    </button>
                  )}
                  <span className="text-[11px] font-mono font-black text-black uppercase bg-white px-2 py-0.5 rounded border-2 border-black shadow-retro-sm">
                    2026/2027
                  </span>
                  <Link
                    href="/notifications"
                    className="relative flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-white shadow-xs"
                    title="Notifikasi"
                  >
                    <Bell className="h-4 w-4 text-black" />
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-black bg-retro-orange text-[10px] font-black text-white">
                        {unread}
                      </span>
                    )}
                  </Link>
                </div>
              </div>

              {/* BANNER KUNING SEARCH BAR (Desktop & Mobile) */}
              <div className="flex-1 bg-retro-yellow px-3.5 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between md:border-r-2 border-retro-border">
                <div className="flex items-center gap-2.5 sm:gap-3 w-full max-w-2xl">
                  {/* SATU-SATUNYA TOMBOL BURGER BUKA/TUTUP MENU */}
                  <button
                    ref={burgerButtonRef}
                    type="button"
                    onClick={handleBurgerClick}
                    className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg border-2 border-black bg-white text-black shadow-retro hover:bg-retro-warm active:translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black shrink-0 cursor-pointer"
                    title="Buka/Tutup menu"
                    aria-label="Buka/Tutup menu"
                  >
                    <Menu className="h-5 w-5 text-black" />
                  </button>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (searchQuery.trim()) {
                        router.push(`/classes?q=${encodeURIComponent(searchQuery.trim())}`);
                      }
                    }}
                    className="relative flex-1"
                  >
                    <div className="flex items-center rounded-lg border-2 border-retro-border bg-white px-3 sm:px-3.5 py-1.5 sm:py-2 shadow-retro focus-within:ring-2 focus-within:ring-black">
                      <Search className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-black mr-2 shrink-0" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari mata kuliah, materi, tugas, topik..."
                        className="w-full bg-transparent text-sm sm:text-base font-bold text-black placeholder:text-black/70 focus:outline-none"
                      />
                    </div>
                  </form>
                </div>

                {/* Badge Semester (Desktop & Tablet Lebar) */}
                <div className="hidden lg:flex items-center gap-2 ml-4 shrink-0">
                  <span className="text-xs sm:text-sm font-mono font-black text-black uppercase tracking-wider bg-retro-yellow px-3 py-1 rounded-md border-2 border-black shadow-retro-sm">
                    2026/2027 Ganjil
                  </span>
                </div>
              </div>

              {/* KANAN ATAS: TOMBOL DRAWER PANEL KANAN & LONCENG NOTIFIKASI (Desktop & Tablet >= md) */}
              <div className="hidden md:flex items-center justify-end gap-2.5 px-4 sm:px-6 py-2 bg-retro-bg shrink-0">
                {/* Tombol Panel Kanan Geser (Tampil pada layar < 1536px / max-2xl jika halaman memiliki panel kanan) */}
                {hasRightPanel && (
                  <button
                    type="button"
                    onClick={() => setIsRightDrawerOpen((prev) => !prev)}
                    className="2xl:hidden relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg border-2 border-retro-border bg-retro-surface shadow-retro hover:bg-retro-warm transition-all focus-visible:outline-none cursor-pointer"
                    title={isRightDrawerOpen ? 'Tutup Panel Ringkasan' : 'Buka Panel Ringkasan & Detail'}
                    aria-label="Panel Ringkasan & Detail"
                  >
                    <PanelRightOpen className="h-4.5 w-4.5 text-foreground" />
                  </button>
                )}

                <Link
                  href="/notifications"
                  className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg border-2 border-retro-border bg-retro-surface shadow-retro hover:bg-retro-warm transition-all focus-visible:outline-none"
                  title="Notifikasi Kuliah & Tugas"
                >
                  <Bell className="h-4.5 w-4.5 text-foreground" />
                  {unread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 border-retro-border bg-retro-orange text-xs font-black text-white shadow-xs">
                      {unread}
                    </span>
                  )}
                </Link>
              </div>
            </header>

            {/* VIEWPORT KONTEN HALAMAN */}
            <main className="flex-1 bg-retro-bg min-w-0 pb-20 sm:pb-24">
              {children}
            </main>
          </div>
        </div>
      </PortalLayoutContext.Provider>
    </ShellContext.Provider>
  );
}
