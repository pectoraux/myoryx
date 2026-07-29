import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
  path: "/",
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ---- Marketplace data ----------------------------------------------------
const PROVIDERS = [
  { id: "uber", name: "Uber", color: "#1a1a1a" },
  { id: "bolt", name: "Bolt", color: "#2bc553" },
  { id: "yango", name: "Yango", color: "#ff4d4d" },
  { id: "indrive", name: "inDrive", color: "#c1f11d" },
  { id: "taxi", name: "City Taxi", color: "#f5a623" },
];

const DRIVERS = [
  "Kofi Mensah",
  "Yaw Boateng",
  "Ibrahim Suleiman",
  "Grace Adjei",
  "Samuel Owusu",
  "Amina Hassan",
  "Michael Tetteh",
  "Rashid Mohammed",
  "Comfort Asante",
  "Daniel Adjei",
];

const VEHICLES = [
  "Toyota Corolla",
  "Hyundai Elantra",
  "Kia Picanto",
  "Honda Civic",
  "Toyota Vitz",
  "Suzuki Swift",
];

const TICKER_EVENTS = [
  { text: "Labadi → Airport auction cleared at $11.40", type: "auction" },
  { text: "Osu pool matched · 4 riders · $6.20 each", type: "pool" },
  { text: "Surge clearing on Spintex in 7 min · −34%", type: "alert" },
  { text: "Ama saved $4.10 on her last ride", type: "saving" },
  { text: "Stadium demand pooling: 120 riders batching", type: "pool" },
  { text: "3 new independent drivers joined East Legon", type: "saving" },
  { text: "Rain expected 18:40 · book in 12 min to save 31%", type: "alert" },
  { text: "Oryx+ subscribers averaging 23% below city median", type: "saving" },
  { text: "Nkrumah Circle → Legon multi-hop: $7.80", type: "saving" },
  { text: "Empty seat sold on Airport route · $3.20", type: "pool" },
];

// Active auctions keyed by socket id
const auctions = new Map();

function makeBid(price, intensity = 1) {
  const provider = PROVIDERS[Math.floor(Math.random() * PROVIDERS.length)];
  return {
    id: `bid-${Math.random().toString(36).slice(2, 9)}`,
    providerId: provider.id,
    providerName: provider.name,
    providerColor: provider.color,
    driverName: DRIVERS[Math.floor(Math.random() * DRIVERS.length)],
    driverRating: Math.round((4.2 + Math.random() * 0.7) * 10) / 10,
    vehicle: VEHICLES[Math.floor(Math.random() * VEHICLES.length)],
    price: Math.round(price * 100) / 100,
    eta: Math.floor(1 + Math.random() * 7),
    timestamp: Date.now(),
    featured: Math.random() > 0.6,
  };
}

function seedAuction(startPrice, intensity) {
  const bids = [];
  for (let i = 0; i < 5; i++) {
    bids.push(makeBid(startPrice * (0.96 + i * 0.05), intensity));
  }
  return bids.sort((a, b) => a.price - b.price);
}

// ---- Connection handling -------------------------------------------------
io.on("connection", (socket) => {
  console.log(`[auction] connected: ${socket.id}`);

  // Ambient marketplace ticker — broadcast every 4s
  const tickerTimer = setInterval(() => {
    const ev = TICKER_EVENTS[Math.floor(Math.random() * TICKER_EVENTS.length)];
    socket.emit("market:ticker", {
      id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...ev,
    });
  }, 4000);

  socket.on("auction:start", (payload) => {
    const { startPrice = 19, intensity = 0.6, requestId } = payload || {};
    const initialBest = Math.round(startPrice * 0.96 * 100) / 100;
    const auction = {
      requestId: requestId || `req-${Date.now()}`,
      phase: "gathering",
      startPrice,
      initialBestPrice: initialBest,
      currentBestPrice: initialBest,
      countdown: 20,
      bids: seedAuction(startPrice, intensity),
      startedAt: Date.now(),
      timer: null,
    };
    auctions.set(socket.id, auction);
    socket.emit("auction:state", { ...auction, type: "init" });

    // Auction tick — every second
    const tick = () => {
      const a = auctions.get(socket.id);
      if (!a || a.phase === "booked" || a.phase === "final") return;
      a.countdown -= 1;
      // generate a lower bid with probability tied to intensity
      if (Math.random() < intensity && a.bids[0]) {
        const drop = 0.15 + Math.random() * 0.55 * intensity;
        const newPrice = Math.max(
          a.bids[0].price - drop,
          a.initialBestPrice * 0.45
        );
        const nb = makeBid(newPrice, intensity);
        a.bids = [nb, ...a.bids].sort((x, y) => x.price - y.price).slice(0, 12);
        a.currentBestPrice = a.bids[0].price;
        socket.emit("auction:bid", nb);
      }
      const totalSavings =
        Math.round((a.initialBestPrice - a.currentBestPrice) * 100) / 100;
      socket.emit("auction:tick", {
        countdown: Math.max(0, a.countdown),
        currentBestPrice: a.currentBestPrice,
        totalSavings,
        phase:
          a.countdown <= 0 ? "final" : a.phase === "gathering" ? "bidding" : a.phase,
      });
      if (a.countdown <= 0) {
        a.phase = "final";
        if (a.timer) clearInterval(a.timer);
      }
    };
    auction.timer = setInterval(tick, 1000);
  });

  socket.on("auction:book", () => {
    const a = auctions.get(socket.id);
    if (a) {
      a.phase = "booked";
      if (a.timer) clearInterval(a.timer);
      socket.emit("auction:booked", {
        winningBid: a.bids[0] || null,
        totalSavings: Math.round((a.initialBestPrice - a.currentBestPrice) * 100) / 100,
      });
    }
  });

  socket.on("auction:stop", () => {
    const a = auctions.get(socket.id);
    if (a && a.timer) clearInterval(a.timer);
    auctions.delete(socket.id);
  });

  socket.on("disconnect", () => {
    clearInterval(tickerTimer);
    const a = auctions.get(socket.id);
    if (a && a.timer) clearInterval(a.timer);
    auctions.delete(socket.id);
    console.log(`[auction] disconnected: ${socket.id}`);
  });

  socket.on("error", (err) => console.error(`[auction] error ${socket.id}:`, err));
});

const PORT = 3003;
httpServer.listen(PORT, () => {
  console.log(`[auction] Oryx auction service running on port ${PORT}`);
});

process.on("SIGTERM", () => httpServer.close(() => process.exit(0)));
process.on("SIGINT", () => httpServer.close(() => process.exit(0)));
