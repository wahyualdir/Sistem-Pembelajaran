import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-none text-xs sm:text-sm font-bold transition-all duration-instant ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C2553A] disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#C2553A] text-white hover:bg-[#B84A2B] border-t-2 border-l-2 border-[#EE7257] border-b-2 border-r-2 border-[#6B2D20] active:border-t-[#6B2D20] active:border-l-[#6B2D20] active:border-b-[#EE7257] active:border-r-[#EE7257] active:translate-y-px shadow-xs",
        secondary:
          "bg-[#ECE9D8] text-[#1C1917] hover:bg-[#F2EFE8] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-[#7A756D] active:border-t-[#7A756D] active:border-l-[#7A756D] active:border-b-white active:border-r-white active:translate-y-px shadow-2xs",
        outline:
          "bg-white text-[#1C1917] hover:bg-[#F4EFEB] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-[#8A857D] shadow-2xs active:translate-y-px",
        destructive:
          "bg-[#EF4444] text-white hover:bg-[#DC2626] border-t-2 border-l-2 border-[#FCA5A5] border-b-2 border-r-2 border-[#991B1B] shadow-xs active:translate-y-px",
        ghost:
          "border border-transparent bg-transparent hover:bg-[#ECE9D8] text-[#1C1917] shadow-none",
        link:
          "border-0 bg-transparent text-[#C2553A] underline-offset-4 hover:underline p-0 min-h-0 shadow-none",
      },
      size: {
        default: "h-10 min-h-[2.5rem] [@media(pointer:coarse)]:min-h-[2.75rem] px-4 py-2",
        sm: "h-8 min-h-[2rem] [@media(pointer:coarse)]:min-h-[2.75rem] px-3 py-1.5 text-xs",
        lg: "h-11 min-h-[2.75rem] px-6 py-2.5 text-sm sm:text-base",
        icon: "h-10 w-10 min-h-[2.5rem] min-w-[2.5rem] [@media(pointer:coarse)]:min-h-[2.75rem] [@media(pointer:coarse)]:min-w-[2.75rem] p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
