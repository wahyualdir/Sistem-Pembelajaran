'use client';

import React from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { formatJakartaDate } from '@/modules/academic/home-utils';
import type { WeaveCell } from '@/lib/akademik/semester-weave';
import { ExternalLink, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface SemesterWeaveSheetProps {
  isOpen: boolean;
  onClose: () => void;
  classTitle: string;
  classSection: string;
  classId: string;
  weekNumber: number;
  cell: WeaveCell | null;
}

export function SemesterWeaveSheet({
  isOpen,
  onClose,
  classTitle,
  classSection,
  classId,
  weekNumber,
  cell,
}: SemesterWeaveSheetProps) {
  if (!cell) return null;

  // Teks dan ikon status presensi
  const getAttendanceInfo = () => {
    if (cell.state === 'TANPA_SESI') {
      return {
        label: 'Belum ada sesi',
        colorClass: 'text-gray-dark',
        desc: 'Tidak ada jadwal pertemuan yang tercatat pada pekan ini.',
      };
    }

    if (cell.state === 'BELUM') {
      return {
        label: 'Pekan belum tiba',
        colorClass: 'text-gray-dark',
        desc: 'Sesi perkuliahan belum berlangsung.',
      };
    }

    switch (cell.attendanceStatus) {
      case 'HADIR':
        return {
          label: 'Hadir',
          colorClass: 'text-ink font-bold',
          desc: cell.checkInAt
            ? `Tercatat hadir pada ${formatJakartaDate(cell.checkInAt, 'time')} WIB.`
            : 'Kehadiran terkonfirmasi.',
        };
      case 'TERLAMBAT':
        return {
          label: 'Hadir (terlambat)',
          colorClass: 'text-ink font-bold',
          desc: cell.checkInAt
            ? `Tercatat hadir terlambat pada ${formatJakartaDate(cell.checkInAt, 'time')} WIB.`
            : 'Tercatat hadir melewati batas waktu reguler.',
        };
      case 'IZIN':
        return {
          label: 'Izin',
          colorClass: 'text-ink font-semibold',
          desc: 'Permohonan izin perkuliahan telah diverifikasi.',
        };
      case 'SAKIT':
        return {
          label: 'Sakit',
          colorClass: 'text-ink font-semibold',
          desc: 'Permohonan surat keterangan sakit telah diverifikasi.',
        };
      case 'ALPA':
      default:
        if (cell.state === 'SEKARANG') {
          return {
            label: 'Pekan berjalan',
            colorClass: 'text-primary font-bold',
            desc: 'Sesi pertemuan berlangsung pada pekan ini.',
          };
        }
        return {
          label: 'Tidak hadir',
          colorClass: 'text-ink font-semibold',
          desc: 'Tidak ada rekaman kehadiran yang tercatat untuk sesi ini.',
        };
    }
  };

  const attendanceInfo = getAttendanceInfo();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 pr-8">
            <DialogTitle className="text-base sm:text-lg font-heading font-bold text-ink">
              {classTitle}
              {classSection ? (
                <span className="ml-2 text-xs font-normal text-gray-dark">
                  ({classSection})
                </span>
              ) : null}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs sm:text-sm text-gray-dark font-sans">
            Detail aktivitas Pekan {weekNumber} dari 16
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Bagian 1: Presensi Kuliah */}
          <div className="rounded-lg border border-black/15 bg-gray-soft/40 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-dark">
                Presensi Pertemuan
              </span>
              <span className={`text-xs px-2 py-0.5 rounded border border-black/10 bg-surface ${attendanceInfo.colorClass}`}>
                {attendanceInfo.label}
              </span>
            </div>

            {cell.sessionTitle ? (
              <p className="text-xs sm:text-sm font-semibold text-ink">
                {cell.sessionTitle}
              </p>
            ) : null}

            {cell.sessionDate ? (
              <div className="flex items-center gap-1.5 text-xs text-gray-dark">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {formatJakartaDate(cell.sessionDate, 'full')}
                </span>
              </div>
            ) : null}

            <p className="text-2xs sm:text-xs text-gray-dark">
              {attendanceInfo.desc}
            </p>
          </div>

          {/* Bagian 2: Daftar Tugas Pekan Ini */}
          <div className="rounded-lg border border-black/15 bg-gray-soft/40 p-3.5 space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-dark block">
              Tugas & Penugasan
            </span>

            {cell.tasks.length === 0 ? (
              <p className="text-xs text-gray-dark italic">
                Tidak ada tugas di pekan ini.
              </p>
            ) : (
              <ul className="space-y-2">
                {cell.tasks.map((task) => {
                  let statusBadgeText = 'Belum dikumpulkan';
                  let statusBadgeClass = 'bg-surface text-ink border-black/20';

                  if (task.isSubmitted) {
                    if (task.isLate) {
                      statusBadgeText = 'Dikumpulkan terlambat';
                      statusBadgeClass = 'bg-gray-soft text-ink border-black/30 font-medium';
                    } else {
                      statusBadgeText = 'Sudah dikumpulkan';
                      statusBadgeClass = 'bg-ink text-surface border-black font-medium';
                    }
                  }

                  return (
                    <li
                      key={task.id}
                      className="rounded border border-black/10 bg-surface p-2.5 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-ink line-clamp-2">
                          {task.title}
                        </span>
                        <span
                          className={`text-2xs px-1.5 py-0.5 rounded border shrink-0 ${statusBadgeClass}`}
                        >
                          {statusBadgeText}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-2xs text-gray-dark">
                        <Clock className="h-3 w-3" />
                        <span>
                          Tenggat: {formatJakartaDate(task.dueAt, 'full')} WIB
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Footer: Tautan Buka Kelas & Tombol Tutup */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-black/10">
          <Link
            href={`/classes/${classId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink hover:underline focus:outline-none focus:ring-2 focus:ring-black rounded px-2 py-1"
          >
            <span>Buka kelas</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded border border-black bg-surface text-ink text-xs font-semibold hover:bg-gray-soft transition-colors focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
