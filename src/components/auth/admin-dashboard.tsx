"use client";

import { useCallback, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import {
  ShieldCheck,
  Users,
  UserCheck,
  Clock,
  CheckCircle2,
  Loader2,
  LogOut,
  RefreshCw,
  Mail,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";

interface WaitlistUser {
  id: string;
  email: string;
  name: string | null;
  types: string;
  status: string;
  createdAt: string;
}

interface Counts {
  total: number;
  active: number;
  waitlist: number;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<WaitlistUser[]>([]);
  const [counts, setCounts] = useState<Counts>({ total: 0, active: 0, waitlist: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/waitlist", { cache: "no-store" });
      if (!r.ok) {
        setError("Failed to load waitlist");
        return;
      }
      const data = await r.json();
      setUsers(data.users ?? []);
      setCounts(data.counts ?? { total: 0, active: 0, waitlist: 0 });
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  async function approve(userId: string) {
    setApprovingId(userId);
    try {
      const r = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (r.ok) {
        await fetchAll();
      }
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <main className="relative min-h-[100dvh] w-full overflow-y-auto bg-background text-foreground">
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 grid-texture opacity-40" />
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <header className="glass-strong sticky top-0 z-20 -mx-4 mb-6 flex items-center justify-between gap-3 rounded-2xl border border-border/60 px-4 py-3 shadow-xl shadow-black/30 sm:mx-0 sm:rounded-3xl sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
              <span className="text-base font-black text-emerald-950">O</span>
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-background" />
            </div>
            <div className="leading-none">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight">Oryx Admin</span>
                <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  <ShieldCheck className="h-3 w-3" />
                  Admin
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Waitlist & user management
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchAll()}
              className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-xs font-semibold transition hover:bg-background/70"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Stats cards */}
        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            icon={<Users className="h-4 w-4" />}
            label="Total users"
            value={counts.total}
            accent="text-sky-300 bg-sky-500/10 border-sky-500/30"
          />
          <StatCard
            icon={<UserCheck className="h-4 w-4" />}
            label="Active"
            value={counts.active}
            accent="text-emerald-300 bg-emerald-500/10 border-emerald-500/30"
          />
          <StatCard
            icon={<Clock className="h-4 w-4" />}
            label="On waitlist"
            value={counts.waitlist}
            accent="text-amber-300 bg-amber-500/10 border-amber-500/30"
          />
        </section>

        {/* Waitlist table */}
        <section className="glass-strong rounded-3xl border border-border/60 p-4 shadow-xl shadow-black/30 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold">Waitlist approvals</h2>
              <p className="text-xs text-muted-foreground">
                Review users waiting to join Oryx. Approve to activate their accounts.
              </p>
            </div>
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading waitlist…
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              <p className="text-sm font-semibold">No pending approvals</p>
              <p className="text-xs text-muted-foreground">
                The waitlist is empty — every applicant is already active.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-2 py-2 font-semibold">Name</th>
                    <th className="px-2 py-2 font-semibold">Email</th>
                    <th className="px-2 py-2 font-semibold">Signed up</th>
                    <th className="px-2 py-2 font-semibold">Role</th>
                    <th className="px-2 py-2 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-border/40 transition hover:bg-background/30"
                    >
                      <td className="px-2 py-3 font-medium">
                        {u.name ?? <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-2 py-3">
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          {u.email}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-muted-foreground">
                        {new Date(u.createdAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-2 py-3">
                        <span className="rounded-full border border-border/60 bg-background/40 px-2 py-0.5 text-[11px] font-medium capitalize text-muted-foreground">
                          {u.types.split(",")[0] ?? "rider"}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => approve(u.id)}
                          disabled={approvingId === u.id}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-3 py-1.5 text-xs font-bold text-emerald-950 shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-60"
                        >
                          {approvingId === u.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          Approve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="mt-6 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Tip: this admin account only has the <code className="text-foreground">admin</code> role.</span>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-rose-300/80 transition hover:text-rose-300"
          >
            Sign out
          </button>
        </footer>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="glass-strong flex items-center gap-3 rounded-2xl border border-border/60 p-4 shadow-lg shadow-black/30">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl border ${accent}`}
      >
        {icon}
      </div>
      <div className="leading-none">
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
      </div>
    </div>
  );
}
