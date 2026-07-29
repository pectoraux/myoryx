"use client";
import { useState } from "react";
import { useOryx } from "@/lib/store";
import { MARKET_AGENTS, AGENT_EXTENSIONS } from "@/lib/mock-data";
import { motion } from "framer-motion";
import {
  Store,
  Check,
  Plus,
  Star,
  Users,
  TrendingDown,
  Puzzle,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

export function AgentMarketplace() {
  const { subscribedAgents, toggleAgentSubscription, installedExtensions, toggleExtension } =
    useOryx();

  const installedAsAgents = AGENT_EXTENSIONS.filter((e) =>
    installedExtensions.includes(e.id)
  ).map((e) => ({
    id: `ext-${e.id}`,
    name: e.name,
    emoji: e.emoji,
    category: e.category,
    objective: e.description.slice(0, 50) + "…",
    color: e.color,
    rating: e.rating,
    subscribers: e.installs,
    avgSaving: "—",
    author: e.developer,
    isExtension: true,
    description: e.description,
  }));

  const allAgents = [...MARKET_AGENTS, ...installedAsAgents];

  return (
    <div className="px-4 pb-8 pt-1">
      {/* Hero */}
      <div className="mb-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-400">
          <Store className="h-3 w-3" /> Agent Marketplace
        </div>
        <h2 className="mt-3 text-xl font-black tracking-tight text-foreground text-balance">
          Recruit your optimization team
        </h2>
        <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
          Subscribe to multiple AI agents. Each specializes in one optimization
          variable. They run in parallel and never stop working for you.
        </p>
      </div>

      {/* Active subscriptions banner */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/12 to-transparent p-3.5"
      >
        <div className="flex -space-x-2">
          {allAgents
            .filter((a) => subscribedAgents.includes(a.id))
            .slice(0, 4)
            .map((a) => (
              <div
                key={a.id}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background text-sm"
                style={{ backgroundColor: `${a.color}25` }}
              >
                {a.emoji}
              </div>
            ))}
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-foreground/[0.06] text-[10px] font-bold text-muted-foreground">
            {subscribedAgents.length}
          </div>
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-foreground">
            {subscribedAgents.length} agent{subscribedAgents.length === 1 ? "" : "s"} on your team
          </div>
          <div className="text-[11px] text-muted-foreground">
            Running in parallel · sharing one world model
          </div>
        </div>
        <Users className="h-5 w-5 text-emerald-400" />
      </motion.div>

      {/* Agent catalog */}
      <div className="space-y-2">
        {allAgents.map((a, i) => {
          const subscribed = subscribedAgents.includes(a.id);
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`overflow-hidden rounded-2xl border p-3.5 transition ${
                subscribed
                  ? "border-emerald-500/40 bg-emerald-500/[0.05]"
                  : "border-border/50 bg-card/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg"
                  style={{ backgroundColor: `${a.color}20` }}
                >
                  {a.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{a.name}</span>
                    {a.isExtension && (
                      <span className="flex items-center gap-0.5 rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[8px] font-bold uppercase text-violet-400">
                        <Puzzle className="h-2 w-2" /> Extension
                      </span>
                    )}
                    {subscribed && (
                      <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[8px] font-bold uppercase text-emerald-400">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-medium text-muted-foreground">
                    {a.objective}
                  </div>
                  <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground/80">
                    {a.description}
                  </div>
                  {/* metrics */}
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                      {a.rating}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Users className="h-2.5 w-2.5" />
                      {a.subscribers > 999
                        ? `${(a.subscribers / 1000).toFixed(1)}k`
                        : a.subscribers}
                    </span>
                    <span className="flex items-center gap-0.5 text-emerald-400">
                      <TrendingDown className="h-2.5 w-2.5" /> {a.avgSaving}
                    </span>
                    <span className="text-muted-foreground/60">by {a.author}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    toggleAgentSubscription(a.id);
                    if (!subscribed) {
                      toast.success(`${a.name} recruited`, {
                        description: "Now running on your team.",
                      });
                    } else {
                      toast(`${a.name} removed from team`);
                    }
                  }}
                  className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                    subscribed
                      ? "border border-border/60 text-muted-foreground hover:bg-foreground/[0.04]"
                      : "bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                  }`}
                >
                  {subscribed ? (
                    <>
                      <Check className="h-3 w-3" /> On team
                    </>
                  ) : (
                    <>
                      <Plus className="h-3 w-3" /> Recruit
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// Extension store — third-party developers submit agents
export function ExtensionStore() {
  const { installedExtensions, toggleExtension } = useOryx();
  const [showSubmit, setShowSubmit] = useState(false);

  return (
    <div className="px-4 pb-8 pt-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Puzzle className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Extension store · third-party agents
          </span>
        </div>
        <button
          onClick={() => setShowSubmit(true)}
          className="flex items-center gap-1 rounded-full bg-violet-500/15 px-2.5 py-1 text-[10px] font-bold text-violet-400 transition hover:bg-violet-500/25"
        >
          <Plus className="h-3 w-3" /> Submit
        </button>
      </div>
      <p className="mb-2.5 px-1 text-[11px] text-muted-foreground">
        Developers build and publish new optimization agents. Install to recruit
        them onto your team.
      </p>

      {/* Submit form */}
      {showSubmit && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-3 overflow-hidden"
        >
          <div className="space-y-2.5 rounded-2xl border border-violet-500/30 bg-violet-500/[0.04] p-3.5">
            <div className="text-[11px] font-bold uppercase tracking-wide text-violet-400">
              Submit your extension
            </div>
            <input
              placeholder="Extension name"
              className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-violet-500/50 focus:outline-none"
            />
            <input
              placeholder="Developer / company"
              className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-violet-500/50 focus:outline-none"
            />
            <textarea
              placeholder="What does your agent optimize?"
              rows={2}
              className="w-full resize-none rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-violet-500/50 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowSubmit(false)}
                className="flex-1 rounded-lg border border-border/60 py-2 text-xs font-semibold text-muted-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSubmit(false);
                  toast.success("Extension submitted for review", {
                    description: "Oryx will verify and publish within 48h.",
                  });
                }}
                className="flex-[2] rounded-lg bg-violet-500 py-2 text-xs font-bold text-white"
              >
                Submit for review
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Extensions list */}
      <div className="space-y-2">
        {AGENT_EXTENSIONS.map((e, i) => {
          const installed = installedExtensions.includes(e.id);
          return (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`overflow-hidden rounded-2xl border p-3.5 transition ${
                e.status === "pending"
                  ? "border-amber-500/30 bg-amber-500/[0.04]"
                  : installed
                  ? "border-violet-500/40 bg-violet-500/[0.05]"
                  : "border-border/50 bg-card/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg"
                  style={{ backgroundColor: `${e.color}20` }}
                >
                  {e.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{e.name}</span>
                    {e.verified && (
                      <span className="flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[8px] font-bold uppercase text-emerald-400">
                        <Shield className="h-2 w-2" /> Verified
                      </span>
                    )}
                    {e.status === "pending" && (
                      <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[8px] font-bold uppercase text-amber-400">
                        In review
                      </span>
                    )}
                    {installed && (
                      <span className="rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[8px] font-bold uppercase text-violet-400">
                        Installed
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-medium text-muted-foreground">
                    {e.category} · v{e.version} · by {e.developer}
                  </div>
                  <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground/80">
                    {e.description}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Users className="h-2.5 w-2.5" />
                      {e.installs} installs
                    </span>
                    {e.rating > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                        {e.rating}
                      </span>
                    )}
                  </div>
                </div>
                {e.status === "published" && (
                  <button
                    onClick={() => {
                      toggleExtension(e.id);
                      if (!installed) {
                        toast.success(`${e.name} installed`, {
                          description: "Now available in your agent marketplace.",
                        });
                      }
                    }}
                    className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                      installed
                        ? "border border-border/60 text-muted-foreground"
                        : "bg-violet-500 text-white hover:bg-violet-400"
                    }`}
                  >
                    {installed ? (
                      <>
                        <Check className="h-3 w-3" /> Installed
                      </>
                    ) : (
                      <>
                        <Plus className="h-3 w-3" /> Install
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-violet-500/30 bg-violet-500/[0.05] p-3">
        <Puzzle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">For developers:</span> build
          optimization agents on the Oryx SDK. Submit, get verified, and reach every
          rider on the network.
        </p>
      </div>
    </div>
  );
}
