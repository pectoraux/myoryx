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
  // recurrence (for predictable trips)
  recurring?: {
    days: number[]; // 0=Sun..6=Sat
    time: string; // "HH:MM"
    until?: string; // ISO date
  };
  // constraints & preferences
  modePreference?: string[];
  maxWalkM?: number;
  maxWaitMin?: number;
  priority: "low" | "normal" | "high" | "critical";
  // optimization state
  status: IntentStatus;
  // generated opportunities
  suggestions?: IntentSuggestion[];
  createdAt: number;
  updatedAt: number;
}

export interface IntentSuggestion {
  id: string;
  kind: "shift" | "pool" | "return_ride" | "multimodal" | "subscription" | "batch";
  title: string;
  detail: string;
  saving?: number;
  co2?: number;
  confidence: number;
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
  start: string; // ISO
  end?: string; // ISO
  allDay?: boolean;
  recurring?: {
    days: number[];
    time: string;
  };
  // metadata
  priority: MobilityIntent["priority"];
  constraints?: string[];
  notes?: string;
  // planning
  optimized: boolean;
  saving?: number;
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
  | "fleet_dispatch";

export interface AgentDefinition {
  id: string;
  role: AgentRole;
  name: string;
  emoji: string;
  color: string;
  team: "rider" | "driver" | "fleet";
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
