import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        background: "var(--bg-main)",
        surface: {
          DEFAULT: "var(--surface)",
          raised: "var(--bg-surface-raised)",
        },
        border: {
          DEFAULT: "var(--border-main)",
          strong: "var(--border-strong)",
        },
        foreground: "var(--text-primary)",
        muted: {
          DEFAULT: "var(--bg-main)",
          foreground: "var(--text-secondary)",
        },
        subtle: {
          DEFAULT: "var(--text-subtle)",
          foreground: "var(--text-subtle)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          dark: "var(--primary-dark)",
          tint: "var(--primary-soft)",
          soft: "var(--primary-soft)",
          foreground: "var(--primary-foreground)",
        },
        "primary-dark": "var(--primary-dark)",
        ink: "var(--ink)",
        gray: {
          DEFAULT: "var(--gray)",
          dark: "var(--gray-dark)",
          soft: "var(--gray-soft)",
        },
        "gray-dark": "var(--gray-dark)",
        "gray-soft": "var(--gray-soft)",
        danger: {
          DEFAULT: "var(--status-danger)",
          soft: "var(--status-danger-soft)",
          border: "var(--status-danger-border)",
          foreground: "var(--status-danger-foreground)",
        },
        retro: {
          bg: "var(--retro-bg)",
          surface: "var(--retro-surface)",
          warm: "var(--retro-warm)",
          border: "var(--retro-border)",
          dither: "var(--retro-dither)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          subtle: "var(--text-subtle)",
        },
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        control: "8px",
        md: "10px",
        lg: "12px",
        container: "14px",
        xl: "16px",
        "2xl": "18px",
        "3xl": "24px",
      },
      boxShadow: {
        DEFAULT: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
        "2xs": "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        sm: "0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.06)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -4px rgba(0, 0, 0, 0.06)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.06), 0 8px 10px -6px rgba(0, 0, 0, 0.06)",
        // Soft modern aliases for legacy retro shadows to prevent neobrutalist block shadows
        "retro-xs": "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
        "retro-sm": "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
        retro: "0 2px 6px 0 rgba(0, 0, 0, 0.05)",
        "retro-md": "0 4px 10px 0 rgba(0, 0, 0, 0.06)",
        "retro-lg": "0 10px 20px -3px rgba(0, 0, 0, 0.07)",
        "retro-window": "0 12px 24px -4px rgba(0, 0, 0, 0.08)",
      },
      spacing: {
        sidebar: "var(--layout-sidebar-width)",
        rail: "var(--layout-rail-width)",
        "right-panel": "var(--layout-right-panel-width)",
        header: "var(--layout-header-height)",
        "header-mobile": "var(--layout-header-height-mobile)",
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '0.9375rem' }], // 11px
        'xs': ['0.75rem', { lineHeight: '1.0625rem' }],     // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],      // 14px
        'base': ['1rem', { lineHeight: '1.5rem' }],         // 16px
        'md': ['1.0625rem', { lineHeight: '1.625rem' }],    // 17px
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],      // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],       // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],          // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],     // 30px
        '4xl': ['2.25rem', { lineHeight: '2.625rem' }],     // 36px
        'display': ['clamp(1.75rem, 2.5vw + 0.5rem, 2.5rem)', { lineHeight: '1.2' }],
        'title': ['clamp(1.35rem, 1.8vw + 0.4rem, 1.85rem)', { lineHeight: '1.3' }],
        'section': ['clamp(1.15rem, 1.2vw + 0.4rem, 1.45rem)', { lineHeight: '1.4' }],
      },
      fontFamily: {
        sans: [
          '"Inter"',
          "var(--font-sf-pro)",
          '"SF Pro Display"',
          '"SF Pro Text"',
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        heading: [
          '"Inter"',
          "var(--font-sf-pro)",
          '"SF Pro Display"',
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          '"SF Mono"',
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      animation: {
        "fade-in": "fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-up": "fadeUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-in-right": "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
