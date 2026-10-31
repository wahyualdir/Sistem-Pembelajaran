import { expect, type Page } from '@playwright/test';

export async function loginAsRole(page: Page, identifier: string, expectedPath: RegExp | string) {
  await page.goto('/login');
  const submitBtn = page.locator('button[type="submit"]');
  await expect(submitBtn).toBeVisible({ timeout: 15000 });

  const idInput = page.locator('#identifier');
  if (await idInput.count() > 0) {
    await idInput.fill(identifier);
  } else {
    await page.getByLabel(/NIM/i).first().fill(identifier);
  }
  await page.locator('#password').fill(process.env.DEMO_PASSWORD || 'Password123!');
  await submitBtn.click();
  await page.waitForURL(expectedPath, { timeout: 45000 });
}
