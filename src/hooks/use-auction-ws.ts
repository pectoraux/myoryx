"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { DriverBid, MarketTicker, AuctionPhase } from "@/lib/types";
import { PROVIDERS, DRIVER_NAMES, VEHICLES } from "@/lib/mock-data";

interface AuctionTick {
  countdown: number;
  currentBestPrice: number;
  totalSavings: number;
  phase: AuctionPhase;
}

interface UseAuctionWs {
  connected: boolean;
  tickers: MarketTicker[];
  start: (startPrice: number, intensity: number) => void;
  book: () => void;
  stop: () => void;
  liveBids: DriverBid[];
  countdown: number;
  currentBest: number;
  totalSavings: number;
  phase: AuctionPhase | null;
  winningBid: DriverBid | null;
  reset: () => void;
}

// ---- Local fallback simulation (used if WS is unavailable) ---------------
function localBid(price: number): DriverBid {
  const provider = PROVIDERS[Math.floor(Math.random() * 5)];
  return {
    id: `lb-${Math.random().toString(36).slice(2, 9)}`,
    providerId: provider.id,
    providerName: provider.name,
    driverName: DRIVER_NAMES[Math.floor(Math.random() * DRIVER_NAMES.length)],
    driverRating: Math.round((4.2 + Math.random() * 0.7) * 10) / 10,
    vehicle: VEHICLES[Math.floor(Math.random() * VEHICLES.length)],
    price: Math.round(price * 100) / 100,
    eta: Math.floor(1 + Math.random() * 7),
    timestamp: Date.now(),
    featured: Math.random() > 0.6,
  };
}

export function useAuctionWs(): UseAuctionWs {
  const socketRef = useRef<Socket | null>(null);
  const simTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsReceivedRef = useRef(false);
  const initialBestRef = useRef(0);
  const bestRef = useRef<DriverBid | null>(null);
  const [connected, setConnected] = useState(false);
  const [tickers, setTickers] = useState<MarketTicker[]>([]);
  const [liveBids, setLiveBids] = useState<DriverBid[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [currentBest, setCurrentBest] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);
  const [phase, setPhase] = useState<AuctionPhase | null>(null);
  const [winningBid, setWinningBid] = useState<DriverBid | null>(null);

  const clearSim = useCallback(() => {
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }
  }, []);

  // sync best bid → derived state
  const syncBest = useCallback((bids: DriverBid[]) => {
    const best = bids[0] || null;
    bestRef.current = best;
    if (best) {
      setCurrentBest(best.price);
      setTotalSavings(
        Math.max(0, Math.round((initialBestRef.current - best.price) * 100) / 100)
      );
    }
  }, []);

  useEffect(() => {
    // On Vercel (or when explicitly disabled), skip the WebSocket mini-service
    // and rely on the local auction simulation — identical UX.
    const useWs = process.env.NEXT_PUBLIC_AUCTION_WS !== "false";
    if (!useWs) return;

    const socket = io("/?XTransformPort=3003", {
      path: "/",
      transports: ["websocket", "polling"],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1200,
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("reconnect", () => setConnected(true));

    socket.on("market:ticker", (t: MarketTicker) => {
      setTickers((prev) => [t, ...prev].slice(0, 8));
    });

    socket.on("auction:state", (s: any) => {
      wsReceivedRef.current = true;
      clearSim();
      const bids = (s.bids || []) as DriverBid[];
      setLiveBids(bids);
      setCountdown(s.countdown || 20);
      setTotalSavings(0);
      setPhase(s.phase || "gathering");
      setWinningBid(null);
      syncBest(bids);
    });

    socket.on("auction:bid", (b: DriverBid) => {
      wsReceivedRef.current = true;
      setLiveBids((prev) => {
        const next = [b, ...prev].sort((a, c) => a.price - c.price).slice(0, 12);
        syncBest(next);
        return next;
      });
    });

    socket.on("auction:tick", (t: AuctionTick) => {
      setCountdown(t.countdown);
      setCurrentBest(t.currentBestPrice);
      setTotalSavings(t.totalSavings);
      setPhase(t.phase);
    });

    socket.on("auction:booked", (p: { winningBid: DriverBid | null; totalSavings: number }) => {
      setPhase("booked");
      setWinningBid(p.winningBid);
      setTotalSavings(p.totalSavings);
    });

    return () => {
      socket.emit("auction:stop");
      socket.disconnect();
      clearSim();
    };
  }, [clearSim, syncBest]);

  const start = useCallback(
    (startPrice: number, intensity: number) => {
      setLiveBids([]);
      setWinningBid(null);
      setTotalSavings(0);
      setPhase("gathering");
      setCountdown(20);
      wsReceivedRef.current = false;
      clearSim();

      const initialBest = Math.round(startPrice * 0.96 * 100) / 100;
      initialBestRef.current = initialBest;
      setCurrentBest(initialBest);

      // Seed bids immediately for instant feedback
      const seed: DriverBid[] = [];
      for (let i = 0; i < 5; i++) {
        seed.push(localBid(initialBest * (0.96 + i * 0.05)));
      }
      const seedSorted = seed.sort((a, b) => a.price - b.price);
      setLiveBids(seedSorted);
      syncBest(seedSorted);

      // Emit to WS (works through gateway)
      socketRef.current?.emit("auction:start", { startPrice, intensity });

      // Fallback: if WS unavailable (Vercel) or doesn't deliver, run local sim.
      // Immediate when WS is disabled; 2.5s grace when WS is attempting.
      const wsDisabled = process.env.NEXT_PUBLIC_AUCTION_WS === "false";
      const fallbackDelay = wsDisabled ? 0 : 2500;
      const fallbackStart = setTimeout(() => {
        if (wsReceivedRef.current) return; // WS is working
        let cd = 20;
        simTimerRef.current = setInterval(() => {
          cd -= 1;
          setCountdown(Math.max(0, cd));
          setPhase(cd <= 0 ? "final" : "bidding");
          setLiveBids((prev) => {
            const best = prev[0];
            if (!best) return prev;
            const drop = 0.15 + Math.random() * 0.55 * intensity;
            const newPrice = Math.max(best.price - drop, initialBestRef.current * 0.45);
            const nb = localBid(newPrice);
            const next = [nb, ...prev].sort((a, b) => a.price - b.price).slice(0, 12);
            syncBest(next);
            return next;
          });
          if (cd <= 0) clearSim();
        }, 1000);
      }, 2500);

      // If WS arrives later, cancel the pending fallback
      const wsCheck = setInterval(() => {
        if (wsReceivedRef.current) {
          clearTimeout(fallbackStart);
          clearSim();
          clearInterval(wsCheck);
        }
      }, 400);
      setTimeout(() => clearInterval(wsCheck), 5000);
    },
    [clearSim, syncBest]
  );

  const book = useCallback(() => {
    clearSim();
    socketRef.current?.emit("auction:book");
    // local booking fallback (if WS doesn't respond)
    setTimeout(() => {
      setPhase((p) => (p === "booked" ? p : "booked"));
      setWinningBid((prev) => prev ?? bestRef.current);
    }, 300);
  }, [clearSim]);

  const stop = useCallback(() => {
    clearSim();
    socketRef.current?.emit("auction:stop");
  }, [clearSim]);

  const reset = useCallback(() => {
    clearSim();
    setLiveBids([]);
    setWinningBid(null);
    setTotalSavings(0);
    setCountdown(0);
    setPhase(null);
    setCurrentBest(0);
    bestRef.current = null;
  }, [clearSim]);

  return {
    connected,
    tickers,
    start,
    book,
    stop,
    liveBids,
    countdown,
    currentBest,
    totalSavings,
    phase,
    winningBid,
    reset,
  };
}
