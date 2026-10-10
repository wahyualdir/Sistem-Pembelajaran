import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-none sm:rounded-[2px] text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:pointer-events-none disabled:opacity-50 min-h-[36px] px-4 py-2 border-2 border-black active:translate-x-0.5 active:translate-y-0.5 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-white text-black shadow-[2.5px_2.5px_0px_#000000] hover:bg-black hover:text-white active:shadow-[1px_1px_0px_#000000]",
        destructive:
          "bg-black text-white shadow-[2.5px_2.5px_0px_#000000] hover:bg-white hover:text-black active:shadow-[1px_1px_0px_#000000]",
        outline:
          "bg-white text-black shadow-[2.5px_2.5px_0px_#000000] hover:bg-[#EAEAEA] active:shadow-[1px_1px_0px_#000000]",
        secondary:
          "bg-[#EFEFEF] text-black shadow-[2.5px_2.5px_0px_#000000] hover:bg-white active:shadow-[1px_1px_0px_#000000]",
        ghost:
          "border-transparent bg-transparent hover:bg-[#EAEAEA] text-black",
        link:
          "border-transparent bg-transparent text-black underline-offset-4 hover:underline p-0 min-h-0",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-2.5 text-xs",
        lg: "h-11 px-6 text-sm",
        icon: "h-9 w-9 p-0",
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
