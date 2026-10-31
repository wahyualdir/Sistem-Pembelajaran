export interface ClassroomBannerTheme {
  id: string;
  bannerGradient: string;
  avatarBg: string;
  accentText: string;
  progressBar: string;
  badgeSoftBg: string;
  badgeSoftText: string;
  pattern:
    | 'cloud-nodes'
    | 'binary-tree'
    | 'data-cylinders'
    | 'cyber-shield'
    | 'neural-constellation'
    | 'editorial-compass';
}

// Palet Banner Kelas Berwarna ala Google Classroom (100% Patuh cek-hex.js)
export const CLASSROOM_BANNER_THEMES: ClassroomBannerTheme[] = [
  {
    id: 'terracotta',
    bannerGradient: 'bg-gradient-to-br from-[#9E3B1E] via-[#853827] to-[#4A1F16]',
    avatarBg: 'bg-[#4A1F16]',
    accentText: 'text-[#C2553A]',
    progressBar: 'bg-[#C2553A]',
    badgeSoftBg: 'bg-[#FEF2F0]',
    badgeSoftText: 'text-[#853827]',
    pattern: 'cloud-nodes',
  },
  {
    id: 'emerald',
    bannerGradient: 'bg-gradient-to-br from-[#047857] via-[#065F46] to-[#064E3B]',
    avatarBg: 'bg-[#064E3B]',
    accentText: 'text-[#065F46]',
    progressBar: 'bg-[#047857]',
    badgeSoftBg: 'bg-[#FAF8F5]',
    badgeSoftText: 'text-[#065F46]',
    pattern: 'binary-tree',
  },
  {
    id: 'navy',
    bannerGradient: 'bg-gradient-to-br from-[#075985] via-[#0C4A6E] to-[#182247]',
    avatarBg: 'bg-[#0B152D]',
    accentText: 'text-[#0C4A6E]',
    progressBar: 'bg-[#0369A1]',
    badgeSoftBg: 'bg-[#FAF8F5]',
    badgeSoftText: 'text-[#0C4A6E]',
    pattern: 'data-cylinders',
  },
  {
    id: 'amber',
    bannerGradient: 'bg-gradient-to-br from-[#B45309] via-[#92400E] to-[#451A03]',
    avatarBg: 'bg-[#451A03]',
    accentText: 'text-[#92400E]',
    progressBar: 'bg-[#B45309]',
    badgeSoftBg: 'bg-[#F2EFE8]',
    badgeSoftText: 'text-[#92400E]',
    pattern: 'cyber-shield',
  },
  {
    id: 'plum',
    bannerGradient: 'bg-gradient-to-br from-[#6D28D9] via-[#4C1D95] to-[#3B0764]',
    avatarBg: 'bg-[#3B0764]',
    accentText: 'text-[#4C1D95]',
    progressBar: 'bg-[#6D28D9]',
    badgeSoftBg: 'bg-[#FAF8F5]',
    badgeSoftText: 'text-[#4C1D95]',
    pattern: 'neural-constellation',
  },
  {
    id: 'espresso',
    bannerGradient: 'bg-gradient-to-br from-[#38312A] via-[#2D2823] to-[#1C1917]',
    avatarBg: 'bg-[#C2553A]',
    accentText: 'text-[#C2553A]',
    progressBar: 'bg-[#1C1917]',
    badgeSoftBg: 'bg-[#F2EFE8]',
    badgeSoftText: 'text-[#1C1917]',
    pattern: 'editorial-compass',
  },
];

export function getClassroomBannerTheme(
  key?: string | null,
  fallbackIndex = 0
): ClassroomBannerTheme {
  const k = (key || '').toUpperCase();
  if (
    k.includes('STI2544138') ||
    k.includes('000001') ||
    k.includes('PEMROGRAMAN WEB')
  ) {
    return CLASSROOM_BANNER_THEMES[0];
  }
  if (
    k.includes('STI2543131') ||
    k.includes('000002') ||
    k.includes('ALGORITMA')
  ) {
    return CLASSROOM_BANNER_THEMES[1];
  }
  if (
    k.includes('STI2541114') ||
    k.includes('000003') ||
    k.includes('BASIS DATA')
  ) {
    return CLASSROOM_BANNER_THEMES[2];
  }
  if (
    k.includes('STI2543130') ||
    k.includes('000004') ||
    k.includes('JARINGAN')
  ) {
    return CLASSROOM_BANNER_THEMES[3];
  }
  if (
    k.includes('STI2543129') ||
    k.includes('000005') ||
    k.includes('KECERDASAN BUATAN')
  ) {
    return CLASSROOM_BANNER_THEMES[4];
  }
  return CLASSROOM_BANNER_THEMES[Math.abs(fallbackIndex) % CLASSROOM_BANNER_THEMES.length];
}
