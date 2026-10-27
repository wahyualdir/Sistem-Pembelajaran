'use client';

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { SkyPhase } from './sky-clock-widget';

interface SkyShaderCanvasProps {
  phase: SkyPhase;
  className?: string;
}

const VERTEX_SHADER_SRC = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SRC = `
precision highp float;

varying vec2 v_uv;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_phase; // 0.0: DAWN, 1.0: DAY, 2.0: SUNSET, 3.0: NIGHT

// Fast 2D Hash
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// 2D Value Noise with Hermite interpolation
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// 5-Octave Fractal Brownian Motion (fBm) for organic clouds
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < 5; ++i) {
    v += a * noise(p);
    p = rot * p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

// Procedural stars for night
float stars(vec2 uv) {
  vec2 grid = floor(uv * 120.0);
  float h = hash(grid);
  if (h > 0.984) {
    vec2 p = fract(uv * 120.0) - 0.5;
    float dist = length(p);
    float twinkle = sin(u_time * 2.5 + h * 6.28) * 0.5 + 0.5;
    return smoothstep(0.12, 0.01, dist) * twinkle;
  }
  return 0.0;
}

void main() {
  vec2 uv = v_uv;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

  vec3 col = vec3(0.0);

  // ==========================================
  // 1. DAWN (FAJAR LEMBUT KEEMASAN & VIOLET)
  // ==========================================
  if (u_phase < 0.5) {
    vec3 skyZenith = vec3(0.12, 0.10, 0.28);  // Indigo fajar
    vec3 skyMid = vec3(0.48, 0.18, 0.38);     // Lavender magenta
    vec3 skyHorizon = vec3(0.96, 0.62, 0.28); // Peach keemasan
    
    col = mix(skyHorizon, skyMid, smoothstep(0.0, 0.55, uv.y));
    col = mix(col, skyZenith, smoothstep(0.45, 1.0, uv.y));

    // Matahari fajar
    vec2 sunPos = vec2(0.5, 0.52);
    float sunDist = length((uv - sunPos) * vec2(aspect, 1.0));
    
    // Pendar lembut fajar
    float sunDisc = smoothstep(0.07, 0.055, sunDist);
    float sunGlow = exp(-sunDist * 4.0) * 0.75;
    col += vec3(1.0, 0.85, 0.5) * (sunDisc * 0.8 + sunGlow);

    // Volumetric God Rays
    vec2 rayDelta = uv - sunPos;
    float rayAngle = atan(rayDelta.y, rayDelta.x);
    float rays = sin(rayAngle * 12.0 + u_time * 0.3) * 0.5 + 0.5;
    rays *= smoothstep(0.75, 0.08, length(rayDelta));
    col += vec3(1.0, 0.88, 0.6) * (rays * 0.12);

    // Awan fajar lembut
    vec2 cloudUV = uv * vec2(1.8, 1.4);
    cloudUV.x += u_time * 0.012;
    float cNoise = fbm(cloudUV);
    float cloud = smoothstep(0.46, 0.82, cNoise);
    vec3 cloudCol = mix(vec3(0.85, 0.55, 0.5), vec3(1.0, 0.92, 0.8), smoothstep(0.46, 0.78, cNoise));
    col = mix(col, cloudCol, cloud * 0.35);
  }
  // ==========================================
  // 2. DAY (SIANG BIRU ALAMI & BERAWAN)
  // ==========================================
  else if (u_phase < 1.5) {
    vec3 skyZenith = vec3(0.06, 0.46, 0.82);  // Biru langit jernih
    vec3 skyMid = vec3(0.24, 0.66, 0.94);     // Biru cerah
    vec3 skyHorizon = vec3(0.68, 0.86, 0.98); // Biru muda cakrawala
    
    col = mix(skyHorizon, skyMid, smoothstep(0.0, 0.6, uv.y));
    col = mix(col, skyZenith, smoothstep(0.5, 1.0, uv.y));

    // Matahari siang
    vec2 sunPos = vec2(0.5, 0.65);
    float sunDist = length((uv - sunPos) * vec2(aspect, 1.0));

    // Pendar alami matahari (tidak menyilaukan berlebihan)
    float sunDisc = smoothstep(0.075, 0.06, sunDist);
    float sunGlow = exp(-sunDist * 3.8) * 0.75;
    col += vec3(1.0, 0.98, 0.9) * (sunDisc * 0.95 + sunGlow * 0.8);

    // God Rays lembut
    vec2 rayDelta = uv - sunPos;
    float rayAngle = atan(rayDelta.y, rayDelta.x);
    float rays = sin(rayAngle * 14.0 + u_time * 0.35) * 0.5 + 0.5;
    rays *= smoothstep(0.75, 0.05, length(rayDelta));
    col += vec3(1.0, 1.0, 0.92) * (rays * 0.12);

    // Awan cumulus shader yang mengalir alami
    vec2 cloudUV = uv * vec2(2.0, 1.5);
    cloudUV.x += u_time * 0.016;
    float cNoise = fbm(cloudUV);
    float cloud = smoothstep(0.48, 0.84, cNoise);
    vec3 cloudCol = mix(vec3(0.9, 0.94, 0.98), vec3(1.0, 1.0, 1.0), smoothstep(0.48, 0.82, cNoise));
    col = mix(col, cloudCol, cloud * 0.45);
  }
  // ==========================================
  // 3. SUNSET (SENJA JINGGA-LEMBAYUNG HANGAT)
  // ==========================================
  else if (u_phase < 2.5) {
    vec3 skyZenith = vec3(0.12, 0.08, 0.26);  // Ungu senja
    vec3 skyMid = vec3(0.52, 0.14, 0.32);     // Wine magenta
    vec3 skyLow = vec3(0.85, 0.28, 0.14);     // Oranye merah
    vec3 skyHorizon = vec3(0.98, 0.68, 0.22); // Emas hangat
    
    col = mix(skyHorizon, skyLow, smoothstep(0.0, 0.35, uv.y));
    col = mix(col, skyMid, smoothstep(0.3, 0.7, uv.y));
    col = mix(col, skyZenith, smoothstep(0.65, 1.0, uv.y));

    // Matahari senja rendah
    vec2 sunPos = vec2(0.5, 0.48);
    float sunDist = length((uv - sunPos) * vec2(aspect, 1.0));
    
    float sunDisc = smoothstep(0.08, 0.065, sunDist);
    float sunGlow = exp(-sunDist * 3.5) * 0.85;
    col += vec3(1.0, 0.65, 0.25) * (sunDisc * 0.9 + sunGlow);

    // God Rays senja hangat
    vec2 rayDelta = uv - sunPos;
    float rayAngle = atan(rayDelta.y, rayDelta.x);
    float rays = sin(rayAngle * 12.0 + u_time * 0.3) * 0.5 + 0.5;
    rays *= smoothstep(0.8, 0.08, length(rayDelta));
    col += vec3(1.0, 0.55, 0.2) * (rays * 0.16);

    // Awan senja disinari cahaya keemasan
    vec2 cloudUV = uv * vec2(1.8, 1.4);
    cloudUV.x += u_time * 0.014;
    float cNoise = fbm(cloudUV);
    float cloud = smoothstep(0.46, 0.82, cNoise);
    vec3 cloudCol = mix(vec3(0.55, 0.15, 0.3), vec3(1.0, 0.78, 0.4), smoothstep(0.46, 0.78, cNoise));
    col = mix(col, cloudCol, cloud * 0.4);
  }
  // ==========================================
  // 4. NIGHT (MALAM INDIGO, AURORA & BINTANG)
  // ==========================================
  else {
    vec3 skyZenith = vec3(0.02, 0.03, 0.09);  // Hitam indigo pekat
    vec3 skyMid = vec3(0.05, 0.08, 0.19);     // Midnight navy
    vec3 skyHorizon = vec3(0.10, 0.15, 0.30); // Indigo cakrawala
    
    col = mix(skyHorizon, skyMid, smoothstep(0.0, 0.6, uv.y));
    col = mix(col, skyZenith, smoothstep(0.5, 1.0, uv.y));

    // Aurora Borealis Shader (Gelombang hijau-zamrud halus)
    float wave1 = sin(uv.x * 5.0 + u_time * 0.35) * 0.09;
    float wave2 = cos(uv.x * 8.0 - u_time * 0.2) * 0.04;
    float auroraCenter = 0.68 + wave1 + wave2;
    float auroraDist = abs(uv.y - auroraCenter);
    float aurora = smoothstep(0.18, 0.01, auroraDist);
    
    float auroraFbm = fbm(vec2(uv.x * 3.5 + u_time * 0.12, uv.y * 3.0));
    aurora *= (auroraFbm * 0.7 + 0.3);

    vec3 auroraCol = mix(vec3(0.1, 0.88, 0.6), vec3(0.65, 0.28, 0.9), sin(uv.x * 2.5 + u_time * 0.15) * 0.5 + 0.5);
    col += auroraCol * (aurora * 0.35);

    // Gugusan bintang berkerlip halus
    col += vec3(0.95, 0.98, 1.0) * stars(uv);

    // Bulan malam anggun
    vec2 moonPos = vec2(0.5, 0.65);
    float moonDist = length((uv - moonPos) * vec2(aspect, 1.0));
    
    float moonDisc = smoothstep(0.065, 0.055, moonDist);
    float moonHalo = exp(-moonDist * 4.0) * 0.5;
    col += vec3(0.92, 0.95, 1.0) * (moonDisc * 0.95) + vec3(0.6, 0.75, 1.0) * moonHalo;

    // Awan malam tipis
    vec2 cloudUV = uv * vec2(1.8, 1.4);
    cloudUV.x += u_time * 0.01;
    float cNoise = fbm(cloudUV);
    float cloud = smoothstep(0.52, 0.86, cNoise);
    col = mix(col, vec3(0.06, 0.09, 0.20), cloud * 0.3);
  }

  // Atmospheric Vignette halus
  float vignette = smoothstep(1.3, 0.25, length(p));
  col *= (vignette * 0.12 + 0.88);

  gl_FragColor = vec4(col, 1.0);
}
`;

export function SkyShaderCanvas({ phase, className }: SkyShaderCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      (canvas.getContext('webgl', { alpha: false, antialias: true }) as WebGLRenderingContext | null) ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);

    if (!gl) {
      setWebglSupported(false);
      return;
    }

    function createShader(glCtx: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
      const shader = glCtx.createShader(type);
      if (!shader) return null;
      glCtx.shaderSource(shader, src);
      glCtx.compileShader(shader);
      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        glCtx.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fragShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);

    if (!vertShader || !fragShader) {
      setWebglSupported(false);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      setWebglSupported(false);
      return;
    }

    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setWebglSupported(false);
      return;
    }

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0,
      ]),
      gl.STATIC_DRAW
    );

    const posLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLocation);
    gl.vertexAttribPointer(posLocation, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uPhase = gl.getUniformLocation(program, 'u_phase');

    function resizeCanvas() {
      if (!canvas || !gl) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = canvas.clientWidth * dpr;
      const height = canvas.clientHeight * dpr;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const isMotionOff =
      typeof window !== 'undefined' &&
      (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        document.documentElement.getAttribute('data-motion') === 'mati' ||
        document.documentElement.classList.contains('lite-performance-mode'));

    let currentPhaseVal = phase === 'DAWN' ? 0.0 : phase === 'DAY' ? 1.0 : phase === 'SUNSET' ? 2.0 : 3.0;
    let animId: number;
    let startTime = performance.now();
    let isIntersecting = true;

    function render() {
      if (!gl || !canvas) return;

      const targetVal = phase === 'DAWN' ? 0.0 : phase === 'DAY' ? 1.0 : phase === 'SUNSET' ? 2.0 : 3.0;
      currentPhaseVal += (targetVal - currentPhaseVal) * 0.06;

      const elapsed = (performance.now() - startTime) / 1000.0;

      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, elapsed);
      gl.uniform1f(uPhase, currentPhaseVal);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      if (!isMotionOff && isIntersecting && !document.hidden) {
        animId = requestAnimationFrame(render);
      }
    }

    // IntersectionObserver to pause offscreen (5.4.7)
    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(([entry]) => {
        isIntersecting = entry.isIntersecting;
        if (isIntersecting && !document.hidden && !isMotionOff) {
          animId = requestAnimationFrame(render);
        }
      });
      observer.observe(canvas);
    }

    // Visibility change to pause on background tab (5.4.7)
    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(animId);
      } else if (isIntersecting && !isMotionOff) {
        animId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (observer) observer.disconnect();
      if (gl) {
        gl.deleteProgram(program);
        gl.deleteShader(vertShader);
        gl.deleteShader(fragShader);
        gl.deleteBuffer(positionBuffer);
      }
    };
  }, [phase]);

  if (!webglSupported) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className={cn('absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-1000', className)}
    />
  );
}
