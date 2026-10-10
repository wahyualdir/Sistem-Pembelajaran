import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-xl space-y-3 p-6 md:p-8">
      <h1 className="text-2xl font-semibold">Halaman tidak ditemukan</h1>
      <p className="text-sm text-muted-foreground">
        Alamat yang Anda buka tidak ada, atau Anda tidak memiliki akses ke sana.
      </p>
      <p className="text-sm">
        <Link href="/" className="font-medium text-primary underline-offset-4 hover:underline">Kembali ke beranda</Link>
      </p>
    </div>
  );
}
