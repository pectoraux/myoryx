"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { useOryx } from "@/lib/store";
import { composeJourneys, getProfile } from "@/lib/optimization";
import { OptimizationProfiles } from "./optimization-profiles";
import {
  Compass,
  Clock,
  Footprints,
  Leaf,
  ShieldCheck,
  Sofa,
  ChevronRight,
  Sparkles,
  Cpu,
} from "lucide-react";
import { toast } from "sonner";

function Dots({ value, color }: { value: number; color: string }) {
  // 5-dot scale (value 0..1)
  const filled = Math.round(value * 5);
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className="h-1 w-1 rounded-full"
          style={{
            backgroundColor: i < filled ? color : "oklch(1 0 0 / 0.12)",
          }}
        />
      ))}
    </span>
  );
}

interface JourneyComposerProps {
  /** Limit number of journeys shown (used in compact / half-snap previews). */
  maxItems?: number;
}

export default function JourneyComposer({ maxItems }: JourneyComposerProps) {
  const { distanceKm, activeProfile, destination } = useOryx();
  const effectiveKm = distanceKm > 0 ? distanceKm : 8.5;
  const profile = getProfile(activeProfile);

  const journeys = useMemo(
    () => composeJourneys(effectiveKm, activeProfile),
    [effectiveKm, activeProfile]
  );
  const shown = maxItems ? journeys.slice(0, maxItems) : journeys;

  return (
    <div className="mt-4">
      {/* Header */}
      <div className="mb-2 flex items-center gap-2 px-1">
        <Compass className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Multi-Modal Journey Composer
        </span>
      </div>

      <div className="mb-3 overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-cyan-500/4 to-transparent">
        <div className="flex items-center gap-3 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15">
            <Cpu className="h-5 w-5 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-foreground">
              {profile.emoji} {profile.name} optimization
            </div>
            <div className="text-[11px] text-muted-foreground">
              {destination ? destination.name : "Default trip"} · {effectiveKm.toFixed(1)} km · exploring{" "}
              <span className="font-semibold text-violet-300">8 modes</span> × 1-3 hops
            </div>
          </div>
          <span className="hidden rounded-full bg-foreground/[0.06] px-2 py-1 text-[10px] font-bold tabular-nums text-muted-foreground sm:inline">
            {shown.length} routes
          </span>
        </div>
      </div>

      {/* Profile chips selector */}
      <OptimizationProfiles variant="chips" />

      {/* Journey cards */}
      <div className="mt-3 space-y-2">
        {shown.map((j, i) => {
          const isBest = i === 0;
          return (
            <motion.div
              key={j.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`relative overflow-hidden rounded-2xl border p-3 ${
                isBest
                  ? "border-violet-500/50 bg-violet-500/[0.06]"
                  : "border-border/50 bg-card/40"
              }`}
            >
              {j.badge && (
                <div
                  className="absolute right-0 top-0 rounded-bl-xl px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-foreground"
                  style={{
                    backgroundColor: isBest
                      ? "oklch(0.6 0.16 295 / 0.3)"
                      : "oklch(0.7 0.18 152 / 0.22)",
                  }}
                >
                  {j.badge}
                </div>
              )}

              {/* Hop chain */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {j.hops.map((h, hi) => (
                  <div key={hi} className="flex shrink-0 items-center gap-1">
                    <div className="flex flex-col items-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/[0.06] text-base">
                        {h.emoji}
                      </div>
                    </div>
                    {hi < j.hops.length - 1 && (
                      <ChevronRight className="h-3.5 w-3.5 text-border/70" />
                    )}
                  </div>
                ))}
              </div>

              {/* Hop labels + durations */}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                {j.hops.map((h, hi) => (
                  <span key={hi} className="flex items-center gap-1">
                    {hi > 0 && <span className="text-border">·</span>}
                    <span className="font-semibold text-foreground/80">{h.label}</span>
                    <span className="tabular-nums">{h.durationMin}m</span>
                  </span>
                ))}
              </div>

              {/* Footer row */}
              <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-border/40 pt-2.5">
                {/* Left metrics */}
                <div className="flex flex-wrap items-center gap-2.5 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span className="font-semibold text-foreground/80 tabular-nums">{j.totalDuration}m</span>
                  </span>
                  {j.walkDistance > 0 && (
                    <span className="flex items-center gap-1">
                      <Footprints className="h-3 w-3" />
                      <span className="tabular-nums">{j.walkDistance}m</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Leaf className="h-3 w-3" />
                    <span className="tabular-nums">{j.co2}kg</span>
                  </span>
                  <span className="flex items-center gap-1" title={`Safety ${Math.round(j.safetyScore * 100)}%`}>
                    <ShieldCheck className="h-3 w-3 text-cyan-400" />
                    <Dots value={j.safetyScore} color="#22d3ee" />
                  </span>
                  <span className="flex items-center gap-1" title={`Comfort ${Math.round(j.comfortScore * 100)}%`}>
                    <Sofa className="h-3 w-3 text-amber-400" />
                    <Dots value={j.comfortScore} color="#f5a623" />
                  </span>
                </div>
                {/* Right price */}
                <div className="flex flex-col items-end">
                  {j.savings > 0 && (
                    <span className="text-[10px] font-bold text-emerald-400">
                      −${j.savings.toFixed(2)}
                    </span>
                  )}
                  <span
                    className={`text-lg font-black tabular-nums ${
                      j.savings > 0 ? "text-emerald-400" : "text-foreground"
                    }`}
                  >
                    ${j.totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Book button */}
              <button
                onClick={() =>
                  toast.success(`Journey booked · $${j.totalPrice.toFixed(2)}`, {
                    description: `${j.hops.length} hop${j.hops.length > 1 ? "s" : ""} · ${j.totalDuration} min · ${profile.name} profile`,
                    icon: <Sparkles className="h-3.5 w-3.5" />,
                  })
                }
                className={`mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition ${
                  isBest
                    ? "bg-violet-500/20 text-violet-200 hover:bg-violet-500/30"
                    : "bg-foreground/[0.06] text-foreground hover:bg-foreground/[0.1]"
                }`}
              >
                Book this journey
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/[0.04] p-2.5">
        <Cpu className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Real combinatorial optimization: 8 transportation segments × 1-3 hop
          splits, scored against the active profile's weight vector. Switch
          profiles above to see journeys re-compose live.
        </p>
      </div>
    </div>
  );
}
