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
  // Sukses / Positif
  DISETUJUI: {
    label: "Disetujui",
    badgeClass: "bg-success-soft text-success border border-success-border",
    dotClass: "bg-success",
  },
  LUNAS: {
    label: "Lunas",
    badgeClass: "bg-success-soft text-success border border-success-border",
    dotClass: "bg-success",
  },
  AKTIF: {
    label: "Aktif",
    badgeClass: "bg-success-soft text-success border border-success-border",
    dotClass: "bg-success",
  },
  HADIR: {
    label: "Hadir",
    badgeClass: "bg-success-soft text-success border border-success-border",
    dotClass: "bg-success",
  },
  SELESAI: {
    label: "Selesai",
    badgeClass: "bg-success-soft text-success border border-success-border",
    dotClass: "bg-success",
  },
  LULUS: {
    label: "Lulus",
    badgeClass: "bg-success-soft text-success border border-success-border",
    dotClass: "bg-success",
  },

  // Peringatan / Dalam Proses
  DIAJUKAN: {
    label: "Diajukan",
    badgeClass: "bg-warning-soft text-warning border border-warning-border",
    dotClass: "bg-warning",
  },
  DIPROSES: {
    label: "Sedang Diproses",
    badgeClass: "bg-warning-soft text-warning border border-warning-border",
    dotClass: "bg-warning",
  },
  MENUNGGU: {
    label: "Menunggu",
    badgeClass: "bg-warning-soft text-warning border border-warning-border",
    dotClass: "bg-warning",
  },
  DISPENSASI: {
    label: "Dispensasi",
    badgeClass: "bg-warning-soft text-warning border border-warning-border",
    dotClass: "bg-warning",
  },
  DRAF: {
    label: "Draf",
    badgeClass: "bg-muted text-muted-foreground border border-border",
    dotClass: "bg-subtle-foreground",
  },

  // Bahaya / Ditolak / Tidak Hadir
  DITOLAK: {
    label: "Ditolak",
    badgeClass: "bg-danger-soft text-danger border border-danger-border",
    dotClass: "bg-danger",
  },
  BELUM: {
    label: "Belum Bayar",
    badgeClass: "bg-danger-soft text-danger border border-danger-border",
    dotClass: "bg-danger",
  },
  ALPA: {
    label: "Alpa",
    badgeClass: "bg-danger-soft text-danger border border-danger-border",
    dotClass: "bg-danger",
  },
  KELUAR: {
    label: "Keluar",
    badgeClass: "bg-danger-soft text-danger border border-danger-border",
    dotClass: "bg-danger",
  },

  // Info / Netral
  IZIN: {
    label: "Izin",
    badgeClass: "bg-info-soft text-info border border-info-border",
    dotClass: "bg-info",
  },
  SAKIT: {
    label: "Sakit",
    badgeClass: "bg-info-soft text-info border border-info-border",
    dotClass: "bg-info",
  },
  CUTI: {
    label: "Cuti",
    badgeClass: "bg-info-soft text-info border border-info-border",
    dotClass: "bg-info",
  },
};

export function StatusBadge({ status, className, size = "md" }: StatusBadgeProps) {
  const normalizedKey = (status || "").toString().trim().toUpperCase();
  const config = STATUS_MAP[normalizedKey] || {
    label: status || "-",
    badgeClass: "bg-muted text-muted-foreground border border-border",
    dotClass: "bg-subtle-foreground",
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
