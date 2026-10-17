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
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { isDemoMode } from '@/lib/config/features';
import {
  getEarlyWarningPolicyAction,
  updateEarlyWarningPolicyAction,
  triggerDailyRiskCalculationAction,
} from '@/modules/early-warning/actions';
import type { EarlyWarningPolicy } from '@/modules/early-warning/types';

type PolicyTab = 'akademik' | 'ujian-pengawasan' | 'privasi-retensi' | 'peringatan-dini';

export function SuperadminPoliciesHubView() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as PolicyTab) || 'akademik';
  const [activeTab, setActiveTab] = useState<PolicyTab>(initialTab);
  const isDemo = isDemoMode();

  const [policy, setPolicy] = useState<EarlyWarningPolicy>({
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

  useEffect(() => {
    getEarlyWarningPolicyAction().then((p) => {
      if (p) setPolicy(p);
    });
  }, []);

  const handleSavePolicy = () => {
    startTransition(async () => {
      setFeedback(null);
      const res = await updateEarlyWarningPolicyAction(policy);
      if (res.ok && res.data) {
        setPolicy(res.data);
        setFeedback({
          type: 'success',
          message: 'Kebijakan dan ambang batas risiko berhasil disimpan dan dicatat ke audit log.',
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
          message: `Evaluasi selesai: ${res.data.evaluatedCount} pendaftaran dievaluasi, ${res.data.escalatedCount} mengalami eskalasi risiko, ${res.data.notificationsSent} notifikasi terkirim.`,
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
                Kebijakan Akademik, Ujian & Privasi
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-dark font-medium max-w-2xl leading-relaxed">
              Tentukan parameter regulasi akademik baku universitas, batas ambang pengawasan kuis/ujian, kebijakan privasi, dan ambang batas peringatan dini mahasiswa berisiko.
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
          { id: 'akademik', label: 'Kebijakan Akademik', icon: BookOpen },
          { id: 'peringatan-dini', label: 'Peringatan Dini & Ambang Risiko', icon: ShieldAlert },
          { id: 'ujian-pengawasan', label: 'Ujian & Pengawasan', icon: Award },
          { id: 'privasi-retensi', label: 'Privasi & Retensi Data', icon: FileText },
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

      {/* 3. KONTEN TAB */}

      {/* TAB 1: KEBIJAKAN AKADEMIK */}
      {activeTab === 'akademik' && (
        <div className="p-5 sm:p-6 rounded-xl border-2 border-black bg-white shadow-retro space-y-6 max-w-2xl">
          <div className="border-b-2 border-black pb-3">
            <h3 className="font-heading font-bold text-lg text-black">Aturan Kelayakan Akademik Baku</h3>
            <p className="text-xs text-black/60 font-sans">Diterapkan otomatis pada kalkulasi KHS, transkrip, dan eligibility ujian.</p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm font-sans">
            <div>
              <label className="block font-bold text-black mb-1">Syarat Kehadiran Minimal Ujian Akhir (%)</label>
              <input
                type="number"
                value={policy.minAttendancePercent}
                onChange={(e) =>
                  setPolicy({ ...policy, minAttendancePercent: Number(e.target.value) })
                }
                className="w-full p-2.5 rounded border-2 border-black bg-gray-soft/20 font-sans font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-black mb-1">Maksimal Beban SKS Semester Reguler</label>
              <input
                type="number"
                defaultValue={24}
                className="w-full p-2.5 rounded border-2 border-black bg-gray-soft/20 font-sans font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-black mb-1">Batas Minimal IPK Kelulusan (Yudisium)</label>
              <input
                type="text"
                defaultValue="2.00 (Skala 4.00)"
                className="w-full p-2.5 rounded border-2 border-black bg-gray-soft/20 font-sans font-bold"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB BARU: PERINGATAN DINI & AMBANG RISIKO */}
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
            {/* PARAMETER 1: KEHADIRAN */}
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
                  value={policy.minAttendancePercent}
                  onChange={(e) =>
                    setPolicy({ ...policy, minAttendancePercent: Number(e.target.value) })
                  }
                  className="w-full p-2.5 rounded border-2 border-black bg-white font-sans font-bold"
                />
                <span className="text-[11px] text-gray-dark block mt-1">
                  Kehadiran di bawah persentase ini dikategorikan <b>Risiko Tinggi</b>.
                </span>
              </div>

              <div>
                <label className="block font-medium text-black mb-1">
                  Ambang Peringatan Awal Kehadiran (%)
                </label>
                <input
                  type="number"
                  value={policy.warningAttendancePercent}
                  onChange={(e) =>
                    setPolicy({ ...policy, warningAttendancePercent: Number(e.target.value) })
                  }
                  className="w-full p-2.5 rounded border-2 border-black bg-white font-sans font-bold"
                />
                <span className="text-[11px] text-gray-dark block mt-1">
                  Kehadiran di antara syarat minimal dan ambang ini dikategorikan <b>Perhatian</b>.
                </span>
              </div>
            </div>

            {/* PARAMETER 2: TUGAS KULIAH */}
            <div className="p-4 rounded-lg border-2 border-black bg-gray-soft/30 space-y-3">
              <h4 className="font-bold text-black uppercase tracking-wider text-xs">
                2. Parameter Tugas & Keterlambatan
              </h4>
              <div>
                <label className="block font-medium text-black mb-1">
                  Toleransi Tugas Tertunda Kategori Perhatian (Jumlah)
                </label>
                <input
                  type="number"
                  value={policy.maxMissingAssignmentsWarning}
                  onChange={(e) =>
                    setPolicy({ ...policy, maxMissingAssignmentsWarning: Number(e.target.value) })
                  }
                  className="w-full p-2.5 rounded border-2 border-black bg-white font-sans font-bold"
                />
              </div>

              <div>
                <label className="block font-medium text-black mb-1">
                  Batas Tugas Tertunda Kategori Risiko Tinggi (Jumlah)
                </label>
                <input
                  type="number"
                  value={policy.maxMissingAssignmentsHighRisk}
                  onChange={(e) =>
                    setPolicy({ ...policy, maxMissingAssignmentsHighRisk: Number(e.target.value) })
                  }
                  className="w-full p-2.5 rounded border-2 border-black bg-white font-sans font-bold"
                />
              </div>
            </div>

            {/* PARAMETER 3: TREN NILAI */}
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
                  value={policy.gradeDropThresholdPoints}
                  onChange={(e) =>
                    setPolicy({ ...policy, gradeDropThresholdPoints: Number(e.target.value) })
                  }
                  className="w-full p-2.5 rounded border-2 border-black bg-white font-sans font-bold"
                />
                <span className="text-[11px] text-gray-dark block mt-1">
                  Jika nilai tugas/kuis terbaru turun melebihi poin ini dari rata-rata sebelumnya.
                </span>
              </div>
            </div>

            {/* PARAMETER 4: AKTIVITAS BELAJAR */}
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
                  value={policy.minMaterialProgressPercent}
                  onChange={(e) =>
                    setPolicy({ ...policy, minMaterialProgressPercent: Number(e.target.value) })
                  }
                  className="w-full p-2.5 rounded border-2 border-black bg-white font-sans font-bold"
                />
                <span className="text-[11px] text-gray-dark block mt-1">
                  Penyelesaian modul di bawah nilai ini memicu catatan keaktifan belajar.
                </span>
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
              onClick={handleSavePolicy}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border-2 border-black bg-ink text-white font-heading font-bold text-sm shadow-retro hover:bg-gray-dark transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{isPending ? 'Menyimpan...' : 'Simpan Kebijakan Peringatan Dini'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: UJIAN & PENGAWASAN */}
      {activeTab === 'ujian-pengawasan' && (
        <div className="p-5 sm:p-6 rounded-xl border-2 border-black bg-white shadow-retro space-y-6 max-w-2xl">
          <div className="border-b-2 border-black pb-3">
            <h3 className="font-heading font-bold text-lg text-black">Regulasi Proctoring & Sanksi Otomatis</h3>
            <p className="text-xs text-black/60 font-sans">Toleransi anomali layar, tab switch, dan diskualifikasi sesi CBT.</p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm font-sans">
            <div>
              <label className="block font-bold text-black mb-1">Ambang Maksimal Peringatan Pelanggaran Siswa</label>
              <input
                type="number"
                defaultValue={3}
                className="w-full p-2.5 rounded border-2 border-black bg-gray-soft/20 font-sans"
              />
            </div>
            <div>
              <label className="block font-bold text-black mb-1">Aksi Pelanggaran Melebihi Batas</label>
              <select className="w-full p-2.5 rounded border-2 border-black bg-white font-sans">
                <option value="AUTO_LOCK">Kunci Lembar Ujian & Butuh Verifikasi Pengawas</option>
                <option value="DISQUALIFY">Diskualifikasi Langsung (Nilai 0)</option>
              </select>
            </div>
            <div className="p-3 bg-gray-soft border-2 border-ink rounded text-ink font-bold text-xs">
              Catatan: Intervensi dosen (tambah waktu / beri peringatan manual) TIDAK dihitung sebagai pelanggaran mahasiswa.
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PRIVASI & RETENSI DATA */}
      {activeTab === 'privasi-retensi' && (
        <div className="p-5 sm:p-6 rounded-xl border-2 border-black bg-white shadow-retro space-y-6 max-w-2xl">
          <div className="border-b-2 border-black pb-3">
            <h3 className="font-heading font-bold text-lg text-black">Kebijakan Retensi Data Sensitif (UU PDP)</h3>
            <p className="text-xs text-black/60 font-sans">Penghapusan berkala data biometrik, foto presensi, dan koordinat GPS.</p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm font-sans">
            <div>
              <label className="block font-bold text-black mb-1">Retensi Koordinat GPS Presensi Mahasiswa</label>
              <input
                type="text"
                defaultValue="90 Hari (Anonimkan Setelah Semester Berakhir)"
                className="w-full p-2.5 rounded border-2 border-black bg-gray-soft/20 font-sans"
              />
            </div>
            <div>
              <label className="block font-bold text-black mb-1">Retensi Log Audit Forensik Sistem</label>
              <input
                type="text"
                readOnly
                value="Permanen (Append-Only Anti-Tamper)"
                className="w-full p-2.5 rounded border-2 border-black bg-surface text-ink font-bold font-sans"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
