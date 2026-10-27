'use client';

import React, { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          if (totalHeight > 0) {
            const currentProgress = (window.scrollY / totalHeight) * 100;
            setProgress(Math.min(100, Math.max(0, currentProgress)));
          } else {
            setProgress(0);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="scroll-progress-bar pointer-events-none"
      style={{ width: `${progress}%` }}
    />
  );
}

export function ScrollToTopButton() {
  return null;
}

interface ScrollRevealProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  animation?: 'fade-up' | 'scale' | 'slide-left' | 'slide-right';
  delay?: number;
  className?: string;
  threshold?: number;
}

export function ScrollReveal({
  children,
  animation = 'fade-up',
  delay = 0,
  className,
  threshold = 0.12,
  ...props
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Tandai elemen yang sudah terlihat saat paint pertama (menghindari kedipan)
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add('is-visible');
    }
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || el.classList.contains('is-visible')) return;

    if (!('IntersectionObserver' in window)) {
      el.classList.add('is-visible');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin: '0px 0px -30px 0px',
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  const animationClass =
    animation === 'scale'
      ? 'reveal-scale'
      : animation === 'slide-left'
      ? 'reveal-slide-left'
      : animation === 'slide-right'
      ? 'reveal-slide-right'
      : 'reveal-on-scroll';

  return (
    <div
      ref={ref}
      style={delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(animationClass, className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function ScrollAnimationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 1. Pasang kelas motion-ready di <html> setelah hidrasi (Fase 5: 6.4)
  useLayoutEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('motion-ready');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Aktifkan elemen yang berada di dalam viewport saat pertama kali halaman terbuka
    const revealVisibleNow = () => {
      const windowH = window.innerHeight;
      document
        .querySelectorAll(
          '.reveal-on-scroll:not(.is-visible), .reveal-scale:not(.is-visible), .reveal-slide-left:not(.is-visible), .reveal-slide-right:not(.is-visible)'
        )
        .forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.top < windowH && rect.bottom > 0) {
            el.classList.add('is-visible');
          }
        });
    };

    revealVisibleNow();

    if (!('IntersectionObserver' in window)) {
      document
        .querySelectorAll(
          '.reveal-on-scroll, .reveal-scale, .reveal-slide-left, .reveal-slide-right'
        )
        .forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -30px 0px',
      }
    );

    const observeElements = () => {
      const elements = document.querySelectorAll(
        '.reveal-on-scroll:not(.is-visible), .reveal-scale:not(.is-visible), .reveal-slide-left:not(.is-visible), .reveal-slide-right:not(.is-visible), [data-scroll-reveal]:not(.is-visible)'
      );
      elements.forEach((el) => observer.observe(el));
    };

    const timer = setTimeout(observeElements, 100);

    // Pengaman waktu mutlak: setelah 1.500ms seluruh elemen dipaksa tampil agar tidak pernah terjadi layar kosong
    const safetyTimer = setTimeout(() => {
      document
        .querySelectorAll(
          '.reveal-on-scroll:not(.is-visible), .reveal-scale:not(.is-visible), .reveal-slide-left:not(.is-visible), .reveal-slide-right:not(.is-visible)'
        )
        .forEach((el) => el.classList.add('is-visible'));
    }, 1500);

    // Awasi perubahan elemen dinamis
    const mutationObserver = new MutationObserver(() => {
      observeElements();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      clearTimeout(timer);
      clearTimeout(safetyTimer);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [pathname]);

  return (
    <>
      <ScrollProgressBar />
      {children}
    </>
  );
}
