import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[2px] text-xs sm:text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:pointer-events-none disabled:opacity-50 border-2 border-black active:translate-x-0.5 active:translate-y-0.5 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-white text-black shadow-retro hover:bg-black hover:text-white active:shadow-retro-sm",
        destructive:
          "bg-black text-white shadow-retro hover:bg-white hover:text-black active:shadow-retro-sm",
        outline:
          "bg-white text-black shadow-retro hover:bg-gray-soft active:shadow-retro-sm",
        secondary:
          "bg-retro-surface text-black shadow-retro hover:bg-white active:shadow-retro-sm",
        ghost:
          "border-transparent bg-transparent hover:bg-gray-soft text-black shadow-none",
        link:
          "border-transparent bg-transparent text-black underline-offset-4 hover:underline p-0 min-h-0 shadow-none",
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
