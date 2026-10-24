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
  title,
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
  const hasHeader = Boolean(title || displayBadge || actions);

  // Clean up any archaic dot-suffixes in title for human-readable polish
  const cleanTitle = title
    ? title.replace(/\.(card|view|window|panel)$/i, '').replace(/_/g, ' ')
    : title;

  return (
    <section
      className={cn(
        'rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] shadow-sm overflow-hidden transition-all duration-150',
        className
      )}
    >
      {hasHeader && (
        <div
          className={cn(
            'flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-[#E2E3E4] bg-[#FFFFFF]',
            headerClassName
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {cleanTitle && (
              <h3 className="font-heading text-sm sm:text-base font-bold tracking-tight text-[#111111] capitalize truncate">
                {cleanTitle}
              </h3>
            )}
            {displayBadge && (
              <span className="font-sans text-[11px] font-bold bg-[#FEF2F2] text-[#9F1521] border border-[#FDDDD7] px-2.5 py-0.5 rounded-full shrink-0">
                {displayBadge}
              </span>
            )}
            {subtitle && (
              <span className="hidden md:inline text-xs text-[#808285] font-normal truncate">
                — {subtitle}
              </span>
            )}
          </div>

          {actions && (
            <div className="flex items-center gap-2 text-xs font-semibold text-[#111111] shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}

      <div className={cn('p-5 sm:p-6 bg-[#FFFFFF] text-[#111111]', bodyClassName)}>
        {children}
      </div>
    </section>
  );
}
