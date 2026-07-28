"use client";
import { useOryx } from "@/lib/store";
import { motion } from "framer-motion";
import { Clock, TrendingDown, Timer, Zap } from "lucide-react";

export default function WaitOptimizer() {
  const { quotes, destination } = useOryx();
  if (!destination || !quotes.length) return null;

  const baseline = quotes[0].price;
  const options = [
    { leaveInMin: 0, price: baseline, reason: "Leave now" },
    { leaveInMin: 4, price: Math.round(baseline * 0.73 * 100) / 100, reason: "Surge clearing" },
    { leaveInMin: 9, price: Math.round(baseline * 0.5 * 100) / 100, reason: "Off-peak window" },
  ];

  const best = options[options.length - 1];
  const maxSave = baseline - best.price;

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-card/40">
      <div className="flex items-center gap-2 border-b border-border/40 px-3.5 py-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15">
          <Timer className="h-3.5 w-3.5 text-violet-400" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-foreground">Wait optimizer</div>
          <div className="text-[11px] text-muted-foreground">Time-shift for lower fares</div>
        </div>
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
          −{Math.round((maxSave / baseline) * 100)}%
        </span>
      </div>

      <div className="grid grid-cols-3 divide-x divide-border/40">
        {options.map((o, i) => {
          const save = baseline - o.price;
          const isBest = i === options.length - 1;
          return (
            <motion.button
              key={i}
              whileTap={{ scale: 0.97 }}
              className={`relative flex flex-col items-center p-3 text-center transition ${
                isBest ? "bg-emerald-500/[0.06]" : ""
              }`}
            >
              <span className="text-[10px] font-medium uppercase text-muted-foreground">
                {o.leaveInMin === 0 ? "Now" : `+${o.leaveInMin}m`}
              </span>
              <span className={`mt-1 text-lg font-black tabular-nums ${isBest ? "text-emerald-400" : "text-foreground"}`}>
                ${o.price.toFixed(2)}
              </span>
              {save > 0 ? (
                <span className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-400">
                  <TrendingDown className="h-2.5 w-2.5" />${save.toFixed(2)}
                </span>
              ) : (
                <span className="mt-0.5 text-[10px] text-muted-foreground">baseline</span>
              )}
              {isBest && (
                <span className="absolute inset-x-2 bottom-1 text-[8px] font-bold uppercase text-emerald-400/70">
                  best
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="flex items-start gap-2 border-t border-border/40 bg-violet-500/[0.04] px-3.5 py-2.5">
        <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">AI prediction:</span> Waiting
          <span className="font-semibold text-violet-400"> {best.leaveInMin} minutes</span> saves
          <span className="font-semibold text-emerald-400"> ${maxSave.toFixed(2)}</span>. {best.reason}.
        </p>
      </div>
    </div>
  );
}
