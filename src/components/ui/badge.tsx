import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-none border-[1.5px] border-black px-2 py-0.5 text-xs font-bold shadow-retro-sm transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "bg-ink text-white",
        secondary: "bg-surface text-ink",
        success: "bg-surface text-ink border-2 border-ink",
        warning: "bg-gray-soft text-ink border border-ink",
        danger: "bg-primary text-white font-bold border border-ink",
        info: "bg-gray-soft text-ink border border-ink",
        outline: "border-[1.5px] border-ink bg-surface text-ink",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
