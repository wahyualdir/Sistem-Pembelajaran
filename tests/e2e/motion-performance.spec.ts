import { test, expect } from '@playwright/test';

test.describe('SIAJAR Motion System & Performance Verification (Fase 8)', () => {
  test.setTimeout(60000);

  test('1. Preferensi data-motion="mati" meruntuhkan seluruh token durasi menjadi ~0.01ms dan konten tetap terlihat', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Set data-motion="mati"
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-motion', 'mati');
    });

    const tokenDurations = await page.evaluate(() => {
      const style = window.getComputedStyle(document.documentElement);
      return {
        durInstant: style.getPropertyValue('--dur-instant').trim(),
        durFast: style.getPropertyValue('--dur-fast').trim(),
        durBase: style.getPropertyValue('--dur-base').trim(),
        durSlow: style.getPropertyValue('--dur-slow').trim(),
        durData: style.getPropertyValue('--dur-data').trim(),
      };
    });

    expect(tokenDurations.durInstant).toBe('0.01ms');
    expect(tokenDurations.durFast).toBe('0.01ms');
    expect(tokenDurations.durBase).toBe('0.01ms');
    expect(tokenDurations.durSlow).toBe('0.01ms');
    expect(tokenDurations.durData).toBe('0.01ms');

    // Verifikasi konten tetap terlihat (tidak ada blank atau opacity 0 yang menetap)
    const isHeadingVisible = await page.isVisible('h1, h2, form');
    expect(isHeadingVisible).toBe(true);
  });

  test('2. Preferensi prefers-reduced-motion: reduce mengaktifkan mode hemat gerak', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const reducedValues = await page.evaluate(() => {
      const style = window.getComputedStyle(document.documentElement);
      return {
        durData: style.getPropertyValue('--dur-data').trim(),
        stagger: style.getPropertyValue('--stagger').trim(),
      };
    });

    // Pada reduced-motion / hemat, dur-data dan stagger runtuh ke 0/0.01ms
    expect(reducedValues.durData).toMatch(/0(\.01)?ms/);
    expect(reducedValues.stagger).toMatch(/0(\.01)?ms/);
  });

  test('3. Pengukuran CLS (Cumulative Layout Shift) harus <= 0.05 pada pemuatan halaman', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Hitung CLS menggunakan PerformanceObserver
    const clsScore = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let cls = 0;
        const observer = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value;
            }
          }
        });
        observer.observe({ type: 'layout-shift', buffered: true });

        // Tunggu 500ms untuk menangkap shift
        setTimeout(() => {
          observer.disconnect();
          resolve(cls);
        }, 500);
      });
    });

    // Anggaran CLS <= 0.05
    expect(clsScore).toBeLessThanOrEqual(0.05);
  });

  test('4. Tidak ada elemen konten yang memiliki animasi infinite pulse/bounce yang mengganggu', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const activeInfiniteContentAnimations = await page.evaluate(() => {
      const contentElements = Array.from(document.querySelectorAll('main *, form *, .portal-page-enter *'));
      const offenders: string[] = [];
      for (const el of contentElements) {
        const style = window.getComputedStyle(el);
        if (
          style.animationIterationCount === 'infinite' &&
          !el.classList.contains('animate-shimmer') &&
          !el.closest('[aria-busy="true"]') &&
          !el.closest('.loading-skeleton')
        ) {
          // Hanya hitung jika elemen benar-benar terlihat dan berada di area konten utama
          const rect = el.getBoundingClientRect();
          if (rect.width > 20 && rect.height > 20) {
            offenders.push(el.tagName + '.' + el.className);
          }
        }
      }
      return offenders;
    });

    expect(activeInfiniteContentAnimations.length).toBe(0);
  });
});
