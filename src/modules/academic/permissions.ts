// Izin yang dapat didelegasikan dosen kepada asisten (Bagian 7.3).
// grade.finalize, grade.change_request, dan class.assign_staff sengaja tidak ada di daftar ini.
export const DELEGABLE_CODES = ['submission.review', 'assignment.grade', 'material.manage', 'announcement.manage', 'assignment.create'] as const;

export const DELEGABLE_LABELS: Record<(typeof DELEGABLE_CODES)[number], string> = {
  'submission.review': 'Meninjau pengumpulan',
  'assignment.grade': 'Memberi nilai draf',
  'material.manage': 'Menerbitkan materi',
  'announcement.manage': 'Mengirim pengumuman',
  'assignment.create': 'Menerbitkan tugas',
};
