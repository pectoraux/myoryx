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

// ===========================================================================
// AI Mobility Intelligence Network — augmentation types
// ===========================================================================

export type ConnectorCategory =
  | "mapping"
  | "ride-hail"
  | "weather"
  | "events"
  | "calendar"
  | "transit"
  | "driver"
  | "rider";

export interface IntelligenceConnector {
  id: string;
  name: string;
  category: ConnectorCategory;
  emoji: string;
  status: "live" | "syncing" | "connected";
  signals: string[]; // what it streams
  latencyMs: number;
  color: string;
}

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: "rider" | "driver" | "vehicle" | "road" | "neighborhood" | "event" | "weather" | "price";
  count: number;
  color: string;
}

export type TeamRole =
  | "savings"
  | "pooling"
  | "calendar"
  | "safety"
  | "time"
  | "market"
  | "learning";

export interface TeamAgent {
  id: TeamRole;
  name: string;
  role: string;
  emoji: string;
  color: string;
  status: "active" | "thinking" | "idle";
  activity: string; // current live action
  metrics: { label: string; value: string }[];
  contribution: number; // % of total savings attributable
}

export interface CalendarSuggestion {
  id: string;
  event: string;
  originalTime: string;
  suggestedTime: string;
  originalCost: number;
  suggestedCost: number;
  saving: number;
  reason: string;
  confidence: number;
}

export type VehicleType =
  | "moto"
  | "scooter"
  | "tuktuk"
  | "sedan"
  | "suv"
  | "van"
  | "minibus"
  | "bus"
  | "ev"
  | "av";

export interface VehicleOption {
  id: VehicleType;
  name: string;
  emoji: string;
  capacity: number;
  basePrice: number;
  bestFor: string;
  eta: number;
  available: number;
  co2: "low" | "medium" | "high";
  recommended?: boolean;
}

export interface DriverProfile {
  id: string;
  name: string;
  avatar: string;
  vehicle: string;
  vehicleType: VehicleType;
  rating: number;
  reputation: number; // 0-100
  earningsGoal: { weekly: number; progress: number };
  efficiency: number; // empty-mile reduction %
  savingsGenerated: number; // for riders
  pooledTrips: number;
  punctuality: number;
  champion?: boolean;
  zone: string;
}

export interface ContinuousOptEvent {
  id: string;
  phase: "before" | "during" | "after";
  time: string;
  title: string;
  detail: string;
  saving?: number;
  type: "scan" | "switch" | "learn" | "alert";
}

export interface CommunityIntel {
  tripsAnalyzed: number;
  routesLearned: number;
  poolsDiscovered: number;
  demandPatterns: number;
  activeConnectors: number;
  networkIq: number; // 0-100 collective intelligence score
}

// ===========================================================================
// Autonomous Mobility Operating System — augmentation types
// ===========================================================================

export type AppMode = "people" | "parcel";

export type UserType =
  | "rider"
  | "driver"
  | "fleet"
  | "merchant"
  | "courier"
  | "npd"
  | "admin";

export type OptimizationProfile =
  | "savings"
  | "fastest"
  | "safety"
  | "comfort"
  | "eco"
  | "balanced"
  | "accessibility"
  | "business"
  | "family"
  | "parcel";

export interface ProfileMeta {
  id: OptimizationProfile;
  name: string;
  emoji: string;
  objective: string;
  color: string;
  weights: { price: number; time: number; safety: number; comfort: number; eco: number };
}

export type HopMode =
  | "walk"
  | "bike"
  | "moto"
  | "car"
  | "shuttle"
  | "transit"
  | "npd"
  | "taxi"
  | "ride-hail";

export interface JourneyHop {
  mode: HopMode;
  emoji: string;
  label: string;
  detail: string;
  durationMin: number;
  price: number;
  co2: number;
  provider?: string;
}

export interface ComposedJourney {
  id: string;
  hops: JourneyHop[];
  totalPrice: number;
  totalDuration: number;
  walkDistance: number;
  co2: number;
  score: number; // profile-weighted score, lower = better
  savings: number; // vs direct baseline
  badge?: string;
  safetyScore: number;
  comfortScore: number;
}

export interface NPDOffer {
  id: string;
  driverName: string;
  origin: string;
  destination: string;
  departInMin: number;
  seats: number;
  price: number;
  vehicle: string;
  rating: number;
  matchPct: number;
  avatar: string;
}

export interface ReturnRide {
  id: string;
  driverName: string;
  origin: string;
  destination: string;
  departInMin: number;
  price: number;
  seats: number;
  vehicle: string;
  rating: number;
  discountPct: number;
}

export interface PersonalDriver {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  weeklyPrice: number;
  rating: number;
  vehicle: string;
  zone: string;
  subscribers: number;
}

export interface CommuteGroup {
  id: string;
  route: string;
  riderCount: number;
  currentCost: number;
  optimizedCost: number;
  departAt: string;
  confidence: number;
  neighborhoods: string[];
}

export interface AI2AITransaction {
  id: string;
  buyerAgent: string;
  sellerAgent: string;
  asset: string;
  currentPrice: number;
  openingPrice: number;
  rounds: number;
  status: "negotiating" | "settled" | "rejected";
  lastAction: string;
  trend: number[]; // price per round
}

export interface MerchantOrder {
  id: string;
  merchant: string;
  pickup: string;
  dropoff: string;
  dimensions: string;
  price: number;
  deadline: string;
  status: "created" | "optimized" | "dispatched" | "delivered";
  courier?: string;
  createdAt: string;
}

export interface ParcelOrder {
  id: string;
  pickup: string;
  dropoff: string;
  size: "small" | "medium" | "large";
  weightKg: number;
  deadline: string;
  price: number;
  courier?: string;
  status: "open" | "dispatched" | "delivered";
}

export interface FleetOperator {
  id: string;
  name: string;
  vehicleCount: number;
  utilization: number;
  avgFare: number;
  zones: string[];
  connected: boolean;
}

