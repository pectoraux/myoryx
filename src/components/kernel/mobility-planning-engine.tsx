"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
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
  TrendingDown,
} from "lucide-react";

// ---- Kernel domain types (mirrored from src/lib/kernel/types.ts) ------------
type CalendarView = "predictable" | "short_notice";

interface KernelSuggestion {
  id: string;
  kind: "shift" | "pool" | "return_ride" | "multimodal" | "subscription" | "batch";
  title: string;
  detail: string;
  saving?: number;
  co2?: number;
  confidence: number;
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
  priority: "low" | "normal" | "high" | "critical";
  status: string;
  suggestions?: KernelSuggestion[];
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
  allDay?: boolean;
  recurring?: { days: number[]; time: string };
  priority: "low" | "normal" | "high" | "critical";
  optimized: boolean;
  saving?: number;
  createdAt: number;
}

// ---- Static maps -----------------------------------------------------------

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_FULL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const VIEW_TABS: { id: CalendarView; label: string; sub: string }[] = [
  { id: "predictable", label: "Predictable Trips", sub: "Recurring · schedule-driven" },
  { id: "short_notice", label: "Short Notice Trips", sub: "One-off · right now / soon" },
];

const SUGGESTION_META: Record<
  KernelSuggestion["kind"],
  { icon: typeof Clock; color: string; bg: string; label: string }
> = {
  shift: { icon: Timer, color: "text-cyan-400", bg: "bg-cyan-500/15", label: "Shift" },
  pool: { icon: Users, color: "text-violet-400", bg: "bg-violet-500/15", label: "Pool" },
  return_ride: { icon: RotateCcw, color: "text-amber-400", bg: "bg-amber-500/15", label: "Return" },
  multimodal: { icon: Footprints, color: "text-emerald-400", bg: "bg-emerald-500/15", label: "Multi-modal" },
  subscription: { icon: Repeat, color: "text-pink-400", bg: "bg-pink-500/15", label: "Subscription" },
  batch: { icon: Package, color: "text-orange-400", bg: "bg-orange-500/15", label: "Batch" },
};

const PRIORITY_META: Record<KernelCalendarEvent["priority"], { label: string; cls: string }> = {
  low: { label: "Low", cls: "bg-foreground/10 text-muted-foreground" },
  normal: { label: "Normal", cls: "bg-cyan-500/15 text-cyan-400" },
  high: { label: "High", cls: "bg-amber-500/15 text-amber-400" },
  critical: { label: "Critical", cls: "bg-rose-500/15 text-rose-400" },
};

function formatDays(days?: number[]): string {
  if (!days || days.length === 0) return "Once";
  if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) return "Weekdays";
  if (days.length === 7) return "Daily";
  return [...days].sort().map((d) => DAY_FULL[d]).join(", ");
}

function formatTime(start: string): string {
  // Either "HH:MM" or ISO
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

// ---- Component -------------------------------------------------------------

interface Props {
  /** Render in compact/preview mode (used by half-snap) */
  compact?: boolean;
}

export function MobilityPlanningEngine({ compact = false }: Props) {
  const [view, setView] = useState<CalendarView>("predictable");
  const [events, setEvents] = useState<KernelCalendarEvent[]>([]);
  const [intents, setIntents] = useState<KernelIntent[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "",
    origin: "",
    destination: "",
    time: "08:00",
    priority: "normal" as KernelCalendarEvent["priority"],
    days: [1, 2, 3, 4, 5] as number[],
  });

  const fetchEvents = useCallback(async (v: CalendarView) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kernel/calendar?userId=demo&view=${v}`, { cache: "no-store" });
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
      const res = await fetch(`/api/kernel/intents?userId=demo`, { cache: "no-store" });
      const data = (await res.json()) as KernelIntent[];
      setIntents(data);
    } catch {
      setIntents([]);
    }
  }, []);

  useEffect(() => {
    fetchEvents(view);
  }, [view, fetchEvents]);

  // Intents are fetched once and re-fetched after every add/remove.
  useEffect(() => {
    fetchIntents();
    // Light polling for live optimization updates (every 5s).
    const id = setInterval(fetchIntents, 5000);
    return () => clearInterval(id);
  }, [fetchIntents]);

  const intentByTitle = (title: string): KernelIntent | undefined =>
    intents.find((i) => i.title === title);

  const totalSuggestions = intents.reduce((s, i) => s + (i.suggestions?.length || 0), 0);
  const optimizing = intents.filter((i) => i.status === "optimizing").length;

  const toggleDay = (d: number) =>
    setForm((f) => ({
      ...f,
      days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d].sort(),
    }));

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
      setForm({
        title: "",
        origin: "",
        destination: "",
        time: "08:00",
        priority: "normal",
        days: [1, 2, 3, 4, 5],
      });
      await Promise.all([fetchEvents(view), fetchIntents()]);
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
      await Promise.all([fetchEvents(view), fetchIntents()]);
    } catch {
      toast.error("Could not remove plan");
    }
  };

  return (
    <div className={compact ? "px-4 pb-4 pt-1" : "px-4 pb-8 pt-3"}>
      {/* Header */}
      <div className="mb-3 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-400">
          <Calendar className="h-3 w-3" /> Mobility Planning Engine
        </div>
        <h2 className="mt-3 text-xl font-black tracking-tight text-foreground text-balance">
          Every event becomes a Mobility Intent
        </h2>
        <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
          The AI optimizes each intent for cheaper departures, pools, return
          rides, subscriptions, and multi-modal routes — continuously.
        </p>
      </div>

      {/* Optimization banner */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-3 overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/12 via-emerald-500/5 to-transparent"
      >
        <div className="flex items-center gap-3 p-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20">
            <Brain className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-bold uppercase tracking-wide text-cyan-400">
              Optimization live
            </div>
            <div className="text-sm font-bold text-foreground">
              {intents.length} intent{intents.length === 1 ? "" : "s"} being optimized ·{" "}
              {totalSuggestions} suggestions found
            </div>
            <div className="text-[11px] text-muted-foreground">
              {optimizing} active · continuous scan every 30s
            </div>
          </div>
          <Zap className="h-5 w-5 text-emerald-400" />
        </div>
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
                  className="absolute inset-0 rounded-xl bg-foreground/[0.08]"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span
                className={`relative text-xs font-bold ${
                  active ? "text-foreground" : "text-muted-foreground"
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

      {/* Add-plan button / form */}
      <div className="mb-3">
        <button
          onClick={() => setAdding((a) => !a)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/[0.04] py-2.5 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/[0.08]"
        >
          <Plus className="h-3.5 w-3.5" /> {adding ? "Cancel" : "Add plan"}
        </button>

        <AnimatePresence>
          {adding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-2 space-y-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.04] p-3.5">
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
                    placeholder="From"
                    className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-emerald-500/50 focus:outline-none"
                  />
                  <input
                    value={form.destination}
                    onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
                    placeholder="To"
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
                                : "bg-foreground/[0.05] text-muted-foreground"
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
                          ? PRIORITY_META[p].cls
                          : "bg-foreground/[0.04] text-muted-foreground"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button
                  onClick={save}
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 py-2 text-xs font-bold text-emerald-950 transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" /> {busy ? "Saving…" : "Save plan"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Events list */}
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.1 }}
              className="h-24 rounded-2xl border border-border/40 bg-card/30"
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState view={view} />
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence initial={false}>
            {events.map((ev, i) => {
              const intent = intentByTitle(ev.title);
              return (
                <motion.div
                  key={ev.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.04 }}
                  className="group overflow-hidden rounded-2xl border border-border/50 bg-card/50"
                >
                  {/* Event header */}
                  <div className="flex items-start gap-3 p-3.5">
                    <div
                      className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl text-[10px] font-bold ${
                        view === "predictable"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-amber-500/15 text-amber-400"
                      }`}
                    >
                      {view === "predictable" ? (
                        <>
                          <Repeat className="h-3 w-3" />
                          <span className="mt-0.5 text-[9px] uppercase">Recurring</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3" />
                          <span className="mt-0.5 text-[9px] uppercase">Soon</span>
                        </>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold text-foreground">
                          {ev.title}
                        </span>
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase ${PRIORITY_META[ev.priority].cls}`}
                        >
                          {PRIORITY_META[ev.priority].label}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate">
                          <span className="font-semibold text-foreground/80">{ev.origin}</span>
                          <ArrowRight className="mx-1 inline h-2.5 w-2.5" />
                          <span className="font-semibold text-foreground/80">
                            {ev.destination}
                          </span>
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" /> {formatTime(ev.start)}
                        </span>
                        {ev.recurring && (
                          <span className="flex items-center gap-0.5">
                            <Repeat className="h-2.5 w-2.5" /> {formatDays(ev.recurring.days)}
                          </span>
                        )}
                        {intent && (
                          <span className="flex items-center gap-0.5 text-cyan-400">
                            <Sparkles className="h-2.5 w-2.5" /> intent: {intent.type}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => remove(ev.id)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition hover:bg-rose-500/10 hover:text-rose-400 group-hover:opacity-100"
                      aria-label="Remove plan"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Derived suggestions */}
                  {intent?.suggestions && intent.suggestions.length > 0 && (
                    <div className="border-t border-border/40 bg-foreground/[0.02] p-3">
                      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                        <Brain className="h-3 w-3" /> {intent.suggestions.length} optimization{" "}
                        {intent.suggestions.length === 1 ? "opportunity" : "opportunities"}
                      </div>
                      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                        {intent.suggestions.map((s) => {
                          const meta = SUGGESTION_META[s.kind];
                          const SIcon = meta.icon;
                          return (
                            <div
                              key={s.id}
                              className={`flex items-start gap-2 rounded-xl border border-border/40 bg-card/60 p-2.5`}
                            >
                              <div
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${meta.bg}`}
                              >
                                <SIcon className={`h-3.5 w-3.5 ${meta.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1.5">
                                  <span className="truncate text-[11px] font-bold text-foreground">
                                    {s.title}
                                  </span>
                                  {s.saving ? (
                                    <span className="flex shrink-0 items-center gap-0.5 text-[10px] font-bold text-emerald-400">
                                      <TrendingDown className="h-2.5 w-2.5" />
                                      <span className="tabular-nums">GH₵{s.saving}</span>
                                    </span>
                                  ) : null}
                                </div>
                                <div className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
                                  {s.detail}
                                </div>
                                <div className="mt-1 flex items-center gap-2 text-[9px]">
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
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Pending intent (no suggestions yet) */}
                  {intent && (!intent.suggestions || intent.suggestions.length === 0) && (
                    <div className="border-t border-border/40 bg-cyan-500/[0.03] p-2.5">
                      <div className="flex items-center gap-1.5 text-[10px] text-cyan-400">
                        <motion.span
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="h-1.5 w-1.5 rounded-full bg-cyan-400"
                        />
                        <span className="font-medium">
                          Intent derived · optimization in progress…
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Footer explainer */}
      {!compact && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/[0.04] p-3">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Every event becomes an intent.</span>{" "}
            The Planning Engine derives a Mobility Intent from each calendar entry, then runs the
            optimizer continuously — surfacing cheaper departures, pools, return rides,
            subscriptions, and multi-modal routes as live suggestions.
          </p>
        </div>
      )}
    </div>
  );
}

// ---- Empty state -----------------------------------------------------------

function EmptyState({ view }: { view: CalendarView }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-dashed border-border/60 py-10 text-center"
    >
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
        {view === "predictable" ? (
          <Repeat className="h-7 w-7 text-emerald-400" />
        ) : (
          <Clock className="h-7 w-7 text-amber-400" />
        )}
      </div>
      <p className="text-sm font-bold text-foreground">
        No {view === "predictable" ? "recurring" : "short-notice"} trips yet
      </p>
      <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
        Add your first trip to let the AI optimize it. The kernel will derive a
        Mobility Intent and surface savings continuously.
      </p>
    </motion.div>
  );
}

export default MobilityPlanningEngine;
