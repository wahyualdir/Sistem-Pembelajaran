import React from 'react';

/**
 * Ilustrasi Garis Peta Pulau (3 Pulau Berurutan)
 * Menampilkan 3 pulau yang dihubungkan jalur putus-putus:
 * 1. Selesai (telah diselesaikan)
 * 2. Sedang dipelajari (tahap aktif)
 * 3. Terkunci (belum terbuka)
 * Menggunakan gaya garis bersih (line art), tanpa gradien, tanpa bayangan, tanpa kaca buram.
 */
export function IslandIllustration() {
  return (
    <div className="w-full max-w-[460px] py-4" aria-hidden="true">
      <svg
        viewBox="0 0 460 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
      >
        {/* Jalur Penghubung 1 ke 2 (Garis Putus-Putus) */}
        <path
          d="M 112 56 C 145 42, 180 70, 208 56"
          stroke="#D9E3DC"
          strokeWidth="2"
          strokeDasharray="6 6"
          strokeLinecap="round"
        />

        {/* Jalur Penghubung 2 ke 3 (Garis Putus-Putus) */}
        <path
          d="M 272 56 C 305 42, 340 70, 368 56"
          stroke="#D9E3DC"
          strokeWidth="2"
          strokeDasharray="6 6"
          strokeLinecap="round"
        />

        {/* --- PULAU 1: SELESAI --- */}
        <g transform="translate(16, 12)">
          {/* Kontur Garis Pulau */}
          <path
            d="M 18 44 C 18 24, 38 18, 52 18 C 68 18, 86 26, 86 44 C 86 64, 68 70, 52 70 C 34 70, 18 64, 18 44 Z"
            stroke="#D9E3DC"
            strokeWidth="1.5"
            fill="none"
          />
          {/* Node Lingkaran Selesai dengan Tanda Centang */}
          <circle cx="52" cy="44" r="14" stroke="#D9E3DC" strokeWidth="2" fill="#1E4638" />
          <path
            d="M 46 44 L 50 48 L 58 40"
            stroke="#D9E3DC"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Label Teks */}
          <text
            x="52"
            y="96"
            textAnchor="middle"
            fill="#D9E3DC"
            fontSize="13"
            fontWeight="600"
            fontFamily="inherit"
          >
            Selesai
          </text>
        </g>

        {/* --- PULAU 2: SEDANG DIPELAJARI --- */}
        <g transform="translate(176, 12)">
          {/* Kontur Garis Pulau Aktif */}
          <path
            d="M 16 44 C 16 22, 38 16, 54 16 C 72 16, 92 24, 92 44 C 92 66, 72 72, 54 72 C 34 72, 16 66, 16 44 Z"
            stroke="#F6F2EA"
            strokeWidth="2"
            fill="none"
          />
          {/* Node Lingkaran Aktif */}
          <circle cx="54" cy="44" r="16" stroke="#F6F2EA" strokeWidth="2.5" fill="#1E4638" />
          <circle cx="54" cy="44" r="6" fill="#F6F2EA" />
          {/* Label Teks */}
          <text
            x="54"
            y="96"
            textAnchor="middle"
            fill="#F6F2EA"
            fontSize="13"
            fontWeight="700"
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
            stroke="#D9E3DC"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            fill="none"
          />
          {/* Node Lingkaran dengan Ikon Gembok Garis */}
          <circle cx="52" cy="44" r="14" stroke="#D9E3DC" strokeWidth="2" fill="#1E4638" />
          {/* Gembok Garis Minimalis */}
          <rect
            x="46"
            y="42"
            width="12"
            height="9"
            rx="2"
            stroke="#D9E3DC"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M 48 42 V 38 C 48 35.8 49.8 34 52 34 C 54.2 34 56 35.8 56 38 V 42"
            stroke="#D9E3DC"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Label Teks */}
          <text
            x="52"
            y="96"
            textAnchor="middle"
            fill="#D9E3DC"
            fontSize="13"
            fontWeight="500"
            fontFamily="inherit"
          >
            Terkunci
          </text>
        </g>
      </svg>
    </div>
  );
}
