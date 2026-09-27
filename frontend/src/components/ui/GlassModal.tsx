"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface GlassModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function GlassModal({ open, onClose, title, children, size = "md" }: GlassModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!open) return null;

  const widths: Record<string, string> = {
    sm: "28rem", md: "34rem", lg: "48rem", xl: "64rem",
  };

  return (
    /* Outer overlay — clicking the dark area closes the modal */
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      {/* Panel — stop propagation so clicks inside don't close the modal */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "relative", zIndex: 1,
          width: "100%", maxWidth: widths[size],
          maxHeight: "90vh", overflowY: "auto",
          background: "rgba(13,13,40,0.98)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "1.25rem",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
          animation: "fadeIn 0.2s ease-out both",
        }}
      >
        {title && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 600, color: "#f1f5f9", margin: 0 }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-icon"
              aria-label="Close"
              style={{ padding: "0.3rem" }}
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div style={{ padding: "1.5rem" }}>{children}</div>
      </div>
    </div>
  );
}
