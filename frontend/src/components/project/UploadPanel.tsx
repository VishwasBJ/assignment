"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api";
import { GlassModal } from "@/components/ui/GlassModal";
import { GlassButton } from "@/components/ui/GlassButton";
import { formatBytes } from "@/lib/utils";
import { Upload, FileText, X, FolderOpen } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onUploaded: () => void;
}

export function UploadPanel({ open, onClose, projectId, onUploaded }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...accepted.filter(f => !existing.has(f.name))];
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    // Accept all file types — backend filters to text/code only
  });

  const removeFile = (name: string) => setFiles(p => p.filter(f => f.name !== name));

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    try {
      const form = new FormData();
      files.forEach(f => {
        form.append("files", f);
        form.append("paths", f.name);
      });
      // DO NOT set Content-Type manually — browser must set it with the multipart boundary
      await apiClient.post(`/projects/${projectId}/files/upload`, form);
      setFiles([]);
      onUploaded();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <GlassModal open={open} onClose={onClose} title="Upload Files" size="lg">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? "rgba(99,102,241,0.7)" : "rgba(255,255,255,0.15)"}`,
          borderRadius: "0.875rem",
          padding: "2.5rem 1.5rem",
          textAlign: "center",
          cursor: "pointer",
          background: isDragActive ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.02)",
          transition: "all 0.2s",
        }}
        onMouseEnter={e => {
          if (!isDragActive) {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.45)";
            (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.05)";
          }
        }}
        onMouseLeave={e => {
          if (!isDragActive) {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)";
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)";
          }
        }}
      >
        <input {...getInputProps()} />
        <Upload size={32} style={{ color: "#475569", margin: "0 auto 0.75rem", display: "block" }} />
        <p style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.375rem" }}>
          {isDragActive ? "Drop your files here" : "Drag & drop files or click to browse"}
        </p>
        <p style={{ color: "#475569", fontSize: "0.8125rem" }}>
          .ts .js .py .java .go .rs .json .yaml .css .html and more
        </p>
      </div>

      {/* Also allow folder/directory picks via a separate input */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: "0.75rem" }}>
        <label style={{
          display: "inline-flex", alignItems: "center", gap: "0.4rem",
          cursor: "pointer", fontSize: "0.8125rem", color: "#64748b",
          padding: "0.375rem 0.75rem", borderRadius: "0.5rem",
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          transition: "color 0.15s, background 0.15s",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f1f5f9"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#64748b"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
        >
          <FolderOpen size={13} />
          Or pick a folder
          <input
            type="file"
            style={{ display: "none" }}
            // @ts-ignore — webkitdirectory is valid but not in TS types
            webkitdirectory="true"
            multiple
            onChange={e => {
              const picked = Array.from(e.target.files ?? []);
              setFiles(prev => {
                const existing = new Set(prev.map(f => f.name));
                return [...prev, ...picked.filter(f => !existing.has(f.name))];
              });
            }}
          />
        </label>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div style={{
          marginTop: "1rem",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "0.75rem",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "0.5rem 0.875rem",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            fontSize: "0.75rem", color: "#475569", fontWeight: 600,
          }}>
            {files.length} file{files.length !== 1 ? "s" : ""} selected
          </div>
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            {files.map(f => (
              <div key={f.name} style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.5rem 0.875rem",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}>
                <FileText size={13} style={{ color: "#818cf8", flexShrink: 0 }} />
                <span style={{
                  flex: 1, fontSize: "0.8125rem", color: "#e2e8f0",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {f.name}
                </span>
                <span style={{ fontSize: "0.75rem", color: "#334155", flexShrink: 0 }}>
                  {formatBytes(f.size)}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); removeFile(f.name); }}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#334155", padding: "0.125rem", display: "flex", flexShrink: 0,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#334155")}
                  aria-label={`Remove ${f.name}`}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
        <GlassButton variant="ghost" onClick={onClose} type="button">
          Cancel
        </GlassButton>
        <GlassButton
          onClick={handleUpload}
          loading={uploading}
          disabled={!files.length}
          icon={<Upload size={14} />}
          type="button"
        >
          {files.length > 0
            ? `Upload ${files.length} file${files.length > 1 ? "s" : ""}`
            : "Upload"}
        </GlassButton>
      </div>
    </GlassModal>
  );
}
