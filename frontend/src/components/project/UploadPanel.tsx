"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api";
import { GlassModal } from "@/components/ui/GlassModal";
import { GlassButton } from "@/components/ui/GlassButton";
import { formatBytes } from "@/lib/utils";
import { Upload, FileText, X } from "lucide-react";

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
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      return [...prev, ...accepted.filter((f) => !existing.has(f.name))];
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/*": [],
      "application/json": [],
      "application/javascript": [],
      "application/typescript": [],
    },
    multiple: true,
  });

  const removeFile = (name: string) => setFiles((p) => p.filter((f) => f.name !== name));

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    try {
      const form = new FormData();
      files.forEach((f) => {
        form.append("files", f);
        form.append("paths", f.name);
      });
      await apiClient.post(`/projects/${projectId}/files/upload`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
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
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
          ${isDragActive
            ? "border-indigo-500 bg-indigo-500/10"
            : "border-white/20 hover:border-indigo-500/50 hover:bg-white/5"}`}
      >
        <input {...getInputProps()} />
        <Upload size={32} className="mx-auto text-slate-500 mb-3" />
        <p className="text-white font-medium">
          {isDragActive ? "Drop files here" : "Drag & drop files or click to browse"}
        </p>
        <p className="text-slate-500 text-sm mt-1">Text and code files only (max 10 MB each)</p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
          {files.map((f) => (
            <div key={f.name} className="flex items-center gap-3 glass rounded-lg px-3 py-2">
              <FileText size={14} className="text-indigo-400 shrink-0" />
              <span className="text-sm text-white truncate flex-1">{f.name}</span>
              <span className="text-xs text-slate-500 shrink-0">{formatBytes(f.size)}</span>
              <button
                onClick={() => removeFile(f.name)}
                className="text-slate-500 hover:text-red-400 transition-colors"
                aria-label="Remove file"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 justify-end mt-6">
        <GlassButton variant="ghost" onClick={onClose}>Cancel</GlassButton>
        <GlassButton
          onClick={handleUpload}
          loading={uploading}
          disabled={!files.length}
          icon={<Upload size={14} />}
        >
          Upload {files.length > 0 && `${files.length} file${files.length > 1 ? "s" : ""}`}
        </GlassButton>
      </div>
    </GlassModal>
  );
}
