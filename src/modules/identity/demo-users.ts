import type { UserStatus } from '@/lib/supabase/types';

export interface SyntheticDemoUser {
  id: string;
  email: string;
  name: string;
  nim?: string;
  nidn?: string;
  roles: string[];
  status: UserStatus;
  mustChangePassword?: boolean;
  lockedUntil?: string;
  isNewAccount?: boolean;
}

export const SYNTHETIC_DEMO_USERS: Record<string, SyntheticDemoUser> = {
  '2024001': {
    id: 'a0000001-0000-0000-0000-000000000001',
    email: 'mhs2024001@siajar.test',
    name: 'Ahmad Mahasiswa',
    nim: '2024001',
    roles: ['STUDENT'],
    status: 'ACTIVE',
  },
  'mhs2024001@siajar.test': {
    id: 'a0000001-0000-0000-0000-000000000001',
    email: 'mhs2024001@siajar.test',
    name: 'Ahmad Mahasiswa',
    nim: '2024001',
    roles: ['STUDENT'],
    status: 'ACTIVE',
  },
  'mhs@siajar.ac.id': {
    id: 'a0000001-0000-0000-0000-000000000001',
    email: 'mhs2024001@siajar.test',
    name: 'Ahmad Mahasiswa',
    nim: '2024001',
    roles: ['STUDENT'],
    status: 'ACTIVE',
  },
  '0012345678': {
    id: 'a0000002-0000-0000-0000-000000000002',
    email: 'dosen001@siajar.test',
    name: 'Dr. Budi Santoso, M.Kom.',
    nidn: '0012345678',
    roles: ['LECTURER'],
    status: 'ACTIVE',
  },
  'dosen001@siajar.test': {
    id: 'a0000002-0000-0000-0000-000000000002',
    email: 'dosen001@siajar.test',
    name: 'Dr. Budi Santoso, M.Kom.',
    nidn: '0012345678',
    roles: ['LECTURER'],
    status: 'ACTIVE',
  },
  'dosen@siajar.ac.id': {
    id: 'a0000002-0000-0000-0000-000000000002',
    email: 'dosen001@siajar.test',
    name: 'Dr. Budi Santoso, M.Kom.',
    nidn: '0012345678',
    roles: ['LECTURER'],
    status: 'ACTIVE',
  },
  '2024002': {
    id: 'a0000003-0000-0000-0000-000000000003',
    email: 'mhs2024002@siajar.test',
    name: 'Citra Asisten',
    nim: '2024002',
    roles: ['STUDENT', 'TEACHING_ASSISTANT'],
    status: 'ACTIVE',
  },
  'mhs2024002@siajar.test': {
    id: 'a0000003-0000-0000-0000-000000000003',
    email: 'mhs2024002@siajar.test',
    name: 'Citra Asisten',
    nim: '2024002',
    roles: ['STUDENT', 'TEACHING_ASSISTANT'],
    status: 'ACTIVE',
  },
  'asdos@siajar.ac.id': {
    id: 'a0000003-0000-0000-0000-000000000003',
    email: 'mhs2024002@siajar.test',
    name: 'Citra Asisten',
    nim: '2024002',
    roles: ['STUDENT', 'TEACHING_ASSISTANT'],
    status: 'ACTIVE',
  },
  '0087654321': {
    id: 'a0000004-0000-0000-0000-000000000004',
    email: 'kaprodi@siajar.test',
    name: 'Prof. Dewi Lestari, Ph.D.',
    nidn: '0087654321',
    roles: ['PROGRAM_COORDINATOR', 'LECTURER'],
    status: 'ACTIVE',
  },
  'kaprodi@siajar.test': {
    id: 'a0000004-0000-0000-0000-000000000004',
    email: 'kaprodi@siajar.test',
    name: 'Prof. Dewi Lestari, Ph.D.',
    nidn: '0087654321',
    roles: ['PROGRAM_COORDINATOR', 'LECTURER'],
    status: 'ACTIVE',
  },
  'kaprodi@siajar.ac.id': {
    id: 'a0000004-0000-0000-0000-000000000004',
    email: 'kaprodi@siajar.test',
    name: 'Prof. Dewi Lestari, Ph.D.',
    nidn: '0087654321',
    roles: ['PROGRAM_COORDINATOR', 'LECTURER'],
    status: 'ACTIVE',
  },
  '198501012010121001': {
    id: 'a0000005-0000-0000-0000-000000000005',
    email: 'staf@siajar.test',
    name: 'Eko Staf Akademik',
    roles: ['ACADEMIC_STAFF'],
    status: 'ACTIVE',
  },
  'staf@siajar.test': {
    id: 'a0000005-0000-0000-0000-000000000005',
    email: 'staf@siajar.test',
    name: 'Eko Staf Akademik',
    roles: ['ACADEMIC_STAFF'],
    status: 'ACTIVE',
  },
  'staf@siajar.ac.id': {
    id: 'a0000005-0000-0000-0000-000000000005',
    email: 'staf@siajar.test',
    name: 'Eko Staf Akademik',
    roles: ['ACADEMIC_STAFF'],
    status: 'ACTIVE',
  },
  sysadmin: {
    id: 'a0000006-0000-0000-0000-000000000006',
    email: 'sysadmin@siajar.test',
    name: 'System Administrator',
    roles: ['SYSTEM_ADMIN'],
    status: 'ACTIVE',
  },
  'sysadmin@siajar.test': {
    id: 'a0000006-0000-0000-0000-000000000006',
    email: 'sysadmin@siajar.test',
    name: 'System Administrator',
    roles: ['SYSTEM_ADMIN'],
    status: 'ACTIVE',
  },
  'admin@siajar.ac.id': {
    id: 'a0000006-0000-0000-0000-000000000006',
    email: 'sysadmin@siajar.test',
    name: 'System Administrator',
    roles: ['SYSTEM_ADMIN'],
    status: 'ACTIVE',
  },
  superadmin: {
    id: 'a0000010-0000-0000-0000-000000000010',
    email: 'superadmin@siajar.test',
    name: 'Super Administrator',
    roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'ACADEMIC_STAFF', 'PROGRAM_COORDINATOR', 'LECTURER', 'STUDENT'],
    status: 'ACTIVE',
  },
  'superadmin@siajar.test': {
    id: 'a0000010-0000-0000-0000-000000000010',
    email: 'superadmin@siajar.test',
    name: 'Super Administrator',
    roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'ACADEMIC_STAFF', 'PROGRAM_COORDINATOR', 'LECTURER', 'STUDENT'],
    status: 'ACTIVE',
  },
  'superadmin@siajar.ac.id': {
    id: 'a0000010-0000-0000-0000-000000000010',
    email: 'superadmin@siajar.test',
    name: 'Super Administrator',
    roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'ACADEMIC_STAFF', 'PROGRAM_COORDINATOR', 'LECTURER', 'STUDENT'],
    status: 'ACTIVE',
  },
  '2024099': {
    id: 'a0000007-0000-0000-0000-000000000007',
    email: 'newuser@siajar.test',
    name: 'Fajar Baru',
    nim: '2024099',
    roles: ['STUDENT'],
    status: 'ACTIVE',
    mustChangePassword: true,
  },
  '2024088': {
    id: 'a0000008-0000-0000-0000-000000000008',
    email: 'locked@siajar.test',
    name: 'Gilang Terkunci',
    nim: '2024088',
    roles: ['STUDENT'],
    status: 'LOCKED',
  },
};

if (process.env.SUPERADMIN_EMAIL) {
  const customSuperAdminEmail = process.env.SUPERADMIN_EMAIL.trim().toLowerCase();
  SYNTHETIC_DEMO_USERS[customSuperAdminEmail] = {
    ...SYNTHETIC_DEMO_USERS.superadmin,
    email: customSuperAdminEmail,
  };
}
