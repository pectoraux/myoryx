// Oryx Mobility Kernel — Mobility Planning Engine (M4-M6)
// The calendar is not a traditional calendar — it is the planning engine
// for all mobility. Every event becomes a Mobility Intent that flows
// through the event bus. The optimizer continuously computes real
// suggestions (shifts, pools, return rides, multimodal, subscriptions,
// batching, traffic avoidance) using actual demand curves + route costs.

import type {
  CalendarEvent,
  CalendarView,
  IntentSuggestion,
  IntentType,
  MobilityIntent,
  ScheduleConflict,
  CostOverTime,
} from "./types";
import { commandBus, createCommand, eventBus, createEvent, generateId } from "./event-bus";
import {
  optimizeIntent as runOptimization,
  predictCostOverTime,
  detectConflicts,
} from "./optimizer";

class PlanningEngine {
  private events = new Map<string, CalendarEvent>();
  private intents = new Map<string, MobilityIntent>();
  private optimizationTimer: ReturnType<typeof setInterval> | null = null;

  // --- Calendar events ---------------------------------------------------

  addEvent(event: CalendarEvent): void {
    this.events.set(event.id, event);
    eventBus.publish([
      createEvent("calendar.changed", event.id, { event }, undefined, undefined),
    ]);
    // transform into a Mobility Intent
    this.deriveIntent(event);
  }

  removeEvent(id: string): void {
    const event = this.events.get(id);
    this.events.delete(id);
    if (event?.intentId) {
      this.intents.delete(event.intentId);
    }
    eventBus.publish([
      createEvent("calendar.changed", id, { removed: true }, undefined, undefined),
    ]);
  }

  getEvents(userId: string, view?: CalendarView): CalendarEvent[] {
    return Array.from(this.events.values())
      .filter((e) => e.userId === userId && (!view || e.view === view))
      .sort((a, b) => a.start.localeCompare(b.start));
  }

  // --- Mobility Intents --------------------------------------------------

  // Transform a calendar event into a Mobility Intent
  private deriveIntent(event: CalendarEvent): void {
    const intentType = this.inferIntentType(event);
    const horizon = event.view === "predictable" ? "predictable" : "short_notice";
    const intent: MobilityIntent = {
      id: generateId("intent"),
      userId: event.userId,
      type: intentType,
      horizon,
      title: event.title,
      origin: event.origin,
      destination: event.destination,
      arriveBy: event.start,
      recurring: event.recurring
        ? { days: event.recurring.days, time: event.recurring.time }
        : undefined,
      travelWindow: event.travelWindow,
      planSpan: event.planSpan,
      policy: event.policy,
      dependencies: event.dependencies,
      priority: event.priority,
      status: "predicted",
      suggestions: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.intents.set(intent.id, intent);
    event.intentId = intent.id;
    eventBus.publish([
      createEvent("intent.created", intent.id, { intent }, undefined, undefined),
    ]);
    // run optimization on the new intent
    this.optimizeIntent(intent.id);
  }

  private inferIntentType(event: CalendarEvent): IntentType {
    const title = event.title.toLowerCase();
    if (title.includes("work") || title.includes("office") || title.includes("commute"))
      return "commute";
    if (title.includes("church")) return "church";
    if (title.includes("school")) return "school";
    if (title.includes("gym")) return "gym";
    if (title.includes("meeting")) return "meeting";
    if (title.includes("airport")) return "airport";
    if (title.includes("doctor") || title.includes("medical") || title.includes("dentist"))
      return "medical";
    if (title.includes("shop")) return "shopping";
    if (title.includes("deliver") || title.includes("parcel")) return "delivery";
    if (title.includes("family")) return "family";
    return "social";
  }

  getIntent(id: string): MobilityIntent | undefined {
    return this.intents.get(id);
  }

  getIntents(userId: string): MobilityIntent[] {
    return Array.from(this.intents.values())
      .filter((i) => i.userId === userId)
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  // --- Optimization (M6 — real algorithms, no hardcoded values) ---------

  optimizeIntent(intentId: string): IntentSuggestion[] {
    const intent = this.intents.get(intentId);
    if (!intent) return [];
    // run the real optimizer (demand curves, route costs, pool matching)
    const suggestions = runOptimization(intent);
    intent.suggestions = suggestions;
    intent.status = "optimizing";
    intent.updatedAt = Date.now();
    eventBus.publish([
      createEvent("intent.optimized", intent.id, { intentId: intent.id, suggestions }, undefined, undefined),
    ]);
    return suggestions;
  }

  // cost-over-time prediction for an intent's route
  getCostOverTime(intentId: string): CostOverTime | undefined {
    const intent = this.intents.get(intentId);
    if (!intent) return undefined;
    if (!intent.costOverTime) {
      const baseHour = this.parseHour(intent.arriveBy || intent.recurring?.time || "08:00");
      intent.costOverTime = predictCostOverTime(intent.origin, intent.destination, baseHour);
    }
    return intent.costOverTime;
  }

  private parseHour(time: string): number {
    if (time.includes("T")) {
      const d = new Date(time);
      return d.getHours() + d.getMinutes() / 60;
    }
    const [h, m] = time.split(":").map(Number);
    return (h || 0) + (m || 0) / 60;
  }

  // conflict detection across a user's intents
  detectScheduleConflicts(userId: string): ScheduleConflict[] {
    return detectConflicts(this.getIntents(userId));
  }

  // continuous optimization loop — runs every 30s, re-optimizes all intents
  startContinuousOptimization(): void {
    if (this.optimizationTimer) return;
    this.optimizationTimer = setInterval(() => {
      for (const intent of this.intents.values()) {
        if (intent.status === "fulfilled" || intent.status === "cancelled") continue;
        this.optimizeIntent(intent.id);
      }
      eventBus.publish([
        createEvent("scheduler.tick", "scheduler", { intents: this.intents.size }, undefined, undefined),
      ]);
    }, 30000);
  }

  stopContinuousOptimization(): void {
    if (this.optimizationTimer) clearInterval(this.optimizationTimer);
    this.optimizationTimer = null;
  }

  // --- Command handlers (CQRS) ------------------------------------------

  registerCommandHandlers(): void {
    commandBus.register({
      commandType: "calendar.addEvent",
      handle: (cmd) => {
        const event: CalendarEvent = {
          id: generateId("cev"),
          userId: cmd.userId || "demo",
          title: cmd.payload.title as string,
          view: (cmd.payload.view as CalendarView) || "short_notice",
          origin: cmd.payload.origin as string,
          destination: cmd.payload.destination as string,
          start: cmd.payload.start as string,
          end: cmd.payload.end as string,
          allDay: cmd.payload.allDay as boolean,
          recurring: cmd.payload.recurring as any,
          priority: (cmd.payload.priority as any) || "normal",
          constraints: cmd.payload.constraints as string[],
          notes: cmd.payload.notes as string,
          optimized: false,
          createdAt: Date.now(),
        };
        this.addEvent(event);
        return [
          createEvent("calendar.event.added", event.id, { event }, cmd.correlationId, undefined),
        ];
      },
    });

    commandBus.register({
      commandType: "calendar.removeEvent",
      handle: (cmd) => {
        this.removeEvent(cmd.payload.eventId as string);
        return [
          createEvent("calendar.event.removed", cmd.payload.eventId as string, {}, cmd.correlationId, undefined),
        ];
      },
    });

    commandBus.register({
      commandType: "intent.optimize",
      handle: (cmd) => {
        const suggestions = this.optimizeIntent(cmd.payload.intentId as string);
        return [
          createEvent(
            "intent.optimized",
            cmd.payload.intentId as string,
            { suggestions },
            cmd.correlationId,
            undefined
          ),
        ];
      },
    });
  }

  // --- Stats -------------------------------------------------------------

  stats() {
    return {
      totalEvents: this.events.size,
      totalIntents: this.intents.size,
      optimizing: Array.from(this.intents.values()).filter((i) => i.status === "optimizing").length,
      suggestions: Array.from(this.intents.values()).reduce(
        (s, i) => s + (i.suggestions?.length || 0),
        0
      ),
    };
  }
}

export const planningEngine = new PlanningEngine();

// Seed demo data
export function seedPlanningEngine(): void {
  if (planningEngine.stats().totalEvents > 0) return;
  planningEngine.registerCommandHandlers();
  planningEngine.startContinuousOptimization();
  // seed predictable trips
  const demoUserId = "demo";
  planningEngine.addEvent({
    id: generateId("cev"),
    userId: demoUserId,
    title: "Office commute",
    view: "predictable",
    origin: "East Legon",
    destination: "The Octagon",
    start: "08:00",
    recurring: { days: [1, 2, 3, 4, 5], time: "08:00" },
    priority: "high",
    optimized: false,
    createdAt: Date.now(),
  });
  planningEngine.addEvent({
    id: generateId("cev"),
    userId: demoUserId,
    title: "Sunday church",
    view: "predictable",
    origin: "Spintex",
    destination: "Cathedral",
    start: "09:30",
    recurring: { days: [0], time: "09:30" },
    priority: "normal",
    optimized: false,
    createdAt: Date.now(),
  });
  planningEngine.addEvent({
    id: generateId("cev"),
    userId: demoUserId,
    title: "Airport trip",
    view: "short_notice",
    origin: "East Legon",
    destination: "Kotoka Airport",
    start: new Date(Date.now() + 86400000).toISOString(),
    priority: "critical",
    optimized: false,
    createdAt: Date.now(),
  });
}
