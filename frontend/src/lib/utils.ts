import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getFileLanguage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "typescript", tsx: "tsx", js: "javascript", jsx: "jsx",
    py: "python", java: "java", c: "c", cpp: "cpp", cs: "csharp",
    go: "go", rs: "rust", rb: "ruby", php: "php", swift: "swift",
    kt: "kotlin", json: "json", yaml: "yaml", yml: "yaml",
    html: "html", css: "css", scss: "scss", md: "markdown",
    sh: "bash", sql: "sql", graphql: "graphql", prisma: "prisma",
  };
  return map[ext] ?? "plaintext";
}

export function severityColor(severity: string) {
  switch (severity?.toUpperCase()) {
    case "CRITICAL": return "text-red-400 bg-red-500/10 border-red-500/30";
    case "HIGH":     return "text-orange-400 bg-orange-500/10 border-orange-500/30";
    case "MEDIUM":   return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    case "LOW":      return "text-green-400 bg-green-500/10 border-green-500/30";
    default:         return "text-slate-400 bg-slate-500/10 border-slate-500/30";
  }
}
