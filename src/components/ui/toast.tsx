'use client';

import * as React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastData {
  id: string;
  title?: string;
  description: string;
  variant?: 'default' | 'success' | 'destructive' | 'info';
  duration?: number;
}

type ToastListener = (toasts: ToastData[]) => void;

let toasts: ToastData[] = [];
const listeners = new Set<ToastListener>();

function emit() {
  listeners.forEach((listener) => listener([...toasts]));
}

export function toast(options: {
  title?: string;
  description: string;
  variant?: 'default' | 'success' | 'destructive' | 'info';
  duration?: number;
}) {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast: ToastData = {
    id,
    title: options.title,
    description: options.description,
    variant: options.variant || 'default',
    duration: options.duration ?? 4000,
  };

  toasts = [newToast, ...toasts.slice(0, 4)];
  emit();

  if (newToast.duration && newToast.duration > 0) {
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      emit();
    }, newToast.duration);
  }

  return id;
}

toast.success = (description: string, title?: string) =>
  toast({ description, title, variant: 'success' });

toast.error = (description: string, title?: string) =>
  toast({ description, title, variant: 'destructive' });

toast.info = (description: string, title?: string) =>
  toast({ description, title, variant: 'info' });

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function Toaster() {
  const [activeToasts, setActiveToasts] = React.useState<ToastData[]>([]);

  React.useEffect(() => {
    listeners.add(setActiveToasts);
    return () => {
      listeners.delete(setActiveToasts);
    };
  }, []);

  if (activeToasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-2 sm:p-0"
    >
      {activeToasts.map((t) => {
        const isSuccess = t.variant === 'success';
        const isDestructive = t.variant === 'destructive';
        const isInfo = t.variant === 'info';

        return (
          <div
            key={t.id}
            role="alert"
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-xl border-2 border-black shadow-retro bg-surface text-ink transition-all animate-fade-in',
              isSuccess && 'border-black bg-[#E8F5E9]',
              isDestructive && 'border-black bg-[#FEF2F2] text-red-900',
              isInfo && 'border-black bg-gray-soft'
            )}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="h-5 w-5 text-primary" />}
              {isDestructive && <AlertCircle className="h-5 w-5 text-red-600" />}
              {isInfo && <Info className="h-5 w-5 text-ink" />}
              {!isSuccess && !isDestructive && !isInfo && (
                <Info className="h-5 w-5 text-ink" />
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-0.5">
              {t.title && (
                <h5 className="font-heading font-bold text-sm leading-tight text-ink">
                  {t.title}
                </h5>
              )}
              <p className="text-xs sm:text-sm font-medium leading-relaxed text-gray-dark break-words">
                {t.description}
              </p>
            </div>

            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              className="shrink-0 p-1 rounded-lg hover:bg-black/5 text-gray-dark hover:text-ink transition-colors"
              aria-label="Tutup notifikasi"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
