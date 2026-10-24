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

  return (
    <section
      className={cn(
        'rounded-2xl border border-[#E8E5DE] bg-[#FFFFFF] overflow-hidden transition-all duration-150',
        className
      )}
    >
      {hasHeader && (
        <div
          className={cn(
            'flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-[#E8E5DE] bg-[#FAF8F5]/60',
            headerClassName
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {title && (
              <h3 className="font-heading text-sm sm:text-base font-bold tracking-tight text-[#1C1917] truncate">
                {title}
              </h3>
            )}
            {displayBadge && (
              <span className="font-sans text-[11px] font-semibold bg-[#F2EFE8] text-[#57534E] border border-[#D6D3CB] px-2.5 py-0.5 rounded-full shrink-0">
                {displayBadge}
              </span>
            )}
            {subtitle && (
              <span className="hidden md:inline text-xs text-[#6B6560] truncate">
                — {subtitle}
              </span>
            )}
          </div>

          {actions && (
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1C1917] shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}

      <div className={cn('p-5 sm:p-6 bg-[#FFFFFF] text-[#1C1917]', bodyClassName)}>
        {children}
      </div>
    </section>
  );
}
