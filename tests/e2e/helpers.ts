import { expect, type Page } from '@playwright/test';

export async function loginAsRole(page: Page, identifier: string, expectedPath: RegExp | string) {
  await page.goto('/login');
  const submitBtn = page.locator('button[type="submit"]');
  await expect(submitBtn).toBeVisible({ timeout: 15000 });

  await page.getByLabel('NIM / NIDN / NIP / Email / Username').fill(identifier);
  await page.locator('#password').fill(process.env.DEMO_PASSWORD || 'Password123!');
  await submitBtn.click();
  await page.waitForURL(expectedPath, { timeout: 20000 });
}
