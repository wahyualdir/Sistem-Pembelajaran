'use client';

import React from 'react';
import { markNotificationsReadAction } from './actions';
import { useRun } from './assignment-forms';
import { Feedback } from './class-forms';

export function MarkAllRead() {
  const { pending, error, success, tick, run } = useRun(() => {});
  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => markNotificationsReadAction(), 'Semua notifikasi ditandai sudah dibaca.')}
        className="h-9 rounded-lg border-[1.5px] border-retro-border bg-retro-warm hover:bg-retro-yellow px-4 text-xs font-bold text-foreground transition-all shadow-xs disabled:opacity-50 active:translate-x-0.5 active:translate-y-0.5"
      >
        Tandai Semua Dibaca
      </button>
      <Feedback error={error} success={success} tick={tick} />
    </div>
  );
}
