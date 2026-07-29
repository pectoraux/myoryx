"use client";
import { useOryx } from "@/lib/store";
import { motion } from "framer-motion";
import { Route, Leaf, Clock, Footprints, ChevronRight, BadgeCheck } from "lucide-react";

const ROUTES = [
  {
    id: "direct",
    hops: [
      { type: "ride", label: "Direct ride", detail: "Door-to-door", emoji: "🚗" },
    ],
    totalPrice: 22,
    totalDuration: 18,
    walkDistance: 0,
    co2: 0,
    savings: 0,
  },
  {
    id: "walk-shuttle-ride",
    hops: [
      { type: "walk", label: "Walk 3 min", detail: "to shuttle stop", emoji: "🚶" },
      { type: "shuttle", label: "Shared shuttle", detail: "Osu → Ring Road", emoji: "🚐" },
      { type: "ride", label: "Ride hail", detail: "Ring Road → dest", emoji: "🚗" },
    ],
    totalPrice: 9,
    totalDuration: 18,
    walkDistance: 240,
    co2: 1.8,
    savings: 13,
    badge: "Best value",
  },
  {
    id: "moto-ride",
    hops: [
      { type: "moto", label: "Okada moto", detail: "skip traffic", emoji: "🏍️" },
      { type: "ride", label: "Ride hail", detail: "to destination", emoji: "🚗" },
    ],
    totalPrice: 9,
    totalDuration: 15,
    walkDistance: 60,
    co2: 0.6,
    savings: 13,
    badge: "Fastest cheap",
  },
  {
    id: "carpool",
    hops: [
      { type: "ride", label: "Smart carpool", detail: "3 riders matched", emoji: "🧑‍🤝‍🧑" },
    ],
    totalPrice: 7,
    totalDuration: 22,
    walkDistance: 120,
    co2: 2.4,
    savings: 15,
    badge: "Max savings",
  },
];

export default function RouteAlternatives() {
  const { destination } = useOryx();
  if (!destination) return null;

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-2 px-1">
        <Route className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Multi-hop routing
        </span>
      </div>
      <div className="space-y-2">
        {ROUTES.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`relative overflow-hidden rounded-2xl border p-3 ${
              r.badge ? "border-violet-500/40 bg-violet-500/[0.05]" : "border-border/50 bg-card/40"
            }`}
          >
            {r.badge && (
              <div className="absolute right-0 top-0 rounded-bl-xl bg-violet-500/20 px-2 py-0.5 text-[9px] font-bold uppercase text-violet-400">
                {r.badge}
              </div>
            )}
            {/* hops */}
            <div className="flex items-center gap-1.5">
              {r.hops.map((h, hi) => (
                <div key={hi} className="flex items-center gap-1.5">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/[0.06] text-base">
                      {h.emoji}
                    </div>
                  </div>
                  {hi < r.hops.length - 1 && (
                    <div className="h-px w-3 bg-border/60" />
                  )}
                </div>
              ))}
            </div>
            {/* labels */}
            <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-muted-foreground">
              {r.hops.map((h, hi) => (
                <span key={hi} className="flex items-center gap-1.5">
                  {hi > 0 && <ChevronRight className="h-3 w-3 text-border" />}
                  <span className="font-medium text-foreground/80">{h.label}</span>
                </span>
              ))}
            </div>
            {/* metrics */}
            <div className="mt-2.5 flex items-center justify-between border-t border-border/40 pt-2.5">
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {r.totalDuration}m
                </span>
                {r.walkDistance > 0 && (
                  <span className="flex items-center gap-1">
                    <Footprints className="h-3 w-3" /> {r.walkDistance}m
                  </span>
                )}
                {r.co2 > 0 && (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Leaf className="h-3 w-3" /> {r.co2}kg
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1.5">
                {r.savings > 0 && (
                  <span className="text-[10px] font-bold text-emerald-400">
                    −${r.savings}
                  </span>
                )}
                <span className={`text-base font-black tabular-nums ${r.savings > 0 ? "text-emerald-400" : "text-foreground"}`}>
                  ${r.totalPrice}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
