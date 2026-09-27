import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  noPad?: boolean;
}

export function GlassCard({ className, hover, noPad, children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass rounded-2xl",
        !noPad && "p-6",
        hover && "transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(99,102,241,0.15)] cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
