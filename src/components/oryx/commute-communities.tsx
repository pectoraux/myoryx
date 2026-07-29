"use client";
import { motion } from "framer-motion";
import { COMMUTE_GROUPS } from "@/lib/mock-data";
import { useOryx } from "@/lib/store";
import {
  Users,
  Clock,
  MapPin,
  ArrowRight,
  Sparkles,
  Gavel,
  Brain,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";

export default function CommuteCommunities() {
  const { startAuction } = useOryx();

  const openAuction = (route: string) => {
    startAuction();
    toast.success("Reverse auction opened", {
      description: `${route} · drivers bidding down in real time`,
      icon: <Gavel className="h-3.5 w-3.5" />,
    });
  };

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-2 px-1">
        <Brain className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Intelligent Commute Communities
        </span>
      </div>
      <p className="mb-2.5 px-1 text-[11px] text-muted-foreground">
        AI finds overlapping commutes and pools them before you even request.
      </p>

      {/* Highlighted callout */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-3 overflow-hidden rounded-2xl border border-violet-500/40 bg-gradient-to-br from-violet-500/15 via-cyan-500/5 to-transparent"
      >
        <div className="flex items-center gap-3 p-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/20">
            <Sparkles className="h-5 w-5 text-violet-300" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-bold uppercase tracking-wide text-violet-400">
              Live example
            </div>
            <div className="text-sm font-bold text-foreground">
              4 commuters · GH₵160 → GH₵74 · save GH₵86
            </div>
            <div className="text-[11px] text-muted-foreground">
              AI detected overlapping East Legon → Octagon commutes · 94% confidence
            </div>
          </div>
        </div>
      </motion.div>

      {/* Groups */}
      <div className="space-y-2">
        {COMMUTE_GROUPS.map((g, i) => {
          const save = g.currentCost - g.optimizedCost;
          const pct = Math.round((save / g.currentCost) * 100);
          return (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="overflow-hidden rounded-2xl border border-border/50 bg-card/40"
            >
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-foreground">{g.route}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Users className="h-3 w-3" /> {g.riderCount} riders
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-3 w-3" /> {g.departAt}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" /> {g.neighborhoods.join(", ")}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-cyan-500/15 px-1.5 py-0.5 text-[9px] font-bold text-cyan-400">
                    {g.confidence}% conf
                  </span>
                </div>

                {/* Cost comparison */}
                <div className="mt-2.5 flex items-center justify-between rounded-xl bg-foreground/[0.03] p-2.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold tabular-nums text-muted-foreground line-through">
                      GH₵{g.currentCost}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xl font-black tabular-nums text-emerald-400">
                      GH₵{g.optimizedCost}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-400">
                      <TrendingDown className="h-3 w-3" /> Save GH₵{save}
                    </span>
                    <span className="text-[9px] font-medium uppercase text-muted-foreground">
                      {pct}% reduction
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => openAuction(g.route)}
                className="flex w-full items-center justify-center gap-1.5 border-t border-border/40 bg-violet-500/10 py-2 text-xs font-bold text-violet-200 transition hover:bg-violet-500/20"
              >
                <Gavel className="h-3.5 w-3.5" /> Accept & open reverse auction
              </button>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/[0.04] p-2.5">
        <Brain className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          The AI continuously scans scheduled commutes across the network and
          pre-pools them — so by the time you tap "request", the group already
          exists.
        </p>
      </div>
    </div>
  );
}
