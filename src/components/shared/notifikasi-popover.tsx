"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  FileCheck,
  CreditCard,
  BookOpen,
  Calendar,
  AlertCircle,
  ShieldAlert,
  Info,
  Megaphone,
  Clock,
  Settings,
} from "lucide-react";
import { NotifikasiItem, JenisNotifikasi, TingkatNotifikasi } from "@/features/notifikasi/types";
import {
  getNotifikasiAction,
  tandaiDibacaAction,
  tandaiSemuaDibacaAction,
  tundaNotifikasiAction,
} from "@/features/notifikasi/actions";

interface NotifikasiPopoverProps {
  userId?: string;
}

export function NotifikasiPopover({ userId = "mhs-1" }: NotifikasiPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [daftarNotifikasi, setDaftarNotifikasi] = useState<NotifikasiItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [snoozingId, setSnoozingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ambil data notifikasi via server action
  const fetchNotifikasi = useCallback(async () => {
    try {
      const res = await getNotifikasiAction();
      if (res.success && res.data) {
        setDaftarNotifikasi(res.data);
      }
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    fetchNotifikasi();
    // Polling berkala yang wajar (setiap 60 detik)
    const interval = setInterval(fetchNotifikasi, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifikasi, userId]);

  // Handle klik di luar untuk menutup popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSnoozingId(null);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = daftarNotifikasi.filter((n) => !n.dibacaPada).length;
  // M21: Lencana naik skala 1->1.15->1 hanya saat angka berubah (220ms)
  const prevCountRef = useRef(unreadCount);
  const [isBadgePopping, setIsBadgePopping] = useState(false);

  useEffect(() => {
    if (prevCountRef.current !== unreadCount) {
      prevCountRef.current = unreadCount;
      setIsBadgePopping(true);
      const timer = setTimeout(() => setIsBadgePopping(false), 220);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  const handleTandaiSemuaDibaca = async () => {
    setLoading(true);
    try {
      await tandaiSemuaDibacaAction();
      setDaftarNotifikasi((prev) =>
        prev.map((n) => ({ ...n, dibacaPada: new Date().toISOString() }))
      );
    } catch {
      // Re-fetch on error
      fetchNotifikasi();
    } finally {
      setLoading(false);
    }
  };

  const handleTandaiDibaca = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await tandaiDibacaAction(id);
      setDaftarNotifikasi((prev) =>
        prev.map((n) => (n.id === id ? { ...n, dibacaPada: new Date().toISOString() } : n))
      );
    } catch {
      fetchNotifikasi();
    }
  };

  const handleTunda = async (id: string, menit: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await tundaNotifikasiAction(id, menit);
      // Hapus dari tampilan aktif karena ditunda
      setDaftarNotifikasi((prev) => prev.filter((n) => n.id !== id));
      setSnoozingId(null);
    } catch {
      fetchNotifikasi();
    }
  };

  // Ikon kategori sesuai JenisNotifikasi
  const getJenisIcon = (jenis: JenisNotifikasi) => {
    switch (jenis) {
      case "TUGAS_TENGGAT":
        return <AlertCircle className="h-4 w-4 text-ink" />;
      case "KEHADIRAN":
        return <Clock className="h-4 w-4 text-ink" />;
      case "KRS":
        return <FileCheck className="h-4 w-4 text-ink" />;
      case "UKT":
        return <CreditCard className="h-4 w-4 text-ink" />;
      case "NILAI":
        return <BookOpen className="h-4 w-4 text-ink" />;
      case "JADWAL":
        return <Calendar className="h-4 w-4 text-ink" />;
      case "KEAMANAN":
        return <ShieldAlert className="h-4 w-4 text-ink" />;
      case "BRIEFING":
        return <Info className="h-4 w-4 text-ink" />;
      case "PENGUMUMAN":
        return <Megaphone className="h-4 w-4 text-ink" />;
      default:
        return <Bell className="h-4 w-4 text-ink" />;
    }
  };

  const renderTingkatBadge = (tingkat: TingkatNotifikasi) => {
    if (tingkat === "MENDESAK") {
      return (
        <span className="rounded-control bg-primary border border-ink px-1.5 py-0.5 text-xs font-bold text-white">
          Mendesak
        </span>
      );
    }
    if (tingkat === "PENTING") {
      return (
        <span className="rounded-control bg-ink border border-ink px-1.5 py-0.5 text-xs font-bold text-white">
          Penting
        </span>
      );
    }
    return null;
  };

  const formatWaktu = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return "Baru saja";
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    return `${Math.floor(diff / 86400)} hari lalu`;
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Tombol Lonceng di Topbar */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifikasi();
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-control border border-border text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
        aria-label="Pemberitahuan"
        title="Notifikasi"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary text-xs font-bold text-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-[12px] border border-border bg-surface shadow-md z-50 overflow-hidden animate-scale-in origin-top-right duration-fast">
          {/* Header Popover */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground font-heading">
                Notifikasi
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-black text-white px-2 py-0.5 text-xs font-bold">
                  {unreadCount} Baru
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleTandaiSemuaDibaca}
                disabled={loading}
                className="text-xs text-ink hover:underline font-bold flex items-center gap-1 disabled:opacity-50"
              >
                <CheckCheck className="h-3 w-3" />
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* Isi Daftar Notifikasi */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
            {daftarNotifikasi.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Tidak ada notifikasi aktif saat ini.
              </div>
            ) : (
              daftarNotifikasi.map((item) => {
                const isUnread = !item.dibacaPada;
                const isSnoozeOpen = snoozingId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`flex flex-col p-3.5 transition-colors hover:bg-muted/40 ${
                      isUnread ? "bg-primary-soft/20" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-surface border border-border shadow-sm">
                        {getJenisIcon(item.jenis)}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4
                              className={`text-xs ${
                                isUnread
                                  ? "font-bold text-foreground"
                                  : "font-semibold text-foreground/80"
                              }`}
                            >
                              {item.judul}
                            </h4>
                            {renderTingkatBadge(item.tingkat)}
                          </div>
                          {isUnread && (
                            <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {item.isiAI || item.isiTemplate}
                        </p>

                        <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                          <span>{formatWaktu(item.dibuatPada)}</span>

                          <div className="flex items-center gap-2">
                            {/* Tombol Tunda (Snooze) */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSnoozingId(isSnoozeOpen ? null : item.id);
                              }}
                              className="text-muted-foreground hover:text-foreground hover:underline flex items-center gap-0.5"
                              title="Tunda notifikasi ini"
                            >
                              <Clock className="h-3 w-3" />
                              Tunda
                            </button>

                            {/* Tombol Tandai Sudah Dibaca */}
                            {isUnread && (
                              <button
                                onClick={(e) => handleTandaiDibaca(item.id, e)}
                                className="text-ink hover:underline font-bold"
                              >
                                Dibaca
                              </button>
                            )}

                            {/* Tautan Rincian */}
                            {item.tautan && (
                              <Link
                                href={item.tautan}
                                onClick={() => setIsOpen(false)}
                                className="text-ink hover:underline font-bold"
                              >
                                Rincian
                              </Link>
                            )}
                          </div>
                        </div>

                        {/* Opsi Waktu Tunda Popover Kecil */}
                        {isSnoozeOpen && (
                          <div className="mt-2 flex items-center gap-1.5 rounded-control bg-muted/60 p-1.5 text-xs">
                            <span className="text-muted-foreground">Tunda selama:</span>
                            <button
                              onClick={(e) => handleTunda(item.id, 60, e)}
                              className="rounded-control bg-surface border border-border px-2 py-0.5 font-bold text-ink hover:bg-gray-soft transition-colors"
                            >
                              1 Jam
                            </button>
                            <button
                              onClick={(e) => handleTunda(item.id, 1440, e)}
                              className="rounded-control bg-surface border border-border px-2 py-0.5 font-bold text-ink hover:bg-gray-soft transition-colors"
                            >
                              1 Hari
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Popover dengan Tautan Pengaturan Preferensi */}
          <div className="p-2.5 border-t border-border bg-muted/20 flex items-center justify-between text-xs">
            <span className="text-muted-foreground text-xs">
              SIAKAD Notifikasi Terpadu
            </span>
            <Link
              href="/mahasiswa/preferensi-notifikasi"
              onClick={() => setIsOpen(false)}
              className="text-ink hover:underline font-bold flex items-center gap-1 text-xs"
            >
              <Settings className="h-3 w-3" />
              Preferensi
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
