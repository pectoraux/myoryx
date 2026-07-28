"use client";
import { motion } from "framer-motion";
import { CONTINUOUS_OPT_EVENTS } from "@/lib/mock-data";
import { useOryx } from "@/lib/store";
import {
  Repeat,
  Scan,
  RefreshCw,
  AlertTriangle,
  GraduationCap,
  Eye,
  Zap,
} from "lucide-react";

const PHASE_LABEL: Record<string, { label: string; color: string }> = {
  before: { label: "Before booking", color: "text-cyan-400" },
  during: { label: "During travel", color: "text-amber-400" },
  after: { label: "After travel", color: "text-emerald-400" },
};

const TYPE_ICON: Record<string, any> = {
  scan: Scan,
  switch: RefreshCw,
  learn: GraduationCap,
  alert: AlertTriangle,
};

const TYPE_COLOR: Record<string, string> = {
  scan: "#22d3ee",
  switch: "#a78bfa",
  learn: "#4ade80",
  alert: "#f5a623",
};

export function ContinuousOptimization() {
  const { continuousMonitoring, setContinuousMonitoring } = useOryx();

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Repeat className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Continuous optimization
          </span>
        </div>
        <button
          onClick={() => setContinuousMonitoring(!continuousMonitoring)}
          className={`relative h-5 w-9 rounded-full transition ${continuousMonitoring ? "bg-emerald-500" : "bg-foreground/15"}`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${continuousMonitoring ? "left-[18px]" : "left-0.5"}`}
          />
        </button>
      </div>
      <p className="mb-2.5 px-1 text-[11px] text-muted-foreground">
        The optimization never stops — before, during, and after your trip.
      </p>

      {/* Timeline */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/40 p-3">
        {/* vertical line */}
        <div className="absolute left-[26px] top-4 bottom-4 w-px bg-border/40" />

        <div className="space-y-3">
          {CONTINUOUS_OPT_EVENTS.map((e, i) => {
            const Icon = TYPE_ICON[e.type] || Eye;
            const color = TYPE_COLOR[e.type];
            const phase = PHASE_LABEL[e.phase];
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="relative flex items-start gap-3"
              >
                <div
                  className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-background"
                  style={{ backgroundColor: `${color}25` }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color }} />
                </div>
                <div className="flex-1 pb-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold uppercase tracking-wide ${phase.color}`}>
                      {phase.label}
                    </span>
                    <span className="text-[9px] tabular-nums text-muted-foreground/60">
                      {e.time}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs font-bold text-foreground">
                    {e.title}
                  </div>
                  <div className="text-[11px] leading-snug text-muted-foreground">
                    {e.detail}
                  </div>
                  {e.saving ? (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      <Zap className="h-2.5 w-2.5" /> saved ${e.saving.toFixed(2)}
                    </span>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {continuousMonitoring && (
        <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.05] py-2.5 text-[11px] font-medium text-emerald-400">
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
            className="h-2 w-2 rounded-full bg-emerald-400"
          />
          AI still watching — will auto-switch if a cheaper ride appears
        </div>
      )}
    </div>
  );
}
