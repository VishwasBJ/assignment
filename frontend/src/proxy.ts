import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth is handled client-side via localStorage + Zustand (RequireAuth component).
// The proxy just needs to pass all requests through — no server-side JWT check
// because the token lives in localStorage, which the proxy cannot access.
export function proxy(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
