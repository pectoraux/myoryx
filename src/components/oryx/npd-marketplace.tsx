"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { NPD_OFFERS } from "@/lib/mock-data";
import {
  Users,
  Star,
  Clock,
  ArrowRight,
  Megaphone,
  Car,
  Gauge,
} from "lucide-react";
import { toast } from "sonner";

function matchColor(pct: number): string {
  if (pct >= 90) return "text-emerald-400 bg-emerald-500/15";
  if (pct >= 80) return "text-cyan-400 bg-cyan-500/15";
  if (pct >= 75) return "text-amber-400 bg-amber-500/15";
  return "text-muted-foreground bg-foreground/[0.06]";
}

export default function NPDMarketplace() {
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    depart: "",
    seats: "1",
    price: "",
  });

  const broadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.origin || !form.destination) {
      toast.error("Set origin and destination first");
      return;
    }
    toast.success("Your trip is now broadcasting to nearby riders", {
      description: `${form.origin} → ${form.destination} · ${form.seats} seat${form.seats === "1" ? "" : "s"}`,
    });
    setForm({ origin: "", destination: "", depart: "", seats: "1", price: "" });
  };

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-2 px-1">
        <Users className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Non-Playable Drivers
        </span>
      </div>
      <p className="mb-2.5 px-1 text-[11px] text-muted-foreground">
        Ordinary drivers selling empty seats on trips they're already making.
      </p>

      {/* Broadcast form */}
      <motion.form
        onSubmit={broadcast}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-3 overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.08] to-transparent"
      >
        <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2">
          <Megaphone className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            Broadcast your trip
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 p-2.5">
          <input
            value={form.origin}
            onChange={(e) => setForm({ ...form, origin: e.target.value })}
            placeholder="From"
            className="rounded-lg border border-border/50 bg-background/50 px-2.5 py-1.5 text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-emerald-500/50 focus:outline-none"
          />
          <input
            value={form.destination}
            onChange={(e) => setForm({ ...form, destination: e.target.value })}
            placeholder="To"
            className="rounded-lg border border-border/50 bg-background/50 px-2.5 py-1.5 text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-emerald-500/50 focus:outline-none"
          />
          <input
            value={form.depart}
            onChange={(e) => setForm({ ...form, depart: e.target.value })}
            placeholder="Depart in (min)"
            inputMode="numeric"
            className="rounded-lg border border-border/50 bg-background/50 px-2.5 py-1.5 text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-emerald-500/50 focus:outline-none"
          />
          <div className="flex gap-1.5">
            <input
              value={form.seats}
              onChange={(e) => setForm({ ...form, seats: e.target.value })}
              placeholder="Seats"
              inputMode="numeric"
              className="w-1/2 rounded-lg border border-border/50 bg-background/50 px-2 py-1.5 text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-emerald-500/50 focus:outline-none"
            />
            <input
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="GH₵"
              inputMode="numeric"
              className="w-1/2 rounded-lg border border-border/50 bg-background/50 px-2 py-1.5 text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-emerald-500/50 focus:outline-none"
            />
          </div>
        </div>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-1.5 border-t border-border/40 bg-emerald-500/15 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/25"
        >
          <Megaphone className="h-3.5 w-3.5" /> Broadcast trip
        </button>
      </motion.form>

      {/* Offers list */}
      <div className="space-y-2">
        {NPD_OFFERS.map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="overflow-hidden rounded-2xl border border-border/50 bg-card/40"
          >
            <div className="flex items-start gap-3 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-xs font-bold text-emerald-300">
                {n.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-bold text-foreground">{n.driverName}</span>
                  <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-400">
                    <Star className="h-2.5 w-2.5 fill-amber-400" />
                    <span className="tabular-nums">{n.rating}</span>
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <span className="font-semibold text-foreground/80">{n.origin}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="font-semibold text-foreground/80">{n.destination}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-3 w-3" /> departs in {n.departInMin}m
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Users className="h-3 w-3" /> {n.seats} seat{n.seats > 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Car className="h-3 w-3" /> {n.vehicle}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${matchColor(n.matchPct)}`}>
                  {n.matchPct}% match
                </span>
                <span className="text-base font-black tabular-nums text-emerald-400">
                  GH₵{n.price}
                </span>
              </div>
            </div>
            <button
              onClick={() =>
                toast.success("Seat requested", {
                  description: `${n.driverName} will confirm shortly · ${n.matchPct}% match`,
                })
              }
              className="flex w-full items-center justify-center gap-1.5 border-t border-border/40 bg-foreground/[0.04] py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/10"
            >
              Request seat
            </button>
          </motion.div>
        ))}
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-2.5">
        <Gauge className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Every NPD fills a seat that would have driven empty. Oryx matches
          riders to existing trips in real time — true utilisation, not just
          dispatching.
        </p>
      </div>
    </div>
  );
}
