import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles, listUserDevicesAction } from '@/modules/identity/actions';
import { DeviceManager } from './device-manager';
import { Settings, Sliders, Bell, Laptop } from 'lucide-react';

export default async function DevicesPage() {
  const userContext = await getCurrentUserWithRoles();

  if (!userContext) {
    redirect('/login');
  }

  const { devices } = await listUserDevicesAction();

  return (
    <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0">
      <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
        {/* OPEN HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-0.5">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-ink flex items-center gap-2.5">
              <Settings className="h-6 w-6 sm:h-7 sm:w-7 text-primary inline-block" />
              Pengaturan Akun & Preferensi
            </h1>
            <p className="text-xs sm:text-sm text-gray-dark font-bold">
              Konfigurasi saluran notifikasi, tampilan antarmuka, bahasa, dan pengelolaan sesi perangkat.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-gray-soft border-2 border-ink text-ink shadow-xs">
              KEAMANAN SESI
            </span>
          </div>
        </div>

        {/* 3-TAB NAVIGATION BAR */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b-2 border-ink/20">
          <Link
            href="/settings"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border-2 border-ink font-heading font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap bg-surface text-ink hover:bg-gray-soft shadow-xs"
          >
            <Bell className="h-3.5 w-3.5 text-primary" />
            <span>Notifikasi & Pengingat</span>
          </Link>
          <Link
            href="/settings/appearance"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border-2 border-ink font-heading font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap bg-surface text-ink hover:bg-gray-soft shadow-xs"
          >
            <Sliders className="h-3.5 w-3.5 text-primary" />
            <span>Tampilan & Bahasa</span>
          </Link>
          <Link
            href="/devices"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border-2 border-ink font-heading font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap bg-ink text-white shadow-retro border-b-4 border-b-primary"
          >
            <Laptop className="h-3.5 w-3.5 text-primary" />
            <span>Perangkat & Sesi</span>
          </Link>
        </div>

        {/* TAB CONTENT */}
        <DeviceManager devices={devices || []} userId={userContext.user.id} />
      </div>
    </div>
  );
}
