import type {
  Provider,
  AgentProfile,
  Destination,
  SavingsStats,
  LeaderboardEntry,
  MarketTicker,
} from "./types";

// Accra city center — matches user timezone Africa/Accra
export const CITY_CENTER = { lat: 5.6037, lng: -0.187 };

export const PROVIDERS: Provider[] = [
  {
    id: "uber",
    name: "Uber",
    category: "ride-hail",
    color: "#1a1a1a",
    emoji: "U",
    baseFare: 6,
    perKm: 1.9,
    perMin: 0.35,
    rating: 4.7,
    reliability: 0.92,
    features: ["electric", "luggage"],
  },
  {
    id: "bolt",
    name: "Bolt",
    category: "ride-hail",
    color: "#2bc553",
    emoji: "B",
    baseFare: 5,
    perKm: 1.7,
    perMin: 0.3,
    rating: 4.6,
    reliability: 0.88,
    features: ["luggage"],
  },
  {
    id: "yango",
    name: "Yango",
    category: "ride-hail",
    color: "#ff4d4d",
    emoji: "Y",
    baseFare: 4.5,
    perKm: 1.6,
    perMin: 0.28,
    rating: 4.5,
    reliability: 0.85,
    features: [],
  },
  {
    id: "indrive",
    name: "inDrive",
    category: "ride-hail",
    color: "#c1f11d",
    emoji: "i",
    baseFare: 4,
    perKm: 1.5,
    perMin: 0.25,
    rating: 4.4,
    reliability: 0.8,
    features: [],
  },
  {
    id: "taxi",
    name: "City Taxi",
    category: "taxi",
    color: "#f5a623",
    emoji: "T",
    baseFare: 5.5,
    perKm: 1.8,
    perMin: 0.3,
    rating: 4.3,
    reliability: 0.78,
    features: ["luggage", "pet-friendly"],
  },
  {
    id: "moto",
    name: "Okada Moto",
    category: "moto",
    color: "#ff6b35",
    emoji: "M",
    baseFare: 2,
    perKm: 0.8,
    perMin: 0.1,
    rating: 4.2,
    reliability: 0.9,
    features: ["fast"],
  },
  {
    id: "shuttle",
    name: "Shared Shuttle",
    category: "shuttle",
    color: "#7b61ff",
    emoji: "S",
    baseFare: 1.5,
    perKm: 0.5,
    perMin: 0.08,
    rating: 4.1,
    reliability: 0.82,
    features: ["shared", "electric"],
  },
  {
    id: "luxury",
    name: "Oryx Black",
    category: "luxury",
    color: "#d4af37",
    emoji: "★",
    baseFare: 12,
    perKm: 3.2,
    perMin: 0.5,
    rating: 4.9,
    reliability: 0.95,
    features: ["luxury", "electric", "luggage", "child-seat"],
  },
];

export const AGENTS: AgentProfile[] = [
  {
    id: "balanced",
    name: "Balanced",
    tagline: "Smart savings, reasonable wait",
    description:
      "Negotiates a fair price without long detours. Books when savings clear 18%.",
    maxWait: 6,
    walkTolerance: 150,
    negotiateIntensity: 0.5,
    icon: "Scale",
    color: "#72b1a6",
  },
  {
    id: "aggressive-saver",
    name: "Aggressive Saver",
    tagline: "Waits, negotiates hard",
    description:
      "Hunts the lowest fare. Will wait up to 9 minutes and counter every bid.",
    maxWait: 9,
    walkTolerance: 250,
    negotiateIntensity: 0.78,
    icon: "Crosshair",
    color: "#f5a623",
  },
  {
    id: "maximum-saver",
    name: "Maximum Saver",
    tagline: "Walks farther, allows transfers",
    description:
      "Multi-hop master. Combines walk + shuttle + ride to crush the price floor.",
    maxWait: 14,
    walkTolerance: 500,
    negotiateIntensity: 0.92,
    icon: "PiggyBank",
    color: "#4ade80",
  },
  {
    id: "rush",
    name: "Rush Mode",
    tagline: "No bargaining, fastest pickup",
    description: "Skip the auction. Locks the nearest vehicle the instant you tap.",
    maxWait: 0,
    walkTolerance: 80,
    negotiateIntensity: 0.1,
    icon: "Zap",
    color: "#ef4444",
  },
  {
    id: "luxury",
    name: "Luxury Agent",
    tagline: "Only premium rides",
    description: "Filters to Oryx Black and top-rated executive fleets only.",
    maxWait: 4,
    walkTolerance: 100,
    negotiateIntensity: 0.3,
    icon: "Crown",
    color: "#d4af37",
  },
  {
    id: "business",
    name: "Business Agent",
    tagline: "Company policy compliant",
    description: "Enforces corporate fare caps and preferred providers automatically.",
    maxWait: 5,
    walkTolerance: 120,
    negotiateIntensity: 0.45,
    icon: "Briefcase",
    color: "#a78bfa",
  },
];

export const DESTINATIONS: Destination[] = [
  {
    id: "airport",
    name: "Kotoka Int'l Airport",
    address: "Airport Rd, Accra",
    lat: 5.6051,
    lng: -0.1668,
    category: "suggested",
    emoji: "✈️",
  },
  {
    id: "mall",
    name: "Accra Mall",
    address: "Spintex Rd, Accra",
    lat: 5.6262,
    lng: -0.1769,
    category: "suggested",
    emoji: "🛍️",
  },
  {
    id: "labadi",
    name: "Labadi Beach Hotel",
    address: "Labadi Rd, Accra",
    lat: 5.5731,
    lng: -0.1824,
    category: "saved",
    emoji: "🏖️",
  },
  {
    id: "osu",
    name: "Osu Night Market",
    address: "Oxford St, Osu, Accra",
    lat: 5.5597,
    lng: -0.1757,
    category: "recent",
    emoji: "🍜",
  },
  {
    id: "circle",
    name: "Kwame Nkrumah Circle",
    address: "Ring Road Central, Accra",
    lat: 5.5731,
    lng: -0.2053,
    category: "recent",
    emoji: "🔄",
  },
  {
    id: "stadium",
    name: "Accra Sports Stadium",
    address: "Ring Rd E, Accra",
    lat: 5.5753,
    lng: -0.1967,
    category: "event",
    emoji: "🏟️",
  },
  {
    id: "university",
    name: "University of Ghana",
    address: "Legon, Accra",
    lat: 5.6522,
    lng: -0.1862,
    category: "saved",
    emoji: "🎓",
  },
  {
    id: "office",
    name: "The Octagon",
    address: "Independence Ave, Accra",
    lat: 5.5636,
    lng: -0.2026,
    category: "saved",
    emoji: "🏢",
  },
];

export const SAVINGS_STATS: SavingsStats = {
  totalSaved: 618,
  ytdSaved: 412,
  ridesCount: 87,
  co2Saved: 34.6,
  hoursSaved: 11.4,
  streak: 6,
  belowAvgPct: 78,
  rank: 142,
  neighborhoodRank: 3,
};

export const LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "Kwame A.", avatar: "KA", saved: 2841, rides: 312, streak: 47, change: 0 },
  { rank: 2, name: "Ama O.", avatar: "AO", saved: 2614, rides: 288, streak: 33, change: 1 },
  { rank: 3, name: "Yusuf I.", avatar: "YI", saved: 2403, rides: 271, streak: 41, change: -1 },
  { rank: 4, name: "Esi B.", avatar: "EB", saved: 2105, rides: 245, streak: 22, change: 2 },
  { rank: 5, name: "Daniel M.", avatar: "DM", saved: 1988, rides: 233, streak: 19, change: 0 },
  { rank: 6, name: "Fatima A.", avatar: "FA", saved: 1876, rides: 221, streak: 28, change: 3 },
  { rank: 7, name: "Kojo P.", avatar: "KP", saved: 1742, rides: 209, streak: 15, change: -2 },
  { rank: 8, name: "Akosua T.", avatar: "AT", saved: 1620, rides: 198, streak: 11, change: 1 },
];

export const MARKET_TICKERS: MarketTicker[] = [
  { id: "1", text: "Labadi → Airport auction cleared at $11.40", type: "auction" },
  { id: "2", text: "Osu pool matched · 4 riders · $6.20 each", type: "pool" },
  { id: "3", text: "Surge clearing on Spintex in 7 min · −34%", type: "alert" },
  { id: "4", text: "Ama saved $4.10 on her last ride", type: "saving" },
  { id: "5", text: "Stadium demand pooling: 120 riders batching", type: "pool" },
  { id: "6", text: "3 new independent drivers joined East Legon", type: "saving" },
  { id: "7", text: "Rain expected 18:40 · book in 12 min to save 31%", type: "alert" },
  { id: "8", text: "Oryx+ subscribers averaging 23% below city median", type: "saving" },
];

export const DRIVER_NAMES = [
  "Kofi Mensah",
  "Yaw Boateng",
  "Ibrahim Suleiman",
  "Grace Adjei",
  "Samuel Owusu",
  "Amina Hassan",
  "Michael Tetteh",
  "Rashid Mohammed",
  "Comfort Asante",
  "Emmanuel Quaye",
  "Aisha Bello",
  "Daniel Adjei",
];

export const VEHICLES = [
  "Toyota Corolla",
  "Hyundai Elantra",
  "Kia Picanto",
  "Honda Civic",
  "Toyota Vitz",
  "Suzuki Swift",
  "Nissan Almera",
  "Hyundai Accent",
];

// Generate vehicle markers around a center point
export function generateVehicles(
  center: { lat: number; lng: number },
  count = 14
) {
  const vehicles = [];
  for (let i = 0; i < count; i++) {
    const provider = PROVIDERS[Math.floor(Math.random() * 5)];
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.004 + Math.random() * 0.02;
    vehicles.push({
      id: `v-${i}`,
      providerId: provider.id,
      lat: center.lat + Math.sin(angle) * radius,
      lng: center.lng + Math.cos(angle) * radius,
      heading: Math.floor(Math.random() * 360),
      eta: Math.floor(1 + Math.random() * 9),
    });
  }
  return vehicles;
}

// Compute a fare quote for a provider given distance/duration
export function computeFare(
  provider: Provider,
  distanceKm: number,
  durationMin: number,
  surge = 1
) {
  const price =
    (provider.baseFare + provider.perKm * distanceKm + provider.perMin * durationMin) *
    surge;
  return Math.round(price * 100) / 100;
}

// Haversine distance in km
export function haversine(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
