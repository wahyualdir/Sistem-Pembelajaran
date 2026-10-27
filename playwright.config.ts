import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // 1. Desktop baseline yang sudah ada (tidak diubah)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // 2. Matriks Perangkat Responsif & iPad (Bagian 4.2 INSTRUKSI_RESPONSIF_ANIMASI.md)
    {
      name: 'iphone-se',
      use: { ...devices['iPhone SE'] },
    },
    {
      name: 'iphone-14',
      use: { ...devices['iPhone 14'] },
    },
    {
      name: 'iphone-14-pro-max',
      use: { ...devices['iPhone 14 Pro Max'] },
    },
    {
      name: 'pixel-7',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'mobile-small',
      use: {
        browserName: 'chromium',
        viewport: { width: 360, height: 640 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'phone-landscape',
      use: {
        ...devices['iPhone 14 landscape'],
      },
    },
    {
      name: 'ipad-mini-portrait',
      use: {
        browserName: 'webkit',
        viewport: { width: 744, height: 1133 },
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      },
    },
    {
      name: 'ipad-10-portrait',
      use: {
        browserName: 'webkit',
        viewport: { width: 810, height: 1080 },
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      },
    },
    {
      name: 'ipad-pro-11-portrait',
      use: { ...devices['iPad Pro 11'] },
    },
    {
      name: 'ipad-air-landscape',
      use: {
        browserName: 'webkit',
        viewport: { width: 1180, height: 820 },
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      },
    },
    {
      name: 'ipad-10-landscape',
      use: {
        browserName: 'webkit',
        viewport: { width: 1080, height: 810 },
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      },
    },
    {
      name: 'ipad-pro-12-portrait',
      use: {
        browserName: 'webkit',
        viewport: { width: 1024, height: 1366 },
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      },
    },
    {
      name: 'ipad-pro-12-landscape',
      use: {
        browserName: 'webkit',
        viewport: { width: 1366, height: 1024 },
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      },
    },
    {
      name: 'ipad-split-view-narrow',
      use: {
        browserName: 'chromium',
        viewport: { width: 320, height: 1024 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'laptop-hd',
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'laptop-widescreen',
      use: {
        browserName: 'chromium',
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
