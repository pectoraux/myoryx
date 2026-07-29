"use client";

// ============================================================================
// Oryx — Autonomous AI Workforce (M7–M9)
// The flagship "Team" tab: live reasoning, current tasks, learned
// optimizations, agent-to-agent cooperation, and full explainability.
//
// Data sources (all relative, all JSON):
//   GET  /api/kernel/agents                 — array of agents + memory
//   GET  /api/kernel/agents?team=...        — filter
//   GET  /api/kernel/agents?detail=full&agentId=...
//   POST /api/kernel/agents                 — activate|deactivate|configure|
//                                              enqueueTask|startNegotiation|
//                                              delegate|shareInfo
//   GET  /api/kernel/negotiations           — recent negotiations
//   GET  /api/kernel/cooperations           — recent cooperations
//   GET  /api/kernel/ai-stats               — runtime totals
// ============================================================================

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  Area,
  AreaChart,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  Bot,
  Brain,
  Users,
  Zap,
  Activity,
  Sparkles,
  Network,
  Handshake,
  Send,
  Radio,
  TrendingDown,
  TrendingUp,
  Wallet,
  Clock,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  Plus,
  Sliders,
  Lock,
  Unlock,
  GraduationCap,
  Lightbulb,
  Workflow,
  ArrowRight,
  BarChart3,
  Loader2,
  CircuitBoard,
  MessageCircle,
  CircleDot,
  ListChecks,
  Timer,
  Plug,
  Database,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types (mirrored from src/lib/kernel/types.ts — the API returns these shapes)
// ---------------------------------------------------------------------------

type AgentTeam = "rider" | "driver" | "fleet" | "merchant";
type AgentStatus = "active" | "thinking" | "negotiating" | "idle" | "learning";
type TaskStatus = "queued" | "running" | "completed" | "failed";
type CoopType = "shared_plan" | "delegated_task" | "negotiation" | "information_share";
type CoopOutcome = "success" | "pending" | "failed";
type DetailTab = "reasoning" | "tasks" | "learned" | "config";

interface AgentMetrics {
  agentId: string;
  tasksCompleted: number;
  tasksFailed: number;
  negotiationsWon: number;
  negotiationsLost: number;
  totalSavingsGenerated: number;
  avgConfidence: number;
  avgTaskDurationMs: number;
  lastActiveAt: number;
  dailyStats: Array<{ date: string; tasks: number; savings: number; successRate: number }>;
}

interface AgentConfig {
  agentId: string;
  enabled: boolean;
  aggressiveness: number;
  riskTolerance: number;
  learningEnabled: boolean;
  permissionOverrides: string[];
  params: Record<string, unknown>;
}

interface AgentDecision {
  id: string;
  agentId: string;
  reasoning: string;
  action: string;
  timestamp: number;
  outcome?: "success" | "failure" | "pending";
  triggeredBy?: string;
  confidence?: number;
  reasoningSteps?: string[];
}

interface AgentTask {
  id: string;
  agentId: string;
  type: string;
  description: string;
  status: TaskStatus;
  intentId?: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  reasoningSteps: string[];
}

interface LearnedOptimization {
  id: string;
  agentId: string;
  pattern: string;
  insight: string;
  confidence: number;
  appliedCount: number;
  learnedAt: number;
  optimization: { type: string; params: Record<string, unknown> };
}

interface AgentWithMemory {
  id: string;
  role: string;
  name: string;
  emoji: string;
  color: string;
  team: AgentTeam;
  description: string;
  tools: string[];
  subscribesTo: string[];
  policy: { canBook: boolean; canNegotiate: boolean; maxSpendPerRide?: number };
  status: AgentStatus;
  active: boolean;
  config: AgentConfig;
  metrics: AgentMetrics;
  recentDecisions: AgentDecision[];
  recentTasks: AgentTask[];
  learnedOptimizations: LearnedOptimization[];
  facts: number;
}

interface AgentNegotiation {
  id: string;
  buyerAgentId: string;
  sellerAgentId: string;
  asset: string;
  status: "negotiating" | "settled" | "rejected";
  rounds: Array<{
    round: number;
    agentId: string;
    action: "offer" | "counter" | "accept" | "reject";
    price: number;
    reasoning: string;
    timestamp: number;
  }>;
  openingPrice: number;
  currentPrice: number;
  settledPrice?: number;
  startedAt: number;
  settledAt?: number;
}

interface AgentCooperation {
  id: string;
  agents: string[];
  type: CoopType;
  description: string;
  timestamp: number;
  outcome: CoopOutcome;
}

interface AIStats {
  totalAgents: number;
  activeAgents: number;
  queuedTasks: number;
  activeNegotiations: number;
  totalLearned: number;
  totalSavings: number;
  totalCooperations: number;
}

// ---------------------------------------------------------------------------
// Constants + helpers
// ---------------------------------------------------------------------------

const POLL_MS = 3000;

const TEAM_META: Record<
  AgentTeam,
  { emoji: string; label: string; accent: string; text: string; bg: string; border: string; ring: string }
> = {
  rider: {
    emoji: "🧍",
    label: "Rider",
    accent: "emerald",
    text: "text-emerald-400",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    ring: "ring-emerald-500/40",
  },
  driver: {
    emoji: "🚗",
    label: "Driver",
    accent: "amber",
    text: "text-amber-400",
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
    ring: "ring-amber-500/40",
  },
  fleet: {
    emoji: "🚐",
    label: "Fleet",
    accent: "orange",
    text: "text-orange-400",
    bg: "bg-orange-500/15",
    border: "border-orange-500/30",
    ring: "ring-orange-500/40",
  },
  merchant: {
    emoji: "📦",
    label: "Merchant",
    accent: "violet",
    text: "text-violet-400",
    bg: "bg-violet-500/15",
    border: "border-violet-500/30",
    ring: "ring-violet-500/40",
  },
};

const STATUS_META: Record<
  AgentStatus,
  { label: string; dot: string; text: string; bg: string; border: string; pulse: boolean }
> = {
  active: {
    label: "Active",
    dot: "bg-emerald-400",
    text: "text-emerald-400",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    pulse: true,
  },
  thinking: {
    label: "Thinking",
    dot: "bg-amber-400",
    text: "text-amber-400",
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
    pulse: true,
  },
  negotiating: {
    label: "Negotiating",
    dot: "bg-violet-400",
    text: "text-violet-400",
    bg: "bg-violet-500/15",
    border: "border-violet-500/30",
    pulse: true,
  },
  learning: {
    label: "Learning",
    dot: "bg-cyan-400",
    text: "text-cyan-400",
    bg: "bg-cyan-500/15",
    border: "border-cyan-500/30",
    pulse: true,
  },
  idle: {
    label: "Idle",
    dot: "bg-zinc-500",
    text: "text-zinc-400",
    bg: "bg-zinc-500/10",
    border: "border-zinc-500/30",
    pulse: false,
  },
};

const TASK_STATUS_META: Record<
  TaskStatus,
  { label: string; text: string; bg: string; border: string; dot: string }
> = {
  queued: {
    label: "Queued",
    text: "text-zinc-300",
    bg: "bg-zinc-500/15",
    border: "border-zinc-500/30",
    dot: "bg-zinc-400",
  },
  running: {
    label: "Running",
    text: "text-amber-300",
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
    dot: "bg-amber-400",
  },
  completed: {
    label: "Done",
    text: "text-emerald-300",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  failed: {
    label: "Failed",
    text: "text-rose-300",
    bg: "bg-rose-500/15",
    border: "border-rose-500/30",
    dot: "bg-rose-400",
  },
};

const COOP_META: Record<
  CoopType,
  { icon: typeof Handshake; label: string; color: string; bg: string }
> = {
  shared_plan: { icon: Handshake, label: "Shared Plan", color: "text-violet-400", bg: "bg-violet-500/15" },
  delegated_task: { icon: Send, label: "Delegated Task", color: "text-amber-400", bg: "bg-amber-500/15" },
  negotiation: { icon: MessageCircle, label: "Negotiation", color: "text-emerald-400", bg: "bg-emerald-500/15" },
  information_share: { icon: Radio, label: "Information Share", color: "text-cyan-400", bg: "bg-cyan-500/15" },
};

const OUTCOME_META: Record<CoopOutcome, { label: string; text: string; bg: string; dot: string }> = {
  success: { label: "Success", text: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400" },
  pending: { label: "Pending", text: "text-amber-300", bg: "bg-amber-500/15", dot: "bg-amber-400 animate-pulse" },
  failed: { label: "Failed", text: "text-rose-300", bg: "bg-rose-500/15", dot: "bg-rose-400" },
};

const PERMISSION_KINDS = ["book", "negotiate", "delegate", "share_info", "learn", "reroute", "vet", "broadcast"];

function fmtCedis(n: number): string {
  if (!n || n === 0) return "GH₵0";
  if (n < 1) return `GH₵${n.toFixed(2)}`;
  if (n < 100) return `GH₵${n.toFixed(2)}`;
  return `GH₵${Math.round(n).toLocaleString()}`;
}

function fmtNum(n: number): string {
  return n.toLocaleString();
}

function fmtAgo(ts: number | undefined): string {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  if (diff < 5000) return "now";
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function fmtDuration(ms: number | undefined): string {
  if (!ms || ms <= 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

function fmtTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function fmtDateShort(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function confidenceColor(c: number): string {
  if (c >= 85) return "text-emerald-400 bg-emerald-500/15 border-emerald-500/30";
  if (c >= 70) return "text-amber-400 bg-amber-500/15 border-amber-500/30";
  if (c >= 50) return "text-orange-400 bg-orange-500/15 border-orange-500/30";
  return "text-rose-400 bg-rose-500/15 border-rose-500/30";
}

function teamOf(id: string): AgentTeam | undefined {
  // Best-effort: ids like "a-savings" → rider; "d-..." → driver; "f-..." → fleet; "m-..." → merchant.
  if (id.startsWith("a-")) return "rider";
  if (id.startsWith("d-")) return "driver";
  if (id.startsWith("f-")) return "fleet";
  if (id.startsWith("m-")) return "merchant";
  return undefined;
}

function shortId(id: string): string {
  return id.length > 14 ? `${id.slice(0, 12)}…` : id;
}

// ---------------------------------------------------------------------------
// Sub-components (hoisted to module scope for react-hooks/static-components)
// ---------------------------------------------------------------------------

// ----- Section 1: Team overview banner ------------------------------------

function TeamColumn({
  team,
  agents,
}: {
  team: AgentTeam;
  agents: AgentWithMemory[];
}) {
  const meta = TEAM_META[team];
  const total = agents.length;
  const active = agents.filter((a) => a.active).length;
  const savings = agents.reduce((s, a) => s + a.metrics.totalSavingsGenerated, 0);
  const learned = agents.reduce((s, a) => s + a.learnedOptimizations.length, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`relative overflow-hidden rounded-2xl border ${meta.border} ${meta.bg} p-3`}
    >
      <div className="absolute -right-3 -top-3 text-5xl opacity-15">{meta.emoji}</div>
      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="text-xl">{meta.emoji}</span>
          <div className="min-w-0 flex-1">
            <div className={`text-[10px] font-bold uppercase tracking-wider ${meta.text}`}>
              {meta.label} Team
            </div>
            <div className="text-sm font-black text-foreground tabular-nums">
              {total} agent{total === 1 ? "" : "s"}
            </div>
          </div>
        </div>
        <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-center">
          <StatPip label="Active" value={active} textCls={meta.text} />
          <StatPip label="Learned" value={learned} textCls="text-cyan-400" />
          <StatPip label="Savings" value={fmtCedis(savings)} textCls="text-emerald-400" />
        </div>
      </div>
    </motion.div>
  );
}

function StatPip({
  label,
  value,
  textCls,
}: {
  label: string;
  value: string | number;
  textCls: string;
}) {
  return (
    <div className="rounded-lg bg-background/40 px-1 py-1.5">
      <div className={`text-[11px] font-black tabular-nums leading-none ${textCls}`}>{value}</div>
      <div className="mt-0.5 text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function RuntimeStrip({ stats }: { stats: AIStats | null }) {
  const items: Array<{ label: string; value: string; icon: typeof Bot; color: string }> = [
    { label: "Agents", value: fmtNum(stats?.totalAgents ?? 0), icon: Bot, color: "text-foreground" },
    { label: "Active", value: fmtNum(stats?.activeAgents ?? 0), icon: Activity, color: "text-emerald-400" },
    { label: "Queued", value: fmtNum(stats?.queuedTasks ?? 0), icon: ListChecks, color: "text-amber-400" },
    { label: "Negotiating", value: fmtNum(stats?.activeNegotiations ?? 0), icon: Handshake, color: "text-violet-400" },
    { label: "Learned", value: fmtNum(stats?.totalLearned ?? 0), icon: GraduationCap, color: "text-cyan-400" },
    { label: "Savings", value: fmtCedis(stats?.totalSavings ?? 0), icon: TrendingDown, color: "text-emerald-400" },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-stretch gap-2 overflow-x-auto rounded-2xl border border-border/50 bg-card/60 p-2 scroll-thin"
    >
      {items.map((it, i) => {
        const Ic = it.icon;
        return (
          <div
            key={it.label}
            className={`flex min-w-[88px] flex-1 items-center gap-2 rounded-xl bg-background/40 px-2.5 py-1.5 ${
              i < items.length - 1 ? "border-r border-border/30" : ""
            }`}
          >
            <Ic className={`h-3.5 w-3.5 shrink-0 ${it.color}`} />
            <div className="min-w-0">
              <div className="text-sm font-black tabular-nums leading-none text-foreground">
                {it.value}
              </div>
              <div className="mt-0.5 text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                {it.label}
              </div>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}

// ----- Section 2: Agent card + grid ---------------------------------------

function AgentCard({
  agent,
  onClick,
  onToggle,
}: {
  agent: AgentWithMemory;
  onClick: () => void;
  onToggle: (next: boolean) => void;
}) {
  const meta = TEAM_META[agent.team];
  const st = STATUS_META[agent.status];
  const m = agent.metrics;
  const wonLoss = m.negotiationsWon + m.negotiationsLost;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border/50 bg-card/70 p-3.5 ring-1 ring-transparent transition hover:border-border hover:ring-1 hover:ring-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
    >
      {/* Top-left team tint */}
      <div
        className="pointer-events-none absolute -left-10 -top-10 h-24 w-24 rounded-full opacity-20 blur-2xl"
        style={{ backgroundColor: agent.color }}
      />
      <div className="relative flex items-start gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl text-xl ring-1"
            style={{
              backgroundColor: `${agent.color}22`,
              boxShadow: `inset 0 0 0 1px ${agent.color}40`,
            }}
          >
            <span>{agent.emoji}</span>
          </div>
          {/* status dot */}
          <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background">
            {st.pulse ? (
              <motion.span
                animate={{ scale: [1, 1.4, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
                className={`absolute h-3 w-3 rounded-full ${st.dot}`}
              />
            ) : null}
            <span className={`relative h-2.5 w-2.5 rounded-full ${st.dot}`} />
          </div>
        </div>

        {/* Name + role + team */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-black text-foreground">{agent.name}</div>
              <div className="truncate text-[11px] text-muted-foreground">
                {agent.role.replace(/_/g, " ")}
              </div>
            </div>
            {/* active toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle(!agent.active);
              }}
              aria-label={agent.active ? "Deactivate agent" : "Activate agent"}
              className={`relative h-5 w-9 shrink-0 rounded-full transition ${
                agent.active ? "bg-emerald-500" : "bg-zinc-600"
              }`}
            >
              <motion.span
                layout
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow ${
                  agent.active ? "left-4" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {/* status badge */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${st.bg} ${st.border} ${st.text}`}
            >
              <span className={`h-1 w-1 rounded-full ${st.dot}`} />
              {st.label}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${meta.bg} ${meta.border} ${meta.text}`}
            >
              {meta.emoji} {meta.label}
            </span>
          </div>

          {/* description */}
          <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
            {agent.description}
          </p>
        </div>
      </div>

      {/* Sparkline */}
      <div className="relative mt-2.5 h-10">
        <Sparkline data={m.dailyStats} color={agent.color} />
      </div>

      {/* metrics row */}
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        <Metric label="Tasks" value={fmtNum(m.tasksCompleted)} color="text-foreground" />
        <Metric label="Savings" value={fmtCedis(m.totalSavingsGenerated)} color="text-emerald-400" />
        <Metric label="Conf" value={`${m.avgConfidence}%`} color="text-cyan-400" />
        <Metric
          label="W/L"
          value={wonLoss === 0 ? "0/0" : `${m.negotiationsWon}/${m.negotiationsLost}`}
          color="text-violet-400"
        />
      </div>

      {/* Hover hint */}
      <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-1.5 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-cyan-400" />
          {agent.learnedOptimizations.length} learned
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-foreground/70 transition group-hover:text-emerald-400">
          Inspect <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </motion.div>
  );
}

function Metric({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-lg bg-background/40 px-1.5 py-1">
      <div className={`text-[11px] font-black tabular-nums leading-none ${color}`}>{value}</div>
      <div className="mt-0.5 text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function Sparkline({
  data,
  color,
}: {
  data: Array<{ date: string; tasks: number; savings: number; successRate: number }>;
  color: string;
}) {
  // Build a 7-day rolling window so the chart is stable in width even when the
  // agent has just a couple of data points.
  const filled = useMemo(() => {
    const out: Array<{ date: string; savings: number; tasks: number }> = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const match = data.find((x) => x.date === iso);
      out.push({
        date: iso,
        savings: match ? Math.round(match.savings * 100) / 100 : 0,
        tasks: match ? match.tasks : 0,
      });
    }
    return out;
  }, [data]);

  if (filled.every((d) => d.savings === 0)) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border/40 bg-background/20">
        <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/60">
          No activity yet
        </span>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={filled} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="savings"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${color.replace("#", "")})`}
          isAnimationActive={false}
        />
        <RechartsTooltip
          cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "3 3" }}
          content={<SparkTip color={color} />}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function SparkTip({ active, payload, color }: any) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload as { date: string; savings: number; tasks: number };
  return (
    <div className="rounded-lg border border-border/60 bg-popover/95 px-2 py-1.5 text-[10px] shadow-lg">
      <div className="font-semibold text-foreground">{fmtDateShort(new Date(p.date).getTime())}</div>
      <div className="flex items-center gap-1" style={{ color }}>
        <Wallet className="h-2.5 w-2.5" /> {fmtCedis(p.savings)}
      </div>
      <div className="text-muted-foreground">{p.tasks} task{p.tasks === 1 ? "" : "s"}</div>
    </div>
  );
}

// ----- Section 3: Agent Detail Panel (flagship) ---------------------------

function DetailPanel({
  agent,
  agents,
  onClose,
  onConfigured,
  onTaskEnqueued,
  busy,
}: {
  agent: AgentWithMemory;
  agents: AgentWithMemory[];
  onClose: () => void;
  onConfigured: (agentId: string, updates: Record<string, unknown>) => Promise<void>;
  onTaskEnqueued: (agentId: string, type: string, description: string, intentId: string) => Promise<void>;
  busy: boolean;
}) {
  const [tab, setTab] = useState<DetailTab>("reasoning");

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 36 }}
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm md:inset-y-0 md:left-auto md:right-0 md:w-[640px]"
      role="dialog"
      aria-modal="true"
      aria-label={`${agent.name} detail panel`}
    >
      {/* Click-out catcher */}
      <button
        aria-label="Close panel"
        onClick={onClose}
        className="absolute inset-0 -z-10 cursor-default"
      />
      <div className="relative flex h-full w-full flex-col overflow-hidden border-l border-border/60 bg-background shadow-2xl">
        <DetailHeader agent={agent} onClose={onClose} />
        <DetailTabs tab={tab} setTab={setTab} agent={agent} />
        <div className="flex-1 overflow-y-auto scroll-thin">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="p-3.5"
            >
              {tab === "reasoning" && <DetailReasoning agent={agent} />}
              {tab === "tasks" && (
                <DetailTasks agent={agent} busy={busy} onTaskEnqueued={onTaskEnqueued} />
              )}
              {tab === "learned" && <DetailLearned agent={agent} />}
              {tab === "config" && (
                <DetailConfig
                  agent={agent}
                  agents={agents}
                  busy={busy}
                  onConfigured={onConfigured}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function DetailHeader({ agent, onClose }: { agent: AgentWithMemory; onClose: () => void }) {
  const meta = TEAM_META[agent.team];
  const st = STATUS_META[agent.status];
  return (
    <div className="relative overflow-hidden border-b border-border/50 bg-gradient-to-br from-card/80 to-background p-3.5">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-15 blur-3xl"
        style={{ backgroundColor: agent.color }}
      />
      <div className="relative flex items-start gap-3">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl"
          style={{ backgroundColor: `${agent.color}22`, boxShadow: `inset 0 0 0 1px ${agent.color}55` }}
        >
          <span>{agent.emoji}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-black text-foreground">{agent.name}</h2>
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${st.bg} ${st.border} ${st.text}`}
            >
              <span className={`h-1 w-1 rounded-full ${st.dot}`} />
              {st.label}
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${meta.bg} ${meta.border} ${meta.text}`}
            >
              {meta.emoji} {meta.label}
            </span>
            <span className="font-mono text-[10px]">{agent.role}</span>
            <span className="text-muted-foreground/60">·</span>
            <span className="text-muted-foreground">{agent.facts} facts in memory</span>
          </div>
          <p className="mt-1.5 text-[11px] leading-snug text-foreground/80">{agent.description}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 rounded-lg border border-border/50 bg-background/60 p-1.5 text-muted-foreground transition hover:bg-background hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function DetailTabs({
  tab,
  setTab,
  agent,
}: {
  tab: DetailTab;
  setTab: (t: DetailTab) => void;
  agent: AgentWithMemory;
}) {
  const tabs: Array<{ id: DetailTab; label: string; icon: typeof Brain; count?: number }> = [
    { id: "reasoning", label: "Reasoning", icon: Brain, count: agent.recentDecisions.length },
    { id: "tasks", label: "Tasks", icon: ListChecks, count: agent.recentTasks.length },
    { id: "learned", label: "Learned", icon: GraduationCap, count: agent.learnedOptimizations.length },
    { id: "config", label: "Config", icon: Sliders },
  ];
  return (
    <div className="flex items-stretch gap-1 border-b border-border/50 bg-background/60 px-2">
      {tabs.map((t) => {
        const active = tab === t.id;
        const Ic = t.icon;
        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-t-lg px-2 py-2.5 text-[11px] font-bold transition ${
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {active && (
              <motion.div
                layoutId="detail-tab-active"
                className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-emerald-500"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <Ic className="relative h-3.5 w-3.5" />
            <span className="relative">{t.label}</span>
            {typeof t.count === "number" && t.count > 0 && (
              <span
                className={`relative rounded-full px-1.5 py-0.5 text-[9px] font-black tabular-nums ${
                  active ? "bg-emerald-500/20 text-emerald-300" : "bg-foreground/[0.06] text-muted-foreground"
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ----- Detail sub-tab a) Reasoning -----------------------------------------

function DetailReasoning({ agent }: { agent: AgentWithMemory }) {
  const decisions = agent.recentDecisions;
  if (decisions.length === 0) {
    return (
      <EmptyState
        icon={Brain}
        accent="text-amber-400"
        title="No decisions yet"
        sub="This agent will surface its reasoning here as soon as it picks up a task or reacts to an event."
      />
    );
  }
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <Activity className="h-3 w-3 text-amber-400" />
        Live reasoning trace · auto-refresh 3s
      </div>
      <div className="relative">
        {/* vertical spine */}
        <div className="absolute bottom-2 left-[14px] top-2 w-px bg-border/60" />
        <div className="space-y-3">
          {decisions.map((d, i) => (
            <DecisionCard key={d.id} decision={d} idx={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DecisionCard({ decision, idx }: { decision: AgentDecision; idx: number }) {
  const conf = decision.confidence ?? 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      className="relative pl-8"
    >
      {/* node dot */}
      <div className="absolute left-[10px] top-2 flex h-3 w-3 items-center justify-center rounded-full border-2 border-background bg-amber-500">
        <span className="h-1 w-1 rounded-full bg-amber-200" />
      </div>
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60">
        {/* header */}
        <div className="flex items-center justify-between gap-2 border-b border-border/40 bg-background/40 px-2.5 py-1.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="rounded bg-foreground/[0.06] px-1 py-0.5 font-mono text-[9px] font-bold text-foreground/70">
              {decision.action}
            </span>
            {decision.triggeredBy && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <Zap className="h-2.5 w-2.5 text-amber-400" />
                <span className="font-mono">{decision.triggeredBy}</span>
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {conf > 0 && (
              <span
                className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold tabular-nums ${confidenceColor(conf)}`}
              >
                {conf}% conf
              </span>
            )}
            <span className="text-[9px] font-medium tabular-nums text-muted-foreground">
              {fmtTime(decision.timestamp)}
            </span>
          </div>
        </div>
        {/* reasoning text */}
        <div className="px-2.5 py-1.5 text-[11px] leading-snug text-foreground/85">
          {decision.reasoning}
        </div>
        {/* reasoning steps — terminal trace */}
        {decision.reasoningSteps && decision.reasoningSteps.length > 0 && (
          <ReasoningTrace steps={decision.reasoningSteps} />
        )}
      </div>
    </motion.div>
  );
}

function ReasoningTrace({ steps }: { steps: string[] }) {
  return (
    <div className="border-t border-border/40 bg-zinc-950/60 p-2.5">
      <div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400/80">
        <CircuitBoard className="h-2.5 w-2.5" />
        Reasoning trace
      </div>
      <div className="space-y-0.5 font-mono text-[10px] leading-snug">
        {steps.map((s, i) => (
          <div key={i} className="flex gap-2">
            <span className="select-none text-zinc-600">
              {String(i + 1).padStart(2, "0")}
              <span className="mx-1 text-zinc-700">│</span>
            </span>
            <span className="flex-1 text-foreground/85">{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----- Detail sub-tab b) Tasks ---------------------------------------------

function DetailTasks({
  agent,
  busy,
  onTaskEnqueued,
}: {
  agent: AgentWithMemory;
  busy: boolean;
  onTaskEnqueued: (agentId: string, type: string, description: string, intentId: string) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const tasks = agent.recentTasks;
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <ListChecks className="h-3 w-3 text-emerald-400" />
          Recent tasks · auto-refresh 3s
        </div>
        <button
          onClick={() => setAdding((a) => !a)}
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-300 transition hover:bg-emerald-500/25"
        >
          {adding ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          {adding ? "Cancel" : "Assign task"}
        </button>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <AssignTaskForm
              busy={busy}
              onCancel={() => setAdding(false)}
              onSubmit={async (type, description, intentId) => {
                await onTaskEnqueued(agent.id, type, description, intentId);
                setAdding(false);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {tasks.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          accent="text-emerald-400"
          title="No tasks yet"
          sub="Assign this agent a task above. Tasks trigger real reasoning — the agent checks its memory, applies learned optimizations, and emits a decision."
        />
      ) : (
        <div className="space-y-2">
          {tasks.map((t, i) => (
            <TaskCard key={t.id} task={t} idx={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, idx }: { task: AgentTask; idx: number }) {
  const meta = TASK_STATUS_META[task.status];
  const dur =
    task.startedAt && task.completedAt ? task.completedAt - task.startedAt : undefined;
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      className="overflow-hidden rounded-xl border border-border/60 bg-card/60"
    >
      <div className="flex items-start justify-between gap-2 border-b border-border/40 bg-background/40 px-2.5 py-1.5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-foreground/[0.06] px-1 py-0.5 font-mono text-[9px] font-bold text-foreground/70">
              {task.type}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${meta.bg} ${meta.border} ${meta.text}`}
            >
              <span className={`h-1 w-1 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>
            {task.intentId && (
              <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground">
                <Plug className="h-2.5 w-2.5" />
                <span className="font-mono">{shortId(task.intentId)}</span>
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-[11px] font-semibold text-foreground">{task.description}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[9px] font-medium tabular-nums text-muted-foreground">
            {fmtTime(task.createdAt)}
          </div>
          {dur !== undefined && (
            <div className="mt-0.5 inline-flex items-center gap-0.5 text-[9px] font-bold tabular-nums text-cyan-400">
              <Timer className="h-2.5 w-2.5" />
              {fmtDuration(dur)}
            </div>
          )}
        </div>
      </div>

      {/* reasoning trace */}
      {task.reasoningSteps && task.reasoningSteps.length > 0 && (
        <ReasoningTrace steps={task.reasoningSteps} />
      )}

      {/* input/output */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-2 border-t border-border/40 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground transition hover:text-foreground"
      >
        <span className="inline-flex items-center gap-1.5">
          <Database className="h-2.5 w-2.5" />
          Input {task.output ? "/ Output" : ""}
        </span>
        <ChevronDown
          className={`h-3 w-3 transition ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-border/40 bg-zinc-950/60 p-2.5"
          >
            <div className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-cyan-400/80">
              Input
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded bg-background/40 p-1.5 font-mono text-[10px] text-foreground/80 scroll-thin">
              {JSON.stringify(task.input, null, 2)}
            </pre>
            {task.output && (
              <>
                <div className="mb-1.5 mt-2 text-[9px] font-bold uppercase tracking-wider text-emerald-400/80">
                  Output
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded bg-background/40 p-1.5 font-mono text-[10px] text-foreground/80 scroll-thin">
                  {JSON.stringify(task.output, null, 2)}
                </pre>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AssignTaskForm({
  busy,
  onSubmit,
  onCancel,
}: {
  busy: boolean;
  onSubmit: (type: string, description: string, intentId: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [type, setType] = useState("optimize_intent");
  const [description, setDescription] = useState("");
  const [intentId, setIntentId] = useState("");
  const types = [
    "optimize_intent",
    "negotiate_bid",
    "find_pool",
    "predict_demand",
    "build_schedule",
  ];
  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-2.5">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
        Assign a new task
      </div>
      <div className="space-y-2">
        <div>
          <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-lg border border-border/60 bg-background/60 px-2 py-1.5 text-[11px] text-foreground outline-none focus:border-emerald-500/60"
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Description
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Optimize commute for East Legon → Airport"
            className="w-full rounded-lg border border-border/60 bg-background/60 px-2 py-1.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-emerald-500/60"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Intent ID (optional)
          </label>
          <input
            value={intentId}
            onChange={(e) => setIntentId(e.target.value)}
            placeholder="e.g. intent-abc123"
            className="w-full rounded-lg border border-border/60 bg-background/60 px-2 py-1.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-emerald-500/60"
          />
        </div>
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={onCancel}
            className="rounded-lg border border-border/50 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition hover:text-foreground"
          >
            Cancel
          </button>
          <button
            disabled={busy || !description.trim()}
            onClick={() => onSubmit(type, description.trim(), intentId.trim())}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            Enqueue
          </button>
        </div>
      </div>
    </div>
  );
}

// ----- Detail sub-tab c) Learned Optimizations ----------------------------

function DetailLearned({ agent }: { agent: AgentWithMemory }) {
  const learned = agent.learnedOptimizations;
  const totalTasks = agent.metrics.tasksCompleted + agent.metrics.tasksFailed;
  return (
    <div className="space-y-2.5">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/[0.10] via-violet-500/[0.05] to-transparent p-2.5"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20">
            <GraduationCap className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-wide text-cyan-400">
              Learning agent
            </div>
            <div className="text-sm font-black text-foreground">
              {agent.name} has learned{" "}
              <span className="text-cyan-400 tabular-nums">{learned.length}</span>{" "}
              optimization{learned.length === 1 ? "" : "s"} from{" "}
              <span className="text-cyan-400 tabular-nums">{totalTasks}</span> task
              {totalTasks === 1 ? "" : "s"}.
            </div>
          </div>
        </div>
      </motion.div>

      {learned.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          accent="text-cyan-400"
          title="No learned optimizations yet"
          sub="This agent will discover reusable patterns as it completes more tasks. Each learned optimization is applied automatically to future tasks."
        />
      ) : (
        <div className="space-y-2">
          {learned.map((l, i) => (
            <LearnedCard key={l.id} learned={l} idx={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function LearnedCard({ learned, idx }: { learned: LearnedOptimization; idx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      className="overflow-hidden rounded-xl border border-border/60 bg-card/60"
    >
      <div className="flex items-start gap-2.5 p-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15">
          <Lightbulb className="h-4 w-4 text-cyan-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[11px] font-black text-foreground">{learned.pattern}</div>
            <span
              className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-bold tabular-nums ${confidenceColor(
                learned.confidence
              )}`}
            >
              {learned.confidence}% conf
            </span>
          </div>
          <p className="mt-1 text-[10px] leading-snug text-muted-foreground">{learned.insight}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[9px]">
            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.5 font-bold text-emerald-300">
              <TrendingUp className="h-2.5 w-2.5" />
              Applied {learned.appliedCount}×
            </span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Clock className="h-2.5 w-2.5" />
              learned {fmtAgo(learned.learnedAt)}
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-violet-500/15 px-1.5 py-0.5 font-bold text-violet-300">
              <Workflow className="h-2.5 w-2.5" />
              type: {learned.optimization.type}
            </span>
          </div>
        </div>
      </div>
      {/* optimization recipe */}
      <div className="border-t border-border/40 bg-zinc-950/60 p-2.5">
        <div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-violet-400/80">
          Optimization recipe
        </div>
        <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded bg-background/40 p-1.5 font-mono text-[10px] text-foreground/80 scroll-thin">
          {JSON.stringify(learned.optimization.params, null, 2)}
        </pre>
      </div>
    </motion.div>
  );
}

// ----- Detail sub-tab d) Configuration ------------------------------------

function DetailConfig({
  agent,
  agents,
  busy,
  onConfigured,
}: {
  agent: AgentWithMemory;
  agents: AgentWithMemory[];
  busy: boolean;
  onConfigured: (agentId: string, updates: Record<string, unknown>) => Promise<void>;
}) {
  const [aggressiveness, setAggressiveness] = useState(agent.config.aggressiveness);
  const [riskTolerance, setRiskTolerance] = useState(agent.config.riskTolerance);
  const [learningEnabled, setLearningEnabled] = useState(agent.config.learningEnabled);
  const [active, setActive] = useState(agent.active);
  const [overrides, setOverrides] = useState<string[]>(agent.config.permissionOverrides);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Re-sync when agent changes (e.g. user navigates between agents while panel open)
  useEffect(() => {
    setAggressiveness(agent.config.aggressiveness);
    setRiskTolerance(agent.config.riskTolerance);
    setLearningEnabled(agent.config.learningEnabled);
    setActive(agent.active);
    setOverrides(agent.config.permissionOverrides);
    setDirty(false);
  }, [
    agent.id,
    agent.config.aggressiveness,
    agent.config.riskTolerance,
    agent.config.learningEnabled,
    agent.active,
    agent.config.permissionOverrides,
  ]);

  const mark = () => setDirty(true);
  const m = agent.metrics;
  const wonLoss = m.negotiationsWon + m.negotiationsLost;

  const save = async () => {
    setSaving(true);
    try {
      await onConfigured(agent.id, {
        aggressiveness,
        riskTolerance,
        learningEnabled,
        enabled: active,
        permissionOverrides: overrides,
      });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Metrics summary */}
      <div className="rounded-xl border border-border/60 bg-card/60 p-2.5">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <BarChart3 className="h-3 w-3 text-emerald-400" />
          Lifetime metrics
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <Metric label="Tasks done" value={fmtNum(m.tasksCompleted)} color="text-emerald-400" />
          <Metric label="Tasks failed" value={fmtNum(m.tasksFailed)} color="text-rose-400" />
          <Metric label="Avg conf" value={`${m.avgConfidence}%`} color="text-cyan-400" />
          <Metric
            label="Negotiations W"
            value={fmtNum(m.negotiationsWon)}
            color="text-violet-400"
          />
          <Metric
            label="Negotiations L"
            value={fmtNum(m.negotiationsLost)}
            color="text-rose-400"
          />
          <Metric label="Avg duration" value={fmtDuration(m.avgTaskDurationMs)} color="text-amber-400" />
          <Metric label="Total savings" value={fmtCedis(m.totalSavingsGenerated)} color="text-emerald-400" />
          <Metric label="Learned" value={fmtNum(agent.learnedOptimizations.length)} color="text-cyan-400" />
          <Metric label="Facts" value={fmtNum(agent.facts)} color="text-foreground" />
        </div>
      </div>

      {/* Sliders */}
      <div className="rounded-xl border border-border/60 bg-card/60 p-2.5">
        <ConfigSlider
          label="Aggressiveness"
          subLabel="Conservative ↔ Aggressive"
          value={aggressiveness}
          onChange={(v) => {
            setAggressiveness(v);
            mark();
          }}
          lowLabel="Patient"
          highLabel="Aggressive"
          color="emerald"
        />
        <div className="my-3 border-t border-border/40" />
        <ConfigSlider
          label="Risk tolerance"
          subLabel="Cautious ↔ Bold"
          value={riskTolerance}
          onChange={(v) => {
            setRiskTolerance(v);
            mark();
          }}
          lowLabel="Cautious"
          highLabel="Bold"
          color="amber"
        />
      </div>

      {/* Toggles */}
      <div className="rounded-xl border border-border/60 bg-card/60 p-2.5">
        <ToggleRow
          icon={Brain}
          label="Learning enabled"
          sub="Record reusable patterns from completed tasks."
          on={learningEnabled}
          onChange={(v) => {
            setLearningEnabled(v);
            mark();
          }}
          accent="cyan"
        />
        <div className="my-2.5 border-t border-border/40" />
        <ToggleRow
          icon={Activity}
          label="Agent active"
          sub="Deactivated agents ignore events and skip queued tasks."
          on={active}
          onChange={(v) => {
            setActive(v);
            mark();
          }}
          accent="emerald"
        />
      </div>

      {/* Permission overrides */}
      <div className="rounded-xl border border-border/60 bg-card/60 p-2.5">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <Lock className="h-3 w-3 text-violet-400" />
          Permission overrides
        </div>
        <p className="mb-2 text-[10px] leading-snug text-muted-foreground">
          Default policy: <span className="font-mono text-foreground/80">canBook={String(agent.policy.canBook)}</span>,{" "}
          <span className="font-mono text-foreground/80">canNegotiate={String(agent.policy.canNegotiate)}</span>. Toggle a permission to grant it beyond the default.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PERMISSION_KINDS.map((p) => {
            const on = overrides.includes(p);
            return (
              <button
                key={p}
                onClick={() => {
                  setOverrides((prev) =>
                    on ? prev.filter((x) => x !== p) : [...prev, p]
                  );
                  mark();
                }}
                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold transition ${
                  on
                    ? "border-violet-500/40 bg-violet-500/20 text-violet-200"
                    : "border-border/50 bg-background/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {on ? <Unlock className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save */}
      <div className="sticky bottom-0 -mx-3.5 flex items-center justify-between gap-2 border-t border-border/60 bg-background/95 px-3.5 py-2.5 backdrop-blur">
        <div className="text-[10px] text-muted-foreground">
          {dirty ? (
            <span className="inline-flex items-center gap-1 text-amber-400">
              <CircleDot className="h-2.5 w-2.5" /> Unsaved changes
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <Check className="h-2.5 w-2.5" /> In sync with runtime
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <AgentDelegator agent={agent} agents={agents} busy={busy} />
          <button
            disabled={!dirty || saving}
            onClick={save}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-[11px] font-bold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            Save config
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfigSlider({
  label,
  subLabel,
  value,
  onChange,
  lowLabel,
  highLabel,
  color,
}: {
  label: string;
  subLabel: string;
  value: number;
  onChange: (v: number) => void;
  lowLabel: string;
  highLabel: string;
  color: "emerald" | "amber";
}) {
  const pct = Math.round(value * 100);
  const trackColor = color === "emerald" ? "#34d399" : "#fbbf24";
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold text-foreground">{label}</div>
          <div className="text-[10px] text-muted-foreground">{subLabel}</div>
        </div>
        <div
          className="rounded-md border px-2 py-0.5 text-[11px] font-black tabular-nums"
          style={{
            color: trackColor,
            borderColor: `${trackColor}55`,
            backgroundColor: `${trackColor}1f`,
          }}
        >
          {pct}%
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
          {lowLabel}
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1 accent-emerald-500"
          style={{ accentColor: trackColor }}
        />
        <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
          {highLabel}
        </span>
      </div>
    </div>
  );
}

function ToggleRow({
  icon: Ic,
  label,
  sub,
  on,
  onChange,
  accent,
}: {
  icon: typeof Brain;
  label: string;
  sub: string;
  on: boolean;
  onChange: (v: boolean) => void;
  accent: "cyan" | "emerald";
}) {
  const onCls = accent === "cyan" ? "bg-cyan-500" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          accent === "cyan" ? "bg-cyan-500/15 text-cyan-400" : "bg-emerald-500/15 text-emerald-400"
        }`}
      >
        <Ic className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-bold text-foreground">{label}</div>
        <div className="text-[10px] text-muted-foreground">{sub}</div>
      </div>
      <button
        onClick={() => onChange(!on)}
        aria-pressed={on}
        aria-label={label}
        className={`relative h-5 w-9 shrink-0 rounded-full transition ${on ? onCls : "bg-zinc-600"}`}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow ${on ? "left-4" : "left-0.5"}`}
        />
      </button>
    </div>
  );
}

function AgentDelegator({
  agent,
  agents,
  busy,
}: {
  agent: AgentWithMemory;
  agents: AgentWithMemory[];
  busy: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [toAgent, setToAgent] = useState("");
  const [type, setType] = useState("optimize_intent");
  const [desc, setDesc] = useState("");
  const [sending, setSending] = useState(false);
  const others = agents.filter((a) => a.id !== agent.id && a.active);

  const submit = async () => {
    if (!toAgent || !desc.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/kernel/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: agent.id,
          action: "delegate",
          toAgentId: toAgent,
          type,
          description: desc.trim(),
          input: { delegatedBy: agent.id },
        }),
      });
      if (res.ok) {
        toast.success("Task delegated", {
          description: `${agent.name} → ${agents.find((a) => a.id === toAgent)?.name ?? toAgent}`,
        });
        setOpen(false);
        setDesc("");
        setToAgent("");
      } else {
        toast.error("Delegation failed");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={busy || others.length === 0}
        className="inline-flex items-center gap-1 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1.5 text-[11px] font-bold text-violet-300 transition hover:bg-violet-500/20 disabled:opacity-40"
      >
        <Send className="h-3 w-3" /> Delegate
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm md:items-center"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-2xl border border-border/60 bg-background shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border/50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-violet-400" />
                  <div className="text-sm font-black text-foreground">Delegate task</div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2.5 p-3">
                <div className="text-[10px] text-muted-foreground">
                  <span className="font-bold text-foreground/80">{agent.name}</span> will hand this task to another agent. The cooperation is recorded in the feed.
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    To agent
                  </label>
                  <select
                    value={toAgent}
                    onChange={(e) => setToAgent(e.target.value)}
                    className="w-full rounded-lg border border-border/60 bg-background/60 px-2 py-1.5 text-[11px] text-foreground outline-none focus:border-violet-500/60"
                  >
                    <option value="">Select agent…</option>
                    {others.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.emoji} {a.name} ({TEAM_META[a.team].label})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-lg border border-border/60 bg-background/60 px-2 py-1.5 text-[11px] text-foreground outline-none focus:border-violet-500/60"
                  >
                    {["optimize_intent", "negotiate_bid", "find_pool", "predict_demand", "build_schedule"].map(
                      (t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Description
                  </label>
                  <input
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Describe the task"
                    className="w-full rounded-lg border border-border/60 bg-background/60 px-2 py-1.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-violet-500/60"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-border/50 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!toAgent || !desc.trim() || sending}
                    onClick={submit}
                    className="inline-flex items-center gap-1 rounded-lg bg-violet-500 px-2.5 py-1 text-[11px] font-bold text-violet-950 transition hover:bg-violet-400 disabled:opacity-40"
                  >
                    {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    Delegate
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ----- Section 4: Cooperation feed ----------------------------------------

function CooperationFeed({
  cooperations,
  agents,
  onStartNegotiation,
}: {
  cooperations: AgentCooperation[];
  agents: AgentWithMemory[];
  onStartNegotiation: (
    buyerId: string,
    sellerId: string,
    asset: string,
    openingPrice: number
  ) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 p-3">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15">
            <Network className="h-3.5 w-3.5 text-violet-400" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
              Cooperation feed
            </div>
            <div className="text-xs font-bold text-foreground">
              Agent-to-agent · live · {cooperations.length} recent
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-1 rounded-lg bg-violet-500/15 px-2 py-1 text-[10px] font-bold text-violet-300 transition hover:bg-violet-500/25"
        >
          {showForm ? <X className="h-3 w-3" /> : <Handshake className="h-3 w-3" />}
          {showForm ? "Close" : "Start negotiation"}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <StartNegotiationForm
              agents={agents}
              onCancel={() => setShowForm(false)}
              onSubmit={async (b, s, a, p) => {
                await onStartNegotiation(b, s, a, p);
                setShowForm(false);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {cooperations.length === 0 ? (
        <EmptyState
          icon={Network}
          accent="text-violet-400"
          title="No cooperations yet"
          sub="Negotiations, delegations, and information shares will stream here as agents work together."
        />
      ) : (
        <div className="max-h-96 space-y-1.5 overflow-y-auto pr-1 scroll-thin">
          {cooperations.map((c, i) => (
            <CooperationRow key={c.id} coop={c} agents={agents} idx={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function CooperationRow({
  coop,
  agents,
  idx,
}: {
  coop: AgentCooperation;
  agents: AgentWithMemory[];
  idx: number;
}) {
  const meta = COOP_META[coop.type];
  const out = OUTCOME_META[coop.outcome];
  const Ic = meta.icon;
  const involved = coop.agents
    .map((id) => agents.find((a) => a.id === id))
    .filter(Boolean) as AgentWithMemory[];

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(idx * 0.03, 0.4) }}
      className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-background/40 p-2"
    >
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${meta.bg}`}>
        <Ic className={`h-3.5 w-3.5 ${meta.color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1">
            <span className={`text-[9px] font-bold uppercase tracking-wide ${meta.color}`}>
              {meta.label}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${out.bg} border-transparent ${out.text}`}
            >
              <span className={`h-1 w-1 rounded-full ${out.dot}`} />
              {out.label}
            </span>
          </div>
          <span className="text-[9px] tabular-nums text-muted-foreground">{fmtAgo(coop.timestamp)}</span>
        </div>
        <p className="mt-0.5 text-[11px] leading-snug text-foreground/85">{coop.description}</p>
        {involved.length > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
              Agents:
            </span>
            {involved.map((a, i) => (
              <span key={a.id} className="inline-flex items-center gap-0.5">
                {i > 0 && <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/60" />}
                <span
                  className="inline-flex items-center gap-0.5 rounded bg-background/60 px-1 py-0.5 text-[9px] font-bold"
                  style={{ color: a.color }}
                >
                  <span>{a.emoji}</span>
                  <span className="text-foreground/80">{a.name}</span>
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function StartNegotiationForm({
  agents,
  onSubmit,
  onCancel,
}: {
  agents: AgentWithMemory[];
  onSubmit: (
    buyerId: string,
    sellerId: string,
    asset: string,
    openingPrice: number
  ) => Promise<void>;
  onCancel: () => void;
}) {
  const active = agents.filter((a) => a.active);
  const [buyer, setBuyer] = useState(active[0]?.id ?? "");
  const [seller, setSeller] = useState(active[1]?.id ?? active[0]?.id ?? "");
  const [asset, setAsset] = useState("Airport ride · 4 seats");
  const [price, setPrice] = useState("20");
  const [sending, setSending] = useState(false);

  const valid = buyer && seller && buyer !== seller && asset.trim() && Number(price) > 0;

  return (
    <div className="mb-2.5 rounded-xl border border-violet-500/30 bg-violet-500/[0.06] p-2.5">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-violet-400">
        Start agent-to-agent negotiation
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <AgentSelect
          label="Buyer agent"
          value={buyer}
          onChange={setBuyer}
          agents={active}
          excludeId={seller}
        />
        <AgentSelect
          label="Seller agent"
          value={seller}
          onChange={setSeller}
          agents={active}
          excludeId={buyer}
        />
      </div>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px]">
        <div>
          <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Asset
          </label>
          <input
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
            className="w-full rounded-lg border border-border/60 bg-background/60 px-2 py-1.5 text-[11px] text-foreground outline-none focus:border-violet-500/60"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Opening price (₵)
          </label>
          <input
            type="number"
            min={0}
            step="0.5"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-lg border border-border/60 bg-background/60 px-2 py-1.5 text-[11px] tabular-nums text-foreground outline-none focus:border-violet-500/60"
          />
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-lg border border-border/50 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
        <button
          disabled={!valid || sending}
          onClick={async () => {
            setSending(true);
            try {
              await onSubmit(buyer, seller, asset.trim(), Number(price));
            } finally {
              setSending(false);
            }
          }}
          className="inline-flex items-center gap-1 rounded-lg bg-violet-500 px-2.5 py-1 text-[11px] font-bold text-violet-950 transition hover:bg-violet-400 disabled:opacity-40"
        >
          {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Handshake className="h-3 w-3" />}
          Start
        </button>
      </div>
    </div>
  );
}

function AgentSelect({
  label,
  value,
  onChange,
  agents,
  excludeId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  agents: AgentWithMemory[];
  excludeId?: string;
}) {
  const opts = excludeId ? agents.filter((a) => a.id !== excludeId) : agents;
  return (
    <div>
      <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border/60 bg-background/60 px-2 py-1.5 text-[11px] text-foreground outline-none focus:border-violet-500/60"
      >
        {opts.length === 0 && <option value="">No active agents</option>}
        {opts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.emoji} {a.name} ({TEAM_META[a.team].label})
          </option>
        ))}
      </select>
    </div>
  );
}

// ----- Shared bits ----------------------------------------------------------

function EmptyState({
  icon: Ic,
  accent,
  title,
  sub,
}: {
  icon: typeof Brain;
  accent: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-background/30 px-4 py-6 text-center">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`flex h-10 w-10 items-center justify-center rounded-xl bg-background/60 ${accent}`}
      >
        <Ic className="h-5 w-5" />
      </motion.div>
      <div className="mt-2 text-sm font-bold text-foreground">{title}</div>
      <p className="mt-1 max-w-xs text-[11px] leading-snug text-muted-foreground">{sub}</p>
    </div>
  );
}

function TeamFilterTabs({
  value,
  onChange,
  counts,
}: {
  value: AgentTeam | "all";
  onChange: (v: AgentTeam | "all") => void;
  counts: Record<AgentTeam | "all", number>;
}) {
  const tabs: Array<{ id: AgentTeam | "all"; label: string; emoji: string }> = [
    { id: "all", label: "All", emoji: "✦" },
    { id: "rider", label: "Rider", emoji: "🧍" },
    { id: "driver", label: "Driver", emoji: "🚗" },
    { id: "fleet", label: "Fleet", emoji: "🚐" },
    { id: "merchant", label: "Merchant", emoji: "📦" },
  ];
  return (
    <div className="flex items-stretch gap-1 overflow-x-auto rounded-xl border border-border/50 bg-background/40 p-1 scroll-thin">
      {tabs.map((t) => {
        const active = value === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`relative flex flex-1 min-w-[78px] items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold transition ${
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {active && (
              <motion.div
                layoutId="team-filter-active"
                className="absolute inset-0 rounded-lg bg-foreground/[0.08] ring-1 ring-foreground/15"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative">{t.emoji}</span>
            <span className="relative">{t.label}</span>
            <span
              className={`relative rounded-full px-1.5 py-0.5 text-[9px] font-black tabular-nums ${
                active ? "bg-emerald-500/20 text-emerald-300" : "bg-foreground/[0.06] text-muted-foreground"
              }`}
            >
              {counts[t.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ----- Compact mode (half-snap) -------------------------------------------

function CompactMode({
  stats,
  agents,
  cooperations,
  onSelect,
  onStartNegotiation,
}: {
  stats: AIStats | null;
  agents: AgentWithMemory[];
  cooperations: AgentCooperation[];
  onSelect: (id: string) => void;
  onStartNegotiation: (
    buyerId: string,
    sellerId: string,
    asset: string,
    openingPrice: number
  ) => Promise<void>;
}) {
  const top = useMemo(() => {
    return [...agents]
      .filter((a) => a.active)
      .sort((a, b) => b.metrics.totalSavingsGenerated - a.metrics.totalSavingsGenerated)
      .slice(0, 4);
  }, [agents]);

  return (
    <div className="px-4 pb-6 pt-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
          <Bot className="h-3 w-3" /> AI Workforce
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold tabular-nums text-emerald-300">
          <TrendingDown className="h-2.5 w-2.5" />
          {fmtCedis(stats?.totalSavings ?? 0)} saved
        </div>
      </div>
      <p className="mb-2.5 text-[11px] leading-snug text-muted-foreground">
        {stats?.activeAgents ?? 0} of {stats?.totalAgents ?? 0} agents active ·{" "}
        {stats?.queuedTasks ?? 0} queued · {stats?.activeNegotiations ?? 0} negotiating ·{" "}
        {stats?.totalLearned ?? 0} learned
      </p>

      <div className="mb-2 grid grid-cols-2 gap-1.5">
        {top.map((a, i) => {
          const st = STATUS_META[a.status];
          return (
            <motion.button
              key={a.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelect(a.id)}
              className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/60 p-2 text-left transition hover:border-border"
            >
              <div className="relative shrink-0">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-base"
                  style={{ backgroundColor: `${a.color}22` }}
                >
                  {a.emoji}
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background ${st.dot}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] font-bold text-foreground">{a.name}</div>
                <div className="text-[9px] tabular-nums text-emerald-400">
                  {fmtCedis(a.metrics.totalSavingsGenerated)} · {a.metrics.tasksCompleted} tasks
                </div>
              </div>
              <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
            </motion.button>
          );
        })}
      </div>

      <div className="rounded-xl border border-border/50 bg-card/60 p-2">
        <div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-violet-400">
          <Network className="h-2.5 w-2.5" /> Live cooperation
        </div>
        {cooperations.length === 0 ? (
          <div className="py-2 text-center text-[10px] text-muted-foreground">No cooperations yet.</div>
        ) : (
          <div className="max-h-32 space-y-1 overflow-y-auto scroll-thin">
            {cooperations.slice(0, 4).map((c) => {
              const meta = COOP_META[c.type];
              const Ic = meta.icon;
              return (
                <div key={c.id} className="flex items-center gap-1.5 text-[10px]">
                  <Ic className={`h-2.5 w-2.5 shrink-0 ${meta.color}`} />
                  <span className="truncate text-foreground/80">{c.description}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface Props {
  /** Render in compact/preview mode (used by half-snap). */
  compact?: boolean;
}

export function MobilityTeam({ compact = false }: Props) {
  const [agents, setAgents] = useState<AgentWithMemory[]>([]);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [cooperations, setCooperations] = useState<AgentCooperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AgentTeam | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // ---- fetchers ----------------------------------------------------------
  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch(`/api/kernel/agents`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as AgentWithMemory[];
      setAgents(data);
    } catch {
      /* swallow */
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/kernel/ai-stats`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as AIStats;
      setStats(data);
    } catch {
      /* swallow */
    }
  }, []);

  const fetchCooperations = useCallback(async () => {
    try {
      const res = await fetch(`/api/kernel/cooperations`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as AgentCooperation[];
      setCooperations(data);
    } catch {
      /* swallow */
    }
  }, []);

  // ---- initial load + 3s poll --------------------------------------------
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await Promise.all([fetchAgents(), fetchStats(), fetchCooperations()]);
      if (cancelled) return;
    };
    run();
    const id = setInterval(run, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [fetchAgents, fetchStats, fetchCooperations]);

  // ---- derived -----------------------------------------------------------
  const teams: AgentTeam[] = ["rider", "driver", "fleet", "merchant"];
  const byTeam: Record<AgentTeam, AgentWithMemory[]> = useMemo(() => {
    const out: Record<AgentTeam, AgentWithMemory[]> = {
      rider: [],
      driver: [],
      fleet: [],
      merchant: [],
    };
    for (const a of agents) out[a.team]?.push(a);
    return out;
  }, [agents]);

  const counts: Record<AgentTeam | "all", number> = {
    all: agents.length,
    rider: byTeam.rider.length,
    driver: byTeam.driver.length,
    fleet: byTeam.fleet.length,
    merchant: byTeam.merchant.length,
  };

  const filtered = useMemo(() => {
    const list = filter === "all" ? agents : byTeam[filter];
    // active first, then by savings desc
    return [...list].sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      return b.metrics.totalSavingsGenerated - a.metrics.totalSavingsGenerated;
    });
  }, [agents, byTeam, filter]);

  const selected = useMemo(() => {
    return selectedId ? agents.find((a) => a.id === selectedId) ?? null : null;
  }, [agents, selectedId]);

  // ---- actions -----------------------------------------------------------
  const toggleActive = useCallback(async (agentId: string, next: boolean) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/kernel/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          action: next ? "activate" : "deactivate",
        }),
      });
      if (res.ok) {
        toast.success(next ? "Agent activated" : "Agent deactivated");
        await fetchAgents();
        await fetchStats();
      } else {
        toast.error("Could not update agent");
      }
    } finally {
      setBusy(false);
    }
  }, [fetchAgents, fetchStats]);

  const configure = useCallback(
    async (agentId: string, updates: Record<string, unknown>) => {
      setBusy(true);
      try {
        const res = await fetch(`/api/kernel/agents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId, action: "configure", updates }),
        });
        if (res.ok) {
          toast.success("Configuration saved");
          await fetchAgents();
        } else {
          toast.error("Could not save config");
        }
      } finally {
        setBusy(false);
      }
    },
    [fetchAgents]
  );

  const enqueueTask = useCallback(
    async (agentId: string, type: string, description: string, intentId: string) => {
      setBusy(true);
      try {
        const res = await fetch(`/api/kernel/agents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentId,
            action: "enqueueTask",
            type,
            description,
            input: { triggeredBy: "manual" },
            intentId: intentId || undefined,
          }),
        });
        if (res.ok) {
          toast.success("Task enqueued", { description: `${type} → ${description.slice(0, 60)}` });
          await fetchAgents();
          await fetchStats();
        } else {
          toast.error("Could not enqueue task");
        }
      } finally {
        setBusy(false);
      }
    },
    [fetchAgents, fetchStats]
  );

  const startNegotiation = useCallback(
    async (
      buyerId: string,
      sellerId: string,
      asset: string,
      openingPrice: number
    ) => {
      setBusy(true);
      try {
        const res = await fetch(`/api/kernel/agents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentId: buyerId,
            action: "startNegotiation",
            sellerAgentId: sellerId,
            asset,
            openingPrice,
          }),
        });
        if (res.ok) {
          toast.success("Negotiation started", {
            description: `${asset} · opening GH₵${openingPrice}`,
          });
          await Promise.all([fetchAgents(), fetchStats(), fetchCooperations()]);
        } else {
          toast.error("Could not start negotiation");
        }
      } finally {
        setBusy(false);
      }
    },
    [fetchAgents, fetchStats, fetchCooperations]
  );

  // ---- compact mode -----------------------------------------------------
  if (compact) {
    return (
      <>
        <CompactMode
          stats={stats}
          agents={agents}
          cooperations={cooperations}
          onSelect={setSelectedId}
          onStartNegotiation={startNegotiation}
        />
        <AnimatePresence>
          {selected && (
            <DetailPanel
              agent={selected}
              agents={agents}
              onClose={() => setSelectedId(null)}
              onConfigured={configure}
              onTaskEnqueued={enqueueTask}
              busy={busy}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  // ---- full mode --------------------------------------------------------
  return (
    <div className="px-4 pb-8 pt-3">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-400">
            <Bot className="h-3 w-3" /> Autonomous AI Workforce
          </div>
          <h2 className="mt-2 text-lg font-black tracking-tight text-foreground text-balance sm:text-xl">
            Watch your AI team think, negotiate, and learn — live.
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            25 agents across 4 teams share a long-term memory, run real reasoning
            traces, negotiate with each other, and accumulate optimizations.
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="hidden shrink-0 items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 sm:flex"
        >
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="h-2 w-2 rounded-full bg-emerald-400"
          />
          <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-400">
            Live · 3s poll
          </div>
        </motion.div>
      </div>

      {/* Section 1: Team overview banner */}
      <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {teams.map((t) => (
          <TeamColumn key={t} team={t} agents={byTeam[t]} />
        ))}
      </div>
      <div className="mb-3">
        <RuntimeStrip stats={stats} />
      </div>

      {/* Section 2: Team filter + agent grid */}
      <div className="mb-3">
        <TeamFilterTabs value={filter} onChange={setFilter} counts={counts} />
      </div>

      {loading && agents.length === 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-2xl border border-border/40 bg-card/40"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          accent="text-muted-foreground"
          title="No agents in this team"
          sub="Switch to another team filter to see agents."
        />
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence>
            {filtered.map((a) => (
              <AgentCard
                key={a.id}
                agent={a}
                onClick={() => setSelectedId(a.id)}
                onToggle={(next) => toggleActive(a.id, next)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Section 4: Cooperation feed */}
      <div className="mt-4">
        <CooperationFeed
          cooperations={cooperations}
          agents={agents}
          onStartNegotiation={startNegotiation}
        />
      </div>

      {/* Section 3: Agent Detail Panel (slide-over) */}
      <AnimatePresence>
        {selected && (
          <DetailPanel
            agent={selected}
            agents={agents}
            onClose={() => setSelectedId(null)}
            onConfigured={configure}
            onTaskEnqueued={enqueueTask}
            busy={busy}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default MobilityTeam;
