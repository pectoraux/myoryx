"use client";
import { motion } from "framer-motion";
import { AI2AI_TRANSACTIONS } from "@/lib/mock-data";
import {
  Bot,
  ArrowRight,
  Check,
  Activity,
  TrendingDown,
  Zap,
} from "lucide-react";

function TrendSpark({ data }: { data: number[] }) {
  // Inline SVG polyline showing price dropping per round.
  const w = 80;
  const h = 24;
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 4) - 2}`)
    .join(" ");
  return (
    <svg width={w} height={h} className="shrink-0">
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5a623" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#f5a623" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={`0,${h} ${points} ${w},${h}`}
        fill="url(#spark-grad)"
        stroke="none"
      />
      <polyline
        points={points}
        fill="none"
        stroke="#f5a623"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* end dot */}
      <circle
        cx={(data.length - 1) * step}
        cy={h - ((data[data.length - 1] - min) / range) * (h - 4) - 2}
        r="2"
        fill="#f5a623"
      />
    </svg>
  );
}

export default function AI2AIMarketplace() {
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-2 px-1">
        <Bot className="h-3.5 w-3.5 text-amber-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Autonomous Marketplace
        </span>
      </div>
      <p className="mb-2.5 px-1 text-[11px] text-muted-foreground">
        AI-to-AI negotiation. Riders, drivers, fleets, couriers, NPDs — all
        agents negotiate continuously.
      </p>

      <div className="space-y-2">
        {AI2AI_TRANSACTIONS.map((t, i) => {
          const settled = t.status === "settled";
          const negotiating = t.status === "negotiating";
          const savings = Math.max(0, t.openingPrice - t.currentPrice);
          const dropPct = Math.round((savings / t.openingPrice) * 100);
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`overflow-hidden rounded-2xl border p-3 ${
                settled
                  ? "border-emerald-500/30 bg-emerald-500/[0.05]"
                  : "border-amber-500/30 bg-amber-500/[0.05]"
              }`}
            >
              {/* Agent vs agent */}
              <div className="flex items-center gap-2 text-[11px]">
                <span className="flex items-center gap-1 rounded-md bg-foreground/[0.06] px-1.5 py-0.5 font-semibold text-foreground">
                  <Bot className="h-2.5 w-2.5 text-cyan-400" />
                  {t.buyerAgent}
                </span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="flex items-center gap-1 rounded-md bg-foreground/[0.06] px-1.5 py-0.5 font-semibold text-foreground">
                  <Bot className="h-2.5 w-2.5 text-amber-400" />
                  {t.sellerAgent}
                </span>
              </div>

              <div className="mt-2 text-xs font-bold text-foreground">
                {t.asset}
              </div>

              {/* Trend + status row */}
              <div className="mt-2 flex items-center justify-between gap-3">
                <TrendSpark data={t.trend} />
                <div className="flex flex-col items-end gap-0.5">
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase">
                    {settled ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Check className="h-3 w-3" /> Settled
                      </span>
                    ) : negotiating ? (
                      <span className="flex items-center gap-1 text-amber-400">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                        </span>
                        Negotiating
                      </span>
                    ) : (
                      <span className="text-rose-400">Rejected</span>
                    )}
                  </span>
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {t.rounds} rounds
                  </span>
                </div>
              </div>

              {/* Price row */}
              <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-2 text-[11px]">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-muted-foreground line-through tabular-nums">
                    ${t.openingPrice.toFixed(2)}
                  </span>
                  <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                  <span
                    className={`text-sm font-black tabular-nums ${
                      settled ? "text-emerald-400" : "text-amber-300"
                    }`}
                  >
                    ${t.currentPrice.toFixed(2)}
                  </span>
                </div>
                {savings > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-400">
                    <TrendingDown className="h-3 w-3" />
                    −{dropPct}% · save ${savings.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Last action */}
              <div className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-foreground/[0.03] px-2 py-1.5">
                <Activity className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
                <span className="text-[10px] leading-snug text-muted-foreground">
                  {t.lastAction}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/[0.04] p-2.5">
        <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          No human in the loop. Every agent — rider, driver, fleet, courier,
          NPD — runs continuously, opening and closing deals faster than any
          human marketplace could.
        </p>
      </div>
    </div>
  );
}
