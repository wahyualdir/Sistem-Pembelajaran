import React from 'react';
import { cn } from '@/lib/utils';

export interface WindowTrafficLightsProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  interactive?: boolean;
}

export function WindowTrafficLights({
  size = 'md',
  className,
  onClose,
  onMinimize,
  onMaximize,
  interactive = true,
}: WindowTrafficLightsProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  }[size];

  const glyphTextSize = {
    sm: 'text-[7px]',
    md: 'text-[8px]',
    lg: 'text-[9px]',
  }[size];

  const glareSizes = {
    sm: 'top-[1px] left-[1.5px] w-[4px] h-[2px]',
    md: 'top-[1px] left-[2px] w-[5px] h-[2.5px]',
    lg: 'top-[1.5px] left-[2px] w-[6px] h-[3px]',
  }[size];

  return (
    <div className={cn('flex items-center gap-1.5 sm:gap-2 group/dots shrink-0 select-none', className)}>
      {/* Red / Tutup */}
      <span
        onClick={onClose}
        className={cn(
          'relative rounded-full border border-[#B31E17]/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.85),0_1px_2px_rgba(0,0,0,0.3)] flex items-center justify-center transition-all duration-150',
          sizeClasses,
          interactive && 'hover:scale-115 active:scale-95 cursor-pointer'
        )}
        style={{
          background: 'radial-gradient(circle at 35% 28%, #FF7F78 0%, #FF5F56 45%, #D42820 100%)',
        }}
        title="Tutup"
        role={onClose ? 'button' : undefined}
      >
        <span className={cn('absolute rounded-full bg-white/90 pointer-events-none blur-[0.2px]', glareSizes)} />
        {interactive && (
          <span className={cn('opacity-0 group-hover/dots:opacity-85 transition-opacity font-black text-[#500000] leading-none select-none', glyphTextSize)}>
            ✕
          </span>
        )}
      </span>

      {/* Yellow / Minimalkan */}
      <span
        onClick={onMinimize}
        className={cn(
          'relative rounded-full border border-[#B87A00]/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.3)] flex items-center justify-center transition-all duration-150',
          sizeClasses,
          interactive && 'hover:scale-115 active:scale-95 cursor-pointer'
        )}
        style={{
          background: 'radial-gradient(circle at 35% 28%, #FFE270 0%, #FFBD2E 45%, #D9950A 100%)',
        }}
        title="Minimalkan"
        role={onMinimize ? 'button' : undefined}
      >
        <span className={cn('absolute rounded-full bg-white/90 pointer-events-none blur-[0.2px]', glareSizes)} />
        {interactive && (
          <span className={cn('opacity-0 group-hover/dots:opacity-85 transition-opacity font-black text-[#5B3F00] leading-none select-none -translate-y-px', glyphTextSize)}>
            –
          </span>
        )}
      </span>

      {/* Green / Perbesar */}
      <span
        onClick={onMaximize}
        className={cn(
          'relative rounded-full border border-[#118022]/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.85),0_1px_2px_rgba(0,0,0,0.3)] flex items-center justify-center transition-all duration-150',
          sizeClasses,
          interactive && 'hover:scale-115 active:scale-95 cursor-pointer'
        )}
        style={{
          background: 'radial-gradient(circle at 35% 28%, #57E86F 0%, #27C93F 45%, #189E2D 100%)',
        }}
        title="Perbesar"
        role={onMaximize ? 'button' : undefined}
      >
        <span className={cn('absolute rounded-full bg-white/90 pointer-events-none blur-[0.2px]', glareSizes)} />
        {interactive && (
          <span className={cn('opacity-0 group-hover/dots:opacity-85 transition-opacity font-black text-[#04440B] leading-none select-none', glyphTextSize)}>
            +
          </span>
        )}
      </span>
    </div>
  );
}
