import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, dir = "ltr", ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      dir={dir}
      data-slot="input"
      className={cn(
        "flex h-11 w-full rounded-md border border-border bg-surface-2 px-3 text-sm text-fg shadow-none",
        "placeholder:text-fg-subtle",
        "transition-[border-color,box-shadow] duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "text-left font-mono",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
