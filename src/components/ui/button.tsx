import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9F1521] disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#9F1521] text-white hover:bg-[#8F131E] shadow-xs active:scale-[0.98]",
        secondary:
          "bg-[#F3F3F4] text-[#111111] hover:bg-[#E2E3E4] border border-[#E2E3E4] shadow-xs active:scale-[0.98]",
        outline:
          "bg-[#FFFFFF] text-[#111111] hover:bg-[#F3F3F4] border border-[#E2E3E4] shadow-xs active:scale-[0.98]",
        destructive:
          "bg-[#EF4444] text-white hover:bg-[#DC2626] shadow-xs active:scale-[0.98]",
        ghost:
          "border border-transparent bg-transparent hover:bg-[#F3F3F4] text-[#58595B] hover:text-[#111111] shadow-none",
        link:
          "border-0 bg-transparent text-[#9F1521] underline-offset-4 hover:underline p-0 min-h-0 shadow-none",
      },
      size: {
        default: "h-10 min-h-[2.5rem] [@media(pointer:coarse)]:min-h-[2.75rem] px-4 py-2",
        sm: "h-8 min-h-[2rem] [@media(pointer:coarse)]:min-h-[2.75rem] px-3 py-1.5 text-xs rounded-lg",
        lg: "h-11 min-h-[2.75rem] px-6 py-2.5 text-sm sm:text-base rounded-xl",
        icon: "h-10 w-10 min-h-[2.5rem] min-w-[2.5rem] [@media(pointer:coarse)]:min-h-[2.75rem] [@media(pointer:coarse)]:min-w-[2.75rem] p-0 rounded-xl",
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
