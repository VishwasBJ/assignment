"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api";
import { GlassModal } from "@/components/ui/GlassModal";
import { GlassButton } from "@/components/ui/GlassButton";
import { formatBytes } from "@/lib/utils";
import { Upload, FileText, X } from "lucide-react";

interface Props { open: boolean; onClose: () => void; projectId: string; onUploaded: () => void; }

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
    onDrop, multiple: true,
  });

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    try {
      const form = new FormData();
      files.forEach(f => { form.append("files", f); form.append("paths", f.name); });
      await apiClient.post(`/projects/${projectId}/files/upload`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFiles([]); onUploaded();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Upload failed");
    } finally { setUploading(false); }
  };

  return (
    <GlassModal open={open} onClose={onClose} title="Upload Files" size="lg">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`dropzone${isDragActive ? " active" : ""}`}
      >
        <input {...getInputProps()} />
        <Upload size={32} style={{ color: "#334155", margin: "0 auto 0.75rem", display: "block" }} />
        <p style={{ color: "#f1f5f9", fontWeight: 500, marginBottom: "0.25rem" }}>
          {isDragActive ? "Drop files here" : "Drag & drop files or click to browse"}
        </p>
        <p style={{ color: "#334155", fontSize: "0.8125rem" }}>Text and code files (max 10 MB each)</p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "200px", overflowY: "auto" }}>
          {files.map(f => (
            <div key={f.name} className="glass" style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0.75rem", borderRadius: "0.625rem" }}>
              <FileText size={14} style={{ color: "#818cf8", flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: "0.8125rem", color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
              <span style={{ fontSize: "0.75rem", color: "#334155", flexShrink: 0 }}>{formatBytes(f.size)}</span>
              <button onClick={() => setFiles(p => p.filter(x => x.name !== f.name))}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#334155", padding: "0.125rem", display: "flex" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
                onMouseLeave={e => (e.currentTarget.style.color = "#334155")}
                aria-label="Remove">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
        <GlassButton variant="ghost" onClick={onClose}>Cancel</GlassButton>
        <GlassButton onClick={handleUpload} loading={uploading} disabled={!files.length} icon={<Upload size={14} />}>
          Upload {files.length > 0 ? `${files.length} file${files.length > 1 ? "s" : ""}` : ""}
        </GlassButton>
      </div>
    </GlassModal>
  );
}
