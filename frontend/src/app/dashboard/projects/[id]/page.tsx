"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api";
import type { Project } from "@/lib/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { GlassButton } from "@/components/ui/GlassButton";
import { FileExplorer } from "@/components/project/FileExplorer";
import { ReviewPanel } from "@/components/project/ReviewPanel";
import { ChatPanel } from "@/components/project/ChatPanel";
import { UploadPanel } from "@/components/project/UploadPanel";
import { ArrowLeft, Upload, FileCode, ShieldCheck, MessageSquare } from "lucide-react";

type Tab = "files" | "reviews" | "chat";

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("files");
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    apiClient.get(`/projects/${id}`)
      .then(({ data }) => setProject(data))
      .catch(() => { toast.error("Project not found"); router.push("/dashboard"); })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", marginTop: "5rem" }}><LoadingSpinner size={36} /></div>;
  if (!project) return null;

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "files",   label: "Files",   icon: <FileCode size={15} /> },
    { key: "reviews", label: "Reviews", icon: <ShieldCheck size={15} /> },
    { key: "chat",    label: "Chat",    icon: <MessageSquare size={15} /> },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <GlassButton variant="ghost" size="sm" onClick={() => router.push("/dashboard")} icon={<ArrowLeft size={14} />}>
          Back
        </GlassButton>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f1f5f9", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {project.name}
          </h1>
          {project.description && (
            <p style={{ color: "#475569", fontSize: "0.8125rem", margin: "0.125rem 0 0" }}>{project.description}</p>
          )}
        </div>
        <GlassButton onClick={() => setShowUpload(true)} icon={<Upload size={14} />}>
          Upload Files
        </GlassButton>
      </div>

      {/* Tab bar */}
      <div className="tab-bar" style={{ marginBottom: "1.5rem" }}>
        {TABS.map(t => (
          <button
            key={t.key}
            className={`tab-item${tab === t.key ? " active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === "files"   && <FileExplorer projectId={id} />}
      {tab === "reviews" && <ReviewPanel  projectId={id} />}
      {tab === "chat"    && <ChatPanel    projectId={id} />}

      <UploadPanel
        open={showUpload}
        onClose={() => setShowUpload(false)}
        projectId={id}
        onUploaded={() => { toast.success("Files uploaded!"); setShowUpload(false); setTab("files"); }}
      />
    </div>
  );
}
