"use client";
import { useState } from "react";
import { useOryx } from "@/lib/store";
import { useAuctionWs } from "@/hooks/use-auction-ws";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gavel,
  TrendingDown,
  Check,
  Sparkles,
  Loader2,
  Trophy,
  Star,
  RotateCcw,
  Zap,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";

const INTENSITY: Record<string, number> = {
  balanced: 0.6,
  "aggressive-saver": 0.8,
  "maximum-saver": 0.95,
  rush: 0.2,
  luxury: 0.3,
  business: 0.45,
};

export default function AuctionPanel() {
  const {
    destination,
    quotes,
    agent,
    autoBook,
    setAutoBook,
    maxPrice,
    setMaxPrice,
    resetAuction,
    addSavings,
    setLiveAuctionActive,
  } = useOryx();
  const ws = useAuctionWs();
  const [started, setStarted] = useState(false);
  const [booked, setBooked] = useState(false);

  const baseline = quotes.length ? quotes[0].price : 19;
  const startPrice = baseline * 1.15;

  const handleStart = () => {
    if (!destination) {
      toast.error("Pick a destination first");
      return;
    }
    setStarted(true);
    setBooked(false);
    setLiveAuctionActive(true);
    ws.start(Number(startPrice.toFixed(2)), INTENSITY[agent] ?? 0.6);
  };

  const handleBook = () => {
    ws.book();
    setBooked(true);
    setLiveAuctionActive(false);
    if (ws.totalSavings > 0) {
      addSavings(ws.totalSavings);
      toast.success(`Booked! You saved $${ws.totalSavings.toFixed(2)}`, {
        description: `${ws.liveBids[0]?.providerName} · ${ws.liveBids[0]?.driverName}`,
      });
    } else {
      toast.success("Ride booked!");
    }
  };

  const handleReset = () => {
    ws.reset();
    setStarted(false);
    setBooked(false);
    setLiveAuctionActive(false);
    resetAuction();
  };

  // ---- Not started state ----
  if (!started) {
    return (
      <div className="px-4 pb-8 pt-1">
        <div className="mb-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-400">
            <Gavel className="h-3 w-3" /> Reverse Auction
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-foreground">
            Drivers compete for you
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            We broadcast your request to every provider. Prices fall in real-time
            until you book. The AI never stops negotiating.
          </p>
        </div>

        {/* Trip summary */}
        <div className="mb-4 rounded-2xl border border-border/60 bg-card/50 p-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{destination?.emoji || "📍"}</div>
            <div className="flex-1">
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Destination
              </div>
              <div className="text-sm font-bold text-foreground">
                {destination?.name || "Select a destination"}
              </div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-foreground/[0.04] py-2">
              <div className="text-[10px] font-medium uppercase text-muted-foreground">Baseline</div>
              <div className="text-sm font-bold tabular-nums text-foreground">${baseline.toFixed(2)}</div>
            </div>
            <div className="rounded-xl bg-amber-500/10 py-2">
              <div className="text-[10px] font-medium uppercase text-amber-400">Auction start</div>
              <div className="text-sm font-bold tabular-nums text-amber-400">${startPrice.toFixed(2)}</div>
            </div>
            <div className="rounded-xl bg-emerald-500/10 py-2">
              <div className="text-[10px] font-medium uppercase text-emerald-400">Target floor</div>
              <div className="text-sm font-bold tabular-nums text-emerald-400">${(baseline * 0.5).toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Agent strategy note */}
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-border/50 bg-foreground/[0.03] p-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          <div className="text-xs text-muted-foreground">
            Your <span className="font-semibold text-foreground">AI agent</span> will negotiate at
            <span className="font-semibold text-foreground"> {Math.round((INTENSITY[agent] ?? 0.6) * 100)}%</span> intensity.
            Switch agents anytime from the strategy tab.
          </div>
        </div>

        {/* Auto-book toggle */}
        <div className="mb-4 flex items-center justify-between rounded-xl border border-border/50 p-3">
          <div>
            <div className="text-sm font-semibold text-foreground">Auto-book ceiling</div>
            <div className="text-xs text-muted-foreground">
              Book automatically at or below this price
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              step="0.5"
              className="w-16 rounded-lg border border-border/60 bg-background px-2 py-1 text-right text-sm font-bold tabular-nums text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              onClick={() => setAutoBook(!autoBook)}
              className={`relative h-6 w-11 rounded-full transition ${autoBook ? "bg-emerald-500" : "bg-foreground/15"}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${autoBook ? "left-[22px]" : "left-0.5"}`}
              />
            </button>
          </div>
        </div>

        <button
          onClick={handleStart}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 py-4 text-base font-bold text-amber-950 shadow-lg shadow-amber-500/30 transition hover:from-amber-400 hover:to-amber-300 active:scale-[0.99]"
        >
          <Gavel className="h-5 w-5" />
          Open the auction
        </button>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          20-second countdown · prices fall every few seconds
        </p>
      </div>
    );
  }

  // ---- Booked state ----
  if (booked || ws.phase === "booked") {
    const winner = ws.winningBid || ws.liveBids[0];
    return (
      <div className="px-4 pb-8 pt-1">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="overflow-hidden rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent"
        >
          <div className="flex flex-col items-center p-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-emerald-950 shadow-xl shadow-emerald-500/40"
            >
              <Check className="h-8 w-8" strokeWidth={3} />
            </motion.div>
            <h3 className="mt-4 text-xl font-black text-foreground">Ride secured</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {winner?.providerName} · {winner?.driverName}
            </p>

            <div className="mt-5 w-full rounded-2xl bg-background/60 p-4">
              <div className="flex items-end justify-center gap-2">
                <span className="text-4xl font-black tabular-nums text-emerald-400">
                  ${winner?.price.toFixed(2)}
                </span>
                <span className="mb-1 text-sm text-muted-foreground line-through">
                  ${(winner?.price ?? 0 + ws.totalSavings).toFixed(2)}
                </span>
              </div>
              <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-bold text-emerald-400">
                <Trophy className="h-3.5 w-3.5" />
                You saved ${ws.totalSavings.toFixed(2)}
              </div>
            </div>

            <div className="mt-4 grid w-full grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-background/40 p-2.5">
                <div className="text-[10px] uppercase text-muted-foreground">ETA</div>
                <div className="text-sm font-bold text-foreground">{winner?.eta} min</div>
              </div>
              <div className="rounded-xl bg-background/40 p-2.5">
                <div className="text-[10px] uppercase text-muted-foreground">Vehicle</div>
                <div className="text-sm font-bold text-foreground">{winner?.vehicle?.split(" ")[0]}</div>
              </div>
              <div className="rounded-xl bg-background/40 p-2.5">
                <div className="text-[10px] uppercase text-muted-foreground">Rating</div>
                <div className="text-sm font-bold text-foreground">{winner?.driverRating}★</div>
              </div>
            </div>
          </div>
        </motion.div>

        <button
          onClick={handleReset}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-border/60 py-3.5 text-sm font-bold text-foreground transition hover:bg-foreground/[0.04]"
        >
          <RotateCcw className="h-4 w-4" />
          New ride
        </button>
      </div>
    );
  }

  // ---- Live auction state ----
  const progress = (ws.countdown / 20) * 100;

  return (
    <div className="px-4 pb-8 pt-1">
      {/* Countdown + price */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-500/12 via-amber-500/4 to-transparent">
        <div className="p-5">
          {/* status row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                {ws.phase === "gathering" ? "Gathering bids" : ws.phase === "final" ? "Finalizing" : "Live bidding"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              AI negotiating
            </div>
          </div>

          {/* Big price */}
          <div className="mt-4 flex items-end justify-center gap-3">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={ws.currentBest.toFixed(2)}
                initial={{ y: -16, opacity: 0, color: "#4ade80" }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 16, opacity: 0, position: "absolute" }}
                transition={{ duration: 0.35 }}
                className="text-5xl font-black tabular-nums text-foreground"
              >
                ${ws.currentBest.toFixed(2)}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mt-1 flex items-center justify-center gap-2 text-sm">
            <span className="text-muted-foreground line-through">
              ${(ws.currentBest + ws.totalSavings).toFixed(2)}
            </span>
            {ws.totalSavings > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-400">
                <TrendingDown className="h-3 w-3" />−${ws.totalSavings.toFixed(2)}
              </span>
            )}
          </div>

          {/* Countdown bar */}
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-[11px] font-medium">
              <span className="text-muted-foreground">Auction closes in</span>
              <span className="font-bold tabular-nums text-amber-400">
                {Math.floor(ws.countdown / 60)}:
                {String(ws.countdown % 60).padStart(2, "0")}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
                animate={{ width: `${progress}%` }}
                transition={{ ease: "linear", duration: 0.9 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bid feed */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Live bids · {ws.liveBids.length}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
            <ArrowDown className="h-3 w-3" /> sorting low → high
          </span>
        </div>
        <div className="space-y-1.5">
          <AnimatePresence initial={false}>
            {ws.liveBids.slice(0, 6).map((bid, i) => (
              <motion.div
                key={bid.id}
                layout
                initial={{ opacity: 0, x: -20, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className={`flex items-center gap-3 rounded-xl border p-2.5 ${
                  i === 0
                    ? "border-emerald-500/50 bg-emerald-500/[0.07]"
                    : "border-border/50 bg-card/40"
                }`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.06] text-xs font-bold text-foreground">
                  {i === 0 ? (
                    <Trophy className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    i + 1
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground">
                    {bid.providerName} · {bid.driverName}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                      {bid.driverRating}
                    </span>
                    <span>·</span>
                    <span>{bid.vehicle}</span>
                    <span>·</span>
                    <span>{bid.eta} min</span>
                  </div>
                </div>
                <div className={`text-base font-bold tabular-nums ${i === 0 ? "text-emerald-400" : "text-foreground"}`}>
                  ${bid.price.toFixed(2)}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Auto-book indicator */}
      {autoBook && (
        <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.05] py-2.5 text-xs font-medium text-emerald-400">
          <Zap className="h-3.5 w-3.5" />
          Auto-books at ${maxPrice.toFixed(2)} or below
        </div>
      )}

      {/* Book button */}
      <button
        onClick={handleBook}
        disabled={!ws.liveBids.length}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-base font-bold text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-50"
      >
        <Check className="h-5 w-5" />
        Book ${ws.currentBest.toFixed(2)} · save ${ws.totalSavings.toFixed(2)}
      </button>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Price keeps dropping until you tap — or until the timer ends
      </p>
    </div>
  );
}
