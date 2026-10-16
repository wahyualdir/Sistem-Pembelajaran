import React from 'react';
import { cn } from '@/lib/utils';

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
          'flex h-11 sm:h-12 items-center justify-between border-b-2 border-black bg-retro-warm px-3 sm:px-4',
          headerClassName
        )}
      >
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          {/* Mac Traffic Light Buttons (Merah, Kuning, Hijau) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border border-black bg-traffic-red inline-block shadow-retro-sm" />
            <span className="h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border border-black bg-traffic-yellow inline-block shadow-retro-sm" />
            <span className="h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border border-black bg-traffic-green inline-block shadow-retro-sm" />
          </div>

          <div className="ml-1 sm:ml-2 flex items-center gap-2 min-w-0">
            <span className="text-sm sm:text-base font-black text-black tracking-tight font-heading truncate">
              {title}
            </span>
            {displayBadge && (
              <span className="rounded-sm border border-black bg-retro-surface px-2 py-0.5 text-xs font-black font-mono text-black shadow-retro-sm shrink-0">
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
