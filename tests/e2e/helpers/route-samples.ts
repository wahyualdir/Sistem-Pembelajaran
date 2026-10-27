/**
 * Pemetaan rute dinamis ([id], [...slug], dsb.) ke contoh URL konkret dari data demo.
 */
export const DYNAMIC_ROUTE_SAMPLES: Record<string, string> = {
  '/admin/[...slug]': '/admin/system/audit',
  '/analytics/[...slug]': '/analytics/overview',
  '/attendance/[...slug]': '/attendance/history',
  '/classes/[id]': '/classes/c0000000-0000-0000-0000-000000000001',
  '/classes/[id]/attendance': '/classes/c0000000-0000-0000-0000-000000000001/attendance',
  '/classes/[id]/gradebook': '/classes/c0000000-0000-0000-0000-000000000001/gradebook',
  '/coordinator/[...slug]': '/coordinator/evaluations',
  '/exams/[...slug]': '/exams/history',
  '/grades/[...slug]': '/grades/history',
  '/lecturer/[...slug]': '/lecturer/journals',
  '/staff/[...slug]': '/staff/classes',
  '/verify/certificate/[code]': '/verify/certificate/CERT-2026-DEMO',
};

/**
 * Menyelesaikan rute (jika dinamis, ubah ke URL sampel nyata).
 */
export function resolveSampleUrl(routePath: string): string {
  if (DYNAMIC_ROUTE_SAMPLES[routePath]) {
    return DYNAMIC_ROUTE_SAMPLES[routePath];
  }
  return routePath;
}
