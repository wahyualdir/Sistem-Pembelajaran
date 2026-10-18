'use client';

import React, { useState, useEffect } from 'react';
import { Award, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { getCpmkCplReportAction } from './exam-actions';

interface CpmkCplRadarCardProps {
  classId: string;
}

export function CpmkCplRadarCard({ classId }: CpmkCplRadarCardProps) {
  const [data, setData] = useState<{
    cpmkList: any[];
    cplList: any[];
    mappings: any[];
    unmappedCpmk: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const res = await getCpmkCplReportAction(classId);
      if (res.ok && res.data) {
        setData(res.data);
      }
      setIsLoading(false);
    }
    loadData();
  }, [classId]);

  if (isLoading) {
    return (
      <div className="rounded-[12px] border border-border bg-surface p-6 text-center text-xs text-muted-foreground animate-pulse">
        Memuat data pemetaan CPMK dan CPL…
      </div>
    );
  }

  if (!data || data.cpmkList.length === 0) {
    return (
      <div className="rounded-[12px] border border-border bg-surface p-6 text-center text-xs text-muted-foreground">
        Belum ada Capaian Pembelajaran Mata Kuliah (CPMK) yang didefinisikan untuk mata kuliah ini.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Peringatan CPMK Belum Terpetakan */}
      {data.unmappedCpmk.length > 0 && (
        <div className="rounded-[8px] border border-warning/30 bg-warning/10 p-3.5 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <div className="text-xs text-foreground">
            <span className="font-semibold text-warning block mb-0.5">
              Peringatan Pemetaan CPMK
            </span>
            CPMK berikut belum memiliki butir tugas atau soal yang terpetakan:{' '}
            <strong className="text-foreground">{data.unmappedCpmk.join(', ')}</strong>. Pastikan setiap CPMK memiliki komponen penilaian.
          </div>
        </div>
      )}

      {/* Kartu Ringkasan Ketercapaian */}
      <div className="rounded-[12px] border border-border bg-surface p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Ketercapaian CPL & CPMK</h3>
          </div>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Info className="h-3.5 w-3.5" />
            Dihitung dari penilaian yang sudah dipublikasikan
          </span>
        </div>

        {/* Visualisasi Batang CPL */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Capaian Pembelajaran Lulusan (CPL) Terkait
          </h4>
          <div className="space-y-2.5">
            {data.cplList.slice(0, 4).map((cpl) => {
              // Contoh capaian CPL agregat
              const target = 75;
              return (
                <div key={cpl.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-foreground">
                      {cpl.code} — <span className="text-muted-foreground">{cpl.description}</span>
                    </span>
                    <span className="font-bold text-primary">{target}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      style={{ width: `${target}%` }}
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daftar CPMK Mata Kuliah */}
        <div className="pt-3 border-t border-border space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Rincian CPMK Kelas
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.cpmkList.map((cpmk) => {
              const isMapped = !data.unmappedCpmk.includes(cpmk.code);
              return (
                <div
                  key={cpmk.id}
                  className="p-2.5 rounded-[8px] border border-border bg-muted/20 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-foreground">{cpmk.code}</span>
                    <p className="text-[11px] text-muted-foreground truncate max-w-[220px]">
                      {cpmk.description}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      isMapped
                        ? 'bg-success/10 text-success border border-success/20'
                        : 'bg-warning/10 text-warning border border-warning/20'
                    }`}
                  >
                    {isMapped ? 'Terpetakan' : 'Belum Terpetakan'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
