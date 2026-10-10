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
        'rounded-none sm:rounded-[3px] border-2 border-black bg-white shadow-[4px_4px_0px_#000000] sm:shadow-[6px_6px_0px_#000000] overflow-hidden transition-all',
        className
      )}
    >
      {/* Window Header Bar with Retro Mac Circles */}
      <div
        className={cn(
          'flex h-11 sm:h-13 items-center justify-between border-b-2 border-black bg-retro-warm px-3 sm:px-4 py-2',
          headerClassName
        )}
      >
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          {/* Mac Traffic Light Buttons (Merah, Kuning, Hijau) */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <span className="h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border border-black bg-[#FF5F56] inline-block shadow-[0.5px_0.5px_0px_#000]" />
            <span className="h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border border-black bg-[#FFBD2E] inline-block shadow-[0.5px_0.5px_0px_#000]" />
            <span className="h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border border-black bg-[#27C93F] inline-block shadow-[0.5px_0.5px_0px_#000]" />
          </div>

          <div className="ml-1 sm:ml-2 flex flex-col min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm sm:text-base lg:text-lg font-black text-black tracking-tight font-heading truncate">
                {title}
              </span>
              {displayBadge && (
                <span className="rounded-sm border border-black sm:border-2 bg-white px-2 py-0.5 sm:px-3 text-[11px] sm:text-xs lg:text-sm font-black font-mono text-black shadow-[1px_1px_0px_#000] sm:shadow-[1.5px_1.5px_0px_#000] shrink-0 hidden xs:inline-block">
                  {displayBadge}
                </span>
              )}
            </div>
            {subtitle && (
              <span className="text-[11px] font-medium text-black/70 truncate hidden sm:block">
                {subtitle}
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
