"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api";
import type { TreeNode, ProjectFile } from "@/lib/types";
import { getFileLanguage, formatBytes, formatDate } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Folder, FolderOpen, FileCode, ChevronRight, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { projectId: string }

export function FileExplorer({ projectId }: Props) {
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [selected, setSelected] = useState<ProjectFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [fileLoading, setFileLoading] = useState(false);

  const fetchTree = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/projects/${projectId}/files/tree`);
      setTree(data);
    } catch { toast.error("Failed to load files"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTree(); }, [projectId]);

  const openFile = async (id: string) => {
    setFileLoading(true);
    try {
      const { data } = await apiClient.get(`/projects/${projectId}/files/${id}`);
      setSelected(data);
    } catch { toast.error("Failed to load file"); }
    finally { setFileLoading(false); }
  };

  const deleteFile = async (id: string) => {
    try {
      await apiClient.delete(`/projects/${projectId}/files/${id}`);
      if (selected?.id === id) setSelected(null);
      toast.success("File deleted");
      fetchTree();
    } catch { toast.error("Failed to delete file"); }
  };

  if (loading) return <div className="flex justify-center mt-10"><LoadingSpinner /></div>;

  const hasFiles = tree && tree.type === "directory" && tree.children.length > 0;

  if (!hasFiles) {
    return (
      <GlassCard className="text-center py-12">
        <FileCode size={36} className="mx-auto text-slate-600 mb-3" />
        <p className="text-white font-medium">No files uploaded yet</p>
        <p className="text-slate-400 text-sm mt-1">Use &quot;Upload Files&quot; to add code.</p>
      </GlassCard>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[500px]">
      {/* Tree */}
      <GlassCard noPad className="lg:col-span-1 overflow-y-auto max-h-[600px]">
        <div className="px-4 py-3 border-b border-white/10 text-sm font-medium text-slate-300">
          File Tree
        </div>
        <div className="py-2">
          <TreeNodeView
            node={tree}
            depth={0}
            onSelect={openFile}
            onDelete={deleteFile}
            selectedId={selected?.id}
          />
        </div>
      </GlassCard>

      {/* Viewer */}
      <GlassCard noPad className="lg:col-span-2 overflow-hidden flex flex-col max-h-[600px]">
        {selected ? (
          <>
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{selected.path}</p>
                <p className="text-xs text-slate-500">{formatBytes(selected.size)} · {formatDate(selected.createdAt)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white transition-colors shrink-0">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <CodeViewer content={selected.content ?? ""} filename={selected.name} />
            </div>
          </>
        ) : fileLoading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            Select a file to preview
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function TreeNodeView({
  node, depth, onSelect, onDelete, selectedId,
}: {
  node: TreeNode; depth: number;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  selectedId?: string;
}) {
  const [open, setOpen] = useState(depth < 2);

  if (node.type === "file") {
    return (
      <div
        className={cn(
          "group flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer rounded-lg mx-1 transition-colors",
          selectedId === node.id ? "bg-indigo-600/20 text-indigo-300" : "text-slate-300 hover:bg-white/5 hover:text-white"
        )}
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
        onClick={() => onSelect(node.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onSelect(node.id)}
      >
        <FileCode size={13} className="shrink-0 text-slate-500" />
        <span className="truncate flex-1">{node.name}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
          aria-label="Delete file"
        >
          <Trash2 size={12} />
        </button>
      </div>
    );
  }

  if (node.name === "root") {
    return (
      <>
        {node.children.map((child, i) => (
          <TreeNodeView key={i} node={child} depth={depth} onSelect={onSelect} onDelete={onDelete} selectedId={selectedId} />
        ))}
      </>
    );
  }

  return (
    <div>
      <button
        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg mx-1 transition-colors"
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
        onClick={() => setOpen((o) => !o)}
      >
        <ChevronRight size={13} className={cn("shrink-0 transition-transform", open && "rotate-90")} />
        {open ? <FolderOpen size={13} className="text-indigo-400 shrink-0" /> : <Folder size={13} className="text-indigo-400 shrink-0" />}
        <span className="truncate">{node.name}</span>
      </button>
      {open && node.children.map((child, i) => (
        <TreeNodeView key={i} node={child} depth={depth + 1} onSelect={onSelect} onDelete={onDelete} selectedId={selectedId} />
      ))}
    </div>
  );
}

function CodeViewer({ content, filename }: { content: string; filename: string }) {
  // Simple line-numbered viewer with basic syntax-aware class
  const lines = content.split("\n");
  return (
    <pre
      className="text-xs font-mono p-4 overflow-auto h-full leading-relaxed"
      aria-label={`File content: ${filename}`}
    >
      {lines.map((line, i) => (
        <div key={i} className="flex">
          <span className="text-slate-600 select-none w-8 shrink-0 text-right pr-4">{i + 1}</span>
          <span className="text-slate-300 whitespace-pre">{line}</span>
        </div>
      ))}
    </pre>
  );
}
