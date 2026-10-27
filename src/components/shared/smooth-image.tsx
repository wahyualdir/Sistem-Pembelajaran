'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

export interface SmoothImageProps extends ImageProps {
  containerClassName?: string;
  aspectRatioClass?: string;
}

/**
 * Komponen Gambar Halus (M22)
 * - Pudar masuk secara mulus (--dur-base) saat onLoad selesai
 * - Menggunakan aspect-ratio agar tidak menimbulkan layout shift (CLS <= 0.05)
 * - Fallback aman dan aksesibel
 */
export function SmoothImage({
  className,
  containerClassName,
  aspectRatioClass,
  alt,
  ...props
}: SmoothImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-muted/40',
        aspectRatioClass,
        containerClassName
      )}
    >
      <Image
        alt={alt}
        className={cn(
          'transition-opacity duration-base ease-out',
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        onLoad={() => setIsLoaded(true)}
        {...props}
      />
    </div>
  );
}
