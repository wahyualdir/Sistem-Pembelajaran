"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  FileSpreadsheet,
  CheckSquare,
  GraduationCap,
  FileText,
  CreditCard,
  Bell,
  CalendarDays,
  ShieldCheck,
  ShieldAlert,
  ClipboardList,
  FolderArchive,
  Award,
  Calculator,
  Settings,
  X,
  Layers,
  Laptop,
  Flame,
  ChevronDown,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
  getNavGroups,
  getHomeHref,
  getRoleLabel,
  normalizeRole,
  isNavItemActive,
  type NavGroup,
  type NavItem,
} from "@/app/(portal)/portal-nav";

export type { NavGroup, NavItem };

export const ADMIN_NAV_GROUPS: NavGroup[] = getNavGroups("SYSTEM_ADMIN");
export const SUPER_ADMIN_NAV_GROUPS: NavGroup[] = getNavGroups("SUPER_ADMIN");
export const DOSEN_NAV_GROUPS: NavGroup[] = getNavGroups("LECTURER");
export const MAHASISWA_NAV_GROUPS: NavGroup[] = getNavGroups("STUDENT");
export const KAPRODI_NAV_GROUPS: NavGroup[] = getNavGroups("PROGRAM_COORDINATOR");
export const STAFF_NAV_GROUPS: NavGroup[] = getNavGroups("ACADEMIC_STAFF");
export const TA_NAV_GROUPS: NavGroup[] = getNavGroups("TEACHING_ASSISTANT");

export interface SidebarProps {
  role: "ADMIN" | "DOSEN" | "MAHASISWA" | "SYSTEM_ADMIN" | "SUPER_ADMIN" | "SUPERADMIN" | "LECTURER" | "STUDENT" | "PROGRAM_COORDINATOR" | "ACADEMIC_STAFF" | "TEACHING_ASSISTANT" | string;
  userName?: string;
  userId?: string;
  isOpen?: boolean;
  onClose?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onLogout?: () => void;
}

export function Sidebar({
  role,
  userName,
  userId: _userId,
  isOpen: propIsOpen,
  onClose: propOnClose,
  isOpenMobile,
  onCloseMobile,
  onLogout,
}: SidebarProps) {
  const pathname = usePathname();
  const isOpen = propIsOpen ?? isOpenMobile ?? false;
  const handleClose = propOnClose ?? onCloseMobile ?? (() => {});

  const normalizedRole = normalizeRole(role);
  const groups = getNavGroups(role);
  const allHrefs = useMemo(() => groups.flatMap((g) => g.items.map((i) => i.href)), [groups]);
  const roleLabel = getRoleLabel(role);
  const homeHref = getHomeHref(role);

  const displayName =
    userName ||
    (normalizedRole === "SUPER_ADMIN"
      ? "Super Admin"
      : normalizedRole === "SYSTEM_ADMIN"
      ? "System Administrator"
      : normalizedRole === "LECTURER"
      ? "Dr. Budi Santoso"
      : normalizedRole === "PROGRAM_COORDINATOR"
      ? "Prof. Dewi Lestari"
      : normalizedRole === "ACADEMIC_STAFF"
      ? "Eko Staf Akademik"
      : normalizedRole === "TEACHING_ASSISTANT"
      ? "Citra Asisten"
      : "Wahyu Aldiriyanto");

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join("") || "WA";

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

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
        groups.forEach((g) => {
          if (g.defaultCollapsed) {
            initial[g.id] = true;
          }
        });
        setCollapsedGroups(initial);
      }
    } catch {} finally {
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    if (isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  return (
    <>
      {/* Mobile Drawer Overlay */}
      <div
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-200 md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={handleClose}
      />

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-sidebar flex-col border-r-2 border-black bg-white transition-all duration-300 ease-in-out md:static md:sticky md:top-0 md:h-[100dvh] shrink-0",
          isOpen
            ? "translate-x-0 shadow-2xl md:shadow-none"
            : "-translate-x-full md:-ml-sidebar"
        )}
      >
        {/* Sidebar Header dengan Logo Retro Mac */}
        <div className="flex h-header shrink-0 items-center justify-between border-b-2 border-black bg-retro-warm px-4">
          <Link
            href={homeHref}
            className="flex items-center gap-2.5 group focus-visible:outline-none"
            title="SIAJAR & SIAKAD"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-none sm:rounded-[2px] border-2 border-black bg-black text-white shadow-retro group-hover:bg-white group-hover:text-black transition-all">
              <Flame className="h-6 w-6 fill-current" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-heading font-black text-base tracking-tight text-black leading-tight">
                SIAJAR
              </span>
              <span className="text-xs text-gray-600 font-semibold leading-tight mt-0.5">
                Sistem Akademik
              </span>
            </div>
          </Link>
          <button
            onClick={handleClose}
            className="md:hidden flex h-8 w-8 items-center justify-center border-2 border-black bg-white text-black shadow-retro-sm hover:bg-retro-warm transition-colors cursor-pointer"
            title="Tutup Navigasi (Burger)"
            aria-label="Tutup navigasi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {groups.map((group) => {
            const isGroupCollapsed = hasMountedCollapse
              ? !!collapsedGroups[group.id]
              : !!group.defaultCollapsed;
            return (
              <div key={group.id || group.title} className="space-y-1.5">
                <div className="flex items-center justify-between px-2.5 mb-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
                    {group.title}
                  </p>
                  {group.collapsible && (
                    <button
                      type="button"
                      onClick={() => toggleGroupCollapse(group.id)}
                      className="p-1 rounded hover:bg-neutral-200 text-black transition-transform cursor-pointer"
                      title={`Buka/Tutup grup ${group.title}`}
                      aria-label={`Toggle grup ${group.title}`}
                    >
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 transition-transform duration-200",
                          isGroupCollapsed ? "-rotate-90 text-gray-500" : "rotate-0 text-black"
                        )}
                      />
                    </button>
                  )}
                </div>
                {!isGroupCollapsed && (
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = isNavItemActive(item.href, pathname, allHrefs);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-current={isActive ? "page" : undefined}
                          onClick={handleClose}
                          className={cn(
                            "flex items-center justify-between rounded-none sm:rounded-[2px] px-3.5 py-2.5 text-sm sm:text-base font-semibold transition-all focus-visible:outline-none",
                            isActive
                              ? "border-2 border-black bg-retro-orange text-white shadow-retro font-bold hover:bg-retro-orange"
                              : "text-black hover:bg-retro-warm hover:text-black"
                          )}
                        >
                          <span className="flex items-center gap-3 truncate">
                            <Icon
                              className={cn(
                                "h-5 w-5 shrink-0 transition-transform",
                                isActive ? "text-white" : "text-black"
                              )}
                            />
                            <span className="truncate">{item.label}</span>
                          </span>
                          {item.badge !== undefined && (
                            <span
                              className={cn(
                                "inline-flex min-w-5 items-center justify-center rounded-full px-2 py-0.5 text-xs font-black font-mono shrink-0",
                                isActive ? "bg-white text-black" : "bg-retro-orange text-white"
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
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
        <div className="p-3 border-t-[1.5px] border-retro-border bg-retro-warm/50 space-y-2 shrink-0">
          <div ref={profileMenuRef} className="relative">
            {/* Menu Popover Profil saat Ditekan */}
            {isProfileMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 rounded-lg border-[1.5px] border-retro-border bg-retro-surface p-2 shadow-retro-md z-50 space-y-1 animate-fade-up">
                <div className="px-2 py-1.5 border-b border-retro-border/40 mb-1">
                  <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground font-mono">{roleLabel}</p>
                </div>

                <Link
                  href="/profile"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    handleClose();
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-retro-warm text-xs font-semibold text-foreground transition-colors group"
                >
                  <User className="h-3.5 w-3.5 text-retro-orange group-hover:scale-110 transition-transform" />
                  <span>Buka Profil Lengkap</span>
                </Link>

                <Link
                  href="/notifications/preferences"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    handleClose();
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-retro-warm text-xs font-semibold text-foreground transition-colors group"
                >
                  <Settings className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span>Pengaturan Akun</span>
                </Link>

                <Link
                  href="/devices"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    handleClose();
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-retro-warm text-xs font-semibold text-foreground transition-colors group"
                >
                  <Laptop className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span>Perangkat & Sesi</span>
                </Link>

                {onLogout && (
                  <div className="pt-1 border-t border-retro-border/40">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onLogout();
                      }}
                      className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md hover:bg-danger/10 text-danger text-xs font-bold transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Keluar Akun</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tombol Profil Pill (Membuka / Menutup Popover Menu Profil) */}
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className="flex items-center justify-between rounded-lg border-[1.5px] border-retro-border bg-retro-surface p-2 shadow-retro hover:bg-retro-warm transition-all group focus-visible:outline-none w-full text-left"
              title="Buka Menu Profil Pengguna"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Box Kotak Inisial Avatar */}
                <div className="relative h-10 w-10 rounded-md border-[1.5px] border-retro-border bg-retro-surface overflow-hidden flex items-center justify-center text-sm font-black text-retro-orange shrink-0 shadow-xs">
                  {initials}
                </div>

                {/* Nama & Subtitle Role */}
                <div className="text-left min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground leading-tight truncate group-hover:text-retro-orange transition-colors">
                    {displayName}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium leading-tight truncate mt-0.5">
                    {roleLabel}
                  </p>
                </div>
              </div>

              {/* Chevron Panah Bawah yang berotasi saat menu terbuka */}
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-transform ml-1",
                  isProfileMenuOpen && "rotate-180 text-foreground"
                )}
              />
            </button>
          </div>

          {/* Info Semester & Tombol Logout Langsung */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-retro-border/60 bg-retro-surface text-xs text-muted-foreground font-medium">
              <span className="h-2 w-2 rounded-full bg-success inline-block" />
              <span>2026/2027 Ganjil</span>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-retro-border/60 bg-retro-surface hover:bg-danger/10 text-danger text-xs font-bold transition-colors focus-visible:outline-none"
                title="Keluar dari akun"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Keluar</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
