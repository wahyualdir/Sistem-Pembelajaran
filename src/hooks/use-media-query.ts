import { useSyncExternalStore } from 'react';

/**
 * Hook media query berbasis useSyncExternalStore yang aman dari hydration mismatch.
 * Server snapshot default bernilai false untuk mencegah kilatan layout desktop di mobile.
 */
export function useMediaQuery(query: string, serverDefault = false): boolean {
  return useSyncExternalStore(
    (callback) => {
      if (typeof window === 'undefined') {
        return () => {};
      }
      const mediaQueryList = window.matchMedia(query);
      mediaQueryList.addEventListener('change', callback);
      return () => {
        mediaQueryList.removeEventListener('change', callback);
      };
    },
    () => {
      if (typeof window === 'undefined') {
        return serverDefault;
      }
      return window.matchMedia(query).matches;
    },
    () => serverDefault
  );
}
