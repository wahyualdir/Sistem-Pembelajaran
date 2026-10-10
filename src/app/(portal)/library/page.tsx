import React from 'react';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { LibraryHubView } from '@/modules/academic/library-hub-view';

const BOOKS = [
  {
    id: 'lib-1',
    title: 'Clean Architecture: A Craftsman’s Guide to Software Structure',
    author: 'Robert C. Martin',
    category: 'Rekayasa Perangkat Lunak',
    year: '2023',
    pages: 432,
    badge: 'Buku Utama',
  },
  {
    id: 'lib-2',
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    category: 'Basis Data Terdistribusi',
    year: '2022',
    pages: 616,
    badge: 'Buku Rujukan',
  },
  {
    id: 'lib-3',
    title: 'Artificial Intelligence: A Modern Approach (4th Ed)',
    author: 'Stuart Russell & Peter Norvig',
    category: 'Kecerdasan Buatan',
    year: '2024',
    pages: 1152,
    badge: 'Referensi Standar',
  },
  {
    id: 'lib-4',
    title: 'Fullstack Next.js 14 & Supabase Architecture',
    author: 'Tim Dosen Pemrograman Web',
    category: 'Modul Kuliah',
    year: '2026',
    pages: 198,
    badge: 'Modul Internal',
  },
  {
    id: 'lib-5',
    title: 'Computer Networking: A Top-Down Approach (8th Ed)',
    author: 'James Kurose & Keith Ross',
    category: 'Jaringan Komputer',
    year: '2023',
    pages: 864,
    badge: 'Buku Utama',
  },
  {
    id: 'lib-6',
    title: 'Introduction to Algorithms (CLRS 4th Ed)',
    author: 'Thomas H. Cormen et al.',
    category: 'Struktur Data & Algoritma',
    year: '2022',
    pages: 1312,
    badge: 'Referensi Standar',
  },
];

import { isDemoMode } from '@/lib/config/features';

export default async function LibraryPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole || 'STUDENT';
  const isStaffOrLecturer =
    role === 'LECTURER' ||
    role === 'ACADEMIC_STAFF' ||
    role === 'PROGRAM_COORDINATOR' ||
    role === 'SYSTEM_ADMIN' ||
    role === 'SUPER_ADMIN';
  const isDemo = isDemoMode();

  return <LibraryHubView books={BOOKS} isStaffOrLecturer={isStaffOrLecturer} isDemo={isDemo} />;
}
