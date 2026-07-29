// Oryx Mobility Kernel — bootstrap
// Initializes the entire kernel: graph, connectors, plugins, AI runtime,
// planning engine. Call once on server startup.

import { graph, seedGraph } from "./graph";
import { connectors, seedConnectors } from "./connectors";
import { plugins } from "./plugins";
import { aiRuntime, seedAgents } from "./ai-runtime";
import { planningEngine, seedPlanningEngine } from "./planning-engine";
import { featureFlags, generateId, createEvent, createCommand, eventBus, commandBus } from "./event-bus";

let initialized = false;

export function initKernel(): void {
  if (initialized) return;
  initialized = true;

  // 1. Knowledge Graph
  seedGraph();

  // 2. Connectors (start polling)
  seedConnectors();
  connectors.startAll();

  // 3. AI Runtime (agents + tools)
  seedAgents();

  // 4. Planning Engine (calendar → intents → optimization)
  seedPlanningEngine();

  console.log("[kernel] Oryx Mobility Kernel initialized", {
    graph: graph.stats(),
    connectors: connectors.all().length,
    agents: aiRuntime.all().length,
    flags: featureFlags.all().filter((f) => f.enabled).length,
  });
}

export { graph, connectors, plugins, aiRuntime, planningEngine, featureFlags, generateId, createEvent, createCommand, eventBus, commandBus };
