import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-input bg-background/80 px-3 py-2 text-sm font-medium text-foreground shadow-sm outline-none transition-all duration-200 placeholder:text-muted-foreground/65 hover:border-primary/35 hover:bg-background focus:border-primary focus:bg-primary/[0.035] focus:ring-4 focus:ring-primary/10 focus:shadow-md file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:bg-muted/60 disabled:opacity-60 md:text-sm",
          "aria-invalid:border-destructive aria-invalid:ring-destructive/10",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
