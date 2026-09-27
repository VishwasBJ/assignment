"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api";
import type { Project } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
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
    } catch {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await apiClient.post("/projects", { name: newName.trim(), description: newDesc.trim() || undefined });
      toast.success("Project created!");
      setShowCreate(false);
      setNewName(""); setNewDesc("");
      fetchProjects();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This removes all files and reviews.`)) return;
    try {
      await apiClient.delete(`/projects/${id}`);
      setProjects((p) => p.filter((x) => x.id !== id));
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete project");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center mt-20">
        <LoadingSpinner size={36} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-slate-400 text-sm mt-0.5">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
        </div>
        <GlassButton onClick={() => setShowCreate(true)} icon={<Plus size={16} />}>
          New Project
        </GlassButton>
      </div>

      {projects.length === 0 ? (
        <GlassCard className="text-center py-16">
          <Folder size={40} className="text-slate-600 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-white mb-2">No projects yet</h2>
          <p className="text-slate-400 text-sm mb-6">Create your first project and upload code to review.</p>
          <GlassButton onClick={() => setShowCreate(true)} icon={<Plus size={16} />}>
            Create Project
          </GlassButton>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <GlassCard key={p.id} hover noPad className="group flex flex-col">
              <Link href={`/dashboard/projects/${p.id}`} className="flex-1 p-5 block">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg mt-0.5">
                    <GitBranch size={18} className="text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-white truncate">{p.name}</h2>
                    {p.description && (
                      <p className="text-sm text-slate-400 mt-0.5 line-clamp-2">{p.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <FileCode size={12} />
                    {p._count?.files ?? 0} files
                  </span>
                  <span>{p._count?.reviews ?? 0} reviews</span>
                  <span className="ml-auto">{formatDate(p.createdAt)}</span>
                </div>
              </Link>
              <div className="px-5 py-3 border-t border-white/5 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.preventDefault(); handleDelete(p.id, p.name); }}
                  className="text-red-400/60 hover:text-red-400 transition-colors p-1 rounded"
                  aria-label="Delete project"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <GlassModal open={showCreate} onClose={() => setShowCreate(false)} title="New Project">
        <form onSubmit={handleCreate} className="space-y-4">
          <GlassInput
            label="Project Name"
            placeholder="My API Service"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
            autoFocus
          />
          <GlassTextarea
            label="Description (optional)"
            placeholder="A brief description..."
            rows={3}
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
          <div className="flex gap-3 justify-end pt-2">
            <GlassButton variant="ghost" type="button" onClick={() => setShowCreate(false)}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" loading={creating}>
              Create Project
            </GlassButton>
          </div>
        </form>
      </GlassModal>
    </div>
  );
}
