import React from 'react';
import { cn } from '@/lib/utils';
import { WindowTrafficLights } from './window-traffic-lights';

interface RetroWindowProps {
  title?: string;
  badge?: string;
  subtitle?: string;
  headerBadge?: string;
  headerBadgeVariant?: string;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function RetroWindow({
  title = 'ui_window.app',
  badge,
  subtitle,
  headerBadge,
  headerBadgeVariant: _variant,
  className,
  headerClassName,
  bodyClassName,
  children,
  actions,
}: RetroWindowProps) {
  const displayBadge = headerBadge || badge;

  return (
    <div
      className={cn(
        'rounded-none sm:rounded-[3px] border-2 border-black bg-retro-surface shadow-retro-md sm:shadow-retro-window overflow-hidden transition-all',
        className
      )}
    >
      {/* Window Header Bar with Retro Mac Circles */}
      <div
        className={cn(
          'flex h-11 sm:h-12 items-center justify-between border-b-2 border-black bg-gray-soft px-3 sm:px-4',
          headerClassName
        )}
      >
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          {/* Retro Window Dot Controls (Merah Kampus, Abu-abu, Abu Gelap) */}
          <WindowTrafficLights size="sm" />

          <div className="ml-1 sm:ml-2 flex items-center gap-2 min-w-0">
            <span className="text-sm sm:text-base font-bold text-black tracking-tight font-heading truncate">
              {title}
            </span>
            {displayBadge && (
              <span className="rounded-sm border border-black bg-retro-surface px-2 py-0.5 text-xs font-bold font-sans text-black shadow-retro-sm shrink-0">
                {displayBadge}
              </span>
            )}
          </div>
        </div>

        {actions && <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-black shrink-0 ml-2">{actions}</div>}
      </div>

      {/* Window Body */}
      <div className={cn('p-4 sm:p-6 lg:p-7', bodyClassName)}>{children}</div>
    </div>
  );
}
