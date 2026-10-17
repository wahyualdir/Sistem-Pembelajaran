'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BookOpen,
  Award,
  FileText,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Save,
  CheckCircle2,
  Lock,
  RefreshCw,
  Sparkles,
  Settings,
  Calendar,
  Clock,
  Video,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { isDemoMode } from '@/lib/config/features';
import {
  getAllPoliciesAction,
  updatePolicyAction,
} from '@/lib/policies/actions';
import type { InstitutionPolicyItem } from '@/lib/policies';
import {
  getEarlyWarningPolicyAction,
  updateEarlyWarningPolicyAction,
  triggerDailyRiskCalculationAction,
} from '@/modules/early-warning/actions';
import type { EarlyWarningPolicy } from '@/modules/early-warning/types';

type PolicyTab = 'akademik' | 'kehadiran' | 'ujian' | 'perkuliahan' | 'sistem' | 'peringatan-dini';

export function SuperadminPoliciesHubView() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as PolicyTab) || 'akademik';
  const [activeTab, setActiveTab] = useState<PolicyTab>(initialTab);
  const isDemo = isDemoMode();

  const [policies, setPolicies] = useState<InstitutionPolicyItem[]>([]);
  const [policyValues, setPolicyValues] = useState<Record<string, any>>({});
  const [earlyWarningPolicy, setEarlyWarningPolicy] = useState<EarlyWarningPolicy>({
    minAttendancePercent: 75,
    warningAttendancePercent: 80,
    maxMissingAssignmentsWarning: 1,
    maxMissingAssignmentsHighRisk: 3,
    gradeDropThresholdPoints: 15,
    minMaterialProgressPercent: 50,
    updatedAt: new Date().toISOString(),
  });

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = () => {
    getAllPoliciesAction().then((items) => {
      setPolicies(items);
      const vals: Record<string, any> = {};
      items.forEach((p) => {
        vals[p.key] = p.value;
      });
      setPolicyValues(vals);
    });

    getEarlyWarningPolicyAction().then((p) => {
      if (p) setEarlyWarningPolicy(p);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveInstitutionPolicy = (key: string) => {
    startTransition(async () => {
      setFeedback(null);
      const val = policyValues[key];
      const res = await updatePolicyAction(key, val);
      if (res.ok) {
        setFeedback({
          type: 'success',
          message: `Kebijakan '${key}' berhasil diperbarui dan dicatat dalam audit log.`,
        });
        loadData();
        setTimeout(() => setFeedback(null), 4000);
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Gagal menyimpan kebijakan institusi.',
        });
      }
    });
  };

  const handleSaveEarlyWarning = () => {
    startTransition(async () => {
      setFeedback(null);
      const res = await updateEarlyWarningPolicyAction(earlyWarningPolicy);
      if (res.ok && res.data) {
        setEarlyWarningPolicy(res.data);
        setFeedback({
          type: 'success',
          message: 'Kebijakan peringatan dini berhasil disimpan dan dicatat ke audit log.',
        });
        setTimeout(() => setFeedback(null), 4000);
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Gagal menyimpan kebijakan peringatan dini.',
        });
      }
    });
  };

  const handleTriggerDailyCalculation = () => {
    startTransition(async () => {
      setFeedback({ type: 'success', message: 'Menjalankan evaluasi risiko harian...' });
      const res = await triggerDailyRiskCalculationAction();
      if (res.ok && res.data) {
        setFeedback({
          type: 'success',
          message: `Evaluasi selesai: ${res.data.evaluatedCount} pendaftaran dievaluasi, ${res.data.escalatedCount} eskalasi risiko, ${res.data.notificationsSent} notifikasi terkirim.`,
        });
        setTimeout(() => setFeedback(null), 5000);
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Gagal memicu evaluasi risiko harian.',
        });
      }
    });
  };

  const currentTabPolicies = policies.filter((p) => p.group === activeTab);

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW RETRO */}
      <RetroWindow
        title="kebijakan_universitas_dan_regulasi.app"
        badge="SUPER_ADMIN :: POLICIES"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 bg-surface"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-lg border-2 border-black bg-primary text-white shadow-retro-sm">
                <BookOpen className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl text-black tracking-tight">
                Aturan Akademik dan Kebijakan Kampus
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-dark font-medium max-w-2xl leading-relaxed">
              Konfigurasi parameter kebijakan akademik, kehadiran, tenggat sanggahan, ujian, kuliah daring, serta ambang batas peringatan dini (Lampiran A).
            </p>
          </div>
        </div>

        {feedback && (
          <div
            className={`mt-4 p-3 rounded-lg border-2 border-black text-xs sm:text-sm font-bold flex items-center justify-between animate-fade-up ${
              feedback.type === 'success' ? 'bg-surface text-ink' : 'bg-primary text-white'
            }`}
          >
            <span>{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="underline text-xs font-bold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}
      </RetroWindow>

      {/* 2. TAB NAVIGASI */}
      <div className="flex flex-wrap gap-2 border-b-2 border-black pb-2">
        {[
          { id: 'akademik', label: 'Akademik dan Nilai', icon: BookOpen },
          { id: 'kehadiran', label: 'Kehadiran dan Izin', icon: Clock },
          { id: 'ujian', label: 'Ujian dan Evaluasi', icon: Award },
          { id: 'perkuliahan', label: 'Perkuliahan dan Daring', icon: Video },
          { id: 'sistem', label: 'Sistem dan Arsip', icon: Settings },
          { id: 'peringatan-dini', label: 'Peringatan Dini', icon: ShieldAlert },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as PolicyTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-black text-xs sm:text-sm font-bold font-sans transition-all cursor-pointer ${
                isActive
                  ? 'bg-black text-white shadow-retro'
                  : 'bg-white hover:bg-gray-soft text-black shadow-retro-sm'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. KONTEN TAB UTAMA (INSTITUTION POLICIES) */}
      {activeTab !== 'peringatan-dini' && (
        <div className="p-5 sm:p-6 rounded-xl border-2 border-black bg-white shadow-retro space-y-6 max-w-4xl">
          <div className="border-b-2 border-black pb-3">
            <h3 className="font-heading font-bold text-lg text-black capitalize">
              Kebijakan Kelompok: {activeTab}
            </h3>
            <p className="text-xs text-black/60 font-sans">
              Setiap perubahan kebijakan akan dicatat di audit log dan berlaku secara global pada sistem.
            </p>
          </div>

          <div className="space-y-6 text-xs sm:text-sm font-sans">
            {currentTabPolicies.map((p) => {
              const currentVal = policyValues[p.key] !== undefined ? policyValues[p.key] : p.value;
              const isBoolean = typeof p.value === 'boolean';
              const isArray = Array.isArray(p.value);
              const isNumber = typeof p.value === 'number';

              return (
                <div
                  key={p.key}
                  className="p-4 rounded-lg border-2 border-black bg-gray-soft/20 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-black text-white px-2 py-0.5 rounded">
                        {p.key}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-black font-medium">{p.description}</p>
                    {p.updated_at && (
                      <p className="text-xs text-gray-dark">
                        Terakhir diubah: {new Date(p.updated_at).toLocaleString('id-ID')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {isBoolean ? (
                      <select
                        value={currentVal ? 'true' : 'false'}
                        onChange={(e) =>
                          setPolicyValues({ ...policyValues, [p.key]: e.target.value === 'true' })
                        }
                        className="p-2 rounded border-2 border-black bg-white font-bold text-xs"
                      >
                        <option value="true">Aktif (True)</option>
                        <option value="false">Nonaktif (False)</option>
                      </select>
                    ) : isArray ? (
                      <textarea
                        rows={2}
                        value={Array.isArray(currentVal) ? currentVal.join(', ') : currentVal}
                        onChange={(e) =>
                          setPolicyValues({
                            ...policyValues,
                            [p.key]: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                          })
                        }
                        className="p-2 rounded border-2 border-black bg-white font-mono text-xs w-64"
                      />
                    ) : isNumber ? (
                      <input
                        type="number"
                        value={currentVal}
                        onChange={(e) =>
                          setPolicyValues({ ...policyValues, [p.key]: Number(e.target.value) })
                        }
                        className="p-2 rounded border-2 border-black bg-white font-bold text-xs w-28 text-center"
                      />
                    ) : (
                      <input
                        type="text"
                        value={currentVal}
                        onChange={(e) =>
                          setPolicyValues({ ...policyValues, [p.key]: e.target.value })
                        }
                        className="p-2 rounded border-2 border-black bg-white font-bold text-xs w-48"
                      />
                    )}

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleSaveInstitutionPolicy(p.key)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded border-2 border-black bg-ink text-white font-bold text-xs hover:bg-gray-dark transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>Simpan</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB PERINGATAN DINI */}
      {activeTab === 'peringatan-dini' && (
        <div className="p-5 sm:p-6 rounded-xl border-2 border-black bg-white shadow-retro space-y-6 max-w-3xl">
          <div className="border-b-2 border-black pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-heading font-bold text-lg text-black flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                <span>Ambang Batas Peringatan Dini Mahasiswa Berisiko</span>
              </h3>
              <p className="text-xs text-black/60 font-sans mt-0.5">
                Konfigurasi dinamis kriteria Aman, Perhatian, dan Risiko Tinggi yang dihitung harian.
              </p>
            </div>

            <button
              type="button"
              disabled={isPending}
              onClick={handleTriggerDailyCalculation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-black bg-surface hover:bg-gray-soft text-ink text-xs font-bold shadow-retro-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-primary ${isPending ? 'animate-spin' : ''}`} />
              <span>Uji Hitung Harian</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs sm:text-sm font-sans">
            <div className="p-4 rounded-lg border-2 border-black bg-gray-soft/30 space-y-3">
              <h4 className="font-bold text-black uppercase tracking-wider text-xs">
                1. Parameter Kehadiran Kuliah
              </h4>
              <div>
                <label className="block font-medium text-black mb-1">
                  Batas Minimal Kehadiran Ujian (Syarat UAS) (%)
                </label>
                <input
                  type="number"
                  value={earlyWarningPolicy.minAttendancePercent}
                  onChange={(e) =>
                    setEarlyWarningPolicy({ ...earlyWarningPolicy, minAttendancePercent: Number(e.target.value) })
                  }
                  className="w-full p-2.5 rounded border-2 border-black bg-white font-sans font-bold"
                />
              </div>

              <div>
                <label className="block font-medium text-black mb-1">
                  Ambang Peringatan Awal Kehadiran (%)
                </label>
                <input
                  type="number"
                  value={earlyWarningPolicy.warningAttendancePercent}
                  onChange={(e) =>
                    setEarlyWarningPolicy({ ...earlyWarningPolicy, warningAttendancePercent: Number(e.target.value) })
                  }
                  className="w-full p-2.5 rounded border-2 border-black bg-white font-sans font-bold"
                />
              </div>
            </div>

            <div className="p-4 rounded-lg border-2 border-black bg-gray-soft/30 space-y-3">
              <h4 className="font-bold text-black uppercase tracking-wider text-xs">
                2. Parameter Tugas & Keterlambatan
              </h4>
              <div>
                <label className="block font-medium text-black mb-1">
                  Toleransi Tugas Tertunda Kategori Perhatian
                </label>
                <input
                  type="number"
                  value={earlyWarningPolicy.maxMissingAssignmentsWarning}
                  onChange={(e) =>
                    setEarlyWarningPolicy({ ...earlyWarningPolicy, maxMissingAssignmentsWarning: Number(e.target.value) })
                  }
                  className="w-full p-2.5 rounded border-2 border-black bg-white font-sans font-bold"
                />
              </div>

              <div>
                <label className="block font-medium text-black mb-1">
                  Batas Tugas Tertunda Kategori Risiko Tinggi
                </label>
                <input
                  type="number"
                  value={earlyWarningPolicy.maxMissingAssignmentsHighRisk}
                  onChange={(e) =>
                    setEarlyWarningPolicy({ ...earlyWarningPolicy, maxMissingAssignmentsHighRisk: Number(e.target.value) })
                  }
                  className="w-full p-2.5 rounded border-2 border-black bg-white font-sans font-bold"
                />
              </div>
            </div>

            <div className="p-4 rounded-lg border-2 border-black bg-gray-soft/30 space-y-3">
              <h4 className="font-bold text-black uppercase tracking-wider text-xs">
                3. Parameter Tren Penurunan Nilai
              </h4>
              <div>
                <label className="block font-medium text-black mb-1">
                  Ambang Penurunan Nilai Signifikan (Poin Skor)
                </label>
                <input
                  type="number"
                  value={earlyWarningPolicy.gradeDropThresholdPoints}
                  onChange={(e) =>
                    setEarlyWarningPolicy({ ...earlyWarningPolicy, gradeDropThresholdPoints: Number(e.target.value) })
                  }
                  className="w-full p-2.5 rounded border-2 border-black bg-white font-sans font-bold"
                />
              </div>
            </div>

            <div className="p-4 rounded-lg border-2 border-black bg-gray-soft/30 space-y-3">
              <h4 className="font-bold text-black uppercase tracking-wider text-xs">
                4. Parameter Aktivitas Progres Materi
              </h4>
              <div>
                <label className="block font-medium text-black mb-1">
                  Rekomendasi Minimal Progres Materi Belajar (%)
                </label>
                <input
                  type="number"
                  value={earlyWarningPolicy.minMaterialProgressPercent}
                  onChange={(e) =>
                    setEarlyWarningPolicy({ ...earlyWarningPolicy, minMaterialProgressPercent: Number(e.target.value) })
                  }
                  className="w-full p-2.5 rounded border-2 border-black bg-white font-sans font-bold"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-gray-soft border-2 border-ink rounded text-ink font-bold text-xs flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span>
              Prinsip Peringatan Dini: Alat bantu monitoring akademik, bukan sanksi. Tidak ada perubahan otomatis pada nilai atau status kelulusan mahasiswa.
            </span>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              disabled={isPending}
              onClick={handleSaveEarlyWarning}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border-2 border-black bg-ink text-white font-heading font-bold text-sm shadow-retro hover:bg-gray-dark transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{isPending ? 'Menyimpan...' : 'Simpan Kebijakan Peringatan Dini'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
