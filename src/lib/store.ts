import { create } from "zustand";
import type {
  AuctionState,
  DriverBid,
  AgentStrategy,
  SavingsStats,
  Destination,
  FareQuote,
  Provider,
} from "./types";
import {
  PROVIDERS,
  DRIVER_NAMES,
  VEHICLES,
  computeFare,
  SAVINGS_STATS,
} from "./mock-data";

type SheetSnap = "collapsed" | "half" | "full";

interface OryxStore {
  // UI
  sheetSnap: SheetSnap;
  setSheetSnap: (s: SheetSnap) => void;
  introSeen: boolean;
  setIntroSeen: (v: boolean) => void;
  activeView: "search" | "auction" | "compare" | "routes" | "savings";
  setActiveView: (v: "search" | "auction" | "compare" | "routes" | "savings") => void;

  // Trip
  origin: string;
  destination: Destination | null;
  setDestination: (d: Destination | null) => void;
  distanceKm: number;
  durationMin: number;
  setTripMetrics: (km: number, min: number) => void;

  // Providers / fares
  quotes: FareQuote[];
  generateQuotes: () => void;

  // Auction
  auction: AuctionState;
  startAuction: () => void;
  applyBid: (bid: DriverBid) => void;
  tickAuction: () => void;
  endAuction: () => void;
  resetAuction: () => void;
  bookWinning: () => void;

  // Agent
  agent: AgentStrategy;
  setAgent: (a: AgentStrategy) => void;
  maxPrice: number;
  setMaxPrice: (n: number) => void;
  autoBook: boolean;
  setAutoBook: (v: boolean) => void;

  // Savings
  savings: SavingsStats;
  addSavings: (amount: number) => void;

  // Merged ride prompt
  mergeOffer: { saving: number; riderName: string } | null;
  setMergeOffer: (m: { saving: number; riderName: string } | null) => void;

  // Live auction active (WS-driven) — suppresses merge offers etc.
  liveAuctionActive: boolean;
  setLiveAuctionActive: (v: boolean) => void;
}

const emptyAuction: AuctionState = {
  phase: "idle",
  requestId: null,
  origin: "Current location",
  destination: "",
  distanceKm: 0,
  durationMin: 0,
  startPrice: 0,
  currentBestPrice: 0,
  initialBestPrice: 0,
  countdown: 0,
  bids: [],
  winningBid: null,
  totalSavings: 0,
  startedAt: null,
};

function makeBid(
  price: number,
  provider: Provider,
  featured = false
): DriverBid {
  return {
    id: `bid-${Math.random().toString(36).slice(2, 9)}`,
    providerId: provider.id,
    providerName: provider.name,
    driverName: DRIVER_NAMES[Math.floor(Math.random() * DRIVER_NAMES.length)],
    driverRating: Math.round((4.2 + Math.random() * 0.7) * 10) / 10,
    vehicle: VEHICLES[Math.floor(Math.random() * VEHICLES.length)],
    price: Math.round(price * 100) / 100,
    eta: Math.floor(1 + Math.random() * 7),
    timestamp: Date.now(),
    featured,
  };
}

export const useOryx = create<OryxStore>((set, get) => ({
  sheetSnap: "collapsed",
  setSheetSnap: (s) => set({ sheetSnap: s }),
  introSeen: false,
  setIntroSeen: (v) => set({ introSeen: v }),
  activeView: "search",
  setActiveView: (v) => set({ activeView: v }),

  origin: "Current location",
  destination: null,
  setDestination: (d) => set({ destination: d }),
  distanceKm: 0,
  durationMin: 0,
  setTripMetrics: (km, min) => set({ distanceKm: km, durationMin: min }),

  quotes: [],
  generateQuotes: () => {
    const { distanceKm, durationMin } = get();
    if (!distanceKm) return;
    const quotes: FareQuote[] = PROVIDERS.map((p) => {
      const surge = 0.95 + Math.random() * 0.5;
      const price = computeFare(p, distanceKm, durationMin, surge);
      return {
        providerId: p.id,
        provider: p,
        price,
        eta: Math.floor(1 + Math.random() * 9),
        duration: durationMin + Math.floor(Math.random() * 6 - 3),
        distance: distanceKm,
        features: p.features,
        surge,
      };
    }).sort((a, b) => a.price - b.price);
    set({ quotes });
  },

  auction: emptyAuction,
  startAuction: () => {
    const { destination, distanceKm, durationMin, quotes } = get();
    if (!destination || !distanceKm) return;
    const initialBest = quotes.length
      ? quotes[0].price
      : computeFare(PROVIDERS[0], distanceKm, durationMin);
    // Seed initial bids near the best quote
    const seedProviders = PROVIDERS.slice(0, 5);
    const seedBids = seedProviders.map((p, i) =>
      makeBid(
        Math.round((initialBest * (0.96 + i * 0.05)) * 100) / 100,
        p,
        i === 0
      )
    );
    set({
      auction: {
        phase: "gathering",
        requestId: `req-${Date.now()}`,
        origin: "Current location",
        destination: destination.name,
        distanceKm,
        durationMin,
        startPrice: Math.round(initialBest * 1.15 * 100) / 100,
        currentBestPrice: seedBids[0].price,
        initialBestPrice: seedBids[0].price,
        countdown: 20,
        bids: seedBids.sort((a, b) => a.price - b.price),
        winningBid: null,
        totalSavings: 0,
        startedAt: Date.now(),
      },
      activeView: "auction",
      sheetSnap: "full",
    });
  },

  applyBid: (bid) => {
    const { auction, agent, autoBook, maxPrice } = get();
    if (auction.phase === "idle" || auction.phase === "booked") return;
    const bids = [bid, ...auction.bids].sort((a, b) => a.price - b.price);
    const best = bids[0];
    const totalSavings = Math.max(
      0,
      Math.round((auction.initialBestPrice - best.price) * 100) / 100
    );
    let phase = auction.phase;
    if (auction.phase === "gathering") phase = "bidding";
    set({
      auction: {
        ...auction,
        phase,
        bids: bids.slice(0, 12),
        currentBestPrice: best.price,
        totalSavings,
        winningBid: best,
      },
    });
    // Auto-book if enabled and under max
    if (autoBook && best.price <= maxPrice && phase === "bidding") {
      get().bookWinning();
    }
  },

  tickAuction: () => {
    const { auction } = get();
    if (auction.phase === "idle" || auction.phase === "booked") return;
    const next = auction.countdown - 1;
    // Generate a new lower bid with some probability based on agent intensity
    const { agent } = get();
    const intensity =
      agent === "aggressive-saver"
        ? 0.8
        : agent === "maximum-saver"
        ? 0.95
        : agent === "rush"
        ? 0.2
        : agent === "luxury"
        ? 0.3
        : 0.6;
    let newBids = auction.bids;
    let best = auction.bids[0];
    if (Math.random() < intensity && best) {
      const lowerProvider = PROVIDERS[Math.floor(Math.random() * 5)];
      const drop = 0.15 + Math.random() * 0.55 * intensity;
      const newPrice = Math.max(
        best.price - drop,
        auction.initialBestPrice * 0.45
      );
      const nb = makeBid(Math.round(newPrice * 100) / 100, lowerProvider, true);
      newBids = [nb, ...auction.bids].sort((a, b) => a.price - b.price).slice(0, 12);
      best = newBids[0];
    }
    const totalSavings = Math.max(
      0,
      Math.round((auction.initialBestPrice - best.price) * 100) / 100
    );
    const phase = next <= 0 ? "final" : auction.phase === "gathering" ? "bidding" : auction.phase;
    set({
      auction: {
        ...auction,
        countdown: Math.max(0, next),
        bids: newBids,
        currentBestPrice: best.price,
        winningBid: best,
        totalSavings,
        phase,
      },
    });
    if (next <= 0 && auction.phase !== "booked") {
      // finalize — keep best as winner but don't auto-book (let user confirm)
    }
  },

  endAuction: () => {
    const { auction } = get();
    if (auction.phase === "booked") return;
    set({
      auction: { ...auction, phase: "final", countdown: 0 },
    });
  },

  resetAuction: () => set({ auction: emptyAuction, activeView: "search", sheetSnap: "half" }),

  bookWinning: () => {
    const { auction, savings } = get();
    if (!auction.winningBid) return;
    set({
      auction: { ...auction, phase: "booked", countdown: 0 },
      savings: {
        ...savings,
        totalSaved: Math.round((savings.totalSaved + auction.totalSavings) * 100) / 100,
        ytdSaved: Math.round((savings.ytdSaved + auction.totalSavings) * 100) / 100,
        ridesCount: savings.ridesCount + 1,
        streak: savings.streak + 1,
      },
    });
  },

  agent: "balanced",
  setAgent: (a) => set({ agent: a }),
  maxPrice: 15,
  setMaxPrice: (n) => set({ maxPrice: n }),
  autoBook: false,
  setAutoBook: (v) => set({ autoBook: v }),

  savings: SAVINGS_STATS,
  addSavings: (amount) =>
    set((s) => ({
      savings: {
        ...s.savings,
        totalSaved: Math.round((s.savings.totalSaved + amount) * 100) / 100,
        ytdSaved: Math.round((s.savings.ytdSaved + amount) * 100) / 100,
        ridesCount: s.savings.ridesCount + 1,
      },
    })),

  mergeOffer: null,
  setMergeOffer: (m) => set({ mergeOffer: m }),

  liveAuctionActive: false,
  setLiveAuctionActive: (v) => set({ liveAuctionActive: v }),
}));
