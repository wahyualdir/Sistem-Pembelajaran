# Panduan Sistem Gerak & Animasi SIAJAR (docs/MOTION.md)

*Panduan resmi standar animasi, token gerak, hook, dan aturan implementasi untuk pengembang SIAJAR.*  
*Versi 1.0 · 27 Oktober 2026*

---

## 1. Prinsip Utama

1. **Bertujuan**: Setiap gerak menjawab salah satu: *Dari mana elemen ini datang?*, *Apa yang berubah?*, atau *Apakah aksi pengguna berhasil?*. Hindari gerak yang semata-mata dekorasi.
2. **Cepat & Tenang**: Interaksi 80–140ms, transisi drawer/sheet 220–300ms, grafik/count-up ≤ 600ms. Tutup lebih cepat dari buka (keluar ≈ 70% durasi masuk).
3. **Hemat Komputasi**: Hanya menganimasikan `transform` dan `opacity`. Jangan menganimasikan properti layout (`width`, `height`, `top`, `left`, `margin`, `padding`). Satu-satunya pengecualian adalah teknik `grid-template-rows: 0fr -> 1fr` pada akordeon (M07).
4. **Tidak Menahan Interaksi**: Elemen harus bisa dibaca dan diklik sejak pertama kali muncul; animasi tidak boleh menunda pengguna.
5. **Zero-Blank-Screen Safety**: Konten default selalu `opacity: 1`. Efek scroll-reveal hanya menyembunyikan elemen sebelum paint jika kelas `motion-ready` terpasang di `<html>` dan bukan mode `mati`. Seluruh elemen otomatis dipaksa tampil penuh setelah timeout pengaman 1.500ms.

---

## 2. Token Gerak & Easing

Semua durasi dan kurva akselerasi wajib menggunakan token CSS variables terpusat di `:root`:

```css
:root {
  --dur-instant: 80ms;   /* Umpan balik sentuh, ketukan tombol (:active) */
  --dur-fast: 140ms;     /* Hover, fokus, popover, tooltip */
  --dur-base: 220ms;     /* Tab, akordeon, modal, reveal masuk kecil */
  --dur-slow: 300ms;     /* Sidebar drawer, bottom sheet, pergantian halaman */
  --dur-data: 600ms;     /* Grafik, bar progres, kenaikan angka statistik */
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);       /* Percepatan masuk (lembut) */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);             /* Percepatan keluar */
  --ease-inout: cubic-bezier(0.65, 0, 0.35, 1);      /* Indikator geser (tabs/nav) */
  --stagger: 40ms;       /* Jeda beruntun antarkartu */
  --stagger-max: 6;      /* Batas maksimal jeda (anak ke-7 dst serentak) */
}
```

### Pemetaan Mode Gerak (`data-motion`)

| Atribut `html[data-motion]` | `--dur-base` | `--dur-slow` | `--dur-data` | `--stagger` | Keterangan |
|---|---|---|---|---|---|
| `penuh` *(default)* | `220ms` | `300ms` | `600ms` | `40ms` | Seluruh animasi aktif |
| `hemat` | `120ms` | `160ms` | `0.01ms` | `0ms` | Pudar cepat saja, tanpa count-up |
| `mati` | `0.01ms` | `0.01ms` | `0.01ms` | `0ms` | Seluruh gerak mati total |

> [!NOTE]
> Kelas legacy `lite-performance-mode` dan media query OS `prefers-reduced-motion: reduce` secara otomatis memicu perilaku mode **`hemat`**. Jika pengguna secara eksplisit memilih **`mati`**, seluruh durasi menjadi `0.01ms`.

---

## 3. Hook Khusus Animasi

### 1. `useMotionPreference()`
Membaca dan mengatur preferensi gerak pengguna secara reaktif.
```tsx
import { useMotionPreference } from '@/hooks/use-motion-preference';

function MyComponent() {
  const { motion, setMotion, isMotionFull, isMotionReduced, isMotionDisabled } = useMotionPreference();
  // motion: 'penuh' | 'hemat' | 'mati'
}
```

### 2. `useCountUp(endValue, options)`
Animasi kenaikan angka statistik yang otomatis langsung menampilkan angka akhir pada mode `hemat` atau `mati`.
```tsx
import { useCountUp } from '@/hooks/use-count-up';

function StatCard({ score }: { score: number }) {
  const displayValue = useCountUp(score, { duration: 600, decimals: 2 });
  return <span className="tabular-nums font-bold text-2xl">{displayValue}</span>;
}
```

### 3. `useInView(ref, options)`
Deteksi masuknya elemen ke area pandang menggunakan `IntersectionObserver`.
```tsx
import { useRef } from 'react';
import { useInView } from '@/hooks/use-in-view';

function Card() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  return <div ref={ref} className={inView ? 'animate-fade-in' : 'opacity-0'} />;
}
```

---

## 4. Utilitas Tailwind Animasi Resmi

Tersedia di `tailwind.config.ts`:
- `.animate-fade-in` (`fade-in var(--dur-base) var(--ease-out)`)
- `.animate-fade-up` (`rise 0.34s var(--ease)`)
- `.animate-scale-in` (`scale-in var(--dur-base) var(--ease-out)`)
- `.animate-scale-up` (`scale-up var(--dur-fast) var(--ease-out)`)
- `.animate-slide-in-right` (`slide-in-right var(--dur-slow) var(--ease-out)`)
- `.animate-slide-in-left` (`slide-in-left var(--dur-slow) var(--ease-out)`)
- `.animate-slide-up` (`slide-up var(--dur-slow) var(--ease-out)`)
- `.animate-bounce-short` (`bounce-short var(--dur-fast) var(--ease-out)`)
- `.animate-shimmer` (`shimmer 1.8s linear infinite`)
- `.animate-check-draw` (`check-draw var(--dur-base) var(--ease-out)`)
- `.animate-spin`, `.animate-ping`, `.animate-pulse`, `.animate-bounce` (Tailwind bawaan)

---

## 5. Katalog 22 Animasi Terpadu (M01 – M22)

| ID | Nama | Komponen Target | Perilaku & Easing |
|---|---|---|---|
| **M01** | Masuk Halaman (Page Enter) | `template.tsx` portal / main | Fade + translateY(8px -> 0), `--dur-base` |
| **M02** | Drawer Kiri (Sidebar Mobile) | `portal-shell.tsx` aside | translateX(-100% -> 0), backdrop fade |
| **M03** | Panel Kanan (Right Drawer) | `*-dashboard-client.tsx` | slide-in-right, `--dur-slow` |
| **M04** | Bottom Sheet Dialog | `ui/dialog.tsx` & modal kustom | slide-in-from-bottom pada mobile (`< sm`), drag handle |
| **M05** | Indikator Navigasi Bawah | `MobileBottomNav` | Underline / pill slide dengan `--ease-inout` |
| **M06** | Garis Tab Aktif | `ScrollableTabs`, `class-hub-tabs` | Auto-center scroll + border transition |
| **M07** | Akordeon / Lipat | Sidebar groups, filter sheet | `grid-template-rows: 0fr -> 1fr`, `--dur-base` |
| **M08** | Dropdown / Popover / Tooltip | Radix UI primitives | scale(0.95 -> 1) + fade, transform-origin |
| **M09** | Reveal Saat Gulir | `ScrollReveal`, kartu aktivitas | Fade + translateY(12px -> 0), stagger 40ms |
| **M10** | Count-up Angka Statistik | IPK, CPL, Presensi, Ringkasan | `useCountUp` tabular-nums, `--dur-data` |
| **M11** | Bar / Cincin Progres | Progress bar materi & capaian | `scaleX` dari kiri (bukan animating width) |
| **M12** | Grafik Masuk (Recharts) | Grafik tren IPK, radar CPMK | `isAnimationActive` dihormati sesuai preferensi |
| **M13** | Heatmap Kontribusi | `heatmap-kontribusi.tsx` | Sel berurutan stagger 8ms |
| **M14** | Shimmer Skeleton -> Konten | `ui/skeleton.tsx`, `loading.tsx` | Shimmer saat memuat, crossfade 160ms |
| **M15** | Umpan Balik Tekan (Press) | Tombol & kartu interaktif | `:active:scale-[0.98]`, `--dur-instant` |
| **M16** | Sorotan Ketukan Baris | List row & menu item | Background highlight flash (pengganti hover sentuh) |
| **M17** | Aksi Berhasil / Gagal | Submit tugas, presensi, form | SVG check-draw & error shake |
| **M18** | Pewaktu Hampir Habis | CBT / Kuis countdown timer | Pulsa tunggal 400ms saat 5:00 & 1:00 |
| **M19** | Header Saat Digulir | `portal-shell.tsx` topbar | Border & shadow pudar halus saat scroll > 10px |
| **M20** | Hero Login / Landing | `login/page.tsx`, `app/page.tsx` | Animasi tenang, pulse mati di mobile |
| **M21** | Lencana Notifikasi Naik | Bell icon unread badge | Pop scale 1 -> 1.15 -> 1 saat nilai berubah |
| **M22** | Gambar / Media Dimuat | Materi image & avatar | Smooth fade-in saat onLoad selesai |
