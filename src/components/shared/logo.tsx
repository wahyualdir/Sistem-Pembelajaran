import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, showText = true, size = "md" }: LogoProps) {
  const box = { sm: "h-7 w-7", md: "h-8 w-8", lg: "h-10 w-10" }[size];
  return (
    <div className={cn("inline-flex select-none items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-control bg-primary text-primary-foreground",
          box
        )}
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-[58%] w-[58%]" aria-hidden="true">
          <path d="M5 7h14M5 12h14M5 17h8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </span>
      {showText && (
        <span className="font-heading font-black text-base tracking-tight text-[#1C1917] leading-none">
          Ruang<span className="text-[#C2553A]">Kampus</span>
        </span>
      )}
    </div>
  );
}
