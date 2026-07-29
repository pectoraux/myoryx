"use client";
import { useAuctionWs } from "@/hooks/use-auction-ws";
import { useMemo } from "react";

const COLORS: Record<string, string> = {
  saving: "text-emerald-400",
  auction: "text-amber-400",
  pool: "text-violet-400",
  alert: "text-rose-400",
};

export default function MarketTicker() {
  const { tickers } = useAuctionWs();

  // Combine live tickers with seed fallback so it's never empty
  const items = useMemo(() => {
    const seed = [
      { id: "s1", text: "Labadi → Airport auction cleared at $11.40", type: "auction" },
      { id: "s2", text: "Osu pool matched · 4 riders · $6.20 each", type: "pool" },
      { id: "s3", text: "Surge clearing on Spintex in 7 min · −34%", type: "alert" },
      { id: "s4", text: "Oryx+ subscribers averaging 23% below city median", type: "saving" },
      { id: "s5", text: "Stadium demand pooling: 120 riders batching", type: "pool" },
      { id: "s6", text: "Rain expected 18:40 · book in 12 min to save 31%", type: "alert" },
    ];
    const merged = [...tickers, ...seed];
    // dedupe by text
    const seen = new Set<string>();
    return merged.filter((t) => {
      if (seen.has(t.text)) return false;
      seen.add(t.text);
      return true;
    }).slice(0, 12);
  }, [tickers]);

  const loop = [...items, ...items];

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[64px] z-20 px-3 sm:top-[72px]">
      <div className="glass mx-auto flex max-w-6xl items-center gap-2 overflow-hidden rounded-full border border-border/50 px-3 py-1.5 shadow-lg shadow-black/30">
        <span className="flex shrink-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
          </span>
          LIVE
        </span>
        <div className="relative flex-1 overflow-hidden">
          <div className="ticker-scroll flex w-max gap-8 whitespace-nowrap">
            {loop.map((t, i) => (
              <span
                key={`${t.id}-${i}`}
                className={`text-xs font-medium ${COLORS[t.type] || "text-muted-foreground"}`}
              >
                <span className="mr-2 text-muted-foreground/40">◆</span>
                {t.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
