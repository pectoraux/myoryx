// Oryx Mobility Kernel — AI Runtime
// Shared runtime for rider, driver, and fleet AI teams. Provides planning,
// memory, reasoning traceability, tool execution, policy enforcement, and
// event subscriptions. Every agent runs on this runtime.

import type {
  AgentDefinition,
  AgentDecision,
  AgentMemory,
  AgentRole,
  DomainEvent,
} from "./types";
import { eventBus, createEvent, generateId } from "./event-bus";

type ToolFn = (args: Record<string, unknown>) => Promise<unknown>;

interface Tool {
  id: string;
  name: string;
  description: string;
  execute: ToolFn;
}

class AIRuntime {
  private agents = new Map<string, AgentDefinition>();
  private memories = new Map<string, AgentMemory>();
  private tools = new Map<string, Tool>();
  private activeAgents = new Set<string>();

  registerAgent(agent: AgentDefinition): void {
    this.agents.set(agent.id, agent);
    this.memories.set(agent.id, {
      agentId: agent.id,
      facts: {},
      decisions: [],
    });
    // subscribe to events
    for (const eventType of agent.subscribesTo) {
      eventBus.registerHandler({
        eventType,
        handle: (event: DomainEvent) => this.onEvent(agent.id, event),
      });
    }
  }

  activate(agentId: string): void {
    this.activeAgents.add(agentId);
  }

  deactivate(agentId: string): void {
    this.activeAgents.delete(agentId);
  }

  isActive(agentId: string): boolean {
    return this.activeAgents.has(agentId);
  }

  // agent planning: given an intent, produce a plan
  async plan(
    agentId: string,
    intentId: string,
    context: Record<string, unknown>
  ): Promise<AgentDecision> {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent ${agentId} not found`);
    const memory = this.memories.get(agentId)!;

    // policy check
    if (!agent.policy.canNegotiate && context.requiresNegotiation) {
      return this.recordDecision(agentId, "policy.denied", "Agent policy forbids negotiation");
    }

    // invoke a tool if requested
    let outcome: AgentDecision["outcome"] = "success";
    const reasoning = `Agent ${agent.name} planning for intent ${intentId} with role ${agent.role}`;
    const action = `optimize:${agent.role}`;

    const decision: AgentDecision = {
      id: generateId("dec"),
      agentId,
      reasoning,
      action,
      timestamp: Date.now(),
      outcome,
    };
    memory.decisions.push(decision);
    if (memory.decisions.length > 100) memory.decisions.shift();

    eventBus.publish([
      createEvent("agent.decision", agentId, { decision, intentId }, undefined, undefined),
    ]);
    return decision;
  }

  // remember a fact
  remember(agentId: string, topic: string, fact: unknown): void {
    const memory = this.memories.get(agentId);
    if (memory) memory.facts[topic] = fact;
  }

  recall(agentId: string, topic: string): unknown {
    return this.memories.get(agentId)?.facts[topic];
  }

  getDecisions(agentId: string, limit = 20): AgentDecision[] {
    return (this.memories.get(agentId)?.decisions || []).slice(-limit);
  }

  registerTool(tool: Tool): void {
    this.tools.set(tool.id, tool);
  }

  async executeTool(agentId: string, toolId: string, args: Record<string, unknown>): Promise<unknown> {
    const agent = this.agents.get(agentId);
    if (!agent?.tools.includes(toolId)) {
      throw new Error(`Agent ${agentId} cannot use tool ${toolId}`);
    }
    const tool = this.tools.get(toolId);
    if (!tool) throw new Error(`Tool ${toolId} not found`);
    return tool.execute(args);
  }

  private onEvent(agentId: string, event: DomainEvent): void {
    if (!this.activeAgents.has(agentId)) return;
    const agent = this.agents.get(agentId);
    if (!agent) return;
    // agents react to events by recording a memory + potentially planning
    this.remember(agentId, `event:${event.type}`, event.payload);
  }

  all(): AgentDefinition[] {
    return Array.from(this.agents.values());
  }

  byTeam(team: "rider" | "driver" | "fleet"): AgentDefinition[] {
    return this.all().filter((a) => a.team === team);
  }
}

export const aiRuntime = new AIRuntime();

// --- Seed agents (rider + driver + fleet teams) --------------------------

export function seedAgents(): void {
  if (aiRuntime.all().length > 0) return;

  const riderAgents: Array<Omit<AgentDefinition, "team">> = [
    { id: "a-savings", role: "savings", name: "Savings Agent", emoji: "💰", color: "#4ade80", description: "Minimizes fare above all", tools: ["negotiate", "compare_providers"], subscribesTo: ["auction.bid", "connector.ride_hail.price.update"], policy: { canBook: true, canNegotiate: true, maxSpendPerRide: 50 } },
    { id: "a-safety", role: "safety", name: "Safety Agent", emoji: "🛡️", color: "#60a5fa", description: "Guards wellbeing", tools: ["check_route_safety", "vet_driver"], subscribesTo: ["ride.booked", "connector.weather.update"], policy: { canBook: false, canNegotiate: false } },
    { id: "a-time", role: "time", name: "Time Agent", emoji: "⏱️", color: "#22d3ee", description: "Optimizes arrival time", tools: ["reroute", "predict_traffic"], subscribesTo: ["connector.maps.route.update", "connector.transit.schedule"], policy: { canBook: true, canNegotiate: false } },
    { id: "a-pooling", role: "pooling", name: "Pooling Agent", emoji: "🧑‍🤝‍🧑", color: "#a78bfa", description: "Finds carpools", tools: ["find_pool", "merge_ride"], subscribesTo: ["intent.created", "graph.node.upserted"], policy: { canBook: true, canNegotiate: true } },
    { id: "a-calendar", role: "calendar", name: "Calendar Agent", emoji: "📅", color: "#f472b6", description: "Optimizes timing", tools: ["shift_schedule", "predict_demand"], subscribesTo: ["calendar.changed", "intent.created"], policy: { canBook: false, canNegotiate: false } },
    { id: "a-negotiation", role: "negotiation", name: "Negotiation Agent", emoji: "🤝", color: "#f5a623", description: "Negotiates with providers", tools: ["negotiate", "counter_bid"], subscribesTo: ["auction.bid", "auction.cleared"], policy: { canBook: true, canNegotiate: true } },
    { id: "a-learning", role: "learning", name: "Learning Agent", emoji: "🧠", color: "#fb7185", description: "Improves the team", tools: ["train_model", "evaluate"], subscribesTo: ["ride.booked", "auction.cleared", "parcel.dispatched"], policy: { canBook: false, canNegotiate: false } },
    { id: "a-market", role: "market", name: "Market Agent", emoji: "📊", color: "#fbbf24", description: "Watches every marketplace", tools: ["scan_promos", "detect_anomaly"], subscribesTo: ["connector.ride_hail.price.update"], policy: { canBook: false, canNegotiate: false } },
    { id: "a-parcel", role: "parcel", name: "Parcel Agent", emoji: "📦", color: "#fb923c", description: "Optimizes deliveries", tools: ["rank_couriers", "batch_parcels"], subscribesTo: ["parcel.dispatched", "connector.fleet.utilization"], policy: { canBook: true, canNegotiate: true } },
    { id: "a-accessibility", role: "accessibility", name: "Accessibility Agent", emoji: "♿", color: "#c084fc", description: "Accessible vehicles & routes", tools: ["filter_accessible"], subscribesTo: ["intent.created"], policy: { canBook: false, canNegotiate: false } },
  ];

  const driverAgents: Array<Omit<AgentDefinition, "team">> = [
    { id: "d-income", role: "income_planner", name: "Income Planner", emoji: "📈", color: "#4ade80", description: "Maximize earnings vs goals", tools: ["project_earnings", "gap_analysis"], subscribesTo: ["ride.booked", "auction.cleared"], policy: { canBook: false, canNegotiate: true } },
    { id: "d-schedule", role: "schedule_builder", name: "Schedule Builder", emoji: "🗓️", color: "#f5a623", description: "Builds optimized work schedules", tools: ["chain_rides", "optimize_sequence"], subscribesTo: ["ride.booked", "intent.created"], policy: { canBook: false, canNegotiate: false } },
    { id: "d-subscription", role: "subscription_manager", name: "Subscription Manager", emoji: "🔁", color: "#a78bfa", description: "Manages recurring subscriptions", tools: ["match_subscription"], subscribesTo: ["intent.created"], policy: { canBook: true, canNegotiate: false } },
    { id: "d-return", role: "return_ride_optimizer", name: "Return Ride Optimizer", emoji: "↩️", color: "#22d3ee", description: "Broadcasts return capacity", tools: ["broadcast_return", "match_return"], subscribesTo: ["ride.booked"], policy: { canBook: false, canNegotiate: true } },
    { id: "d-coverage", role: "coverage_planner", name: "Coverage Planner", emoji: "🗺️", color: "#60a5fa", description: "Positions in high-demand zones", tools: ["predict_demand", "reposition"], subscribesTo: ["connector.events.event.scheduled"], policy: { canBook: false, canNegotiate: false } },
    { id: "d-demand", role: "demand_predictor", name: "Demand Predictor", emoji: "🔮", color: "#fb7185", description: "Predicts upcoming demand", tools: ["forecast"], subscribesTo: ["connector.events.event.scheduled", "connector.weather.update"], policy: { canBook: false, canNegotiate: false } },
    { id: "d-pool", role: "pool_manager", name: "Pool Manager", emoji: "🧑‍🤝‍🧑", color: "#facc15", description: "Accepts pool offers", tools: ["accept_pool"], subscribesTo: ["intent.created"], policy: { canBook: true, canNegotiate: true } },
    { id: "d-fleet-coord", role: "fleet_coordinator", name: "Fleet Coordinator", emoji: "🚐", color: "#fb923c", description: "Coordinates with fleet ops", tools: ["fleet_dispatch"], subscribesTo: ["connector.fleet.utilization"], policy: { canBook: false, canNegotiate: false } },
    { id: "d-learning", role: "learning", name: "Driver Learning Agent", emoji: "🧠", color: "#fb7185", description: "Learns from every ride", tools: ["train_model"], subscribesTo: ["ride.booked"], policy: { canBook: false, canNegotiate: false } },
  ];

  const fleetAgents: Array<Omit<AgentDefinition, "team">> = [
    { id: "f-alloc", role: "fleet_allocation", name: "Fleet Allocation", emoji: "🚗", color: "#f5a623", description: "Allocates drivers to rides", tools: ["allocate_driver"], subscribesTo: ["ride.booked", "auction.cleared"], policy: { canBook: false, canNegotiate: false } },
    { id: "f-util", role: "fleet_utilization", name: "Fleet Utilization", emoji: "📊", color: "#4ade80", description: "Maximizes vehicle utilization", tools: ["balance_load"], subscribesTo: ["connector.fleet.utilization"], policy: { canBook: false, canNegotiate: false } },
    { id: "f-maint", role: "fleet_maintenance", name: "Fleet Maintenance", emoji: "🔧", color: "#60a5fa", description: "Schedules maintenance windows", tools: ["schedule_maintenance"], subscribesTo: [], policy: { canBook: false, canNegotiate: false } },
    { id: "f-dispatch", role: "fleet_dispatch", name: "Fleet Dispatch", emoji: "📡", color: "#fb923c", description: "Dispatches vehicles in real-time", tools: ["dispatch"], subscribesTo: ["ride.booked"], policy: { canBook: true, canNegotiate: false } },
  ];

  for (const a of riderAgents) aiRuntime.registerAgent({ ...a, team: "rider" });
  for (const a of driverAgents) aiRuntime.registerAgent({ ...a, team: "driver" });
  for (const a of fleetAgents) aiRuntime.registerAgent({ ...a, team: "fleet" });

  // activate the default rider team
  aiRuntime.activate("a-savings");
  aiRuntime.activate("a-pooling");

  // register a few tools
  aiRuntime.registerTool({
    id: "negotiate",
    name: "Negotiate",
    description: "Send a counter-offer to a provider",
    execute: async (args) => ({ ok: true, counterPrice: (args.price as number) * 0.92 }),
  });
  aiRuntime.registerTool({
    id: "compare_providers",
    name: "Compare Providers",
    description: "Compare all provider prices for a route",
    execute: async () => ({ providers: [] }),
  });
  aiRuntime.registerTool({
    id: "find_pool",
    name: "Find Pool",
    description: "Find nearby riders heading the same direction",
    execute: async () => ({ matches: 3 }),
  });
}
