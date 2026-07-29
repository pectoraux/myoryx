"use client";

// ============================================================================
// Oryx — Intelligence Dashboard (M21+) — the capstone view
// A Bloomberg-terminal-grade dashboard showing the complete state of the
// Oryx Mobility OS: Network IQ, connector health, optimization KPIs,
// AI agent performance, continuous learning, marketplace liquidity,
// global optimization, demand forecast, A/B experiments, compliance,
// security, disaster recovery, and personalized recommendations.
//
// Data source:
//   GET /api/kernel/intelligence            — full IntelligenceDashboard
//   GET /api/kernel/intelligence/compliance?detail=security — security checks
//
// Polls every 5s for live updates.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine,
  Cell,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Cloud,
  Database,
  Droplets,
  Gauge,
  Globe2,
  Leaf,
  Lightbulb,
  Network,
  Plug,
  Radio,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types — mirrored from src/lib/kernel/intelligence.ts
// ---------------------------------------------------------------------------

interface ConnectorHealth {
  total: number;
  live: number;
  degraded: number;
  error: number;
}

interface AIAgentPerformance {
  total: number;
  active: number;
  avgConfidence: number;
  tasksCompleted: number;
  negotiationsWon: number;
}

interface LearningRecord {
  id: string;
  type: string;
  pattern: string;
  insight: string;
  confidence: number;
  appliedCount: number;
  learnedAt: number;
  optimizationType: string;
  optimizationParams: Record<string, unknown>;
}

interface LearningProgression {
  totalRecords: number;
  byType: Record<string, number>;
  avgConfidence: number;
  topInsights: LearningRecord[];
  learningRate: number;
  modelVersion: string;
  accuracyTrend: Array<{ date: string; accuracy: number }>;
}

interface MarketplaceIntel {
  liquidityScore: number;
  avgPrice: number;
  avgSurge: number;
  providerCount: number;
  driverCount: number;
  npdCount: number;
  fleetCount: number;
  merchantCount: number;
  activeAuctions: number;
  poolMatchRate: number;
  avgAuctionSaving: number;
  avgNegotiationSaving: number;
  totalLiquidity: number;
}

interface OptimizationResult {
  scope: string;
  target: string;
  metrics: {
    utilizationImprovement: number;
    costReduction: number;
    emptyMileReduction: number;
    poolingEffectiveness: number;
    carbonSavings: number;
    timeSavings: number;
  };
  recommendations: string[];
  appliedAt: number;
}

interface DemandForecast {
  zone: string;
  hour: number;
  predictedDemand: number;
  predictedSurge: number;
  confidence: number;
  factors: string[];
}

interface Recommendation {
  id: string;
  userId: string;
  type: string;
  title: string;
  detail: string;
  potentialSaving: number;
  confidence: number;
  actionable: boolean;
  createdAt: number;
}

interface ExperimentVariant {
  name: string;
  weight: number;
  participants: number;
  conversions: number;
  conversionRate: number;
  metric: string;
  metricValue: number;
}

interface Experiment {
  id: string;
  name: string;
  description: string;
  variants: ExperimentVariant[];
  status: "running" | "completed" | "paused";
  startedAt: number;
  endedAt?: number;
  winner?: string;
  confidence: number;
}

interface SecurityCheck {
  id: string;
  category: string;
  name: string;
  status: "passed" | "warning" | "failed";
  detail: string;
}

interface DisasterRecovery {
  rto: number;
  rpo: number;
  backupFrequency: string;
  backupRetention: string;
  multiRegion: boolean;
  regions: string[];
  failoverStrategy: string;
  lastBackupAt: number;
  lastFailoverTest: number;
}

interface IntelligenceDashboard {
  networkIQ: number;
  connectorHealth: ConnectorHealth;
  optimizationSuccessRate: number;
  moneySavedByUsers: number;
  driverEarningsImprovement: number;
  fleetUtilizationImprovement: number;
  emptyMileReduction: number;
  poolingEffectiveness: number;
  carbonSavings: number;
  aiAgentPerformance: AIAgentPerformance;
  learningProgression: LearningProgression;
  marketplaceLiquidity: MarketplaceIntel;
  globalOptimization: OptimizationResult;
  demandForecast: DemandForecast[];
  recommendations: Recommendation[];
  experiments: Experiment[];
  compliance: { countries: number; rulesEnforced: number; dataRetentionPolicy: Record<string, number> };
  security: { checksPassed: number; checksWarning: number; checksFailed: number };
  disasterRecovery: DisasterRecovery;
  graphStats: { totalNodes: number; totalEdges: number; byType: Record<string, number> };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

function fmtNum(n: number): string {
  return n.toLocaleString();
}

function fmtPct(n: number, digits = 0): string {
  return `${n.toFixed(digits)}%`;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function shortDate(s: string): string {
  // 2024-01-05 -> Jan 05
  const d = new Date(s);
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
}

function iqColor(v: number): { stroke: string; text: string; ring: string; bg: string; label: string } {
  if (v >= 80)
    return {
      stroke: "#10b981",
      text: "text-emerald-400",
      ring: "ring-emerald-500/30",
      bg: "bg-emerald-500/10",
      label: "Excellent",
    };
  if (v >= 60)
    return {
      stroke: "#f59e0b",
      text: "text-amber-400",
      ring: "ring-amber-500/30",
      bg: "bg-amber-500/10",
      label: "Healthy",
    };
  return {
    stroke: "#f43f5e",
    text: "text-rose-400",
    ring: "ring-rose-500/30",
    bg: "bg-rose-500/10",
    label: "At Risk",
  };
}

function insightTypeColor(t: string): string {
  switch (t) {
    case "ride":
      return "text-sky-400 bg-sky-500/10 border-sky-500/30";
    case "auction":
      return "text-orange-400 bg-orange-500/10 border-orange-500/30";
    case "pool":
      return "text-violet-400 bg-violet-500/10 border-violet-500/30";
    case "parcel":
      return "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30";
    case "negotiation":
      return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    case "optimization":
      return "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
    case "calendar":
      return "text-emerald-300 bg-emerald-500/10 border-emerald-500/30";
    case "commute":
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    default:
      return "text-muted-foreground bg-foreground/5 border-border";
  }
}

function recTypeMeta(t: string): { icon: LucideIcon; color: string; bg: string; label: string } {
  switch (t) {
    case "shift_departure":
      return { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/15", label: "Shift" };
    case "join_pool":
      return { icon: Users, color: "text-violet-400", bg: "bg-violet-500/15", label: "Pool" };
    case "subscribe_driver":
      return { icon: Users, color: "text-cyan-400", bg: "bg-cyan-500/15", label: "Subscribe" };
    case "use_npd":
      return { icon: Network, color: "text-emerald-400", bg: "bg-emerald-500/15", label: "NPD" };
    case "multimodal":
      return { icon: Radio, color: "text-fuchsia-400", bg: "bg-fuchsia-500/15", label: "Mixed" };
    case "book_ahead":
      return { icon: Clock, color: "text-sky-400", bg: "bg-sky-500/15", label: "Pre-book" };
    case "batch_parcels":
      return { icon: Database, color: "text-orange-400", bg: "bg-orange-500/15", label: "Batch" };
    case "return_ride":
      return { icon: ArrowDownRight, color: "text-emerald-400", bg: "bg-emerald-500/15", label: "Return" };
    default:
      return { icon: Sparkles, color: "text-muted-foreground", bg: "bg-foreground/10", label: t };
  }
}

function securityStatusMeta(s: string): { color: string; bg: string; icon: LucideIcon } {
  if (s === "passed") return { color: "text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle2 };
  if (s === "warning") return { color: "text-amber-400", bg: "bg-amber-500/10", icon: AlertTriangle };
  return { color: "text-rose-400", bg: "bg-rose-500/10", icon: AlertTriangle };
}

function retentionLabel(key: string): string {
  const map: Record<string, string> = {
    rideData: "Ride data",
    parcelData: "Parcel data",
    paymentData: "Payment data",
    analyticsData: "Analytics",
    auditLogs: "Audit logs",
  };
  return map[key] ?? key;
}

function retentionDaysToLabel(days: number): string {
  if (days >= 365) return `${(days / 365).toFixed(days % 365 === 0 ? 0 : 1)}y`;
  return `${days}d`;
}

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

function Panel({
  icon: Icon,
  title,
  accent,
  right,
  children,
  className = "",
}: {
  icon: LucideIcon;
  title: string;
  accent: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`rounded-2xl border border-border/60 bg-card/95 shadow-lg shadow-black/20 backdrop-blur-sm ${className}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/50 px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${accent}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <h3 className="truncate text-xs font-bold uppercase tracking-wider text-foreground">{title}</h3>
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </motion.section>
  );
}

function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${className}`}
    >
      {children}
    </span>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-foreground/[0.02] px-3 py-2">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accent}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="truncate text-sm font-black tabular-nums text-foreground">{value}</div>
        {sub ? <div className="truncate text-[10px] text-muted-foreground">{sub}</div> : null}
      </div>
    </div>
  );
}

function ProgressBar({
  value,
  max = 100,
  color,
  height = 6,
}: {
  value: number;
  max?: number;
  color: string;
  height?: number;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="w-full overflow-hidden rounded-full bg-foreground/10" style={{ height }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Circular Gauge — SVG with animated stroke
// ---------------------------------------------------------------------------

function CircularGauge({
  value,
  max = 100,
  size = 168,
  stroke = 12,
  color,
  trackOpacity = 0.08,
  label,
  sublabel,
  unit = "",
}: {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  color: string;
  trackOpacity?: number;
  label?: string;
  sublabel?: string;
  unit?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, value / max));
  const offset = circumference * (1 - pct);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-foreground"
          style={{ opacity: trackOpacity }}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-4xl font-black leading-none tabular-nums text-foreground">
          {value}
          <span className="ml-0.5 text-base font-bold text-muted-foreground">{unit}</span>
        </div>
        {label ? <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div> : null}
        {sublabel ? <div className="mt-0.5 text-[10px] text-muted-foreground">{sublabel}</div> : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chart tooltip
// ---------------------------------------------------------------------------

function ChartTooltip({ active, payload, label: lbl, fmt }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <div className="mb-1 font-bold text-foreground">{lbl}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.stroke }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-bold tabular-nums text-foreground">{fmt ? fmt(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. Hero — Global Network IQ
// ---------------------------------------------------------------------------

function HeroNetworkIQ({ data }: { data: IntelligenceDashboard }) {
  const iq = data.networkIQ;
  const meta = iqColor(iq);
  const surrounding = [
    { icon: Network, label: "Graph nodes", value: fmtNum(data.graphStats.totalNodes), sub: `${data.graphStats.totalEdges} edges`, accent: "bg-violet-500/15 text-violet-400" },
    { icon: Plug, label: "Connectors live", value: `${data.connectorHealth.live}/${data.connectorHealth.total}`, sub: `${data.connectorHealth.degraded} degraded`, accent: "bg-cyan-500/15 text-cyan-400" },
    { icon: Brain, label: "Agents active", value: `${data.aiAgentPerformance.active}/${data.aiAgentPerformance.total}`, sub: `${data.aiAgentPerformance.tasksCompleted} tasks`, accent: "bg-amber-500/15 text-amber-400" },
    { icon: Lightbulb, label: "Learning records", value: fmtNum(data.learningProgression.totalRecords), sub: `${data.learningProgression.learningRate}/day`, accent: "bg-emerald-500/15 text-emerald-400" },
    { icon: Droplets, label: "Liquidity score", value: data.marketplaceLiquidity.liquidityScore, sub: `${data.marketplaceLiquidity.totalLiquidity} units`, accent: "bg-sky-500/15 text-sky-400" },
    { icon: Target, label: "Optimization", value: fmtPct(data.optimizationSuccessRate), sub: `${data.aiAgentPerformance.negotiationsWon} negs won`, accent: "bg-emerald-500/15 text-emerald-400" },
  ];
  return (
    <Panel
      icon={Gauge}
      title="Global Network IQ"
      accent={`bg-cyan-500/15 ${meta.text}`}
      right={<Badge className={`${meta.bg} ${meta.text} border-transparent`}>{meta.label}</Badge>}
    >
      <div className="flex flex-col items-center gap-5 lg:flex-row lg:items-center lg:gap-6">
        <div className="flex shrink-0 items-center justify-center">
          <CircularGauge
            value={iq}
            max={100}
            color={meta.stroke}
            label="Network IQ"
            sublabel="0 — 100"
          />
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
          {surrounding.map((s, i) => {
            const SIcon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * i }}
                className="flex items-center gap-2 rounded-xl border border-border/40 bg-foreground/[0.02] px-3 py-2"
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${s.accent}`}>
                  <SIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</div>
                  <div className="truncate text-base font-black tabular-nums text-foreground">{s.value}</div>
                  <div className="truncate text-[10px] text-muted-foreground">{s.sub}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// 2. KPI Grid — 8 cards
// ---------------------------------------------------------------------------

interface KpiCardDef {
  icon: LucideIcon;
  value: string;
  label: string;
  trend: "up" | "down" | "flat";
  trendGood?: boolean;
  trendText: string;
  accent: string;
  iconBg: string;
}

function KpiGrid({ data }: { data: IntelligenceDashboard }) {
  const cards: KpiCardDef[] = [
    {
      icon: Wallet,
      value: fmtMoney(data.moneySavedByUsers),
      label: "Money Saved by Users",
      trend: "up",
      trendGood: true,
      trendText: "+12% MoM",
      accent: "text-emerald-400",
      iconBg: "bg-emerald-500/15",
    },
    {
      icon: TrendingUp,
      value: `+${data.driverEarningsImprovement}%`,
      label: "Driver Earnings Improvement",
      trend: "up",
      trendGood: true,
      trendText: "+4 pts QoQ",
      accent: "text-amber-400",
      iconBg: "bg-amber-500/15",
    },
    {
      icon: Activity,
      value: `+${data.fleetUtilizationImprovement}%`,
      label: "Fleet Utilization Improvement",
      trend: "up",
      trendGood: true,
      trendText: "+2 pts",
      accent: "text-cyan-400",
      iconBg: "bg-cyan-500/15",
    },
    {
      icon: TrendingDown,
      value: fmtPct(data.emptyMileReduction),
      label: "Empty-Mile Reduction",
      trend: "down",
      trendGood: true,
      trendText: "−6 pts QoQ",
      accent: "text-emerald-400",
      iconBg: "bg-emerald-500/15",
    },
    {
      icon: Users,
      value: fmtPct(data.poolingEffectiveness),
      label: "Pooling Effectiveness",
      trend: "up",
      trendGood: true,
      trendText: "+5 pts",
      accent: "text-violet-400",
      iconBg: "bg-violet-500/15",
    },
    {
      icon: Leaf,
      value: `${fmtNum(data.carbonSavings)} kg`,
      label: "Carbon Savings",
      trend: "up",
      trendGood: true,
      trendText: "−18% CO₂",
      accent: "text-emerald-400",
      iconBg: "bg-emerald-500/15",
    },
    {
      icon: CheckCircle2,
      value: fmtPct(data.optimizationSuccessRate),
      label: "Optimization Success Rate",
      trend: "up",
      trendGood: true,
      trendText: "+1 pt",
      accent: "text-emerald-400",
      iconBg: "bg-emerald-500/15",
    },
    {
      icon: Brain,
      value: fmtPct(data.aiAgentPerformance.avgConfidence),
      label: "AI Agent Confidence",
      trend: "up",
      trendGood: true,
      trendText: "+3 pts",
      accent: "text-cyan-400",
      iconBg: "bg-cyan-500/15",
    },
  ];
  return (
    <Panel
      icon={Activity}
      title="Key Performance Indicators"
      accent="bg-emerald-500/15 text-emerald-400"
      right={<Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">Live</Badge>}
    >
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {cards.map((c, i) => {
          const CIcon = c.icon;
          const TrendIcon = c.trend === "down" ? ArrowDownRight : c.trend === "up" ? ArrowUpRight : Activity;
          const trendColor = c.trendGood ? "text-emerald-400" : "text-rose-400";
          return (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex flex-col gap-2 rounded-xl border border-border/40 bg-foreground/[0.02] p-3"
            >
              <div className="flex items-start justify-between">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.iconBg}`}>
                  <CIcon className={`h-4 w-4 ${c.accent}`} />
                </div>
                <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${trendColor}`}>
                  <TrendIcon className="h-3 w-3" />
                  {c.trendText}
                </span>
              </div>
              <div>
                <div className={`text-xl font-black tabular-nums sm:text-2xl ${c.accent}`}>{c.value}</div>
                <div className="mt-0.5 text-[10px] font-semibold leading-tight text-muted-foreground">{c.label}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// 3. Connector Health
// ---------------------------------------------------------------------------

function ConnectorHealthPanel({
  health,
  graphStats,
}: {
  health: ConnectorHealth;
  graphStats: IntelligenceDashboard["graphStats"];
}) {
  const segs = [
    { key: "live", label: "Live", count: health.live, color: "#10b981", bg: "bg-emerald-500/15", text: "text-emerald-400" },
    { key: "degraded", label: "Degraded", count: health.degraded, color: "#f59e0b", bg: "bg-amber-500/15", text: "text-amber-400" },
    { key: "error", label: "Error", count: health.error, color: "#f43f5e", bg: "bg-rose-500/15", text: "text-rose-400" },
  ];
  const total = Math.max(1, health.total);
  const barData = segs.map((s) => ({ name: s.label, count: s.count, color: s.color }));
  const byType = Object.entries(graphStats.byType).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <Panel
      icon={Plug}
      title="Connector Health"
      accent="bg-cyan-500/15 text-cyan-400"
      right={<Badge className="border-cyan-500/30 bg-cyan-500/10 text-cyan-400">{health.total} total</Badge>}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        {/* Status row + stacked bar */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {segs.map((s) => (
              <div key={s.key} className={`rounded-xl border border-border/40 ${s.bg} px-3 py-2 text-center`}>
                <div className={`text-2xl font-black tabular-nums ${s.text}`}>{s.count}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
          {/* Stacked bar */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Distribution</span>
              <span>{Math.round((health.live / total) * 100)}% live</span>
            </div>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-foreground/10">
              {segs.map((s) => (
                <motion.div
                  key={s.key}
                  className="h-full"
                  style={{ background: s.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(s.count / total) * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              ))}
            </div>
          </div>
          {/* Bar chart */}
          <div className="h-[100px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <RechartsTooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {barData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Graph breakdown */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Graph by type</span>
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {graphStats.totalNodes} nodes · {graphStats.totalEdges} edges
            </span>
          </div>
          <div className="space-y-1.5">
            {byType.map(([type, count]) => (
              <div key={type} className="flex items-center gap-2">
                <div className="w-20 truncate text-[11px] font-semibold capitalize text-muted-foreground">{type}</div>
                <div className="flex-1">
                  <ProgressBar value={count} max={graphStats.totalNodes} color="#06b6d4" height={5} />
                </div>
                <div className="w-8 text-right text-[11px] font-bold tabular-nums text-foreground">{count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// 4. AI Agent Performance
// ---------------------------------------------------------------------------

function AIAgentPerformancePanel({ data }: { data: AIAgentPerformance }) {
  const cols = [
    { icon: Brain, label: "Active / Total", value: `${data.active}/${data.total}`, sub: `${Math.round((data.active / Math.max(1, data.total)) * 100)}% active`, accent: "text-amber-400", bg: "bg-amber-500/15" },
    { icon: CheckCircle2, label: "Tasks Completed", value: fmtNum(data.tasksCompleted), sub: "across all agents", accent: "text-emerald-400", bg: "bg-emerald-500/15" },
    { icon: HandshakeIcon, label: "Negotiations Won", value: fmtNum(data.negotiationsWon), sub: "this cycle", accent: "text-violet-400", bg: "bg-violet-500/15" },
  ];
  // sparkline of synthetic confidence over last 12 ticks
  const spark = Array.from({ length: 12 }, (_, i) => ({
    t: i,
    v: Math.max(60, Math.min(95, data.avgConfidence - 6 + i * 0.5 + Math.sin(i) * 2)),
  }));
  return (
    <Panel
      icon={Brain}
      title="AI Agent Performance"
      accent="bg-amber-500/15 text-amber-400"
      right={<Badge className="border-amber-500/30 bg-amber-500/10 text-amber-400">{fmtPct(data.avgConfidence)} avg</Badge>}
    >
      <div className="grid gap-3 lg:grid-cols-[1fr_1.4fr]">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
          {cols.map((c) => {
            const CIcon = c.icon;
            return (
              <div key={c.label} className="flex items-center gap-2.5 rounded-xl border border-border/40 bg-foreground/[0.02] px-3 py-2.5">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${c.bg}`}>
                  <CIcon className={`h-4 w-4 ${c.accent}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</div>
                  <div className="text-lg font-black tabular-nums text-foreground">{c.value}</div>
                  <div className="truncate text-[10px] text-muted-foreground">{c.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="rounded-xl border border-border/40 bg-foreground/[0.02] p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Avg confidence trend</span>
            <span className="text-[10px] text-emerald-400 font-bold tabular-nums">▲ trending up</span>
          </div>
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spark} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                <defs>
                  <linearGradient id="aiSparkFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="t" hide />
                <YAxis domain={[55, 100]} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<ChartTooltip />} cursor={{ stroke: "#f59e0b", strokeWidth: 1 }} />
                <ReferenceLine y={data.avgConfidence} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.5} />
                <Area type="monotone" dataKey="v" name="Confidence" stroke="#f59e0b" strokeWidth={2} fill="url(#aiSparkFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function HandshakeIcon(props: React.SVGProps<SVGSVGElement>) {
  // lucide has no Handshake exported by that name in older versions; use Users as fallback
  return <Users {...props} />;
}

// ---------------------------------------------------------------------------
// 5. Learning Progression (flagship)
// ---------------------------------------------------------------------------

function LearningProgressionPanel({ data }: { data: LearningProgression }) {
  const accuracyNow = data.accuracyTrend.length > 0 ? data.accuracyTrend[data.accuracyTrend.length - 1].accuracy : 0;
  const accuracyPrev = data.accuracyTrend.length > 1 ? data.accuracyTrend[0].accuracy : accuracyNow;
  const delta = accuracyNow - accuracyPrev;
  const accuracyColor = accuracyNow >= 85 ? "#10b981" : accuracyNow >= 70 ? "#06b6d4" : "#f59e0b";
  const byTypeEntries = Object.entries(data.byType).sort((a, b) => b[1] - a[1]);

  return (
    <Panel
      icon={Lightbulb}
      title="Learning Progression"
      accent="bg-violet-500/15 text-violet-400"
      right={
        <div className="flex items-center gap-1.5">
          <Badge className="border-violet-500/30 bg-violet-500/10 text-violet-400">{data.modelVersion}</Badge>
          <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            <ArrowUpRight className="h-2.5 w-2.5" /> +{delta.toFixed(1)} pts
          </Badge>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
        {/* Accuracy gauge + meta */}
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border/40 bg-foreground/[0.02] p-4">
          <CircularGauge
            value={accuracyNow}
            max={100}
            size={148}
            stroke={11}
            color={accuracyColor}
            unit="%"
            label="Accuracy"
            sublabel={`model ${data.modelVersion}`}
          />
          <div className="grid w-full grid-cols-2 gap-2">
            <div className="rounded-lg bg-foreground/[0.03] p-2 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Records</div>
              <div className="text-sm font-black tabular-nums text-foreground">{fmtNum(data.totalRecords)}</div>
            </div>
            <div className="rounded-lg bg-foreground/[0.03] p-2 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Rate / day</div>
              <div className="text-sm font-black tabular-nums text-foreground">{data.learningRate}</div>
            </div>
          </div>
          <div className="w-full rounded-lg bg-foreground/[0.03] p-2 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Avg confidence</div>
            <div className="text-sm font-black tabular-nums text-violet-400">{data.avgConfidence.toFixed(1)}%</div>
          </div>
        </div>

        {/* Accuracy trend chart */}
        <div className="space-y-3">
          <div className="rounded-xl border border-border/40 bg-foreground/[0.02] p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">7-day accuracy trend</span>
              <span className="text-[10px] text-muted-foreground tabular-nums">{fmtPct(accuracyNow, 1)} now</span>
            </div>
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.accuracyTrend} margin={{ top: 4, right: 8, bottom: 0, left: -28 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[55, 100]} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<ChartTooltip fmt={(v: number) => `${v.toFixed(1)}%`} />} cursor={{ stroke: "#8b5cf6", strokeWidth: 1 }} />
                  <Line type="monotone" dataKey="accuracy" name="Accuracy" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 2.5, fill: "#8b5cf6" }} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* by-type chips */}
          <div className="flex flex-wrap gap-1.5">
            {byTypeEntries.map(([type, count]) => (
              <span key={type} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${insightTypeColor(type)}`}>
                <span className="capitalize">{type}</span>
                <span className="tabular-nums opacity-80">{count}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Top insights list */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Top insights</span>
          <span className="text-[10px] text-muted-foreground">{data.topInsights.length} learned</span>
        </div>
        <div className="max-h-72 space-y-1.5 overflow-y-auto scroll-thin pr-1">
          {data.topInsights.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/50 px-3 py-6 text-center text-xs text-muted-foreground">
              No insights recorded yet.
            </div>
          ) : (
            data.topInsights.map((ins) => (
              <motion.div
                key={ins.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-lg border border-border/40 bg-foreground/[0.02] px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className={`inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${insightTypeColor(ins.type)}`}>
                    {ins.type}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs font-bold text-foreground">{ins.pattern}</span>
                  <span className="shrink-0 text-[10px] font-bold tabular-nums text-violet-400">{ins.confidence.toFixed(0)}%</span>
                  <span className="shrink-0 rounded bg-foreground/[0.05] px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-muted-foreground">
                    ×{ins.appliedCount}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{ins.insight}</p>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// 6. Marketplace Liquidity
// ---------------------------------------------------------------------------

function MarketplaceLiquidityPanel({ data }: { data: MarketplaceIntel }) {
  const lqColor = data.liquidityScore >= 80 ? "#10b981" : data.liquidityScore >= 60 ? "#06b6d4" : "#f59e0b";
  const counts = [
    { icon: Network, label: "Providers", value: data.providerCount, accent: "text-emerald-400", bg: "bg-emerald-500/15" },
    { icon: Brain, label: "Drivers", value: data.driverCount, accent: "text-amber-400", bg: "bg-amber-500/15" },
    { icon: Users, label: "NPDs", value: data.npdCount, accent: "text-violet-400", bg: "bg-violet-500/15" },
    { icon: Activity, label: "Fleets", value: data.fleetCount, accent: "text-cyan-400", bg: "bg-cyan-500/15" },
    { icon: Database, label: "Merchants", value: data.merchantCount, accent: "text-fuchsia-400", bg: "bg-fuchsia-500/15" },
    { icon: Droplets, label: "Active auctions", value: data.activeAuctions, accent: "text-orange-400", bg: "bg-orange-500/15" },
  ];
  const savings = [
    { label: "Pool match rate", value: data.poolMatchRate, suffix: "%", color: "#8b5cf6" },
    { label: "Avg auction saving", value: data.avgAuctionSaving, suffix: "%", color: "#10b981" },
    { label: "Avg negotiation saving", value: data.avgNegotiationSaving, suffix: "%", color: "#06b6d4" },
  ];
  return (
    <Panel
      icon={Droplets}
      title="Marketplace Liquidity"
      accent="bg-sky-500/15 text-sky-400"
      right={<Badge className="border-sky-500/30 bg-sky-500/10 text-sky-400">${data.avgPrice.toFixed(2)} avg · {data.avgSurge.toFixed(1)}x surge</Badge>}
    >
      <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border/40 bg-foreground/[0.02] p-4">
          <CircularGauge
            value={data.liquidityScore}
            max={100}
            size={148}
            stroke={11}
            color={lqColor}
            unit=""
            label="Liquidity"
            sublabel={`${data.totalLiquidity} units`}
          />
          <div className="text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total capacity</div>
            <div className="text-lg font-black tabular-nums text-sky-400">{fmtNum(data.totalLiquidity)}</div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {counts.map((c) => {
              const CIcon = c.icon;
              return (
                <div key={c.label} className="flex items-center gap-2 rounded-lg border border-border/40 bg-foreground/[0.02] px-2.5 py-2">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${c.bg}`}>
                    <CIcon className={`h-3.5 w-3.5 ${c.accent}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</div>
                    <div className="text-sm font-black tabular-nums text-foreground">{c.value}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="space-y-2">
            {savings.map((s) => (
              <div key={s.label}>
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-muted-foreground">{s.label}</span>
                  <span className="font-black tabular-nums text-foreground">
                    {s.value}
                    {s.suffix}
                  </span>
                </div>
                <ProgressBar value={s.value} color={s.color} height={5} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// 7. Global Optimization
// ---------------------------------------------------------------------------

function GlobalOptimizationPanel({ data }: { data: OptimizationResult }) {
  const metrics = [
    { label: "Utilization improvement", value: data.metrics.utilizationImprovement, max: 20, suffix: "%", color: "#06b6d4" },
    { label: "Cost reduction", value: data.metrics.costReduction, max: 30, suffix: "%", color: "#10b981" },
    { label: "Empty-mile reduction", value: data.metrics.emptyMileReduction, max: 60, suffix: "%", color: "#8b5cf6" },
    { label: "Pooling effectiveness", value: data.metrics.poolingEffectiveness, max: 100, suffix: "%", color: "#f59e0b" },
    { label: "Carbon savings", value: data.metrics.carbonSavings, max: 2000, suffix: " kg", color: "#22c55e" },
    { label: "Time savings", value: data.metrics.timeSavings, max: 20, suffix: " min", color: "#f43f5e" },
  ];
  return (
    <Panel
      icon={Target}
      title="Global Optimization"
      accent="bg-cyan-500/15 text-cyan-400"
      right={
        <div className="flex items-center gap-1.5">
          <Badge className="border-cyan-500/30 bg-cyan-500/10 text-cyan-400 capitalize">{data.scope}</Badge>
          <Badge className="border-foreground/10 bg-foreground/5 text-muted-foreground">{data.target}</Badge>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-2.5">
          {metrics.map((m) => (
            <div key={m.label}>
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-muted-foreground">{m.label}</span>
                <span className="font-black tabular-nums text-foreground">
                  {m.value}
                  {m.suffix}
                </span>
              </div>
              <ProgressBar value={m.value} max={m.max} color={m.color} height={6} />
            </div>
          ))}
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Recommendations</span>
            <span className="text-[10px] text-muted-foreground">{data.recommendations.length} actions</span>
          </div>
          <div className="max-h-56 space-y-1.5 overflow-y-auto scroll-thin pr-1">
            {data.recommendations.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-2 rounded-lg border border-border/40 bg-foreground/[0.02] px-3 py-2"
              >
                <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
                <p className="text-[11px] leading-snug text-foreground">{r}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// 8. Demand Forecast
// ---------------------------------------------------------------------------

function DemandForecastPanel({ data }: { data: DemandForecast[] }) {
  const chartData = data.map((d) => ({
    hour: `${String(d.hour).padStart(2, "0")}h`,
    demand: d.predictedDemand,
    surge: d.predictedSurge,
    confidence: d.confidence,
    factors: d.factors,
  }));
  const zone = data.length > 0 ? data[0].zone : "—";
  const peak = chartData.reduce((m, d) => (d.demand > m.demand ? d : m), chartData[0] ?? { hour: "—", demand: 0 });
  const low = chartData.reduce((m, d) => (d.demand < m.demand ? d : m), chartData[0] ?? { hour: "—", demand: 0 });

  function zoneForDemand(v: number): string {
    if (v >= 100) return "High";
    if (v >= 60) return "Medium";
    return "Low";
  }

  return (
    <Panel
      icon={Activity}
      title="Demand Forecast"
      accent="bg-rose-500/15 text-rose-400"
      right={
        <div className="flex items-center gap-1.5">
          <Badge className="border-rose-500/30 bg-rose-500/10 text-rose-400">{zone}</Badge>
          <Badge className="border-foreground/10 bg-foreground/5 text-muted-foreground">12h horizon</Badge>
        </div>
      }
    >
      <div className="mb-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border/40 bg-foreground/[0.02] px-2.5 py-2 text-center">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Peak</div>
          <div className="text-sm font-black tabular-nums text-rose-400">{peak?.hour ?? "—"}</div>
          <div className="text-[10px] text-muted-foreground tabular-nums">{peak?.demand ?? 0} units</div>
        </div>
        <div className="rounded-lg border border-border/40 bg-foreground/[0.02] px-2.5 py-2 text-center">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Low</div>
          <div className="text-sm font-black tabular-nums text-emerald-400">{low?.hour ?? "—"}</div>
          <div className="text-[10px] text-muted-foreground tabular-nums">{low?.demand ?? 0} units</div>
        </div>
        <div className="rounded-lg border border-border/40 bg-foreground/[0.02] px-2.5 py-2 text-center">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Avg surge</div>
          <div className="text-sm font-black tabular-nums text-amber-400">
            {(chartData.reduce((s, d) => s + d.surge, 0) / Math.max(1, chartData.length)).toFixed(2)}x
          </div>
          <div className="text-[10px] text-muted-foreground tabular-nums">{chartData.length}h forecast</div>
        </div>
      </div>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
            <defs>
              <linearGradient id="demandHigh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="surgeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} interval={1} />
            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <RechartsTooltip content={<ChartTooltip />} cursor={{ stroke: "#f43f5e", strokeWidth: 1 }} />
            <ReferenceLine y={100} stroke="#f43f5e" strokeDasharray="4 4" strokeOpacity={0.4} label={{ value: "High", fontSize: 9, fill: "#f43f5e", position: "right" }} />
            <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.3} label={{ value: "Med", fontSize: 9, fill: "#f59e0b", position: "right" }} />
            <Area type="monotone" dataKey="demand" name="Demand" stroke="#f43f5e" strokeWidth={2} fill="url(#demandHigh)" />
            <Area type="monotone" dataKey="surge" name="Surge (x)" stroke="#f59e0b" strokeWidth={1.5} fill="url(#surgeFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {chartData.slice(0, 6).map((d, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
              d.demand >= 100
                ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                : d.demand >= 60
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            }`}
          >
            {d.hour} · {zoneForDemand(d.demand)}
          </span>
        ))}
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// 9. A/B Experiments
// ---------------------------------------------------------------------------

function ExperimentsPanel({ data }: { data: Experiment[] }) {
  const [open, setOpen] = useState<string | null>(data[0]?.id ?? null);
  return (
    <Panel
      icon={Zap}
      title="A/B Experiments"
      accent="bg-amber-500/15 text-amber-400"
      right={<Badge className="border-amber-500/30 bg-amber-500/10 text-amber-400">{data.length} running</Badge>}
    >
      <div className="space-y-2">
        {data.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/50 px-3 py-6 text-center text-xs text-muted-foreground">
            No experiments yet.
          </div>
        ) : (
          data.map((exp) => {
            const isOpen = open === exp.id;
            const maxMetric = Math.max(...exp.variants.map((v) => v.metricValue));
            const maxConv = Math.max(...exp.variants.map((v) => v.conversionRate));
            return (
              <div key={exp.id} className="rounded-xl border border-border/40 bg-foreground/[0.02]">
                <button
                  onClick={() => setOpen(isOpen ? null : exp.id)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
                >
                  <ChevronRight className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold text-foreground">{exp.name}</div>
                    <div className="truncate text-[10px] text-muted-foreground">{exp.description}</div>
                  </div>
                  <Badge
                    className={
                      exp.status === "running"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : exp.status === "paused"
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                          : "border-foreground/10 bg-foreground/5 text-muted-foreground"
                    }
                  >
                    {exp.status}
                  </Badge>
                  {exp.winner ? (
                    <Badge className="border-violet-500/30 bg-violet-500/10 text-violet-400">
                      <Sparkles className="h-2.5 w-2.5" /> {exp.winner}
                    </Badge>
                  ) : null}
                  <Badge className="border-cyan-500/30 bg-cyan-500/10 text-cyan-400 tabular-nums">{exp.confidence}%</Badge>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2 border-t border-border/40 px-3 py-3">
                        {exp.variants.map((v) => {
                          const isWinner = v.name === exp.winner;
                          return (
                            <div
                              key={v.name}
                              className={`rounded-lg border px-3 py-2 ${
                                isWinner ? "border-violet-500/40 bg-violet-500/[0.06]" : "border-border/40 bg-foreground/[0.02]"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-foreground">{v.name}</span>
                                  {isWinner ? (
                                    <Badge className="border-violet-500/30 bg-violet-500/15 text-violet-400">
                                      <Sparkles className="h-2.5 w-2.5" /> winner
                                    </Badge>
                                  ) : null}
                                </div>
                                <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
                                  {v.weight}% traffic
                                </span>
                              </div>
                              <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
                                <div>
                                  <div className="font-semibold uppercase tracking-wider text-muted-foreground">Participants</div>
                                  <div className="text-sm font-black tabular-nums text-foreground">{fmtNum(v.participants)}</div>
                                </div>
                                <div>
                                  <div className="font-semibold uppercase tracking-wider text-muted-foreground">Conv. rate</div>
                                  <div className="text-sm font-black tabular-nums text-amber-400">{v.conversionRate}%</div>
                                  <ProgressBar value={v.conversionRate} max={Math.max(1, maxConv)} color="#f59e0b" height={4} />
                                </div>
                                <div>
                                  <div className="font-semibold uppercase tracking-wider text-muted-foreground">{v.metric}</div>
                                  <div className="text-sm font-black tabular-nums text-emerald-400">{v.metricValue}</div>
                                  <ProgressBar value={v.metricValue} max={Math.max(1, maxMetric)} color="#10b981" height={4} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// 10. Compliance & Security
// ---------------------------------------------------------------------------

function ComplianceSecurityPanel({
  data,
  securityChecks,
}: {
  data: IntelligenceDashboard;
  securityChecks: SecurityCheck[];
}) {
  const [showChecks, setShowChecks] = useState(false);
  const dr = data.disasterRecovery;
  const retention = Object.entries(data.compliance.dataRetentionPolicy);
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {/* Compliance */}
      <Panel
        icon={ShieldCheck}
        title="Compliance"
        accent="bg-emerald-500/15 text-emerald-400"
        right={<Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">{data.compliance.countries} countries</Badge>}
      >
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-border/40 bg-foreground/[0.02] px-3 py-2 text-center">
            <div className="text-2xl font-black tabular-nums text-emerald-400">{data.compliance.countries}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Countries</div>
          </div>
          <div className="rounded-lg border border-border/40 bg-foreground/[0.02] px-3 py-2 text-center">
            <div className="text-2xl font-black tabular-nums text-cyan-400">{data.compliance.rulesEnforced}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rules enforced</div>
          </div>
        </div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Data retention policy</span>
        </div>
        <div className="space-y-1.5">
          {retention.map(([key, days]) => (
            <div key={key} className="flex items-center justify-between rounded-lg border border-border/40 bg-foreground/[0.02] px-3 py-1.5">
              <span className="text-[11px] font-semibold text-foreground">{retentionLabel(key)}</span>
              <span className="text-[11px] font-black tabular-nums text-amber-400">{retentionDaysToLabel(days)}</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* Security */}
      <Panel
        icon={Shield}
        title="Security Audit"
        accent="bg-rose-500/15 text-rose-400"
        right={
          <div className="flex items-center gap-1.5">
            <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">{data.security.checksPassed} passed</Badge>
            {data.security.checksWarning > 0 ? (
              <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-400">{data.security.checksWarning} warn</Badge>
            ) : null}
            {data.security.checksFailed > 0 ? (
              <Badge className="border-rose-500/30 bg-rose-500/10 text-rose-400">{data.security.checksFailed} fail</Badge>
            ) : null}
          </div>
        }
      >
        <div className="mb-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center">
            <div className="text-2xl font-black tabular-nums text-emerald-400">{data.security.checksPassed}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Passed</div>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center">
            <div className="text-2xl font-black tabular-nums text-amber-400">{data.security.checksWarning}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Warnings</div>
          </div>
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-center">
            <div className="text-2xl font-black tabular-nums text-rose-400">{data.security.checksFailed}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Failed</div>
          </div>
        </div>
        <button
          onClick={() => setShowChecks((v) => !v)}
          className="mb-2 flex w-full items-center justify-between rounded-lg border border-border/40 bg-foreground/[0.02] px-3 py-1.5 text-left transition hover:bg-foreground/[0.04]"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {showChecks ? "Hide" : "Show"} {securityChecks.length} checks
          </span>
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${showChecks ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence initial={false}>
          {showChecks && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="max-h-64 space-y-1 overflow-y-auto scroll-thin pr-1">
                {securityChecks.map((c) => {
                  const m = securityStatusMeta(c.status);
                  const MIcon = m.icon;
                  return (
                    <div key={c.id} className="flex items-start gap-2 rounded-lg border border-border/40 bg-foreground/[0.02] px-2.5 py-1.5">
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${m.bg}`}>
                        <MIcon className={`h-3.5 w-3.5 ${m.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-[11px] font-bold text-foreground">{c.name}</span>
                          <span className="shrink-0 rounded bg-foreground/[0.05] px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                            {c.category}
                          </span>
                        </div>
                        <p className="text-[10px] leading-snug text-muted-foreground">{c.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Disaster recovery mini-panel */}
        <div className="mt-3 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] p-3">
          <div className="mb-2 flex items-center gap-2">
            <Cloud className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Disaster Recovery</span>
            {dr.multiRegion ? <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">Multi-region</Badge> : null}
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-lg bg-foreground/[0.03] px-2 py-1.5">
              <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">RTO</div>
              <div className="font-black tabular-nums text-foreground">{dr.rto} min</div>
            </div>
            <div className="rounded-lg bg-foreground/[0.03] px-2 py-1.5">
              <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">RPO</div>
              <div className="font-black tabular-nums text-foreground">{dr.rpo} min</div>
            </div>
          </div>
          <div className="mt-2 space-y-1 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Backup</span>
              <span className="font-semibold text-foreground">{dr.backupFrequency}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Retention</span>
              <span className="font-semibold text-foreground">{dr.backupRetention}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Failover</span>
              <span className="font-semibold text-foreground text-right max-w-[60%] truncate">{dr.failoverStrategy}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last backup</span>
              <span className="font-semibold text-emerald-400">{timeAgo(dr.lastBackupAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last failover test</span>
              <span className="font-semibold text-amber-400">{timeAgo(dr.lastFailoverTest)}</span>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {dr.regions.map((r) => (
              <span key={r} className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold text-cyan-400">
                <Globe2 className="h-2.5 w-2.5" /> {r}
              </span>
            ))}
          </div>
        </div>
      </Panel>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 11. Recommendations
// ---------------------------------------------------------------------------

function RecommendationsPanel({ data }: { data: Recommendation[] }) {
  const totalSaving = data.reduce((s, r) => s + r.potentialSaving, 0);
  return (
    <Panel
      icon={Sparkles}
      title="Personalized Recommendations"
      accent="bg-emerald-500/15 text-emerald-400"
      right={
        <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
          {fmtMoney(totalSaving)} potential
        </Badge>
      }
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {data.length === 0 ? (
          <div className="col-span-full rounded-lg border border-dashed border-border/50 px-3 py-6 text-center text-xs text-muted-foreground">
            No recommendations yet.
          </div>
        ) : (
          data.map((r, i) => {
            const m = recTypeMeta(r.type);
            const RIcon = m.icon;
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col gap-2 rounded-xl border border-border/40 bg-foreground/[0.02] p-3"
              >
                <div className="flex items-start gap-2">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${m.bg}`}>
                    <RIcon className={`h-4 w-4 ${m.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-xs font-bold text-foreground">{r.title}</span>
                      {r.actionable ? (
                        <Badge className="shrink-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-400">Actionable</Badge>
                      ) : null}
                    </div>
                    <Badge className={`mt-0.5 border-transparent ${m.bg} ${m.color}`}>{m.label}</Badge>
                  </div>
                </div>
                <p className="text-[11px] leading-snug text-muted-foreground">{r.detail}</p>
                <div className="flex items-center justify-between border-t border-border/40 pt-2">
                  <div className="flex items-center gap-1.5">
                    <Wallet className="h-3 w-3 text-emerald-400" />
                    <span className="text-xs font-black tabular-nums text-emerald-400">
                      {fmtMoney(r.potentialSaving)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">saving</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Gauge className="h-3 w-3 text-violet-400" />
                    <span className="text-[11px] font-bold tabular-nums text-violet-400">{r.confidence}%</span>
                    <span className="text-[10px] text-muted-foreground">confidence</span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function IntelligenceDashboard() {
  const [data, setData] = useState<IntelligenceDashboard | null>(null);
  const [securityChecks, setSecurityChecks] = useState<SecurityCheck[]>([]);
  const [connected, setConnected] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const mounted = useRef(true);

  const poll = useCallback(async () => {
    const [dash, sec] = await Promise.all([
      fetchJson<IntelligenceDashboard>("/api/kernel/intelligence"),
      fetchJson<SecurityCheck[]>("/api/kernel/intelligence/compliance?detail=security"),
    ]);
    if (!mounted.current) return;
    if (dash) {
      setData(dash);
      setLastUpdated(Date.now());
      setConnected(true);
    } else {
      setConnected(false);
    }
    if (sec) setSecurityChecks(sec);
  }, []);

  useEffect(() => {
    mounted.current = true;
    // All setStates happen after `await` inside poll(), so this is not a
    // synchronous setState-in-effect.
    void poll();
    const id = setInterval(() => {
      void poll();
    }, 5000);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [poll]);

  return (
    <div className="space-y-3 px-3 pb-6 pt-3 sm:px-4 sm:pb-8">
      {/* Title bar */}
      <div className="flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-cyan-400">
          <Gauge className="h-3 w-3" /> Intelligence Dashboard
        </div>
        <h2 className="mt-2 text-balance text-lg font-black tracking-tight text-foreground sm:text-xl">
          The complete state of the Oryx Mobility OS
        </h2>
        <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
          Continuous learning, demand forecasting, marketplace liquidity, global
          optimization, compliance, security, and disaster recovery — all in real time.
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
              connected
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-rose-500/30 bg-rose-500/10 text-rose-400"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
            {connected ? "Live" : "Reconnecting"}
          </span>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            updated {timeAgo(lastUpdated)} · polling 5s
          </span>
        </div>
      </div>

      {!data ? (
        <LoadingState />
      ) : (
        <>
          <HeroNetworkIQ data={data} />
          <KpiGrid data={data} />
          <ConnectorHealthPanel health={data.connectorHealth} graphStats={data.graphStats} />
          <AIAgentPerformancePanel data={data.aiAgentPerformance} />
          <LearningProgressionPanel data={data.learningProgression} />
          <MarketplaceLiquidityPanel data={data.marketplaceLiquidity} />
          <GlobalOptimizationPanel data={data.globalOptimization} />
          <DemandForecastPanel data={data.demandForecast} />
          <ExperimentsPanel data={data.experiments} />
          <ComplianceSecurityPanel data={data} securityChecks={securityChecks} />
          <RecommendationsPanel data={data.recommendations} />
        </>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-3">
      <div className="h-48 animate-pulse rounded-2xl border border-border/40 bg-foreground/[0.03]" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl border border-border/40 bg-foreground/[0.03]" />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-2xl border border-border/40 bg-foreground/[0.03]" />
        <div className="h-64 animate-pulse rounded-2xl border border-border/40 bg-foreground/[0.03]" />
      </div>
      <div className="h-72 animate-pulse rounded-2xl border border-border/40 bg-foreground/[0.03]" />
    </div>
  );
}

export default IntelligenceDashboard;
