"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api";
import type { TreeNode, ProjectFile } from "@/lib/types";
import { formatBytes, formatDate } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Folder, FolderOpen, FileCode, ChevronRight, Trash2, X } from "lucide-react";

interface Props { projectId: string }

export function FileExplorer({ projectId }: Props) {
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [selected, setSelected] = useState<ProjectFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [fileLoading, setFileLoading] = useState(false);

  const fetchTree = async () => {
    setLoading(true);
    try { const { data } = await apiClient.get(`/projects/${projectId}/files/tree`); setTree(data); }
    catch { toast.error("Failed to load files"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTree(); }, [projectId]);

  const openFile = async (id: string) => {
    setFileLoading(true);
    try { const { data } = await apiClient.get(`/projects/${projectId}/files/${id}`); setSelected(data); }
    catch { toast.error("Failed to load file"); }
    finally { setFileLoading(false); }
  };

  const deleteFile = async (id: string) => {
    try {
      await apiClient.delete(`/projects/${projectId}/files/${id}`);
      if (selected?.id === id) setSelected(null);
      toast.success("File deleted"); fetchTree();
    } catch { toast.error("Failed to delete"); }
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", marginTop: "2.5rem" }}><LoadingSpinner /></div>;

  const hasFiles = tree && tree.type === "directory" && tree.children.length > 0;

  if (!hasFiles) return (
    <div className="card"><div className="empty-state">
      <FileCode size={36} style={{ color: "#1e293b" }} />
      <p style={{ fontWeight: 600, color: "#f1f5f9" }}>No files uploaded yet</p>
      <p style={{ color: "#475569", fontSize: "0.875rem" }}>Use "Upload Files" to add code.</p>
    </div></div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "1rem", minHeight: 520 }}>
      {/* Tree panel */}
      <div className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.07)", fontSize: "0.8125rem", fontWeight: 600, color: "#64748b" }}>
          Files
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0.375rem" }}>
          <TreeNodeView node={tree} depth={0} onSelect={openFile} onDelete={deleteFile} selectedId={selected?.id} />
        </div>
      </div>

      {/* Viewer panel */}
      <div className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 520 }}>
        {selected ? (
          <>
            <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "#f1f5f9", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected.path}</p>
                <p style={{ fontSize: "0.75rem", color: "#334155", margin: "0.125rem 0 0" }}>{formatBytes(selected.size)} · {formatDate(selected.createdAt)}</p>
              </div>
              <button onClick={() => setSelected(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", padding: "0.25rem", display: "flex", flexShrink: 0 }}
                onMouseEnter={e => (e.currentTarget.style.color = "#f1f5f9")}
                onMouseLeave={e => (e.currentTarget.style.color = "#475569")}
              ><X size={16} /></button>
            </div>
            <div style={{ flex: 1, overflow: "auto" }}>
              <div className="code-viewer">
                {(selected.content ?? "").split("\n").map((line, i) => (
                  <div key={i} className="code-line">
                    <span className="code-ln">{i + 1}</span>
                    <span className="code-text">{line}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : fileLoading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><LoadingSpinner /></div>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#334155", fontSize: "0.875rem" }}>
            Select a file to preview
          </div>
        )}
      </div>
    </div>
  );
}

function TreeNodeView({ node, depth, onSelect, onDelete, selectedId }: {
  node: TreeNode; depth: number;
  onSelect: (id: string) => void; onDelete: (id: string) => void; selectedId?: string;
}) {
  const [open, setOpen] = useState(depth < 2);

  if (node.type === "file") {
    const active = selectedId === node.id;
    return (
      <div
        className={`tree-item${active ? " selected" : ""}`}
        style={{ paddingLeft: `${depth * 14 + 10}px` }}
        onClick={() => onSelect(node.id)}
        role="button" tabIndex={0}
        onKeyDown={e => e.key === "Enter" && onSelect(node.id)}
      >
        <FileCode size={13} style={{ flexShrink: 0, color: "#334155" }} />
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{node.name}</span>
        <button
          onClick={e => { e.stopPropagation(); onDelete(node.id); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#334155", padding: "0.125rem", display: "none", flexShrink: 0 }}
          onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
          onMouseLeave={e => (e.currentTarget.style.color = "#334155")}
          ref={btn => { if (btn) btn.parentElement?.addEventListener("mouseenter", () => btn.style.display = "flex"); btn?.parentElement?.addEventListener("mouseleave", () => btn && (btn.style.display = "none")); }}
          aria-label="Delete"
        ><Trash2 size={11} /></button>
      </div>
    );
  }

  if (node.name === "root") {
    return <>{node.children.map((c, i) => <TreeNodeView key={i} node={c} depth={depth} onSelect={onSelect} onDelete={onDelete} selectedId={selectedId} />)}</>;
  }

  return (
    <div>
      <button
        className="tree-item"
        style={{ paddingLeft: `${depth * 14 + 10}px`, width: "100%", border: "none", background: "none", textAlign: "left" }}
        onClick={() => setOpen(o => !o)}
      >
        <ChevronRight size={12} style={{ flexShrink: 0, transition: "transform 0.15s", transform: open ? "rotate(90deg)" : "none" }} />
        {open
          ? <FolderOpen size={13} style={{ flexShrink: 0, color: "#818cf8" }} />
          : <Folder size={13} style={{ flexShrink: 0, color: "#818cf8" }} />}
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{node.name}</span>
      </button>
      {open && node.children.map((c, i) => <TreeNodeView key={i} node={c} depth={depth + 1} onSelect={onSelect} onDelete={onDelete} selectedId={selectedId} />)}
    </div>
  );
}
