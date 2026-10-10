"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

interface DashboardShellProps {
  role: "ADMIN" | "DOSEN" | "MAHASISWA" | "SYSTEM_ADMIN" | "LECTURER" | "STUDENT" | "PROGRAM_COORDINATOR" | "ACADEMIC_STAFF" | "TEACHING_ASSISTANT" | string;
  userName: string;
  userId?: string;
  children: React.ReactNode;
  unreadNotifications?: number;
}

export const ShellContext = React.createContext<boolean>(false);

export function DashboardShell({
  role,
  userName,
  userId,
  children,
  unreadNotifications = 0,
}: DashboardShellProps) {
  const isAlreadyInShell = React.useContext(ShellContext);
  const [isNavOpen, setIsNavOpen] = useState(true);
  const router = useRouter();

  if (isAlreadyInShell) {
    return <div className="page-enter w-full space-y-6">{children}</div>;
  }

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsNavOpen(false);
      } else {
        const saved = localStorage.getItem("siakad_sidebar_open");
        setIsNavOpen(saved !== null ? saved === "true" : true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleNav = () => {
    setIsNavOpen((prev) => {
      const next = !prev;
      if (typeof window !== "undefined" && window.innerWidth >= 768) {
        localStorage.setItem("siakad_sidebar_open", String(next));
      }
      return next;
    });
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { credentials: "omit", method: "POST" });
    } catch {
      // Sesi lokal dibersihkan
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <ShellContext.Provider value={true}>
      <div className="flex min-h-screen bg-retro-bg text-foreground selection:bg-retro-yellow selection:text-black font-sans antialiased">
        {/* Sidebar Navigation */}
        <Sidebar
          role={role}
          userName={userName}
          userId={userId}
          isOpen={isNavOpen}
          onClose={() => setIsNavOpen(false)}
          onLogout={handleLogout}
        />

        {/* Main Content Viewport */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0 transition-all duration-300">
          <Topbar
            userName={userName}
            userRole={role}
            userId={userId}
            unreadNotifications={unreadNotifications}
            onMenuToggle={toggleNav}
            onLogout={handleLogout}
          />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="page-enter w-full space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ShellContext.Provider>
  );
}
