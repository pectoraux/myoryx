"use client";
import { useOryx } from "@/lib/store";
import { AGENTS } from "@/lib/mock-data";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";

export default function AgentSelector() {
  const { agent, setAgent } = useOryx();

  return (
    <div className="px-4 pb-6 pt-1">
      <div className="mb-1 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-400">
          <Icons.Bot className="h-3 w-3" /> AI Agent
        </div>
        <h2 className="mt-3 text-xl font-black tracking-tight text-foreground">
          Choose your negotiator
        </h2>
        <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
          Your agent bargains on your behalf, decides wait tolerance, and books when
          the price is right.
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {AGENTS.map((a, i) => {
          const Icon = (Icons as any)[a.icon] || Icons.Bot;
          const active = agent === a.id;
          return (
            <motion.button
              key={a.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setAgent(a.id)}
              className={`relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border p-3.5 text-left transition ${
                active
                  ? "border-emerald-500/50 bg-emerald-500/[0.07]"
                  : "border-border/50 bg-card/40 hover:border-border"
              }`}
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${a.color}25` }}
              >
                <Icon className="h-5 w-5" style={{ color: a.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">{a.name}</span>
                  {active && (
                    <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-400">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-medium text-muted-foreground">
                  {a.tagline}
                </div>
                <div className="mt-1 text-[11px] leading-snug text-muted-foreground/80">
                  {a.description}
                </div>
              </div>
              {active && (
                <div className="absolute right-3 top-3">
                  <Icons.Check className="h-4 w-4 text-emerald-400" strokeWidth={3} />
                </div>
              )}
              {/* intensity meter */}
              <div className="absolute inset-x-3 bottom-2 flex items-center gap-1.5">
                <span className="text-[9px] font-medium uppercase text-muted-foreground/60">
                  Negotiate
                </span>
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-foreground/10">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${a.negotiateIntensity * 100}%`, backgroundColor: a.color }}
                  />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
