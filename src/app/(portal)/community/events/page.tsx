import React from 'react';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Video, Users, Award, ArrowRight, CheckCircle2 } from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';

const EVENTS = [
  {
    id: 'ev-1',
    title: 'Webinar Nasional: Menghadapi Era Generative AI dalam Rekayasa Perangkat Lunak',
    date: '15 Oktober 2026',
    time: '09:00 - 12:00 WIB',
    speaker: 'Prof. Dewi Lestari, Ph.D.',
    role: 'Guru Besar AI & Machine Learning',
    location: 'Zoom Meeting & Live YouTube',
    type: 'Webinar Nasional',
    seats: '350/500 Kursi',
    status: 'Pendaftaran Dibuka',
    badgeVariant: 'bg-gray-soft text-black',
  },
  {
    id: 'ev-2',
    title: 'Workshop Hands-on: Building Enterprise APIs with Next.js & Supabase',
    date: '24 Oktober 2026',
    time: '13:30 - 16:30 WIB',
    speaker: 'Dr. Ardiansyah & Tim Asisten',
    role: 'Kepala Laboratorium Rekayasa Web',
    location: 'Lab Komputer 2 (Hybrid)',
    type: 'Workshop Praktis',
    seats: '42/50 Kursi',
    status: 'Sisa 8 Kursi',
    badgeVariant: 'bg-primary text-white',
  },
  {
    id: 'ev-3',
    title: 'Hackathon Kampus 2026: Inovasi Sistem Cerdas untuk SDGs',
    date: '05 - 07 November 2026',
    time: '08:00 WIB - Selesai',
    speaker: 'Dewan Juri Akademik & Industri',
    role: 'Kolaborasi Fakultas & Industri Mitra',
    location: 'Auditorium Gedung Rektorat',
    type: 'Kompetisi Tim',
    seats: '24 Tim Terdaftar',
    status: 'Pendaftaran Ditutup H-5',
    badgeVariant: 'bg-retro-mint text-black',
  },
  {
    id: 'ev-4',
    title: 'Alumni Talk & Career Coaching: Menembus Karir Global Software Engineer',
    date: '18 November 2026',
    time: '19:00 - 21:00 WIB',
    speaker: 'Budi Raharjo, M.Sc.',
    role: 'Principal Staff Engineer @ Tech Unicorn',
    location: 'Google Meet Eksklusif',
    type: 'Mentoring Karir',
    seats: '120/150 Kursi',
    status: 'Pendaftaran Dibuka',
    badgeVariant: 'bg-gray-soft/40 text-black',
  },
];

export default function EventsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW EVENT */}
      <RetroWindow
        title="event_dan_webinar_akademik.app"
        badge={`${EVENTS.length} KEGIATAN AKTIF`}
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg border-2 border-black bg-primary text-white shadow-xs">
                <Calendar className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight text-foreground">
                Event & Webinar Akademik
              </h1>
            </div>
            <p className="text-base sm:text-lg text-black font-medium max-w-3xl leading-relaxed">
              Ikuti agenda seminar ilmiah, lokakarya teknologi terapan, kuliah tamu pakar industri, dan kompetisi mahasiswa untuk mengakselerasi portofolio Anda.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded-lg border-2 border-black bg-white px-4 py-2 text-sm sm:text-base font-sans font-bold text-black shadow-retro">
              Semester Ganjil 2026/2027
            </span>
          </div>
        </div>
      </RetroWindow>

      {/* 2. GRID CARDS FULL */}
      <RetroWindow
        title={`jadwal_agenda_kegiatan.list (${EVENTS.length})`}
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 space-y-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <h2 className="font-heading font-bold text-xl sm:text-2xl text-black flex items-center gap-2.5">
            <Award className="h-6 w-6 text-primary" />
            <span>Daftar Kegiatan Ilmiah & Workshop Tersedia</span>
          </h2>
          <span className="text-xs sm:text-sm font-sans font-bold text-neutral-800">
            Status: Terverifikasi Fakultas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7">
          {EVENTS.map((ev, i) => (
            <div
              key={ev.id}
              className="rounded-xl border-2 border-black bg-white p-5 sm:p-6 shadow-retro flex flex-col justify-between space-y-5 hover:-translate-y-1 hover:shadow-retro-md transition-all animate-fade-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`px-3 py-1 rounded border-2 border-black text-xs sm:text-sm font-sans font-bold shadow-xs ${ev.badgeVariant}`}>
                    {ev.type}
                  </span>
                  <span className="px-3 py-1 rounded border-2 border-black bg-gray-soft text-xs sm:text-sm font-sans font-bold text-black shadow-xs">
                    {ev.seats}
                  </span>
                </div>

                <h3 className="font-heading font-bold text-xl sm:text-2xl text-black line-clamp-2 leading-snug">
                  {ev.title}
                </h3>

                <div className="space-y-2 pt-3 text-sm font-sans text-neutral-900 border-t-2 border-black/10">
                  <div className="flex items-center gap-2 text-black font-bold">
                    <span className="text-primary">🗓</span>
                    <span>{ev.date} · {ev.time}</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <span className="text-primary">🎙</span>
                    <span>{ev.speaker} — <strong className="font-bold">{ev.role}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <span className="text-primary">📍</span>
                    <span>{ev.location}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3.5 border-t-2 border-black/10 flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-sans font-bold text-ink bg-surface px-3 py-1 rounded border-2 border-black shadow-xs">
                  <CheckCircle2 className="h-4 w-4 text-ink" />
                  <span>{ev.status}</span>
                </span>

                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-black bg-gray-soft text-black font-heading font-bold text-xs sm:text-sm hover:bg-black hover:text-white shadow-retro hover:shadow-retro-md transition-all shrink-0"
                >
                  <span>Daftar Kegiatan Sekarang</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </RetroWindow>
    </div>
  );
}
