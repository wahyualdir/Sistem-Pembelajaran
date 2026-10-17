import React from "react";
import { cn } from "@/lib/utils";

export type StatusType =
  // KRS
  | "DRAF"
  | "DIAJUKAN"
  | "DISETUJUI"
  | "DITOLAK"
  // UKT / Tagihan
  | "BELUM"
  | "LUNAS"
  | "DISPENSASI"
  // Mahasiswa
  | "AKTIF"
  | "CUTI"
  | "LULUS"
  | "KELUAR"
  // Presensi
  | "HADIR"
  | "IZIN"
  | "SAKIT"
  | "ALPA"
  // Bimbingan & Surat
  | "DIPROSES"
  | "SELESAI"
  | "MENUNGGU"
  // String umum
  | string;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  size?: "sm" | "md";
}

interface StatusConfig {
  label: string;
  badgeClass: string;
  dotClass: string;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  // Sukses / Positif / Selesai (bg-surface text-ink border-2 border-ink)
  DISETUJUI: {
    label: "Disetujui",
    badgeClass: "bg-surface text-ink border-2 border-ink font-bold",
    dotClass: "bg-ink",
  },
  LUNAS: {
    label: "Lunas",
    badgeClass: "bg-surface text-ink border-2 border-ink font-bold",
    dotClass: "bg-ink",
  },
  SELESAI: {
    label: "Selesai",
    badgeClass: "bg-surface text-ink border-2 border-ink font-bold",
    dotClass: "bg-ink",
  },
  LULUS: {
    label: "Lulus",
    badgeClass: "bg-surface text-ink border-2 border-ink font-bold",
    dotClass: "bg-ink",
  },

  // Aktif Berjalan / Berlangsung (bg-gray-dark text-white)
  AKTIF: {
    label: "Aktif",
    badgeClass: "bg-gray-dark text-white border-2 border-ink font-bold",
    dotClass: "bg-white",
  },
  HADIR: {
    label: "Hadir",
    badgeClass: "bg-gray-dark text-white border-2 border-ink font-bold",
    dotClass: "bg-white",
  },

  // Peringatan / Dalam Proses / Sedang Dipelajari (bg-gray-soft text-ink)
  DIAJUKAN: {
    label: "Diajukan",
    badgeClass: "bg-gray-soft text-ink border border-ink font-bold",
    dotClass: "bg-ink",
  },
  DIPROSES: {
    label: "Sedang Diproses",
    badgeClass: "bg-gray-soft text-ink border border-ink font-bold",
    dotClass: "bg-ink",
  },
  MENUNGGU: {
    label: "Menunggu",
    badgeClass: "bg-gray-soft text-ink border border-ink font-bold",
    dotClass: "bg-ink",
  },
  DISPENSASI: {
    label: "Dispensasi",
    badgeClass: "bg-gray-soft text-ink border border-ink font-bold",
    dotClass: "bg-ink",
  },
  DRAF: {
    label: "Draf",
    badgeClass: "bg-surface text-gray border border-ink",
    dotClass: "bg-gray",
  },

  // Bahaya / Mendesak / Ditolak / Belum (bg-primary text-white font-bold)
  DITOLAK: {
    label: "Ditolak",
    badgeClass: "bg-primary text-white font-bold border border-ink",
    dotClass: "bg-white",
  },
  BELUM: {
    label: "Belum Bayar",
    badgeClass: "bg-primary text-white font-bold border border-ink",
    dotClass: "bg-white",
  },
  ALPA: {
    label: "Alpa",
    badgeClass: "bg-primary text-white font-bold border border-ink",
    dotClass: "bg-white",
  },
  KELUAR: {
    label: "Keluar",
    badgeClass: "bg-primary text-white font-bold border border-ink",
    dotClass: "bg-white",
  },

  // Info / Netral (bg-gray-soft text-ink)
  IZIN: {
    label: "Izin",
    badgeClass: "bg-gray-soft text-ink border border-ink",
    dotClass: "bg-gray-dark",
  },
  SAKIT: {
    label: "Sakit",
    badgeClass: "bg-gray-soft text-ink border border-ink",
    dotClass: "bg-gray-dark",
  },
  CUTI: {
    label: "Cuti",
    badgeClass: "bg-gray-soft text-ink border border-ink",
    dotClass: "bg-gray-dark",
  },
};

export function StatusBadge({ status, className, size = "md" }: StatusBadgeProps) {
  const normalizedKey = (status || "").toString().trim().toUpperCase();
  const config = STATUS_MAP[normalizedKey] || {
    label: status || "-",
    badgeClass: "bg-gray-soft text-ink border border-ink",
    dotClass: "bg-gray-dark",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-control transition-colors",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        config.badgeClass,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dotClass)} />
      <span>{config.label}</span>
    </span>
  );
}
