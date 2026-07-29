// Oryx Mobility Kernel — Production infrastructure
// RBAC, multi-tenancy, audit trail, observability (structured logging,
// metrics, tracing), background jobs, and health monitoring.

import type { DomainEvent } from "./types";
import { eventBus } from "./event-bus";

// --- RBAC -----------------------------------------------------------------

export type Role =
  | "super_admin"
  | "admin"
  | "fleet_operator"
  | "merchant"
  | "driver"
  | "rider"
  | "npd"
  | "developer"
  | "auditor"
  | "support";

export type Permission =
  | "read:graph"
  | "write:graph"
  | "read:intents"
  | "write:intents"
  | "read:calendar"
  | "write:calendar"
  | "read:users"
  | "write:users"
  | "read:connectors"
  | "manage:connectors"
  | "read:extensions"
  | "publish:extensions"
  | "install:extensions"
  | "manage:flags"
  | "manage:rbac"
  | "read:audit"
  | "book:rides"
  | "negotiate:auctions"
  | "dispatch:parcels"
  | "access:dev_console"
  | "*";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: ["*"],
  admin: ["read:graph", "write:graph", "read:intents", "write:intents", "read:calendar", "write:calendar", "read:users", "write:users", "read:connectors", "manage:connectors", "read:extensions", "publish:extensions", "manage:flags", "read:audit", "book:rides", "negotiate:auctions", "dispatch:parcels", "access:dev_console"],
  fleet_operator: ["read:graph", "read:intents", "read:calendar", "dispatch:parcels", "read:connectors"],
  merchant: ["read:graph", "dispatch:parcels", "read:extensions", "install:extensions"],
  driver: ["read:graph", "read:intents", "read:calendar", "book:rides", "negotiate:auctions"],
  rider: ["read:graph", "read:intents", "read:calendar", "write:calendar", "book:rides", "negotiate:auctions", "install:extensions"],
  npd: ["read:graph", "read:intents", "book:rides"],
  developer: ["read:graph", "read:intents", "read:extensions", "publish:extensions", "access:dev_console"],
  auditor: ["read:graph", "read:intents", "read:users", "read:connectors", "read:extensions", "read:audit"],
  support: ["read:graph", "read:intents", "read:users", "read:calendar"],
};

class RBACService {
  private userRoles = new Map<string, Set<Role>>();
  private userTenant = new Map<string, string>();

  assignRole(userId: string, role: Role, tenantId = "default"): void {
    if (!this.userRoles.has(userId)) this.userRoles.set(userId, new Set());
    this.userRoles.get(userId)!.add(role);
    this.userTenant.set(userId, tenantId);
  }

  revokeRole(userId: string, role: Role): void {
    this.userRoles.get(userId)?.delete(role);
  }

  getRoles(userId: string): Role[] {
    return Array.from(this.userRoles.get(userId) || []);
  }

  getTenant(userId: string): string {
    return this.userTenant.get(userId) || "default";
  }

  can(userId: string, permission: Permission): boolean {
    const roles = this.userRoles.get(userId);
    if (!roles || roles.size === 0) return false;
    for (const role of roles) {
      const perms = ROLE_PERMISSIONS[role] || [];
      if (perms.includes("*") || perms.includes(permission)) return true;
    }
    return false;
  }

  // multi-tenant isolation check
  sameTenant(userId: string, resourceTenantId: string): boolean {
    return this.getTenant(userId) === resourceTenantId;
  }
}

export const rbac = new RBACService();

// --- Multi-tenancy --------------------------------------------------------

export interface Tenant {
  id: string;
  name: string;
  region: string;
  plan: "free" | "pro" | "enterprise";
  createdAt: number;
}

class TenantService {
  private tenants = new Map<string, Tenant>();

  create(tenant: Tenant): void {
    this.tenants.set(tenant.id, tenant);
  }

  get(id: string): Tenant | undefined {
    return this.tenants.get(id);
  }

  all(): Tenant[] {
    return Array.from(this.tenants.values());
  }
}

export const tenants = new TenantService();

// --- Audit trail ----------------------------------------------------------

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  resource: string;
  resourceId?: string;
  tenantId: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

class AuditService {
  private entries: AuditEntry[] = [];
  private maxEntries = 10000;

  log(entry: Omit<AuditEntry, "id" | "timestamp">): void {
    this.entries.push({
      ...entry,
      id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    });
    if (this.entries.length > this.maxEntries) {
      this.entries.splice(0, this.entries.length - this.maxEntries);
    }
  }

  recent(limit = 50): AuditEntry[] {
    return this.entries.slice(-limit);
  }

  byActor(actor: string, limit = 50): AuditEntry[] {
    return this.entries.filter((e) => e.actor === actor).slice(-limit);
  }

  byResource(resource: string, limit = 50): AuditEntry[] {
    return this.entries.filter((e) => e.resource === resource).slice(-limit);
  }
}

export const audit = new AuditService();

// --- Observability: structured logging, metrics, tracing -----------------

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  tenantId?: string;
  correlationId?: string;
  meta?: Record<string, unknown>;
}

class Logger {
  private entries: LogEntry[] = [];
  private maxEntries = 5000;
  private listeners = new Set<(e: LogEntry) => void>();

  log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    };
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.splice(0, this.entries.length - this.maxEntries);
    }
    // structured console output
    const color =
      level === "error" ? "\x1b[31m" : level === "warn" ? "\x1b[33m" : level === "info" ? "\x1b[36m" : "\x1b[90m";
    console.log(`${color}[${entry.timestamp}] [${level.toUpperCase()}]${"\x1b[0m"} ${message}${meta ? " " + JSON.stringify(meta) : ""}`);
    this.listeners.forEach((l) => l(entry));
  }

  info(msg: string, meta?: Record<string, unknown>) {
    this.log("info", msg, meta);
  }
  warn(msg: string, meta?: Record<string, unknown>) {
    this.log("warn", msg, meta);
  }
  error(msg: string, meta?: Record<string, unknown>) {
    this.log("error", msg, meta);
  }
  debug(msg: string, meta?: Record<string, unknown>) {
    this.log("debug", msg, meta);
  }

  recent(limit = 100, level?: LogLevel): LogEntry[] {
    const filtered = level ? this.entries.filter((e) => e.level === level) : this.entries;
    return filtered.slice(-limit);
  }

  subscribe(fn: (e: LogEntry) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

export const logger = new Logger();

// --- Metrics --------------------------------------------------------------

export interface Metric {
  name: string;
  value: number;
  tags: Record<string, string>;
  timestamp: number;
}

class MetricsService {
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();
  private histograms = new Map<string, number[]>();
  private history: Metric[] = [];

  increment(name: string, tags: Record<string, string> = {}, by = 1): void {
    const key = `${name}:${JSON.stringify(tags)}`;
    this.counters.set(key, (this.counters.get(key) || 0) + by);
    this.history.push({ name, value: by, tags, timestamp: Date.now() });
    if (this.history.length > 5000) this.history.shift();
  }

  gauge(name: string, value: number, tags: Record<string, string> = {}): void {
    const key = `${name}:${JSON.stringify(tags)}`;
    this.gauges.set(key, value);
  }

  observe(name: string, value: number, tags: Record<string, string> = {}): void {
    const key = `${name}:${JSON.stringify(tags)}`;
    if (!this.histograms.has(key)) this.histograms.set(key, []);
    this.histograms.get(key)!.push(value);
    if (this.histograms.get(key)!.length > 1000) this.histograms.get(key)!.shift();
  }

  snapshot() {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([k, v]) => [
          k,
          { count: v.length, avg: v.reduce((s, x) => s + x, 0) / v.length, p95: v[Math.floor(v.length * 0.95)] || 0 },
        ])
      ),
      historySize: this.history.length,
    };
  }

  recent(limit = 50): Metric[] {
    return this.history.slice(-limit);
  }
}

export const metrics = new MetricsService();

// --- Tracing --------------------------------------------------------------

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  attributes: Record<string, unknown>;
  events: Array<{ name: string; timestamp: number; attributes?: Record<string, unknown> }>;
}

class Tracer {
  private spans = new Map<string, Span>();
  private traceIndex = new Map<string, string[]>();

  startSpan(name: string, traceId?: string, parentSpanId?: string): Span {
    const span: Span = {
      traceId: traceId || `tr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      spanId: `sp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      parentSpanId,
      name,
      startTime: Date.now(),
      attributes: {},
      events: [],
    };
    this.spans.set(span.spanId, span);
    if (!this.traceIndex.has(span.traceId)) this.traceIndex.set(span.traceId, []);
    this.traceIndex.get(span.traceId)!.push(span.spanId);
    return span;
  }

  endSpan(spanId: string): void {
    const span = this.spans.get(spanId);
    if (span) span.endTime = Date.now();
  }

  addEvent(spanId: string, name: string, attributes?: Record<string, unknown>): void {
    const span = this.spans.get(spanId);
    if (span) span.events.push({ name, timestamp: Date.now(), attributes });
  }

  getTrace(traceId: string): Span[] {
    const ids = this.traceIndex.get(traceId) || [];
    return ids.map((id) => this.spans.get(id)).filter((s): s is Span => !!s);
  }

  recentSpans(limit = 50): Span[] {
    return Array.from(this.spans.values()).slice(-limit);
  }
}

export const tracer = new Tracer();

// --- Background jobs ------------------------------------------------------

export interface Job {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  status: "queued" | "running" | "completed" | "failed" | "retrying";
  attempts: number;
  maxAttempts: number;
  scheduledAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  result?: unknown;
}

type JobHandler = (job: Job) => Promise<unknown>;

class BackgroundJobs {
  private handlers = new Map<string, JobHandler>();
  private queue: Job[] = [];
  private processing = false;
  private maxQueueSize = 1000;

  register(type: string, handler: JobHandler): void {
    this.handlers.set(type, handler);
  }

  enqueue(type: string, payload: Record<string, unknown>, options?: { delayMs?: number; maxAttempts?: number }): string {
    const job: Job = {
      id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      payload,
      status: "queued",
      attempts: 0,
      maxAttempts: options?.maxAttempts || 3,
      scheduledAt: Date.now() + (options?.delayMs || 0),
    };
    this.queue.push(job);
    if (this.queue.length > this.maxQueueSize) this.queue.shift();
    metrics.increment("jobs.queued", { type });
    this.process();
    return job.id;
  }

  private async process(): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    while (this.queue.length > 0) {
      const job = this.queue[0];
      if (job.scheduledAt > Date.now()) {
        // re-check in a bit
        setTimeout(() => this.process(), 1000);
        break;
      }
      this.queue.shift();
      const handler = this.handlers.get(job.type);
      if (!handler) {
        job.status = "failed";
        job.error = `No handler for job type ${job.type}`;
        logger.error(`Job ${job.id} failed: no handler`, { type: job.type });
        continue;
      }
      job.status = "running";
      job.startedAt = Date.now();
      job.attempts++;
      try {
        job.result = await handler(job);
        job.status = "completed";
        job.completedAt = Date.now();
        metrics.increment("jobs.completed", { type: job.type });
      } catch (e: any) {
        if (job.attempts < job.maxAttempts) {
          job.status = "retrying";
          job.error = e?.message;
          // re-queue with backoff
          job.scheduledAt = Date.now() + Math.pow(2, job.attempts) * 1000;
          this.queue.push(job);
          metrics.increment("jobs.retrying", { type: job.type });
        } else {
          job.status = "failed";
          job.error = e?.message;
          metrics.increment("jobs.failed", { type: job.type });
          logger.error(`Job ${job.id} failed permanently`, { type: job.type, error: e?.message });
        }
      }
    }
    this.processing = false;
  }

  status() {
    return {
      queued: this.queue.filter((j) => j.status === "queued").length,
      running: this.queue.filter((j) => j.status === "running").length,
      completed: this.queue.filter((j) => j.status === "completed").length,
      failed: this.queue.filter((j) => j.status === "failed").length,
      total: this.queue.length,
    };
  }
}

export const jobs = new BackgroundJobs();

// --- Health monitoring ----------------------------------------------------

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  checks: Record<string, { status: "up" | "down"; latencyMs?: number; detail?: string }>;
  uptime: number;
  version: string;
}

class HealthService {
  private startTime = Date.now();
  private checks = new Map<string, () => Promise<{ status: "up" | "down"; latencyMs?: number; detail?: string }>>();

  register(name: string, check: () => Promise<{ status: "up" | "down"; latencyMs?: number; detail?: string }>): void {
    this.checks.set(name, check);
  }

  async check(): Promise<HealthStatus> {
    const checks: HealthStatus["checks"] = {};
    let allUp = true;
    for (const [name, check] of this.checks) {
      try {
        checks[name] = await check();
        if (checks[name].status === "down") allUp = false;
      } catch (e: any) {
        checks[name] = { status: "down", detail: e?.message };
        allUp = false;
      }
    }
    return {
      status: allUp ? "healthy" : "degraded",
      checks,
      uptime: Date.now() - this.startTime,
      version: "1.0.0",
    };
  }
}

export const health = new HealthService();

// --- Wire observability into the event bus --------------------------------

let observabilityWired = false;
export function wireObservability(): void {
  if (observabilityWired) return;
  observabilityWired = true;
  eventBus.subscribe((event: DomainEvent) => {
    metrics.increment("events.published", { type: event.type });
    audit.log({
      actor: event.payload.userId ? String(event.payload.userId) : "system",
      action: event.type,
      resource: event.aggregateId,
      resourceId: event.aggregateId,
      tenantId: "default",
      metadata: event.payload,
    });
  });
  logger.info("Observability wired into event bus");
}
