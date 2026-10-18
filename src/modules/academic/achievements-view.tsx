'use client';

import React, { useState, useEffect } from 'react';
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
  const [data, setData] = useState<StudentAchievementSummary | null>(null);
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

  const handleSavePrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPrefs(true);
    const res = await updateStudentGamificationPrefsAction(showOnLeaderboard, displayAlias);
    setIsSavingPrefs(false);
    if (res.ok) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } else {
      alert(res.error || 'Gagal menyimpan pengaturan.');
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
      {/* 1. Ringkasan Poin dan Kebiasaan Belajar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-[12px] border border-border bg-surface space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Poin Kebiasaan</span>
            <Trophy className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-heading text-foreground tabular-nums">
            {data?.totalXp || 0} <span className="text-xs font-normal text-muted-foreground">XP</span>
          </p>
          <p className="text-[11px] text-muted-foreground">
            Diperoleh dari tugas tepat waktu, kehadiran, dan modul mandiri.
          </p>
        </div>

        <div className="p-5 rounded-[12px] border border-border bg-surface space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Kebiasaan Belajar</span>
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
          <p className="text-2xl font-bold font-heading text-foreground tabular-nums">
            {data?.currentStreak || 0} <span className="text-xs font-normal text-muted-foreground">hari beruntun</span>
          </p>
          <p className="text-[11px] text-muted-foreground">
            Pencapaian terbaik: {data?.bestStreak || 0} hari berturut-turut.
          </p>
        </div>

        <div className="p-5 rounded-[12px] border border-border bg-surface space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Lencana Akademik</span>
            <Award className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-bold font-heading text-foreground tabular-nums">
            {earnedCount} <span className="text-xs font-normal text-muted-foreground">/ {totalBadges} diraih</span>
          </p>
          <p className="text-[11px] text-muted-foreground">
            Pengakuan kebiasaan belajar positif di kampus.
          </p>
        </div>
      </div>

      {/* 2. Kisi Lencana Akademik */}
      <div className="rounded-[12px] border border-border bg-surface p-6 space-y-5">
        <div>
          <h2 className="text-base font-bold text-foreground">Daftar Lencana</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Lencana diperoleh secara otomatis melalui konsistensi aktivitas belajar harian.
          </p>
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
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
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
              <span className="text-xs text-emerald-600 font-medium">Pengaturan tersimpan.</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
