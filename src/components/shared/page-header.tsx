'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-2 sm:py-3',
        className
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        {breadcrumb && (
          <div className="text-xs text-[#7A756D] mb-1 font-medium truncate">
            {breadcrumb}
          </div>
        )}
        <h1 className="font-heading font-bold text-xl sm:text-2xl text-[#1C1917] tracking-tight leading-snug heading-balance truncate">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-[#7A756D] font-medium leading-relaxed max-w-3xl">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0 w-full sm:w-auto [&>button]:w-full sm:[&>button]:w-auto [&>a]:w-full sm:[&>a]:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
