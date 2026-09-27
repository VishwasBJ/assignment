import type { ButtonHTMLAttributes, ReactNode } from "react";

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
}

export function GlassButton({
  className = "",
  variant = "primary",
  size = "md",
  loading,
  icon,
  children,
  disabled,
  ...props
}: GlassButtonProps) {
  const variantClass = { primary: "btn-primary", ghost: "btn-ghost", danger: "btn-danger" }[variant];
  const sizeClass = { sm: "btn-sm", md: "", lg: "btn-lg" }[size];

  return (
    <button
      className={["btn", variantClass, sizeClass, className].filter(Boolean).join(" ")}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin" width="14" height="14" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      ) : icon}
      {children}
    </button>
  );
}
