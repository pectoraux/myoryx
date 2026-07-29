// Oryx Mobility Kernel — event bus + CQRS runtime
// In-process event-driven architecture. Typed domain events flow through a
// single bus. Command handlers validate + emit events. Event handlers react
// and may issue further commands (sagas). All handlers are idempotent via
// causation/correlation ids and an idempotency-key ledger.

import type {
  Command,
  CommandHandler,
  DomainEvent,
  EventHandler,
  FeatureFlag,
  FeatureFlagState,
} from "./types";

type Listener = (event: DomainEvent) => void;

class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();
  private listeners = new Set<Listener>();
  private store: DomainEvent[] = [];
  private idempotencyLedger = new Set<string>();
  private maxStoreSize = 5000;

  registerHandler(handler: EventHandler): () => void {
    if (!this.handlers.has(handler.eventType)) {
      this.handlers.set(handler.eventType, new Set());
    }
    this.handlers.get(handler.eventType)!.add(handler);
    return () => this.handlers.get(handler.eventType)?.delete(handler);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async publish(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      // idempotency: dedupe by event id
      if (this.idempotencyLedger.has(event.id)) continue;
      this.idempotencyLedger.add(event.id);
      // cap ledger size
      if (this.idempotencyLedger.size > 10000) {
        const first = this.idempotencyLedger.values().next().value;
        if (first) this.idempotencyLedger.delete(first);
      }

      // append to event store (event sourcing)
      this.store.push(event);
      if (this.store.length > this.maxStoreSize) {
        this.store.splice(0, this.store.length - this.maxStoreSize);
      }

      // notify global listeners (websocket bridge, observability)
      this.listeners.forEach((l) => {
        try {
          l(event);
        } catch (e) {
          console.error("[event-bus] listener error", e);
        }
      });

      // dispatch to typed handlers
      const handlers = this.handlers.get(event.type);
      if (handlers) {
        for (const h of handlers) {
          try {
            await h.handle(event);
          } catch (e) {
            console.error(`[event-bus] handler error for ${event.type}`, e);
          }
        }
      }
    }
  }

  // replay events from the store (event sourcing)
  replay(filter?: (e: DomainEvent) => boolean): DomainEvent[] {
    return filter ? this.store.filter(filter) : [...this.store];
  }

  recent(limit = 50): DomainEvent[] {
    return this.store.slice(-limit);
  }
}

class CommandBus {
  private handlers = new Map<string, CommandHandler>();
  private processed = new Set<string>();
  private bus: EventBus;

  constructor(bus: EventBus) {
    this.bus = bus;
  }

  register(handler: CommandHandler): () => void {
    this.handlers.set(handler.commandType, handler);
    return () => this.handlers.delete(handler.commandType);
  }

  async dispatch(cmd: Command): Promise<DomainEvent[]> {
    // idempotency: if we've seen this idempotency key, return no-op
    const key = cmd.idempotencyKey || cmd.correlationId;
    if (this.processed.has(key)) return [];
    this.processed.add(key);
    if (this.processed.size > 5000) {
      const first = this.processed.values().next().value;
      if (first) this.processed.delete(first);
    }

    const handler = this.handlers.get(cmd.type);
    if (!handler) {
      console.warn(`[command-bus] no handler for ${cmd.type}`);
      return [];
    }
    const events = await handler.handle(cmd);
    await this.bus.publish(events);
    return events;
  }
}

// Feature flags — runtime rollout control
class FeatureFlagService {
  private flags = new Map<FeatureFlag, FeatureFlagState>();

  constructor() {
    // Kernel flags enabled by default
    const defaults: FeatureFlagState[] = [
      { flag: "mobility_kernel", enabled: true, rolloutPct: 100, description: "Core event-driven kernel" },
      { flag: "knowledge_graph", enabled: true, rolloutPct: 100, description: "Mobility Knowledge Graph" },
      { flag: "connectors", enabled: true, rolloutPct: 100, description: "Universal Connector Platform" },
      { flag: "plugin_runtime", enabled: true, rolloutPct: 100, description: "Extension plugin runtime" },
      { flag: "ai_runtime", enabled: true, rolloutPct: 100, description: "Personal AI team runtime" },
      { flag: "planning_engine", enabled: true, rolloutPct: 100, description: "Mobility Planning Engine" },
      { flag: "developer_console", enabled: true, rolloutPct: 100, description: "Developer workspace" },
      { flag: "reverse_auction", enabled: true, rolloutPct: 100, description: "Reverse auction engine" },
      { flag: "parcel_network", enabled: true, rolloutPct: 100, description: "Unified parcel logistics" },
      { flag: "fleet_plugins", enabled: true, rolloutPct: 100, description: "Fleet plugin participation" },
      { flag: "ai2ai_marketplace", enabled: true, rolloutPct: 100, description: "AI-to-AI marketplace" },
    ];
    for (const f of defaults) this.flags.set(f.flag, f);
  }

  isEnabled(flag: FeatureFlag): boolean {
    return this.flags.get(flag)?.enabled ?? false;
  }

  set(flag: FeatureFlag, enabled: boolean): void {
    const existing = this.flags.get(flag);
    if (existing) {
      existing.enabled = enabled;
      this.flags.set(flag, existing);
    }
  }

  all(): FeatureFlagState[] {
    return Array.from(this.flags.values());
  }
}

// --- Singletons (in-process) ---------------------------------------------

export const eventBus = new EventBus();
export const commandBus = new CommandBus(eventBus);
export const featureFlags = new FeatureFlagService();

// --- Helpers --------------------------------------------------------------

let idCounter = 0;
export function generateId(prefix = "id"): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter.toString(36)}`;
}

export function createEvent(
  type: string,
  aggregateId: string,
  payload: Record<string, unknown>,
  correlationId?: string,
  causedBy?: string
): DomainEvent {
  return {
    id: generateId("evt"),
    type,
    aggregateId,
    payload,
    correlationId: correlationId || generateId("corr"),
    causedBy,
    timestamp: Date.now(),
    version: 1,
  };
}

export function createCommand(
  type: string,
  aggregateId: string,
  payload: Record<string, unknown>,
  userId?: string
): Command {
  return {
    type,
    aggregateId,
    payload,
    idempotencyKey: `${type}:${aggregateId}`,
    correlationId: generateId("corr"),
    userId,
    timestamp: Date.now(),
  };
}
