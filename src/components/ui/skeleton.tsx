import { cn } from "@/lib/utils";

/**
 * Komponen Skeleton Pemegang Ruang (M14)
 * - Efek shimmer berkilau halus saat memuat data
 * - Mati total saat mode prefers-reduced-motion atau data-motion="mati"
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-control bg-muted/60",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent motion-reduce:before:hidden",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
