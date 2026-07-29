"use client";
import { useOryx } from "@/lib/store";
import { LEADERBOARD } from "@/lib/mock-data";
import { motion } from "framer-motion";
import {
  Wallet,
  Leaf,
  Clock,
  Flame,
  Trophy,
  TrendingDown,
  TrendingUp,
  Medal,
  Target,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { FlywheelViz } from "./flywheel-viz";

export function SavingsPanel() {
  const { savings } = useOryx();

  const stats = [
    {
      icon: Wallet,
      label: "Total saved",
      value: `$${savings.totalSaved}`,
      sub: "all time",
      color: "text-emerald-400",
      bg: "bg-emerald-500/15",
    },
    {
      icon: Leaf,
      label: "CO₂ saved",
      value: `${savings.co2Saved}kg`,
      sub: "vs single-occupancy",
      color: "text-emerald-400",
      bg: "bg-emerald-500/15",
    },
    {
      icon: Clock,
      label: "Hours saved",
      value: `${savings.hoursSaved}h`,
      sub: "via optimized routes",
      color: "text-violet-400",
      bg: "bg-violet-500/15",
    },
    {
      icon: Flame,
      label: "Ride streak",
      value: `${savings.streak}`,
      sub: "below city avg",
      color: "text-amber-400",
      bg: "bg-amber-500/15",
    },
  ];

  return (
    <div className="px-4 pb-6 pt-1">
      {/* Hero savings */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent p-5 text-center"
      >
        <div className="absolute inset-0 grid-texture opacity-30" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-400">
            <Trophy className="h-3 w-3" /> Your savings
          </div>
          <div className="mt-3 text-5xl font-black tabular-nums text-emerald-400">
            ${savings.ytdSaved}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            saved this year across {savings.ridesCount} rides
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-background/50 px-3 py-1 text-xs font-medium text-foreground">
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            {savings.streak}-ride streak · {savings.belowAvgPct}% below city avg
          </div>
        </div>
      </motion.div>

      {/* Stat grid */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border/50 bg-card/40 p-3.5"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.bg}`}>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <div className="mt-2.5 text-2xl font-black tabular-nums text-foreground">
              {s.value}
            </div>
            <div className="text-[11px] font-medium text-muted-foreground">{s.label}</div>
            <div className="text-[10px] text-muted-foreground/70">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Rank badges */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card/40 p-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
            <Medal className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <div className="text-[10px] font-medium uppercase text-muted-foreground">City rank</div>
            <div className="text-lg font-bold text-foreground">#{savings.rank}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card/40 p-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15">
            <Target className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <div className="text-[10px] font-medium uppercase text-muted-foreground">Hood rank</div>
            <div className="text-lg font-bold text-foreground">#{savings.neighborhoodRank}</div>
          </div>
        </div>
      </div>

      {/* Flywheel */}
      <div className="mt-4">
        <div className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          The Oryx flywheel
        </div>
        <FlywheelViz />
      </div>

      {/* Leaderboard */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            City savings leaderboard
          </span>
          <span className="text-[10px] text-muted-foreground/70">this month</span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/40">
          {LEADERBOARD.slice(0, 6).map((e, i) => (
            <div
              key={e.rank}
              className={`flex items-center gap-3 px-3 py-2.5 ${
                i !== LEADERBOARD.slice(0, 6).length - 1 ? "border-b border-border/40" : ""
              } ${i < 3 ? "bg-foreground/[0.02]" : ""}`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                  i === 0
                    ? "bg-amber-500/20 text-amber-400"
                    : i === 1
                    ? "bg-zinc-400/20 text-zinc-300"
                    : i === 2
                    ? "bg-orange-700/20 text-orange-400"
                    : "bg-foreground/[0.06] text-muted-foreground"
                }`}
              >
                {e.rank}
              </div>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/30 to-emerald-600/20 text-[11px] font-bold text-emerald-300">
                {e.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-semibold text-foreground">
                  {e.name}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {e.rides} rides · {e.streak} streak
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold tabular-nums text-emerald-400">
                  ${e.saved}
                </div>
                <div className="flex items-center justify-end gap-0.5 text-[10px]">
                  {e.change > 0 ? (
                    <ArrowUp className="h-2.5 w-2.5 text-emerald-400" />
                  ) : e.change < 0 ? (
                    <ArrowDown className="h-2.5 w-2.5 text-rose-400" />
                  ) : (
                    <Minus className="h-2.5 w-2.5 text-muted-foreground" />
                  )}
                  <span className={e.change > 0 ? "text-emerald-400" : e.change < 0 ? "text-rose-400" : "text-muted-foreground"}>
                    {e.change !== 0 ? Math.abs(e.change) : "—"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/[0.04] p-2.5 text-[11px] text-muted-foreground">
          <TrendingDown className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
          Invite neighbors to lower your area's prices by up to 9%.
        </div>
      </div>
    </div>
  );
}
