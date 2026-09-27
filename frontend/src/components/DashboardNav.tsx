"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { GlassButton } from "@/components/ui/GlassButton";
import { LogOut, Code2 } from "lucide-react";

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => { logout(); router.push("/login"); };

  const navLink = (href: string, label: string) => {
    const active = pathname === href;
    return (
      <Link href={href} style={{
        display: "flex", alignItems: "center", gap: "0.375rem",
        padding: "0.4rem 0.85rem", borderRadius: "0.6rem",
        fontSize: "0.875rem", fontWeight: 500, textDecoration: "none",
        transition: "background 0.15s, color 0.15s",
        background: active ? "rgba(99,102,241,0.18)" : "transparent",
        color: active ? "#a5b4fc" : "#64748b",
      }}
        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "#f1f5f9"; }}
        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "#64748b"; }}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="app-nav">
      {/* Logo */}
      <Link href="/dashboard" style={{
        display: "flex", alignItems: "center", gap: "0.5rem",
        color: "#f1f5f9", fontWeight: 700, fontSize: "0.95rem",
        textDecoration: "none", flexShrink: 0
      }}>
        <Code2 size={20} style={{ color: "#818cf8" }} />
        <span>CodeReview AI</span>
      </Link>

      {/* Nav links */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flex: 1, justifyContent: "center" }}>
        {navLink("/dashboard", "Projects")}
        {navLink("/dashboard/settings", "Settings")}
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
        <span style={{ fontSize: "0.8125rem", color: "#475569" }}>{user?.username}</span>
        <GlassButton variant="ghost" size="sm" onClick={handleLogout} icon={<LogOut size={13} />}>
          Sign out
        </GlassButton>
      </div>
    </nav>
  );
}
