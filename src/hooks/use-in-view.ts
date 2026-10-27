'use client';

import { useState, useEffect, RefObject } from 'react';

export interface UseInViewOptions {
  once?: boolean;
  rootMargin?: string;
  threshold?: number | number[];
}

/**
 * Hook deteksi elemen masuk ke area pandang (viewport)
 * Mendukung opsi sekali saja (`once = true`) dan toleransi margin.
 */
export function useInView(
  ref: RefObject<Element | null>,
  options: UseInViewOptions = {}
): boolean {
  const {
    once = true,
    rootMargin = '0px 0px -40px 0px',
    threshold = 0.1,
  } = options;

  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            if (once) {
              observer.unobserve(entry.target);
            }
          } else if (!once) {
            setIsInView(false);
          }
        });
      },
      { rootMargin, threshold }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [ref, once, rootMargin, threshold]);

  return isInView;
}
