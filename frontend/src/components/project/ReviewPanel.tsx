"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api";
import type { Review, ReviewTemplate, AIProvider, ProjectFile } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassModal } from "@/components/ui/GlassModal";
import { GlassInput } from "@/components/ui/GlassInput";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ShieldCheck, Zap, Code2, Plus, Search, Trash2, ChevronDown, ChevronUp } from "lucide-react";

const TEMPLATES: { key: ReviewTemplate; label: string; icon: React.ReactNode; desc: string }[] = [
  { key: "SECURITY",     label: "Security",     icon: <ShieldCheck size={16} />, desc: "OWASP Top 10, injections, auth flaws" },
  { key: "PERFORMANCE",  label: "Performance",  icon: <Zap size={16} />,         desc: "N+1 queries, memory leaks, complexity" },
  { key: "CODE_QUALITY", label: "Code Quality", icon: <Code2 size={16} />,       desc: "DRY, naming, error handling, types" },
];

interface Props { projectId: string }

export function ReviewPanel({ projectId }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      const { data } = await apiClient.get(`/projects/${projectId}/reviews`, {
        params: search ? { search } : {},
      });
      setReviews(data);
    } catch { toast.error("Failed to load reviews"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReviews(); }, [projectId, search]);

  const deleteReview = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    try {
      await apiClient.delete(`/projects/${projectId}/reviews/${id}`);
      setReviews((r) => r.filter((x) => x.id !== id));
      toast.success("Review deleted");
    } catch { toast.error("Failed to delete review"); }
  };

  if (loading) return <div className="flex justify-center mt-10"><LoadingSpinner /></div>;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <GlassInput
          placeholder="Search reviews..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search size={14} />}
          className="sm:w-72"
        />
        <GlassButton onClick={() => setShowCreate(true)} icon={<Plus size={15} />}>
          New Review
        </GlassButton>
      </div>

      {reviews.length === 0 ? (
        <GlassCard className="text-center py-12">
          <ShieldCheck size={36} className="mx-auto text-slate-600 mb-3" />
          <p className="text-white font-medium">No reviews yet</p>
          <p className="text-slate-400 text-sm mt-1">Run an AI review on your project files.</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <ReviewCard
              key={r.id}
              review={r}
              expanded={expanded === r.id}
              onToggle={() => setExpanded(expanded === r.id ? null : r.id)}
              onDelete={() => deleteReview(r.id)}
            />
          ))}
        </div>
      )}

      <CreateReviewModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        projectId={projectId}
        onCreated={() => { setShowCreate(false); fetchReviews(); }}
      />
    </div>
  );
}

function ReviewCard({ review, expanded, onToggle, onDelete }: {
  review: Review; expanded: boolean;
  onToggle: () => void; onDelete: () => void;
}) {
  const tmpl = TEMPLATES.find((t) => t.key === review.templateType);

  return (
    <GlassCard noPad className="overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="text-indigo-400 shrink-0">{tmpl?.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-white">{review.title}</span>
            <StatusPill status={review.status} />
            {review.severity && <SeverityBadge severity={review.severity} size="sm" />}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{tmpl?.label} · {formatDate(review.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {review.issues && (
            <span className="text-xs text-slate-400">{(review.issues as any[]).length} issues</span>
          )}
          {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-white/10">
          {review.summary && (
            <div className="mt-4 mb-5">
              <h4 className="text-sm font-medium text-slate-300 mb-2">Summary</h4>
              <p className="text-sm text-slate-400 leading-relaxed">{review.summary}</p>
            </div>
          )}

          {review.issues && (review.issues as any[]).length > 0 && (
            <div className="mb-5">
              <h4 className="text-sm font-medium text-slate-300 mb-3">Issues</h4>
              <div className="space-y-3">
                {(review.issues as any[]).map((issue, i) => (
                  <div key={i} className="glass rounded-xl p-4">
                    <div className="flex items-start gap-3 flex-wrap">
                      <SeverityBadge severity={issue.severity} size="sm" />
                      <span className="text-xs text-slate-500 font-medium">{issue.category}</span>
                    </div>
                    <p className="font-medium text-white text-sm mt-2">{issue.title}</p>
                    <p className="text-sm text-slate-400 mt-1">{issue.description}</p>
                    {issue.suggestion && (
                      <div className="mt-2 bg-indigo-500/10 rounded-lg px-3 py-2">
                        <p className="text-xs text-indigo-300"><span className="font-medium">Fix: </span>{issue.suggestion}</p>
                      </div>
                    )}
                    {issue.file && (
                      <p className="text-xs text-slate-600 mt-2">📄 {issue.file}{issue.line ? `:${issue.line}` : ""}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {review.recommendations && (review.recommendations as any[]).length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-slate-300 mb-2">Recommendations</h4>
              <ul className="space-y-1.5">
                {(review.recommendations as any[]).map((rec: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                    <span className="text-indigo-400 mt-0.5 shrink-0">→</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-white/10">
            <GlassButton variant="danger" size="sm" onClick={onDelete} icon={<Trash2 size={13} />}>
              Delete
            </GlassButton>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

function StatusPill({ status }: { status: Review["status"] }) {
  const styles = {
    PENDING:     "bg-slate-500/20 text-slate-400",
    IN_PROGRESS: "bg-blue-500/20 text-blue-400 animate-pulse-soft",
    COMPLETED:   "bg-green-500/20 text-green-400",
    FAILED:      "bg-red-500/20 text-red-400",
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${styles[status]}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function CreateReviewModal({ open, onClose, projectId, onCreated }: {
  open: boolean; onClose: () => void; projectId: string; onCreated: () => void;
}) {
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
        templateType: template,
        title: title || undefined,
        fileIds: selectedFiles.length > 0 ? selectedFiles : undefined,
        providerId: providerId || undefined,
      });
      toast.success("Review completed!");
      onCreated();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Review failed");
    } finally {
      setCreating(false);
    }
  };

  return (
    <GlassModal open={open} onClose={onClose} title="New AI Review" size="lg">
      <div className="space-y-5">
        {/* Template selection */}
        <div>
          <p className="text-sm font-medium text-slate-300 mb-2">Review Type</p>
          <div className="grid grid-cols-3 gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.key}
                onClick={() => setTemplate(t.key)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all text-xs
                  ${template === t.key
                    ? "border-indigo-500/60 bg-indigo-600/20 text-indigo-300"
                    : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"}`}
              >
                {t.icon}
                <span className="font-medium">{t.label}</span>
                <span className="text-[10px] opacity-70 hidden sm:block">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <GlassInput
          label="Review Title (optional)"
          placeholder="e.g. Pre-deploy security check"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* File selection */}
        {files.length > 0 && (
          <div>
            <p className="text-sm font-medium text-slate-300 mb-2">Files to Review</p>
            <p className="text-xs text-slate-500 mb-2">Leave all unchecked to review entire project</p>
            <div className="glass rounded-xl p-3 max-h-40 overflow-y-auto space-y-1">
              {files.map((f) => (
                <label key={f.id} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(f.id)}
                    onChange={(e) => {
                      setSelectedFiles(
                        e.target.checked
                          ? [...selectedFiles, f.id]
                          : selectedFiles.filter((id) => id !== f.id)
                      );
                    }}
                    className="accent-indigo-500"
                  />
                  {f.path}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Provider */}
        {providers.length > 0 && (
          <div>
            <p className="text-sm font-medium text-slate-300 mb-2">AI Provider</p>
            <select
              className="w-full glass rounded-xl px-4 py-2.5 text-sm text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
            >
              <option value="" className="bg-slate-900">Default provider</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900">{p.name} ({p.modelName})</option>
              ))}
            </select>
          </div>
        )}

        {providers.length === 0 && (
          <div className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
            ⚠️ No AI provider configured. Go to <strong>Settings</strong> to add one before running a review.
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <GlassButton variant="ghost" onClick={onClose}>Cancel</GlassButton>
          <GlassButton onClick={handleCreate} loading={creating} disabled={providers.length === 0}>
            Run Review
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
}
