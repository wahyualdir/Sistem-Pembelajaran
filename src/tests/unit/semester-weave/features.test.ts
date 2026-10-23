import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Feature Flag FF_KAIN_SEMESTER', () => {
  const originalEnv = process.env.FF_KAIN_SEMESTER;

  afterEach(() => {
    process.env.FF_KAIN_SEMESTER = originalEnv;
    vi.resetModules();
  });

  it('default bernilai false bila environment variable tidak diset', async () => {
    delete process.env.FF_KAIN_SEMESTER;
    vi.resetModules();
    const { FEATURE_FLAGS, isFeatureFlagActive } = await import('@/lib/config/features');
    expect(FEATURE_FLAGS.FF_KAIN_SEMESTER).toBe(false);
    expect(isFeatureFlagActive('FF_KAIN_SEMESTER')).toBe(false);
  });

  it('bernilai false bila environment variable diset "false" atau string lain', async () => {
    process.env.FF_KAIN_SEMESTER = 'false';
    vi.resetModules();
    const { FEATURE_FLAGS, isFeatureFlagActive } = await import('@/lib/config/features');
    expect(FEATURE_FLAGS.FF_KAIN_SEMESTER).toBe(false);
    expect(isFeatureFlagActive('FF_KAIN_SEMESTER')).toBe(false);

    process.env.FF_KAIN_SEMESTER = '1';
    vi.resetModules();
    const { isFeatureFlagActive: is1 } = await import('@/lib/config/features');
    expect(is1('FF_KAIN_SEMESTER')).toBe(false);
  });

  it('bernilai true hanya bila environment variable diset tepat "true"', async () => {
    process.env.FF_KAIN_SEMESTER = 'true';
    vi.resetModules();
    const { FEATURE_FLAGS, isFeatureFlagActive } = await import('@/lib/config/features');
    expect(FEATURE_FLAGS.FF_KAIN_SEMESTER).toBe(true);
    expect(isFeatureFlagActive('FF_KAIN_SEMESTER')).toBe(true);
  });
});
