import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { getClassDetailAction } from '@/modules/academic/actions';
import {
  listAttendanceSessionsAction,
  getClassAttendanceSummaryAction,
  getMyClassAttendanceAction,
} from '@/modules/academic/attendance-actions';
import {
  CreateAttendanceSessionModal,
  StudentCheckInForm,
  LecturerSessionToggle,
  AttendanceSummaryCard,
} from '@/modules/academic/attendance-components';
import { CalendarCheck2, Users, AlertCircle, ArrowLeft } from 'lucide-react';

export default async function ClassAttendancePage({ params }: { params: { id: string } }) {
  const detail = await getClassDetailAction(params.id);
  if (!detail) notFound();

  const userContext = await getCurrentUserWithRoles();
  const role = userContext?.activeRole ?? 'STUDENT';
  const isLecturerOrTa = role === 'LECTURER' || role === 'TEACHING_ASSISTANT' || role === 'SYSTEM_ADMIN';

  const sessions = await listAttendanceSessionsAction(params.id);
  const nextMeetingNumber = sessions.length + 1;

  // Student specific data
  const myAttendance = !isLecturerOrTa ? await getMyClassAttendanceAction(params.id) : null;

  // Lecturer specific data (Summary for all members)
  const classSummary = isLecturerOrTa && detail.members
    ? await getClassAttendanceSummaryAction(params.id, detail.members)
    : [];

  return (
    <div className="w-full space-y-8 p-6 sm:p-9 animate-fade-up">
      <div>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Link href={`/classes/${params.id}`} className="hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke {detail.cls.title}
          </Link>
        </p>
        <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <CalendarCheck2 className="h-6 w-6 text-primary" />
              Presensi & Kehadiran Kelas
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Kelas {detail.cls.section} — Minimal kehadiran 75% untuk memenuhi syarat mengikuti UAS.
            </p>
          </div>

          {isLecturerOrTa && (
            <CreateAttendanceSessionModal
              classId={params.id}
              nextMeetingNumber={Math.min(16, nextMeetingNumber)}
            />
          )}
        </div>
      </div>

      {/* Student Summary Banner */}
      {!isLecturerOrTa && myAttendance && (
        <AttendanceSummaryCard summary={myAttendance} />
      )}

      {/* List of Sessions */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          Daftar Pertemuan Perkuliahan ({sessions.length})
        </h2>

        {sessions.length === 0 ? (
          <div className="rounded-control border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {isLecturerOrTa
              ? 'Belum ada sesi presensi yang dibuka. Klik tombol "+ Buka Sesi Presensi" di atas untuk membuat pertemuan baru.'
              : 'Dosen belum membuka sesi presensi pertemuan untuk kelas ini.'}
          </div>
        ) : (
          <div className="divide-y divide-border rounded-control border border-border bg-surface overflow-hidden">
            {sessions.map((s) => {
              const myStatus = (myAttendance?.sessions.find((ms) => ms.session.id === s.id)?.status ?? 'BELUM') as import('@/modules/academic/attendance-actions').AttendanceStatus | 'BELUM';

              return (
                <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        Pertemuan {s.meeting_number}: {s.title}
                      </span>
                      {s.is_open ? (
                        <span className="text-xs font-semibold text-success bg-success-soft px-2 py-0.5 rounded-full">
                          Sesi Dibuka
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          Sesi Ditutup
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {s.date} · Pukul {s.start_time} - {s.end_time} WIB
                    </p>
                  </div>

                  <div>
                    {isLecturerOrTa ? (
                      <LecturerSessionToggle session={s} />
                    ) : (
                      <StudentCheckInForm session={s} myStatus={myStatus} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Lecturer: Overall Class Student Attendance Table */}
      {isLecturerOrTa && classSummary.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              Rekapitulasi Mahasiswa ({classSummary.length})
            </h2>
            <span className="text-xs text-muted-foreground">
              Batas Kehadiran: ≥ 75%
            </span>
          </div>

          <div className="overflow-x-auto rounded-control border border-border bg-surface">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted text-muted-foreground font-medium border-b border-border">
                <tr>
                  <th className="py-2.5 px-3">Nama Mahasiswa</th>
                  <th className="py-2.5 px-3 text-center">Hadir</th>
                  <th className="py-2.5 px-3 text-center">Izin</th>
                  <th className="py-2.5 px-3 text-center">Sakit</th>
                  <th className="py-2.5 px-3 text-center">Alpa</th>
                  <th className="py-2.5 px-3 text-right">Persentase</th>
                  <th className="py-2.5 px-3 text-center">Syarat UAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {classSummary.map((st) => (
                  <tr key={st.student_id} className="hover:bg-muted/50 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-foreground">{st.student_name}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{st.hadir}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{st.izin}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{st.sakit}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-danger">{st.alpa}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold">
                      {st.percentage}%
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {st.can_take_uas ? (
                        <span className="text-xs font-semibold text-success bg-success-soft px-2 py-0.5 rounded-full">
                          Lolos
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-danger bg-danger-soft px-2 py-0.5 rounded-full">
                          Ditolak (&lt;75%)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
