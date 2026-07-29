"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import {
  Loader2,
  Mail,
  Lock,
  User as UserIcon,
  Sparkles,
  ShieldCheck,
  Car,
  Truck,
  Store,
  Package,
  Network,
  Footprints,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type Tab = "login" | "waitlist";

interface QuickRole {
  type: "rider" | "driver" | "fleet" | "merchant" | "courier" | "npd" | "admin";
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}

const ROLES: QuickRole[] = [
  {
    type: "rider",
    label: "Rider",
    description: "Book rides & auctions",
    icon: Footprints,
    accent: "from-emerald-400/20 to-emerald-600/10 text-emerald-300 border-emerald-500/30",
  },
  {
    type: "driver",
    label: "Driver",
    description: "Win auctions & earn",
    icon: Car,
    accent: "from-sky-400/20 to-sky-600/10 text-sky-300 border-sky-500/30",
  },
  {
    type: "fleet",
    label: "Fleet",
    description: "Manage vehicles & ops",
    icon: Truck,
    accent: "from-indigo-400/20 to-indigo-600/10 text-indigo-300 border-indigo-500/30",
  },
  {
    type: "merchant",
    label: "Merchant",
    description: "Dispatch deliveries",
    icon: Store,
    accent: "from-amber-400/20 to-amber-600/10 text-amber-300 border-amber-500/30",
  },
  {
    type: "courier",
    label: "Courier",
    description: "Pickup & deliver",
    icon: Package,
    accent: "from-rose-400/20 to-rose-600/10 text-rose-300 border-rose-500/30",
  },
  {
    type: "npd",
    label: "NPD",
    description: "Network of drivers",
    icon: Network,
    accent: "from-violet-400/20 to-violet-600/10 text-violet-300 border-violet-500/30",
  },
];

export default function AuthScreen() {
  const [tab, setTab] = useState<Tab>("login");

  // login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // waitlist form
  const [wlName, setWlName] = useState("");
  const [wlEmail, setWlEmail] = useState("");
  const [wlPassword, setWlPassword] = useState("");
  const [wlLoading, setWlLoading] = useState(false);
  const [wlError, setWlError] = useState<string | null>(null);
  const [wlSuccess, setWlSuccess] = useState(false);

  // On mount, ensure demo + admin accounts exist (idempotent).
  useEffect(() => {
    fetch("/api/seed").catch(() => {
      /* fire and forget */
    });
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    const res = await signIn("credentials", {
      email: loginEmail,
      password: loginPassword,
      redirect: false,
      callbackUrl: "/",
    });
    setLoginLoading(false);
    if (!res || res.error) {
      setLoginError(
        "Invalid email or password, or your account is still on the waitlist."
      );
      return;
    }
    // Successful sign-in — hard navigate to callbackUrl so the session
    // becomes visible to the gated home route.
    window.location.href = res.url ?? "/";
  }

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    setWlError(null);
    setWlLoading(true);
    try {
      const r = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: wlEmail,
          name: wlName,
          password: wlPassword,
        }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        setWlError(data?.error ?? "Failed to join waitlist");
        return;
      }
      setWlSuccess(true);
    } catch {
      setWlError("Network error — please try again");
    } finally {
      setWlLoading(false);
    }
  }

  function quickLogin(type: QuickRole["type"]) {
    if (type === "admin") {
      void signIn("credentials", {
        email: "ekontetevi@gmail",
        password: "Payswap123456",
        callbackUrl: "/",
      });
      return;
    }
    void signIn("credentials", {
      email: "demo@oryx.app",
      password: "demo1234",
      type,
      callbackUrl: "/",
    });
  }

  return (
    <main className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-background p-4">
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 grid-texture opacity-60" />
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="glass-strong relative z-10 w-full max-w-md rounded-3xl border border-border/60 p-6 shadow-2xl shadow-black/50 sm:p-8">
        {/* Logo */}
        <div className="flex flex-col items-center text-center">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
            <span className="text-2xl font-black text-emerald-950">O</span>
            <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-amber-400 ring-2 ring-background" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            Oryx
          </h1>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            The Autonomous Mobility Operating System
          </p>
        </div>

        {/* Tabs */}
        <div className="mt-6 grid grid-cols-2 gap-1 rounded-2xl border border-border/60 bg-background/40 p-1">
          <button
            type="button"
            onClick={() => setTab("login")}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
              tab === "login"
                ? "bg-emerald-500/15 text-emerald-300"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setTab("waitlist")}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
              tab === "waitlist"
                ? "bg-emerald-500/15 text-emerald-300"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Join waitlist
          </button>
        </div>

        {/* Login form */}
        {tab === "login" && (
          <form onSubmit={handleLogin} className="mt-5 space-y-3">
            <Field
              icon={<Mail className="h-4 w-4" />}
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={loginEmail}
              onChange={setLoginEmail}
              required
              autoComplete="email"
            />
            <Field
              icon={<Lock className="h-4 w-4" />}
              label="Password"
              type="password"
              placeholder="••••••••"
              value={loginPassword}
              onChange={setLoginPassword}
              required
              autoComplete="current-password"
            />

            {loginError && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-bold text-emerald-950 shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-60"
            >
              {loginLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Enter Oryx
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Waitlist form */}
        {tab === "waitlist" && (
          wlSuccess ? (
            <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              <div>
                <p className="text-sm font-bold text-foreground">
                  You&apos;re on the waitlist!
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  The Oryx admin will approve you shortly. Once approved,
                  you&apos;ll be able to log in here.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setWlSuccess(false);
                  setTab("login");
                }}
                className="mt-2 rounded-xl border border-border/60 bg-background/40 px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-background/70"
              >
                Back to login
              </button>
            </div>
          ) : (
            <form onSubmit={handleWaitlist} className="mt-5 space-y-3">
              <Field
                icon={<UserIcon className="h-4 w-4" />}
                label="Name"
                type="text"
                placeholder="Your name"
                value={wlName}
                onChange={setWlName}
                required
                autoComplete="name"
              />
              <Field
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={wlEmail}
                onChange={setWlEmail}
                required
                autoComplete="email"
              />
              <Field
                icon={<Lock className="h-4 w-4" />}
                label="Password"
                type="password"
                placeholder="At least 6 characters"
                value={wlPassword}
                onChange={setWlPassword}
                required
                autoComplete="new-password"
              />

              {wlError && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{wlError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={wlLoading}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 px-4 py-3 text-sm font-bold text-amber-950 shadow-lg shadow-amber-500/20 transition hover:from-amber-400 hover:to-amber-500 disabled:opacity-60"
              >
                {wlLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Join the waitlist
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          )
        )}

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-border/60" />
          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Sparkles className="h-3 w-3 text-amber-400" />
            Quick demo login
          </span>
          <span className="h-px flex-1 bg-border/60" />
        </div>

        {/* Quick login grid */}
        <div className="grid grid-cols-3 gap-2">
          {ROLES.map((role) => (
            <button
              key={role.type}
              type="button"
              onClick={() => quickLogin(role.type)}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border bg-gradient-to-br p-3 text-center transition hover:scale-[1.03] ${role.accent}`}
            >
              <role.icon className="h-5 w-5" />
              <span className="text-xs font-bold">{role.label}</span>
              <span className="text-[9px] leading-tight opacity-70">
                {role.description}
              </span>
            </button>
          ))}
        </div>

        {/* Admin quick login */}
        <button
          type="button"
          onClick={() => quickLogin("admin")}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-border/60 bg-background/40 px-4 py-2.5 text-xs font-bold text-foreground transition hover:border-emerald-500/40 hover:bg-emerald-500/10"
        >
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Admin Dashboard
        </button>

        <p className="mt-4 text-center text-[10px] text-muted-foreground">
          By continuing you agree to Oryx&apos;s Terms & Privacy Policy.
        </p>
      </div>
    </main>
  );
}

/* ---------- small input field ---------- */

function Field({
  icon,
  label,
  type,
  placeholder,
  value,
  onChange,
  required,
  autoComplete,
}: {
  icon: React.ReactNode;
  label: string;
  type: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-background/40 px-3 py-2.5 transition focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/15">
        <span className="text-muted-foreground">{icon}</span>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete={autoComplete}
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
        />
      </div>
    </label>
  );
}
