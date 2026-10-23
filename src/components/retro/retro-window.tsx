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
  subtitle: _subtitle,
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
        'vt-window rounded-none overflow-hidden transition-all duration-150',
        className
      )}
    >
      {/* Window Header Bar with Velqora Signature Terracotta Gradient */}
      <div
        className={cn(
          'vt-titlebar flex h-10 items-center justify-between px-3 select-none shrink-0',
          headerClassName
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="font-mono text-xs sm:text-sm font-bold tracking-wide text-white truncate uppercase">
            {title}
          </span>
          {displayBadge && (
            <span className="font-mono text-[10px] font-bold bg-black/25 text-white border border-white/30 px-1.5 py-0.5 shrink-0">
              {displayBadge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {actions && <div className="flex items-center gap-2 text-xs font-bold text-white shrink-0">{actions}</div>}
          <div className="flex items-center gap-1 shrink-0 ml-1">
            <span className="vt-window-btn" title="Minimalkan">_</span>
            <span className="vt-window-btn" title="Perbesar">□</span>
            <span className="vt-window-btn vt-window-btn-close" title="Tutup">×</span>
          </div>
        </div>
      </div>

      {/* Window Body with Inset Frame */}
      <div className={cn('p-4 sm:p-6 bg-surface text-[#1C1917]', bodyClassName)}>
        {children}
      </div>
    </div>
  );
}
