// Oryx Mobility Kernel — domain types
// First-class domain models for the Mobility Knowledge Graph. Every future
// feature (routing, pooling, AI scheduling, auctions) reasons over these.

// --- Core entities -------------------------------------------------------

export type EntityType =
  | "rider"
  | "driver"
  | "npd"
  | "fleet"
  | "vehicle"
  | "parcel"
  | "intent"
  | "calendar"
  | "route"
  | "neighborhood"
  | "transit"
  | "business"
  | "provider"
  | "connector";

export interface GraphNode {
  id: string;
  type: EntityType;
  label: string;
  // graph edges: relationship type → target node ids
  edges: Record<string, string[]>;
  // entity-specific attributes
  attrs: Record<string, unknown>;
  updatedAt: number;
}

// --- Mobility Intent (the atomic optimization unit) ----------------------

export type IntentType =
  | "commute"
  | "church"
  | "school"
  | "gym"
  | "meeting"
  | "airport"
  | "medical"
  | "shopping"
  | "social"
  | "family"
  | "event"
  | "delivery"
  | "subscription"
  | "return";

export type IntentStatus = "predicted" | "active" | "optimizing" | "fulfilled" | "cancelled";

export type IntentHorizon = "predictable" | "short_notice";

export interface MobilityIntent {
  id: string;
  userId: string;
  type: IntentType;
  horizon: IntentHorizon;
  title: string;
  origin: string;
  destination: string;
  // arrival/departure windows (flexible)
  arriveBy?: string; // ISO
  departAfter?: string; // ISO
  // travel window (M4: flexible arrival/departure)
  travelWindow?: TravelWindow;
  // recurrence (for predictable trips)
  recurring?: {
    days: number[]; // 0=Sun..6=Sat
    time: string; // "HH:MM"
    until?: string; // ISO date
  };
  // plan span (M4: hourly/daily/weekly/monthly)
  planSpan?: PlanSpan;
  // constraints & preferences
  modePreference?: string[];
  maxWalkM?: number;
  maxWaitMin?: number;
  priority: "low" | "normal" | "high" | "critical";
  // travel policy (M4)
  policy?: TravelPolicy;
  // dependencies (M4)
  dependencies?: IntentDependency[];
  // optimization state
  status: IntentStatus;
  // generated opportunities
  suggestions?: IntentSuggestion[];
  // predicted cost curve (M6)
  costOverTime?: CostOverTime;
  // estimated baseline cost (computed)
  estimatedCost?: number;
  createdAt: number;
  updatedAt: number;
}

export interface IntentSuggestion {
  id: string;
  kind: "shift" | "pool" | "return_ride" | "multimodal" | "subscription" | "batch" | "traffic" | "calendar_adjust";
  title: string;
  detail: string;
  saving?: number;
  co2?: number;
  confidence: number;
  // structured data for the UI to render + act on
  data?: {
    originalTime?: string;
    suggestedTime?: string;
    originalCost?: number;
    suggestedCost?: number;
    poolRiders?: number;
    modes?: string[];
    driverName?: string;
    parcelsBatched?: number;
    delayMin?: number;
  };
}

// --- Planning engine extensions (M4-M6) ----------------------------------

export type PlanSpan = "hourly" | "daily" | "weekly" | "monthly";

export interface TravelWindow {
  // flexible arrival: must arrive between earliest and latest
  arriveEarliest?: string; // HH:MM
  arriveLatest?: string; // HH:MM
  // flexible departure: can leave between earliest and latest
  departEarliest?: string;
  departLatest?: string;
  // flexibility radius in minutes
  flexibilityMin: number;
}

export interface TravelPolicy {
  // corporate or personal travel policy constraints
  maxFarePerRide?: number;
  maxFarePerWeek?: number;
  allowedModes?: string[];
  requireReceipt?: boolean;
  requireApprovalAbove?: number;
  preferredProviders?: string[];
  prohibitedZones?: string[];
}

export interface IntentDependency {
  // this intent depends on another completing first
  dependsOnIntentId?: string;
  // or depends on an external event
  dependsOnEvent?: string;
  // minimum gap in minutes between dependency completion and this intent
  minGapMin?: number;
}

export interface ScheduleConflict {
  id: string;
  intentIds: string[];
  type: "overlap" | "insufficient_gap" | "double_booking";
  severity: "warning" | "error";
  detail: string;
  resolution?: string;
}

export interface CostPrediction {
  // predicted transportation cost for a specific time slot
  time: string; // HH:MM
  cost: number;
  surge: number; // multiplier
  demand: "low" | "medium" | "high";
  confidence: number;
}

export interface CostOverTime {
  // cost curve for the intent's route over the next 24h
  baseline: number;
  predictions: CostPrediction[];
  cheapestSlot?: { time: string; cost: number; saving: number };
  peakSlot?: { time: string; cost: number };
}

// --- Calendar (Predictable + Short Notice) -------------------------------

export type CalendarView = "predictable" | "short_notice";

export interface CalendarEvent {
  id: string;
  userId: string;
  intentId?: string; // links to a MobilityIntent once optimized
  title: string;
  view: CalendarView;
  origin: string;
  destination: string;
  // timing
  start: string; // ISO or HH:MM
  end?: string; // ISO
  allDay?: boolean;
  recurring?: {
    days: number[];
    time: string;
  };
  // plan span (M4)
  planSpan?: PlanSpan;
  // travel window (M4: flexible arrival/departure)
  travelWindow?: TravelWindow;
  // travel policy (M4)
  policy?: TravelPolicy;
  // dependencies (M4)
  dependencies?: IntentDependency[];
  // metadata
  priority: MobilityIntent["priority"];
  constraints?: string[];
  notes?: string;
  // planning
  optimized: boolean;
  saving?: number;
  // drag-and-drop position (for UI timeline)
  lane?: number;
  createdAt: number;
}

// --- Connector framework -------------------------------------------------

export type ConnectorCategory =
  | "maps"
  | "traffic"
  | "weather"
  | "events"
  | "calendar"
  | "ride_hail"
  | "fleet"
  | "merchant"
  | "delivery"
  | "transit"
  | "erp"
  | "crm";

export type ConnectorStatus = "live" | "degraded" | "syncing" | "disconnected" | "error";

export interface ConnectorHealth {
  status: ConnectorStatus;
  lastEventAt?: number;
  lastError?: string;
  eventsIngested: number;
  latencyMs: number;
  uptimePct: number;
}

export interface ConnectorManifest {
  id: string;
  name: string;
  category: ConnectorCategory;
  version: string;
  // ingestion mode
  mode: "poll" | "webhook" | "stream";
  pollIntervalMs?: number;
  // capabilities
  signals: string[];
  // auth
  auth: "none" | "api_key" | "oauth" | "basic";
  // rate limiting
  rateLimitPerMin?: number;
}

export interface ConnectorEvent {
  id: string;
  connectorId: string;
  category: ConnectorCategory;
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

// --- Plugin / Extension runtime ------------------------------------------

export interface ExtensionManifest {
  id: string;
  name: string;
  developer: string;
  version: string;
  description: string;
  category: string;
  emoji: string;
  color: string;
  // permissions the extension requires
  permissions: ExtensionPermission[];
  // lifecycle hooks the extension implements
  hooks: ExtensionHook[];
  // connector signals the extension subscribes to
  subscribesTo?: string[];
  entrypoint: string;
}

export type ExtensionPermission =
  | "read:intents"
  | "write:intents"
  | "read:calendar"
  | "write:calendar"
  | "read:graph"
  | "write:graph"
  | "emit:events"
  | "call:connector"
  | "ai:plan"
  | "network:external";

export type ExtensionHook =
  | "onIntentCreated"
  | "onIntentOptimized"
  | "onCalendarChanged"
  | "onConnectorEvent"
  | "onAuctionCleared"
  | "onRideBooked"
  | "onParcelDispatched"
  | "onSchedule";

export type ExtensionStatus =
  | "draft"
  | "development"
  | "pending_review"
  | "published"
  | "installed"
  | "disabled";

export interface ExtensionInstance {
  manifest: ExtensionManifest;
  status: ExtensionStatus;
  installedAt?: number;
  lastError?: string;
  eventsProcessed: number;
  // dev console state
  hotReloadEnabled?: boolean;
  logs: ExtensionLog[];
}

export interface ExtensionLog {
  id: string;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  timestamp: number;
}

// --- AI Runtime -----------------------------------------------------------

export type AgentRole =
  | "savings"
  | "safety"
  | "time"
  | "pooling"
  | "calendar"
  | "negotiation"
  | "learning"
  | "market"
  | "parcel"
  | "accessibility"
  // driver agents
  | "income_planner"
  | "schedule_builder"
  | "subscription_manager"
  | "return_ride_optimizer"
  | "coverage_planner"
  | "demand_predictor"
  | "pool_manager"
  | "fleet_coordinator"
  // fleet agents
  | "fleet_allocation"
  | "fleet_utilization"
  | "fleet_maintenance"
  | "fleet_dispatch"
  // merchant agents
  | "merchant_order_optimizer"
  | "merchant_courier_selector"
  | "merchant_billing";

export interface AgentDefinition {
  id: string;
  role: AgentRole;
  name: string;
  emoji: string;
  color: string;
  team: "rider" | "driver" | "fleet" | "merchant";
  description: string;
  // tools this agent can invoke
  tools: string[];
  // events this agent subscribes to
  subscribesTo: string[];
  // policy constraints
  policy: {
    canBook: boolean;
    canNegotiate: boolean;
    maxSpendPerRide?: number;
  };
}

export interface AgentMemory {
  agentId: string;
  // shared long-term memory keyed by topic
  facts: Record<string, unknown>;
  // recent decisions for traceability
  decisions: AgentDecision[];
}

export interface AgentDecision {
  id: string;
  agentId: string;
  reasoning: string;
  action: string;
  timestamp: number;
  outcome?: "success" | "failure" | "pending";
  // explainability: what events/facts led to this decision
  triggeredBy?: string;
  confidence?: number;
  // structured reasoning steps for the UI
  reasoningSteps?: string[];
}

// --- Multi-agent runtime (M7-M9) ----------------------------------------

export type AgentStatus = "active" | "thinking" | "negotiating" | "idle" | "learning";

export interface AgentTask {
  id: string;
  agentId: string;
  type: string; // e.g. "optimize_intent", "negotiate_bid", "find_pool"
  description: string;
  status: "queued" | "running" | "completed" | "failed";
  intentId?: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  // reasoning trace for explainability
  reasoningSteps: string[];
}

export interface AgentNegotiation {
  id: string;
  buyerAgentId: string;
  sellerAgentId: string;
  asset: string;
  status: "negotiating" | "settled" | "rejected";
  rounds: AgentNegotiationRound[];
  openingPrice: number;
  currentPrice: number;
  settledPrice?: number;
  startedAt: number;
  settledAt?: number;
}

export interface AgentNegotiationRound {
  round: number;
  agentId: string;
  action: "offer" | "counter" | "accept" | "reject";
  price: number;
  reasoning: string;
  timestamp: number;
}

export interface LearnedOptimization {
  id: string;
  agentId: string;
  pattern: string; // e.g. "Tuesday 8am surge always 2.4x"
  insight: string;
  confidence: number;
  appliedCount: number;
  learnedAt: number;
  // the optimization that was learned
  optimization: {
    type: string; // "shift", "pool", "route", etc.
    params: Record<string, unknown>;
  };
}

export interface AgentMetrics {
  agentId: string;
  tasksCompleted: number;
  tasksFailed: number;
  negotiationsWon: number;
  negotiationsLost: number;
  totalSavingsGenerated: number;
  avgConfidence: number;
  avgTaskDurationMs: number;
  lastActiveAt: number;
  // performance history (rolling 7-day)
  dailyStats: Array<{ date: string; tasks: number; savings: number; successRate: number }>;
}

export interface AgentCooperation {
  id: string;
  agents: string[]; // cooperating agent ids
  type: "shared_plan" | "delegated_task" | "negotiation" | "information_share";
  description: string;
  timestamp: number;
  outcome: "success" | "pending" | "failed";
}

export interface AgentConfig {
  agentId: string;
  // user-configurable settings
  enabled: boolean;
  aggressiveness: number; // 0-1, how aggressively to negotiate
  riskTolerance: number; // 0-1
  learningEnabled: boolean;
  // permission overrides (grants beyond the agent's default policy)
  permissionOverrides: string[];
  // custom parameters
  params: Record<string, unknown>;
}

// Extended agent memory with learning
export interface AgentMemory {
  agentId: string;
  facts: Record<string, unknown>;
  decisions: AgentDecision[];
  // M7-M9 additions
  tasks: AgentTask[];
  learnedOptimizations: LearnedOptimization[];
  metrics: AgentMetrics;
  config: AgentConfig;
}

// --- CQRS -----------------------------------------------------------------

export interface Command {
  type: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  // idempotency key
  idempotencyKey?: string;
  // causation chain
  correlationId: string;
  userId?: string;
  timestamp: number;
}

export interface DomainEvent {
  id: string;
  type: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  correlationId: string;
  // causation
  causedBy?: string;
  timestamp: number;
  version: number;
}

export interface EventHandler {
  eventType: string;
  handle: (event: DomainEvent) => void | Promise<void>;
}

export interface CommandHandler {
  commandType: string;
  handle: (cmd: Command) => DomainEvent[] | Promise<DomainEvent[]>;
}

// --- Feature flags & RBAC ------------------------------------------------

export type FeatureFlag =
  | "mobility_kernel"
  | "knowledge_graph"
  | "connectors"
  | "plugin_runtime"
  | "ai_runtime"
  | "planning_engine"
  | "developer_console"
  | "reverse_auction"
  | "parcel_network"
  | "fleet_plugins"
  | "ai2ai_marketplace";

export interface FeatureFlagState {
  flag: FeatureFlag;
  enabled: boolean;
  rolloutPct: number;
  description: string;
}
