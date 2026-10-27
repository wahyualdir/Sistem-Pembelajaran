import fs from 'fs';
import path from 'path';

const ALL_ROLES = [
  'STUDENT',
  'LECTURER',
  'TEACHING_ASSISTANT',
  'PROGRAM_COORDINATOR',
  'ACADEMIC_STAFF',
  'SYSTEM_ADMIN',
  'SUPER_ADMIN',
];

function normalizeRoleCode(role) {
  if (!role) return '';
  const r = role.toUpperCase();
  if (r === 'MAHASISWA') return 'STUDENT';
  if (r === 'DOSEN') return 'LECTURER';
  if (r === 'ASISTEN' || r === 'ASDOS') return 'TEACHING_ASSISTANT';
  if (r === 'KAPRODI') return 'PROGRAM_COORDINATOR';
  if (r === 'STAF') return 'ACADEMIC_STAFF';
  if (r === 'ADMIN') return 'SYSTEM_ADMIN';
  return r;
}

function isRouteAllowedForRole(pathname, role) {
  const norm = normalizeRoleCode(role);

  if (norm === 'SYSTEM_ADMIN') {
    const isAcademic =
      pathname.startsWith('/attendance') ||
      pathname.startsWith('/analytics') ||
      pathname.startsWith('/grades') ||
      pathname.startsWith('/exams') ||
      pathname.startsWith('/classes') ||
      pathname.startsWith('/coordinator') ||
      pathname.startsWith('/student') ||
      pathname.startsWith('/lecturer') ||
      pathname.startsWith('/ta') ||
      pathname.startsWith('/staff') ||
      pathname.startsWith('/messages') ||
      pathname.startsWith('/achievements') ||
      pathname.startsWith('/evaluations') ||
      pathname.startsWith('/requests') ||
      pathname.startsWith('/flashcards') ||
      pathname.startsWith('/skill-exchange');
    if (isAcademic) return false;
    return true;
  }

  if (norm === 'SUPER_ADMIN') {
    // Tanpa impersonate
    const isAcademicOrRolePortal =
      pathname.startsWith('/attendance') ||
      pathname.startsWith('/analytics') ||
      pathname.startsWith('/grades') ||
      pathname.startsWith('/exams') ||
      pathname.startsWith('/classes') ||
      pathname.startsWith('/coordinator') ||
      pathname.startsWith('/student') ||
      pathname.startsWith('/lecturer') ||
      pathname.startsWith('/ta') ||
      pathname.startsWith('/staff') ||
      pathname.startsWith('/messages') ||
      pathname.startsWith('/achievements') ||
      pathname.startsWith('/evaluations') ||
      pathname.startsWith('/requests') ||
      pathname.startsWith('/flashcards') ||
      pathname.startsWith('/skill-exchange');
    if (isAcademicOrRolePortal) return false;
    return true;
  }

  // Proteksi admin
  if (pathname.startsWith('/admin')) {
    return false;
  }

  // Proteksi kaprodi
  if (pathname.startsWith('/coordinator')) {
    return norm === 'PROGRAM_COORDINATOR';
  }

  // Proteksi staf akademik
  if (pathname.startsWith('/staff')) {
    return norm === 'ACADEMIC_STAFF';
  }

  // Proteksi tinjau konten (Dosen, Asisten berizin, Kaprodi)
  if (pathname.startsWith('/lecturer/content-review')) {
    return norm === 'LECTURER' || norm === 'TEACHING_ASSISTANT' || norm === 'PROGRAM_COORDINATOR';
  }

  // Proteksi dosen
  if (pathname.startsWith('/lecturer')) {
    return norm === 'LECTURER' || norm === 'PROGRAM_COORDINATOR';
  }

  // Proteksi asisten
  if (pathname.startsWith('/ta')) {
    return norm === 'TEACHING_ASSISTANT';
  }

  // Proteksi flashcard dan tukar keahlian
  if (pathname.startsWith('/flashcards') || pathname.startsWith('/skill-exchange')) {
    return norm === 'STUDENT' || norm === 'TEACHING_ASSISTANT' || norm === 'LECTURER' || norm === 'PROGRAM_COORDINATOR';
  }

  // Legacy dashboard protections
  if (pathname.startsWith('/mahasiswa')) {
    return norm === 'STUDENT' || norm === 'TEACHING_ASSISTANT';
  }
  if (pathname.startsWith('/dosen')) {
    return norm === 'LECTURER' || norm === 'PROGRAM_COORDINATOR';
  }

  return true;
}

function scanPages(dir, baseDir = dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(scanPages(fullPath, baseDir));
    } else if (entry.name === 'page.tsx' || entry.name === 'page.jsx') {
      results.push(fullPath);
    }
  }
  return results;
}

function filePathToRoute(filePath) {
  // src/app/(portal)/student/page.tsx -> /student
  // src/app/(auth)/login/page.tsx -> /login
  // src/app/page.tsx -> /
  // src/app/(dashboard)/mahasiswa/krs/page.tsx -> /mahasiswa/krs
  let rel = path.relative('src/app', filePath);
  // Normalize Windows slashes
  rel = rel.replace(/\\/g, '/');
  // Remove /page.tsx
  rel = rel.replace(/\/page\.(tsx|jsx)$/, '');
  if (rel === 'page.tsx' || rel === 'page.jsx' || rel === '') {
    return '/';
  }
  // Remove route groups like (portal)/, (auth)/, (dashboard)/
  const segments = rel.split('/').filter(s => !s.startsWith('(') || !s.endsWith(')'));
  return '/' + segments.join('/');
}

function determineGroup(filePath) {
  const norm = filePath.replace(/\\/g, '/');
  if (norm.includes('src/app/(portal)')) return 'portal';
  if (norm.includes('src/app/(auth)')) return 'auth';
  if (norm.includes('src/app/(dashboard)')) return 'legacy-dashboard';
  if (norm.includes('src/app/page.tsx')) return 'landing';
  return 'other';
}

function main() {
  const targetDirs = [
    'src/app/(portal)',
    'src/app/(auth)',
    'src/app/(dashboard)',
  ];

  let pageFiles = [];
  if (fs.existsSync('src/app/page.tsx')) {
    pageFiles.push(path.resolve('src/app/page.tsx'));
  }

  for (const dir of targetDirs) {
    if (fs.existsSync(dir)) {
      pageFiles = pageFiles.concat(scanPages(path.resolve(dir)));
    }
  }

  const inventory = pageFiles.map((file) => {
    const route = filePathToRoute(file);
    const group = determineGroup(file);
    const isDynamic = route.includes('[') && route.includes(']');
    
    let allowedRoles = [];
    if (group === 'auth' || group === 'landing') {
      allowedRoles = ['PUBLIC'];
    } else {
      allowedRoles = ALL_ROLES.filter((r) => isRouteAllowedForRole(route, r));
    }

    return {
      path: route,
      file: path.relative(process.cwd(), file).replace(/\\/g, '/'),
      group,
      isDynamic,
      allowedRoles,
    };
  });

  // Sort by path
  inventory.sort((a, b) => a.path.localeCompare(b.path));

  const outPath = path.resolve('docs/routes-inventory.json');
  fs.writeFileSync(outPath, JSON.stringify(inventory, null, 2), 'utf8');
  console.log(`Berhasil menghasilkan ${inventory.length} rute di ${outPath}`);
}

main();
