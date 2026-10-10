import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-none border-[1.5px] border-black px-2 py-0.5 text-[11px] font-bold shadow-[1.5px_1.5px_0px_#000000] transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "bg-black text-white",
        secondary: "bg-[#EFEFEF] text-black",
        success: "bg-white text-black",
        warning: "bg-[#E5E5E5] text-black",
        danger: "bg-black text-white",
        info: "bg-[#F5F5F5] text-black",
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
