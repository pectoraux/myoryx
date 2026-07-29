"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

/**
 * Client-side SessionProvider wrapper used by the server root layout.
 * Allows layout.tsx to remain a server component (which can export
 * metadata) while still wiring NextAuth's React context into the tree.
 */
export function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
