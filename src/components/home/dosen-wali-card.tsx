'use client';

import React from 'react';
import Link from 'next/link';
import { UserCheck, MessageSquare, Mail, GraduationCap } from 'lucide-react';
import type { MyAdvisorData } from '@/modules/academic/advisory-actions';

interface DosenWaliCardProps {
  advisor: MyAdvisorData | null;
}

export function DosenWaliCard({ advisor }: DosenWaliCardProps) {
  const isAssigned = !!advisor && advisor.status === 'ACTIVE';

  return (
    <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4 font-sans">
      <div className="flex items-center justify-between border-b-2 border-ink/20 pb-3">
        <h3 className="font-heading font-bold text-base sm:text-lg text-ink flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-primary" />
          <span>Dosen Wali Saya</span>
        </h3>
        <span
          className={`px-2.5 py-0.5 rounded-full border-2 border-ink text-xs font-mono font-bold shadow-xs ${
            isAssigned ? 'bg-primary text-white' : 'bg-gray-soft text-ink'
          }`}
        >
          {isAssigned ? 'WALI AKTIF' : 'BELUM DITETAPKAN'}
        </span>
      </div>

      {isAssigned ? (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl border-2 border-ink bg-gray-soft shadow-retro-sm flex items-center justify-center font-heading font-bold text-lg text-primary shrink-0">
              {advisor.advisor_name
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((n) => n[0])
                .join('') || 'DW'}
            </div>
            <div className="space-y-1 min-w-0">
              <h4 className="font-heading font-bold text-base text-ink truncate">
                {advisor.advisor_name}
              </h4>
              <p className="text-xs text-gray-dark font-bold">
                NIDN: {advisor.advisor_nidn || '-'} &bull; {advisor.program_name || 'Program Studi'}
              </p>
              {advisor.advisor_email && (
                <p className="text-xs text-ink font-medium flex items-center gap-1.5 pt-0.5">
                  <Mail className="h-3.5 w-3.5 text-gray-dark" />
                  <span>{advisor.advisor_email}</span>
                </p>
              )}
            </div>
          </div>

          <div className="pt-2 border-t-2 border-ink/10 flex items-center justify-between gap-2">
            <p className="text-xs text-gray-dark font-medium">
              Konsultasikan rencana studi, KRS, dan evaluasi progres belajar Anda.
            </p>
            <Link
              href="/messages?tab=konsultasi"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-ink bg-surface hover:bg-gray-soft text-ink text-xs font-bold transition-all shadow-retro-sm shrink-0"
            >
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              <span>Hubungi Dosen Wali</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl border-2 border-dashed border-ink/30 bg-gray-soft/40 text-center space-y-2">
          <GraduationCap className="h-8 w-8 text-gray-dark mx-auto" />
          <p className="text-sm font-heading font-bold text-ink">Dosen Wali Belum Ditetapkan</p>
          <p className="text-xs text-gray-dark font-medium max-w-sm mx-auto">
            Program studi Anda sedang memproses alokasi dosen pembimbing akademik. Silakan hubungi Koordinator Prodi jika butuh bimbingan segera.
          </p>
        </div>
      )}
    </div>
  );
}
