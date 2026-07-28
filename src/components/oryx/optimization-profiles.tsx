"use client";
import { motion } from "framer-motion";
import { OPTIMIZATION_PROFILES } from "@/lib/mock-data";
import { useOryx } from "@/lib/store";
import type { OptimizationProfile } from "@/lib/types";
import { Gauge } from "lucide-react";

/** Weight → color helper */
const WEIGHT_COLOR: Record<string, string> = {
  price: "#4ade80",
  time: "#ef4444",
  safety: "#60a5fa",
  comfort: "#d4af37",
  eco: "#22c55e",
};

function WeightBar({ weights }: { weights: { price: number; time: number; safety: number; comfort: number; eco: number } }) {
  const total = weights.price + weights.time + weights.safety + weights.comfort + weights.eco;
  return (
    <div className="flex h-1 w-full overflow-hidden rounded-full bg-foreground/[0.06]">
      {(["price", "time", "safety", "comfort", "eco"] as const).map((k) => (
        <div
          key={k}
          style={{
            width: `${(weights[k] / total) * 100}%`,
            backgroundColor: WEIGHT_COLOR[k],
          }}
          title={`${k} ${Math.round((weights[k] / total) * 100)}%`}
        />
      ))}
    </div>
  );
}

interface Props {
  variant?: "grid" | "chips";
}

/**
 * OptimizationProfiles — 10 profile cards.
 * `variant="grid"` (default) renders full cards with weight bars.
 * `variant="chips"` renders a horizontal scroll row of compact chips.
 */
export function OptimizationProfiles({ variant = "grid" }: Props) {
  const { activeProfile, setActiveProfile } = useOryx();

  if (variant === "chips") {
    return (
      <div className="scroll-thin flex gap-1.5 overflow-x-auto pb-1">
        {OPTIMIZATION_PROFILES.map((p) => {
          const active = activeProfile === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setActiveProfile(p.id as OptimizationProfile)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-bold transition ${
                active
                  ? "border-transparent text-foreground"
                  : "border-border/50 bg-card/40 text-muted-foreground hover:text-foreground"
              }`}
              style={active ? { backgroundColor: `${p.color}25`, borderColor: `${p.color}80` } : undefined}
            >
              <span className="text-sm">{p.emoji}</span>
              {p.name}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 px-1">
        <Gauge className="h-3.5 w-3.5 text-cyan-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Optimization profile
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {OPTIMIZATION_PROFILES.map((p, i) => {
          const active = activeProfile === p.id;
          return (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setActiveProfile(p.id as OptimizationProfile)}
              className={`relative overflow-hidden rounded-2xl border p-2.5 text-left transition ${
                active ? "text-foreground" : "border-border/50 bg-card/40 text-muted-foreground hover:text-foreground"
              }`}
              style={active ? { borderColor: `${p.color}80`, backgroundColor: `${p.color}14` } : undefined}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-base">{p.emoji}</span>
                <span className="text-xs font-bold">{p.name}</span>
              </div>
              <div className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">
                {p.objective}
              </div>
              <div className="mt-2">
                <WeightBar weights={p.weights} />
              </div>
              {active && (
                <motion.span
                  layoutId="profile-active-dot"
                  className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
                  style={{ backgroundColor: p.color, boxShadow: `0 0 8px ${p.color}` }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default OptimizationProfiles;
