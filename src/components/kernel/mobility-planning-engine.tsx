"use client";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import {
  Calendar,
  Plus,
  Trash2,
  Clock,
  MapPin,
  Repeat,
  Check,
  Sparkles,
  Brain,
  Zap,
  Users,
  RotateCcw,
  Footprints,
  Package,
  Timer,
  ArrowRight,
  AlertCircle,
  AlertTriangle,
  TrendingDown,
  X,
  ChevronDown,
  ChevronRight,
  List as ListIcon,
  Columns3,
  Rows3,
  CalendarDays,
  TrafficCone,
  CalendarClock,
  Wallet,
  Lightbulb,
  Loader2,
  Activity,
  Ban,
  LayoutGrid,
  ScrollText,
} from "lucide-react";

// ---- Kernel domain types (mirrored from src/lib/kernel/types.ts) ------------
type CalendarView = "predictable" | "short_notice";
type SubView = "timeline" | "day" | "week" | "list";
type Priority = "low" | "normal" | "high" | "critical";
type SuggestionKind =
  | "shift"
  | "pool"
  | "return_ride"
  | "multimodal"
  | "subscription"
  | "batch"
  | "traffic"
  | "calendar_adjust";

interface KernelSuggestion {
  id: string;
  kind: SuggestionKind;
  title: string;
  detail: string;
  saving?: number;
  co2?: number;
  confidence: number;
  data?: Record<string, unknown>;
}

interface CostPrediction {
  time: string;
  cost: number;
  surge: number;
  demand: "low" | "medium" | "high";
  confidence: number;
}

interface CostOverTime {
  baseline: number;
  predictions: CostPrediction[];
  cheapestSlot?: { time: string; cost: number; saving: number };
  peakSlot?: { time: string; cost: number };
}

interface KernelIntent {
  id: string;
  userId: string;
  type: string;
  horizon: CalendarView;
  title: string;
  origin: string;
  destination: string;
  arriveBy?: string;
  recurring?: { days: number[]; time: string };
  priority: Priority;
  status: string;
  suggestions?: KernelSuggestion[];
  costOverTime?: CostOverTime;
  estimatedCost?: number;
  createdAt: number;
  updatedAt: number;
}

interface KernelCalendarEvent {
  id: string;
  userId: string;
  intentId?: string;
  title: string;
  view: CalendarView;
  origin: string;
  destination: string;
  start: string;
  end?: string;
  recurring?: { days: number[]; time: string };
  planSpan?: "hourly" | "daily" | "weekly" | "monthly";
  travelWindow?: { flexibilityMin: number };
  priority: Priority;
  optimized: boolean;
  saving?: number;
  lane?: number;
  createdAt: number;
}

interface KernelConflict {
  id: string;
  intentIds: string[];
  type: "overlap" | "insufficient_gap" | "double_booking";
  severity: "warning" | "error";
  detail: string;
  resolution?: string;
}

// ---- Static maps -----------------------------------------------------------

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_FULL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const VIEW_TABS: { id: CalendarView; label: string; sub: string }[] = [
  { id: "predictable", label: "Predictable Trips", sub: "Recurring · schedule-driven" },
  { id: "short_notice", label: "Short Notice Trips", sub: "One-off · right now / soon" },
];

const SUB_VIEW_TABS: { id: SubView; label: string; icon: typeof Clock }[] = [
  { id: "timeline", label: "Timeline", icon: ScrollText },
  { id: "day", label: "Day", icon: Columns3 },
  { id: "week", label: "Week", icon: LayoutGrid },
  { id: "list", label: "List", icon: ListIcon },
];

const PLAN_SPANS: { id: "hourly" | "daily" | "weekly" | "monthly"; label: string }[] = [
  { id: "hourly", label: "Hourly" },
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

const SUGGESTION_META: Record<
  SuggestionKind,
  { icon: typeof Clock; color: string; bg: string; ring: string; label: string }
> = {
  shift: {
    icon: Timer,
    color: "text-cyan-400",
    bg: "bg-cyan-500/15",
    ring: "ring-cyan-500/20",
    label: "Shift",
  },
  pool: {
    icon: Users,
    color: "text-violet-400",
    bg: "bg-violet-500/15",
    ring: "ring-violet-500/20",
    label: "Pool",
  },
  return_ride: {
    icon: RotateCcw,
    color: "text-amber-400",
    bg: "bg-amber-500/15",
    ring: "ring-amber-500/20",
    label: "Return",
  },
  multimodal: {
    icon: Footprints,
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    ring: "ring-emerald-500/20",
    label: "Multi-modal",
  },
  subscription: {
    icon: Repeat,
    color: "text-pink-400",
    bg: "bg-pink-500/15",
    ring: "ring-pink-500/20",
    label: "Subscription",
  },
  batch: {
    icon: Package,
    color: "text-orange-400",
    bg: "bg-orange-500/15",
    ring: "ring-orange-500/20",
    label: "Batch",
  },
  traffic: {
    icon: TrafficCone,
    color: "text-rose-400",
    bg: "bg-rose-500/15",
    ring: "ring-rose-500/20",
    label: "Traffic",
  },
  calendar_adjust: {
    icon: CalendarClock,
    color: "text-sky-400",
    bg: "bg-sky-500/15",
    ring: "ring-sky-500/20",
    label: "Calendar",
  },
};

// priority: critical=rose, high=amber, normal=emerald, low=zinc
const PRIORITY_META: Record<
  Priority,
  { label: string; chip: string; dot: string; bar: string; card: string; text: string }
> = {
  low: {
    label: "Low",
    chip: "bg-zinc-500/15 text-zinc-400 ring-zinc-500/20",
    dot: "bg-zinc-400",
    bar: "bg-zinc-500/70",
    card: "border-l-zinc-500/60",
    text: "text-zinc-300",
  },
  normal: {
    label: "Normal",
    chip: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/20",
    dot: "bg-emerald-400",
    bar: "bg-emerald-500/80",
    card: "border-l-emerald-500/70",
    text: "text-emerald-300",
  },
  high: {
    label: "High",
    chip: "bg-amber-500/15 text-amber-400 ring-amber-500/20",
    dot: "bg-amber-400",
    bar: "bg-amber-500/80",
    card: "border-l-amber-500/70",
    text: "text-amber-300",
  },
  critical: {
    label: "Critical",
    chip: "bg-rose-500/15 text-rose-400 ring-rose-500/20",
    dot: "bg-rose-400",
    bar: "bg-rose-500/80",
    card: "border-l-rose-500/70",
    text: "text-rose-300",
  },
};

const TIMELINE_START_HOUR = 5; // 5:00
const TIMELINE_END_HOUR = 23; // 23:00
const TIMELINE_HOURS = TIMELINE_END_HOUR - TIMELINE_START_HOUR; // 18
const PX_PER_HOUR = 64; // 64px per hour in timeline
const TIMELINE_HEIGHT = TIMELINE_HOURS * PX_PER_HOUR;

// ---- Helpers ---------------------------------------------------------------

function parseHourFloat(time: string): number {
  if (!time) return 8;
  if (time.includes("T")) {
    const d = new Date(time);
    if (!isNaN(d.getTime())) return d.getHours() + d.getMinutes() / 60;
    return 8;
  }
  const [h, m] = time.split(":").map(Number);
  return (h || 0) + (m || 0) / 60;
}

function formatHHMM(time: string): string {
  if (!time) return "—";
  if (time.includes("T")) {
    const d = new Date(time);
    if (!isNaN(d.getTime())) {
      return `${String(d.getHours()).padStart(2, "0")}:${String(
        d.getMinutes()
      ).padStart(2, "0")}`;
    }
    return time;
  }
  return time;
}

function formatTime(start: string): string {
  if (/^\d{2}:\d{2}$/.test(start)) return start;
  const d = new Date(start);
  if (!isNaN(d.getTime())) {
    return d.toLocaleString(undefined, {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return start;
}

function formatDays(days?: number[]): string {
  if (!days || days.length === 0) return "Once";
  if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d)))
    return "Weekdays";
  if (days.length === 7) return "Daily";
  return [...days].sort().map((d) => DAY_FULL[d]).join(", ");
}

function money(n?: number): string {
  if (n == null) return "—";
  return `GH₵${n.toFixed(2)}`;
}

function totalSaving(intent?: KernelIntent): number {
  if (!intent?.suggestions) return 0;
  const max = intent.suggestions.reduce(
    (m, s) => Math.max(m, s.saving || 0),
    0
  );
  return max;
}

function allSavingsSum(intents: KernelIntent[]): number {
  return intents.reduce(
    (sum, i) =>
      sum + (i.suggestions?.reduce((s, x) => s + (x.saving || 0), 0) || 0),
    0
  );
}

// Greedy lane packing — assigns horizontal lanes so overlapping events don't
// stack on top of each other in the timeline view.
function assignLanes(events: KernelCalendarEvent[]): Map<string, number> {
  const sorted = [...events].sort(
    (a, b) => parseHourFloat(a.start) - parseHourFloat(b.start)
  );
  const lanes: number[] = []; // laneEnds[]
  const out = new Map<string, number>();
  for (const ev of sorted) {
    const start = parseHourFloat(ev.start);
    let assigned = -1;
    for (let i = 0; i < lanes.length; i++) {
      if (start >= lanes[i] - 0.25) {
        // at least 15 min gap before next event on this lane
        assigned = i;
        break;
      }
    }
    if (assigned === -1) {
      assigned = lanes.length;
      lanes.push(0);
    }
    lanes[assigned] = start + 0.5; // event takes ~30 min slot
    out.set(ev.id, assigned);
  }
  return out;
}

// ---- Component -------------------------------------------------------------

interface Props {
  /** Render in compact/preview mode (used by half-snap) */
  compact?: boolean;
}

export function MobilityPlanningEngine({ compact = false }: Props) {
  const [view, setView] = useState<CalendarView>("predictable");
  const [subView, setSubView] = useState<SubView>("timeline");
  const [events, setEvents] = useState<KernelCalendarEvent[]>([]);
  const [intents, setIntents] = useState<KernelIntent[]>([]);
  const [conflicts, setConflicts] = useState<KernelConflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [conflictsOpen, setConflictsOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    origin: "",
    destination: "",
    time: "08:00",
    priority: "normal" as Priority,
    days: [1, 2, 3, 4, 5] as number[],
    planSpan: "weekly" as "hourly" | "daily" | "weekly" | "monthly",
    flexibilityMin: 15,
    notes: "",
  });

  const fetchEvents = useCallback(async (v: CalendarView) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/kernel/calendar?userId=demo&view=${v}`,
        { cache: "no-store" }
      );
      const data = (await res.json()) as KernelCalendarEvent[];
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchIntents = useCallback(async () => {
    try {
      const res = await fetch(`/api/kernel/intents?userId=demo`, {
        cache: "no-store",
      });
      const data = (await res.json()) as KernelIntent[];
      setIntents(data);
    } catch {
      setIntents([]);
    }
  }, []);

  const fetchConflicts = useCallback(async () => {
    try {
      const res = await fetch(`/api/kernel/conflicts?userId=demo`, {
        cache: "no-store",
      });
      const data = (await res.json()) as KernelConflict[];
      setConflicts(data);
    } catch {
      setConflicts([]);
    }
  }, []);

  useEffect(() => {
    fetchEvents(view);
  }, [view, fetchEvents]);

  // Poll intents every 5s (continuous re-optimization).
  useEffect(() => {
    fetchIntents();
    fetchConflicts();
    const id = setInterval(() => {
      fetchIntents();
      fetchConflicts();
    }, 5000);
    return () => clearInterval(id);
  }, [fetchIntents, fetchConflicts]);

  // Build a lookup from intentId OR title to the intent (the calendar API
  // stores intentId but the older seed data may not link them).
  const intentById = useMemo(() => {
    const m = new Map<string, KernelIntent>();
    for (const i of intents) m.set(i.id, i);
    return m;
  }, [intents]);
  const intentByTitle = useMemo(() => {
    const m = new Map<string, KernelIntent>();
    for (const i of intents) m.set(i.title, i);
    return m;
  }, [intents]);

  const intentForEvent = useCallback(
    (ev: KernelCalendarEvent): KernelIntent | undefined => {
      if (ev.intentId && intentById.has(ev.intentId))
        return intentById.get(ev.intentId);
      return intentByTitle.get(ev.title);
    },
    [intentById, intentByTitle]
  );

  const totalSuggestions = intents.reduce(
    (s, i) => s + (i.suggestions?.length || 0),
    0
  );
  const optimizingCount = intents.filter(
    (i) => i.status === "optimizing" || i.status === "predicted"
  ).length;
  const totalPotentialSavings = allSavingsSum(intents);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) || null,
    [events, selectedEventId]
  );
  const selectedIntent = useMemo(
    () => (selectedEvent ? intentForEvent(selectedEvent) : undefined),
    [selectedEvent, intentForEvent]
  );

  const toggleDay = (d: number) =>
    setForm((f) => ({
      ...f,
      days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d].sort(),
    }));

  const resetForm = () =>
    setForm({
      title: "",
      origin: "",
      destination: "",
      time: "08:00",
      priority: "normal",
      days: [1, 2, 3, 4, 5],
      planSpan: "weekly",
      flexibilityMin: 15,
      notes: "",
    });

  const save = async () => {
    if (!form.title || !form.origin || !form.destination) {
      toast.error("Fill in title, origin and destination");
      return;
    }
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        userId: "demo",
        title: form.title,
        origin: form.origin,
        destination: form.destination,
        view,
        priority: form.priority,
        planSpan: form.planSpan,
        travelWindow: { flexibilityMin: form.flexibilityMin },
        notes: form.notes,
        policy: { allowedModes: ["ride", "shuttle", "walk"] },
        dependencies: [],
      };
      if (view === "predictable") {
        body.start = form.time;
        body.recurring = { days: form.days, time: form.time };
      } else {
        body.start = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      }
      const res = await fetch("/api/kernel/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("failed");
      toast.success("Plan added", {
        description: "Kernel derived a Mobility Intent — optimizing now.",
      });
      setAdding(false);
      resetForm();
      await Promise.all([fetchEvents(view), fetchIntents(), fetchConflicts()]);
    } catch {
      toast.error("Could not save plan");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await fetch(`/api/kernel/calendar?id=${id}`, { method: "DELETE" });
      toast("Plan removed", { description: "Intent and suggestions cleared." });
      if (selectedEventId === id) setSelectedEventId(null);
      await Promise.all([fetchEvents(view), fetchIntents(), fetchConflicts()]);
    } catch {
      toast.error("Could not remove plan");
    }
  };

  // ---- Compact mode (half-snap) -------------------------------------------
  if (compact) {
    return (
      <CompactMode
        view={view}
        setView={setView}
        events={events}
        intents={intents}
        intentForEvent={intentForEvent}
        loading={loading}
        potentialSavings={totalPotentialSavings}
        onAdd={() => setAdding(true)}
        adding={adding}
        busy={busy}
        form={form}
        setForm={setForm}
        toggleDay={toggleDay}
        save={save}
        resetForm={resetForm}
        onCancelAdd={() => setAdding(false)}
        onOpenEvent={(id) => setSelectedEventId(id)}
        selectedEventId={selectedEventId}
        selectedEvent={selectedEvent}
        selectedIntent={selectedIntent}
        onCloseDetail={() => setSelectedEventId(null)}
      />
    );
  }

  return (
    <div className="px-4 pb-8 pt-3">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-400">
            <Calendar className="h-3 w-3" /> Mobility Planning Engine
          </div>
          <h2 className="mt-2 text-lg font-black tracking-tight text-foreground text-balance sm:text-xl">
            Every event becomes a Mobility Intent
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            The AI optimizes each intent for cheaper departures, pools, return
            rides, subscriptions, and multi-modal routes — continuously.
          </p>
        </div>
        <button
          onClick={() => setAdding((a) => !a)}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-emerald-950 transition hover:bg-emerald-400"
        >
          <Plus className="h-3.5 w-3.5" /> Add plan
        </button>
      </div>

      {/* Optimization status banner */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-3 overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/[0.12] via-emerald-500/[0.05] to-transparent"
      >
        <div className="flex items-center gap-3 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20">
            <motion.span
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
            >
              <Brain className="h-5 w-5 text-cyan-400" />
            </motion.span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wide text-cyan-400">
              Optimization live
            </div>
            <div className="truncate text-sm font-bold text-foreground">
              {optimizingCount} intent{optimizingCount === 1 ? "" : "s"} being
              optimized · {totalSuggestions} suggestions found
            </div>
          </div>
          <div className="hidden shrink-0 items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1.5 text-emerald-400 sm:flex">
            <TrendingDown className="h-3.5 w-3.5" />
            <span className="text-xs font-bold tabular-nums">
              {money(totalPotentialSavings)}
            </span>
            <span className="text-[9px] uppercase">potential</span>
          </div>
          {conflicts.length > 0 && (
            <button
              onClick={() => setConflictsOpen((o) => !o)}
              className="flex shrink-0 items-center gap-1 rounded-lg bg-rose-500/15 px-2.5 py-1.5 text-rose-400 transition hover:bg-rose-500/25"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="text-xs font-bold tabular-nums">
                {conflicts.length}
              </span>
              <span className="text-[9px] uppercase">conflict{conflicts.length === 1 ? "" : "s"}</span>
              <motion.span animate={{ rotate: conflictsOpen ? 180 : 0 }}>
                <ChevronDown className="h-3 w-3" />
              </motion.span>
            </button>
          )}
        </div>
        {/* Conflicts expansion */}
        <AnimatePresence>
          {conflictsOpen && conflicts.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-rose-500/20 bg-rose-500/[0.04]"
            >
              <div className="space-y-1.5 p-3">
                {conflicts.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/[0.06] p-2"
                  >
                    <AlertTriangle
                      className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                        c.severity === "error"
                          ? "text-rose-400"
                          : "text-amber-400"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`rounded px-1 py-0.5 text-[8px] font-bold uppercase ${
                            c.severity === "error"
                              ? "bg-rose-500/20 text-rose-400"
                              : "bg-amber-500/20 text-amber-400"
                          }`}
                        >
                          {c.type.replace("_", " ")}
                        </span>
                        <span className="text-[11px] font-semibold text-foreground">
                          {c.detail}
                        </span>
                      </div>
                      {c.resolution && (
                        <div className="mt-0.5 text-[10px] text-muted-foreground">
                          <span className="font-semibold text-emerald-400">
                            Fix:
                          </span>{" "}
                          {c.resolution}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* View toggle */}
      <div className="relative mb-3 flex rounded-2xl border border-border/50 bg-card/40 p-1">
        {VIEW_TABS.map((t) => {
          const active = view === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className="relative flex flex-1 flex-col items-start gap-0.5 rounded-xl px-3 py-2 text-left transition"
            >
              {active && (
                <motion.div
                  layoutId="mpe-view-active"
                  className="absolute inset-0 rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/30"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span
                className={`relative text-xs font-bold ${
                  active ? "text-emerald-400" : "text-muted-foreground"
                }`}
              >
                {t.label}
              </span>
              <span
                className={`relative text-[10px] ${
                  active ? "text-muted-foreground" : "text-muted-foreground/60"
                }`}
              >
                {t.sub}
              </span>
            </button>
          );
        })}
      </div>

      {/* Editor form */}
      <EventEditor
        open={adding}
        view={view}
        form={form}
        setForm={setForm}
        toggleDay={toggleDay}
        save={save}
        busy={busy}
        onClose={() => setAdding(false)}
      />

      {/* Sub-view tabs */}
      <div className="mb-3 flex items-center gap-1 rounded-xl border border-border/40 bg-card/30 p-1">
        {SUB_VIEW_TABS.map((t) => {
          const active = subView === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setSubView(t.id)}
              className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-bold transition ${
                active
                  ? "bg-foreground/[0.08] text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Content area */}
      {loading ? (
        <LoadingSkeletons />
      ) : events.length === 0 ? (
        <EmptyState view={view} onAdd={() => setAdding(true)} />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={subView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {subView === "timeline" && (
              <TimelineView
                events={events}
                intentForEvent={intentForEvent}
                onSelect={setSelectedEventId}
                selectedId={selectedEventId}
              />
            )}
            {subView === "day" && (
              <DayView
                events={events}
                intentForEvent={intentForEvent}
                onSelect={setSelectedEventId}
                selectedId={selectedEventId}
              />
            )}
            {subView === "week" && (
              <WeekView
                events={events}
                intentForEvent={intentForEvent}
                onSelect={setSelectedEventId}
                selectedId={selectedEventId}
              />
            )}
            {subView === "list" && (
              <ListView
                events={events}
                intentForEvent={intentForEvent}
                onSelect={setSelectedEventId}
                selectedId={selectedEventId}
                onRemove={remove}
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Selected event detail dialog */}
      <EventDetailDialog
        event={selectedEvent}
        intent={selectedIntent}
        onClose={() => setSelectedEventId(null)}
        onRemove={(id) => {
          remove(id);
        }}
      />

      {/* Footer explainer */}
      <div className="mt-4 flex items-start gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/[0.04] p-3">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">
            Every event becomes an intent.
          </span>{" "}
          The Planning Engine derives a Mobility Intent from each calendar
          entry, then runs the optimizer continuously — surfacing cheaper
          departures, pools, return rides, subscriptions, and multi-modal routes
          as live suggestions.
        </p>
      </div>
    </div>
  );
}

// ---- Compact mode (half-snap) ----------------------------------------------

interface CompactModeProps {
  view: CalendarView;
  setView: (v: CalendarView) => void;
  events: KernelCalendarEvent[];
  intents: KernelIntent[];
  intentForEvent: (e: KernelCalendarEvent) => KernelIntent | undefined;
  loading: boolean;
  potentialSavings: number;
  onAdd: () => void;
  adding: boolean;
  busy: boolean;
  form: CompactFormShape;
  setForm: React.Dispatch<
    React.SetStateAction<CompactFormShape>
  >;
  toggleDay: (d: number) => void;
  save: () => void;
  resetForm: () => void;
  onCancelAdd: () => void;
  onOpenEvent: (id: string) => void;
  selectedEventId: string | null;
  selectedEvent: KernelCalendarEvent | null;
  selectedIntent?: KernelIntent;
  onCloseDetail: () => void;
}

type CompactFormShape = {
  title: string;
  origin: string;
  destination: string;
  time: string;
  priority: Priority;
  days: number[];
  planSpan: "hourly" | "daily" | "weekly" | "monthly";
  flexibilityMin: number;
  notes: string;
};

function CompactMode({
  view,
  setView,
  events,
  intentForEvent,
  loading,
  potentialSavings,
  onAdd,
  adding,
  busy,
  form,
  setForm,
  toggleDay,
  save,
  onCancelAdd,
  onOpenEvent,
  selectedEventId,
  selectedEvent,
  selectedIntent,
  onCloseDetail,
}: CompactModeProps) {
  const next3 = useMemo(() => {
    const now = new Date();
    const nowH = now.getHours() + now.getMinutes() / 60;
    return [...events]
      .filter((e) => {
        const h = parseHourFloat(e.start);
        return h >= nowH || h >= TIMELINE_START_HOUR;
      })
      .sort((a, b) => parseHourFloat(a.start) - parseHourFloat(b.start))
      .slice(0, 3);
  }, [events]);

  return (
    <div className="px-4 pb-4 pt-1">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
          <Calendar className="h-3 w-3" /> Planning Engine
        </div>
        <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-400">
          <TrendingDown className="h-3 w-3" />
          <span className="text-[10px] font-bold tabular-nums">
            {money(potentialSavings)}
          </span>
        </div>
      </div>

      {/* View toggle (compact) */}
      <div className="relative mb-2 flex rounded-xl border border-border/50 bg-card/40 p-0.5">
        {VIEW_TABS.map((t) => {
          const active = view === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className="relative flex-1 rounded-lg px-2 py-1.5 text-[10px] font-bold transition"
            >
              {active && (
                <motion.div
                  layoutId="mpe-compact-view-active"
                  className="absolute inset-0 rounded-lg bg-emerald-500/15 ring-1 ring-emerald-500/30"
                />
              )}
              <span
                className={`relative ${
                  active ? "text-emerald-400" : "text-muted-foreground"
                }`}
              >
                {t.label.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Inline editor (compact) */}
      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <EventEditorBody
              view={view}
              form={form}
              setForm={setForm}
              toggleDay={toggleDay}
              save={save}
              busy={busy}
              onClose={onCancelAdd}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact list — next 3 events with top suggestion */}
      {loading ? (
        <div className="space-y-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-border/40 bg-card/30"
            />
          ))}
        </div>
      ) : next3.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 p-4 text-center">
          <Calendar className="mx-auto mb-1.5 h-5 w-5 text-muted-foreground" />
          <p className="text-[11px] text-muted-foreground">
            No trips scheduled. Tap "Add" to let the AI optimize.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {next3.map((ev) => {
            const intent = intentForEvent(ev);
            const topSug = intent?.suggestions?.[0];
            const meta = topSug
              ? SUGGESTION_META[topSug.kind]
              : null;
            const SIcon = meta?.icon;
            return (
              <button
                key={ev.id}
                onClick={() => onOpenEvent(ev.id)}
                className="flex w-full items-center gap-2.5 rounded-xl border border-border/50 bg-card/50 p-2.5 text-left transition hover:bg-card/70"
              >
                <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <span className="text-[10px] font-bold tabular-nums">
                    {formatHHMM(ev.start)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-[12px] font-bold text-foreground">
                    {ev.title}
                  </div>
                  <div className="truncate text-[10px] text-muted-foreground">
                    {ev.origin} → {ev.destination}
                  </div>
                  {topSug && SIcon && meta ? (
                    <div className="mt-0.5 flex items-center gap-1">
                      <SIcon className={`h-2.5 w-2.5 ${meta.color}`} />
                      <span className="truncate text-[10px] text-muted-foreground">
                        {topSug.title}
                      </span>
                      {topSug.saving ? (
                        <span className="ml-auto shrink-0 text-[10px] font-bold text-emerald-400 tabular-nums">
                          −{money(topSug.saving)}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-0.5 flex items-center gap-1 text-[10px] text-cyan-400">
                      <Loader2 className="h-2.5 w-2.5 animate-spin" /> optimizing…
                    </div>
                  )}
                </div>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={onAdd}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-emerald-500/40 bg-emerald-500/[0.04] py-2 text-[11px] font-bold text-emerald-400 transition hover:bg-emerald-500/[0.08]"
      >
        <Plus className="h-3 w-3" /> Add plan
      </button>

      {/* Detail dialog (compact mode also opens it) */}
      <EventDetailDialog
        event={selectedEvent}
        intent={selectedIntent}
        onClose={onCloseDetail}
        onRemove={(id) => {
          fetch(`/api/kernel/calendar?id=${id}`, { method: "DELETE" });
          onCloseDetail();
        }}
      />
    </div>
  );
}

// ---- Event editor ----------------------------------------------------------

interface EventEditorProps {
  open: boolean;
  view: CalendarView;
  form: CompactFormShape;
  setForm: React.Dispatch<React.SetStateAction<CompactFormShape>>;
  toggleDay: (d: number) => void;
  save: () => void;
  busy: boolean;
  onClose: () => void;
}

function EventEditor({
  open,
  view,
  form,
  setForm,
  toggleDay,
  save,
  busy,
  onClose,
}: EventEditorProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-3 overflow-hidden"
        >
          <EventEditorBody
            view={view}
            form={form}
            setForm={setForm}
            toggleDay={toggleDay}
            save={save}
            busy={busy}
            onClose={onClose}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function EventEditorBody({
  view,
  form,
  setForm,
  toggleDay,
  save,
  busy,
  onClose,
}: Omit<EventEditorProps, "open">) {
  return (
    <div className="space-y-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.04] p-3.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
          New Mobility Plan
        </span>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <input
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        placeholder="Title (e.g. Office commute, Airport trip, School run)"
        className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-emerald-500/50 focus:outline-none"
      />

      <div className="grid grid-cols-2 gap-2">
        <input
          value={form.origin}
          onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))}
          placeholder="From (origin)"
          className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-emerald-500/50 focus:outline-none"
        />
        <input
          value={form.destination}
          onChange={(e) =>
            setForm((f) => ({ ...f, destination: e.target.value }))
          }
          placeholder="To (destination)"
          className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-emerald-500/50 focus:outline-none"
        />
      </div>

      {view === "predictable" && (
        <>
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm text-foreground focus:border-emerald-500/50 focus:outline-none"
            />
            <span className="ml-auto text-[10px] font-medium uppercase text-muted-foreground">
              Recurring days
            </span>
          </div>
          <div className="flex items-center gap-1">
            {DAY_LABELS.map((d, i) => {
              const on = form.days.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => toggleDay(i)}
                  className={`flex h-7 flex-1 items-center justify-center rounded-full text-[11px] font-bold transition ${
                    on
                      ? "bg-emerald-500 text-emerald-950"
                      : "bg-foreground/[0.05] text-muted-foreground hover:bg-foreground/10"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Priority */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-medium uppercase text-muted-foreground">
          Priority
        </span>
        {(["low", "normal", "high", "critical"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setForm((f) => ({ ...f, priority: p }))}
            className={`flex-1 rounded-lg px-2 py-1.5 text-[10px] font-bold capitalize transition ${
              form.priority === p
                ? PRIORITY_META[p].chip + " ring-1"
                : "bg-foreground/[0.04] text-muted-foreground"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Plan span */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-medium uppercase text-muted-foreground">
          Plan span
        </span>
        {PLAN_SPANS.map((s) => (
          <button
            key={s.id}
            onClick={() => setForm((f) => ({ ...f, planSpan: s.id }))}
            className={`flex-1 rounded-lg px-2 py-1.5 text-[10px] font-bold transition ${
              form.planSpan === s.id
                ? "bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30"
                : "bg-foreground/[0.04] text-muted-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Flexibility slider */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] font-medium uppercase text-muted-foreground">
          <span>Arrival flexibility</span>
          <span className="text-emerald-400">
            ±{form.flexibilityMin} min window
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={60}
          step={5}
          value={form.flexibilityMin}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              flexibilityMin: Number(e.target.value),
            }))
          }
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-foreground/10 accent-emerald-500"
          style={{
            background: `linear-gradient(to right, oklch(0.72 0.17 158) ${
              (form.flexibilityMin / 60) * 100
            }%, oklch(1 0 0 / 0.1) ${(form.flexibilityMin / 60) * 100}%)`,
          }}
        />
        <div className="flex justify-between text-[9px] text-muted-foreground/60">
          <span>Exact</span>
          <span>15m</span>
          <span>30m</span>
          <span>45m</span>
          <span>±1h</span>
        </div>
      </div>

      {/* Notes */}
      <input
        value={form.notes}
        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        placeholder="Notes (optional — e.g. need car seat, must arrive by 9)"
        className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-emerald-500/50 focus:outline-none"
      />

      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 rounded-lg border border-border/60 bg-card/40 py-2 text-xs font-bold text-muted-foreground transition hover:bg-card/70"
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={busy}
          className="flex flex-[2] items-center justify-center gap-1.5 rounded-lg bg-emerald-500 py-2 text-xs font-bold text-emerald-950 transition hover:bg-emerald-400 disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" /> {busy ? "Saving…" : "Save plan"}
        </button>
      </div>
    </div>
  );
}

// ---- Timeline view ---------------------------------------------------------

interface TimelineViewProps {
  events: KernelCalendarEvent[];
  intentForEvent: (e: KernelCalendarEvent) => KernelIntent | undefined;
  onSelect: (id: string) => void;
  selectedId: string | null;
}

function TimelineView({
  events,
  intentForEvent,
  onSelect,
  selectedId,
}: TimelineViewProps) {
  // Only events within the 5:00–23:00 window; out-of-window are clamped to edges
  // with a "→" indicator.
  const positioned = useMemo(() => {
    return events
      .map((ev) => {
        const h = parseHourFloat(ev.start);
        const clamped = Math.max(
          TIMELINE_START_HOUR + 0.05,
          Math.min(TIMELINE_END_HOUR - 0.1, h)
        );
        return { ev, h, clamped };
      })
      .sort((a, b) => a.h - b.h);
  }, [events]);

  const lanes = useMemo(
    () => assignLanes(events),
    [events]
  );

  const nowHour = useMemo(() => {
    const now = new Date();
    return now.getHours() + now.getMinutes() / 60;
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  // Auto-scroll to current time on mount.
  useEffect(() => {
    if (!containerRef.current) return;
    const targetTop = Math.max(
      0,
      (Math.max(TIMELINE_START_HOUR, Math.min(TIMELINE_END_HOUR, nowHour)) -
        TIMELINE_START_HOUR) *
        PX_PER_HOUR -
        100
    );
    containerRef.current.scrollTop = targetTop;
  }, []);

  const laneCount = Math.max(1, ...Array.from(lanes.values()).map((x) => x + 1));
  const laneWidth = 220;
  const trackWidth = laneCount * laneWidth;

  return (
    <div
      ref={containerRef}
      className="scroll-thin max-h-[420px] overflow-y-auto rounded-2xl border border-border/50 bg-card/30"
    >
      <div
        className="relative"
        style={{
          height: `${TIMELINE_HEIGHT + 16}px`,
          paddingLeft: "52px",
          paddingRight: "12px",
          paddingTop: "8px",
        }}
      >
        {/* Hour gridlines + labels */}
        {Array.from({ length: TIMELINE_HOURS + 1 }, (_, i) => {
          const hour = TIMELINE_START_HOUR + i;
          const top = i * PX_PER_HOUR;
          return (
            <div
              key={hour}
              className="absolute left-0 right-0 flex items-center"
              style={{ top: `${top + 8}px` }}
            >
              <div className="w-12 shrink-0 pr-2 text-right text-[10px] font-bold tabular-nums text-muted-foreground">
                {String(hour).padStart(2, "0")}:00
              </div>
              <div className="h-px flex-1 bg-border/40" />
            </div>
          );
        })}

        {/* Now line */}
        {nowHour >= TIMELINE_START_HOUR && nowHour <= TIMELINE_END_HOUR && (
          <div
            className="absolute left-12 right-3 z-10 flex items-center"
            style={{
              top: `${
                (nowHour - TIMELINE_START_HOUR) * PX_PER_HOUR + 8
              }px`,
            }}
          >
            <div className="-ml-1 mr-1 rounded bg-emerald-500 px-1 py-0.5 text-[8px] font-bold uppercase text-emerald-950">
              Now
            </div>
            <div className="h-0.5 flex-1 bg-emerald-500/80" />
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
              className="-mr-1 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30"
            />
          </div>
        )}

        {/* Event cards */}
        <div
          className="absolute top-2"
          style={{
            left: "52px",
            right: "12px",
            height: `${TIMELINE_HEIGHT}px`,
          }}
        >
          <div
            className="relative h-full"
            style={{ width: `${Math.max(trackWidth, 100)}px` }}
          >
            {positioned.map(({ ev, h, clamped }, idx) => {
              const top =
                (clamped - TIMELINE_START_HOUR) * PX_PER_HOUR;
              const lane = lanes.get(ev.id) || 0;
              const intent = intentForEvent(ev);
              const meta = PRIORITY_META[ev.priority];
              const isSelected = selectedId === ev.id;
              const outOfWindow = h !== clamped;
              return (
                <motion.button
                  key={ev.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => onSelect(ev.id)}
                  style={{
                    position: "absolute",
                    top: `${top}px`,
                    left: `${lane * laneWidth + 8}px`,
                    width: `${laneWidth - 16}px`,
                  }}
                  className={`overflow-hidden rounded-xl border border-l-4 bg-card/80 text-left backdrop-blur transition hover:bg-card ${
                    meta.card
                  } ${
                    isSelected
                      ? "ring-2 ring-emerald-400/60"
                      : "ring-1 ring-border/50"
                  }`}
                >
                  {/* Connector line back to the time axis */}
                  <div
                    className={`absolute top-1/2 h-px w-2 ${meta.bar}`}
                    style={{ left: "-8px" }}
                  />
                  <div className="p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`}
                          />
                          <span className="truncate text-[12px] font-bold text-foreground">
                            {ev.title}
                          </span>
                          {ev.recurring && (
                            <Repeat className="h-2.5 w-2.5 shrink-0 text-muted-foreground" />
                          )}
                        </div>
                        <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
                          {ev.origin} → {ev.destination}
                        </div>
                      </div>
                      <span className="shrink-0 rounded px-1 py-0.5 text-[9px] font-bold tabular-nums text-foreground/80">
                        {formatHHMM(ev.start)}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1 text-[9px]">
                      <span
                        className={`rounded px-1 py-0.5 font-bold uppercase ring-1 ${meta.chip}`}
                      >
                        {meta.label}
                      </span>
                      {intent?.estimatedCost != null && (
                        <span className="flex items-center gap-0.5 text-muted-foreground">
                          <Wallet className="h-2.5 w-2.5" />
                          <span className="tabular-nums">
                            {money(intent.estimatedCost)}
                          </span>
                        </span>
                      )}
                      {intent?.suggestions && intent.suggestions.length > 0 && (
                        <span className="flex items-center gap-0.5 text-emerald-400">
                          <Sparkles className="h-2.5 w-2.5" />
                          {intent.suggestions.length}
                        </span>
                      )}
                      {outOfWindow && (
                        <span className="text-amber-400">↤ out of view</span>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Day view --------------------------------------------------------------

function DayView({
  events,
  intentForEvent,
  onSelect,
  selectedId,
}: TimelineViewProps) {
  // 7-column strip Mon-Sun. Show recurring days for predictable, and weekday
  // of the start date for short-notice.
  const byDay = useMemo(() => {
    const m: Record<number, KernelCalendarEvent[]> = {
      0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [],
    };
    for (const ev of events) {
      if (ev.recurring && ev.recurring.days.length > 0) {
        for (const d of ev.recurring.days) m[d].push(ev);
      } else {
        const d = new Date(ev.start).getDay();
        m[isNaN(d) ? 1 : d].push(ev);
      }
    }
    for (const k of Object.keys(m)) {
      m[Number(k)].sort(
        (a, b) => parseHourFloat(a.start) - parseHourFloat(b.start)
      );
    }
    return m;
  }, [events]);

  return (
    <div className="scroll-thin overflow-x-auto pb-1">
      <div
        className="grid min-w-[640px] gap-1.5"
        style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
      >
        {DAY_SHORT.map((d, i) => (
          <div key={d} className="flex flex-col gap-1">
            <div className="sticky top-0 z-10 rounded-lg bg-card/60 px-2 py-1 text-center text-[10px] font-bold uppercase text-muted-foreground backdrop-blur">
              {d}
              <span className="ml-1 rounded-full bg-foreground/10 px-1 text-[9px] tabular-nums">
                {byDay[i].length}
              </span>
            </div>
            <div className="space-y-1">
              {byDay[i].length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/30 py-3 text-center text-[9px] text-muted-foreground/50">
                  —
                </div>
              ) : (
                byDay[i].map((ev) => {
                  const meta = PRIORITY_META[ev.priority];
                  const intent = intentForEvent(ev);
                  const isSelected = selectedId === ev.id;
                  return (
                    <motion.button
                      key={ev.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => onSelect(ev.id)}
                      className={`w-full overflow-hidden rounded-lg border border-l-2 bg-card/60 p-2 text-left transition hover:bg-card/80 ${
                        meta.card
                      } ${isSelected ? "ring-2 ring-emerald-400/60" : ""}`}
                    >
                      <div className="flex items-center gap-1">
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`}
                        />
                        <span className="truncate text-[11px] font-bold text-foreground">
                          {ev.title}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-[9px] text-muted-foreground">
                        {formatHHMM(ev.start)} · {ev.origin} → {ev.destination}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[9px]">
                        <span
                          className={`rounded px-1 font-bold uppercase ${meta.chip}`}
                        >
                          {meta.label}
                        </span>
                        {intent?.suggestions &&
                          intent.suggestions.length > 0 && (
                            <span className="flex items-center gap-0.5 text-emerald-400">
                              <Sparkles className="h-2.5 w-2.5" />
                              {intent.suggestions.length}
                            </span>
                          )}
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Week view -------------------------------------------------------------

function WeekView({
  events,
  intentForEvent,
  onSelect,
  selectedId,
}: TimelineViewProps) {
  const cells = useMemo(() => {
    // Map<dayHourKey, event[]>
    const m = new Map<string, KernelCalendarEvent[]>();
    for (const ev of events) {
      const days = ev.recurring && ev.recurring.days.length > 0
        ? ev.recurring.days
        : [new Date(ev.start).getDay() === 0 && isNaN(new Date(ev.start).getTime()) ? 1 : new Date(ev.start).getDay()];
      const hour = Math.floor(parseHourFloat(ev.start));
      for (const d of days) {
        const k = `${d}-${hour}`;
        if (!m.has(k)) m.set(k, []);
        m.get(k)!.push(ev);
      }
    }
    return m;
  }, [events]);

  // Hours 5..22 (display), days Sun..Sat
  const hours = Array.from({ length: TIMELINE_HOURS }, (_, i) => i + TIMELINE_START_HOUR);
  const days = [0, 1, 2, 3, 4, 5, 6];

  return (
    <div className="scroll-thin overflow-auto rounded-2xl border border-border/50 bg-card/30">
      <div className="min-w-[680px]">
        {/* Header row */}
        <div
          className="sticky top-0 z-20 grid bg-card/80 backdrop-blur"
          style={{
            gridTemplateColumns: `44px repeat(7, minmax(0, 1fr))`,
          }}
        >
          <div className="border-b border-r border-border/40" />
          {DAY_SHORT.map((d) => (
            <div
              key={d}
              className="border-b border-r border-border/40 px-1 py-1.5 text-center text-[10px] font-bold uppercase text-muted-foreground last:border-r-0"
            >
              {d.slice(0, 2)}
            </div>
          ))}
        </div>
        {/* Body rows */}
        {hours.map((h) => (
          <div
            key={h}
            className="grid"
            style={{
              gridTemplateColumns: `44px repeat(7, minmax(0, 1fr))`,
            }}
          >
            <div className="border-b border-r border-border/40 px-1 py-1 text-right text-[9px] font-bold tabular-nums text-muted-foreground">
              {String(h).padStart(2, "0")}
            </div>
            {days.map((d) => {
              const evs = cells.get(`${d}-${h}`) || [];
              return (
                <div
                  key={`${d}-${h}`}
                  className="min-h-[28px] border-b border-r border-border/40 p-0.5 last:border-r-0"
                >
                  {evs.map((ev) => {
                    const meta = PRIORITY_META[ev.priority];
                    const isSelected = selectedId === ev.id;
                    const intent = intentForEvent(ev);
                    return (
                      <button
                        key={ev.id}
                        onClick={() => onSelect(ev.id)}
                        className={`mb-0.5 block w-full truncate rounded px-1 py-0.5 text-left text-[9px] font-bold transition ${
                          meta.chip
                        } ${isSelected ? "ring-1 ring-emerald-400/60" : ""}`}
                        title={`${ev.title} · ${formatHHMM(ev.start)}`}
                      >
                        <span className="flex items-center gap-0.5">
                          <span
                            className={`h-1 w-1 shrink-0 rounded-full ${meta.dot}`}
                          />
                          <span className="truncate">{ev.title}</span>
                          {intent?.suggestions &&
                            intent.suggestions.length > 0 && (
                              <Sparkles className="ml-auto h-2 w-2 shrink-0" />
                            )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- List view -------------------------------------------------------------

function ListView({
  events,
  intentForEvent,
  onSelect,
  selectedId,
  onRemove,
}: TimelineViewProps & { onRemove: (id: string) => void }) {
  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {events.map((ev, i) => {
          const intent = intentForEvent(ev);
          const meta = PRIORITY_META[ev.priority];
          const isSelected = selectedId === ev.id;
          return (
            <motion.div
              key={ev.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: i * 0.04 }}
              className={`group overflow-hidden rounded-2xl border border-l-4 bg-card/50 ${
                meta.card
              } ${isSelected ? "ring-2 ring-emerald-400/60" : ""}`}
            >
              <button
                onClick={() => onSelect(ev.id)}
                className="flex w-full items-start gap-3 p-3 text-left"
              >
                <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-foreground/[0.05] text-foreground">
                  <span className="text-[10px] font-bold tabular-nums">
                    {formatHHMM(ev.start)}
                  </span>
                  {ev.recurring && (
                    <Repeat className="mt-0.5 h-2.5 w-2.5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-foreground">
                      {ev.title}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase ring-1 ${meta.chip}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <MapPin className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate">
                      <span className="font-semibold text-foreground/80">
                        {ev.origin}
                      </span>
                      <ArrowRight className="mx-1 inline h-2.5 w-2.5" />
                      <span className="font-semibold text-foreground/80">
                        {ev.destination}
                      </span>
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] text-muted-foreground">
                    {ev.recurring && (
                      <span className="flex items-center gap-0.5">
                        <Repeat className="h-2.5 w-2.5" />{" "}
                        {formatDays(ev.recurring.days)}
                      </span>
                    )}
                    {intent?.estimatedCost != null && (
                      <span className="flex items-center gap-0.5">
                        <Wallet className="h-2.5 w-2.5" />{" "}
                        <span className="tabular-nums">
                          {money(intent.estimatedCost)}
                        </span>
                      </span>
                    )}
                    {intent && (
                      <span className="flex items-center gap-0.5 text-cyan-400">
                        <Sparkles className="h-2.5 w-2.5" /> {intent.type}
                      </span>
                    )}
                    {intent?.suggestions && intent.suggestions.length > 0 && (
                      <span className="flex items-center gap-0.5 text-emerald-400">
                        <Brain className="h-2.5 w-2.5" />
                        {intent.suggestions.length} suggestion
                        {intent.suggestions.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
              <button
                onClick={() => onRemove(ev.id)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition hover:bg-rose-500/10 hover:text-rose-400 group-hover:opacity-100"
                aria-label="Remove plan"
                style={{ position: "absolute", right: "8px", top: "8px" }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// ---- Event detail dialog ---------------------------------------------------

interface EventDetailDialogProps {
  event: KernelCalendarEvent | null;
  intent?: KernelIntent;
  onClose: () => void;
  onRemove: (id: string) => void;
}

function EventDetailDialog({
  event,
  intent,
  onClose,
  onRemove,
}: EventDetailDialogProps) {
  const open = !!event;
  return (
    <AnimatePresence>
      {open && event && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="scroll-thin max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-border/60 bg-card shadow-2xl sm:rounded-3xl"
          >
            <DetailHeader
              event={event}
              intent={intent}
              onClose={onClose}
              onRemove={() => onRemove(event.id)}
            />
            <div className="space-y-4 p-4">
              <DetailSummary event={event} intent={intent} />
              <CostChartCard intent={intent} />
              <SuggestionsCard intent={intent} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DetailHeader({
  event,
  intent,
  onClose,
  onRemove,
}: {
  event: KernelCalendarEvent;
  intent?: KernelIntent;
  onClose: () => void;
  onRemove: () => void;
}) {
  const meta = PRIORITY_META[event.priority];
  return (
    <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-border/40 bg-card/95 p-4 backdrop-blur">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold ${
          event.view === "predictable"
            ? "bg-emerald-500/15 text-emerald-400"
            : "bg-amber-500/15 text-amber-400"
        }`}
      >
        {event.view === "predictable" ? (
          <Repeat className="h-4 w-4" />
        ) : (
          <Clock className="h-4 w-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-base font-black text-foreground">
            {event.title}
          </h3>
          <span
            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ring-1 ${meta.chip}`}
          >
            {meta.label}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" /> {formatTime(event.start)}
          </span>
          <span className="flex items-center gap-0.5">
            <MapPin className="h-2.5 w-2.5" />
            <span className="font-semibold text-foreground/80">
              {event.origin}
            </span>
            <ArrowRight className="mx-0.5 inline h-2.5 w-2.5" />
            <span className="font-semibold text-foreground/80">
              {event.destination}
            </span>
          </span>
          {event.recurring && (
            <span className="flex items-center gap-0.5">
              <Repeat className="h-2.5 w-2.5" />{" "}
              {formatDays(event.recurring.days)}
            </span>
          )}
          {intent && (
            <span className="flex items-center gap-0.5 text-cyan-400">
              <Sparkles className="h-2.5 w-2.5" /> {intent.type} intent
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onRemove}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-rose-500/10 hover:text-rose-400"
        aria-label="Remove plan"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <button
        onClick={onClose}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function DetailSummary({
  event,
  intent,
}: {
  event: KernelCalendarEvent;
  intent?: KernelIntent;
}) {
  const topSaving = intent ? totalSaving(intent) : 0;
  const cost = intent?.estimatedCost;
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="rounded-xl border border-border/40 bg-background/40 p-2.5">
        <div className="text-[9px] font-bold uppercase text-muted-foreground">
          Est. cost
        </div>
        <div className="mt-0.5 flex items-center gap-1">
          <Wallet className="h-3 w-3 text-cyan-400" />
          <span className="text-sm font-black tabular-nums text-foreground">
            {cost != null ? money(cost) : "—"}
          </span>
        </div>
      </div>
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-2.5">
        <div className="text-[9px] font-bold uppercase text-emerald-400">
          Top saving
        </div>
        <div className="mt-0.5 flex items-center gap-1">
          <TrendingDown className="h-3 w-3 text-emerald-400" />
          <span className="text-sm font-black tabular-nums text-emerald-400">
            {money(topSaving)}
          </span>
        </div>
      </div>
      <div className="rounded-xl border border-border/40 bg-background/40 p-2.5">
        <div className="text-[9px] font-bold uppercase text-muted-foreground">
          Status
        </div>
        <div className="mt-0.5 flex items-center gap-1">
          {event.optimized ? (
            <Check className="h-3 w-3 text-emerald-400" />
          ) : (
            <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
          )}
          <span className="text-xs font-bold capitalize text-foreground">
            {intent?.status || "predicted"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---- Cost-over-time chart (flagship viz) -----------------------------------

function CostChartCard({ intent }: { intent?: KernelIntent }) {
  const cost = intent?.costOverTime;
  // Cache fetched cost-over-time per intentId so we never synchronously
  // reset state inside an effect — mismatched ids are filtered out at read.
  const [extra, setExtra] = useState<{
    intentId: string;
    data: CostOverTime;
  } | null>(null);

  // If intent didn't include costOverTime (un-optimized), fetch it lazily.
  useEffect(() => {
    if (!intent || intent.costOverTime) return;
    let cancelled = false;
    fetch(`/api/kernel/cost?intentId=${intent.id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: CostOverTime) => {
        if (!cancelled && d && Array.isArray(d.predictions)) {
          setExtra({ intentId: intent.id, data: d });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [intent]);

  const data =
    cost ||
    (extra && extra.intentId === intent?.id ? extra.data : null);
  if (!data || !data.predictions || data.predictions.length === 0) {
    return (
      <div className="rounded-2xl border border-border/40 bg-background/40 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            Cost over time
          </span>
        </div>
        <div className="flex h-32 items-center justify-center gap-2 text-cyan-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Computing demand curve…</span>
        </div>
      </div>
    );
  }

  const nowHour = new Date().getHours();
  const nowLabel = `${String(nowHour).padStart(2, "0")}:00`;
  const cheapest = data.cheapestSlot;
  const peak = data.peakSlot;
  const baseline = data.baseline;
  const maxCost = Math.max(...data.predictions.map((p) => p.cost));
  const minCost = Math.min(...data.predictions.map((p) => p.cost));
  const cheapestSavingPct =
    cheapest && baseline > 0
      ? Math.round((cheapest.saving / baseline) * 100)
      : 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/[0.06] via-background/40 to-background/40">
      <div className="flex items-center justify-between gap-2 border-b border-border/40 p-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-400" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-foreground">
              Cost over 24h
            </div>
            <div className="text-[10px] text-muted-foreground">
              Demand curve · surge × base fare
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          {cheapest && (
            <div className="flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2 py-1 text-emerald-400">
              <TrendingDown className="h-2.5 w-2.5" />
              <span className="font-bold tabular-nums">
                −{cheapestSavingPct}%
              </span>
              <span className="text-[9px] uppercase">if shifted</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-3">
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data.predictions}
              margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="costFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="oklch(0.72 0.17 158)"
                    stopOpacity={0.55}
                  />
                  <stop
                    offset="100%"
                    stopColor="oklch(0.72 0.17 158)"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(1 0 0 / 0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                tick={{ fill: "oklch(0.66 0.01 170)", fontSize: 9 }}
                tickLine={false}
                axisLine={{ stroke: "oklch(1 0 0 / 0.08)" }}
                interval={2}
              />
              <YAxis
                tick={{ fill: "oklch(0.66 0.01 170)", fontSize: 9 }}
                tickLine={false}
                axisLine={false}
                domain={[Math.floor(minCost * 0.9), Math.ceil(maxCost * 1.05)]}
                width={36}
                tickFormatter={(v) => `₵${v}`}
              />
              <RechartsTooltip
                cursor={{
                  stroke: "oklch(0.72 0.17 158)",
                  strokeWidth: 1,
                  strokeDasharray: "3 3",
                }}
                content={<ChartTooltip />}
              />
              <Area
                type="monotone"
                dataKey="cost"
                stroke="oklch(0.72 0.17 158)"
                strokeWidth={2}
                fill="url(#costFill)"
                dot={false}
                activeDot={{
                  r: 4,
                  fill: "oklch(0.72 0.17 158)",
                  stroke: "oklch(0.13 0.02 160)",
                  strokeWidth: 2,
                }}
              />
              {/* Current time vertical line */}
              {data.predictions.find((p) => p.time === nowLabel) && (
                <ReferenceLine
                  x={nowLabel}
                  stroke="oklch(0.78 0.16 62)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  label={{
                    value: "NOW",
                    fill: "oklch(0.78 0.16 62)",
                    fontSize: 9,
                    fontWeight: 700,
                    position: "top",
                  }}
                />
              )}
              {/* Cheapest slot — green dot */}
              {cheapest && (
                <ReferenceDot
                  x={cheapest.time}
                  y={cheapest.cost}
                  r={5}
                  fill="oklch(0.72 0.17 158)"
                  stroke="oklch(0.13 0.02 160)"
                  strokeWidth={2}
                  label={{
                    value: `₵${cheapest.cost}`,
                    fill: "oklch(0.72 0.17 158)",
                    fontSize: 9,
                    fontWeight: 700,
                    position: "bottom",
                  }}
                />
              )}
              {/* Peak slot — red dot */}
              {peak && (
                <ReferenceDot
                  x={peak.time}
                  y={peak.cost}
                  r={5}
                  fill="oklch(0.66 0.2 25)"
                  stroke="oklch(0.13 0.02 160)"
                  strokeWidth={2}
                  label={{
                    value: `₵${peak.cost}`,
                    fill: "oklch(0.66 0.2 25)",
                    fontSize: 9,
                    fontWeight: 700,
                    position: "top",
                  }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px]">
          <span className="flex items-center gap-1 text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-[oklch(0.72_0.17_158)]" />
            Predicted fare
          </span>
          {cheapest && (
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-[oklch(0.72_0.17_158)] ring-1 ring-emerald-300/40" />
              Cheapest · {cheapest.time} · ₵{cheapest.cost}
            </span>
          )}
          {peak && (
            <span className="flex items-center gap-1 text-rose-400">
              <span className="h-2 w-2 rounded-full bg-[oklch(0.66_0.2_25)]" />
              Peak · {peak.time} · ₵{peak.cost}
            </span>
          )}
          <span className="flex items-center gap-1 text-amber-400">
            <span className="h-2 w-2 rounded-sm bg-[oklch(0.78_0.16_62)]" />
            Now
          </span>
        </div>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload as CostPrediction;
  const demandColor =
    p.demand === "high"
      ? "text-rose-400"
      : p.demand === "medium"
      ? "text-amber-400"
      : "text-emerald-400";
  return (
    <div className="rounded-lg border border-border/60 bg-popover/95 px-2.5 py-1.5 text-[10px] shadow-xl">
      <div className="flex items-center gap-1.5 font-bold text-foreground">
        <Clock className="h-2.5 w-2.5" /> {p.time}
      </div>
      <div className="mt-0.5 flex items-center gap-1 text-foreground">
        <Wallet className="h-2.5 w-2.5 text-cyan-400" />
        <span className="font-bold tabular-nums">₵{p.cost}</span>
      </div>
      <div className="mt-0.5 flex items-center gap-2 text-muted-foreground">
        <span>surge ×{p.surge.toFixed(2)}</span>
        <span className={demandColor}>demand: {p.demand}</span>
      </div>
      <div className="text-[9px] text-muted-foreground">
        {p.confidence}% confidence
      </div>
    </div>
  );
}

// ---- Suggestions card ------------------------------------------------------

function SuggestionsCard({ intent }: { intent?: KernelIntent }) {
  const suggestions = intent?.suggestions || [];

  if (suggestions.length === 0) {
    return (
      <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/[0.06] p-4">
        <div className="flex items-center gap-2">
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="h-2 w-2 rounded-full bg-cyan-400"
          />
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            AI is still optimizing this intent…
          </span>
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          The kernel is scanning demand curves, pool candidates, return rides,
          and multi-modal routes. Suggestions will appear within a few seconds.
        </p>
      </div>
    );
  }

  const sorted = [...suggestions].sort(
    (a, b) => (b.saving || 0) - (a.saving || 0)
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-cyan-400" />
        <span className="text-xs font-bold uppercase tracking-wider text-foreground">
          {sorted.length} optimization{" "}
          {sorted.length === 1 ? "opportunity" : "opportunities"}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {sorted.map((s, i) => {
          const meta = SUGGESTION_META[s.kind];
          const SIcon = meta.icon;
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`flex flex-col gap-2 rounded-xl border border-border/40 bg-card/60 p-2.5 ring-1 ${meta.ring}`}
            >
              <div className="flex items-start gap-2">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${meta.bg}`}
                >
                  <SIcon className={`h-3.5 w-3.5 ${meta.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-[11px] font-bold text-foreground">
                      {s.title}
                    </span>
                    {s.saving ? (
                      <span className="flex shrink-0 items-center gap-0.5 text-[10px] font-black text-emerald-400">
                        <TrendingDown className="h-2.5 w-2.5" />
                        <span className="tabular-nums">{money(s.saving)}</span>
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
                    {s.detail}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[9px]">
                    <span className={`font-bold uppercase ${meta.color}`}>
                      {meta.label}
                    </span>
                    <span className="text-muted-foreground/60">·</span>
                    <span className="font-medium text-muted-foreground tabular-nums">
                      {s.confidence}% confidence
                    </span>
                    {s.co2 ? (
                      <>
                        <span className="text-muted-foreground/60">·</span>
                        <span className="text-emerald-400 tabular-nums">
                          −{s.co2}kg CO₂
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
              <button
                onClick={() => toast.success("Suggestion applied")}
                className="flex items-center justify-center gap-1 rounded-lg bg-emerald-500/15 py-1 text-[10px] font-bold text-emerald-400 transition hover:bg-emerald-500/25"
              >
                <Zap className="h-2.5 w-2.5" /> Apply
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Empty state + loading -------------------------------------------------

function EmptyState({
  view,
  onAdd,
}: {
  view: CalendarView;
  onAdd: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-dashed border-border/60 py-12 text-center"
    >
      <div
        className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl ${
          view === "predictable"
            ? "bg-emerald-500/10"
            : "bg-amber-500/10"
        }`}
      >
        {view === "predictable" ? (
          <Calendar className="h-8 w-8 text-emerald-400" />
        ) : (
          <Clock className="h-8 w-8 text-amber-400" />
        )}
      </div>
      <p className="text-sm font-bold text-foreground">
        No {view === "predictable" ? "recurring" : "short-notice"} trips yet
      </p>
      <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
        Add your first trip to let the AI optimize it. The kernel will derive a
        Mobility Intent and surface savings continuously.
      </p>
      <button
        onClick={onAdd}
        className="mx-auto mt-3 flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-emerald-950 transition hover:bg-emerald-400"
      >
        <Plus className="h-3.5 w-3.5" /> Add your first trip
      </button>
    </motion.div>
  );
}

function LoadingSkeletons() {
  return (
    <div className="space-y-2">
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.1 }}
          className="h-20 rounded-2xl border border-border/40 bg-card/30"
        />
      ))}
    </div>
  );
}

export default MobilityPlanningEngine;
