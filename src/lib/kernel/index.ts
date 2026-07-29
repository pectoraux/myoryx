// Oryx Mobility Kernel — bootstrap
// Initializes the entire kernel: graph, connectors, plugins, AI runtime,
// planning engine, sagas, infrastructure (RBAC, audit, logging, metrics,
// tracing, background jobs, health). Call once on server startup.

import { graph, seedGraph } from "./graph";
import { connectors, seedConnectors } from "./connectors";
import { plugins } from "./plugins";
import { aiRuntime, seedAgents } from "./ai-runtime";
import { planningEngine, seedPlanningEngine } from "./planning-engine";
import { sagas, seedSagas } from "./sagas";
import {
  featureFlags,
  generateId,
  createEvent,
  createCommand,
  eventBus,
  commandBus,
} from "./event-bus";
import {
  rbac,
  tenants,
  audit,
  logger,
  metrics,
  tracer,
  jobs,
  health,
  wireObservability,
} from "./infrastructure";
import type { Role } from "./infrastructure";

let initialized = false;

export function initKernel(): void {
  if (initialized) return;
  initialized = true;

  // 0. Observability wiring (audit + metrics on every event)
  wireObservability();

  // 1. Multi-tenancy — default tenant
  tenants.create({
    id: "default",
    name: "Oryx Accra",
    region: "af-west-1",
    plan: "enterprise",
    createdAt: Date.now(),
  });
  tenants.create({
    id: "tema",
    name: "Oryx Tema",
    region: "af-west-1",
    plan: "pro",
    createdAt: Date.now(),
  });

  // 2. RBAC — seed roles for demo users
  rbac.assignRole("demo", "rider", "default");
  rbac.assignRole("demo", "developer", "default");
  rbac.assignRole("ekontetevi@gmail", "super_admin", "default");
  rbac.assignRole("ekontetevi@gmail", "admin", "default");

  // 3. Knowledge Graph (all entity types)
  seedGraph();

  // 4. Connectors (start polling)
  seedConnectors();
  connectors.startAll();

  // 5. AI Runtime (agents + tools)
  seedAgents();

  // 6. Planning Engine (calendar → intents → optimization)
  seedPlanningEngine();

  // 7. Sagas (long-running workflows)
  seedSagas();

  // 8. Background jobs — register handlers
  jobs.register("intent.optimize", async (job) => {
    planningEngine.optimizeIntent(job.payload.intentId as string);
    return { optimized: true };
  });
  jobs.register("connector.health_check", async (job) => {
    const c = connectors.get(job.payload.connectorId as string);
    return { status: c?.health.status || "unknown" };
  });

  // 9. Health checks
  health.register("graph", async () => ({
    status: graph.stats().totalNodes > 0 ? "up" : "down",
    detail: `${graph.stats().totalNodes} nodes`,
  }));
  health.register("connectors", async () => {
    const live = connectors.all().filter((c) => c.health.status === "live").length;
    return { status: live > 0 ? "up" : "down", detail: `${live}/${connectors.all().length} live` };
  });
  health.register("planning_engine", async () => ({
    status: "up",
    detail: `${planningEngine.stats().totalIntents} intents`,
  }));
  health.register("ai_runtime", async () => ({
    status: aiRuntime.all().length > 0 ? "up" : "down",
    detail: `${aiRuntime.all().length} agents`,
  }));

  logger.info("Oryx Mobility Kernel initialized", {
    graph: graph.stats(),
    connectors: connectors.all().length,
    agents: aiRuntime.all().length,
    intents: planningEngine.stats().totalIntents,
    tenants: tenants.all().length,
  });
}

export {
  graph,
  connectors,
  plugins,
  aiRuntime,
  planningEngine,
  sagas,
  featureFlags,
  generateId,
  createEvent,
  createCommand,
  eventBus,
  commandBus,
  rbac,
  tenants,
  audit,
  logger,
  metrics,
  tracer,
  jobs,
  health,
};
