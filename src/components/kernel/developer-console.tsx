"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Terminal,
  Plus,
  FileCode,
  ScrollText,
  Radio,
  FlaskConical,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Bug,
  Upload,
  Send,
  Play,
  History,
  Activity,
  Cpu,
  Database,
  Zap,
  ChevronRight,
} from "lucide-react";

// ---- Types (mirrored from kernel) -----------------------------------------

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
  status: string;
  latencyMs: number;
  eventsIngested: number;
}

// ---- Constants -------------------------------------------------------------

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

const LOG_COLORS: Record<ExtensionLog["level"], { text: string; dot: string; icon: typeof Bug }> = {
  debug: { text: "text-muted-foreground/70", dot: "bg-muted-foreground/40", icon: Bug },
  info: { text: "text-cyan-300", dot: "bg-cyan-400", icon: Activity },
  warn: { text: "text-amber-300", dot: "bg-amber-400", icon: AlertTriangle },
  error: { text: "text-rose-300", dot: "bg-rose-400", icon: XCircle },
};

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

// ---- Helpers ---------------------------------------------------------------

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 1000) return "just now";
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

function tsClock(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, { hour12: false }) + "." + String(d.getMilliseconds()).padStart(3, "0");
}

// ---- Component -------------------------------------------------------------

type PanelTab = "manifest" | "logs" | "events" | "test";

export function DeveloperConsole() {
  const [extensions, setExtensions] = useState<ExtensionInstance[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<PanelTab>("manifest");
  const [logs, setLogs] = useState<ExtensionLog[]>([]);
  const [events, setEvents] = useState<KernelEvent[]>([]);
  const [eventFilter, setEventFilter] = useState("");
  const [graphStats, setGraphStats] = useState<GraphStats | null>(null);
  const [connectors, setConnectors] = useState<ConnectorHealth[]>([]);
  const [eventsPerSec, setEventsPerSec] = useState(0);
  const [creating, setCreating] = useState(false);
  const [manifestDraft, setManifestDraft] = useState<ExtensionManifest>(EMPTY_MANIFEST);
  const [validateErrors, setValidateErrors] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [simulateForm, setSimulateForm] = useState({ origin: "East Legon", destination: "Kotoka Airport", price: 14.5 });
  const [replayFilter, setReplayFilter] = useState("intent");
  const [testResult, setTestResult] = useState<string | null>(null);

  const prevEventsCount = useRef(0);

  // Fetch extensions + kernel health
  const fetchAll = useCallback(async () => {
    try {
      const [extRes, graphRes, connRes, evtRes] = await Promise.all([
        fetch("/api/kernel/dev-console", { cache: "no-store" }),
        fetch("/api/kernel/graph", { cache: "no-store" }),
        fetch("/api/kernel/connectors", { cache: "no-store" }),
        fetch("/api/kernel/events?limit=50", { cache: "no-store" }),
      ]);
      const extData = await extRes.json();
      const exts: ExtensionInstance[] = extData.extensions || [];
      setExtensions(exts);
      if (exts.length > 0 && !selectedId) setSelectedId(exts[0].manifest.id);
      setGraphStats(await graphRes.json());
      setConnectors(await connRes.json());
      const evts: KernelEvent[] = await evtRes.json();
      // Events-per-second estimate
      const total = evts.length;
      if (prevEventsCount.current > 0) {
        const delta = total - prevEventsCount.current;
        if (delta > 0) setEventsPerSec((p) => Math.max(p, delta));
      }
      prevEventsCount.current = total;
      setEvents(evts.slice().reverse());
    } catch {
      // ignore — keep last state
    }
  }, [selectedId]);

  // Fetch logs for the selected extension
  const fetchLogs = useCallback(async () => {
    if (!selectedId) return;
    try {
      const res = await fetch(`/api/kernel/dev-console?extId=${selectedId}`, { cache: "no-store" });
      const data = await res.json();
      setLogs(data.logs || []);
    } catch {
      // ignore
    }
  }, [selectedId]);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 3000);
    return () => clearInterval(id);
  }, [fetchAll]);

  useEffect(() => {
    fetchLogs();
    const id = setInterval(fetchLogs, 2000);
    return () => clearInterval(id);
  }, [fetchLogs]);

  // ---- Actions -------------------------------------------------------------

  const liveCount = connectors.filter((c) => c.status === "live").length;

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
      await fetchAll();
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
      if (data.ok) {
        toast.success("Manifest valid", { description: "Ready to hot-reload or submit." });
      } else {
        toast.error("Validation failed", { description: `${data.errors.length} error(s)` });
      }
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
      toast.success("Submitted for review", { description: "Will appear in the Extension Store after Oryx verification." });
      await fetchAll();
    } catch {
      toast.error("Submit failed");
    } finally {
      setBusy(false);
    }
  };

  const createExtension = async () => {
    if (!manifestDraft.id || !manifestDraft.name) {
      toast.error("id + name required");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/kernel/dev-console", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", ...manifestDraft }),
      });
      if (!res.ok) throw new Error();
      toast.success("Extension created", { description: `${manifestDraft.name} v${manifestDraft.version}` });
      setCreating(false);
      setManifestDraft(EMPTY_MANIFEST);
      await fetchAll();
    } catch {
      toast.error("Create failed");
    } finally {
      setBusy(false);
    }
  };

  const simulateRide = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/kernel/dev-console", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "simulateRide", ...simulateForm }),
      });
      if (!res.ok) throw new Error();
      toast.success("Ride simulated", { description: `${simulateForm.origin} → ${simulateForm.destination}` });
      setTestResult(`ride.simulated event published · ${simulateForm.origin} → ${simulateForm.destination} · GH₵${simulateForm.price}`);
      await fetchAll();
    } catch {
      toast.error("Simulation failed");
    } finally {
      setBusy(false);
    }
  };

  const replay = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/kernel/dev-console", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "replay", filter: replayFilter }),
      });
      const data = await res.json();
      toast.success("Replay complete", { description: `${data.replayed} events matched "${replayFilter}"` });
      setTestResult(`replayed ${data.replayed} events matching "${replayFilter}"`);
    } catch {
      toast.error("Replay failed");
    } finally {
      setBusy(false);
    }
  };

  // ---- Render --------------------------------------------------------------

  return (
    <div className="px-4 pb-8 pt-3">
      {/* Header */}
      <div className="mb-3 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-400">
          <Terminal className="h-3 w-3" /> Developer Console
        </div>
        <h2 className="mt-3 text-xl font-black tracking-tight text-foreground text-balance">
          Build, hot-reload, and ship extensions
        </h2>
        <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
          A cloud-IDE workspace for the Oryx Mobility Kernel. Edit manifests,
          watch live logs, simulate rides, replay events, validate, and submit
          to the Extension Store.
        </p>
      </div>

      {/* Top kernel health badges */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-3 grid grid-cols-3 gap-2"
      >
        <HealthBadge
          icon={Database}
          label="Graph nodes"
          value={graphStats?.totalNodes ?? "—"}
          color="text-violet-400"
          bg="bg-violet-500/15"
        />
        <HealthBadge
          icon={Cpu}
          label="Connectors live"
          value={`${liveCount}/${connectors.length}`}
          color="text-cyan-400"
          bg="bg-cyan-500/15"
        />
        <HealthBadge
          icon={Activity}
          label="Events / sec"
          value={eventsPerSec}
          color="text-emerald-400"
          bg="bg-emerald-500/15"
        />
      </motion.div>

      {/* IDE layout */}
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-[oklch(0.13_0.005_200)]">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-border/40 bg-foreground/[0.02] px-3 py-2">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
          </div>
          <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            oryx-kernel · dev-workspace
          </span>
          <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            connected
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[180px_1fr]">
          {/* Sidebar — extensions */}
          <div className="border-b border-border/40 bg-foreground/[0.01] p-2 md:border-b-0 md:border-r">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Extensions
              </span>
              <button
                onClick={() => setCreating((c) => !c)}
                className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400 transition hover:bg-emerald-500/30"
                aria-label="New extension"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <div className="scroll-thin max-h-72 space-y-1 overflow-y-auto md:max-h-[28rem]">
              {extensions.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 px-2 py-4 text-center text-[10px] text-muted-foreground">
                  No extensions yet. Tap + to create one.
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
                      }}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition ${
                        active ? "bg-foreground/[0.08]" : "hover:bg-foreground/[0.04]"
                      }`}
                    >
                      <span className="text-base leading-none">{e.manifest.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-mono text-[11px] font-semibold text-foreground">
                          {e.manifest.name}
                        </div>
                        <div className="font-mono text-[9px] text-muted-foreground">
                          v{e.manifest.version} · {e.status}
                        </div>
                      </div>
                      {active && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Main panel */}
          <div className="min-h-[24rem]">
            <AnimatePresence mode="wait">
              {creating ? (
                <CreateExtensionPanel
                  key="create"
                  draft={manifestDraft}
                  setDraft={setManifestDraft}
                  onCreate={createExtension}
                  onCancel={() => setCreating(false)}
                  busy={busy}
                />
              ) : !selected ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-96 flex-col items-center justify-center px-4 text-center"
                >
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
                    <FileCode className="h-7 w-7 text-emerald-400" />
                  </div>
                  <p className="text-sm font-bold text-foreground">No extension selected</p>
                  <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                    Pick one from the sidebar, or tap <Plus className="inline h-3 w-3" /> to scaffold
                    a new development extension.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key={selected.manifest.id + tab}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                >
                  {/* Tabs */}
                  <div className="flex items-center gap-0.5 border-b border-border/40 px-2 py-1">
                    {(
                      [
                        { id: "manifest", label: "Manifest", icon: FileCode },
                        { id: "logs", label: "Logs", icon: ScrollText },
                        { id: "events", label: "Events", icon: Radio },
                        { id: "test", label: "Test", icon: FlaskConical },
                      ] as { id: PanelTab; label: string; icon: typeof FileCode }[]
                    ).map((t) => {
                      const active = tab === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setTab(t.id)}
                          className={`relative flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-bold transition ${
                            active
                              ? "bg-foreground/[0.08] text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <t.icon className="h-3 w-3" />
                          {t.label}
                          {t.id === "logs" && logs.length > 0 && (
                            <span className="ml-1 rounded-full bg-foreground/10 px-1 text-[9px] tabular-nums">
                              {logs.length}
                            </span>
                          )}
                        </button>
                      );
                    })}
                    <div className="ml-auto flex items-center gap-1.5 pr-1">
                      <button
                        onClick={hotReload}
                        disabled={busy}
                        className="flex items-center gap-1 rounded-md bg-cyan-500/15 px-2 py-1 font-mono text-[10px] font-bold text-cyan-400 transition hover:bg-cyan-500/25 disabled:opacity-50"
                      >
                        <RefreshCw className="h-2.5 w-2.5" /> Hot-reload
                      </button>
                    </div>
                  </div>

                  {/* Tab body */}
                  <div className="p-3">
                    {tab === "manifest" && (
                      <ManifestPanel
                        ext={selected}
                        draft={manifestDraft}
                        setDraft={setManifestDraft}
                        editing={manifestDraft.id === selected.manifest.id}
                        busy={busy}
                        validateErrors={validateErrors}
                        onValidate={() => validate(manifestDraft.id === selected.manifest.id ? manifestDraft : selected.manifest)}
                        onSubmit={() => submit(manifestDraft.id === selected.manifest.id ? manifestDraft : selected.manifest)}
                      />
                    )}

                    {tab === "logs" && <LogsPanel logs={logs} />}

                    {tab === "events" && (
                      <EventsPanel
                        events={events}
                        filter={eventFilter}
                        setFilter={setEventFilter}
                      />
                    )}

                    {tab === "test" && (
                      <TestPanel
                        simulateForm={simulateForm}
                        setSimulateForm={setSimulateForm}
                        replayFilter={replayFilter}
                        setReplayFilter={setReplayFilter}
                        onSimulate={simulateRide}
                        onReplay={replay}
                        busy={busy}
                        result={testResult}
                      />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-3">
        <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Hot-reload friendly.</span> The plugin
          runtime preserves logs and event counters across reloads. Validate your manifest before
          submit — Oryx reviews every extension before it reaches the store.
        </p>
      </div>
    </div>
  );
}

// ---- Sub-components --------------------------------------------------------

function HealthBadge({
  icon: Icon, label, value, color, bg,
}: { icon: typeof Cpu; label: string; value: number | string; color: string; bg: string }) {
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
      </div>
    </div>
  );
}

function CreateExtensionPanel({
  draft, setDraft, onCreate, onCancel, busy,
}: {
  draft: ExtensionManifest;
  setDraft: (m: ExtensionManifest) => void;
  onCreate: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const togglePerm = (p: ExtensionPermission) =>
    setDraft({
      ...draft,
      permissions: draft.permissions.includes(p)
        ? draft.permissions.filter((x) => x !== p)
        : [...draft.permissions, p],
    });
  const toggleHook = (h: ExtensionHook) =>
    setDraft({
      ...draft,
      hooks: draft.hooks.includes(h)
        ? draft.hooks.filter((x) => x !== h)
        : [...draft.hooks, h],
    });
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3"
    >
      <div className="mb-2 flex items-center gap-2">
        <Plus className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
          Scaffold new extension
        </span>
      </div>
      <div className="space-y-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-3">
        <div className="grid grid-cols-2 gap-2">
          <Field label="id (kebab-case)">
            <input
              value={draft.id}
              onChange={(e) => setDraft({ ...draft, id: e.target.value })}
              placeholder="campus-pool"
              className="font-mono text-xs"
            />
          </Field>
          <Field label="version">
            <input
              value={draft.version}
              onChange={(e) => setDraft({ ...draft, version: e.target.value })}
              className="font-mono text-xs"
            />
          </Field>
        </div>
        <Field label="name">
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Campus Pool"
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="developer">
            <input
              value={draft.developer}
              onChange={(e) => setDraft({ ...draft, developer: e.target.value })}
              placeholder="acme-mobility"
              className="font-mono text-xs"
            />
          </Field>
          <Field label="category">
            <input
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              placeholder="pooling"
              className="font-mono text-xs"
            />
          </Field>
        </div>
        <Field label="description">
          <textarea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            rows={2}
            placeholder="What does this extension optimize?"
            className="resize-none"
          />
        </Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="emoji">
            <input
              value={draft.emoji}
              onChange={(e) => setDraft({ ...draft, emoji: e.target.value })}
              className="text-center text-base"
            />
          </Field>
          <Field label="color">
            <input
              value={draft.color}
              onChange={(e) => setDraft({ ...draft, color: e.target.value })}
              className="font-mono text-xs"
            />
          </Field>
          <Field label="entrypoint">
            <input
              value={draft.entrypoint}
              onChange={(e) => setDraft({ ...draft, entrypoint: e.target.value })}
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

        <div className="flex gap-2 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-border/60 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-foreground/[0.04]"
          >
            Cancel
          </button>
          <button
            onClick={onCreate}
            disabled={busy}
            className="flex-[2] flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 py-2 text-xs font-bold text-emerald-950 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> {busy ? "Creating…" : "Create extension"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ManifestPanel({
  ext, draft, setDraft, editing, busy, validateErrors, onValidate, onSubmit,
}: {
  ext: ExtensionInstance;
  draft: ExtensionManifest;
  setDraft: (m: ExtensionManifest) => void;
  editing: boolean;
  busy: boolean;
  validateErrors: string[] | null;
  onValidate: () => void;
  onSubmit: () => void;
}) {
  const m = editing ? draft : ext.manifest;
  const set = (patch: Partial<ExtensionManifest>) => {
    if (!editing) setDraft({ ...ext.manifest, ...patch });
    else setDraft({ ...draft, ...patch });
  };
  const togglePerm = (p: ExtensionPermission) =>
    set({ permissions: m.permissions.includes(p) ? m.permissions.filter((x) => x !== p) : [...m.permissions, p] });
  const toggleHook = (h: ExtensionHook) =>
    set({ hooks: m.hooks.includes(h) ? m.hooks.filter((x) => x !== h) : [...m.hooks, h] });

  return (
    <div>
      {/* Manifest header */}
      <div className="mb-3 flex items-start gap-3 rounded-xl border border-border/50 bg-foreground/[0.02] p-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg"
          style={{ backgroundColor: `${m.color}20` }}
        >
          {m.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-bold text-foreground">{m.name || "(unnamed)"}</span>
            <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-muted-foreground">
              v{m.version}
            </span>
            <span className="rounded-full bg-cyan-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-cyan-400">
              {ext.status}
            </span>
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
            id: {m.id} · by {m.developer || "—"} · {ext.eventsProcessed} events processed
          </div>
          {ext.lastError && (
            <div className="mt-1 font-mono text-[10px] text-rose-400">last error: {ext.lastError}</div>
          )}
        </div>
      </div>

      {/* Editable manifest form */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          <Field label="id">
            <input
              value={m.id}
              onChange={(e) => set({ id: e.target.value })}
              onFocus={() => !editing && setDraft({ ...ext.manifest })}
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

        {/* Validation result */}
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
                <><CheckCircle2 className="h-3.5 w-3.5" /> Manifest valid</>
              ) : (
                <><XCircle className="h-3.5 w-3.5" /> {validateErrors.length} error(s)</>
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

        {/* Actions */}
        <div className="flex gap-2 pt-1">
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
            <Send className="h-3.5 w-3.5" /> Submit to Store
          </button>
        </div>
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
        <ScrollText className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground">
          No logs yet. Hot-reload or simulate an event to see live output.
        </p>
      </div>
    );
  }
  return (
    <div
      ref={scrollRef}
      className="scroll-thin max-h-96 overflow-y-auto rounded-xl border border-border/40 bg-[oklch(0.10_0.005_200)] p-2 font-mono"
    >
      {logs.map((l) => {
        const meta = LOG_COLORS[l.level];
        const LIcon = meta.icon;
        return (
          <div
            key={l.id}
            className="flex items-start gap-2 px-1 py-0.5 text-[11px] leading-snug"
          >
            <span className="shrink-0 text-muted-foreground/60 tabular-nums">
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

function EventsPanel({
  events, filter, setFilter,
}: {
  events: KernelEvent[];
  filter: string;
  setFilter: (s: string) => void;
}) {
  const filtered = filter
    ? events.filter((e) => e.type.toLowerCase().includes(filter.toLowerCase()) || e.aggregateId.toLowerCase().includes(filter.toLowerCase()))
    : events;

  return (
    <div>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter by event type or aggregate id…"
        className="mb-2 w-full rounded-lg border border-border/60 bg-background px-3 py-1.5 font-mono text-[11px] text-foreground placeholder:text-muted-foreground focus:border-cyan-500/50 focus:outline-none"
      />
      <div className="scroll-thin max-h-96 space-y-1 overflow-y-auto rounded-xl border border-border/40 bg-[oklch(0.10_0.005_200)] p-2 font-mono">
        {filtered.length === 0 ? (
          <div className="px-2 py-6 text-center text-[11px] text-muted-foreground">
            No events match.
          </div>
        ) : (
          filtered.map((e) => (
            <div
              key={e.id}
              className="flex items-start gap-2 rounded-md px-1.5 py-1 text-[10px] leading-snug hover:bg-foreground/[0.04]"
            >
              <span className="shrink-0 text-muted-foreground/60 tabular-nums">
                {tsClock(e.timestamp)}
              </span>
              <span className={`shrink-0 font-bold ${eventColor(e.type)}`}>{e.type}</span>
              <span className="flex-1 break-words text-muted-foreground">
                agg: <span className="text-foreground/80">{e.aggregateId}</span>
                {Object.keys(e.payload).length > 0 && (
                  <>
                    {" · "}
                    {Object.entries(e.payload)
                      .slice(0, 3)
                      .map(([k, v]) => `${k}=${typeof v === "object" ? "…" : String(v)}`)
                      .join(" ")}
                  </>
                )}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TestPanel({
  simulateForm, setSimulateForm, replayFilter, setReplayFilter, onSimulate, onReplay, busy, result,
}: {
  simulateForm: { origin: string; destination: string; price: number };
  setSimulateForm: (f: { origin: string; destination: string; price: number }) => void;
  replayFilter: string;
  setReplayFilter: (s: string) => void;
  onSimulate: () => void;
  onReplay: () => void;
  busy: boolean;
  result: string | null;
}) {
  return (
    <div className="space-y-3">
      {/* Simulate ride request */}
      <div className="rounded-xl border border-border/50 bg-card/40 p-3">
        <div className="mb-2 flex items-center gap-2">
          <Play className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
            Simulate ride request
          </span>
        </div>
        <p className="mb-2.5 text-[11px] text-muted-foreground">
          Publish a <code className="font-mono text-cyan-300">ride.simulated</code> event into the
          kernel. Connected extensions react via their hooks.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <input
            value={simulateForm.origin}
            onChange={(e) => setSimulateForm({ ...simulateForm, origin: e.target.value })}
            placeholder="Origin"
            className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs text-foreground focus:border-cyan-500/50 focus:outline-none"
          />
          <input
            value={simulateForm.destination}
            onChange={(e) => setSimulateForm({ ...simulateForm, destination: e.target.value })}
            placeholder="Destination"
            className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs text-foreground focus:border-cyan-500/50 focus:outline-none"
          />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[10px] font-medium uppercase text-muted-foreground">GH₵</span>
          <input
            type="number"
            step="0.5"
            value={simulateForm.price}
            onChange={(e) => setSimulateForm({ ...simulateForm, price: Number(e.target.value) })}
            className="w-24 rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs tabular-nums text-foreground focus:border-cyan-500/50 focus:outline-none"
          />
          <button
            onClick={onSimulate}
            disabled={busy}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-cyan-950 transition hover:bg-cyan-400 disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5" /> Simulate
          </button>
        </div>
      </div>

      {/* Replay events */}
      <div className="rounded-xl border border-border/50 bg-card/40 p-3">
        <div className="mb-2 flex items-center gap-2">
          <History className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
            Replay events
          </span>
        </div>
        <p className="mb-2.5 text-[11px] text-muted-foreground">
          Re-publish events from the event store that match a filter (substring of event type).
        </p>
        <div className="flex items-center gap-2">
          <input
            value={replayFilter}
            onChange={(e) => setReplayFilter(e.target.value)}
            placeholder="intent"
            className="flex-1 rounded-lg border border-border/60 bg-background px-3 py-1.5 font-mono text-xs text-foreground focus:border-amber-500/50 focus:outline-none"
          />
          <button
            onClick={onReplay}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-amber-950 transition hover:bg-amber-400 disabled:opacity-50"
          >
            <History className="h-3.5 w-3.5" /> Replay
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-3 font-mono text-[11px] text-emerald-300"
        >
          <div className="flex items-center gap-1.5 font-bold">
            <CheckCircle2 className="h-3.5 w-3.5" /> Result
          </div>
          <div className="mt-1">{result}</div>
        </motion.div>
      )}
    </div>
  );
}

// ---- Generic primitives ----------------------------------------------------

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label
      className="block [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-border/60 [&_input]:bg-background [&_input]:px-3 [&_input]:py-2 [&_input]:text-sm [&_input]:text-foreground [&_input]:placeholder:text-muted-foreground [&_input]:focus:border-emerald-500/50 [&_input]:focus:outline-none [&_textarea]:w-full [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-border/60 [&_textarea]:bg-background [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:text-sm [&_textarea]:text-foreground [&_textarea]:placeholder:text-muted-foreground [&_textarea]:focus:border-emerald-500/50 [&_textarea]:focus:outline-none"
    >
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function MultiSelect<T extends string>({
  label, options, selected, onToggle,
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

function eventColor(type: string): string {
  if (type.startsWith("connector")) return "text-cyan-400";
  if (type.startsWith("intent")) return "text-emerald-400";
  if (type.startsWith("agent")) return "text-amber-400";
  if (type.startsWith("graph")) return "text-violet-400";
  if (type.startsWith("extension")) return "text-pink-400";
  if (type.startsWith("calendar")) return "text-emerald-300";
  return "text-muted-foreground";
}

export default DeveloperConsole;
