"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useOryx } from "@/lib/store";
import type { UserType } from "@/lib/types";
import AuthScreen from "@/components/auth/auth-screen";
import AdminDashboard from "@/components/auth/admin-dashboard";
import OryxApp from "@/components/oryx/oryx-app";
import { Loader2 } from "lucide-react";

const VALID_TYPES: UserType[] = [
  "rider",
  "driver",
  "fleet",
  "merchant",
  "courier",
  "npd",
  "admin",
];

export default function Page() {
  const { data: session, status } = useSession();
  const { currentType, setUserTypes, setCurrentType, setUserName } = useOryx();

  // Sync the NextAuth session → Zustand store. Whenever the session changes,
  // parse the user's `types` CSV and push name / currentType / userTypes into
  // the store so the rest of the app can read them.
  useEffect(() => {
    if (!session?.user) {
      setUserTypes(["rider"]);
      setCurrentType("rider");
      setUserName(null);
      return;
    }
    const u = session.user as {
      types?: string;
      currentType?: string;
      name?: string | null;
    };
    const parsed: UserType[] = (u.types ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter((t): t is UserType =>
        VALID_TYPES.includes(t as UserType)
      );
    setUserTypes(parsed.length ? parsed : ["rider"]);
    const ct = u.currentType ?? "rider";
    setCurrentType(
      VALID_TYPES.includes(ct as UserType) ? (ct as UserType) : "rider"
    );
    setUserName(u.name ?? null);
  }, [session, setUserTypes, setCurrentType, setUserName]);

  if (status === "loading") {
    return (
      <main className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-background">
        <div className="pointer-events-none absolute inset-0 grid-texture opacity-40" />
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
            <span className="text-2xl font-black text-emerald-950">O</span>
            <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-amber-400 ring-2 ring-background" />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
            Loading Oryx…
          </div>
        </div>
      </main>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  if (currentType === "admin") {
    return <AdminDashboard />;
  }

  return <OryxApp />;
}
