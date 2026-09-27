import type { HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  noPad?: boolean;
}

export function GlassCard({ className = "", hover, noPad, children, ...props }: GlassCardProps) {
  return (
    <div
      className={["card", hover ? "card-hover" : "", noPad ? "!p-0" : "", className]
        .filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
