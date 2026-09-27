import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-mesh flex flex-col items-center justify-center p-8">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto animate-fade-in">
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs text-indigo-300 font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse-soft" />
          AI-Powered · Multi-Provider · Production Ready
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Code Review
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            Supercharged by AI
          </span>
        </h1>

        <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto">
          Upload your code, run security, performance, or quality reviews, and
          chat with an AI that actually understands your codebase.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register">
            <GlassButton size="lg">Get Started Free</GlassButton>
          </Link>
          <Link href="/login">
            <GlassButton size="lg" variant="ghost">Sign In</GlassButton>
          </Link>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-20 w-full max-w-4xl animate-fade-in">
        {FEATURES.map((f) => (
          <GlassCard key={f.title} className="text-center">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-semibold text-white mb-1">{f.title}</h3>
            <p className="text-sm text-slate-400">{f.desc}</p>
          </GlassCard>
        ))}
      </div>
    </main>
  );
}

const FEATURES = [
  { icon: "🔒", title: "Security Review", desc: "Find OWASP Top 10, injections, auth flaws, and exposed secrets." },
  { icon: "⚡", title: "Performance Review", desc: "Detect N+1 queries, memory leaks, and complexity issues." },
  { icon: "✨", title: "Code Quality", desc: "DRY violations, poor naming, missing error handling, and more." },
];
