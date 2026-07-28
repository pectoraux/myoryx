"use client";
import { motion } from "framer-motion";
import { Users, Brain, Car, Fuel, DollarSign, Megaphone } from "lucide-react";

const NODES = [
  { icon: Users, label: "More riders", color: "#72b1a6" },
  { icon: Brain, label: "Better AI", color: "#a78bfa" },
  { icon: Car, label: "Higher utilization", color: "#f5a623" },
  { icon: Fuel, label: "Less empty miles", color: "#ff6b35" },
  { icon: DollarSign, label: "Lower prices", color: "#4ade80" },
  { icon: Megaphone, label: "Word spreads", color: "#22d3ee" },
];

export function FlywheelViz() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/30 p-4">
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {NODES.map((n, i) => (
          <div key={i} className="flex items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border/50 bg-background/60 px-2.5 py-2"
              style={{ minWidth: 78 }}
            >
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${n.color}25` }}
              >
                <n.icon className="h-3.5 w-3.5" style={{ color: n.color }} />
              </div>
              <span className="text-center text-[9px] font-semibold leading-tight text-foreground/80">
                {n.label}
              </span>
            </motion.div>
            {i < NODES.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.08 + 0.1 }}
                className="px-0.5 text-muted-foreground/50"
              >
                ↓
              </motion.div>
            )}
          </div>
        ))}
        {/* loop arrow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="ml-1 flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 text-[9px] font-bold uppercase text-emerald-400"
        >
          ↻ repeat forever
        </motion.div>
      </div>
      <p className="mt-3 text-center text-[10px] leading-relaxed text-muted-foreground/70">
        As utilization improves, drivers earn the same income from more efficient
        routing — fares fall without cutting earnings.
      </p>
    </div>
  );
}
