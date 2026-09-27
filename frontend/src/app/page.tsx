import Link from "next/link";

export default function HomePage() {
  return (
    <main className="bg-mesh" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 1.5rem" }}>
      {/* Hero */}
      <div className="animate-fade-in" style={{ textAlign: "center", maxWidth: "42rem", width: "100%" }}>
        {/* Pill */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)",
          borderRadius: "99px", padding: "0.35rem 1rem",
          fontSize: "0.75rem", color: "#a5b4fc", fontWeight: 500, marginBottom: "2rem"
        }}>
          <span className="animate-pulse-soft" style={{ width: 6, height: 6, borderRadius: "50%", background: "#818cf8", display: "inline-block" }} />
          AI-Powered · Multi-Provider · Production Ready
        </div>

        <h1 style={{ fontSize: "clamp(2.25rem, 6vw, 3.5rem)", fontWeight: 800, lineHeight: 1.15, color: "#f1f5f9", marginBottom: "1.25rem" }}>
          Code Review<br />
          <span style={{ background: "linear-gradient(135deg, #818cf8, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Supercharged by AI
          </span>
        </h1>

        <p style={{ fontSize: "1.1rem", color: "#64748b", marginBottom: "2.5rem", lineHeight: 1.7 }}>
          Upload your code, run security, performance, or quality reviews,
          and chat with an AI that understands your entire codebase.
        </p>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/register" className="btn btn-primary btn-lg">Get Started Free</Link>
          <Link href="/login" className="btn btn-ghost btn-lg">Sign In</Link>
        </div>
      </div>

      {/* Feature cards */}
      <div className="animate-fade-in" style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "1rem", marginTop: "4rem", width: "100%", maxWidth: "52rem"
      }}>
        {FEATURES.map((f) => (
          <div key={f.title} className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>{f.icon}</div>
            <h3 style={{ fontWeight: 600, color: "#f1f5f9", marginBottom: "0.375rem" }}>{f.title}</h3>
            <p style={{ fontSize: "0.875rem", color: "#475569", lineHeight: 1.6 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}

const FEATURES = [
  { icon: "🔒", title: "Security Review",   desc: "OWASP Top 10, injections, auth flaws, exposed secrets." },
  { icon: "⚡", title: "Performance Review", desc: "N+1 queries, memory leaks, complexity issues." },
  { icon: "✨", title: "Code Quality",       desc: "DRY violations, naming, error handling, types." },
];
