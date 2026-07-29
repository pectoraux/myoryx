"use client";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Database,
  Cpu,
  Bot,
  Activity,
  Radio,
  ToggleLeft,
  ToggleRight,
  Users,
  Truck,
  Car,
  Zap,
} from "lucide-react";

// ---- Types -----------------------------------------------------------------

interface GraphStats {
  totalNodes: number;
  byType: Record<string, number>;
  totalEdges: number;
}

interface Connector {
  id: string;
  name: string;
  category: string;
  version: string;
  mode: string;
  signals: string[];
  status: string;
  latencyMs: number;
  eventsIngested: number;
  uptimePct: number;
  lastEventAt?: number;
  lastError?: string;
}

interface AgentDecision {
  id: string;
  agentId: string;
  reasoning: string;
  action: string;
  timestamp: number;
  outcome?: "success" | "failure" | "pending";
}

interface Agent {
  id: string;
  role: string;
  name: string;
  emoji: string;
  color: string;
  team: "rider" | "driver" | "fleet";
  description: string;
  tools: string[];
  subscribesTo: string[];
  active: boolean;
  decisions: AgentDecision[];
}

interface FeatureFlagState {
  flag: string;
  enabled: boolean;
  rolloutPct: number;
  description: string;
}

interface KernelEvent {
  id: string;
  type: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  correlationId: string;
  causedBy?: string;
  timestamp: number;
  version: number;
}

// ---- Helpers ---------------------------------------------------------------

const STATUS_COLOR: Record<string, { dot: string; text: string }> = {
  live: { dot: "bg-emerald-400", text: "text-emerald-400" },
  syncing: { dot: "bg-amber-400 animate-pulse", text: "text-amber-400" },
  degraded: { dot: "bg-orange-400", text: "text-orange-400" },
  disconnected: { dot: "bg-muted-foreground/40", text: "text-muted-foreground" },
  error: { dot: "bg-rose-400", text: "text-rose-400" },
};

const TEAM_META: Record<Agent["team"], { label: string; icon: typeof Users; color: string; bg: string }> = {
  rider: { label: "Rider team", icon: Users, color: "text-emerald-400", bg: "bg-emerald-500/15" },
  driver: { label: "Driver team", icon: Car, color: "text-amber-400", bg: "bg-amber-500/15" },
  fleet: { label: "Fleet team", icon: Truck, color: "text-violet-400", bg: "bg-violet-500/15" },
};

function eventColor(type: string): string {
  if (type.startsWith("connector")) return "text-cyan-400";
  if (type.startsWith("intent")) return "text-emerald-400";
  if (type.startsWith("agent")) return "text-amber-400";
  if (type.startsWith("graph")) return "text-violet-400";
  if (type.startsWith("extension")) return "text-pink-400";
  if (type.startsWith("calendar")) return "text-emerald-300";
  if (type.startsWith("scheduler")) return "text-cyan-300";
  return "text-muted-foreground";
}

function tsClock(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, { hour12: false });
}

// ---- Component -------------------------------------------------------------

export function KernelDashboard() {
  const [graph, setGraph] = useState<GraphStats | null>(null);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [flags, setFlags] = useState<FeatureFlagState[]>([]);
  const [events, setEvents] = useState<KernelEvent[]>([]);

  const fetchAll = useCallback(async () => {
    try {
      const [gR, cR, aR, fR, eR] = await Promise.all([
        fetch("/api/kernel/graph", { cache: "no-store" }),
        fetch("/api/kernel/connectors", { cache: "no-store" }),
        fetch("/api/kernel/agents", { cache: "no-store" }),
        fetch("/api/kernel/flags", { cache: "no-store" }),
        fetch("/api/kernel/events?limit=20", { cache: "no-store" }),
      ]);
      const [g, c, a, f, e] = await Promise.all([
        gR.json(),
        cR.json(),
        aR.json(),
        fR.json(),
        eR.json(),
      ]);
      setGraph(g);
      setConnectors(c);
      setAgents(a);
      setFlags(f);
      setEvents((e as KernelEvent[]).slice().reverse());
    } catch {
      // ignore — keep last state
    }
  }, []);

  useEffect(() => {
    // Initial fetch — fetchAll is async, all setStates happen after `await`
    // so this is not actually a synchronous setState-in-effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const id = setInterval(fetchAll, 2000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const eventsIngested = connectors.reduce((s, c) => s + (c.eventsIngested || 0), 0);
  const liveCount = connectors.filter((c) => c.status === "live").length;
  const activeAgents = agents.filter((a) => a.active).length;

  const toggleFlag = async (flag: string, enabled: boolean) => {
    setFlags((f) => f.map((x) => (x.flag === flag ? { ...x, enabled: !enabled } : x)));
    try {
      await fetch("/api/kernel/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag, enabled: !enabled }),
      });
      toast.success(`${flag} ${!enabled ? "enabled" : "disabled"}`);
    } catch {
      toast.error("Could not toggle flag");
    }
  };

  const riderAgents = agents.filter((a) => a.team === "rider");
  const driverAgents = agents.filter((a) => a.team === "driver");
  const fleetAgents = agents.filter((a) => a.team === "fleet");

  return (
    <div className="px-4 pb-8 pt-3">
      {/* Header */}
      <div className="mb-3 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-cyan-400">
          <Activity className="h-3 w-3" /> Mobility Kernel · Observability
        </div>
        <h2 className="mt-3 text-xl font-black tracking-tight text-foreground text-balance">
          One brain. Every signal visible.
        </h2>
        <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
          Live view of the Mobility Kernel — graph, connectors, agents, events,
          and feature flags. Refreshes every 2 seconds.
        </p>
      </div>

      {/* Stat cards */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard
          icon={Database}
          label="Graph nodes"
          value={graph?.totalNodes ?? "—"}
          sub={`${graph?.totalEdges ?? 0} edges`}
          color="text-violet-400"
          bg="bg-violet-500/15"
        />
        <StatCard
          icon={Cpu}
          label="Active connectors"
          value={`${liveCount}/${connectors.length}`}
          sub="ingesting live"
          color="text-cyan-400"
          bg="bg-cyan-500/15"
        />
        <StatCard
          icon={Bot}
          label="Live agents"
          value={`${activeAgents}/${agents.length}`}
          sub="across 3 teams"
          color="text-amber-400"
          bg="bg-amber-500/15"
        />
        <StatCard
          icon={Radio}
          label="Events ingested"
          value={eventsIngested.toLocaleString()}
          sub="from connectors"
          color="text-emerald-400"
          bg="bg-emerald-500/15"
        />
      </div>

      {/* Connector health table */}
      <SectionHeader icon={Cpu} label="Connector health" />
      <div className="mb-4 overflow-hidden rounded-2xl border border-border/50 bg-card/40">
        <div className="hidden grid-cols-[1.4fr_0.6fr_0.8fr_0.6fr_0.6fr] gap-2 border-b border-border/40 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground sm:grid">
          <span>Connector</span>
          <span>Status</span>
          <span>Latency</span>
          <span>Events</span>
          <span>Uptime</span>
        </div>
        <div className="max-h-72 overflow-y-auto scroll-thin">
          {connectors.map((c, i) => {
            const st = STATUS_COLOR[c.status] || STATUS_COLOR.disconnected;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-[1.4fr_0.6fr_0.8fr_0.6fr_0.6fr] items-center gap-2 border-b border-border/30 px-3 py-2 text-[11px] last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="truncate font-bold text-foreground">{c.name}</div>
                  <div className="font-mono text-[9px] text-muted-foreground">
                    {c.category} · v{c.version} · {c.mode}
                  </div>
                </div>
                <div className={`flex items-center gap-1 font-bold uppercase ${st.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                  <span className="text-[10px]">{c.status}</span>
                </div>
                <div className="tabular-nums text-muted-foreground">{c.latencyMs}ms</div>
                <div className="tabular-nums text-foreground">{c.eventsIngested.toLocaleString()}</div>
                <div className="tabular-nums text-emerald-400">{c.uptimePct.toFixed(1)}%</div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Live event feed + Agent teams side-by-side on sm+ */}
      <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Live event feed */}
        <div>
          <SectionHeader icon={Radio} label="Live event feed" />
          <div className="scroll-thin max-h-80 overflow-y-auto rounded-2xl border border-border/50 bg-[oklch(0.11_0.005_200)] p-2 font-mono">
            {events.length === 0 ? (
              <div className="px-2 py-8 text-center text-[11px] text-muted-foreground">
                No events yet. Add a plan or simulate a ride.
              </div>
            ) : (
              events.map((e) => (
                <div
                  key={e.id}
                  className="flex items-start gap-2 rounded-md px-1.5 py-1 text-[10px] leading-snug hover:bg-foreground/[0.04]"
                >
                  <span className="shrink-0 text-muted-foreground/60 tabular-nums">
                    {tsClock(e.timestamp)}
                  </span>
                  <span className={`shrink-0 font-bold ${eventColor(e.type)}`}>{e.type}</span>
                  <span className="flex-1 break-words text-muted-foreground">
                    <span className="text-foreground/70">{e.aggregateId}</span>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Agent teams */}
        <div>
          <SectionHeader icon={Bot} label="Agent teams" />
          <div className="grid grid-cols-1 gap-2">
            {(["rider", "driver", "fleet"] as const).map((team) => {
              const list = team === "rider" ? riderAgents : team === "driver" ? driverAgents : fleetAgents;
              const meta = TEAM_META[team];
              const activeCount = list.filter((a) => a.active).length;
              const TIcon = meta.icon;
              return (
                <div
                  key={team}
                  className="overflow-hidden rounded-2xl border border-border/50 bg-card/40"
                >
                  <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${meta.bg}`}>
                      <TIcon className={`h-3.5 w-3.5 ${meta.color}`} />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                      {meta.label}
                    </span>
                    <span className={`ml-auto text-[10px] font-bold tabular-nums ${meta.color}`}>
                      {activeCount}/{list.length} active
                    </span>
                  </div>
                  <div className="scroll-thin max-h-40 overflow-y-auto p-1.5">
                    {list.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center gap-2 rounded-lg px-2 py-1 text-[11px]"
                      >
                        <span className="text-base leading-none">{a.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-bold text-foreground">{a.name}</div>
                          <div className="font-mono text-[9px] text-muted-foreground">{a.role}</div>
                        </div>
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums ${
                            a.active
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-foreground/10 text-muted-foreground"
                          }`}
                        >
                          {a.decisions.length} dec
                        </span>
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            a.active ? "bg-emerald-400" : "bg-muted-foreground/30"
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Feature flags grid */}
      <SectionHeader icon={ToggleLeft} label="Feature flags" />
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {flags.map((f, i) => (
          <motion.button
            key={f.flag}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            onClick={() => toggleFlag(f.flag, f.enabled)}
            className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition ${
              f.enabled
                ? "border-emerald-500/30 bg-emerald-500/[0.05]"
                : "border-border/50 bg-card/40 hover:bg-foreground/[0.03]"
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-mono text-[11px] font-bold text-foreground">
                  {f.flag}
                </span>
                <span className="rounded-full bg-foreground/10 px-1 py-0.5 text-[8px] font-bold tabular-nums text-muted-foreground">
                  {f.rolloutPct}%
                </span>
              </div>
              <div className="text-[10px] leading-snug text-muted-foreground">{f.description}</div>
            </div>
            {f.enabled ? (
              <ToggleRight className="h-6 w-6 shrink-0 text-emerald-400" />
            ) : (
              <ToggleLeft className="h-6 w-6 shrink-0 text-muted-foreground/60" />
            )}
          </motion.button>
        ))}
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/[0.04] p-3">
        <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">The kernel is event-driven.</span> Every
          connector ingest, every calendar change, every agent decision flows through one typed
          event bus. Toggling a flag at runtime affects every dependent subsystem instantly.
        </p>
      </div>
    </div>
  );
}

// ---- Sub-components --------------------------------------------------------

function StatCard({
  icon: Icon, label, value, sub, color, bg,
}: {
  icon: typeof Database;
  label: string;
  value: string | number;
  sub: string;
  color: string;
  bg: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-border/50 bg-card/40 p-3"
    >
      <div className="flex items-center justify-between">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </div>
      <div className="mt-2 text-xl font-black tabular-nums text-foreground">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-[9px] text-muted-foreground/70">{sub}</div>
    </motion.div>
  );
}

function SectionHeader({ icon: Icon, label }: { icon: typeof Database; label: string }) {
  return (
    <div className="mb-2 flex items-center gap-2 px-1">
      <Icon className="h-3.5 w-3.5 text-cyan-400" />
      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export default KernelDashboard;
