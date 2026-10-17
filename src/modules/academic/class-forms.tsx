'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClassAction, joinClassAction, type CourseItem, type SemesterItem } from './actions';

export function Feedback({ error, success, tick }: { error: string; success: string; tick: number }) {
  if (error)
    return (
      <p key={tick} role="alert" className="shake text-sm text-primary-dark">
        {error}
      </p>
    );
  if (success)
    return (
      <p role="status" className="animate-fade-up text-sm text-ink">
        {success}
      </p>
    );
  return null;
}

export function JoinClassForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tick, setTick] = useState(0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    start(async () => {
      const res = await joinClassAction(code);
      if (res.ok) {
        setSuccess(`Berhasil bergabung ke ${res.data?.title}, Kelas ${res.data?.section}.`);
        setCode('');
        router.refresh();
      } else {
        setError(res.error ?? 'Gagal bergabung ke kelas.');
        setTick((t) => t + 1);
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <label htmlFor="join-code" className="block text-sm font-medium">
        Kode kelas dari dosen
      </label>
      <div className="flex gap-2">
        <input
          id="join-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={8}
          autoComplete="off"
          spellCheck={false}
          placeholder="8 karakter"
          disabled={pending}
          required
          className="field max-w-[11rem] font-sans uppercase tracking-[0.2em]"
        />
        <button type="submit" disabled={pending} data-pending={pending} className="btn-solid !w-auto px-5">
          {pending ? 'Memeriksa...' : 'Gabung'}
        </button>
      </div>
      <Feedback error={error} success={success} tick={tick} />
    </form>
  );
}

export function CreateClassForm({ courses = [], semesters = [] }: { courses?: CourseItem[]; semesters?: SemesterItem[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [title, setTitle] = useState('');
  const [section, setSection] = useState('A');
  const [capacity, setCapacity] = useState('');
  const [course, setCourse] = useState('');
  const [semester, setSemester] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tick, setTick] = useState(0);

  const pickCourse = (id: string) => {
    setCourse(id);
    const c = courses.find((x) => x.id === id);
    if (c) setTitle(c.name);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    start(async () => {
      const res = await createClassAction({ title, section, capacity: capacity ? Number(capacity) : undefined, course_id: course || undefined, semester_id: semester || undefined });
      if (res.ok) {
        setSuccess(`Kelas dibuat. Bagikan kode kelas ${res.data?.join_code} kepada mahasiswa.`);
        setTitle('');
        setCapacity('');
        setCourse('');
        router.refresh();
      } else {
        setError(res.error ?? 'Gagal membuat kelas.');
        setTick((t) => t + 1);
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      {(courses.length > 0 || semesters.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {courses.length > 0 && (
            <div className="space-y-1.5">
              <label htmlFor="c-course" className="block text-sm font-medium">Daftar mata kuliah</label>
              <select id="c-course" value={course} onChange={(e) => pickCourse(e.target.value)} disabled={pending} className="field">
                <option value="">Tulis nama sendiri</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} {c.name}</option>
                ))}
              </select>
            </div>
          )}
          {semesters.length > 0 && (
            <div className="space-y-1.5">
              <label htmlFor="c-semester" className="block text-sm font-medium">Semester</label>
              <select id="c-semester" value={semester} onChange={(e) => setSemester(e.target.value)} disabled={pending} className="field">
                <option value="">Tanpa semester</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-[1fr_6rem_7rem]">
        <div className="space-y-1.5">
          <label htmlFor="c-title" className="block text-sm font-medium">Mata kuliah</label>
          <input id="c-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Pemrograman Web" disabled={pending} required className="field" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="c-section" className="block text-sm font-medium">Kelas</label>
          <input id="c-section" value={section} onChange={(e) => setSection(e.target.value)} disabled={pending} required className="field" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="c-cap" className="block text-sm font-medium">Kapasitas</label>
          <input id="c-cap" type="number" min={1} max={500} value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Opsional" disabled={pending} className="field" />
        </div>
      </div>
      <button type="submit" disabled={pending} data-pending={pending} className="btn-solid !w-auto px-5">
        {pending ? 'Membuat kelas...' : 'Buat kelas'}
      </button>
      <Feedback error={error} success={success} tick={tick} />
    </form>
  );
}
