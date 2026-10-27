/**
 * Token warna tema untuk viewport meta tag.
 * Diambil dari token latar belakang resmi (:root dan .dark di src/app/globals.css).
 */
export const VIEWPORT_THEME_COLORS = [
  { media: "(prefers-color-scheme: light)", color: "#F5F3EE" },
  { media: "(prefers-color-scheme: dark)", color: "#111111" },
] as const;
