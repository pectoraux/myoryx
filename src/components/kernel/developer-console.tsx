"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  Boxes,
  Brain,
  Building2,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Cpu,
  Database,
  Download,
  Eye,
  FileCode,
  FileText,
  FlaskConical,
  GitBranch,
  Hammer,
  History,
  KeyRound,
  Library,
  type LucideIcon,
  Network,
  Package,
  Play,
  Plug,
  Plus,
  PlayCircle,
  Radio,
  RefreshCw,
  Rewind,
  Search,
  Send,
  Share2,
  Sparkles,
  Terminal,
  Trash2,
  Webhook,
  XCircle,
  Zap,
} from "lucide-react";

// ===========================================================================
// Types — mirrored from the kernel
// ===========================================================================

type ExtensionPermission =
  | "read:intents" | "write:intents"
  | "read:calendar" | "write:calendar"
  | "read:graph" | "write:graph"
  | "emit:events" | "call:connector"
  | "ai:plan" | "network:external";

type ExtensionHook =
  | "onIntentCreated" | "onIntentOptimized" | "onCalendarChanged"
  | "onConnectorEvent" | "onAuctionCleared" | "onRideBooked"
  | "onParcelDispatched" | "onSchedule";

interface ExtensionManifest {
  id: string;
  name: string;
  developer: string;
  version: string;
  description: string;
  category: string;
  emoji: string;
  color: string;
  permissions: ExtensionPermission[];
  hooks: ExtensionHook[];
  subscribesTo?: string[];
  entrypoint: string;
}

interface ExtensionLog {
  id: string;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  timestamp: number;
}

interface ExtensionInstance {
  manifest: ExtensionManifest;
  status: string;
  installedAt?: number;
  lastError?: string;
  eventsProcessed: number;
  hotReloadEnabled?: boolean;
  logs: ExtensionLog[];
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

interface GraphStats {
  totalNodes: number;
  byType: Record<string, number>;
  totalEdges: number;
}

interface ConnectorHealth {
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

interface GraphNode {
  id: string;
  type: string;
  label: string;
  edges: Record<string, string[]>;
  attrs: Record<string, unknown>;
  updatedAt: number;
}

interface GraphInspectResult {
  stats: GraphStats;
  nodes: GraphNode[];
  neighborhoods: GraphNode[];
  routes: GraphNode[];
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

interface AIAgentSummary {
  agentId: string;
  name: string;
  recentDecisions: AgentDecision[];
}

interface SagaStep {
  name: string;
  onSuccess: string;
  timeoutMs?: number;
}

interface SagaInstance {
  id: string;
  type: string;
  steps: SagaStep[];
  currentStep: number;
  state: "running" | "completed" | "failed" | "compensating" | "paused";
  correlationId: string;
  startedAt: number;
  updatedAt: number;
  completedEvents: string[];
  error?: string;
}

interface SDKDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  methods: Array<{
    name: string;
    signature: string;
    description: string;
    returns: string;
    example: string;
  }>;
  auth: "oauth2" | "api_key" | "webhook_secret" | "none";
  docsUrl: string;
  codeExample: string;
}

interface SDKSummary {
  id: string;
  name: string;
  version: string;
  description: string;
}

interface GeneratedDoc {
  id: string;
  title: string;
  type: "sdk" | "extension" | "connector" | "api";
  content: string;
  generatedAt: number;
}

interface OAuthClient {
  id: string;
  name: string;
  type: string;
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  scopes: string[];
  createdAt: number;
}

interface OAuthToken {
  id: string;
  clientId: string;
  clientName: string;
  scopes: string[];
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  createdAt: number;
}

interface WebhookDelivery {
  id: string;
  event: string;
  payload: unknown;
  status: "delivered" | "failed" | "pending" | "retrying";
  attempts: number;
  responseCode?: number;
  deliveredAt?: number;
  error?: string;
}

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  deliveries: WebhookDelivery[];
  createdAt: number;
}

interface CertificationRequirement {
  id: string;
  name: string;
  description: string;
  required: boolean;
}

interface CertificationResult {
  connectorId: string;
  status: "certified" | "pending" | "failed";
  requirements: Array<{ requirement: string; passed: boolean; detail: string }>;
  score: number;
  certifiedAt?: number;
}

interface ExtensionVersion {
  id: string;
  extensionId: string;
  version: string;
  changelog: string;
  status: "draft" | "published" | "deprecated" | "yanked";
  publishedAt?: number;
  downloadCount: number;
  compatibleKernelVersion: string;
}

interface SandboxSession {
  id: string;
  name: string;
  status: "active" | "closed";
  events: KernelEvent[];
  createdAt: number;
  testResults: Array<{
    id: string;
    name: string;
    status: "passed" | "failed" | "skipped";
    durationMs: number;
    detail: string;
  }>;
}

interface PluginMonitorEntry {
  extensionId: string;
  name: string;
  status: "healthy" | "degraded" | "error";
  eventsProcessed: number;
  errorsToday: number;
  avgLatencyMs: number;
  memoryUsageMb: number;
  lastError?: string;
  lastActiveAt: number;
}

interface PluginMonitorSummary {
  entries: PluginMonitorEntry[];
  health: { healthy: number; degraded: number; error: number; total: number };
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

interface IntentLite {
  id: string;
  userId: string;
  type: string;
  origin?: string;
  destination?: string;
  estimatedCost?: number;
  createdAt: number;
  updatedAt: number;
  status?: string;
  suggestions?: Array<{ id: string; kind: string; title: string; saving?: number; confidence: number }>;
}

interface OptimizationReplay {
  intent: IntentLite;
  suggestions: Array<{ id: string; kind: string; title: string; saving?: number; confidence: number }>;
  costOverTime?: {
    baseline: number;
    predictions: Array<{ time: string; cost: number; surge: number; demand: string; confidence: number }>;
    cheapestSlot?: { time: string; cost: number; saving: number };
    peakSlot?: { time: string; cost: number };
  };
  timeline: Array<{ step: number; action: string; timestamp?: number; detail?: string }>;
}

// ===========================================================================
// Constants
// ===========================================================================

const PERMISSIONS: ExtensionPermission[] = [
  "read:intents", "write:intents",
  "read:calendar", "write:calendar",
  "read:graph", "write:graph",
  "emit:events", "call:connector",
  "ai:plan", "network:external",
];

const HOOKS: ExtensionHook[] = [
  "onIntentCreated", "onIntentOptimized", "onCalendarChanged",
  "onConnectorEvent", "onAuctionCleared", "onRideBooked",
  "onParcelDispatched", "onSchedule",
];

const EMPTY_MANIFEST: ExtensionManifest = {
  id: "",
  name: "",
  developer: "",
  version: "0.1.0",
  description: "",
  category: "custom",
  emoji: "🧩",
  color: "#a78bfa",
  permissions: ["read:intents"],
  hooks: ["onIntentCreated"],
  entrypoint: "index.ts",
};

type ToolId =
  | "extensions" | "connector-sim" | "ride-sim" | "sandbox"
  | "events" | "sagas" | "graph" | "ai-trace" | "replay"
  | "package" | "submission"
  | "sdk" | "oauth" | "webhooks" | "monitoring" | "docs";

interface ToolEntry {
  id: ToolId;
  label: string;
  icon: LucideIcon;
  hint: string;
}

interface ToolGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  tools: ToolEntry[];
}

const TOOL_GROUPS: ToolGroup[] = [
  {
    id: "extensions",
    label: "Extensions",
    icon: Boxes,
    tools: [
      { id: "extensions", label: "Extensions", icon: Boxes, hint: "Installed + dev extensions" },
    ],
  },
  {
    id: "simulators",
    label: "Simulators",
    icon: PlayCircle,
    tools: [
      { id: "connector-sim", label: "Connector Sim", icon: Plug, hint: "Publish connector events" },
      { id: "ride-sim", label: "Ride Sim", icon: Car, hint: "Full ride flow chain" },
      { id: "sandbox", label: "Sandbox", icon: FlaskConical, hint: "Isolated test sessions" },
    ],
  },
  {
    id: "inspectors",
    label: "Inspectors",
    icon: Search,
    tools: [
      { id: "events", label: "Event Inspector", icon: Radio, hint: "Live event feed" },
      { id: "sagas", label: "Workflow Debugger", icon: GitBranch, hint: "Active sagas" },
      { id: "graph", label: "Graph Inspector", icon: Network, hint: "Knowledge graph" },
      { id: "ai-trace", label: "AI Trace Viewer", icon: Brain, hint: "Agent decisions" },
      { id: "replay", label: "Optimization Replay", icon: Rewind, hint: "Replay intents" },
    ],
  },
  {
    id: "build",
    label: "Build",
    icon: Hammer,
    tools: [
      { id: "package", label: "Package Builder", icon: Package, hint: "Manifest → package" },
      { id: "submission", label: "Submissions", icon: ClipboardCheck, hint: "Cert + versions" },
    ],
  },
  {
    id: "enterprise",
    label: "Enterprise",
    icon: Building2,
    tools: [
      { id: "sdk", label: "SDK Browser", icon: Library, hint: "6 typed SDKs" },
      { id: "oauth", label: "OAuth Manager", icon: KeyRound, hint: "Clients + tokens" },
      { id: "webhooks", label: "Webhook Manager", icon: Webhook, hint: "Endpoints + delivery" },
      { id: "monitoring", label: "Monitoring", icon: Activity, hint: "Plugin health" },
      { id: "docs", label: "Documentation", icon: FileText, hint: "Generated docs" },
    ],
  },
];

const ALL_TOOLS: ToolEntry[] = TOOL_GROUPS.flatMap((g) => g.tools);

const LOG_COLORS: Record<string, { text: string; dot: string; icon: LucideIcon }> = {
  debug: { text: "text-muted-foreground/70", dot: "bg-muted-foreground/40", icon: Terminal },
  info: { text: "text-cyan-300", dot: "bg-cyan-400", icon: Activity },
  warn: { text: "text-amber-300", dot: "bg-amber-400", icon: AlertTriangle },
  error: { text: "text-rose-300", dot: "bg-rose-400", icon: XCircle },
};

// ===========================================================================
// Helpers
// ===========================================================================

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 1000) return "just now";
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

function tsClock(ts: number): string {
  const d = new Date(ts);
  return (
    d.toLocaleTimeString(undefined, { hour12: false }) +
    "." +
    String(d.getMilliseconds()).padStart(3, "0")
  );
}

function eventColor(type: string): string {
  if (type.startsWith("connector")) return "text-cyan-400";
  if (type.startsWith("intent")) return "text-emerald-400";
  if (type.startsWith("agent")) return "text-amber-400";
  if (type.startsWith("graph")) return "text-violet-400";
  if (type.startsWith("extension")) return "text-pink-400";
  if (type.startsWith("calendar")) return "text-emerald-300";
  if (type.startsWith("ride")) return "text-sky-400";
  if (type.startsWith("auction")) return "text-orange-400";
  if (type.startsWith("parcel")) return "text-fuchsia-400";
  if (type.startsWith("saga")) return "text-lime-400";
  return "text-muted-foreground";
}

function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (s === "live" || s === "healthy" || s === "active" || s === "completed" || s === "certified" || s === "published" || s === "passed")
    return "text-emerald-400";
  if (s === "degraded" || s === "pending" || s === "paused" || s === "syncing" || s === "draft" || s === "running" || s === "retrying")
    return "text-amber-400";
  if (s === "error" || s === "failed" || s === "yanked" || s === "disconnected")
    return "text-rose-400";
  if (s === "deprecated") return "text-muted-foreground";
  return "text-cyan-400";
}

function safeJsonParse(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "invalid JSON" };
  }
}

function prettyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ===========================================================================
// Main component
// ===========================================================================

export function DeveloperConsole() {
  const [activeTool, setActiveTool] = useState<ToolId>("extensions");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // ---- Global health state (top bar) ----
  const [graphStats, setGraphStats] = useState<GraphStats | null>(null);
  const [connectors, setConnectors] = useState<ConnectorHealth[]>([]);
  const [aiStats, setAiStats] = useState<AIStats | null>(null);
  const [eventsCount, setEventsCount] = useState(0);
  const [eventsPerSec, setEventsPerSec] = useState(0);
  const [connected, setConnected] = useState(true);
  const prevEventsCount = useRef(0);

  // ---- Extensions state (shared) ----
  const [extensions, setExtensions] = useState<ExtensionInstance[]>([]);
  const [events, setEvents] = useState<KernelEvent[]>([]);

  const fetchHealth = useCallback(async () => {
    try {
      const [graphRes, connRes, aiRes, evtRes] = await Promise.all([
        fetch("/api/kernel/graph", { cache: "no-store" }),
        fetch("/api/kernel/connectors", { cache: "no-store" }),
        fetch("/api/kernel/ai-stats", { cache: "no-store" }),
        fetch("/api/kernel/events?limit=80", { cache: "no-store" }),
      ]);
      if (!graphRes.ok || !connRes.ok || !aiRes.ok || !evtRes.ok) {
        setConnected(false);
        return;
      }
      setConnected(true);
      setGraphStats(await graphRes.json());
      setConnectors(await connRes.json());
      setAiStats(await aiRes.json());
      const evts: KernelEvent[] = await evtRes.json();
      setEvents(evts.slice().reverse());
      setEventsCount(evts.length);
      if (prevEventsCount.current > 0) {
        const delta = evts.length - prevEventsCount.current;
        if (delta > 0) setEventsPerSec(Math.min(delta, 99));
      }
      prevEventsCount.current = evts.length;
    } catch {
      setConnected(false);
    }
  }, []);

  const fetchExtensions = useCallback(async () => {
    try {
      const res = await fetch("/api/kernel/dev-console", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setExtensions(data.extensions || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    // Initial fetch — fetchHealth/fetchExtensions are async; all setStates
    // happen after `await` so this is not a real synchronous setState-in-effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchHealth();
    void fetchExtensions();
    const id = setInterval(() => {
      void fetchHealth();
      void fetchExtensions();
    }, 3000);
    return () => clearInterval(id);
  }, [fetchHealth, fetchExtensions]);

  const liveConnectors = connectors.filter((c) => c.status === "live").length;
  const activeToolMeta = ALL_TOOLS.find((t) => t.id === activeTool);

  return (
    <div className="px-3 pb-6 pt-3 sm:px-4 sm:pb-8">
      {/* Title row */}
      <div className="mb-3 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-400">
          <Terminal className="h-3 w-3" /> Developer Console
        </div>
        <h2 className="mt-2 text-balance text-lg font-black tracking-tight text-foreground sm:text-xl">
          Build, simulate, inspect, and ship mobility extensions
        </h2>
        <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
          A cloud-IDE workspace for the Oryx Mobility Kernel. Sixteen tools spanning
          extension development, simulation, observability, and enterprise SDKs.
        </p>
      </div>

      {/* Top health bar */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        <HealthBadge
          icon={Database}
          label="Graph nodes"
          value={graphStats?.totalNodes ?? "—"}
          sub={graphStats ? `${graphStats.totalEdges} edges` : "—"}
          color="text-violet-400"
          bg="bg-violet-500/15"
        />
        <HealthBadge
          icon={Plug}
          label="Connectors"
          value={`${liveConnectors}/${connectors.length}`}
          sub={`${connectors.reduce((s, c) => s + c.eventsIngested, 0)} events`}
          color="text-cyan-400"
          bg="bg-cyan-500/15"
        />
        <HealthBadge
          icon={Brain}
          label="AI agents"
          value={aiStats ? `${aiStats.activeAgents}/${aiStats.totalAgents}` : "—"}
          sub={aiStats ? `${aiStats.queuedTasks} queued` : "—"}
          color="text-amber-400"
          bg="bg-amber-500/15"
        />
        <HealthBadge
          icon={Activity}
          label="Events / poll"
          value={eventsPerSec}
          sub={`${eventsCount} stored`}
          color="text-emerald-400"
          bg="bg-emerald-500/15"
        />
      </motion.div>

      {/* IDE shell */}
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-[oklch(0.13_0.005_200)]">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-border/40 bg-foreground/[0.02] px-3 py-2">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
          </div>
          <span className="ml-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            oryx-kernel · dev-workspace
          </span>
          <div className="ml-auto flex items-center gap-3 font-mono text-[10px]">
            <span className="hidden items-center gap-1 text-muted-foreground sm:flex">
              <Search className="h-3 w-3" />
              {activeToolMeta?.label}
            </span>
            <span className={`flex items-center gap-1.5 ${connected ? "text-emerald-400" : "text-rose-400"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${connected ? "animate-pulse bg-emerald-400" : "bg-rose-400"}`} />
              {connected ? "connected" : "offline"}
            </span>
          </div>
        </div>

        {/* Body: sidebar + main panel */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr]">
          {/* Sidebar */}
          <div className="scroll-thin max-h-[28rem] overflow-y-auto border-b border-border/40 bg-foreground/[0.01] p-2 md:max-h-[36rem] md:border-b-0 md:border-r">
            {TOOL_GROUPS.map((group) => {
              const collapsed = collapsedGroups[group.id];
              return (
                <div key={group.id} className="mb-1.5">
                  <button
                    onClick={() =>
                      setCollapsedGroups((p) => ({ ...p, [group.id]: !p[group.id] }))
                    }
                    className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition hover:text-foreground"
                  >
                    {collapsed ? (
                      <ChevronRight className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                    <group.icon className="h-3 w-3" />
                    {group.label}
                  </button>
                  <AnimatePresence initial={false}>
                    {!collapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-0.5 space-y-0.5">
                          {group.tools.map((tool) => {
                            const active = activeTool === tool.id;
                            return (
                              <button
                                key={tool.id}
                                onClick={() => setActiveTool(tool.id)}
                                className={`group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition ${
                                  active
                                    ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                                    : "text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground"
                                }`}
                                title={tool.hint}
                              >
                                <tool.icon className={`h-3.5 w-3.5 shrink-0 ${active ? "text-emerald-400" : ""}`} />
                                <span className="truncate font-mono text-[11px] font-semibold">
                                  {tool.label}
                                </span>
                                {active && (
                                  <ChevronRight className="ml-auto h-3 w-3 text-emerald-400" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Main panel */}
          <div className="min-h-[28rem]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTool}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <ToolRouter
                  tool={activeTool}
                  extensions={extensions}
                  events={events}
                  graphStats={graphStats}
                  connectors={connectors}
                  aiStats={aiStats}
                  onRefreshExtensions={fetchExtensions}
                  onRefreshHealth={fetchHealth}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-3">
        <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Sixteen tools, one kernel.</span>{" "}
          Live data streams from the event bus every 2–3s. Validate manifests before
          submitting — Oryx reviews every extension before it reaches the store.
        </p>
      </div>
    </div>
  );
}

export default DeveloperConsole;

// ===========================================================================
// Tool router
// ===========================================================================

function ToolRouter({
  tool,
  extensions,
  events,
  graphStats,
  connectors,
  aiStats,
  onRefreshExtensions,
  onRefreshHealth,
}: {
  tool: ToolId;
  extensions: ExtensionInstance[];
  events: KernelEvent[];
  graphStats: GraphStats | null;
  connectors: ConnectorHealth[];
  aiStats: AIStats | null;
  onRefreshExtensions: () => Promise<void>;
  onRefreshHealth: () => Promise<void>;
}) {
  switch (tool) {
    case "extensions":
      return (
        <ExtensionsTool
          extensions={extensions}
          events={events}
          onRefresh={onRefreshExtensions}
        />
      );
    case "connector-sim":
      return <ConnectorSimulatorTool connectors={connectors} onRefresh={onRefreshHealth} />;
    case "ride-sim":
      return <RideSimulatorTool events={events} />;
    case "sandbox":
      return <SandboxTool />;
    case "events":
      return <EventInspectorTool events={events} />;
    case "sagas":
      return <WorkflowDebuggerTool />;
    case "graph":
      return <GraphInspectorTool stats={graphStats} />;
    case "ai-trace":
      return <AITraceViewerTool aiStats={aiStats} />;
    case "replay":
      return <OptimizationReplayTool />;
    case "package":
      return <PackageBuilderTool />;
    case "submission":
      return <SubmissionTool extensions={extensions} />;
    case "sdk":
      return <SDKBrowserTool />;
    case "oauth":
      return <OAuthManagerTool />;
    case "webhooks":
      return <WebhookManagerTool />;
    case "monitoring":
      return <MonitoringTool />;
    case "docs":
      return <DocumentationTool />;
    default:
      return null;
  }
}

// ===========================================================================
// Tool 1 — Extensions
// ===========================================================================

function ExtensionsTool({
  extensions,
  events,
  onRefresh,
}: {
  extensions: ExtensionInstance[];
  events: KernelEvent[];
  onRefresh: () => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"manifest" | "logs" | "events">("manifest");
  const [logs, setLogs] = useState<ExtensionLog[]>([]);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<ExtensionManifest>(EMPTY_MANIFEST);
  const [validateErrors, setValidateErrors] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [eventFilter, setEventFilter] = useState("");

  useEffect(() => {
    if (extensions.length > 0 && !selectedId) setSelectedId(extensions[0].manifest.id);
  }, [extensions, selectedId]);

  const fetchLogs = useCallback(async () => {
    if (!selectedId) return;
    try {
      const res = await fetch(`/api/kernel/dev-console?extId=${selectedId}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setLogs(data.logs || []);
    } catch {
      // ignore
    }
  }, [selectedId]);

  useEffect(() => {
    fetchLogs();
    const id = setInterval(fetchLogs, 2000);
    return () => clearInterval(id);
  }, [fetchLogs]);

  const selected = extensions.find((e) => e.manifest.id === selectedId);

  const hotReload = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch("/api/kernel/dev-console", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "hotReload", manifest: selected.manifest }),
      });
      if (!res.ok) throw new Error();
      toast.success("Hot-reloaded", { description: `${selected.manifest.name} v${selected.manifest.version}` });
      await onRefresh();
      await fetchLogs();
    } catch {
      toast.error("Hot-reload failed");
    } finally {
      setBusy(false);
    }
  };

  const validate = async (mf: ExtensionManifest) => {
    setBusy(true);
    try {
      const res = await fetch("/api/kernel/dev-console", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "validate", manifest: mf }),
      });
      const data = await res.json();
      setValidateErrors(data.errors || []);
      if (data.ok) toast.success("Manifest valid");
      else toast.error("Validation failed", { description: `${data.errors.length} error(s)` });
    } catch {
      toast.error("Validation request failed");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (mf: ExtensionManifest) => {
    setBusy(true);
    try {
      const res = await fetch("/api/kernel/dev-console", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit", manifest: mf }),
      });
      if (!res.ok) throw new Error();
      toast.success("Submitted for review");
      await onRefresh();
    } catch {
      toast.error("Submit failed");
    } finally {
      setBusy(false);
    }
  };

  const createExtension = async () => {
    if (!draft.id || !draft.name) {
      toast.error("id + name required");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/kernel/dev-console", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", ...draft }),
      });
      if (!res.ok) throw new Error();
      toast.success("Extension created", { description: `${draft.name} v${draft.version}` });
      setCreating(false);
      setDraft(EMPTY_MANIFEST);
      await onRefresh();
    } catch {
      toast.error("Create failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <ToolHeader
        icon={Boxes}
        title="Extensions"
        subtitle="Installed and in-development extensions. Hot-reload, validate, and submit."
        action={
          <button
            onClick={() => setCreating((c) => !c)}
            className="flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-1 font-mono text-[10px] font-bold text-emerald-400 transition hover:bg-emerald-500/30"
          >
            <Plus className="h-3 w-3" /> New
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-[180px_1fr]">
        {/* Extension list */}
        <div>
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Installed ({extensions.length})
          </div>
          <div className="scroll-thin max-h-72 space-y-1 overflow-y-auto md:max-h-[28rem]">
            {extensions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 px-2 py-4 text-center text-[10px] text-muted-foreground">
                No extensions. Tap + New.
              </div>
            ) : (
              extensions.map((e) => {
                const active = e.manifest.id === selectedId;
                return (
                  <button
                    key={e.manifest.id}
                    onClick={() => {
                      setSelectedId(e.manifest.id);
                      setTab("manifest");
                      setValidateErrors(null);
                      setCreating(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition ${
                      active ? "bg-foreground/[0.08]" : "hover:bg-foreground/[0.04]"
                    }`}
                  >
                    <span className="text-base leading-none">{e.manifest.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono text-[11px] font-semibold text-foreground">
                        {e.manifest.name}
                      </div>
                      <div className="font-mono text-[9px] text-muted-foreground">
                        v{e.manifest.version} · {e.status}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Detail */}
        <div>
          <AnimatePresence mode="wait">
            {creating ? (
              <motion.div
                key="create"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <ManifestEditor
                  draft={draft}
                  setDraft={setDraft}
                  editing={true}
                  busy={busy}
                  validateErrors={validateErrors}
                  onValidate={() => validate(draft)}
                  onSubmit={createExtension}
                  submitLabel="Create extension"
                  onCancel={() => setCreating(false)}
                />
              </motion.div>
            ) : !selected ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-72 flex-col items-center justify-center text-center"
              >
                <FileCode className="mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">No extension selected.</p>
              </motion.div>
            ) : (
              <motion.div
                key={selected.manifest.id + tab}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
              >
                {/* Tabs */}
                <div className="mb-3 flex items-center gap-0.5 border-b border-border/40 pb-1">
                  {(
                    [
                      { id: "manifest", label: "Manifest", icon: FileCode },
                      { id: "logs", label: "Logs", icon: Terminal },
                      { id: "events", label: "Events", icon: Radio },
                    ] as const
                  ).map((t) => {
                    const active = tab === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                          active ? "bg-foreground/[0.08] text-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <t.icon className="h-3 w-3" />
                        {t.label}
                        {t.id === "logs" && logs.length > 0 && (
                          <span className="rounded-full bg-foreground/10 px-1 text-[9px] tabular-nums">
                            {logs.length}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  <button
                    onClick={hotReload}
                    disabled={busy}
                    className="ml-auto flex items-center gap-1 rounded-md bg-cyan-500/15 px-2 py-1 font-mono text-[10px] font-bold text-cyan-400 transition hover:bg-cyan-500/25 disabled:opacity-50"
                  >
                    <RefreshCw className="h-2.5 w-2.5" /> Hot-reload
                  </button>
                </div>

                {tab === "manifest" && (
                  <ManifestEditor
                    draft={draft}
                    setDraft={setDraft}
                    editing={draft.id === selected.manifest.id}
                    ext={selected}
                    busy={busy}
                    validateErrors={validateErrors}
                    onValidate={() =>
                      validate(draft.id === selected.manifest.id ? draft : selected.manifest)
                    }
                    onSubmit={() =>
                      submit(draft.id === selected.manifest.id ? draft : selected.manifest)
                    }
                    submitLabel="Submit to Store"
                  />
                )}

                {tab === "logs" && <LogsPanel logs={logs} />}

                {tab === "events" && (
                  <EventListCompact
                    events={events.filter(
                      (e) =>
                        !eventFilter ||
                        e.type.toLowerCase().includes(eventFilter.toLowerCase()) ||
                        e.aggregateId.toLowerCase().includes(eventFilter.toLowerCase())
                    )}
                    filter={eventFilter}
                    setFilter={setEventFilter}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ManifestEditor({
  draft,
  setDraft,
  editing,
  ext,
  busy,
  validateErrors,
  onValidate,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  draft: ExtensionManifest;
  setDraft: (m: ExtensionManifest) => void;
  editing: boolean;
  ext?: ExtensionInstance;
  busy: boolean;
  validateErrors: string[] | null;
  onValidate: () => void;
  onSubmit: () => void;
  submitLabel: string;
  onCancel?: () => void;
}) {
  const m = editing ? draft : ext?.manifest ?? draft;
  const set = (patch: Partial<ExtensionManifest>) => {
    if (!editing && ext) setDraft({ ...ext.manifest, ...patch });
    else setDraft({ ...draft, ...patch });
  };
  const togglePerm = (p: ExtensionPermission) =>
    set({
      permissions: m.permissions.includes(p)
        ? m.permissions.filter((x) => x !== p)
        : [...m.permissions, p],
    });
  const toggleHook = (h: ExtensionHook) =>
    set({
      hooks: m.hooks.includes(h) ? m.hooks.filter((x) => x !== h) : [...m.hooks, h],
    });

  return (
    <div className="space-y-2.5">
      {/* Header */}
      {ext && (
        <div className="mb-2 flex items-start gap-3 rounded-xl border border-border/50 bg-foreground/[0.02] p-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg"
            style={{ backgroundColor: `${m.color}20` }}
          >
            {m.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-bold text-foreground">
                {m.name || "(unnamed)"}
              </span>
              <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-muted-foreground">
                v{m.version}
              </span>
              <span className="rounded-full bg-cyan-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-cyan-400">
                {ext.status}
              </span>
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
              id: {m.id} · by {m.developer || "—"} · {ext.eventsProcessed} events
            </div>
            {ext.lastError && (
              <div className="mt-1 font-mono text-[10px] text-rose-400">
                last error: {ext.lastError}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Field label="id">
          <input
            value={m.id}
            onChange={(e) => set({ id: e.target.value })}
            onFocus={() => ext && !editing && setDraft({ ...ext.manifest })}
            className="font-mono text-xs"
          />
        </Field>
        <Field label="version">
          <input
            value={m.version}
            onChange={(e) => set({ version: e.target.value })}
            className="font-mono text-xs"
          />
        </Field>
      </div>
      <Field label="name">
        <input value={m.name} onChange={(e) => set({ name: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="developer">
          <input
            value={m.developer}
            onChange={(e) => set({ developer: e.target.value })}
            className="font-mono text-xs"
          />
        </Field>
        <Field label="category">
          <input
            value={m.category}
            onChange={(e) => set({ category: e.target.value })}
            className="font-mono text-xs"
          />
        </Field>
      </div>
      <Field label="description">
        <textarea
          value={m.description}
          onChange={(e) => set({ description: e.target.value })}
          rows={2}
          className="resize-none"
        />
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label="emoji">
          <input
            value={m.emoji}
            onChange={(e) => set({ emoji: e.target.value })}
            className="text-center text-base"
          />
        </Field>
        <Field label="color">
          <input
            value={m.color}
            onChange={(e) => set({ color: e.target.value })}
            className="font-mono text-xs"
          />
        </Field>
        <Field label="entrypoint">
          <input
            value={m.entrypoint}
            onChange={(e) => set({ entrypoint: e.target.value })}
            className="font-mono text-xs"
          />
        </Field>
      </div>

      <MultiSelect
        label="permissions"
        options={PERMISSIONS}
        selected={m.permissions}
        onToggle={togglePerm}
      />
      <MultiSelect
        label="lifecycle hooks"
        options={HOOKS}
        selected={m.hooks}
        onToggle={toggleHook}
      />

      {validateErrors !== null && (
        <div
          className={`rounded-xl border p-2.5 text-[11px] ${
            validateErrors.length === 0
              ? "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-300"
              : "border-rose-500/30 bg-rose-500/[0.06] text-rose-300"
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold">
            {validateErrors.length === 0 ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" /> Manifest valid
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5" /> {validateErrors.length} error(s)
              </>
            )}
          </div>
          {validateErrors.length > 0 && (
            <ul className="mt-1 list-inside list-disc space-y-0.5 font-mono text-[10px]">
              {validateErrors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-border/60 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-foreground/[0.04]"
          >
            Cancel
          </button>
        )}
        <button
          onClick={onValidate}
          disabled={busy}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 py-2 text-xs font-bold text-cyan-400 transition hover:bg-cyan-500/20 disabled:opacity-50"
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> Validate
        </button>
        <button
          onClick={onSubmit}
          disabled={busy}
          className="flex flex-[2] items-center justify-center gap-1.5 rounded-lg bg-violet-500 py-2 text-xs font-bold text-white transition hover:bg-violet-400 disabled:opacity-50"
        >
          {busy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

function LogsPanel({ logs }: { logs: ExtensionLog[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 px-3 py-8 text-center">
        <Terminal className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground">No logs yet. Hot-reload or simulate an event.</p>
      </div>
    );
  }
  return (
    <div
      ref={scrollRef}
      className="scroll-thin max-h-96 overflow-y-auto rounded-xl border border-border/40 bg-[oklch(0.10_0.005_200)] p-2 font-mono"
    >
      {logs.map((l) => {
        const meta = LOG_COLORS[l.level] ?? LOG_COLORS.info;
        const LIcon = meta.icon;
        return (
          <div key={l.id} className="flex items-start gap-2 px-1 py-0.5 text-[11px] leading-snug">
            <span className="shrink-0 tabular-nums text-muted-foreground/60">
              {tsClock(l.timestamp)}
            </span>
            <LIcon className={`mt-0.5 h-3 w-3 shrink-0 ${meta.text}`} />
            <span className={`shrink-0 font-bold uppercase ${meta.text}`}>{l.level}</span>
            <span className="flex-1 break-words text-foreground/90">{l.message}</span>
          </div>
        );
      })}
    </div>
  );
}

function EventListCompact({
  events,
  filter,
  setFilter,
}: {
  events: KernelEvent[];
  filter: string;
  setFilter: (s: string) => void;
}) {
  return (
    <div>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter by event type or aggregate id…"
        className="mb-2 w-full rounded-lg border border-border/60 bg-background px-3 py-1.5 font-mono text-[11px] text-foreground placeholder:text-muted-foreground focus:border-cyan-500/50 focus:outline-none"
      />
      <div className="scroll-thin max-h-96 space-y-1 overflow-y-auto rounded-xl border border-border/40 bg-[oklch(0.10_0.005_200)] p-2 font-mono">
        {events.length === 0 ? (
          <div className="px-2 py-6 text-center text-[11px] text-muted-foreground">
            No events match.
          </div>
        ) : (
          events.map((e) => (
            <div
              key={e.id}
              className="flex items-start gap-2 rounded-md px-1.5 py-1 text-[10px] leading-snug hover:bg-foreground/[0.04]"
            >
              <span className="shrink-0 tabular-nums text-muted-foreground/60">
                {tsClock(e.timestamp)}
              </span>
              <span className={`shrink-0 font-bold ${eventColor(e.type)}`}>{e.type}</span>
              <span className="flex-1 break-words text-muted-foreground">
                agg: <span className="text-foreground/80">{e.aggregateId}</span>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ===========================================================================
// Tool 2 — Connector Simulator
// ===========================================================================

function ConnectorSimulatorTool({
  connectors,
  onRefresh,
}: {
  connectors: ConnectorHealth[];
  onRefresh: () => Promise<void>;
}) {
  const [connectorId, setConnectorId] = useState("");
  const [eventType, setEventType] = useState("update");
  const [payloadText, setPayloadText] = useState('{\n  "segment": "ring-rd",\n  "speed": 24\n}');
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState<KernelEvent[]>([]);

  useEffect(() => {
    if (!connectorId && connectors.length > 0) setConnectorId(connectors[0].id);
  }, [connectors, connectorId]);

  // poll recent connector events
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch("/api/kernel/events?limit=40", { cache: "no-store" });
        if (!res.ok) return;
        const evts: KernelEvent[] = await res.json();
        if (cancelled) return;
        setRecent(
          evts
            .filter((e) => e.type.startsWith("connector"))
            .slice(0, 12)
        );
      } catch {
        // ignore
      }
    };
    poll();
    const id = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const publish = async () => {
    const parsed = safeJsonParse(payloadText);
    if (!parsed.ok) {
      toast.error("Invalid JSON payload", { description: parsed.error });
      return;
    }
    if (!connectorId) {
      toast.error("Pick a connector");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/kernel/webhook/${connectorId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: eventType, ...((parsed.value as object) || {}) }),
      });
      if (!res.ok) throw new Error();
      toast.success("Event published", {
        description: `${connectorId} · connector event ingested`,
      });
      await onRefresh();
    } catch {
      toast.error("Publish failed");
    } finally {
      setBusy(false);
    }
  };

  const selectedConnector = connectors.find((c) => c.id === connectorId);

  return (
    <div>
      <ToolHeader
        icon={Plug}
        title="Connector Simulator"
        subtitle="Push events into the kernel as if from an external connector webhook."
      />
      <div className="space-y-3 p-3">
        <div className="rounded-xl border border-border/50 bg-card/40 p-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Field label="connector">
              <select
                value={connectorId}
                onChange={(e) => setConnectorId(e.target.value)}
                className="font-mono text-xs"
              >
                {connectors.length === 0 && <option value="">no connectors</option>}
                {connectors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.id})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="event type">
              <input
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="font-mono text-xs"
                placeholder="update"
              />
            </Field>
          </div>
          {selectedConnector && (
            <div className="mt-2 font-mono text-[10px] text-muted-foreground">
              category: <span className="text-cyan-400">{selectedConnector.category}</span> · signals:{" "}
              {selectedConnector.signals.join(", ")} · published as{" "}
              <span className="text-emerald-400">
                connector.{selectedConnector.category}.webhook
              </span>
            </div>
          )}
          <div className="mt-2">
            <Field label="payload (JSON)">
              <textarea
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                rows={5}
                className="resize-none font-mono text-[11px]"
              />
            </Field>
          </div>
          <div className="mt-2 flex justify-end">
            <button
              onClick={publish}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-cyan-950 transition hover:bg-cyan-400 disabled:opacity-50"
            >
              {busy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Publish event
            </button>
          </div>
        </div>

        <div>
          <SectionLabel icon={Radio} label="Recent connector events" />
          <div className="scroll-thin max-h-64 space-y-1 overflow-y-auto rounded-xl border border-border/40 bg-[oklch(0.10_0.005_200)] p-2 font-mono">
            {recent.length === 0 ? (
              <div className="px-2 py-6 text-center text-[11px] text-muted-foreground">
                No connector events yet.
              </div>
            ) : (
              recent.map((e) => (
                <div
                  key={e.id}
                  className="flex items-start gap-2 rounded-md px-1.5 py-1 text-[10px] leading-snug hover:bg-foreground/[0.04]"
                >
                  <span className="shrink-0 tabular-nums text-muted-foreground/60">
                    {tsClock(e.timestamp)}
                  </span>
                  <span className={`shrink-0 font-bold ${eventColor(e.type)}`}>{e.type}</span>
                  <span className="flex-1 break-words text-muted-foreground">
                    {Object.entries(e.payload)
                      .slice(0, 3)
                      .map(([k, v]) => `${k}=${typeof v === "object" ? "…" : String(v)}`)
                      .join(" ")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// Tool 3 — Ride Simulator
// ===========================================================================

function RideSimulatorTool({ events }: { events: KernelEvent[] }) {
  const [form, setForm] = useState({
    origin: "East Legon",
    destination: "Kotoka Airport",
    price: 14.5,
    provider: "uber",
  });
  const [busy, setBusy] = useState(false);
  const [chain, setChain] = useState<KernelEvent[]>([]);

  const STEPS = [
    { id: "ride.simulated", label: "Create intent", icon: Plus },
    { id: "intent.created", label: "Optimize", icon: Sparkles },
    { id: "auction.", label: "Auction", icon: Hammer },
    { id: "ride.booked", label: "Book", icon: CheckCircle2 },
  ];

  const publish = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/kernel/dev-console", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "simulateRide", ...form }),
      });
      if (!res.ok) throw new Error();
      toast.success("Ride simulated", {
        description: `${form.origin} → ${form.destination}`,
      });
      // capture the most recent ride-related events
      setTimeout(async () => {
        try {
          const r = await fetch("/api/kernel/events?limit=60", { cache: "no-store" });
          const evts: KernelEvent[] = await r.json();
          setChain(
            evts
              .filter(
                (e) =>
                  e.type.startsWith("ride") ||
                  e.type.startsWith("intent") ||
                  e.type.startsWith("auction")
              )
              .slice(0, 14)
          );
        } catch {
          // ignore
        }
      }, 400);
    } catch {
      toast.error("Simulation failed");
    } finally {
      setBusy(false);
    }
  };

  // also live-update chain from parent events
  useEffect(() => {
    if (chain.length === 0) return;
    const updated = events
      .filter(
        (e) =>
          e.type.startsWith("ride") ||
          e.type.startsWith("intent") ||
          e.type.startsWith("auction")
      )
      .slice(0, 14);
    if (updated.length > chain.length) setChain(updated);
  }, [events, chain.length]);

  return (
    <div>
      <ToolHeader
        icon={Car}
        title="Ride Simulator"
        subtitle="Trigger a complete ride flow: create intent → optimize → auction → book. Watch the event chain in real-time."
      />
      <div className="space-y-3 p-3">
        <div className="rounded-xl border border-border/50 bg-card/40 p-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Field label="origin">
              <input
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value })}
                className="text-xs"
              />
            </Field>
            <Field label="destination">
              <input
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                className="text-xs"
              />
            </Field>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Field label="price (GH₵)">
              <input
                type="number"
                step="0.5"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="font-mono text-xs tabular-nums"
              />
            </Field>
            <Field label="provider">
              <select
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
                className="font-mono text-xs"
              >
                <option value="uber">Uber</option>
                <option value="bolt">Bolt</option>
                <option value="yango">Yango</option>
                <option value="citycab">CityCab</option>
              </select>
            </Field>
          </div>
          <div className="mt-2 flex justify-end">
            <button
              onClick={publish}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-emerald-950 transition hover:bg-emerald-400 disabled:opacity-50"
            >
              {busy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              Simulate ride
            </button>
          </div>
        </div>

        {/* Flow steps */}
        <div>
          <SectionLabel icon={GitBranch} label="Flow chain" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STEPS.map((step, i) => {
              const fired = chain.some((e) => e.type.startsWith(step.id.replace("ride.booked", "ride.booked")));
              return (
                <div
                  key={i}
                  className={`rounded-lg border p-2 transition ${
                    fired
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-border/50 bg-foreground/[0.02]"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <step.icon
                      className={`h-3.5 w-3.5 ${fired ? "text-emerald-400" : "text-muted-foreground/50"}`}
                    />
                    <span className="font-mono text-[10px] font-bold uppercase text-muted-foreground">
                      Step {i + 1}
                    </span>
                    {fired && <CheckCircle2 className="ml-auto h-3 w-3 text-emerald-400" />}
                  </div>
                  <div className="mt-1 text-xs font-bold text-foreground">{step.label}</div>
                  <div className="font-mono text-[9px] text-muted-foreground">{step.id}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Event chain */}
        <div>
          <SectionLabel icon={Radio} label="Event chain" />
          <div className="scroll-thin max-h-64 space-y-1 overflow-y-auto rounded-xl border border-border/40 bg-[oklch(0.10_0.005_200)] p-2 font-mono">
            {chain.length === 0 ? (
              <div className="px-2 py-6 text-center text-[11px] text-muted-foreground">
                Simulate a ride to see the event chain.
              </div>
            ) : (
              chain.map((e) => (
                <div
                  key={e.id}
                  className="flex items-start gap-2 rounded-md px-1.5 py-1 text-[10px] leading-snug hover:bg-foreground/[0.04]"
                >
                  <span className="shrink-0 tabular-nums text-muted-foreground/60">
                    {tsClock(e.timestamp)}
                  </span>
                  <span className={`shrink-0 font-bold ${eventColor(e.type)}`}>{e.type}</span>
                  <span className="flex-1 break-words text-muted-foreground">
                    {Object.entries(e.payload)
                      .slice(0, 2)
                      .map(([k, v]) => `${k}=${typeof v === "object" ? "…" : String(v)}`)
                      .join(" ")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// Tool 4 — Event Inspector
// ===========================================================================

function EventInspectorTool({ events }: { events: KernelEvent[] }) {
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!filter) return events;
    const f = filter.toLowerCase();
    return events.filter(
      (e) =>
        e.type.toLowerCase().includes(f) ||
        e.aggregateId.toLowerCase().includes(f) ||
        e.correlationId.toLowerCase().includes(f)
    );
  }, [events, filter]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      <ToolHeader
        icon={Radio}
        title="Event Inspector"
        subtitle="Live feed of kernel events. Auto-refreshes every 2s. Color-coded by type prefix."
      />
      <div className="p-3">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by type, aggregateId, or correlationId…"
          className="mb-2 w-full rounded-lg border border-border/60 bg-background px-3 py-1.5 font-mono text-[11px] text-foreground placeholder:text-muted-foreground focus:border-cyan-500/50 focus:outline-none"
        />
        <div className="scroll-thin max-h-[28rem] space-y-1 overflow-y-auto rounded-xl border border-border/40 bg-[oklch(0.10_0.005_200)] p-2 font-mono">
          {filtered.length === 0 ? (
            <div className="px-2 py-8 text-center text-[11px] text-muted-foreground">
              No events match.
            </div>
          ) : (
            filtered.map((e) => {
              const isOpen = expanded.has(e.id);
              return (
                <div
                  key={e.id}
                  className="rounded-md border border-transparent transition hover:border-border/40 hover:bg-foreground/[0.03]"
                >
                  <button
                    onClick={() => toggle(e.id)}
                    className="flex w-full items-start gap-2 px-1.5 py-1 text-left text-[10px] leading-snug"
                  >
                    <span className="shrink-0 tabular-nums text-muted-foreground/60">
                      {tsClock(e.timestamp)}
                    </span>
                    <span className={`shrink-0 font-bold ${eventColor(e.type)}`}>{e.type}</span>
                    <span className="flex-1 break-words text-muted-foreground">
                      agg: <span className="text-foreground/80">{e.aggregateId}</span>
                      {e.correlationId && (
                        <>
                          {" · "}
                          corr: <span className="text-foreground/60">{e.correlationId.slice(0, 16)}</span>
                        </>
                      )}
                    </span>
                    <ChevronRight
                      className={`h-3 w-3 shrink-0 text-muted-foreground transition ${
                        isOpen ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <pre className="mx-1 mb-1 max-h-48 overflow-auto rounded-md bg-background/50 p-2 text-[10px] leading-snug text-emerald-200/90">
                          {prettyJson(e.payload)}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
        <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
          <span>{filtered.length} shown · {events.length} total</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            auto-refresh 2s
          </span>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// Tool 5 — Workflow Debugger (sagas)
// ===========================================================================

function WorkflowDebuggerTool() {
  const [sagas, setSagas] = useState<SagaInstance[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch("/api/kernel/sagas", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const all: SagaInstance[] = data.active || [];
        setSagas(all);
        if (all.length > 0 && !selectedId) setSelectedId(all[0].id);
      } catch {
        // ignore
      }
    };
    poll();
    const id = setInterval(poll, 2500);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [selectedId]);

  const selected = sagas.find((s) => s.id === selectedId);

  return (
    <div>
      <ToolHeader
        icon={GitBranch}
        title="Workflow Debugger"
        subtitle="Visual saga debugger. Active long-running workflows with steps, state, and compensation."
      />
      <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-[200px_1fr]">
        <div>
          <SectionLabel icon={GitBranch} label={`Active sagas (${sagas.length})`} />
          <div className="scroll-thin max-h-96 space-y-1 overflow-y-auto">
            {sagas.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 px-2 py-6 text-center text-[10px] text-muted-foreground">
                No active sagas.
              </div>
            ) : (
              sagas.map((s) => {
                const active = s.id === selectedId;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    className={`w-full rounded-md px-2 py-1.5 text-left transition ${
                      active ? "bg-foreground/[0.08]" : "hover:bg-foreground/[0.04]"
                    }`}
                  >
                    <div className="truncate font-mono text-[11px] font-semibold text-foreground">
                      {s.type}
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[9px]">
                      <span className={statusColor(s.state)}>● {s.state}</span>
                      <span className="text-muted-foreground">step {s.currentStep + 1}/{s.steps.length}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
        <div>
          {!selected ? (
            <EmptyState icon={GitBranch} message="Select a saga to inspect its steps." />
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-border/50 bg-foreground/[0.02] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-foreground">{selected.type}</span>
                  <span className={`rounded-full bg-foreground/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${statusColor(selected.state)}`}>
                    {selected.state}
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                    {timeAgo(selected.startedAt)} · {selected.id.slice(0, 18)}
                  </span>
                </div>
                {selected.error && (
                  <div className="mt-1 font-mono text-[10px] text-rose-400">error: {selected.error}</div>
                )}
              </div>

              {/* Steps */}
              <div>
                <SectionLabel icon={GitBranch} label="Steps" />
                <div className="space-y-1.5">
                  {selected.steps.map((step, i) => {
                    const done = i < selected.currentStep;
                    const current = i === selected.currentStep && selected.state === "running";
                    const compensating = i === selected.currentStep && selected.state === "compensating";
                    return (
                      <div
                        key={i}
                        className={`flex items-start gap-2 rounded-lg border p-2 transition ${
                          done
                            ? "border-emerald-500/30 bg-emerald-500/[0.05]"
                            : current
                            ? "border-amber-500/40 bg-amber-500/[0.06]"
                            : compensating
                            ? "border-rose-500/40 bg-rose-500/[0.06]"
                            : "border-border/50 bg-foreground/[0.02]"
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                            done
                              ? "bg-emerald-500 text-emerald-950"
                              : current
                              ? "bg-amber-500 text-amber-950"
                              : compensating
                              ? "bg-rose-500 text-white"
                              : "bg-foreground/10 text-muted-foreground"
                          }`}
                        >
                          {done ? "✓" : i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-mono text-[11px] font-semibold text-foreground">
                            {step.name}
                          </div>
                          <div className="font-mono text-[9px] text-muted-foreground">
                            on success: <span className="text-cyan-400">{step.onSuccess}</span>
                            {step.timeoutMs && ` · timeout ${step.timeoutMs}ms`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selected.completedEvents.length > 0 && (
                <div>
                  <SectionLabel icon={CheckCircle2} label="Completed events" />
                  <div className="flex flex-wrap gap-1.5">
                    {selected.completedEvents.map((e, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300"
                      >
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// Tool 6 — Graph Inspector
// ===========================================================================

function GraphInspectorTool({ stats }: { stats: GraphStats | null }) {
  const [data, setData] = useState<GraphInspectResult | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      const d = await fetchJson<GraphInspectResult>("/api/kernel/enterprise/inspect?tool=graph");
      if (cancelled || !d) return;
      setData(d);
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const byTypeEntries = useMemo(() => {
    const source = data?.stats.byType ?? stats?.byType ?? {};
    return Object.entries(source).sort((a, b) => b[1] - a[1]);
  }, [data, stats]);

  const totalNodes = data?.stats.totalNodes ?? stats?.totalNodes ?? 0;
  const totalEdges = data?.stats.totalEdges ?? stats?.totalEdges ?? 0;
  const maxType = byTypeEntries[0]?.[1] ?? 1;

  const allNodes = useMemo(() => {
    if (!data) return [];
    return [...data.nodes, ...data.neighborhoods, ...data.routes].slice(0, 30);
  }, [data]);

  return (
    <div>
      <ToolHeader
        icon={Network}
        title="Graph Inspector"
        subtitle="Visualize the mobility knowledge graph. Click a node to see its neighbors."
      />
      <div className="space-y-3 p-3">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Total nodes" value={totalNodes} color="text-violet-400" />
          <StatCard label="Total edges" value={totalEdges} color="text-cyan-400" />
          <StatCard label="Node types" value={byTypeEntries.length} color="text-emerald-400" />
        </div>

        {/* By-type bars */}
        <div>
          <SectionLabel icon={Share2} label="Nodes by type" />
          <div className="space-y-1.5 rounded-xl border border-border/40 bg-foreground/[0.02] p-3">
            {byTypeEntries.length === 0 ? (
              <div className="py-4 text-center text-[11px] text-muted-foreground">
                No graph data.
              </div>
            ) : (
              byTypeEntries.map(([type, count]) => (
                <div key={type} className="flex items-center gap-2">
                  <span className="w-24 shrink-0 font-mono text-[10px] text-muted-foreground">
                    {type}
                  </span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-foreground/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500/60 to-emerald-500/60"
                      style={{ width: `${(count / maxType) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right font-mono text-[10px] tabular-nums text-foreground">
                    {count}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sample nodes */}
        <div>
          <SectionLabel icon={Network} label="Sample nodes (click to inspect)" />
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {allNodes.length === 0 ? (
              <div className="col-span-full rounded-lg border border-dashed border-border/60 px-2 py-6 text-center text-[11px] text-muted-foreground">
                No nodes available.
              </div>
            ) : (
              allNodes.map((node) => {
                const active = selectedNode?.id === node.id;
                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNode(active ? null : node)}
                    className={`flex items-center gap-2 rounded-lg border p-2 text-left transition ${
                      active
                        ? "border-emerald-500/50 bg-emerald-500/10"
                        : "border-border/50 bg-foreground/[0.02] hover:bg-foreground/[0.05]"
                    }`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-violet-500/15 font-mono text-[9px] font-bold uppercase text-violet-400">
                      {node.type.slice(0, 3)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono text-[11px] font-semibold text-foreground">
                        {node.label}
                      </div>
                      <div className="font-mono text-[9px] text-muted-foreground">
                        {node.id.slice(0, 18)} · {Object.keys(node.edges).length} edges
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Selected node detail */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.05] p-3"
            >
              <div className="mb-2 flex items-center gap-2">
                <Network className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-mono text-[11px] font-bold text-emerald-300">
                  {selectedNode.label}
                </span>
                <span className="ml-auto rounded-full bg-violet-500/20 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-violet-300">
                  {selectedNode.type}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Edges
                  </div>
                  <div className="space-y-1">
                    {Object.entries(selectedNode.edges).length === 0 ? (
                      <div className="font-mono text-[10px] text-muted-foreground">
                        no outbound edges
                      </div>
                    ) : (
                      Object.entries(selectedNode.edges).map(([rel, targets]) => (
                        <div key={rel} className="font-mono text-[10px]">
                          <span className="text-cyan-400">{rel}</span>
                          <span className="text-muted-foreground"> → </span>
                          <span className="text-foreground">{targets.join(", ")}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Attributes
                  </div>
                  <pre className="scroll-thin max-h-32 overflow-auto rounded-md bg-background/50 p-2 font-mono text-[10px] text-emerald-200/90">
                    {prettyJson(selectedNode.attrs)}
                  </pre>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ===========================================================================
// Tool 7 — AI Trace Viewer
// ===========================================================================

function AITraceViewerTool({ aiStats }: { aiStats: AIStats | null }) {
  const [agents, setAgents] = useState<AIAgentSummary[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<AgentDecision[]>([]);
  const [loadingDecisions, setLoadingDecisions] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      const d = await fetchJson<AIAgentSummary[]>("/api/kernel/enterprise/inspect?tool=ai");
      if (cancelled || !d) return;
      setAgents(d);
      if (d.length > 0 && !selectedAgentId) setSelectedAgentId(d[0].agentId);
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [selectedAgentId]);

  useEffect(() => {
    if (!selectedAgentId) return;
    let cancelled = false;
    const poll = async () => {
      setLoadingDecisions(true);
      const d = await fetchJson<AgentDecision[]>(
        `/api/kernel/enterprise/inspect?tool=ai&agentId=${selectedAgentId}`
      );
      if (cancelled) return;
      if (d) setDecisions(d);
      setLoadingDecisions(false);
    };
    void poll();
    const id = setInterval(() => void poll(), 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [selectedAgentId]);

  const selectedAgent = agents.find((a) => a.agentId === selectedAgentId);

  return (
    <div>
      <ToolHeader
        icon={Brain}
        title="AI Trace Viewer"
        subtitle={`${aiStats?.totalAgents ?? "—"} agents with decision traces. Terminal-style reasoning steps.`}
      />
      <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-[200px_1fr]">
        {/* Agent list */}
        <div>
          <SectionLabel icon={Brain} label={`Agents (${agents.length})`} />
          <div className="scroll-thin max-h-96 space-y-1 overflow-y-auto">
            {agents.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 px-2 py-6 text-center text-[10px] text-muted-foreground">
                No agents.
              </div>
            ) : (
              agents.map((a) => {
                const active = a.agentId === selectedAgentId;
                return (
                  <button
                    key={a.agentId}
                    onClick={() => setSelectedAgentId(a.agentId)}
                    className={`w-full rounded-md px-2 py-1.5 text-left transition ${
                      active ? "bg-foreground/[0.08]" : "hover:bg-foreground/[0.04]"
                    }`}
                  >
                    <div className="truncate font-mono text-[11px] font-semibold text-foreground">
                      {a.name}
                    </div>
                    <div className="font-mono text-[9px] text-muted-foreground">
                      {a.agentId} · {a.recentDecisions.length} decisions
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Decision trace */}
        <div>
          {!selectedAgent ? (
            <EmptyState icon={Brain} message="Select an agent to view its decision trace." />
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-border/50 bg-foreground/[0.02] p-3">
                <div className="text-sm font-bold text-foreground">{selectedAgent.name}</div>
                <div className="font-mono text-[10px] text-muted-foreground">
                  {selectedAgent.agentId} · {decisions.length} total decisions
                </div>
              </div>

              <div>
                <SectionLabel icon={Terminal} label="Decision trace" />
                <div className="scroll-thin max-h-[26rem] space-y-2 overflow-y-auto rounded-xl border border-border/40 bg-[oklch(0.10_0.005_200)] p-3 font-mono">
                  {loadingDecisions && decisions.length === 0 ? (
                    <div className="py-6 text-center text-[11px] text-muted-foreground">
                      <RefreshCw className="mx-auto mb-2 h-4 w-4 animate-spin" />
                      Loading decisions…
                    </div>
                  ) : decisions.length === 0 ? (
                    <div className="py-6 text-center text-[11px] text-muted-foreground">
                      No decisions recorded yet.
                    </div>
                  ) : (
                    decisions.map((d) => (
                      <div key={d.id} className="rounded-lg border border-border/30 bg-foreground/[0.02] p-2">
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 shrink-0 text-amber-400">$</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                              <span className="font-bold text-cyan-300">{d.action}</span>
                              {d.outcome && (
                                <span
                                  className={`rounded px-1 text-[9px] uppercase ${
                                    d.outcome === "success"
                                      ? "bg-emerald-500/20 text-emerald-300"
                                      : d.outcome === "failure"
                                      ? "bg-rose-500/20 text-rose-300"
                                      : "bg-amber-500/20 text-amber-300"
                                  }`}
                                >
                                  {d.outcome}
                                </span>
                              )}
                              {d.confidence !== undefined && (
                                <span className="text-muted-foreground">
                                  conf {(d.confidence * 100).toFixed(0)}%
                                </span>
                              )}
                              <span className="ml-auto text-muted-foreground/60">
                                {tsClock(d.timestamp)}
                              </span>
                            </div>
                            <div className="mt-1 text-[10px] text-foreground/90">
                              <span className="text-muted-foreground">reasoning:</span> {d.reasoning}
                            </div>
                            {d.triggeredBy && (
                              <div className="mt-0.5 text-[9px] text-muted-foreground">
                                triggered by: <span className="text-violet-300">{d.triggeredBy}</span>
                              </div>
                            )}
                            {d.reasoningSteps && d.reasoningSteps.length > 0 && (
                              <div className="mt-1.5 space-y-0.5 border-l border-amber-500/30 pl-2 text-[10px]">
                                {d.reasoningSteps.map((step, i) => (
                                  <div key={i} className="text-amber-200/80">
                                    <span className="text-muted-foreground/60">[{i + 1}]</span> {step}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// Tool 8 — Optimization Replay
// ===========================================================================

function OptimizationReplayTool() {
  const [intents, setIntents] = useState<IntentLite[]>([]);
  const [selectedIntentId, setSelectedIntentId] = useState<string | null>(null);
  const [replay, setReplay] = useState<OptimizationReplay | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      const d = await fetchJson<IntentLite[]>("/api/kernel/intents?userId=demo");
      if (cancelled || !d) return;
      setIntents(d);
      if (d.length > 0 && !selectedIntentId) setSelectedIntentId(d[0].id);
    };
    poll();
    const id = setInterval(poll, 8000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [selectedIntentId]);

  useEffect(() => {
    if (!selectedIntentId) return;
    let cancelled = false;
    const poll = async () => {
      setLoading(true);
      const d = await fetchJson<OptimizationReplay>(
        `/api/kernel/enterprise/inspect?tool=replay&intentId=${selectedIntentId}`
      );
      if (cancelled) return;
      setReplay(d);
      setLoading(false);
    };
    void poll();
    const id = setInterval(() => void poll(), 6000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [selectedIntentId]);

  const costMax = useMemo(() => {
    const preds = replay?.costOverTime?.predictions ?? [];
    if (preds.length === 0) return 1;
    return Math.max(...preds.map((p) => p.cost), 1);
  }, [replay]);

  return (
    <div>
      <ToolHeader
        icon={Rewind}
        title="Optimization Replay"
        subtitle="Replay an intent's optimization history: suggestions, cost-over-time curve, and timeline."
      />
      <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-[200px_1fr]">
        <div>
          <SectionLabel icon={Rewind} label={`Intents (${intents.length})`} />
          <div className="scroll-thin max-h-96 space-y-1 overflow-y-auto">
            {intents.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 px-2 py-6 text-center text-[10px] text-muted-foreground">
                No intents.
              </div>
            ) : (
              intents.map((it) => {
                const active = it.id === selectedIntentId;
                return (
                  <button
                    key={it.id}
                    onClick={() => setSelectedIntentId(it.id)}
                    className={`w-full rounded-md px-2 py-1.5 text-left transition ${
                      active ? "bg-foreground/[0.08]" : "hover:bg-foreground/[0.04]"
                    }`}
                  >
                    <div className="truncate font-mono text-[11px] font-semibold text-foreground">
                      {it.type}
                    </div>
                    <div className="truncate font-mono text-[9px] text-muted-foreground">
                      {it.origin} → {it.destination}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
        <div>
          {!replay ? (
            <EmptyState
              icon={Rewind}
              message={loading ? "Loading replay…" : "Select an intent to replay its optimization."}
            />
          ) : (
            <div className="space-y-3">
              {/* Intent header */}
              <div className="rounded-xl border border-border/50 bg-foreground/[0.02] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold capitalize text-foreground">
                    {replay.intent.type}
                  </span>
                  <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-emerald-300">
                    {replay.intent.status ?? "—"}
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                    {replay.intent.id.slice(0, 18)}
                  </span>
                </div>
                <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                  {replay.intent.origin ?? "—"} → {replay.intent.destination ?? "—"}
                  {replay.intent.estimatedCost !== undefined && (
                    <> · baseline GH₵{replay.intent.estimatedCost.toFixed(2)}</>
                  )}
                </div>
              </div>

              {/* Cost curve */}
              {replay.costOverTime && (
                <div>
                  <SectionLabel icon={Activity} label="Cost over time (24h)" />
                  <div className="rounded-xl border border-border/40 bg-foreground/[0.02] p-3">
                    <div className="flex items-end gap-0.5">
                      {replay.costOverTime.predictions.map((p, i) => (
                        <div
                          key={i}
                          className="flex-1"
                          title={`${p.time} · GH₵${p.cost.toFixed(2)} · surge ${p.surge}x · ${p.demand}`}
                        >
                          <div
                            className={`w-full rounded-t-sm transition ${
                              p.demand === "high"
                                ? "bg-rose-500/70"
                                : p.demand === "medium"
                                ? "bg-amber-500/70"
                                : "bg-emerald-500/70"
                            }`}
                            style={{ height: `${(p.cost / costMax) * 80 + 8}px` }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center justify-between font-mono text-[9px] text-muted-foreground">
                      <span>baseline: GH₵{replay.costOverTime?.baseline.toFixed(2)}</span>
                      {replay.costOverTime.cheapestSlot && (
                        <span className="text-emerald-400">
                          cheapest: {replay.costOverTime.cheapestSlot.time} · save GH₵
                          {replay.costOverTime.cheapestSlot.saving.toFixed(2)}
                        </span>
                      )}
                      {replay.costOverTime.peakSlot && (
                        <span className="text-rose-400">
                          peak: {replay.costOverTime.peakSlot.time}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Suggestions */}
              <div>
                <SectionLabel icon={Sparkles} label={`Suggestions (${replay.suggestions.length})`} />
                <div className="space-y-1.5">
                  {replay.suggestions.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/60 px-2 py-4 text-center text-[11px] text-muted-foreground">
                      No suggestions generated.
                    </div>
                  ) : (
                    replay.suggestions.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-start gap-2 rounded-lg border border-border/50 bg-foreground/[0.02] p-2"
                      >
                        <span className="mt-0.5 rounded bg-violet-500/15 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-violet-300">
                          {s.kind}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-semibold text-foreground">{s.title}</div>
                          <div className="font-mono text-[9px] text-muted-foreground">
                            conf {(s.confidence * 100).toFixed(0)}%
                            {s.saving !== undefined && (
                              <> · save GH₵{s.saving.toFixed(2)}</>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <SectionLabel icon={History} label="Timeline" />
                <div className="space-y-1.5">
                  {replay.timeline.map((t) => (
                    <div
                      key={t.step}
                      className="flex items-start gap-2 rounded-lg border border-border/50 bg-foreground/[0.02] p-2"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 font-mono text-[10px] font-bold text-emerald-300">
                        {t.step}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-[11px] text-foreground">{t.action}</div>
                        {t.detail && (
                          <div className="font-mono text-[9px] text-muted-foreground">{t.detail}</div>
                        )}
                        {t.timestamp && (
                          <div className="font-mono text-[9px] text-muted-foreground/70">
                            {tsClock(t.timestamp)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// Tool 9 — Package Builder
// ===========================================================================

function PackageBuilderTool() {
  const [draft, setDraft] = useState<ExtensionManifest>(EMPTY_MANIFEST);
  const [busy, setBusy] = useState(false);
  const [validateErrors, setValidateErrors] = useState<string[] | null>(null);
  const [generatedDoc, setGeneratedDoc] = useState<GeneratedDoc | null>(null);
  const [showDoc, setShowDoc] = useState(false);

  const validate = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/kernel/dev-console", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "validate", manifest: draft }),
      });
      const data = await res.json();
      setValidateErrors(data.errors || []);
      if (data.ok) toast.success("Manifest valid");
      else toast.error("Validation failed", { description: `${data.errors.length} error(s)` });
    } catch {
      toast.error("Validation request failed");
    } finally {
      setBusy(false);
    }
  };

  const generateDocs = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/kernel/dev-console", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", ...draft }),
      });
      if (!res.ok) throw new Error();
      const docRes = await fetch(
        `/api/kernel/enterprise/docs?sdk=fleet-sdk`,
        { cache: "no-store" }
      ).catch(() => null);
      if (docRes && docRes.ok) {
        const doc = await docRes.json();
        setGeneratedDoc(doc);
        setShowDoc(true);
      }
      toast.success("Docs generated", { description: "Sample SDK docs rendered below." });
    } catch {
      toast.error("Doc generation failed");
    } finally {
      setBusy(false);
    }
  };

  const downloadPackage = () => {
    const pkg = {
      manifest: draft,
      packagedAt: new Date().toISOString(),
      kernelVersion: "1.0.0",
      checksum: `sha256:${Math.random().toString(36).slice(2, 18)}`,
    };
    const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${draft.id || "extension"}-${draft.version || "0.0.0"}.oryx.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Package downloaded", {
      description: `${a.download} (${(blob.size / 1024).toFixed(1)}KB)`,
    });
  };

  const submit = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/kernel/dev-console", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit", manifest: draft }),
      });
      if (!res.ok) throw new Error();
      toast.success("Submitted to store");
    } catch {
      toast.error("Submit failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <ToolHeader
        icon={Package}
        title="Package Builder"
        subtitle="Define a manifest, validate, generate docs, package as JSON, or submit to the store."
      />
      <div className="p-3">
        <div className="rounded-xl border border-border/50 bg-card/40 p-3">
          <ManifestFormCompact draft={draft} setDraft={setDraft} />
        </div>

        {validateErrors !== null && (
          <div
            className={`mt-3 rounded-xl border p-2.5 text-[11px] ${
              validateErrors.length === 0
                ? "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-300"
                : "border-rose-500/30 bg-rose-500/[0.06] text-rose-300"
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold">
              {validateErrors.length === 0 ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Manifest valid
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5" /> {validateErrors.length} error(s)
                </>
              )}
            </div>
            {validateErrors.length > 0 && (
              <ul className="mt-1 list-inside list-disc space-y-0.5 font-mono text-[10px]">
                {validateErrors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            onClick={validate}
            disabled={busy}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 py-2 text-[11px] font-bold text-cyan-400 transition hover:bg-cyan-500/20 disabled:opacity-50"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Validate
          </button>
          <button
            onClick={generateDocs}
            disabled={busy}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-500/10 py-2 text-[11px] font-bold text-violet-400 transition hover:bg-violet-500/20 disabled:opacity-50"
          >
            <FileText className="h-3.5 w-3.5" /> Docs
          </button>
          <button
            onClick={downloadPackage}
            disabled={busy}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 py-2 text-[11px] font-bold text-amber-400 transition hover:bg-amber-500/20 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" /> Package
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 py-2 text-[11px] font-bold text-emerald-950 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {busy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Submit
          </button>
        </div>

        <AnimatePresence>
          {showDoc && generatedDoc && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3"
            >
              <SectionLabel icon={FileText} label={`Generated docs — ${generatedDoc.title}`} />
              <pre className="scroll-thin max-h-72 overflow-auto rounded-xl border border-border/40 bg-[oklch(0.10_0.005_200)] p-3 font-mono text-[10px] leading-snug text-emerald-200/90">
                {generatedDoc.content}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ManifestFormCompact({
  draft,
  setDraft,
}: {
  draft: ExtensionManifest;
  setDraft: (m: ExtensionManifest) => void;
}) {
  const set = (patch: Partial<ExtensionManifest>) => setDraft({ ...draft, ...patch });
  const togglePerm = (p: ExtensionPermission) =>
    set({
      permissions: draft.permissions.includes(p)
        ? draft.permissions.filter((x) => x !== p)
        : [...draft.permissions, p],
    });
  const toggleHook = (h: ExtensionHook) =>
    set({
      hooks: draft.hooks.includes(h) ? draft.hooks.filter((x) => x !== h) : [...draft.hooks, h],
    });
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        <Field label="id">
          <input
            value={draft.id}
            onChange={(e) => set({ id: e.target.value })}
            placeholder="campus-pool"
            className="font-mono text-xs"
          />
        </Field>
        <Field label="version">
          <input
            value={draft.version}
            onChange={(e) => set({ version: e.target.value })}
            className="font-mono text-xs"
          />
        </Field>
      </div>
      <Field label="name">
        <input
          value={draft.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="Campus Pool"
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="developer">
          <input
            value={draft.developer}
            onChange={(e) => set({ developer: e.target.value })}
            placeholder="acme-mobility"
            className="font-mono text-xs"
          />
        </Field>
        <Field label="category">
          <input
            value={draft.category}
            onChange={(e) => set({ category: e.target.value })}
            placeholder="pooling"
            className="font-mono text-xs"
          />
        </Field>
      </div>
      <Field label="description">
        <textarea
          value={draft.description}
          onChange={(e) => set({ description: e.target.value })}
          rows={2}
          className="resize-none"
        />
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label="emoji">
          <input
            value={draft.emoji}
            onChange={(e) => set({ emoji: e.target.value })}
            className="text-center text-base"
          />
        </Field>
        <Field label="color">
          <input
            value={draft.color}
            onChange={(e) => set({ color: e.target.value })}
            className="font-mono text-xs"
          />
        </Field>
        <Field label="entrypoint">
          <input
            value={draft.entrypoint}
            onChange={(e) => set({ entrypoint: e.target.value })}
            className="font-mono text-xs"
          />
        </Field>
      </div>
      <MultiSelect
        label="permissions"
        options={PERMISSIONS}
        selected={draft.permissions}
        onToggle={togglePerm}
      />
      <MultiSelect
        label="lifecycle hooks"
        options={HOOKS}
        selected={draft.hooks}
        onToggle={toggleHook}
      />
    </div>
  );
}

// ===========================================================================
// Tool 10 — Submission Workflow
// ===========================================================================

function SubmissionTool({ extensions }: { extensions: ExtensionInstance[] }) {
  const [requirements, setRequirements] = useState<CertificationRequirement[]>([]);
  const [results, setResults] = useState<Record<string, CertificationResult>>({});
  const [versions, setVersions] = useState<Record<string, ExtensionVersion[]>>({});
  const [busy, setBusy] = useState(false);
  const [selectedExtId, setSelectedExtId] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<{ requirements: CertificationRequirement[] }>(
      "/api/kernel/enterprise/certification"
    ).then((d) => {
      if (d) setRequirements(d.requirements);
    });
  }, []);

  useEffect(() => {
    if (extensions.length > 0 && !selectedExtId) setSelectedExtId(extensions[0].manifest.id);
  }, [extensions, selectedExtId]);

  const runCert = async (ext: ExtensionInstance) => {
    setBusy(true);
    try {
      const res = await fetch("/api/kernel/enterprise/certification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "certify",
          connectorId: ext.manifest.id,
          connectorName: ext.manifest.name,
        }),
      });
      if (!res.ok) throw new Error();
      const result: CertificationResult = await res.json();
      setResults((p) => ({ ...p, [ext.manifest.id]: result }));
      toast[result.status === "certified" ? "success" : "error"](
        result.status === "certified" ? "Certified!" : "Certification failed",
        { description: `Score: ${result.score}%` }
      );
    } catch {
      toast.error("Certification failed");
    } finally {
      setBusy(false);
    }
  };

  const publishVersion = async (ext: ExtensionInstance) => {
    setBusy(true);
    try {
      const res = await fetch("/api/kernel/enterprise/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "publish",
          extensionId: ext.manifest.id,
          version: ext.manifest.version,
          changelog: `Release ${ext.manifest.version}`,
        }),
      });
      if (!res.ok) throw new Error();
      const v: ExtensionVersion = await res.json();
      setVersions((p) => ({
        ...p,
        [ext.manifest.id]: [v, ...(p[ext.manifest.id] || [])],
      }));
      toast.success("Version published", { description: `v${v.version}` });
    } catch {
      toast.error("Publish failed");
    } finally {
      setBusy(false);
    }
  };

  const loadVersions = async (extId: string) => {
    const v = await fetchJson<ExtensionVersion[]>(
      `/api/kernel/enterprise/versions?extensionId=${extId}`
    );
    if (v) setVersions((p) => ({ ...p, [extId]: v }));
  };

  const selected = extensions.find((e) => e.manifest.id === selectedExtId);
  const selectedResult = selectedExtId ? results[selectedExtId] : undefined;
  const selectedVersions = selectedExtId ? versions[selectedExtId] : undefined;

  return (
    <div>
      <ToolHeader
        icon={ClipboardCheck}
        title="Submission Workflow"
        subtitle="Track submissions, run certification, and publish versions."
      />
      <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-[200px_1fr]">
        <div>
          <SectionLabel icon={Boxes} label={`Extensions (${extensions.length})`} />
          <div className="scroll-thin max-h-96 space-y-1 overflow-y-auto">
            {extensions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 px-2 py-6 text-center text-[10px] text-muted-foreground">
                No extensions.
              </div>
            ) : (
              extensions.map((e) => {
                const active = e.manifest.id === selectedExtId;
                const r = results[e.manifest.id];
                return (
                  <button
                    key={e.manifest.id}
                    onClick={() => {
                      setSelectedExtId(e.manifest.id);
                      if (!versions[e.manifest.id]) loadVersions(e.manifest.id);
                    }}
                    className={`w-full rounded-md px-2 py-1.5 text-left transition ${
                      active ? "bg-foreground/[0.08]" : "hover:bg-foreground/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{e.manifest.emoji}</span>
                      <span className="truncate font-mono text-[11px] font-semibold text-foreground">
                        {e.manifest.name}
                      </span>
                      {r && (
                        <span
                          className={`ml-auto h-1.5 w-1.5 rounded-full ${
                            r.status === "certified" ? "bg-emerald-400" : "bg-rose-400"
                          }`}
                        />
                      )}
                    </div>
                    <div className="font-mono text-[9px] text-muted-foreground">
                      v{e.manifest.version} · {e.status}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div>
          {!selected ? (
            <EmptyState icon={ClipboardCheck} message="Select an extension to manage submissions." />
          ) : (
            <div className="space-y-3">
              {/* Header */}
              <div className="rounded-xl border border-border/50 bg-foreground/[0.02] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg">{selected.manifest.emoji}</span>
                  <span className="text-sm font-bold text-foreground">{selected.manifest.name}</span>
                  <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-muted-foreground">
                    v{selected.manifest.version}
                  </span>
                  <span className="rounded-full bg-cyan-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-cyan-400">
                    {selected.status}
                  </span>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => runCert(selected)}
                    disabled={busy}
                    className="flex items-center gap-1.5 rounded-lg bg-violet-500 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-violet-400 disabled:opacity-50"
                  >
                    {busy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ClipboardCheck className="h-3.5 w-3.5" />}
                    Run certification
                  </button>
                  <button
                    onClick={() => publishVersion(selected)}
                    disabled={busy}
                    className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" /> Publish v{selected.manifest.version}
                  </button>
                </div>
              </div>

              {/* Certification result */}
              {selectedResult && (
                <div className="rounded-xl border border-border/50 bg-foreground/[0.02] p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`text-sm font-bold uppercase ${statusColor(selectedResult.status)}`}>
                      {selectedResult.status}
                    </span>
                    <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                      Score: <span className="font-bold text-foreground">{selectedResult.score}%</span>
                    </span>
                  </div>
                  <div className="space-y-1">
                    {selectedResult.requirements.map((r, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 rounded-md bg-foreground/[0.02] px-2 py-1"
                      >
                        {r.passed ? (
                          <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                        ) : (
                          <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-rose-400" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-mono text-[10px] font-bold text-foreground">
                            {r.requirement}
                          </div>
                          <div className="font-mono text-[9px] text-muted-foreground">{r.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Requirements reference */}
              {!selectedResult && requirements.length > 0 && (
                <div className="rounded-xl border border-border/50 bg-foreground/[0.02] p-3">
                  <SectionLabel icon={ClipboardCheck} label="Certification requirements" />
                  <div className="space-y-1">
                    {requirements.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-start gap-2 rounded-md bg-foreground/[0.02] px-2 py-1"
                      >
                        <span
                          className={`mt-0.5 rounded px-1 font-mono text-[9px] font-bold uppercase ${
                            r.required
                              ? "bg-rose-500/20 text-rose-300"
                              : "bg-foreground/10 text-muted-foreground"
                          }`}
                        >
                          {r.required ? "req" : "opt"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-mono text-[10px] font-bold text-foreground">
                            {r.name}
                          </div>
                          <div className="font-mono text-[9px] text-muted-foreground">
                            {r.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Version history */}
              <div className="rounded-xl border border-border/50 bg-foreground/[0.02] p-3">
                <div className="mb-2 flex items-center gap-2">
                  <History className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                    Versions
                  </span>
                  <button
                    onClick={() => loadVersions(selected.manifest.id)}
                    className="ml-auto rounded-md bg-foreground/5 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    refresh
                  </button>
                </div>
                {!selectedVersions || selectedVersions.length === 0 ? (
                  <div className="py-3 text-center text-[11px] text-muted-foreground">
                    No versions published yet.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {selectedVersions.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center gap-2 rounded-md bg-foreground/[0.02] px-2 py-1"
                      >
                        <span className="font-mono text-[10px] font-bold text-foreground">
                          v{v.version}
                        </span>
                        <span
                          className={`rounded px-1 font-mono text-[9px] uppercase ${statusColor(v.status)}`}
                        >
                          {v.status}
                        </span>
                        <span className="font-mono text-[9px] text-muted-foreground">
                          {v.downloadCount} downloads
                        </span>
                        {v.publishedAt && (
                          <span className="ml-auto font-mono text-[9px] text-muted-foreground/70">
                            {timeAgo(v.publishedAt)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// Tool 11 — SDK Browser
// ===========================================================================

function SDKBrowserTool() {
  const [sdks, setSdks] = useState<SDKSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fullSdk, setFullSdk] = useState<SDKDefinition | null>(null);
  const [doc, setDoc] = useState<GeneratedDoc | null>(null);
  const [showDoc, setShowDoc] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchJson<{ sdks: SDKSummary[] }>("/api/kernel/enterprise/docs").then((d) => {
      if (d?.sdks) {
        setSdks(d.sdks);
        if (d.sdks.length > 0) setSelectedId(d.sdks[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    const poll = async () => {
      setLoading(true);
      const d = await fetchJson<SDKDefinition[]>(`/api/kernel/enterprise/sdk`);
      if (cancelled || !d) return;
      const found = d.find((s) => s.id === selectedId) || null;
      setFullSdk(found);
      setLoading(false);
    };
    void poll();
    const id = setInterval(() => void poll(), 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [selectedId]);

  const viewDocs = async () => {
    if (!selectedId) return;
    const d = await fetchJson<GeneratedDoc>(
      `/api/kernel/enterprise/docs?sdk=${selectedId}`
    );
    if (d) {
      setDoc(d);
      setShowDoc(true);
      toast.success("Docs loaded", { description: d.title });
    }
  };

  return (
    <div>
      <ToolHeader
        icon={Library}
        title="SDK Browser"
        subtitle="Browse the 6 typed SDKs. Each method has a signature, return type, and example."
      />
      <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-[180px_1fr]">
        <div>
          <SectionLabel icon={Library} label={`SDKs (${sdks.length})`} />
          <div className="space-y-1">
            {sdks.map((s) => {
              const active = s.id === selectedId;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedId(s.id);
                    setShowDoc(false);
                  }}
                  className={`w-full rounded-md px-2 py-1.5 text-left transition ${
                    active ? "bg-foreground/[0.08]" : "hover:bg-foreground/[0.04]"
                  }`}
                >
                  <div className="truncate font-mono text-[11px] font-semibold text-foreground">
                    {s.name}
                  </div>
                  <div className="font-mono text-[9px] text-muted-foreground">v{s.version}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          {!fullSdk ? (
            <EmptyState icon={Library} message={loading ? "Loading SDK…" : "Select an SDK."} />
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-border/50 bg-foreground/[0.02] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-foreground">{fullSdk.name}</span>
                  <span className="rounded-full bg-violet-500/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-violet-300">
                    v{fullSdk.version}
                  </span>
                  <span className="rounded-full bg-cyan-500/15 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-cyan-300">
                    {fullSdk.auth}
                  </span>
                  <button
                    onClick={viewDocs}
                    className="ml-auto flex items-center gap-1 rounded-md border border-violet-500/40 bg-violet-500/10 px-2 py-1 font-mono text-[10px] font-bold text-violet-400 transition hover:bg-violet-500/20"
                  >
                    <FileText className="h-3 w-3" /> View docs
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{fullSdk.description}</p>
              </div>

              <div>
                <SectionLabel icon={FileCode} label={`Methods (${fullSdk.methods.length})`} />
                <div className="space-y-2">
                  {fullSdk.methods.map((m) => (
                    <div
                      key={m.name}
                      className="rounded-lg border border-border/50 bg-foreground/[0.02] p-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-emerald-400">
                          {m.name}
                        </span>
                        <span className="ml-auto font-mono text-[9px] text-muted-foreground">
                          → {m.returns}
                        </span>
                      </div>
                      <div className="mt-1 font-mono text-[10px] text-cyan-300">
                        {m.signature}
                      </div>
                      <div className="mt-1 text-[10px] text-muted-foreground">{m.description}</div>
                      <pre className="mt-1.5 overflow-auto rounded-md bg-[oklch(0.10_0.005_200)] p-2 font-mono text-[10px] leading-snug text-amber-200/90">
                        {m.example}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>

              <AnimatePresence>
                {showDoc && doc && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <SectionLabel icon={FileText} label={`Generated docs — ${doc.title}`} />
                    <pre className="scroll-thin max-h-72 overflow-auto rounded-xl border border-border/40 bg-[oklch(0.10_0.005_200)] p-3 font-mono text-[10px] leading-snug text-emerald-200/90">
                      {doc.content}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// Tool 12 — OAuth Manager
// ===========================================================================

function OAuthManagerTool() {
  const [clients, setClients] = useState<OAuthClient[]>([]);
  const [tokens, setTokens] = useState<OAuthToken[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "developer",
    redirectUris: "https://app.example.com/callback",
    scopes: "read:intents",
  });
  const [busy, setBusy] = useState(false);

  const fetchClients = useCallback(async () => {
    const d = await fetchJson<OAuthClient[]>("/api/kernel/enterprise/oauth");
    if (d) setClients(d);
  }, []);

  useEffect(() => {
    fetchClients();
    const id = setInterval(fetchClients, 5000);
    return () => clearInterval(id);
  }, [fetchClients]);

  const register = async () => {
    if (!form.name) {
      toast.error("Name required");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/kernel/enterprise/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          config: {
            name: form.name,
            type: form.type,
            redirectUris: form.redirectUris.split(",").map((s) => s.trim()).filter(Boolean),
            scopes: form.scopes.split(",").map((s) => s.trim()).filter(Boolean),
          },
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Client registered");
      setShowForm(false);
      setForm({ name: "", type: "developer", redirectUris: "https://app.example.com/callback", scopes: "read:intents" });
      await fetchClients();
    } catch {
      toast.error("Register failed");
    } finally {
      setBusy(false);
    }
  };

  const authorize = async (c: OAuthClient) => {
    setBusy(true);
    try {
      const res = await fetch("/api/kernel/enterprise/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "authorize",
          clientId: c.clientId,
          scopes: c.scopes,
        }),
      });
      if (!res.ok) throw new Error();
      const token: OAuthToken = await res.json();
      setTokens((p) => [token, ...p].slice(0, 8));
      toast.success("Token issued", { description: `expires in 1h · ${c.name}` });
    } catch {
      toast.error("Authorize failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <ToolHeader
        icon={KeyRound}
        title="OAuth Manager"
        subtitle="Manage OAuth clients, register new ones, and issue access tokens."
        action={
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-1 font-mono text-[10px] font-bold text-emerald-400 transition hover:bg-emerald-500/30"
          >
            <Plus className="h-3 w-3" /> New client
          </button>
        }
      />
      <div className="space-y-3 p-3">
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-3">
                <div className="grid grid-cols-2 gap-2">
                  <Field label="name">
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="text-xs"
                    />
                  </Field>
                  <Field label="type">
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className="font-mono text-xs"
                    >
                      <option value="fleet">fleet</option>
                      <option value="merchant">merchant</option>
                      <option value="ride_provider">ride_provider</option>
                      <option value="calendar">calendar</option>
                      <option value="maps">maps</option>
                      <option value="analytics">analytics</option>
                      <option value="developer">developer</option>
                    </select>
                  </Field>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <Field label="redirect URIs (comma-separated)">
                    <input
                      value={form.redirectUris}
                      onChange={(e) => setForm({ ...form, redirectUris: e.target.value })}
                      className="font-mono text-[11px]"
                    />
                  </Field>
                  <Field label="scopes (comma-separated)">
                    <input
                      value={form.scopes}
                      onChange={(e) => setForm({ ...form, scopes: e.target.value })}
                      className="font-mono text-[11px]"
                    />
                  </Field>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 rounded-lg border border-border/60 py-1.5 text-[11px] font-semibold text-muted-foreground hover:bg-foreground/[0.04]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={register}
                    disabled={busy}
                    className="flex-[2] rounded-lg bg-emerald-500 py-1.5 text-[11px] font-bold text-emerald-950 hover:bg-emerald-400 disabled:opacity-50"
                  >
                    Register
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <SectionLabel icon={KeyRound} label={`Clients (${clients.length})`} />
          <div className="space-y-2">
            {clients.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 px-2 py-6 text-center text-[11px] text-muted-foreground">
                No OAuth clients.
              </div>
            ) : (
              clients.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-border/50 bg-foreground/[0.02] p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{c.name}</span>
                    <span className="rounded-full bg-cyan-500/15 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-cyan-300">
                      {c.type}
                    </span>
                    <button
                      onClick={() => authorize(c)}
                      disabled={busy}
                      className="ml-auto flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 font-mono text-[10px] font-bold text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
                    >
                      <KeyRound className="h-3 w-3" /> Authorize
                    </button>
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                    client_id: <span className="text-foreground">{c.clientId}</span>
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    client_secret: <span className="text-amber-300">{c.clientSecret}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {c.scopes.map((s) => (
                      <span
                        key={s}
                        className="rounded-md bg-violet-500/15 px-1.5 py-0.5 font-mono text-[9px] text-violet-300"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="mt-1 font-mono text-[9px] text-muted-foreground">
                    redirect: {c.redirectUris.join(", ")}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {tokens.length > 0 && (
          <div>
            <SectionLabel icon={KeyRound} label="Recent tokens" />
            <div className="space-y-2">
              {tokens.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.05] p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{t.clientName}</span>
                    <span className="ml-auto font-mono text-[10px] text-emerald-400">
                      expires {timeAgo(t.expiresAt)}
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-amber-300">
                    access: {t.accessToken}
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    refresh: {t.refreshToken}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {t.scopes.map((s) => (
                      <span
                        key={s}
                        className="rounded-md bg-violet-500/15 px-1.5 py-0.5 font-mono text-[9px] text-violet-300"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===========================================================================
// Tool 13 — Webhook Manager
// ===========================================================================

function WebhookManagerTool() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    url: "",
    events: "ride.booked,auction.cleared",
  });
  const [busy, setBusy] = useState(false);

  const fetchEndpoints = useCallback(async () => {
    const d = await fetchJson<WebhookEndpoint[]>("/api/kernel/enterprise/webhooks");
    if (d) setEndpoints(d);
  }, []);

  useEffect(() => {
    fetchEndpoints();
    const id = setInterval(fetchEndpoints, 4000);
    return () => clearInterval(id);
  }, [fetchEndpoints]);

  const register = async () => {
    if (!form.url) {
      toast.error("URL required");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/kernel/enterprise/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          url: form.url,
          events: form.events.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Webhook registered");
      setShowForm(false);
      setForm({ url: "", events: "ride.booked,auction.cleared" });
      await fetchEndpoints();
    } catch {
      toast.error("Register failed");
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async (ep: WebhookEndpoint) => {
    setBusy(true);
    try {
      const res = await fetch("/api/kernel/enterprise/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deliver",
          event: ep.events[0] || "test.event",
          payload: { test: true, sentAt: Date.now(), endpoint: ep.id },
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Test event sent", { description: ep.events[0] || "test.event" });
      await fetchEndpoints();
    } catch {
      toast.error("Send failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <ToolHeader
        icon={Webhook}
        title="Webhook Manager"
        subtitle="Register outbound webhook endpoints and send test deliveries."
        action={
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-1 font-mono text-[10px] font-bold text-emerald-400 transition hover:bg-emerald-500/30"
          >
            <Plus className="h-3 w-3" /> New
          </button>
        }
      />
      <div className="space-y-3 p-3">
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-3">
                <Field label="endpoint URL">
                  <input
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="https://api.example.com/webhooks/oryx"
                    className="font-mono text-[11px]"
                  />
                </Field>
                <div className="mt-2">
                  <Field label="events (comma-separated)">
                    <input
                      value={form.events}
                      onChange={(e) => setForm({ ...form, events: e.target.value })}
                      className="font-mono text-[11px]"
                    />
                  </Field>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 rounded-lg border border-border/60 py-1.5 text-[11px] font-semibold text-muted-foreground hover:bg-foreground/[0.04]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={register}
                    disabled={busy}
                    className="flex-[2] rounded-lg bg-emerald-500 py-1.5 text-[11px] font-bold text-emerald-950 hover:bg-emerald-400 disabled:opacity-50"
                  >
                    Register
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-2">
          {endpoints.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 px-2 py-6 text-center text-[11px] text-muted-foreground">
              No webhook endpoints.
            </div>
          ) : (
            endpoints.map((ep) => (
              <div
                key={ep.id}
                className="rounded-xl border border-border/50 bg-foreground/[0.02] p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Webhook className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="truncate font-mono text-[11px] font-semibold text-foreground">
                    {ep.url}
                  </span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${
                      ep.active ? "bg-emerald-500/15 text-emerald-300" : "bg-foreground/10 text-muted-foreground"
                    }`}
                  >
                    {ep.active ? "active" : "disabled"}
                  </span>
                  <button
                    onClick={() => sendTest(ep)}
                    disabled={busy}
                    className="ml-auto flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 font-mono text-[10px] font-bold text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    <Send className="h-3 w-3" /> Test
                  </button>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {ep.events.map((ev) => (
                    <span
                      key={ev}
                      className="rounded-md bg-violet-500/15 px-1.5 py-0.5 font-mono text-[9px] text-violet-300"
                    >
                      {ev}
                    </span>
                  ))}
                </div>
                <div className="mt-1 font-mono text-[9px] text-muted-foreground">
                  secret: <span className="text-amber-300">{ep.secret}</span> · {ep.deliveries.length} deliveries
                </div>
                {ep.deliveries.length > 0 && (
                  <div className="mt-2 space-y-0.5 rounded-md bg-[oklch(0.10_0.005_200)] p-2">
                    {ep.deliveries.slice(0, 4).map((d) => (
                      <div key={d.id} className="flex items-center gap-2 font-mono text-[9px]">
                        <span
                          className={
                            d.status === "delivered"
                              ? "text-emerald-400"
                              : d.status === "failed"
                              ? "text-rose-400"
                              : "text-amber-400"
                          }
                        >
                          ● {d.status}
                        </span>
                        <span className="text-cyan-300">{d.event}</span>
                        <span className="text-muted-foreground">→ {d.responseCode ?? "—"}</span>
                        {d.deliveredAt && (
                          <span className="ml-auto text-muted-foreground/60">
                            {tsClock(d.deliveredAt)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// Tool 14 — Sandbox
// ===========================================================================

function SandboxTool() {
  const [sessions, setSessions] = useState<SandboxSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState("");

  const fetchSessions = useCallback(async () => {
    const d = await fetchJson<SandboxSession[]>("/api/kernel/enterprise/sandbox");
    if (d) {
      setSessions(d);
      if (d.length > 0 && !selectedId) setSelectedId(d[0].id);
    }
  }, [selectedId]);

  useEffect(() => {
    fetchSessions();
    const id = setInterval(fetchSessions, 4000);
    return () => clearInterval(id);
  }, [fetchSessions]);

  const selected = sessions.find((s) => s.id === selectedId);

  const create = async () => {
    if (!newName) {
      toast.error("Name required");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/kernel/enterprise/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", name: newName }),
      });
      if (!res.ok) throw new Error();
      const s: SandboxSession = await res.json();
      toast.success("Session created");
      setNewName("");
      setSelectedId(s.id);
      await fetchSessions();
    } catch {
      toast.error("Create failed");
    } finally {
      setBusy(false);
    }
  };

  const replayEvents = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch("/api/kernel/enterprise/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "replay", sessionId: selected.id }),
      });
      if (!res.ok) throw new Error();
      const evts: KernelEvent[] = await res.json();
      toast.success("Events replayed", { description: `${evts.length} events` });
      await fetchSessions();
    } catch {
      toast.error("Replay failed");
    } finally {
      setBusy(false);
    }
  };

  const simRide = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch("/api/kernel/enterprise/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "simulateRide",
          sessionId: selected.id,
          origin: "East Legon",
          destination: "Airport",
          price: 14.5,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Ride simulated in sandbox");
      await fetchSessions();
    } catch {
      toast.error("Simulate failed");
    } finally {
      setBusy(false);
    }
  };

  const runTests = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch("/api/kernel/enterprise/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "runTests",
          sessionId: selected.id,
          extensionId: "ext-test",
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Tests complete");
      await fetchSessions();
    } catch {
      toast.error("Tests failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <ToolHeader
        icon={FlaskConical}
        title="Testing Sandbox"
        subtitle="Isolated test sessions. Replay events, simulate rides, and run test suites."
      />
      <div className="space-y-3 p-3">
        <div className="rounded-xl border border-border/50 bg-card/40 p-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Field label="new session name">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="regression-suite-v2"
                  className="font-mono text-xs"
                />
              </Field>
            </div>
            <button
              onClick={create}
              disabled={busy}
              className="flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-2 text-[11px] font-bold text-emerald-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" /> Create
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[200px_1fr]">
          <div>
            <SectionLabel icon={FlaskConical} label={`Sessions (${sessions.length})`} />
            <div className="scroll-thin max-h-72 space-y-1 overflow-y-auto">
              {sessions.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 px-2 py-6 text-center text-[10px] text-muted-foreground">
                  No sessions.
                </div>
              ) : (
                sessions.map((s) => {
                  const active = s.id === selectedId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedId(s.id)}
                      className={`w-full rounded-md px-2 py-1.5 text-left transition ${
                        active ? "bg-foreground/[0.08]" : "hover:bg-foreground/[0.04]"
                      }`}
                    >
                      <div className="truncate font-mono text-[11px] font-semibold text-foreground">
                        {s.name}
                      </div>
                      <div className="font-mono text-[9px] text-muted-foreground">
                        {s.id.slice(0, 14)} · {s.events.length} events · {s.testResults.length} tests
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div>
            {!selected ? (
              <EmptyState icon={FlaskConical} message="Create or select a sandbox session." />
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border border-border/50 bg-foreground/[0.02] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{selected.name}</span>
                    <span className={`rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${statusColor(selected.status)}`}>
                      {selected.status}
                    </span>
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                      {timeAgo(selected.createdAt)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      onClick={replayEvents}
                      disabled={busy}
                      className="flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 font-mono text-[10px] font-bold text-amber-400 hover:bg-amber-500/20 disabled:opacity-50"
                    >
                      <History className="h-3 w-3" /> Replay events
                    </button>
                    <button
                      onClick={simRide}
                      disabled={busy}
                      className="flex items-center gap-1 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 font-mono text-[10px] font-bold text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-50"
                    >
                      <Car className="h-3 w-3" /> Sim ride
                    </button>
                    <button
                      onClick={runTests}
                      disabled={busy}
                      className="flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 font-mono text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"
                    >
                      <FlaskConical className="h-3 w-3" /> Run tests
                    </button>
                  </div>
                </div>

                {/* Test results */}
                {selected.testResults.length > 0 && (
                  <div>
                    <SectionLabel icon={CheckCircle2} label="Test results" />
                    <div className="space-y-1">
                      {selected.testResults.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-start gap-2 rounded-lg border border-border/50 bg-foreground/[0.02] p-2"
                        >
                          {t.status === "passed" ? (
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                          ) : t.status === "failed" ? (
                            <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
                          ) : (
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-semibold text-foreground">{t.name}</div>
                            <div className="font-mono text-[9px] text-muted-foreground">
                              {t.detail} · {t.durationMs}ms
                            </div>
                          </div>
                          <span
                            className={`rounded px-1 font-mono text-[9px] uppercase ${
                              t.status === "passed"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : t.status === "failed"
                                ? "bg-rose-500/20 text-rose-300"
                                : "bg-amber-500/20 text-amber-300"
                            }`}
                          >
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Events */}
                {selected.events.length > 0 && (
                  <div>
                    <SectionLabel icon={Radio} label={`Session events (${selected.events.length})`} />
                    <div className="scroll-thin max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border/40 bg-[oklch(0.10_0.005_200)] p-2 font-mono">
                      {selected.events.slice(-12).reverse().map((e) => (
                        <div key={e.id} className="flex items-start gap-2 px-1 py-0.5 text-[10px]">
                          <span className="shrink-0 tabular-nums text-muted-foreground/60">
                            {tsClock(e.timestamp)}
                          </span>
                          <span className={`shrink-0 font-bold ${eventColor(e.type)}`}>{e.type}</span>
                          <span className="flex-1 break-words text-muted-foreground">
                            {e.aggregateId.slice(0, 16)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// Tool 15 — Monitoring
// ===========================================================================

function MonitoringTool() {
  const [data, setData] = useState<PluginMonitorSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      const d = await fetchJson<PluginMonitorSummary>("/api/kernel/enterprise/monitoring");
      if (cancelled || !d) return;
      setData(d);
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const health = data?.health;

  return (
    <div>
      <ToolHeader
        icon={Activity}
        title="Plugin Monitoring"
        subtitle="Real-time health + performance of installed extensions. Polls every 3s."
      />
      <div className="space-y-3 p-3">
        {/* Health summary */}
        <div className="grid grid-cols-4 gap-2">
          <StatCard label="Healthy" value={health?.healthy ?? 0} color="text-emerald-400" />
          <StatCard label="Degraded" value={health?.degraded ?? 0} color="text-amber-400" />
          <StatCard label="Error" value={health?.error ?? 0} color="text-rose-400" />
          <StatCard label="Total" value={health?.total ?? 0} color="text-cyan-400" />
        </div>

        {/* Per-extension entries */}
        <div>
          <SectionLabel icon={Activity} label={`Monitored extensions (${data?.entries.length ?? 0})`} />
          <div className="space-y-2">
            {!data || data.entries.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 px-2 py-6 text-center text-[11px] text-muted-foreground">
                No monitored plugins.
              </div>
            ) : (
              data.entries.map((e) => (
                <div
                  key={e.extensionId}
                  className={`rounded-xl border p-3 transition ${
                    e.status === "healthy"
                      ? "border-emerald-500/30 bg-emerald-500/[0.04]"
                      : e.status === "degraded"
                      ? "border-amber-500/30 bg-amber-500/[0.04]"
                      : "border-rose-500/30 bg-rose-500/[0.04]"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        e.status === "healthy"
                          ? "bg-emerald-400"
                          : e.status === "degraded"
                          ? "bg-amber-400"
                          : "bg-rose-400"
                      }`}
                    />
                    <span className="text-sm font-bold text-foreground">{e.name}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${statusColor(e.status)}`}
                    >
                      {e.status}
                    </span>
                    <span className="ml-auto font-mono text-[9px] text-muted-foreground">
                      last active {timeAgo(e.lastActiveAt)}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Metric label="Events" value={e.eventsProcessed.toLocaleString()} />
                    <Metric
                      label="Errors today"
                      value={String(e.errorsToday)}
                      tone={e.errorsToday > 5 ? "rose" : "default"}
                    />
                    <Metric label="Avg latency" value={`${e.avgLatencyMs}ms`} />
                    <Metric label="Memory" value={`${e.memoryUsageMb}MB`} />
                  </div>
                  {e.lastError && (
                    <div className="mt-1.5 font-mono text-[10px] text-rose-300">
                      last error: {e.lastError}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// Tool 16 — Documentation
// ===========================================================================

function DocumentationTool() {
  const [sdks, setSdks] = useState<SDKSummary[]>([]);
  const [view, setView] = useState<"api" | string>("");
  const [doc, setDoc] = useState<GeneratedDoc | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchJson<{ sdks: SDKSummary[] }>("/api/kernel/enterprise/docs").then((d) => {
      if (d?.sdks) {
        setSdks(d.sdks);
        setView("api");
      }
    });
  }, []);

  useEffect(() => {
    if (!view) return;
    let cancelled = false;
    const poll = async () => {
      setLoading(true);
      const url =
        view === "api"
          ? "/api/kernel/enterprise/docs?type=api"
          : `/api/kernel/enterprise/docs?sdk=${view}`;
      const d = await fetchJson<GeneratedDoc>(url);
      if (cancelled) return;
      setDoc(d);
      setLoading(false);
    };
    void poll();
    const id = setInterval(() => void poll(), 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [view]);

  const download = () => {
    if (!doc) return;
    const blob = new Blob([doc.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${view === "api" ? "oryx-api-reference" : view}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded", { description: a.download });
  };

  return (
    <div>
      <ToolHeader
        icon={FileText}
        title="Documentation"
        subtitle="Auto-generated docs from SDK definitions. Browse SDK docs or the API reference."
        action={
          doc && (
            <button
              onClick={download}
              className="flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-1 font-mono text-[10px] font-bold text-amber-400 transition hover:bg-amber-500/30"
            >
              <Download className="h-3 w-3" /> Download
            </button>
          )
        }
      />
      <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-[180px_1fr]">
        <div>
          <SectionLabel icon={FileText} label="Doc sources" />
          <div className="space-y-1">
            <button
              onClick={() => setView("api")}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition ${
                view === "api" ? "bg-foreground/[0.08]" : "hover:bg-foreground/[0.04]"
              }`}
            >
              <FileText className="h-3 w-3 text-cyan-400" />
              <span className="font-mono text-[11px] font-semibold text-foreground">API Reference</span>
            </button>
            {sdks.map((s) => (
              <button
                key={s.id}
                onClick={() => setView(s.id)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition ${
                  view === s.id ? "bg-foreground/[0.08]" : "hover:bg-foreground/[0.04]"
                }`}
              >
                <Library className="h-3 w-3 text-violet-400" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mono text-[11px] font-semibold text-foreground">
                    {s.name}
                  </div>
                  <div className="font-mono text-[9px] text-muted-foreground">v{s.version}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          {!doc ? (
            <EmptyState icon={FileText} message={loading ? "Loading docs…" : "Select a doc source."} />
          ) : (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">{doc.title}</span>
                <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-muted-foreground">
                  {doc.type}
                </span>
                <span className="ml-auto font-mono text-[9px] text-muted-foreground/70">
                  generated {timeAgo(doc.generatedAt)}
                </span>
              </div>
              <MarkdownRender content={doc.content} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MarkdownRender({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    // code fence
    if (line.startsWith("```")) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      blocks.push(
        <pre
          key={key++}
          className="my-2 overflow-auto rounded-lg border border-border/40 bg-[oklch(0.10_0.005_200)] p-2.5 font-mono text-[10px] leading-snug text-amber-200/90"
        >
          {code.join("\n")}
        </pre>
      );
      continue;
    }
    // headings
    if (line.startsWith("### ")) {
      blocks.push(
        <h4 key={key++} className="mt-2 mb-1 text-[12px] font-bold text-emerald-300">
          {line.slice(4)}
        </h4>
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push(
        <h3 key={key++} className="mt-3 mb-1 text-[13px] font-bold text-cyan-300">
          {line.slice(3)}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      blocks.push(
        <h2 key={key++} className="mt-1 mb-2 text-base font-black text-foreground">
          {line.slice(2)}
        </h2>
      );
      i++;
      continue;
    }
    // list items
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2));
        i++;
      }
      blocks.push(
        <ul key={key++} className="my-1 space-y-0.5 pl-4">
          {items.map((it, idx) => (
            <li key={idx} className="font-mono text-[11px] text-foreground/85">
              <span className="text-emerald-400">•</span> {renderInlineCode(it)}
            </li>
          ))}
        </ul>
      );
      continue;
    }
    // blank
    if (line.trim() === "") {
      blocks.push(<div key={key++} className="h-1.5" />);
      i++;
      continue;
    }
    // paragraph
    blocks.push(
      <p key={key++} className="my-0.5 text-[11px] leading-relaxed text-foreground/85">
        {renderInlineCode(line)}
      </p>
    );
    i++;
  }
  return (
    <div className="scroll-thin max-h-[28rem] overflow-y-auto rounded-xl border border-border/40 bg-foreground/[0.02] p-3">
      {blocks}
    </div>
  );
}

function renderInlineCode(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("`") && p.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded bg-foreground/10 px-1 py-0.5 font-mono text-[10px] text-cyan-300"
        >
          {p.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{p}</span>;
  });
}

// ===========================================================================
// Shared primitives
// ===========================================================================

function ToolHeader({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 border-b border-border/40 px-3 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
        <Icon className="h-4 w-4 text-emerald-400" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-black tracking-tight text-foreground">{title}</div>
        {subtitle && (
          <div className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</div>
        )}
      </div>
      {action}
    </div>
  );
}

function HealthBadge({
  icon: Icon,
  label,
  value,
  sub,
  color,
  bg,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  sub?: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/40 p-2.5">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bg}`}>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className="min-w-0">
        <div className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className={`text-sm font-black tabular-nums ${color}`}>{value}</div>
        {sub && <div className="text-[9px] text-muted-foreground/70">{sub}</div>}
      </div>
    </div>
  );
}

function SectionLabel({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="mb-1.5 flex items-center gap-1.5">
      <Icon className="h-3 w-3 text-muted-foreground" />
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-foreground/[0.02] p-2 text-center">
      <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`mt-0.5 text-base font-black tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "rose";
}) {
  return (
    <div className="rounded-md bg-foreground/[0.03] px-2 py-1">
      <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-0.5 font-mono text-[11px] font-bold tabular-nums ${
          tone === "rose" ? "text-rose-400" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
  return (
    <div className="flex h-72 flex-col items-center justify-center text-center">
      <Icon className="mb-2 h-8 w-8 text-muted-foreground/40" />
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-border/60 [&_input]:bg-background [&_input]:px-3 [&_input]:py-2 [&_input]:text-sm [&_input]:text-foreground [&_input]:placeholder:text-muted-foreground [&_input]:focus:border-emerald-500/50 [&_input]:focus:outline-none [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-border/60 [&_select]:bg-background [&_select]:px-3 [&_select]:py-2 [&_select]:text-sm [&_select]:text-foreground [&_select]:focus:border-emerald-500/50 [&_select]:focus:outline-none [&_textarea]:w-full [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-border/60 [&_textarea]:bg-background [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:text-sm [&_textarea]:text-foreground [&_textarea]:placeholder:text-muted-foreground [&_textarea]:focus:border-emerald-500/50 [&_textarea]:focus:outline-none">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function MultiSelect<T extends string>({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: readonly T[];
  selected: T[];
  onToggle: (o: T) => void;
}) {
  return (
    <div>
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => {
          const on = selected.includes(o);
          return (
            <button
              key={o}
              onClick={() => onToggle(o)}
              className={`rounded-md px-2 py-1 font-mono text-[10px] font-bold transition ${
                on
                  ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
                  : "bg-foreground/[0.04] text-muted-foreground hover:bg-foreground/[0.08]"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
