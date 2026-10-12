import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-none border-[1.5px] border-black px-2 py-0.5 text-xs font-bold shadow-retro-sm transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "bg-black text-white",
        secondary: "bg-retro-surface text-black",
        success: "bg-success-soft text-black border-black",
        warning: "bg-warning-soft text-black border-black",
        danger: "bg-danger-soft text-black border-black",
        info: "bg-info-soft text-black border-black",
        outline: "border-[1.5px] border-black bg-white text-black",
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
