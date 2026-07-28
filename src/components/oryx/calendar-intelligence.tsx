"use client";
import { motion } from "framer-motion";
import { CALENDAR_SUGGESTIONS } from "@/lib/mock-data";
import { CalendarClock, TrendingDown, ArrowRight, Check, Lock } from "lucide-react";

export function CalendarIntelligence() {
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Calendar intelligence
          </span>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-violet-400">
          <Lock className="h-2.5 w-2.5" /> private
        </span>
      </div>

      <div className="space-y-2">
        {CALENDAR_SUGGESTIONS.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="overflow-hidden rounded-2xl border border-violet-500/30 bg-violet-500/[0.05]"
          >
            <div className="p-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">
                  {s.event}
                </span>
                <span className="rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-bold text-violet-400">
                  {s.confidence}% confidence
                </span>
              </div>

              {/* Time shift visualization */}
              <div className="mt-2.5 flex items-center gap-2">
                <div className="flex-1 rounded-lg bg-foreground/[0.04] px-2.5 py-2 text-center">
                  <div className="text-[9px] font-medium uppercase text-muted-foreground">
                    Now
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    {s.originalTime}
                  </div>
                  <div className="text-[10px] tabular-nums text-muted-foreground">
                    GH₵{s.originalCost}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-violet-400" />
                <div className="flex-1 rounded-lg bg-violet-500/15 px-2.5 py-2 text-center">
                  <div className="text-[9px] font-medium uppercase text-violet-400">
                    Suggested
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    {s.suggestedTime}
                  </div>
                  <div className="text-[10px] font-bold tabular-nums text-emerald-400">
                    GH₵{s.suggestedCost}
                  </div>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-emerald-500/15 px-2.5 py-2">
                  <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-sm font-black tabular-nums text-emerald-400">
                    −{s.saving}
                  </span>
                </div>
              </div>

              <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                {s.reason}
              </p>
            </div>
            <button className="flex w-full items-center justify-center gap-1.5 border-t border-violet-500/20 bg-violet-500/10 py-2 text-xs font-bold text-violet-300 transition hover:bg-violet-500/20">
              <Check className="h-3.5 w-3.5" />
              Shift schedule · save GH₵{s.saving}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
