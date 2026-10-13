'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Award,
  FolderArchive,
  Download,
  Share2,
  Calendar,
  ShieldCheck,
  FileCheck,
  CheckCircle2,
  ExternalLink,
  Code,
  Globe,
  Layers,
  Sparkles,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { cn } from '@/lib/utils';

export interface CertificateItem {
  id: string;
  title: string;
  issuer: string;
  date: string;
  credentialId: string;
  grade: string;
  hours: string;
}

export interface PortfolioProjectItem {
  id: string;
  title: string;
  course: string;
  type: string;
  description: string;
  tech: string[];
  status: string;
  repo: string;
}

export const CERTIFICATE_TABS = [
  { id: 'sertifikat', label: 'Sertifikat & Badge Digital', icon: Award },
  { id: 'portofolio', label: 'Portofolio Belajar & Proyek', icon: FolderArchive },
] as const;

export type CertificateTabId = (typeof CERTIFICATE_TABS)[number]['id'];

interface CertificatesHubViewProps {
  certificates: CertificateItem[];
  projects: PortfolioProjectItem[];
}

export function CertificatesHubView({ certificates, projects }: CertificatesHubViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab synchronization with URL (?tab=...)
  const tabParam = searchParams.get('tab') as CertificateTabId;
  const validTabs: CertificateTabId[] = ['sertifikat', 'portofolio'];
  const activeTab: CertificateTabId = validTabs.includes(tabParam) ? tabParam : 'sertifikat';

  const setTab = (tab: CertificateTabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/certificates?${params.toString()}`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW RETRO */}
      <RetroWindow
        title="sertifikat_dan_portofolio_prestasi.app"
        badge="Terverifikasi Resmi"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg border-2 border-black bg-retro-orange text-white shadow-xs">
                <Award className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight text-foreground">
                Sertifikat & Portofolio Mahasiswa
              </h1>
            </div>
            <p className="text-sm sm:text-base text-black font-medium max-w-3xl leading-relaxed">
              Pusat kredensial capaian akademik: sertifikat kompetensi resmi dengan hash verifikasi blockchain/enkripsi, lencana pencapaian, dan portofolio artefak belajar profesional.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="rounded-lg border-2 border-black bg-white px-4 py-2 text-xs sm:text-sm font-mono font-black text-black shadow-retro">
              {certificates.length} Sertifikat &bull; {projects.length} Proyek
            </span>
          </div>
        </div>
      </RetroWindow>

      {/* 2. TAB CONTROLLER */}
      <div className="flex items-center gap-2 border-b-2 border-black pb-2 overflow-x-auto">
        {CERTIFICATE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-black text-xs sm:text-sm font-black transition-all cursor-pointer shrink-0',
                isSelected
                  ? 'bg-retro-orange text-white shadow-retro'
                  : 'bg-white text-black hover:bg-retro-warm shadow-xs'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. TAB 1: SERTIFIKAT & BADGE */}
      {activeTab === 'sertifikat' && (
        <div className="space-y-6">
          {certificates.length === 0 ? (
            <div className="p-10 text-center space-y-3 rounded-xl border-2 border-dashed border-black bg-white">
              <Award className="h-10 w-10 text-black/40 mx-auto" />
              <h3 className="font-heading font-black text-base sm:text-lg text-black">Belum Ada Kredensial</h3>
              <p className="text-xs sm:text-sm text-black/70 max-w-md mx-auto">
                Anda belum memiliki sertifikat kompetensi atau badge digital yang diterbitkan oleh laboratorium atau fakultas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="rounded-xl border-2 border-black bg-white p-5 sm:p-6 shadow-retro flex flex-col justify-between space-y-5 hover:-translate-y-1 hover:shadow-retro-md transition-all"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-lg border-2 border-black bg-retro-warm text-black shadow-xs">
                        <Award className="h-6 w-6 text-retro-orange" />
                      </div>
                      <span className="text-xs sm:text-xs font-mono font-black px-2.5 py-0.5 rounded border border-black bg-emerald-100 text-emerald-950 shadow-xs">
                        ✓ Terverifikasi Resmi
                      </span>
                    </div>

                    <div>
                      <h3 className="font-heading font-black text-base sm:text-lg text-black leading-snug line-clamp-2">
                        {cert.title}
                      </h3>
                      <p className="text-xs text-black/70 font-semibold mt-1">
                        Penerbit: {cert.issuer}
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t-2 border-black/10 text-xs font-mono">
                      <div className="flex justify-between text-black/80">
                        <span>Predikat:</span>
                        <span className="font-bold text-black">{cert.grade}</span>
                      </div>
                      <div className="flex justify-between text-black/80">
                        <span>Beban Jam:</span>
                        <span className="font-bold text-black">{cert.hours}</span>
                      </div>
                      <div className="flex justify-between text-black/80">
                        <span>Tanggal Terbit:</span>
                        <span className="font-bold text-black">{cert.date}</span>
                      </div>
                      <div className="pt-1 text-xs text-black/60 truncate font-mono">
                        ID: {cert.credentialId}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t-2 border-black">
                    <button
                      type="button"
                      onClick={() => alert(`Mengunduh sertifikat resmi: ${cert.credentialId}.pdf`)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border-2 border-black bg-black text-white text-xs font-black shadow-xs hover:bg-neutral-800 transition-all cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Unduh PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => alert(`Tautan verifikasi disalin ke clipboard!`)}
                      className="p-2 rounded-lg border-2 border-black bg-retro-warm text-black hover:bg-neutral-200 transition-all cursor-pointer"
                      title="Bagikan Kredensial"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 2: PORTOFOLIO BELAJAR */}
      {activeTab === 'portofolio' && (
        <div className="space-y-6">
          {projects.length === 0 ? (
            <div className="p-10 text-center space-y-3 rounded-xl border-2 border-dashed border-black bg-white">
              <FolderArchive className="h-10 w-10 text-black/40 mx-auto" />
              <h3 className="font-heading font-black text-base sm:text-lg text-black">Portofolio Belum Ditambahkan</h3>
              <p className="text-xs sm:text-sm text-black/70 max-w-md mx-auto">
                Belum ada artefak tugas besar atau proyek kuliah yang ditautkan ke portofolio belajar Anda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-7">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="rounded-xl border-2 border-black bg-white p-5 sm:p-6 shadow-retro flex flex-col justify-between space-y-5 hover:-translate-y-1 hover:shadow-retro-md transition-all"
                >
                  <div className="space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs sm:text-xs font-black px-2.5 py-0.5 rounded border border-black bg-retro-warm text-black shadow-xs">
                        {proj.type}
                      </span>
                      <span className="text-xs sm:text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-400">
                        ✓ {proj.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-heading font-black text-lg sm:text-xl text-black leading-tight">
                        {proj.title}
                      </h3>
                      <p className="text-xs text-retro-orange font-black mt-1">
                        {proj.course}
                      </p>
                    </div>

                    <p className="text-xs sm:text-sm text-black/80 font-medium leading-relaxed">
                      {proj.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {proj.tech.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded border border-black bg-white text-xs font-mono font-bold text-black"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t-2 border-black text-xs font-mono">
                    <span className="text-black/60 truncate font-semibold">
                      {proj.repo}
                    </span>
                    <a
                      href={`https://${proj.repo}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-black bg-black text-white font-bold hover:bg-neutral-800 transition-all shrink-0"
                    >
                      <span>Buka Repo</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
