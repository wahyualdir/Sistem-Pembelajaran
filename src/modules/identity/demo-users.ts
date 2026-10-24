import type { UserStatus } from '@/lib/supabase/types';
import {
  SEED_MAHASISWA_UIR,
  SEED_DOSEN_UIR,
} from '@/lib/db/seed-data.uir-ti-2026.generated';

export interface SyntheticDemoUser {
  id: string;
  email: string;
  name: string;
  nim?: string;
  nidn?: string;
  subId?: string;
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

const ASDOS_NIMS = new Set([
  '233510001', '233510002', '233510006', '233510007',
  '233510008', '233510012', '233510013', '233510018',
  '233510019', '233510024', '233510025', '233510030',
  '243510006', '243510007', '243510012', '243510024',
]);

// 1. Registrasikan 120 Mahasiswa UIR
for (const m of SEED_MAHASISWA_UIR) {
  const isAsdos = ASDOS_NIMS.has(m.nim);
  const userObj: SyntheticDemoUser = {
    id: `u-mhs-${m.nim}`,
    email: m.email,
    name: m.nama,
    nim: m.nim,
    subId: m.id,
    roles: isAsdos ? ['STUDENT', 'TEACHING_ASSISTANT'] : ['STUDENT'],
    status: 'ACTIVE',
  };
  SYNTHETIC_DEMO_USERS[m.nim] = userObj;
  SYNTHETIC_DEMO_USERS[m.email] = userObj;
  SYNTHETIC_DEMO_USERS[userObj.id] = userObj;
}

// 2. Registrasikan 42 Dosen UIR
for (const d of SEED_DOSEN_UIR) {
  const isKaprodi = d.penandaKaprodi;
  const userObj: SyntheticDemoUser = {
    id: `u-dsn-${d.id}`,
    email: d.email,
    name: d.nama,
    nidn: d.nidn,
    subId: d.id,
    roles: isKaprodi ? ['PROGRAM_COORDINATOR', 'LECTURER'] : ['LECTURER'],
    status: 'ACTIVE',
  };
  SYNTHETIC_DEMO_USERS[d.nidn] = userObj;
  SYNTHETIC_DEMO_USERS[d.email] = userObj;
  SYNTHETIC_DEMO_USERS[d.id] = userObj;
  SYNTHETIC_DEMO_USERS[userObj.id] = userObj;
}

// 3. Registrasikan 6 Staf & Admin UIR
const STAF_ADMIN_UIR = [
  { nip: '20120009', nama: 'Rahmat Hidayat, S.Kom.', email: '20120009@staf.siajar.test', roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'ACADEMIC_STAFF', 'PROGRAM_COORDINATOR', 'LECTURER', 'STUDENT'] },
  { nip: '20160042', nama: 'Bambang Prasetyo, S.Kom.', email: '20160042@staf.siajar.test', roles: ['SYSTEM_ADMIN'] },
  { nip: '20180055', nama: 'Agus Setiawan, M.Kom.', email: '20180055@staf.siajar.test', roles: ['SYSTEM_ADMIN'] },
  { nip: '20110017', nama: 'Siti Nurhaliza, A.Md.', email: '20110017@staf.siajar.test', roles: ['ACADEMIC_STAFF'] },
  { nip: '20150028', nama: 'Rudi Hartono, S.Sos.', email: '20150028@staf.siajar.test', roles: ['ACADEMIC_STAFF'] },
  { nip: '20190033', nama: 'Fitri Handayani, S.Ak.', email: '20190033@staf.siajar.test', roles: ['ACADEMIC_STAFF'] },
];

for (const s of STAF_ADMIN_UIR) {
  const userObj: SyntheticDemoUser = {
    id: `u-staf-${s.nip}`,
    email: s.email,
    name: s.nama,
    subId: `staf-${s.nip}`,
    roles: s.roles,
    status: 'ACTIVE',
  };
  SYNTHETIC_DEMO_USERS[s.nip] = userObj;
  SYNTHETIC_DEMO_USERS[s.email] = userObj;
  SYNTHETIC_DEMO_USERS[userObj.id] = userObj;
}

if (process.env.SUPERADMIN_EMAIL) {
  const customSuperAdminEmail = process.env.SUPERADMIN_EMAIL.trim().toLowerCase();
  SYNTHETIC_DEMO_USERS[customSuperAdminEmail] = {
    ...SYNTHETIC_DEMO_USERS.superadmin,
    email: customSuperAdminEmail,
  };
}
