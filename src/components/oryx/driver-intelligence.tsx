"use client";
import { motion } from "framer-motion";
import { DRIVER_PROFILES } from "@/lib/mock-data";
import {
  Trophy,
  Car,
  Target,
  Leaf,
  Users,
  Star,
  TrendingDown,
  Award,
} from "lucide-react";

export function DriverIntelligence() {
  return (
    <div className="mt-5">
      {/* Section: Driver AI teams */}
      <div className="mb-2 flex items-center gap-2 px-1">
        <Car className="h-3.5 w-3.5 text-amber-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Driver AI teams · maximize earnings, lower your fare
        </span>
      </div>

      <div className="mb-4 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent p-3.5">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Drivers get their own AI team. The objective isn't maximizing price —
          it's maximizing long-term earnings through efficiency. A driver who
          hits goals sooner works fewer hours without raising rider fares.
        </p>
        <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-background/40 p-2">
            <Target className="mx-auto mb-0.5 h-3.5 w-3.5 text-amber-400" />
            <div className="text-[9px] uppercase text-muted-foreground">Goal hit</div>
            <div className="text-xs font-bold text-foreground">−3.2h</div>
          </div>
          <div className="rounded-lg bg-background/40 p-2">
            <Leaf className="mx-auto mb-0.5 h-3.5 w-3.5 text-emerald-400" />
            <div className="text-[9px] uppercase text-muted-foreground">Empty miles</div>
            <div className="text-xs font-bold text-emerald-400">−41%</div>
          </div>
          <div className="rounded-lg bg-background/40 p-2">
            <TrendingDown className="mx-auto mb-0.5 h-3.5 w-3.5 text-emerald-400" />
            <div className="text-[9px] uppercase text-muted-foreground">Rider fare</div>
            <div className="text-xs font-bold text-emerald-400">−18%</div>
          </div>
        </div>
      </div>

      {/* Section: Reputation Economy */}
      <div className="mb-2 flex items-center gap-2 px-1">
        <Award className="h-3.5 w-3.5 text-amber-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Driver reputation economy
        </span>
      </div>
      <p className="mb-2 px-1 text-[11px] text-muted-foreground">
        Drivers are rewarded for creating value for the network — not just service quality.
      </p>

      <div className="space-y-2">
        {DRIVER_PROFILES.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`overflow-hidden rounded-2xl border p-3 ${
              d.champion
                ? "border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-transparent"
                : "border-border/50 bg-card/40"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/30 to-amber-600/20 text-xs font-bold text-amber-300">
                  {d.avatar}
                </div>
                {d.champion && (
                  <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-amber-950 shadow-lg">
                    <Trophy className="h-3 w-3" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-bold text-foreground">
                    {d.name}
                  </span>
                  {d.champion && (
                    <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[8px] font-bold uppercase text-amber-400">
                      Champion
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                    {d.rating}
                  </span>
                  <span>·</span>
                  <span className="truncate">{d.vehicle}</span>
                  <span>·</span>
                  <span>{d.zone}</span>
                </div>
              </div>
              {/* Reputation score */}
              <div className="text-right">
                <div className="text-[9px] font-medium uppercase text-muted-foreground/60">
                  Reputation
                </div>
                <div className="text-lg font-black tabular-nums text-amber-400">
                  {d.reputation}
                </div>
              </div>
            </div>

            {/* Reputation breakdown */}
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-foreground/[0.03] p-2 text-center">
                <div className="flex items-center justify-center gap-1 text-[9px] uppercase text-muted-foreground">
                  <Users className="h-2.5 w-2.5" /> Pools
                </div>
                <div className="text-sm font-bold tabular-nums text-foreground">
                  {d.pooledTrips}
                </div>
              </div>
              <div className="rounded-lg bg-foreground/[0.03] p-2 text-center">
                <div className="flex items-center justify-center gap-1 text-[9px] uppercase text-muted-foreground">
                  <Leaf className="h-2.5 w-2.5" /> Efficiency
                </div>
                <div className="text-sm font-bold tabular-nums text-emerald-400">
                  −{d.efficiency}%
                </div>
              </div>
              <div className="rounded-lg bg-foreground/[0.03] p-2 text-center">
                <div className="flex items-center justify-center gap-1 text-[9px] uppercase text-muted-foreground">
                  <TrendingDown className="h-2.5 w-2.5" /> Saved riders
                </div>
                <div className="text-sm font-bold tabular-nums text-emerald-400">
                  ${d.savingsGenerated}
                </div>
              </div>
            </div>

            {/* Earnings goal progress */}
            <div className="mt-2.5">
              <div className="mb-1 flex items-center justify-between text-[10px]">
                <span className="font-medium text-muted-foreground">
                  Weekly goal · GH₵{d.earningsGoal.weekly}
                </span>
                <span className="font-bold tabular-nums text-foreground">
                  {d.earningsGoal.progress}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${d.earningsGoal.progress}%` }}
                  transition={{ delay: i * 0.05 + 0.3, duration: 0.8 }}
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/[0.05] p-3">
        <Trophy className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Weekly & monthly <span className="font-semibold text-foreground">Mobility Champions</span> get
          extra visibility in their zones — rewarding the behavior that lowers costs for everyone.
        </p>
      </div>
    </div>
  );
}
