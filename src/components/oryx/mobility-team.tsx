"use client";
import { motion } from "framer-motion";
import { TEAM_AGENTS } from "@/lib/mock-data";
import { Users, Brain, Sparkles, Activity } from "lucide-react";

const STATUS_STYLE: Record<string, { dot: string; label: string; text: string }> = {
  active: { dot: "bg-emerald-400", label: "Active", text: "text-emerald-400" },
  thinking: { dot: "bg-amber-400 animate-pulse", label: "Thinking", text: "text-amber-400" },
  idle: { dot: "bg-muted-foreground/40", label: "Idle", text: "text-muted-foreground" },
};

export function MobilityTeam() {
  const totalContribution = TEAM_AGENTS.reduce((s, a) => s + a.contribution, 0);

  return (
    <div className="px-4 pb-8 pt-1">
      {/* Hero */}
      <div className="mb-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-400">
          <Users className="h-3 w-3" /> Your AI Mobility Team
        </div>
        <h2 className="mt-3 text-xl font-black tracking-tight text-foreground text-balance">
          Not one assistant. An entire workforce.
        </h2>
        <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
          Every rider recruits an autonomous AI team. All agents share one
          long-term memory and unified world model — each optimizes one variable
          that influences price.
        </p>
      </div>

      {/* Team overview banner */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 flex items-center gap-3 rounded-2xl border border-border/50 bg-card/40 p-3.5"
      >
        <div className="flex -space-x-2">
          {TEAM_AGENTS.slice(0, 5).map((a) => (
            <div
              key={a.id}
              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background text-sm"
              style={{ backgroundColor: `${a.color}25` }}
            >
              {a.emoji}
            </div>
          ))}
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-foreground/[0.06] text-[10px] font-bold text-muted-foreground">
            +2
          </div>
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-foreground">
            7 agents · 5 active now
          </div>
          <div className="text-[11px] text-muted-foreground">
            Shared memory · model v312 · 94.2% accuracy
          </div>
        </div>
        <Brain className="h-5 w-5 text-emerald-400" />
      </motion.div>

      {/* Agent cards */}
      <div className="space-y-2">
        {TEAM_AGENTS.map((a, i) => {
          const st = STATUS_STYLE[a.status];
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="overflow-hidden rounded-2xl border border-border/50 bg-card/40"
            >
              <div className="flex items-start gap-3 p-3.5">
                <div
                  className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg"
                  style={{ backgroundColor: `${a.color}20` }}
                >
                  {a.emoji}
                  {a.status === "active" && (
                    <motion.span
                      animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 rounded-xl"
                      style={{ backgroundColor: a.color, opacity: 0.3 }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      {a.name}
                    </span>
                    <span className={`flex items-center gap-1 text-[9px] font-bold uppercase ${st.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-muted-foreground">
                    {a.role}
                  </div>
                  {/* Live activity */}
                  <div className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-foreground/[0.03] px-2 py-1.5">
                    <Activity className="mt-0.5 h-3 w-3 shrink-0" style={{ color: a.color }} />
                    <span className="text-[11px] leading-snug text-muted-foreground">
                      {a.activity}
                    </span>
                  </div>
                  {/* Metrics */}
                  <div className="mt-2 flex gap-3">
                    {a.metrics.map((m) => (
                      <div key={m.label}>
                        <div className="text-[9px] font-medium uppercase text-muted-foreground/60">
                          {m.label}
                        </div>
                        <div className="text-xs font-bold tabular-nums text-foreground">
                          {m.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Contribution */}
                <div className="flex flex-col items-end">
                  <div className="text-[9px] font-medium uppercase text-muted-foreground/60">
                    Contribution
                  </div>
                  <div className="text-sm font-black tabular-nums" style={{ color: a.color }}>
                    {Math.round((a.contribution / totalContribution) * 100)}%
                  </div>
                </div>
              </div>
              {/* Contribution bar */}
              <div className="h-1 w-full bg-foreground/[0.04]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(a.contribution / totalContribution) * 100}%` }}
                  transition={{ delay: i * 0.05 + 0.2, duration: 0.8, ease: "easeOut" }}
                  className="h-full"
                  style={{ backgroundColor: a.color }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.05] p-3">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Your team negotiates continuously, discovers discounts, watches every
          marketplace, and keeps optimizing even after you book. You never touch it.
        </p>
      </div>
    </div>
  );
}
