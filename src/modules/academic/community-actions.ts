'use server';

import { createClient } from '@/lib/supabase/server';
import { checkSupabaseOnline } from '@/lib/supabase/status';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { listAllAnnouncementsAction } from './actions';
import { SEED_DOSEN_UIR } from '@/lib/db/seed-data.uir-ti-2026.generated';

export interface CommunityThreadItem {
  id: string;
  title: string;
  author: string;
  authorRole: string;
  excerpt: string;
  replies: number;
  views: number;
  category: string;
  isPinned: boolean;
  lastActive: string;
}

export interface CommunityGroupItem {
  id: string;
  name: string;
  desc: string;
  members: number;
  category: string;
  topics: number;
}

export interface CommunityMentorItem {
  id: string;
  name: string;
  role: string;
  expertise: string[];
  slots: string;
}

export interface CommunityEventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  speaker: string;
  role: string;
  location: string;
  type: string;
  seats: string;
  status: string;
}

export async function getCommunityDataAction(): Promise<{
  announcements: any[];
  threads: CommunityThreadItem[];
  groups: CommunityGroupItem[];
  mentors: CommunityMentorItem[];
  events: CommunityEventItem[];
}> {
  const announcements = await listAllAnnouncementsAction();
  const online = await checkSupabaseOnline();

  let threads: CommunityThreadItem[] = [];
  let events: CommunityEventItem[] = [];
  let groups: CommunityGroupItem[] = [];

  if (online) {
    try {
      const supabase = await createClient();
      const { data: dbDiscussions } = await supabase
        .from('discussions')
        .select('id, title, body, author_name, is_pinned, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (dbDiscussions && dbDiscussions.length > 0) {
        threads = dbDiscussions.map((d: any) => ({
          id: d.id,
          title: d.title,
          author: d.author_name || 'Sivitas Akademik',
          authorRole: 'Anggota Komunitas',
          excerpt: d.body ? d.body.slice(0, 140) + '...' : 'Diskusi seputar perkuliahan dan teknologi.',
          replies: 0,
          views: 1,
          category: 'Akademik',
          isPinned: !!d.is_pinned,
          lastActive: 'Baru saja',
        }));
      }

      const { data: dbEvents } = await supabase
        .from('campus_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (dbEvents && dbEvents.length > 0) {
        events = dbEvents.map((e: any) => ({
          id: e.id,
          title: e.title,
          date: e.event_date || 'Segera Diumumkan',
          time: '09:00 - 12:00 WIB',
          speaker: e.speaker || 'Pemateri Akademik',
          role: e.speaker_role || 'Praktisi',
          location: e.location || 'Auditorium Kampus',
          type: e.type || 'Seminar',
          seats: 'Tersedia',
          status: 'Pendaftaran Dibuka',
        }));
      }
    } catch {
      // fallback
    }
  }

  // Fallback data dari seed jika tabel masih kosong
  if (threads.length === 0) {
    threads = [
      {
        id: 'th-1',
        title: 'Tips Menyusun Rancangan Skripsi TI: Deep Learning vs Cloud Security',
        author: 'Andi Mahasiswa',
        authorRole: 'Mahasiswa Angkatan 2023',
        excerpt:
          'Diskusi seputar penentuan topik skripsi yang aplikatif dan relevan dengan industri software terkini di Riau, serta tips memilih dataset yang valid.',
        replies: 14,
        views: 180,
        category: 'Akademik',
        isPinned: true,
        lastActive: '10 menit lalu',
      },
      {
        id: 'th-2',
        title: 'Diskusi Praktikum Web Lanjut: Cara Mengatasi CORS di Supabase Local',
        author: 'Citra Asisten',
        authorRole: 'Asisten Laboratorium TI',
        excerpt:
          'Solusi konfigurasi header Access-Control-Allow-Origin saat menghubungkan Next.js App Router dengan docker Supabase lokal di Windows/WSL2.',
        replies: 8,
        views: 95,
        category: 'Praktikum',
        isPinned: false,
        lastActive: '25 menit lalu',
      },
      {
        id: 'th-3',
        title: 'Sharing Pengalaman Lolos Program Magang MSIB Software Engineering',
        author: 'Bagas Aditya',
        authorRole: 'Mahasiswa Angkatan 2022',
        excerpt:
          'Review technical interview live coding, tips membangun portofolio proyek open source di GitHub, dan menjawab pertanyaan algoritma.',
        replies: 22,
        views: 310,
        category: 'Karier',
        isPinned: false,
        lastActive: '1 jam lalu',
      },
    ];
  }

  if (groups.length === 0) {
    groups = [
      {
        id: 'grp-1',
        name: 'Kelompok Riset Kecerdasan Buatan & Vision',
        desc: 'Komunitas eksplorasi deep learning, computer vision, PyTorch, dan implementasi paper riset terkini.',
        members: 64,
        category: 'Riset',
        topics: 18,
      },
      {
        id: 'grp-2',
        name: 'Study Group Cloud Native & DevSecOps',
        desc: 'Diskusi mingguan seputar Docker containerization, Kubernetes cluster, CI/CD pipeline, dan infrastruktur cloud.',
        members: 52,
        category: 'Teknologi',
        topics: 12,
      },
      {
        id: 'grp-3',
        name: 'Komunitas Competitive Programming & Algoritma',
        desc: 'Bedah soal LeetCode, Codeforces, dan persiapan kontes pemrograman tingkat regional / nasional (Gemastik).',
        members: 78,
        category: 'Kompetisi',
        topics: 34,
      },
    ];
  }

  const mentors: CommunityMentorItem[] = SEED_DOSEN_UIR.slice(0, 4).map((d, idx) => ({
    id: d.id,
    name: d.nama,
    role: `Dosen Pembimbing · NIDN: ${d.nidn}`,
    expertise: idx % 2 === 0 ? ['Software Engineering', 'Cloud Computing', 'Clean Code'] : ['Machine Learning', 'Data Science', 'Deep Learning'],
    slots: 'Tersedia 3 Kuota Konsultasi',
  }));

  if (events.length === 0) {
    events = [
      {
        id: 'ev-1',
        title: 'Kuliah Tamu: Transformasi Arsitektur Monolith ke Event-Driven Microservices',
        date: '14 Oktober 2026',
        time: '09:00 - 12:00 WIB',
        speaker: 'Aditya Pratama, M.Sc.',
        role: 'Principal Architect at Tokopedia',
        location: 'Auditorium Gedung D Lantai 3',
        type: 'Kuliah Umum',
        seats: '150/150 Kursi Penuh',
        status: 'Pendaftaran Ditutup',
      },
      {
        id: 'ev-2',
        title: 'Hands-on Workshop: Membangun RAG AI Assistant dengan LangChain & Vector DB',
        date: '22 Oktober 2026',
        time: '13:30 - 16:30 WIB',
        speaker: 'Dr. Hendra Gunawan',
        role: 'AI Researcher & Solution Architect',
        location: 'Computer System LAB - TEKNIK C',
        type: 'Workshop Praktis',
        seats: '42/50 Kursi',
        status: 'Pendaftaran Dibuka',
      },
    ];
  }

  return {
    announcements,
    threads,
    groups,
    mentors,
    events,
  };
}
