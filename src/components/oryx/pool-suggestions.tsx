"use client";
import { useOryx } from "@/lib/store";
import { motion } from "framer-motion";
import { Users, Route, Check } from "lucide-react";

const POOLS = [
  {
    id: "p1",
    riderCount: 4,
    yourShare: 6.2,
    fullPrice: 22,
    detourMin: 3,
    route: "Ringway → Osu → Airport",
    confidence: 94,
  },
  {
    id: "p2",
    riderCount: 3,
    yourShare: 7.8,
    fullPrice: 22,
    detourMin: 5,
    route: "Ringway → Labadi → Airport",
    confidence: 81,
  },
];

export default function PoolSuggestions() {
  const { destination } = useOryx();
  if (!destination) return null;

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-2 px-1">
        <Users className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Smart carpool · matched before booking
        </span>
      </div>
      <div className="space-y-2">
        {POOLS.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="overflow-hidden rounded-2xl border border-violet-500/30 bg-violet-500/[0.05]"
          >
            <div className="flex items-center gap-3 p-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/15">
                <div className="flex -space-x-1.5">
                  {[0, 1, 2].map((j) => (
                    <div
                      key={j}
                      className="h-5 w-5 rounded-full border-2 border-card bg-gradient-to-br from-violet-400 to-violet-600"
                    />
                  ))}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">
                    {p.riderCount} riders · same direction
                  </span>
                  <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                    {p.confidence}% match
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Route className="h-3 w-3" />
                  {p.route}
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  +{p.detourMin} min detour
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black tabular-nums text-emerald-400">
                  ${p.yourShare}
                </div>
                <div className="text-[10px] text-muted-foreground line-through">
                  ${p.fullPrice}
                </div>
              </div>
            </div>
            <button className="flex w-full items-center justify-center gap-1.5 border-t border-violet-500/20 bg-violet-500/10 py-2 text-xs font-bold text-violet-300 transition hover:bg-violet-500/20">
              <Check className="h-3.5 w-3.5" />
              Join pool · save ${(p.fullPrice - p.yourShare).toFixed(2)}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
