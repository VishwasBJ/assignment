"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { GlassButton } from "@/components/ui/GlassButton";
import { LogOut, Code2, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <nav className="glass border-b border-white/10 sticky top-0 z-40">
      <div className="container mx-auto px-4 max-w-7xl h-14 flex items-center justify-between gap-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-white font-semibold">
          <Code2 size={20} className="text-indigo-400" />
          <span className="hidden sm:inline">CodeReview AI</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
              pathname === "/dashboard"
                ? "bg-indigo-600/20 text-indigo-300"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <LayoutDashboard size={15} />
            <span className="hidden sm:inline">Projects</span>
          </Link>
          <Link
            href="/dashboard/settings"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
              pathname === "/dashboard/settings"
                ? "bg-indigo-600/20 text-indigo-300"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <span className="hidden sm:inline">Settings</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400 hidden md:inline">{user?.username}</span>
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            icon={<LogOut size={14} />}
            aria-label="Sign out"
          >
            <span className="hidden sm:inline">Sign out</span>
          </GlassButton>
        </div>
      </div>
    </nav>
  );
}
