import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[100px] w-full resize-y rounded-xl border border-input bg-background/80 px-3 py-2.5 text-sm font-medium text-foreground shadow-sm outline-none transition-all duration-200 placeholder:text-muted-foreground/65 hover:border-primary/35 hover:bg-background focus:border-primary focus:bg-primary/[0.035] focus:ring-4 focus:ring-primary/10 focus:shadow-md disabled:cursor-not-allowed disabled:bg-muted/60 disabled:opacity-60",
          "aria-invalid:border-destructive aria-invalid:ring-destructive/10",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
