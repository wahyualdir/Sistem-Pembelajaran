import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 min-h-[2.5rem] [@media(pointer:coarse)]:min-h-[2.75rem] w-full rounded-[2px] border-2 border-black bg-white px-3 py-2 text-base sm:text-sm text-black shadow-retro ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:shadow-retro-md disabled:cursor-not-allowed disabled:opacity-50 transition-shadow",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
