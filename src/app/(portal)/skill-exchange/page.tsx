import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { RetroWindow } from '@/components/retro/retro-window';
import { HandHelping, ArrowRight, Layers, ShieldCheck } from 'lucide-react';

export default async function SkillExchangePage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole || 'STUDENT';

  // Proteksi akses peran: Mahasiswa, Asisten Dosen, Dosen, Kaprodi, Super Admin
  if (role === 'SYSTEM_ADMIN' || role === 'ACADEMIC_STAFF') {
    redirect(role === 'SYSTEM_ADMIN' ? '/admin/system' : '/staff');
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6 sm:space-y-8 animate-fade-up font-sans">
      <RetroWindow
        title="Tukar Keahlian"
        badge="Kolaborasi Sejawat"
        headerClassName="bg-gray-soft"
      >
        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <HandHelping className="w-6 h-6 text-primary" />
                Tukar Keahlian
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Bantuan belajar antarmahasiswa sekelas pada topik materi yang telah dikuasai.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                <ShieldCheck className="w-3.5 h-3.5" />
                Tanpa Pesan Pribadi
              </span>
            </div>
          </div>

          {/* Keadaan Kosong (Empty State) Sesuai Panduan Tulisan */}
          <div className="rounded-lg border border-dashed border-border p-8 text-center space-y-4 bg-muted/20">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
              <HandHelping className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                Belum ada permintaan bantuan terbuka
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Pilih kelas perkuliahan Anda untuk ikut serta, meminta penjelasan konsep materi, atau membantu rekan sekelas.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/classes"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Buka Kelas Saya
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </RetroWindow>
    </div>
  );
}
