// Oryx shared types — the mobility marketplace data model

export type ProviderCategory =
  | "ride-hail"
  | "taxi"
  | "moto"
  | "shuttle"
  | "carpool"
  | "fleet"
  | "transit"
  | "luxury"
  | "av";

export interface Provider {
  id: string;
  name: string;
  category: ProviderCategory;
  color: string; // hex accent for map markers
  emoji: string;
  baseFare: number;
  perKm: number;
  perMin: number;
  rating: number;
  reliability: number; // 0-1 acceptance rate
  features: string[]; // electric, pet-friendly, child-seat, luggage, accessibility, luxury
}

export interface VehicleMarker {
  id: string;
  providerId: string;
  lat: number;
  lng: number;
  heading: number;
  eta: number; // minutes to rider
}

export interface FareQuote {
  providerId: string;
  provider: Provider;
  price: number;
  eta: number; // pickup minutes
  duration: number; // trip minutes
  distance: number; // km
  features: string[];
  surge: number; // multiplier
}

export interface DriverBid {
  id: string;
  providerId: string;
  providerName: string;
  driverName: string;
  driverRating: number;
  vehicle: string;
  price: number;
  eta: number;
  timestamp: number;
  featured?: boolean;
}

export type AuctionPhase = "idle" | "gathering" | "bidding" | "final" | "booked";

export interface AuctionState {
  phase: AuctionPhase;
  requestId: string | null;
  origin: string;
  destination: string;
  distanceKm: number;
  durationMin: number;
  startPrice: number;
  currentBestPrice: number;
  initialBestPrice: number;
  countdown: number; // seconds remaining
  bids: DriverBid[];
  winningBid: DriverBid | null;
  totalSavings: number; // vs initial best
  startedAt: number | null;
}

export type AgentStrategy =
  | "balanced"
  | "aggressive-saver"
  | "maximum-saver"
  | "rush"
  | "luxury"
  | "business";

export interface AgentProfile {
  id: AgentStrategy;
  name: string;
  tagline: string;
  description: string;
  maxWait: number; // minutes willing to wait
  walkTolerance: number; // meters
  negotiateIntensity: number; // 0-1
  icon: string;
  color: string;
}

export interface RouteHop {
  type: "walk" | "ride" | "shuttle" | "moto" | "transit";
  label: string;
  detail: string;
  durationMin: number;
  price: number;
  provider?: string;
  emoji: string;
}

export interface RouteOption {
  id: string;
  hops: RouteHop[];
  totalPrice: number;
  totalDuration: number;
  walkDistance: number;
  co2: number; // kg saved vs single ride
  savings: number; // vs baseline single ride
  badge?: string;
}

export interface WaitOption {
  leaveInMin: number;
  price: number;
  savings: number;
  reason: string;
}

export interface SavingsStats {
  totalSaved: number;
  ytdSaved: number;
  ridesCount: number;
  co2Saved: number; // kg
  hoursSaved: number;
  streak: number;
  belowAvgPct: number; // % of rides below city average
  rank: number;
  neighborhoodRank: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  saved: number;
  rides: number;
  streak: number;
  neighborhood?: string;
  isYou?: boolean;
  change: number; // rank change
}

export interface PoolSuggestion {
  id: string;
  riderCount: number;
  yourShare: number;
  fullPrice: number;
  detourMin: number;
  route: string;
  confidence: number;
}

export interface MarketTicker {
  id: string;
  text: string;
  type: "saving" | "auction" | "pool" | "alert";
}

export interface Destination {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: "recent" | "saved" | "suggested" | "event";
  emoji: string;
}
