import type { UserStatus } from '@/lib/supabase/types';

export interface SyntheticDemoUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  status: UserStatus;
  password?: string;
  mustChangePassword?: boolean;
  lockedUntil?: string;
  isNewAccount?: boolean;
}

export const SYNTHETIC_DEMO_USERS: Record<string, SyntheticDemoUser> = {
  '2024001': {
    id: 'a0000001-0000-0000-0000-000000000001',
    email: 'mhs@siajar.ac.id',
    name: 'Ahmad Mahasiswa',
    roles: ['STUDENT'],
    status: 'ACTIVE',
  },
  'mhs@siajar.ac.id': {
    id: 'a0000001-0000-0000-0000-000000000001',
    email: 'mhs@siajar.ac.id',
    name: 'Ahmad Mahasiswa',
    roles: ['STUDENT'],
    status: 'ACTIVE',
  },
  '0012345678': {
    id: 'a0000002-0000-0000-0000-000000000002',
    email: 'dosen@siajar.ac.id',
    name: 'Dr. Budi Santoso, M.Kom.',
    roles: ['LECTURER'],
    status: 'ACTIVE',
  },
  'dosen@siajar.ac.id': {
    id: 'a0000002-0000-0000-0000-000000000002',
    email: 'dosen@siajar.ac.id',
    name: 'Dr. Budi Santoso, M.Kom.',
    roles: ['LECTURER'],
    status: 'ACTIVE',
  },
  '2024002': {
    id: 'a0000003-0000-0000-0000-000000000003',
    email: 'asdos@siajar.ac.id',
    name: 'Citra Asisten',
    roles: ['STUDENT', 'TEACHING_ASSISTANT'],
    status: 'ACTIVE',
  },
  'asdos@siajar.ac.id': {
    id: 'a0000003-0000-0000-0000-000000000003',
    email: 'asdos@siajar.ac.id',
    name: 'Citra Asisten',
    roles: ['STUDENT', 'TEACHING_ASSISTANT'],
    status: 'ACTIVE',
  },
  '0087654321': {
    id: 'a0000004-0000-0000-0000-000000000004',
    email: 'kaprodi@siajar.ac.id',
    name: 'Prof. Dewi Lestari, Ph.D.',
    roles: ['PROGRAM_COORDINATOR', 'LECTURER'],
    status: 'ACTIVE',
  },
  'kaprodi@siajar.ac.id': {
    id: 'a0000004-0000-0000-0000-000000000004',
    email: 'kaprodi@siajar.ac.id',
    name: 'Prof. Dewi Lestari, Ph.D.',
    roles: ['PROGRAM_COORDINATOR', 'LECTURER'],
    status: 'ACTIVE',
  },
  '198501012010121001': {
    id: 'a0000005-0000-0000-0000-000000000005',
    email: 'staf@siajar.ac.id',
    name: 'Eko Staf Akademik',
    roles: ['ACADEMIC_STAFF'],
    status: 'ACTIVE',
  },
  'staf@siajar.ac.id': {
    id: 'a0000005-0000-0000-0000-000000000005',
    email: 'staf@siajar.ac.id',
    name: 'Eko Staf Akademik',
    roles: ['ACADEMIC_STAFF'],
    status: 'ACTIVE',
  },
  sysadmin: {
    id: 'a0000006-0000-0000-0000-000000000006',
    email: 'admin@siajar.ac.id',
    name: 'System Administrator',
    roles: ['SYSTEM_ADMIN'],
    status: 'ACTIVE',
  },
  'admin@siajar.ac.id': {
    id: 'a0000006-0000-0000-0000-000000000006',
    email: 'admin@siajar.ac.id',
    name: 'System Administrator',
    roles: ['SYSTEM_ADMIN'],
    status: 'ACTIVE',
  },
  superadmin: {
    id: 'a0000010-0000-0000-0000-000000000010',
    email: 'superadmin@siajar.ac.id',
    name: 'Super Administrator',
    roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN'],
    status: 'ACTIVE',
  },
  'superadmin@siajar.ac.id': {
    id: 'a0000010-0000-0000-0000-000000000010',
    email: 'superadmin@siajar.ac.id',
    name: 'Super Administrator',
    roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN'],
    status: 'ACTIVE',
  },
  '2024099': {
    id: 'a0000007-0000-0000-0000-000000000007',
    email: 'newuser@siajar.ac.id',
    name: 'Fajar Baru',
    roles: ['STUDENT'],
    status: 'ACTIVE',
    mustChangePassword: true,
  },
  '2024088': {
    id: 'a0000008-0000-0000-0000-000000000008',
    email: 'locked@siajar.ac.id',
    name: 'Gilang Terkunci',
    roles: ['STUDENT'],
    status: 'LOCKED',
  },
  'wahyualdiriyanto80@gmail.com': {
    id: 'a0000009-0000-0000-0000-000000000009',
    email: 'wahyualdiriyanto80@gmail.com',
    name: 'Wahyu Aldi Riyanto',
    roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'ACADEMIC_STAFF', 'PROGRAM_COORDINATOR', 'LECTURER', 'STUDENT'],
    status: 'ACTIVE',
    password: 'Wahyu11',
  },
  wahyu: {
    id: 'a0000009-0000-0000-0000-000000000009',
    email: 'wahyualdiriyanto80@gmail.com',
    name: 'Wahyu Aldi Riyanto',
    roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'ACADEMIC_STAFF', 'PROGRAM_COORDINATOR', 'LECTURER', 'STUDENT'],
    status: 'ACTIVE',
    password: 'Wahyu11',
  },
};
