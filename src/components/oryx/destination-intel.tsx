"use client";
import { useOryx } from "@/lib/store";
import { motion } from "framer-motion";
import { CloudRain, CalendarClock, TrendingDown, Activity } from "lucide-react";

const INTEL = [
  {
    icon: CalendarClock,
    color: "#f5a623",
    title: "Concert ending soon",
    detail: "Accra Sports Stadium lets out in ~22 min. Book now to avoid 2.4× surge.",
    action: "Leave in 12 min",
    saving: "34%",
  },
  {
    icon: CloudRain,
    color: "#22d3ee",
    title: "Rain expected 18:40",
    detail: "Demand spikes 8 min after rain. Pre-book during the dry window.",
    action: "Reserve now",
    saving: "31%",
  },
];

export default function DestinationIntel() {
  const { destination } = useOryx();
  if (!destination) return null;

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-2 px-1">
        <Activity className="h-3.5 w-3.5 text-cyan-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Destination intelligence
        </span>
      </div>
      <div className="space-y-2">
        {INTEL.map((it, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="overflow-hidden rounded-2xl border border-border/50 bg-card/40"
          >
            <div className="flex items-stretch">
              <div
                className="flex w-1 shrink-0"
                style={{ backgroundColor: it.color }}
              />
              <div className="flex flex-1 items-start gap-3 p-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${it.color}20` }}
                >
                  <it.icon className="h-4 w-4" style={{ color: it.color }} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-foreground">{it.title}</div>
                  <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                    {it.detail}
                  </div>
                </div>
              </div>
            </div>
            <button className="flex w-full items-center justify-between border-t border-border/40 px-3 py-2 transition hover:bg-foreground/[0.03]">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <TrendingDown className="h-3.5 w-3.5" style={{ color: it.color }} />
                {it.action} · save {it.saving}
              </span>
              <span className="text-xs font-medium text-muted-foreground">→</span>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
