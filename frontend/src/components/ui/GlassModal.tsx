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

  const panelClass = `modal-panel modal-${size}`;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-backdrop" style={{ position: "absolute", inset: 0 }} onClick={onClose} aria-hidden="true" />
      <div className={panelClass} style={{ position: "relative", zIndex: 1 }}>
        {title && (
          <div className="modal-header">
            <h2 style={{ fontSize: "1.05rem", fontWeight: 600, color: "#f1f5f9", margin: 0 }}>{title}</h2>
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
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
