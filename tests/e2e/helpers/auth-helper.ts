import { Page, expect } from '@playwright/test';

export type UserRole =
  | 'STUDENT'
  | 'LECTURER'
  | 'TEACHING_ASSISTANT'
  | 'PROGRAM_COORDINATOR'
  | 'ACADEMIC_STAFF'
  | 'SYSTEM_ADMIN'
  | 'SUPER_ADMIN';

export const DEMO_CREDENTIALS: Record<UserRole, { identifier: string; password: string; expectedPath: string }> = {
  STUDENT: {
    identifier: '2024001',
    password: process.env.DEMO_PASSWORD || 'Password123!',
    expectedPath: '/student',
  },
  LECTURER: {
    identifier: '0012345678',
    password: process.env.DEMO_PASSWORD || 'Password123!',
    expectedPath: '/lecturer',
  },
  TEACHING_ASSISTANT: {
    identifier: '2024002',
    password: process.env.DEMO_PASSWORD || 'Password123!',
    expectedPath: '/ta',
  },
  PROGRAM_COORDINATOR: {
    identifier: '0087654321',
    password: process.env.DEMO_PASSWORD || 'Password123!',
    expectedPath: '/coordinator',
  },
  ACADEMIC_STAFF: {
    identifier: '198803152015042002',
    password: process.env.DEMO_PASSWORD || 'Password123!',
    expectedPath: '/staff',
  },
  SYSTEM_ADMIN: {
    identifier: 'admin',
    password: process.env.SUPERADMIN_PASSWORD || process.env.DEMO_PASSWORD || 'Password123!',
    expectedPath: '/admin',
  },
  SUPER_ADMIN: {
    identifier: 'superadmin@siajar.test',
    password: process.env.SUPERADMIN_PASSWORD || process.env.DEMO_PASSWORD || 'Password123!',
    expectedPath: '/admin',
  },
};

export async function loginAs(page: Page, role: UserRole): Promise<void> {
  const creds = DEMO_CREDENTIALS[role];
  if (!creds) throw new Error(`Role ${role} tidak memiliki kredensial demo`);

  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  await page.fill('input#identifier', creds.identifier);
  await page.fill('input#password', creds.password);

  // Jika ada captcha di halaman login
  const captchaInput = page.locator('input#captcha');
  if (await captchaInput.isVisible()) {
    // Cari label pertanyaan captcha, misal "Berapa 5 + 3 ?"
    const labelText = await page.locator('label[for="captcha"]').innerText().catch(() => '');
    const match = labelText.match(/(\d+)\s*\+\s*(\d+)/);
    if (match) {
      const sum = parseInt(match[1], 10) + parseInt(match[2], 10);
      await captchaInput.fill(String(sum));
    }
  }

  await page.click('button[type="submit"]');

  // Khusus asisten dosen (multi-role student + TA), pilih ruang kerja jika muncul /workspace
  if (role === 'TEACHING_ASSISTANT') {
    try {
      await page.waitForURL('**/workspace', { timeout: 4000 });
      const taForm = page.locator('form').filter({ hasText: /asisten/i }).first();
      if (await taForm.isVisible()) {
        await taForm.locator('button[type="submit"]').click();
      }
    } catch {
      // Jika langsung dialihkan ke /ta
    }
  }

  await page.waitForURL(`**${creds.expectedPath}*`, { timeout: 15000, waitUntil: 'domcontentloaded' });
}
