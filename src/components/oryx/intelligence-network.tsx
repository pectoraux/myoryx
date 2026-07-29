"use client";
import { motion } from "framer-motion";
import {
  CONNECTORS,
  KNOWLEDGE_GRAPH,
  COMMUNITY_INTEL,
} from "@/lib/mock-data";
import {
  Network,
  Cpu,
  Database,
  Activity,
  Zap,
  Brain,
  ArrowRight,
} from "lucide-react";

const CATEGORY_LABEL: Record<string, string> = {
  mapping: "Mapping",
  "ride-hail": "Ride Hailing",
  weather: "Weather",
  events: "Events",
  calendar: "Calendar",
  transit: "Public Transit",
  driver: "Driver Intel",
  rider: "Rider Intel",
};

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function IntelligenceNetwork() {
  return (
    <div className="px-4 pb-8 pt-1">
      {/* Hero — OS for mobility intelligence */}
      <div className="mb-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-cyan-400">
          <Network className="h-3 w-3" /> Mobility Intelligence Platform
        </div>
        <h2 className="mt-3 text-xl font-black tracking-tight text-foreground text-balance">
          An operating system for mobility intelligence
        </h2>
        <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
          Every connector streams into one reasoning engine. The platform is
          connector-driven — new sources plug in without architectural changes.
        </p>
      </div>

      {/* Network IQ score */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/12 via-cyan-500/4 to-transparent"
      >
        <div className="flex items-center gap-4 p-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
            <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="oklch(1 0 0 / 0.08)" strokeWidth="4" />
              <motion.circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                stroke="#22d3ee"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${(COMMUNITY_INTEL.networkIq / 100) * 150.8} 150.8`}
                initial={{ strokeDasharray: "0 150.8" }}
                animate={{ strokeDasharray: `${(COMMUNITY_INTEL.networkIq / 100) * 150.8} 150.8` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </svg>
            <span className="absolute text-sm font-black text-cyan-400">
              {COMMUNITY_INTEL.networkIq}
            </span>
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wide text-cyan-400">
              Network IQ
            </div>
            <div className="text-sm font-semibold text-foreground">
              Collective intelligence score
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {COMMUNITY_INTEL.activeConnectors} connectors · {formatCount(COMMUNITY_INTEL.tripsAnalyzed)} trips analyzed
            </div>
          </div>
        </div>
      </motion.div>

      {/* Connectors → Reasoning Engine → Knowledge Graph flow */}
      <div className="mb-4">
        <div className="mb-2 flex items-center gap-2 px-1">
          <Activity className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Data connectors · streaming live
          </span>
        </div>
        <div className="space-y-1.5">
          {CONNECTORS.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-card/40 p-2.5"
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm"
                style={{ backgroundColor: `${c.color}20` }}
              >
                {c.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-xs font-bold text-foreground">
                    {c.name}
                  </span>
                  <span className="rounded bg-foreground/[0.06] px-1 py-0.5 text-[8px] font-medium uppercase text-muted-foreground">
                    {CATEGORY_LABEL[c.category]}
                  </span>
                </div>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {c.signals.slice(0, 3).map((s) => (
                    <span key={s} className="text-[10px] text-muted-foreground/70">
                      {s}
                    </span>
                  )).reduce((acc: any[], el, idx) => {
                    if (idx > 0) acc.push(<span key={`d${idx}`} className="text-muted-foreground/30">·</span>);
                    acc.push(el);
                    return acc;
                  }, [])}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="flex items-center gap-1">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      c.status === "live"
                        ? "bg-emerald-400"
                        : c.status === "syncing"
                        ? "bg-amber-400 animate-pulse"
                        : "bg-cyan-400"
                    }`}
                  />
                  <span className="text-[9px] font-bold uppercase text-muted-foreground">
                    {c.status}
                  </span>
                </span>
                <span className="text-[9px] tabular-nums text-muted-foreground/60">
                  {c.latencyMs}ms
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Flow arrow into reasoning engine */}
        <div className="flex flex-col items-center py-2">
          <motion.div
            animate={{ y: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
            className="text-cyan-400/60"
          >
            ↓
          </motion.div>
        </div>

        {/* Unified Reasoning Engine */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="overflow-hidden rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-500/15 via-violet-500/8 to-transparent"
        >
          <div className="flex items-center gap-3 p-4">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20">
              <Cpu className="h-6 w-6 text-cyan-400" />
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-cyan-400"
              />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wide text-cyan-400">
                Unified Reasoning Engine
              </div>
              <div className="text-sm font-bold text-foreground">
                One mobility brain. Every signal reasoned together.
              </div>
              <div className="mt-1 flex gap-1.5">
                <span className="rounded-md bg-background/40 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                  negotiate
                </span>
                <span className="rounded-md bg-background/40 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                  predict
                </span>
                <span className="rounded-md bg-background/40 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                  coordinate
                </span>
                <span className="rounded-md bg-background/40 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                  optimize
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Flow arrow into knowledge graph */}
        <div className="flex flex-col items-center py-2">
          <motion.div
            animate={{ y: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, delay: 0.3 }}
            className="text-violet-400/60"
          >
            ↓
          </motion.div>
        </div>

        {/* Knowledge Graph */}
        <div className="overflow-hidden rounded-2xl border border-violet-500/30 bg-card/40">
          <div className="flex items-center gap-2 border-b border-border/40 px-3.5 py-2.5">
            <Database className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Unified Mobility Knowledge Graph
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 p-2.5">
            {KNOWLEDGE_GRAPH.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-2 rounded-lg bg-foreground/[0.03] px-2 py-1.5"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: n.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="truncate text-[11px] font-semibold text-foreground">
                    {n.label}
                  </div>
                  <div className="text-[10px] tabular-nums text-muted-foreground">
                    {formatCount(n.count)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Community intelligence stats */}
      <div className="mb-4">
        <div className="mb-2 flex items-center gap-2 px-1">
          <Brain className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Community intelligence
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Trips analyzed", value: formatCount(COMMUNITY_INTEL.tripsAnalyzed), icon: Activity, color: "text-cyan-400" },
            { label: "Routes learned", value: formatCount(COMMUNITY_INTEL.routesLearned), icon: Zap, color: "text-emerald-400" },
            { label: "Pools discovered", value: formatCount(COMMUNITY_INTEL.poolsDiscovered), icon: ArrowRight, color: "text-violet-400" },
            { label: "Demand patterns", value: String(COMMUNITY_INTEL.demandPatterns), icon: Brain, color: "text-amber-400" },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border/50 bg-card/40 p-3"
            >
              <s.icon className={`mb-1.5 h-3.5 w-3.5 ${s.color}`} />
              <div className="text-lg font-black tabular-nums text-foreground">
                {s.value}
              </div>
              <div className="text-[10px] font-medium text-muted-foreground">
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <p className="rounded-xl border border-border/40 bg-foreground/[0.02] p-3 text-center text-[11px] leading-relaxed text-muted-foreground">
        Every completed trip makes the network smarter. The network effect becomes
        <span className="font-semibold text-foreground"> intelligence</span>, not just scale.
      </p>
    </div>
  );
}
