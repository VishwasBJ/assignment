import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className = "", label, error, icon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        {label && <label htmlFor={inputId} className="label">{label}</label>}
        <div style={{ position: "relative" }}>
          {icon && (
            <span style={{
              position: "absolute", left: "0.75rem", top: "50%",
              transform: "translateY(-50%)", color: "#475569", pointerEvents: "none",
              display: "flex", alignItems: "center"
            }}>
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={["input", error ? "error" : "", className].filter(Boolean).join(" ")}
            style={icon ? { paddingLeft: "2.25rem" } : undefined}
            {...props}
          />
        </div>
        {error && <span style={{ fontSize: "0.75rem", color: "#f87171" }}>{error}</span>}
      </div>
    );
  }
);
GlassInput.displayName = "GlassInput";

interface GlassTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const GlassTextarea = forwardRef<HTMLTextAreaElement, GlassTextareaProps>(
  ({ className = "", label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        {label && <label htmlFor={inputId} className="label">{label}</label>}
        <textarea
          ref={ref}
          id={inputId}
          className={["input", error ? "error" : "", className].filter(Boolean).join(" ")}
          {...props}
        />
        {error && <span style={{ fontSize: "0.75rem", color: "#f87171" }}>{error}</span>}
      </div>
    );
  }
);
GlassTextarea.displayName = "GlassTextarea";
