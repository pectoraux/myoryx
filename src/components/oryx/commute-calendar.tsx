"use client";
import { useState } from "react";
import { useOryx } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Plus,
  Trash2,
  Clock,
  MapPin,
  Repeat,
  Briefcase,
  Car,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import type { CommuteObligation } from "@/lib/types";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_FULL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDays(days: number[]): string {
  if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d)))
    return "Weekdays";
  if (days.length === 7) return "Daily";
  return days.sort().map((d) => DAY_FULL[d]).join(", ");
}

export function CommuteCalendar() {
  const { commuteObligations, addCommuteObligation, removeCommuteObligation, currentType } =
    useOryx();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    title: "",
    origin: "",
    destination: "",
    time: "08:00",
    days: [1, 2, 3, 4, 5] as number[],
    recurring: true,
    role: currentType === "driver" ? ("driver" as const) : ("rider" as const),
  });

  const toggleDay = (d: number) => {
    setForm((f) => ({
      ...f,
      days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d].sort(),
    }));
  };

  const save = () => {
    if (!form.title || !form.origin || !form.destination) {
      toast.error("Fill in title, origin and destination");
      return;
    }
    const ob: CommuteObligation = {
      id: `co-${Date.now()}`,
      title: form.title,
      origin: form.origin,
      destination: form.destination,
      days: form.days,
      time: form.time,
      role: form.role,
      recurring: form.recurring,
    };
    addCommuteObligation(ob);
    toast.success("Commute added", {
      description: "AI will optimize routes and pool you with neighbors automatically.",
    });
    setAdding(false);
    setForm({
      title: "",
      origin: "",
      destination: "",
      time: "08:00",
      days: [1, 2, 3, 4, 5],
      recurring: true,
      role: currentType === "driver" ? "driver" : "rider",
    });
  };

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Commute calendar
          </span>
        </div>
        <button
          onClick={() => setAdding((a) => !a)}
          className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-400 transition hover:bg-emerald-500/25"
        >
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>
      <p className="mb-2.5 px-1 text-[11px] text-muted-foreground">
        Add your future commute obligations — the AI pools you with neighbors,
        pre-books cheaper rides, and proposes schedule shifts.
      </p>

      {/* Add form */}
      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mb-3 space-y-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.04] p-3.5">
              {/* role toggle */}
              <div className="flex gap-1.5">
                <button
                  onClick={() => setForm((f) => ({ ...f, role: "rider" }))}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
                    form.role === "rider"
                      ? "bg-emerald-500 text-emerald-950"
                      : "bg-foreground/[0.05] text-muted-foreground"
                  }`}
                >
                  <Briefcase className="h-3.5 w-3.5" /> I'm a rider
                </button>
                <button
                  onClick={() => setForm((f) => ({ ...f, role: "driver" }))}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
                    form.role === "driver"
                      ? "bg-emerald-500 text-emerald-950"
                      : "bg-foreground/[0.05] text-muted-foreground"
                  }`}
                >
                  <Car className="h-3.5 w-3.5" /> I'm a driver
                </button>
              </div>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Title (e.g. Office commute)"
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
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm text-foreground focus:border-emerald-500/50 focus:outline-none"
                />
                <label className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Repeat className="h-3 w-3" /> Recurring
                  <button
                    onClick={() => setForm((f) => ({ ...f, recurring: !f.recurring }))}
                    className={`relative h-4 w-7 rounded-full transition ${
                      form.recurring ? "bg-emerald-500" : "bg-foreground/15"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition ${
                        form.recurring ? "left-[14px]" : "left-0.5"
                      }`}
                    />
                  </button>
                </label>
              </div>
              {/* day picker */}
              <div className="flex items-center gap-1">
                {DAYS.map((d, i) => {
                  const on = form.days.includes(i);
                  return (
                    <button
                      key={i}
                      onClick={() => toggleDay(i)}
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition ${
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
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setAdding(false)}
                  className="flex-1 rounded-lg border border-border/60 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-foreground/[0.04]"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  className="flex-[2] flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 py-2 text-xs font-bold text-emerald-950 transition hover:bg-emerald-400"
                >
                  <Check className="h-3.5 w-3.5" /> Save commute
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Obligations list */}
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {commuteObligations.map((o, i) => (
            <motion.div
              key={o.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: i * 0.04 }}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl text-[10px] font-bold ${
                    o.role === "driver"
                      ? "bg-amber-500/15 text-amber-400"
                      : "bg-emerald-500/15 text-emerald-400"
                  }`}
                >
                  <span className="text-sm leading-none">{o.time.split(":")[0]}</span>
                  <span className="text-[8px] leading-none opacity-70">
                    {o.time.split(":")[1]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-bold text-foreground">
                      {o.title}
                    </span>
                    {o.role === "driver" ? (
                      <Car className="h-3 w-3 text-amber-400" />
                    ) : (
                      <Briefcase className="h-3 w-3 text-emerald-400" />
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <MapPin className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate">
                      {o.origin} → {o.destination}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[10px]">
                    <span className="flex items-center gap-0.5 text-muted-foreground">
                      <Repeat className="h-2.5 w-2.5" /> {formatDays(o.days)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeCommuteObligation(o.id)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition hover:bg-rose-500/10 hover:text-rose-400 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {commuteObligations.length === 0 && !adding && (
          <div className="rounded-2xl border border-dashed border-border/60 py-8 text-center">
            <Calendar className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">
              No commutes yet. Add your regular trips so the AI can optimize them.
            </p>
          </div>
        )}
      </div>

      {commuteObligations.length > 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.05] p-3">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">{commuteObligations.length} commute{commuteObligations.length > 1 ? "s" : ""}</span> being
            optimized. AI is matching you with {Math.round(commuteObligations.length * 3.4)} nearby commuters.
          </p>
        </div>
      )}
    </div>
  );
}
