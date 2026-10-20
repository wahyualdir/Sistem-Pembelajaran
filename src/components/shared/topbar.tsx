"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, LogOut, Moon, Sun, Search } from "lucide-react";
import { NotifikasiPopover } from "./notifikasi-popover";

import { getRoleLabel } from "@/app/(portal)/portal-nav";

interface TopbarProps {
  userName: string;
  userRole: "ADMIN" | "DOSEN" | "MAHASISWA" | "SYSTEM_ADMIN" | "LECTURER" | "STUDENT" | "PROGRAM_COORDINATOR" | "ACADEMIC_STAFF" | "TEACHING_ASSISTANT" | string;
  userId?: string;
  onMenuToggle: () => void;
  onLogout: () => void;
  unreadNotifications?: number;
}

export function Topbar({
  userName,
  userRole,
  userId = "mhs-1",
  onMenuToggle,
  onLogout,
  unreadNotifications: _unread = 0,
}: TopbarProps) {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/classes?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  useEffect(() => {
    // Cek preferensi awal mode gelap
    const saved = localStorage.getItem("siakad_theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (saved === "dark" || (!saved && prefersDark)) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("siakad_theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("siakad_theme", "dark");
      setIsDark(true);
    }
  };

  const roleLabel = getRoleLabel(userRole);

  const userInitial = userName.trim().charAt(0).toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-30 flex flex-col sm:flex-row items-stretch border-b-[1.5px] border-retro-border bg-retro-bg transition-colors">
      {/* Banner Pencarian Retro Kuning (Persis Gambar Image 1) */}
      <div className="flex-1 bg-gray-soft px-4 sm:px-6 py-2.5 flex items-center justify-between border-b sm:border-b-0 sm:border-r-[1.5px] border-retro-border gap-3">
        <div className="flex items-center gap-3 w-full max-w-xl">
          <button
            onClick={onMenuToggle}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-retro-border bg-retro-surface text-foreground shadow-retro hover:bg-gray-soft focus:outline-none transition-all"
            title="Buka / Tutup Navigasi (Burger)"
            aria-label="Menu navigasi buka tutup"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Input Pencarian Gaya Retro Image 1 */}
          <form onSubmit={handleSearch} className="relative w-full">
            <div className="flex items-center rounded-md border-2 border-black bg-retro-bg px-3 py-1.5 shadow-retro focus-within:ring-2 focus-within:ring-black">
              <Search className="h-4 w-4 text-black mr-2 shrink-0 stroke-[2.5]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari mata kuliah, materi, modul, ruang perkuliahan..."
                className="w-full bg-transparent text-sm font-bold text-black placeholder:text-black/80 placeholder:font-bold focus:outline-none"
              />
            </div>
          </form>
        </div>

        {/* Semester Badge */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <span className="text-xs sm:text-sm font-bold text-black uppercase tracking-wider bg-black/10 px-3 py-1 rounded-md border-2 border-black">
            2026/2027 Ganjil
          </span>
        </div>
      </div>

      {/* Sisi Kanan: Theme Toggle, Notifikasi, Info User, Logout */}
      <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-2.5 bg-retro-bg shrink-0">
        <button
          onClick={toggleDarkMode}
          className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-retro-surface text-foreground shadow-retro hover:bg-gray-soft focus:outline-none transition-all"
          aria-label={isDark ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
          title={isDark ? "Mode Terang" : "Mode Gelap"}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <NotifikasiPopover userId={userId} />

        <Link
          href="/profile"
          className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-lg border-2 border-black bg-retro-surface shadow-retro hover:bg-gray-soft transition-all group"
          title="Lihat Profil Akun"
        >
          <div className="h-7 w-7 rounded border border-black bg-primary text-white flex items-center justify-center text-xs font-bold">
            {userInitial}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-bold text-foreground leading-tight truncate max-w-[130px] group-hover:underline transition-colors">
              {userName}
            </span>
            <span className="text-xs text-black font-bold leading-tight mt-0.5">{roleLabel}</span>
          </div>
        </Link>

        <button
          onClick={onLogout}
          className="flex h-9 items-center gap-1.5 px-3 rounded-lg border-2 border-black bg-retro-surface text-black shadow-retro hover:bg-gray-soft text-xs sm:text-sm font-bold transition-all focus:outline-none cursor-pointer"
          title="Keluar dari sesi"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
}
