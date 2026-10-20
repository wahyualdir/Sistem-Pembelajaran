'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowUp } from 'lucide-react';
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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let ticking = false;

    const checkScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsVisible(window.scrollY > 280);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();

    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Kembali ke atas halaman"
      title="Kembali ke atas"
      className={cn(
        'scroll-to-top-btn flex items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 border-ink bg-surface text-ink font-heading font-bold text-xs shadow-retro hover:bg-ink hover:text-white hover:-translate-y-1 active:translate-y-0.5 focus-visible:outline-none cursor-pointer',
        isVisible
          ? 'opacity-100 scale-100 pointer-events-auto'
          : 'opacity-0 scale-90 pointer-events-none'
      )}
    >
      <ArrowUp className="h-4 w-4" />
      <span className="hidden sm:inline">Atas</span>
    </button>
  );
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

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Check if IntersectionObserver is supported
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
        rootMargin: '0px 0px -40px 0px',
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

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

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

    // Run initial observe
    const timer = setTimeout(observeElements, 100);

    // Watch for DOM mutations
    const mutationObserver = new MutationObserver(() => {
      observeElements();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [pathname]);

  return (
    <>
      <ScrollProgressBar />
      {children}
      <ScrollToTopButton />
    </>
  );
}
