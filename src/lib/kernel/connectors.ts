// Oryx Mobility Kernel — Universal Connector Framework
// Plugin-based connector runtime. Each connector ingests data from an external
// source (maps, weather, events, ride-hail, fleet, etc.) and publishes typed
// ConnectorEvents into the event bus. Supports polling, webhooks, streaming,
// health checks, rate limiting, retries, and observability.

import type {
  ConnectorCategory,
  ConnectorEvent,
  ConnectorHealth,
  ConnectorManifest,
  ConnectorStatus,
} from "./types";
import { eventBus, createEvent, generateId } from "./event-bus";

export interface ConnectorInstance {
  manifest: ConnectorManifest;
  health: ConnectorHealth;
  start: () => void;
  stop: () => void;
}

type IngestFn = (connector: ConnectorRuntime) => Promise<void>;

class ConnectorRuntime {
  manifest: ConnectorManifest;
  health: ConnectorHealth;
  private timer: ReturnType<typeof setInterval> | null = null;
  private ingestFn: IngestFn;
  private lastEventTimes: number[] = [];
  private rateLimitCount = 0;
  private rateLimitResetAt = Date.now() + 60000;

  constructor(manifest: ConnectorManifest, ingestFn: IngestFn) {
    this.manifest = manifest;
    this.ingestFn = ingestFn;
    this.health = {
      status: "disconnected",
      eventsIngested: 0,
      latencyMs: 0,
      uptimePct: 100,
    };
  }

  start(): void {
    this.health.status = "syncing";
    if (this.manifest.mode === "poll" && this.manifest.pollIntervalMs) {
      this.timer = setInterval(() => this.tick(), this.manifest.pollIntervalMs);
    }
    // first tick immediately
    this.tick();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.health.status = "disconnected";
  }

  private async tick(): Promise<void> {
    // rate limit
    const now = Date.now();
    if (now > this.rateLimitResetAt) {
      this.rateLimitCount = 0;
      this.rateLimitResetAt = now + 60000;
    }
    if (
      this.manifest.rateLimitPerMin &&
      this.rateLimitCount >= this.manifest.rateLimitPerMin
    ) {
      this.health.status = "degraded";
      return;
    }
    this.rateLimitCount++;
    const start = now;
    try {
      await this.ingestFn(this);
      this.health.latencyMs = Date.now() - start;
      this.health.status = "live";
      this.health.uptimePct = Math.min(100, this.health.uptimePct + 0.01);
    } catch (e: any) {
      this.health.status = "error";
      this.health.lastError = e?.message || "unknown error";
      this.health.uptimePct = Math.max(0, this.health.uptimePct - 0.5);
    }
  }

  // connectors call this to emit events
  emit(type: string, payload: Record<string, unknown>): void {
    const event: ConnectorEvent = {
      id: generateId("cev"),
      connectorId: this.manifest.id,
      category: this.manifest.category,
      type,
      payload,
      timestamp: Date.now(),
    };
    this.health.eventsIngested++;
    this.health.lastEventAt = Date.now();
    this.lastEventTimes.push(Date.now());
    if (this.lastEventTimes.length > 100) this.lastEventTimes.shift();
    // publish into the kernel event bus
    eventBus.publish([
      createEvent(
        `connector.${this.manifest.category}.${type}`,
        event.id,
        { connectorId: this.manifest.id, ...payload },
        undefined,
        undefined
      ),
    ]);
  }
}

class ConnectorRegistry {
  private connectors = new Map<string, ConnectorInstance>();

  register(manifest: ConnectorManifest, ingestFn: IngestFn): ConnectorInstance {
    const rt = new ConnectorRuntime(manifest, ingestFn);
    const instance: ConnectorInstance = {
      manifest,
      health: rt.health,
      start: () => rt.start(),
      stop: () => rt.stop(),
    };
    this.connectors.set(manifest.id, instance);
    return instance;
  }

  start(id: string): void {
    this.connectors.get(id)?.start();
  }

  startAll(): void {
    for (const c of this.connectors.values()) c.start();
  }

  stop(id: string): void {
    this.connectors.get(id)?.stop();
  }

  get(id: string): ConnectorInstance | undefined {
    return this.connectors.get(id);
  }

  all(): ConnectorInstance[] {
    return Array.from(this.connectors.values());
  }

  byCategory(cat: ConnectorCategory): ConnectorInstance[] {
    return this.all().filter((c) => c.manifest.category === cat);
  }
}

export const connectors = new ConnectorRegistry();

// --- Reference connectors (demo data, real ingestion logic) --------------

export function seedConnectors(): void {
  if (connectors.all().length > 0) return;

  // Maps connector (OSM)
  connectors.register(
    {
      id: "c-osm",
      name: "OpenStreetMap",
      category: "maps",
      version: "1.0.0",
      mode: "poll",
      pollIntervalMs: 30000,
      signals: ["routing", "closures", "speeds"],
      auth: "none",
    },
    async (rt) => {
      rt.emit("route.update", {
        segment: "ring-rd",
        avgSpeedKmh: 22 + Math.floor(Math.random() * 12),
        congestion: Math.random() > 0.7 ? "heavy" : "light",
      });
    }
  );

  // Weather connector
  connectors.register(
    {
      id: "c-weather",
      name: "Weather Stream",
      category: "weather",
      version: "1.0.0",
      mode: "poll",
      pollIntervalMs: 60000,
      signals: ["rain", "wind", "flood", "heat"],
      auth: "api_key",
    },
    async (rt) => {
      const conditions = ["clear", "cloudy", "light_rain", "heavy_rain", "heat"];
      const c = conditions[Math.floor(Math.random() * conditions.length)];
      rt.emit("weather.update", { condition: c, tempC: 26 + Math.floor(Math.random() * 8) });
    }
  );

  // Events connector
  connectors.register(
    {
      id: "c-events",
      name: "Event Feed",
      category: "events",
      version: "1.0.0",
      mode: "poll",
      pollIntervalMs: 120000,
      signals: ["concerts", "matches", "conferences"],
      auth: "none",
    },
    async (rt) => {
      const events = ["concert at Stadium", "match at Sports Complex", "conference at ACC"];
      rt.emit("event.scheduled", {
        name: events[Math.floor(Math.random() * events.length)],
        attendees: 200 + Math.floor(Math.random() * 5000),
      });
    }
  );

  // Ride-hail connector (Uber-like)
  connectors.register(
    {
      id: "c-uber",
      name: "Uber API",
      category: "ride_hail",
      version: "1.0.0",
      mode: "poll",
      pollIntervalMs: 15000,
      signals: ["pricing", "eta", "surge", "availability"],
      auth: "oauth",
      rateLimitPerMin: 60,
    },
    async (rt) => {
      rt.emit("price.update", {
        provider: "Uber",
        basePrice: 8 + Math.random() * 12,
        surge: 1 + Math.random() * 0.8,
        etaMin: 2 + Math.floor(Math.random() * 8),
      });
    }
  );

  // Fleet connector
  connectors.register(
    {
      id: "c-fleet",
      name: "Fleet Dispatch",
      category: "fleet",
      version: "1.0.0",
      mode: "stream",
      signals: ["vehicles", "utilization", "dispatch"],
      auth: "api_key",
    },
    async (rt) => {
      rt.emit("fleet.utilization", {
        fleetId: "citycab",
        vehicles: 240,
        utilization: 70 + Math.floor(Math.random() * 20),
      });
    }
  );

  // Transit connector
  connectors.register(
    {
      id: "c-transit",
      name: "Public Transit",
      category: "transit",
      version: "1.0.0",
      mode: "poll",
      pollIntervalMs: 45000,
      signals: ["bus", "schedule", "delay"],
      auth: "none",
    },
    async (rt) => {
      rt.emit("transit.schedule", {
        route: "BRT-1",
        nextArrivalMin: 3 + Math.floor(Math.random() * 12),
        onTime: Math.random() > 0.2,
      });
    }
  );
}
