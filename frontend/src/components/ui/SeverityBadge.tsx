import type { Severity } from "@/lib/types";

interface SeverityBadgeProps {
  severity: Severity | string;
  size?: "sm" | "md";
}

export function SeverityBadge({ severity, size = "md" }: SeverityBadgeProps) {
  const cls = `badge badge-${severity?.toLowerCase()}`;
  return (
    <span className={cls} style={size === "sm" ? { fontSize: "0.65rem", padding: "0.15rem 0.45rem" } : undefined}>
      {severity}
    </span>
  );
}
