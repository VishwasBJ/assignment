"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api";
import type { Project } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassModal } from "@/components/ui/GlassModal";
import { GlassInput, GlassTextarea } from "@/components/ui/GlassInput";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Plus, Folder, FileCode, GitBranch, Trash2 } from "lucide-react";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const fetchProjects = async () => {
    try {
      const { data } = await apiClient.get("/projects");
      setProjects(data);
    } catch { toast.error("Failed to load projects"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await apiClient.post("/projects", { name: newName.trim(), description: newDesc.trim() || undefined });
      toast.success("Project created!");
      setShowCreate(false); setNewName(""); setNewDesc("");
      fetchProjects();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create project");
    } finally { setCreating(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This removes all files and reviews.`)) return;
    try {
      await apiClient.delete(`/projects/${id}`);
      setProjects(p => p.filter(x => x.id !== id));
      toast.success("Project deleted");
    } catch { toast.error("Failed to delete"); }
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "5rem" }}>
      <LoadingSpinner size={36} />
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "0.25rem" }}>Projects</h1>
          <p style={{ color: "#475569", fontSize: "0.875rem" }}>{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
        </div>
        <GlassButton onClick={() => setShowCreate(true)} icon={<Plus size={15} />}>New Project</GlassButton>
      </div>

      {projects.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Folder size={40} style={{ color: "#1e293b" }} />
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#f1f5f9" }}>No projects yet</h2>
            <p style={{ color: "#475569", fontSize: "0.875rem" }}>Create your first project and upload code to review.</p>
            <GlassButton onClick={() => setShowCreate(true)} icon={<Plus size={15} />}>Create Project</GlassButton>
          </div>
        </div>
      ) : (
        <div className="grid-projects">
          {projects.map(p => (
            <div key={p.id} className="card card-hover" style={{ display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
              <Link href={`/dashboard/projects/${p.id}`} style={{ textDecoration: "none", flex: 1, padding: "1.25rem" }}>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <div style={{ padding: "0.5rem", background: "rgba(99,102,241,0.1)", borderRadius: "0.625rem", flexShrink: 0 }}>
                    <GitBranch size={18} style={{ color: "#818cf8" }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h2 style={{ fontWeight: 600, color: "#f1f5f9", margin: "0 0 0.25rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</h2>
                    {p.description && <p style={{ fontSize: "0.8125rem", color: "#475569", margin: 0, lineHeight: 1.5 }}>{p.description}</p>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", fontSize: "0.75rem", color: "#334155" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <FileCode size={12} />{p._count?.files ?? 0} files
                  </span>
                  <span>{p._count?.reviews ?? 0} reviews</span>
                  <span style={{ marginLeft: "auto" }}>{formatDate(p.createdAt)}</span>
                </div>
              </Link>
              <div style={{ padding: "0.75rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={() => handleDelete(p.id, p.name)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#334155", padding: "0.25rem", borderRadius: "0.375rem", display: "flex", transition: "color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#334155")}
                  aria-label="Delete project"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <GlassModal open={showCreate} onClose={() => setShowCreate(false)} title="New Project">
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <GlassInput label="Project Name" placeholder="My API Service" value={newName} onChange={e => setNewName(e.target.value)} required autoFocus />
          <GlassTextarea label="Description (optional)" placeholder="A brief description..." rows={3} value={newDesc} onChange={e => setNewDesc(e.target.value)} />
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
            <GlassButton variant="ghost" type="button" onClick={() => setShowCreate(false)}>Cancel</GlassButton>
            <GlassButton type="submit" loading={creating}>Create Project</GlassButton>
          </div>
        </form>
      </GlassModal>
    </div>
  );
}
