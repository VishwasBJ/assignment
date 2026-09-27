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
import { cn } from "@/lib/utils";

type Tab = "files" | "reviews" | "chat";

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); // Next.js 16: params is a Promise
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("files");
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    apiClient
      .get(`/projects/${id}`)
      .then(({ data }) => setProject(data))
      .catch(() => { toast.error("Project not found"); router.push("/dashboard"); })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) return <div className="flex justify-center mt-20"><LoadingSpinner size={36} /></div>;
  if (!project) return null;

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "files",   label: "Files",   icon: <FileCode size={15} /> },
    { key: "reviews", label: "Reviews", icon: <ShieldCheck size={15} /> },
    { key: "chat",    label: "Chat",    icon: <MessageSquare size={15} /> },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <GlassButton variant="ghost" size="sm" onClick={() => router.push("/dashboard")} icon={<ArrowLeft size={15} />}>
            Back
          </GlassButton>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-slate-400 truncate">{project.description}</p>
            )}
          </div>
        </div>
        <GlassButton onClick={() => setShowUpload(true)} icon={<Upload size={15} />}>
          Upload Files
        </GlassButton>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 glass rounded-xl p-1 mb-6 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              tab === t.key
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "files"   && <FileExplorer projectId={id} />}
      {tab === "reviews" && <ReviewPanel  projectId={id} />}
      {tab === "chat"    && <ChatPanel    projectId={id} />}

      {/* Upload modal */}
      <UploadPanel
        open={showUpload}
        onClose={() => setShowUpload(false)}
        projectId={id}
        onUploaded={() => { toast.success("Files uploaded!"); setShowUpload(false); setTab("files"); }}
      />
    </div>
  );
}
