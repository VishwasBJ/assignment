"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api";
import type { Review, ReviewTemplate, AIProvider, ProjectFile } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassModal } from "@/components/ui/GlassModal";
import { GlassInput } from "@/components/ui/GlassInput";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ShieldCheck, Zap, Code2, Plus, Search, Trash2, ChevronDown, ChevronUp } from "lucide-react";

const TEMPLATES = [
  { key: "SECURITY" as ReviewTemplate,     label: "Security",     icon: <ShieldCheck size={15} />, desc: "OWASP Top 10, injections, auth flaws" },
  { key: "PERFORMANCE" as ReviewTemplate,  label: "Performance",  icon: <Zap size={15} />,         desc: "N+1 queries, memory leaks, complexity" },
  { key: "CODE_QUALITY" as ReviewTemplate, label: "Code Quality", icon: <Code2 size={15} />,       desc: "DRY, naming, error handling, types" },
];

interface Props { projectId: string }

export function ReviewPanel({ projectId }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchReviews = async () => {
    try { const { data } = await apiClient.get(`/projects/${projectId}/reviews`, { params: search ? { search } : {} }); setReviews(data); }
    catch { toast.error("Failed to load reviews"); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchReviews(); }, [projectId, search]);

  const deleteReview = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    try { await apiClient.delete(`/projects/${projectId}/reviews/${id}`); setReviews(r => r.filter(x => x.id !== id)); toast.success("Deleted"); }
    catch { toast.error("Failed to delete"); }
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", marginTop: "2.5rem" }}><LoadingSpinner /></div>;

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
          <input className="input" placeholder="Search reviews…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: "2.25rem", width: "18rem" }} />
        </div>
        <GlassButton onClick={() => setShowCreate(true)} icon={<Plus size={15} />}>New Review</GlassButton>
      </div>

      {reviews.length === 0 ? (
        <div className="card"><div className="empty-state">
          <ShieldCheck size={36} style={{ color: "#1e293b" }} />
          <p style={{ fontWeight: 600, color: "#f1f5f9" }}>No reviews yet</p>
          <p style={{ color: "#475569", fontSize: "0.875rem" }}>Run an AI review on your project files.</p>
        </div></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {reviews.map(r => (
            <ReviewCard key={r.id} review={r} expanded={expanded === r.id}
              onToggle={() => setExpanded(expanded === r.id ? null : r.id)}
              onDelete={() => deleteReview(r.id)} />
          ))}
        </div>
      )}

      <CreateReviewModal open={showCreate} onClose={() => setShowCreate(false)} projectId={projectId}
        onCreated={() => { setShowCreate(false); fetchReviews(); }} />
    </div>
  );
}

function ReviewCard({ review, expanded, onToggle, onDelete }: { review: Review; expanded: boolean; onToggle: () => void; onDelete: () => void }) {
  const tmpl = TEMPLATES.find(t => t.key === review.templateType);
  const statusStyle: Record<string, string> = {
    PENDING: "status-pill status-pending", IN_PROGRESS: "status-pill status-in_progress",
    COMPLETED: "status-pill status-completed", FAILED: "status-pill status-failed",
  };
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <button onClick={onToggle} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", textAlign: "left" }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
        onMouseLeave={e => (e.currentTarget.style.background = "none")}>
        <span style={{ color: "#818cf8", flexShrink: 0 }}>{tmpl?.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600, color: "#f1f5f9" }}>{review.title}</span>
            <span className={statusStyle[review.status] || "status-pill status-pending"}>{review.status.replace("_", " ")}</span>
            {review.severity && <SeverityBadge severity={review.severity} size="sm" />}
          </div>
          <p style={{ fontSize: "0.75rem", color: "#334155", margin: "0.25rem 0 0" }}>
            {tmpl?.label} · {formatDate(review.createdAt)}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
          {review.issues && <span style={{ fontSize: "0.75rem", color: "#475569" }}>{(review.issues as any[]).length} issues</span>}
          {expanded ? <ChevronUp size={15} style={{ color: "#475569" }} /> : <ChevronDown size={15} style={{ color: "#475569" }} />}
        </div>
      </button>

      {expanded && (
        <div style={{ padding: "0 1.25rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          {review.summary && (
            <div style={{ marginTop: "1rem", marginBottom: "1.25rem" }}>
              <h4 style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#64748b", marginBottom: "0.5rem" }}>Summary</h4>
              <p style={{ fontSize: "0.875rem", color: "#94a3b8", lineHeight: 1.7 }}>{review.summary}</p>
            </div>
          )}
          {review.issues && (review.issues as any[]).length > 0 && (
            <div style={{ marginBottom: "1.25rem" }}>
              <h4 style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#64748b", marginBottom: "0.75rem" }}>Issues</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {(review.issues as any[]).map((issue, i) => (
                  <div key={i} className="glass" style={{ padding: "1rem", borderRadius: "0.75rem" }}>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                      <SeverityBadge severity={issue.severity} size="sm" />
                      <span style={{ fontSize: "0.7rem", color: "#475569", fontWeight: 600, display: "flex", alignItems: "center" }}>{issue.category}</span>
                    </div>
                    <p style={{ fontWeight: 600, color: "#f1f5f9", fontSize: "0.875rem", margin: "0 0 0.375rem" }}>{issue.title}</p>
                    <p style={{ fontSize: "0.8125rem", color: "#94a3b8", margin: 0 }}>{issue.description}</p>
                    {issue.suggestion && (
                      <div style={{ marginTop: "0.625rem", background: "rgba(99,102,241,0.1)", borderRadius: "0.5rem", padding: "0.5rem 0.75rem" }}>
                        <p style={{ fontSize: "0.8125rem", color: "#a5b4fc", margin: 0 }}><strong>Fix: </strong>{issue.suggestion}</p>
                      </div>
                    )}
                    {issue.file && <p style={{ fontSize: "0.75rem", color: "#334155", marginTop: "0.375rem" }}>📄 {issue.file}{issue.line ? `:${issue.line}` : ""}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {review.recommendations && (review.recommendations as any[]).length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <h4 style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#64748b", marginBottom: "0.5rem" }}>Recommendations</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                {(review.recommendations as any[]).map((rec: string, i: number) => (
                  <div key={i} style={{ display: "flex", gap: "0.5rem", fontSize: "0.875rem", color: "#94a3b8" }}>
                    <span style={{ color: "#818cf8", flexShrink: 0 }}>→</span>{rec}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <GlassButton variant="danger" size="sm" onClick={onDelete} icon={<Trash2 size={13} />}>Delete</GlassButton>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateReviewModal({ open, onClose, projectId, onCreated }: { open: boolean; onClose: () => void; projectId: string; onCreated: () => void }) {
  const [template, setTemplate] = useState<ReviewTemplate>("SECURITY");
  const [title, setTitle] = useState("");
  const [providerId, setProviderId] = useState("");
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    apiClient.get("/ai-providers").then(({ data }) => setProviders(data)).catch(() => {});
    apiClient.get(`/projects/${projectId}/files`).then(({ data }) => setFiles(data)).catch(() => {});
  }, [open, projectId]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await apiClient.post(`/projects/${projectId}/reviews`, {
        templateType: template, title: title || undefined,
        fileIds: selectedFiles.length > 0 ? selectedFiles : undefined,
        providerId: providerId || undefined,
      });
      toast.success("Review completed!"); onCreated();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Review failed");
    } finally { setCreating(false); }
  };

  return (
    <GlassModal open={open} onClose={onClose} title="New AI Review" size="lg">
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Template picker */}
        <div>
          <p className="label">Review Type</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.5rem" }}>
            {TEMPLATES.map(t => (
              <button key={t.key} onClick={() => setTemplate(t.key)} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: "0.375rem",
                padding: "0.875rem 0.5rem", borderRadius: "0.75rem", cursor: "pointer",
                border: `1px solid ${template === t.key ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.1)"}`,
                background: template === t.key ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
                color: template === t.key ? "#a5b4fc" : "#64748b",
                transition: "all 0.15s", fontSize: "0.8125rem", fontWeight: 500,
              }}>
                {t.icon}<span>{t.label}</span>
                <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <GlassInput label="Review Title (optional)" placeholder="e.g. Pre-deploy security check" value={title} onChange={e => setTitle(e.target.value)} />

        {files.length > 0 && (
          <div>
            <p className="label">Files to Review <span style={{ color: "#334155" }}>(leave all unchecked = entire project)</span></p>
            <div className="glass" style={{ borderRadius: "0.75rem", padding: "0.75rem", maxHeight: "160px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              {files.map(f => (
                <label key={f.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "#94a3b8", cursor: "pointer" }}>
                  <input type="checkbox" checked={selectedFiles.includes(f.id)}
                    onChange={e => setSelectedFiles(e.target.checked ? [...selectedFiles, f.id] : selectedFiles.filter(id => id !== f.id))}
                    style={{ accentColor: "#6366f1" }} />
                  {f.path}
                </label>
              ))}
            </div>
          </div>
        )}

        {providers.length > 0 ? (
          <div>
            <p className="label">AI Provider</p>
            <select className="input" value={providerId} onChange={e => setProviderId(e.target.value)}
              style={{ background: "rgba(15,15,46,0.9)" }}>
              <option value="">Default provider</option>
              {providers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.modelName})</option>)}
            </select>
          </div>
        ) : (
          <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "0.75rem", padding: "0.75rem 1rem", fontSize: "0.875rem", color: "#fbbf24" }}>
            ⚠️ No AI provider configured. Go to <strong>Settings</strong> to add one first.
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", paddingTop: "0.5rem" }}>
          <GlassButton variant="ghost" onClick={onClose}>Cancel</GlassButton>
          <GlassButton onClick={handleCreate} loading={creating} disabled={providers.length === 0}>Run Review</GlassButton>
        </div>
      </div>
    </GlassModal>
  );
}
