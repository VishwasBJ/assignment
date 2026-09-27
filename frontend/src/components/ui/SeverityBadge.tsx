import { cn, severityColor } from "@/lib/utils";
import type { Severity } from "@/lib/types";

interface SeverityBadgeProps {
  severity: Severity | string;
  size?: "sm" | "md";
}

export function SeverityBadge({ severity, size = "md" }: SeverityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold rounded-full border tracking-wide uppercase",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
        severityColor(severity)
      )}
    >
      {severity}
    </span>
  );
}
