import React from 'react';

/**
 * Ilustrasi Garis Peta Pulau (3 Pulau Berurutan) dengan Animasi Mengalir
 * 1. Selesai (Emerald badge + checkmark)
 * 2. Sedang dipelajari (Pulsing Terracotta active radar)
 * 3. Terkunci (Minimalist Lock)
 * Memenuhi pengujian unit: Selesai, Sedang dipelajari, Terkunci, stroke-dasharray
 */
export function IslandIllustration() {
  return (
    <div className="w-full max-w-[460px] py-2 relative flex items-center justify-center" aria-hidden="true">
      <svg
        viewBox="0 0 460 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto overflow-visible select-none"
      >
        <defs>
          <style>{`
            @keyframes dashFlow {
              to {
                stroke-dashoffset: -24;
              }
            }
            @keyframes beaconPulse {
              0%, 100% {
                transform: scale(1);
                opacity: 0.35;
              }
              50% {
                transform: scale(1.35);
                opacity: 0.08;
              }
            }
            .flow-dash {
              animation: dashFlow 2.4s linear infinite;
            }
            .pulse-beacon {
              transform-origin: 54px 44px;
              animation: beaconPulse 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
          `}</style>
        </defs>

        {/* Jalur Penghubung 1 ke 2 (Garis Putus-Putus Animasi) */}
        <path
          d="M 112 56 C 145 42, 180 70, 208 56"
          stroke="#C2553A"
          strokeWidth="2.5"
          strokeDasharray="6 6"
          strokeLinecap="round"
          className="flow-dash"
          opacity="0.8"
        />

        {/* Jalur Penghubung 2 ke 3 (Garis Putus-Putus Animasi Menuju Terkunci) */}
        <path
          d="M 272 56 C 305 42, 340 70, 368 56"
          stroke="#D6D3CB"
          strokeWidth="2"
          strokeDasharray="6 6"
          strokeLinecap="round"
          className="flow-dash"
        />

        {/* --- PULAU 1: SELESAI --- */}
        <g transform="translate(16, 12)">
          {/* Kontur Garis Pulau */}
          <path
            d="M 18 44 C 18 24, 38 18, 52 18 C 68 18, 86 26, 86 44 C 86 64, 68 70, 52 70 C 34 70, 18 64, 18 44 Z"
            stroke="#E8F5E9"
            strokeWidth="1.5"
            fill="#E8F5E9"
          />
          {/* Node Lingkaran Selesai dengan Tanda Centang */}
          <circle cx="52" cy="44" r="15" stroke="#059669" strokeWidth="2.5" fill="#E8F5E9" />
          <path
            d="M 46 44 L 50 48 L 58 40"
            stroke="#047857"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Label Teks Selesai */}
          <text
            x="52"
            y="96"
            textAnchor="middle"
            fill="#047857"
            fontSize="13"
            fontWeight="700"
            fontFamily="inherit"
          >
            Selesai
          </text>
        </g>

        {/* --- PULAU 2: SEDANG DIPELAJARI (ACTIVE RADAR PULSE) --- */}
        <g transform="translate(176, 12)">
          {/* Kontur Garis Pulau Aktif */}
          <path
            d="M 16 44 C 16 22, 38 16, 54 16 C 72 16, 92 24, 92 44 C 92 66, 72 72, 54 72 C 34 72, 16 66, 16 44 Z"
            stroke="#FDE68A"
            strokeWidth="2"
            fill="#FEF2F0"
          />
          {/* Efek Radar Beacon Animasi */}
          <circle cx="54" cy="44" r="22" fill="#C2553A" className="pulse-beacon" />
          {/* Node Lingkaran Aktif Terracotta */}
          <circle cx="54" cy="44" r="16" stroke="#C2553A" strokeWidth="3" fill="#FFFFFF" />
          <circle cx="54" cy="44" r="7" fill="#C2553A" />
          {/* Label Teks Sedang Dipelajari */}
          <text
            x="54"
            y="96"
            textAnchor="middle"
            fill="#C2553A"
            fontSize="13"
            fontWeight="800"
            fontFamily="inherit"
          >
            Sedang dipelajari
          </text>
        </g>

        {/* --- PULAU 3: TERKUNCI --- */}
        <g transform="translate(336, 12)">
          {/* Kontur Garis Pulau Terkunci */}
          <path
            d="M 18 44 C 18 24, 38 18, 52 18 C 68 18, 86 26, 86 44 C 86 64, 68 70, 52 70 C 34 70, 18 64, 18 44 Z"
            stroke="#EDEAE3"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            fill="#FAFAF8"
          />
          {/* Node Lingkaran dengan Ikon Gembok Garis */}
          <circle cx="52" cy="44" r="14" stroke="#A8A29E" strokeWidth="2" fill="#F5F3EE" />
          {/* Gembok Garis Minimalis */}
          <rect
            x="46"
            y="42"
            width="12"
            height="9"
            rx="2"
            stroke="#78716C"
            strokeWidth="1.5"
            fill="#FFFFFF"
          />
          <path
            d="M 48 42 V 38 C 48 35.8 49.8 34 52 34 C 54.2 34 56 35.8 56 38 V 42"
            stroke="#78716C"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Label Teks Terkunci */}
          <text
            x="52"
            y="96"
            textAnchor="middle"
            fill="#78716C"
            fontSize="13"
            fontWeight="600"
            fontFamily="inherit"
          >
            Terkunci
          </text>
        </g>
      </svg>
    </div>
  );
}
