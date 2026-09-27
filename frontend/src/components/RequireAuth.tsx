"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { FullPageSpinner } from "@/components/ui/LoadingSpinner";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, hydrated } = useAuthStore();

  useEffect(() => {
    // Wait until localStorage has been read before deciding to redirect.
    // Without this check, user is always null on first render and causes
    // a redirect loop even for legitimately logged-in users.
    if (hydrated && !user) {
      router.replace("/login");
    }
  }, [user, hydrated, router]);

  // Still reading localStorage — show spinner, don't render or redirect yet
  if (!hydrated) return <FullPageSpinner />;

  // Hydrated but no user — redirect is in flight, show spinner
  if (!user) return <FullPageSpinner />;

  // Hydrated and authenticated — render the protected content
  return <>{children}</>;
}
