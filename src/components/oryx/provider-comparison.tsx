"use client";
import { useOryx } from "@/lib/store";
import { motion } from "framer-motion";
import {
  Zap,
  Leaf,
  Luggage,
  Baby,
  Accessibility,
  Dog,
  Crown,
  Users,
  Gauge,
  Star,
  ChevronRight,
  TrendingDown,
} from "lucide-react";

const FEATURE_ICON: Record<string, { icon: any; label: string }> = {
  electric: { icon: Leaf, label: "Electric" },
  luggage: { icon: Luggage, label: "Luggage" },
  "pet-friendly": { icon: Dog, label: "Pet" },
  "child-seat": { icon: Baby, label: "Child seat" },
  accessibility: { icon: Accessibility, label: "Accessible" },
  luxury: { icon: Crown, label: "Luxury" },
  shared: { icon: Users, label: "Shared" },
  fast: { icon: Zap, label: "Fast" },
};

export default function ProviderComparison() {
  const { quotes, destination, agent, setSheetSnap, setActiveView } = useOryx();
  const goAuction = () => {
    setActiveView("auction");
    setSheetSnap("full");
  };

  if (!destination) {
    return (
      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
        Pick a destination to compare every provider.
      </div>
    );
  }

  if (!quotes.length) return null;

  const cheapest = quotes[0];
  const fastest = [...quotes].sort((a, b) => a.eta - b.eta)[0];

  return (
    <div className="px-4 pb-6 pt-1">
      {/* AI recommendation banner */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent"
      >
        <div className="flex items-start gap-3 p-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20">
            <TrendingDown className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-400">
              AI recommendation
            </div>
            <div className="mt-0.5 text-sm font-semibold text-foreground">
              Run a live auction — drivers bid below ${cheapest.price.toFixed(2)}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              Last 10 auctions to {destination.name.split(" ").slice(0, 2).join(" ")} averaged
              <span className="font-semibold text-emerald-400"> 31% savings</span>.
            </div>
          </div>
        </div>
        <button
          onClick={goAuction}
          className="flex w-full items-center justify-center gap-2 bg-emerald-500 py-3 text-sm font-bold text-emerald-950 transition hover:bg-emerald-400"
        >
          <Zap className="h-4 w-4" />
          Start reverse auction
        </button>
      </motion.div>

      {/* Sort row */}
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {quotes.length} providers · sorted by price
        </span>
        <div className="flex gap-1.5">
          <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            Price
          </span>
          <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            ETA
          </span>
        </div>
      </div>

      {/* Provider cards */}
      <div className="space-y-2">
        {quotes.map((q, i) => {
          const isCheapest = i === 0;
          const isFastest = q.providerId === fastest.providerId;
          return (
            <motion.div
              key={q.providerId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`relative overflow-hidden rounded-2xl border bg-card/60 transition hover:bg-card ${
                isCheapest ? "border-emerald-500/40" : "border-border/50"
              }`}
            >
              {isCheapest && (
                <div className="absolute right-0 top-0 rounded-bl-xl bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
                  Cheapest now
                </div>
              )}
              <div className="flex items-center gap-3 p-3">
                {/* Provider badge */}
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-black text-white shadow-lg"
                  style={{ backgroundColor: q.provider.color, boxShadow: `0 4px 14px ${q.provider.color}40` }}
                >
                  {q.provider.emoji}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      {q.provider.name}
                    </span>
                    {isFastest && (
                      <span className="flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-400">
                        <Zap className="h-2.5 w-2.5" /> Fastest
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {q.provider.rating}
                    </span>
                    <span>·</span>
                    <span>{q.eta} min away</span>
                    <span>·</span>
                    <span>{q.duration} min ride</span>
                  </div>
                  {/* Features */}
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {q.features.slice(0, 4).map((f) => {
                      const fi = FEATURE_ICON[f];
                      if (!fi) return null;
                      const Icon = fi.icon;
                      return (
                        <span
                          key={f}
                          className="flex items-center gap-1 rounded-md bg-foreground/[0.05] px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground"
                        >
                          <Icon className="h-2.5 w-2.5" />
                          {fi.label}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Price */}
                <div className="flex flex-col items-end">
                  {q.surge > 1.1 && (
                    <span className="text-[10px] font-medium text-rose-400 line-through">
                      ${(q.price / q.surge).toFixed(2)}
                    </span>
                  )}
                  <span className={`text-lg font-bold tabular-nums ${isCheapest ? "text-emerald-400" : "text-foreground"}`}>
                    ${q.price.toFixed(2)}
                  </span>
                  {q.surge > 1.1 ? (
                    <span className="text-[10px] font-medium text-rose-400">
                      {q.surge.toFixed(1)}× surge
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-emerald-400/70">
                      no surge
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tap to auction hint */}
      <button
        onClick={goAuction}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/70 py-3 text-xs font-semibold text-muted-foreground transition hover:border-emerald-500/40 hover:text-emerald-400"
      >
        <Gauge className="h-3.5 w-3.5" />
        Let all providers bid against each other
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
