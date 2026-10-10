import React from 'react';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import {
  AttendanceHubView,
  type AttendanceHistoryRecord,
  type LeaveRequestRecord,
} from '@/modules/academic/attendance-hub-view';

const DEMO_ATTENDANCE_RECORDS: AttendanceHistoryRecord[] = [
  {
    id: 'att-1',
    courseTitle: 'Pemrograman Web Lanjut',
    meetingNumber: 7,
    date: 'Senin, 05 Okt 2026',
    time: '08:05 WIB',
    method: 'QR',
    status: 'HADIR',
    room: 'Lab Komputer 2',
  },
  {
    id: 'att-2',
    courseTitle: 'Rekayasa Perangkat Lunak',
    meetingNumber: 7,
    date: 'Selasa, 06 Okt 2026',
    time: '10:50 WIB',
    method: 'LOKASI',
    status: 'HADIR',
    room: 'Ruang Teori 304',
  },
  {
    id: 'att-3',
    courseTitle: 'Kecerdasan Buatan & Machine Learning',
    meetingNumber: 7,
    date: 'Rabu, 07 Okt 2026',
    time: '13:40 WIB',
    method: 'BIOMETRIK',
    status: 'HADIR',
    room: 'Lab Riset AI',
  },
  {
    id: 'att-4',
    courseTitle: 'Basis Data Terdistribusi',
    meetingNumber: 6,
    date: 'Kamis, 01 Okt 2026',
    time: '08:25 WIB',
    method: 'QR',
    status: 'TERLAMBAT',
    room: 'Lab Basis Data 1',
  },
  {
    id: 'att-5',
    courseTitle: 'Keamanan Siber & Kriptografi',
    meetingNumber: 6,
    date: 'Jumat, 02 Okt 2026',
    time: '08:35 WIB',
    method: 'LOKASI',
    status: 'HADIR',
    room: 'Ruang Cyber Defense',
  },
];

const DEMO_LEAVE_REQUESTS: LeaveRequestRecord[] = [
  {
    id: 'leave-1',
    type: 'SAKIT',
    courseTitle: 'Basis Data Terdistribusi',
    meetingNumber: 5,
    date: 'Kamis, 24 Sep 2026',
    reason: 'Rawat jalan demam berdarah di RS Islam Ibnu Sina',
    attachmentName: 'surat_dokter_rs_ibnusina.pdf',
    status: 'DISETUJUI',
    submittedAt: '2026-09-24T09:00:00Z',
    feedback: 'Dispensasi diterima. Segera pelajari materi slide pertemuan 5.',
  },
  {
    id: 'leave-2',
    type: 'IZIN',
    courseTitle: 'Rekayasa Perangkat Lunak',
    meetingNumber: 4,
    date: 'Selasa, 15 Sep 2026',
    reason: 'Delegasi Lomba Gemastik Pemrograman Divisi UI/UX',
    attachmentName: 'surat_tugas_dekanat_ft.pdf',
    status: 'DISETUJUI',
    submittedAt: '2026-09-14T14:30:00Z',
    feedback: 'Selamat berlomba dan semoga sukses.',
  },
];

export default async function AttendancePage() {
  const user = await getCurrentUserWithRoles();
  return (
    <AttendanceHubView
      records={DEMO_ATTENDANCE_RECORDS}
      leaves={DEMO_LEAVE_REQUESTS}
    />
  );
}
