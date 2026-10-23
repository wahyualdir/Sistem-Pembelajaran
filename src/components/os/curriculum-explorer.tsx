'use client';

import React, { useState, useMemo } from 'react';
import { OSWindow } from './os-window';
import {
  Folder,
  CheckCircle2,
  BookOpen,
  ChevronRight,
  Search,
  Layers,
  Sparkles,
  Database,
  Code2,
  Cpu,
  GraduationCap,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface CourseItem {
  id: string;
  code: string;
  title: string;
  semester: number;
  credits: number;
  lecturer: string;
  category: string;
  description: string;
  status: 'TERVERIFIKASI' | 'BERJALAN' | 'ELEKTIF';
}

const COURSES: CourseItem[] = [
  {
    id: 'c-101',
    code: 'TI-101',
    title: 'Dasar Pemrograman & Logika Komputasi',
    semester: 1,
    credits: 3,
    lecturer: 'Dr. Ahmad Dahlan, M.Kom.',
    category: 'Fondasi',
    description: 'Algoritma sekuensial, kontrol percabangan, struktur perulangan, dan pemecahan masalah komputasional.',
    status: 'TERVERIFIKASI',
  },
  {
    id: 'c-102',
    code: 'TI-102',
    title: 'Matematika Diskrit & Teori Graf',
    semester: 1,
    credits: 3,
    lecturer: 'Prof. Dr. Ir. Indah Lestari',
    category: 'Fondasi',
    description: 'Himpunan, relasi, induksi matematika, rekursi, logika proposisional, dan teori graf terapan.',
    status: 'TERVERIFIKASI',
  },
  {
    id: 'c-201',
    code: 'TI-201',
    title: 'Struktur Data & Algoritma Lanjutan',
    semester: 2,
    credits: 4,
    lecturer: 'Budi Santoso, S.T., M.Kom.',
    category: 'Inti',
    description: 'Array dinamis, linked list, tree, binary search tree, hash map, graph traversal, dan analisis Big-O.',
    status: 'TERVERIFIKASI',
  },
  {
    id: 'c-202',
    code: 'TI-202',
    title: 'Sistem Operasi & Manajemen Memori',
    semester: 2,
    credits: 3,
    lecturer: 'Ir. Hendra Wijaya, M.T.',
    category: 'Inti',
    description: 'Process scheduling, virtual memory, thread synchronization, deadlocks, dan system calls kernel.',
    status: 'TERVERIFIKASI',
  },
  {
    id: 'c-301',
    code: 'TI-301',
    title: 'Pemrograman Berorientasi Objek (PBO)',
    semester: 3,
    credits: 3,
    lecturer: 'Dr. Ir. Budi Santoso, M.T.',
    category: 'Inti',
    description: 'Enkapsulasi, inheritance, polimorfisme, abstraksi antarmuka, design patterns, dan refaktorisasi kode.',
    status: 'BERJALAN',
  },
  {
    id: 'c-302',
    code: 'TI-302',
    title: 'Sistem Basis Data Relasional & NoSQL',
    semester: 3,
    credits: 4,
    lecturer: 'Siti Aminah, M.Kom.',
    category: 'Inti',
    description: 'Normalisasi BCNF/3NF, indeks B-Tree, ACID transaction, PostgreSQL, dan indexing dokumen NoSQL.',
    status: 'TERVERIFIKASI',
  },
  {
    id: 'c-401',
    code: 'TI-401',
    title: 'Kecerdasan Buatan & Sistem Cerdas',
    semester: 4,
    credits: 3,
    lecturer: 'Dr. Rizky Ramadhan, M.Sc.',
    category: 'Lanjutan',
    description: 'Heuristic search A*, min-max alpha-beta pruning, knowledge representation, dan sistem pakar inferensial.',
    status: 'TERVERIFIKASI',
  },
  {
    id: 'c-501',
    code: 'TI-501',
    title: 'Machine Learning & Pembelajaran Mendalam',
    semester: 5,
    credits: 4,
    lecturer: 'Dr. Eko Prasetyo, Ph.D.',
    category: 'Lanjutan',
    description: 'Supervised & unsupervised learning, gradient descent, backpropagation, CNN, RNN, dan Transformer LLM.',
    status: 'BERJALAN',
  },
];

export function CurriculumExplorer() {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['Semua', 'Fondasi', 'Inti', 'Lanjutan'];

  const filteredCourses = useMemo(() => {
    return COURSES.filter((c) => {
      const matchCategory = selectedCategory === 'Semua' || c.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.lecturer.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div id="curriculum-section" className="w-full max-w-7xl mx-auto px-2 sm:px-4 my-8">
      <OSWindow
        title="C:\RUANGKAMPUS\CURRICULUM_EXPLORER"
        icon={<Folder className="w-4 h-4 text-[#FDE68A]" />}
        statusText={`${filteredCourses.length} MATAKULIAH DITEMUKAN · KAIN SEMESTER ACTIVE · My Computer`}
        className="shadow-md"
        bodyClassName="p-4 sm:p-6 bg-[#FFFFFF] text-[#1C1917]"
      >
        {/* Windows Explorer Address Bar */}
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[#E5DDD5] font-mono text-xs select-none">
          <span className="text-[#57534E] font-bold">Address:</span>
          <div className="flex-1 bg-[#FAF8F5] border border-[#D6D3CB] px-3 py-1 text-[#1C1917] font-semibold flex items-center justify-between">
            <span>C:\RuangKampus\Kurikulum_Semester\{selectedCategory}</span>
            <span className="text-[#853827] text-[10px] hidden sm:inline">28 MATAKULIAH TOTAL</span>
          </div>
        </div>

        {/* Filter Toolbar & Live Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 mb-4 border-b border-[#E5DDD5]">
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto font-mono text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 transition-all cursor-pointer font-bold ${
                  selectedCategory === cat ? 'vt-btn-terracotta text-white' : 'vt-btn-chrome text-[#57534E]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64 font-mono text-xs">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#78716C]" />
            <input
              type="text"
              placeholder="Cari matakuliah / kode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-[#D6D3CB] pl-8 pr-3 py-1.5 text-xs text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#C2553A]"
            />
          </div>
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
          {filteredCourses.map((c) => (
            <div
              key={c.id}
              className="vt-window rounded-none p-3.5 bg-[#FAF8F5] flex flex-col justify-between hover:border-[#C2553A] transition-all group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#C2553A] text-white">
                    {c.code}
                  </span>
                  <span className="text-[10px] text-[#78716C] font-semibold">
                    Sem {c.semester} • {c.credits} SKS
                  </span>
                </div>

                <h3 className="font-sans font-bold text-sm text-[#1C1917] group-hover:text-[#C2553A] transition-colors leading-snug">
                  {c.title}
                </h3>

                <p className="font-sans text-xs text-[#57534E] line-clamp-3 leading-relaxed">
                  {c.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#E5DDD5] mt-3 flex items-center justify-between text-[10px]">
                <span className="text-[#853827] font-semibold truncate max-w-[150px]">
                  {c.lecturer}
                </span>
                <span className="px-1 py-0.5 border border-[#3B7A57] text-[#3B7A57] bg-[#E8F5E9] font-bold">
                  {c.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </OSWindow>
    </div>
  );
}
