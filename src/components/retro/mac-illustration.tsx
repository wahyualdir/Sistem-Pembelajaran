import React from 'react';

export function MacIllustration({ className = 'w-full max-w-[380px] h-auto' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Retro Macintosh illustration with cartoon eyeball and bezier pen"
    >
      {/* Decorative floating bubbles & stipple particles */}
      <circle cx="230" cy="90" r="4.5" fill="black" />
      <circle cx="245" cy="108" r="3" fill="black" />
      <circle cx="218" cy="115" r="2" fill="black" />
      <circle cx="282" cy="100" r="3.5" fill="black" />
      <circle cx="370" cy="95" r="4" fill="black" />
      <circle cx="395" cy="115" r="3" fill="black" />
      <circle cx="380" cy="130" r="2.5" fill="black" />

      {/* Vector Bezier Pen Tool (on the left hand) */}
      <g id="pen-tool">
        {/* Pen Nib */}
        <path
          d="M242 42 L256 68 L244 80 L230 68 Z"
          fill="white"
          stroke="black"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Pen Breather Hole & Split */}
        <circle cx="243" cy="62" r="2.5" fill="black" />
        <line x1="243" y1="42" x2="243" y2="60" stroke="black" strokeWidth="2.5" />

        {/* Pen Shaft & Body */}
        <path
          d="M230 68 L218 175 L248 175 L256 68 Z"
          fill="white"
          stroke="black"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Shaft details / grip lines */}
        <line x1="225" y1="95" x2="251" y2="95" stroke="black" strokeWidth="2.5" />
        <line x1="223" y1="110" x2="249" y2="110" stroke="black" strokeWidth="2.5" />
        <line x1="221" y1="125" x2="247" y2="125" stroke="black" strokeWidth="2.5" />
        <line x1="220" y1="140" x2="246" y2="140" stroke="black" strokeWidth="2.5" />
        <line x1="219" y1="155" x2="247" y2="155" stroke="black" strokeWidth="2.5" />
      </g>

      {/* Cartoon Hand gripping the pen */}
      <g id="cartoon-hand">
        {/* Arm / Wrist */}
        <path
          d="M222 250 L224 220 C224 210 220 195 215 190"
          stroke="black"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M256 250 L254 220 C254 205 258 190 260 185"
          stroke="black"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Fingers wrapping around pen */}
        {/* Finger 1 (top) */}
        <path
          d="M214 180 C214 172 225 170 236 172 C244 173 248 178 248 184 C248 189 240 192 232 192 C222 192 214 187 214 180 Z"
          fill="white"
          stroke="black"
          strokeWidth="3"
        />
        {/* Finger 2 */}
        <path
          d="M213 192 C213 186 222 184 234 185 C244 186 248 191 248 196 C248 202 240 205 230 205 C220 205 213 200 213 192 Z"
          fill="white"
          stroke="black"
          strokeWidth="3"
        />
        {/* Finger 3 */}
        <path
          d="M213 204 C213 198 222 197 232 198 C242 199 246 204 246 209 C246 215 238 217 228 217 C218 217 213 212 213 204 Z"
          fill="white"
          stroke="black"
          strokeWidth="3"
        />
        {/* Finger 4 (bottom) */}
        <path
          d="M214 216 C214 211 222 210 230 211 C240 212 244 216 244 221 C244 226 236 229 226 229 C216 229 214 224 214 216 Z"
          fill="white"
          stroke="black"
          strokeWidth="3"
        />
        {/* Thumb */}
        <path
          d="M250 178 C256 182 262 188 260 196 C258 204 250 206 244 204"
          fill="white"
          stroke="black"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>

      {/* Classic Macintosh Computer Body */}
      <g id="mac-computer">
        {/* Main Beveled Case */}
        <path
          d="M265 125 C265 118 271 112 278 112 L358 112 C365 112 371 118 371 125 L373 238 C373 244 368 248 362 248 L274 248 C268 248 263 244 263 238 Z"
          fill="white"
          stroke="black"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* 3D Depth / Right Shadow Edge of Mac */}
        <path
          d="M371 122 L388 135 L390 238 L373 242"
          fill="var(--retro-warm)"
          stroke="black"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Shadow hatching on side panel */}
        <line x1="375" y1="145" x2="385" y2="152" stroke="black" strokeWidth="2" />
        <line x1="375" y1="160" x2="386" y2="167" stroke="black" strokeWidth="2" />
        <line x1="376" y1="175" x2="387" y2="182" stroke="black" strokeWidth="2" />
        <line x1="376" y1="190" x2="387" y2="197" stroke="black" strokeWidth="2" />
        <line x1="376" y1="205" x2="388" y2="212" stroke="black" strokeWidth="2" />
        <line x1="376" y1="220" x2="388" y2="227" stroke="black" strokeWidth="2" />

        {/* CRT Screen Bezel (Recessed) */}
        <rect
          x="278"
          y="126"
          width="80"
          height="76"
          rx="12"
          fill="white"
          stroke="black"
          strokeWidth="3"
        />

        {/* CRT Screen Inner Surface (Dark screen) */}
        <rect
          x="284"
          y="132"
          width="68"
          height="64"
          rx="8"
          fill="black"
        />

        {/* Mac Character Inside Screen: The Smiling Eyeball Face */}
        {/* Big White Eyeball */}
        <circle cx="318" cy="158" r="20" fill="white" />
        {/* Pupil */}
        <circle cx="318" cy="158" r="11" fill="black" />
        {/* Eyeball Highlight */}
        <circle cx="314" cy="154" r="3.5" fill="white" />
        {/* Eyebrow / Eyelid Arc */}
        <path
          d="M302 143 C312 138 324 138 334 143"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Smiling Mouth */}
        <path
          d="M304 183 C312 191 324 191 332 183"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Lower Front Panel of Mac */}
        {/* Floppy Disk Slot */}
        <rect
          x="320"
          y="218"
          width="40"
          height="4.5"
          rx="1.5"
          fill="black"
        />
        {/* Floppy drive notch */}
        <rect
          x="335"
          y="224"
          width="10"
          height="2"
          fill="black"
        />

        {/* Apple Logo Indent Box (left side) */}
        <rect
          x="276"
          y="217"
          width="8"
          height="9"
          rx="1"
          fill="white"
          stroke="black"
          strokeWidth="2"
        />

        {/* Mac Base Pedestal */}
        <path
          d="M258 248 L376 248 L384 258 L250 258 Z"
          fill="white"
          stroke="black"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* Keyboard in front */}
        <path
          d="M252 254 L366 254 L358 266 L260 266 Z"
          fill="white"
          stroke="black"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Key rows on keyboard */}
        <line x1="266" y1="258" x2="352" y2="258" stroke="black" strokeWidth="1.5" />
        <line x1="264" y1="262" x2="354" y2="262" stroke="black" strokeWidth="1.5" />

        {/* Mouse and coiled cable */}
        <path
          d="M388 238 C405 230 410 200 404 185 C398 170 380 180 375 195 C370 210 395 240 400 255"
          fill="none"
          stroke="black"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
