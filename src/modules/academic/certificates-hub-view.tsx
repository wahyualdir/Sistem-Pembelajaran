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
import { toast } from '@/components/ui/toast';
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
    <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0">
      <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
        {/* 1. HEADER HALAMAN BERANDA STANDARD */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-0.5">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-ink flex items-center gap-2.5">
              <Award className="h-6 w-6 sm:h-7 sm:w-7 text-primary inline-block" />
              Sertifikat & Portofolio
            </h1>
            <p className="text-xs sm:text-sm text-gray-dark font-bold">
              Pusat kredensial kompetensi resmi terverifikasi dan portofolio artefak belajar mahasiswa
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-gray-soft border-2 border-ink text-ink shadow-xs">
              {certificates.length} Sertifikat &bull; {projects.length} Proyek
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-gray-soft border-2 border-ink text-ink shadow-xs">
              SEMESTER AKTIF 2026/2027
            </span>
          </div>
        </div>

        {/* 2. TAB CONTROLLER */}
        <div className="flex items-center gap-2 border-b-2 border-ink pb-2 overflow-x-auto">
          {CERTIFICATE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-ink text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0',
                  isSelected
                    ? 'bg-ink text-white border-b-4 border-b-primary shadow-retro'
                    : 'bg-surface text-ink hover:bg-gray-soft shadow-xs'
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
              <Award className="h-10 w-10 text-black mx-auto" />
              <h3 className="font-heading font-bold text-base sm:text-lg text-black">Belum Ada Kredensial</h3>
              <p className="text-xs sm:text-sm text-black font-bold max-w-md mx-auto">
                Anda belum memiliki sertifikat kompetensi atau badge digital yang diterbitkan oleh laboratorium atau fakultas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="rounded-xl border-2 border-ink bg-surface p-5 sm:p-6 shadow-retro flex flex-col justify-between space-y-5 hover:-translate-y-1 hover:shadow-retro-md transition-all"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-lg border-2 border-ink bg-gray-soft text-ink shadow-xs">
                        <Award className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-xs sm:text-xs font-sans font-bold px-2.5 py-0.5 rounded border-2 border-ink bg-surface text-ink shadow-xs">
                        ✓ Terverifikasi Resmi
                      </span>
                    </div>

                    <div>
                      <h3 className="font-heading font-bold text-base sm:text-lg text-ink leading-snug line-clamp-2">
                        {cert.title}
                      </h3>
                      <p className="text-xs text-gray-dark font-bold mt-1">
                        Penerbit: {cert.issuer}
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t-2 border-ink/10 text-xs font-sans">
                      <div className="flex justify-between text-ink font-bold">
                        <span>Predikat:</span>
                        <span className="font-bold text-ink">{cert.grade}</span>
                      </div>
                      <div className="flex justify-between text-ink font-bold">
                        <span>Beban Jam:</span>
                        <span className="font-bold text-ink">{cert.hours}</span>
                      </div>
                      <div className="flex justify-between text-ink font-bold">
                        <span>Tanggal Terbit:</span>
                        <span className="font-bold text-ink">{cert.date}</span>
                      </div>
                      <div className="pt-1 text-xs text-gray-dark font-bold truncate font-sans">
                        ID: {cert.credentialId}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t-2 border-ink">
                    <Link
                      href={`/verify/certificate/${encodeURIComponent(cert.credentialId)}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border-2 border-ink bg-ink text-white text-xs font-bold shadow-xs hover:bg-neutral-800 transition-all cursor-pointer text-center"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Cetak & PDF</span>
                    </Link>
                    <Link
                      href={`/verify/certificate/${encodeURIComponent(cert.credentialId)}`}
                      className="inline-flex items-center justify-center p-2 rounded-lg border-2 border-ink bg-surface text-ink hover:bg-gray-soft transition-all"
                      title="Buka Halaman Verifikasi & QR Code"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          const url = `${window.location.origin}/verify/certificate/${encodeURIComponent(cert.credentialId)}`;
                          navigator.clipboard?.writeText(url);
                          toast.success('Tautan verifikasi telah disalin.', 'Verifikasi Sertifikat');
                        }
                      }}
                      className="p-2 rounded-lg border-2 border-ink bg-gray-soft text-ink hover:bg-neutral-200 transition-all cursor-pointer"
                      title="Salin Tautan Verifikasi Publik"
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
            <div className="p-10 text-center space-y-3 rounded-xl border-2 border-dashed border-ink bg-surface">
              <FolderArchive className="h-10 w-10 text-gray-dark mx-auto" />
              <h3 className="font-heading font-bold text-base sm:text-lg text-ink">Portofolio Belum Ditambahkan</h3>
              <p className="text-xs sm:text-sm text-gray-dark font-bold max-w-md mx-auto">
                Belum ada artefak tugas besar atau proyek kuliah yang ditautkan ke portofolio belajar Anda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-7">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="rounded-xl border-2 border-ink bg-surface p-5 sm:p-6 shadow-retro flex flex-col justify-between space-y-5 hover:-translate-y-1 hover:shadow-retro-md transition-all"
                >
                  <div className="space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-sans text-xs sm:text-xs font-bold px-2.5 py-0.5 rounded border-2 border-ink bg-gray-soft text-ink shadow-xs">
                        {proj.type}
                      </span>
                      <span className="text-xs sm:text-xs font-sans font-bold text-ink bg-surface px-2 py-0.5 rounded border-2 border-ink">
                        ✓ {proj.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-heading font-bold text-lg sm:text-xl text-ink leading-tight">
                        {proj.title}
                      </h3>
                      <p className="text-xs text-primary font-bold mt-1">
                        {proj.course}
                      </p>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-dark font-bold leading-relaxed">
                      {proj.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {proj.tech.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded border border-ink bg-surface text-xs font-sans font-bold text-ink"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t-2 border-ink text-xs font-sans">
                    <span className="text-gray-dark font-bold truncate">
                      {proj.repo}
                    </span>
                    <a
                      href={`https://${proj.repo}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-ink bg-ink text-white font-bold hover:bg-neutral-800 transition-all shrink-0"
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
    </div>
  );
}
