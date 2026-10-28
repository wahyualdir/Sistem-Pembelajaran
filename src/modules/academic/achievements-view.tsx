'use client';
import { toast } from '@/components/ui/toast';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Trophy,
  Flame,
  Clock,
  CheckCircle,
  BookOpen,
  Book,
  MessageCircle,
  Award,
  Users,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  StudentAchievementSummary,
  getStudentAchievementsAction,
  updateStudentGamificationPrefsAction,
} from './gamification-actions';
import {
  SemesterRecapPayload,
  getStudentSemesterRecapAction,
} from './recap-actions';
import { Calendar, RefreshCw, Sparkles, BookMarked, Headphones, Users2 } from 'lucide-react';

const BADGE_ICONS: Record<string, React.ReactNode> = {
  clock: <Clock className="h-6 w-6" />,
  'check-circle': <CheckCircle className="h-6 w-6" />,
  'book-open': <BookOpen className="h-6 w-6" />,
  book: <Book className="h-6 w-6" />,
  'message-circle': <MessageCircle className="h-6 w-6" />,
  flame: <Flame className="h-6 w-6" />,
  award: <Award className="h-6 w-6" />,
};

export function AchievementsView() {
  const [activeTab, setActiveTab] = useState<'badges' | 'recap'>('badges');
  const [data, setData] = useState<StudentAchievementSummary | null>(null);
  const [recapData, setRecapData] = useState<SemesterRecapPayload | null>(null);
  const [isLoadingRecap, setIsLoadingRecap] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(false);
  const [displayAlias, setDisplayAlias] = useState('');
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    getStudentAchievementsAction().then((res) => {
      setIsLoading(false);
      if (res.ok && res.data) {
        setData(res.data);
        setShowOnLeaderboard(res.data.showOnLeaderboard);
        setDisplayAlias(res.data.displayAlias || '');
      }
    });
  }, []);

  const handleFetchRecap = useCallback(async () => {
    setIsLoadingRecap(true);
    const res = await getStudentSemesterRecapAction();
    setRecapData(res);
    setIsLoadingRecap(false);
  }, []);

  useEffect(() => {
    if (activeTab === 'recap' && !recapData && !isLoadingRecap) {
      handleFetchRecap();
    }
  }, [activeTab, recapData, isLoadingRecap, handleFetchRecap]);

  const handleSavePrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPrefs(true);
    const res = await updateStudentGamificationPrefsAction(showOnLeaderboard, displayAlias);
    setIsSavingPrefs(false);
    if (res.ok) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } else {
      toast.error(res.error || 'Gagal menyimpan pengaturan.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground rounded-[12px] border border-border bg-surface">
        Memuat data pencapaian akademik...
      </div>
    );
  }

  const earnedCount = data?.badges.filter((b) => b.isEarned).length || 0;
  const totalBadges = data?.badges.length || 7;

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b-2 border-ink pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('badges')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-ink text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0',
            activeTab === 'badges'
              ? 'bg-ink text-white border-b-4 border-b-primary shadow-retro'
              : 'bg-surface text-ink hover:bg-gray-soft shadow-xs'
          )}
        >
          <Award className="h-4 w-4" />
          <span>Lencana & Kebiasaan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('recap')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-ink text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0',
            activeTab === 'recap'
              ? 'bg-ink text-white border-b-4 border-b-primary shadow-retro'
              : 'bg-surface text-ink hover:bg-gray-soft shadow-xs'
          )}
        >
          <Calendar className="h-4 w-4" />
          <span>Rekap Semester</span>
        </button>
      </div>

      {activeTab === 'badges' && (
        <>
          {/* 1. Ringkasan Poin dan Kebiasaan Belajar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-xl border-2 border-ink bg-surface shadow-retro space-y-1">
              <div className="flex items-center justify-between text-gray-dark">
                <span className="text-xs font-sans font-medium uppercase tracking-[0.04em]">Total Poin Kebiasaan</span>
                <Trophy className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold font-heading text-ink tabular-nums">
                {data?.totalXp || 0} <span className="text-xs font-bold text-gray-dark">XP</span>
              </p>
              <p className="text-xs text-gray-dark font-medium pt-0.5">
                Diperoleh dari tugas tepat waktu, kehadiran, dan modul.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl border-2 border-ink bg-surface shadow-retro space-y-1">
              <div className="flex items-center justify-between text-gray-dark">
                <span className="text-xs font-sans font-medium uppercase tracking-[0.04em]">Kebiasaan Belajar</span>
                <Flame className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold font-heading text-ink tabular-nums">
                {data?.currentStreak || 0} <span className="text-xs font-bold text-gray-dark">hari beruntun</span>
              </p>
              <p className="text-xs text-gray-dark font-medium pt-0.5">
                Pencapaian terbaik: {data?.bestStreak || 0} hari berturut-turut.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl border-2 border-ink bg-surface shadow-retro space-y-1">
              <div className="flex items-center justify-between text-gray-dark">
                <span className="text-xs font-sans font-medium uppercase tracking-[0.04em]">Lencana Akademik</span>
                <Award className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold font-heading text-ink tabular-nums">
                {earnedCount} <span className="text-xs font-bold text-gray-dark">/ {totalBadges} diraih</span>
              </p>
              <p className="text-xs text-gray-dark font-medium pt-0.5">
                Pengakuan kebiasaan belajar positif di kampus.
              </p>
            </div>
          </div>

          {/* 2. Kisi Lencana Akademik */}
          <div className="rounded-xl border-2 border-ink bg-surface p-5 sm:p-6 shadow-retro space-y-4">
            <div className="border-b-2 border-ink pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-heading font-bold text-ink">Daftar Lencana</h2>
                <p className="text-xs text-gray-dark font-medium mt-0.5">
                  Lencana diperoleh secara otomatis melalui konsistensi aktivitas belajar harian.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(data?.badges || []).map((badge) => {
                const icon = BADGE_ICONS[badge.icon] || <Award className="h-6 w-6" />;
                return (
                  <div
                    key={badge.code}
                    className={`p-4 rounded-[12px] border transition-all ${
                      badge.isEarned
                        ? 'border-primary/40 bg-primary/5 shadow-xs'
                        : 'border-border/60 bg-muted/20 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border ${
                          badge.isEarned
                            ? 'border-primary/50 bg-primary text-primary-foreground shadow-xs'
                            : 'border-border bg-muted text-muted-foreground'
                        }`}
                      >
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-foreground truncate">{badge.name}</h3>
                          {badge.isEarned ? (
                            <span className="text-[10px] font-mono font-bold text-white bg-black px-2 py-0.5 rounded border border-black shadow-xs">
                              Diraih
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              Terkunci
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {badge.description}
                        </p>
                        {badge.isEarned && badge.earnedAt && (
                          <p className="text-[10px] text-muted-foreground/80 pt-0.5">
                            Diraih pada {new Date(badge.earnedAt).toLocaleDateString('id-ID')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Pengaturan Papan Peringkat (Opt-in) */}
          <div className="rounded-[12px] border border-border bg-surface p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Pengaturan Partisipasi Papan Peringkat</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Papan peringkat hanya menampilkan poin kebiasaan belajar mingguan dan bersifat opsional. Peringkat tidak pernah didasarkan pada nilai ujian atau tugas.
              </p>
            </div>

            <form onSubmit={handleSavePrefs} className="space-y-4 max-w-lg">
              <label className="flex items-center gap-3 text-xs font-medium text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnLeaderboard}
                  onChange={(e) => setShowOnLeaderboard(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <span>Tampilkan saya di papan peringkat kelas mingguan</span>
              </label>

              {showOnLeaderboard && (
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-semibold text-foreground">
                    Nama Alias Papan Peringkat
                  </label>
                  <input
                    type="text"
                    value={displayAlias}
                    onChange={(e) => setDisplayAlias(e.target.value)}
                    placeholder="Contoh: Bintang Belajar"
                    maxLength={40}
                    className="w-full rounded-[8px] border border-border px-3 py-2 text-xs bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Nama alias ditampilkan ke mahasiswa lain untuk menjaga privasi identitasmu.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSavingPrefs}
                  className="px-4 py-2 rounded-[8px] bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
                >
                  Simpan Pengaturan
                </button>
                {savedSuccess && (
                  <span className="text-xs text-black font-bold">Pengaturan tersimpan.</span>
                )}
              </div>
            </form>
          </div>
        </>
      )}

      {/* REKAP SEMESTER TAB */}
      {activeTab === 'recap' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[12px] border border-border bg-surface">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-base font-bold text-foreground">
                  {recapData?.title || 'Rekap Pembelajaran Semester'}
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Ringkasan pribadi aktivitas belajar mandiri di SIAJAR. Tenang, rahasia, dan tanpa perbandingan dengan orang lain.
              </p>
            </div>
            <button
              type="button"
              onClick={handleFetchRecap}
              disabled={isLoadingRecap}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-border bg-surface hover:bg-muted/50 text-xs font-medium text-foreground transition-colors self-start sm:self-auto disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingRecap ? 'animate-spin' : ''}`} />
              <span>Muat Ulang</span>
            </button>
          </div>

          {isLoadingRecap ? (
            <div className="p-12 text-center text-xs text-muted-foreground rounded-[12px] border border-border bg-surface">
              Memuat data rekapitulasi semester...
            </div>
          ) : !recapData || (recapData.totalChaptersPassed === 0 && recapData.flashcardsReviewedCount === 0 && recapData.podcastMinutesListened === 0) ? (
            <div className="p-12 text-center space-y-3 rounded-[12px] border border-dashed border-border bg-surface">
              <BookMarked className="h-8 w-8 text-muted-foreground mx-auto" />
              <h3 className="text-sm font-semibold text-foreground">Belum ada aktivitas yang tercatat semester ini.</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Selesaikan kuis bab pulau belajar, ulas flashcard, atau dengarkan podcast ringkasan materi untuk merekam jejak belajarmu.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Card 1: Narasi Headline */}
              <div className="p-5 rounded-[12px] border border-border bg-surface space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                    Pola Kebiasaan Belajar
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                    {recapData.learningHabitBadge}
                  </span>
                </div>
                <p className="text-sm sm:text-base font-medium text-foreground leading-relaxed">
                  {recapData.headlineSummary}
                </p>
              </div>

              {/* Grid Kartu Metrik */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Penyelesaian Pulau */}
                <div className="p-5 rounded-[12px] border border-border bg-surface space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Penyelesaian Pulau
                  </span>
                  <p className="text-3xl font-bold font-heading text-foreground tabular-nums">
                    {recapData.completionRatePct}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {recapData.totalChaptersPassed} bab pulau dituntaskan.
                  </p>
                </div>

                {/* 2. Flashcard Diulas */}
                <div className="p-5 rounded-[12px] border border-border bg-surface space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Ulasan Flashcard
                  </span>
                  <p className="text-3xl font-bold font-heading text-foreground tabular-nums">
                    {recapData.flashcardsReviewedCount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Kartu diulas dengan jeda pengulangan berkala (Leitner).
                  </p>
                </div>

                {/* 3. Waktu Podcast */}
                <div className="p-5 rounded-[12px] border border-border bg-surface space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Podcast Materi
                  </span>
                  <p className="text-3xl font-bold font-heading text-foreground tabular-nums">
                    {recapData.podcastMinutesListened} <span className="text-xs font-normal text-muted-foreground">menit</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Durasi audio materi yang didengarkan.
                  </p>
                </div>

                {/* 4. Tukar Keahlian */}
                <div className="p-5 rounded-[12px] border border-border bg-surface space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Bantuan Teman
                  </span>
                  <p className="text-3xl font-bold font-heading text-foreground tabular-nums">
                    {recapData.peerHelpAcceptedCount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Jawabanmu ditandai membantu di forum Tukar Keahlian.
                  </p>
                </div>
              </div>

              {/* Card 2: Penguasaan Topik */}
              <div className="p-5 rounded-[12px] border border-border bg-surface space-y-4">
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Penguasaan Topik Perkuliahan
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border-2 border-black bg-white shadow-retro-sm space-y-2">
                    <span className="text-xs font-mono font-bold text-black uppercase">
                      Topik Dikuasai ({recapData.strongTopics.length})
                    </span>
                    {recapData.strongTopics.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Belum ada topik di level kuat.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {recapData.strongTopics.map((topik: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded text-[11px] font-mono font-bold border border-black bg-gray-soft text-black"
                          >
                            {topik}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 rounded-lg border-2 border-black bg-white shadow-retro-sm space-y-2">
                    <span className="text-xs font-mono font-bold text-black uppercase">
                      Perlu Latihan Tambahan ({recapData.growthTopics.length})
                    </span>
                    {recapData.growthTopics.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Semua topik yang dicoba telah dikuasai.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {recapData.growthTopics.map((topik: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded text-[11px] font-mono font-bold border border-black bg-white text-black"
                          >
                            {topik}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Catatan Privasi & Perkiraan Waktu */}
              <div className="p-4 rounded-[12px] border border-border bg-muted/20 text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground block mb-0.5">Catatan Perkiraan Waktu Belajar:</span>
                Perkiraan waktu belajar dihitung dari durasi podcast yang diselesaikan, durasi pengerjaan kuis, dan ulasan flashcard (estimasi 20 detik/kartu). Perkiraan ini berasal dari aktivitas yang tercatat di SIAJAR. Belajar mandiri di luar SIAJAR tidak terhitung. Rekap ini bersifat pribadi dan tidak pernah dibagikan ke dosen atau mahasiswa lain.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
