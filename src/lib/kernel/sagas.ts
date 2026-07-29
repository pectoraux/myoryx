// Oryx Mobility Kernel — Saga engine
// Long-running workflows for mobility orchestration. A saga coordinates
// multiple commands/events across aggregates, handles compensation on
// failure, and persists state so it can resume after a restart.

import type { Command, DomainEvent } from "./types";
import { eventBus, commandBus, createCommand, generateId } from "./event-bus";
import { logger, metrics } from "./infrastructure";

export type SagaState = "running" | "completed" | "failed" | "compensating" | "paused";

export interface SagaStep {
  name: string;
  command: Command;
  // event type that signals this step succeeded
  onSuccess: string;
  // compensation command on failure (optional)
  compensate?: Command;
  // timeout in ms
  timeoutMs?: number;
}

export interface SagaInstance {
  id: string;
  type: string;
  steps: SagaStep[];
  currentStep: number;
  state: SagaState;
  correlationId: string;
  startedAt: number;
  updatedAt: number;
  completedEvents: string[];
  error?: string;
}

class SagaEngine {
  private sagas = new Map<string, SagaInstance>();
  private handlers = new Map<string, (data: any) => SagaStep[]>();
  private timeouts = new Map<string, ReturnType<typeof setTimeout>>();

  // Register a saga factory: given trigger data, produce the step sequence
  register(type: string, factory: (data: any) => SagaStep[]): void {
    this.handlers.set(type, factory);
  }

  start(type: string, triggerData: any): string {
    const factory = this.handlers.get(type);
    if (!factory) {
      logger.error(`No saga handler for type ${type}`);
      return "";
    }
    const steps = factory(triggerData);
    const saga: SagaInstance = {
      id: generateId("saga"),
      type,
      steps,
      currentStep: 0,
      state: "running",
      correlationId: generateId("corr"),
      startedAt: Date.now(),
      updatedAt: Date.now(),
      completedEvents: [],
    };
    this.sagas.set(saga.id, saga);
    metrics.increment("sagas.started", { type });
    logger.info(`Saga started: ${type}`, { sagaId: saga.id });
    this.executeStep(saga);
    return saga.id;
  }

  private executeStep(saga: SagaInstance): void {
    if (saga.currentStep >= saga.steps.length) {
      saga.state = "completed";
      saga.updatedAt = Date.now();
      metrics.increment("sagas.completed", { type: saga.type });
      logger.info(`Saga completed: ${saga.type}`, { sagaId: saga.id });
      return;
    }
    const step = saga.steps[saga.currentStep];
    // dispatch the command
    commandBus.dispatch(step.command);
    // listen for the success event
    const unsub = eventBus.registerHandler({
      eventType: step.onSuccess,
      handle: (event: DomainEvent) => {
        if (event.correlationId !== saga.correlationId && event.correlationId !== step.command.correlationId) return;
        saga.completedEvents.push(event.type);
        saga.currentStep++;
        saga.updatedAt = Date.now();
        unsub();
        this.clearTimeout(saga.id);
        this.executeStep(saga);
      },
    });
    // timeout
    if (step.timeoutMs) {
      const t = setTimeout(() => {
        if (saga.state !== "running") return;
        this.handleFailure(saga, `Step ${step.name} timed out`);
      }, step.timeoutMs);
      this.timeouts.set(saga.id, t);
    }
  }

  private handleFailure(saga: SagaInstance, error: string): void {
    saga.error = error;
    saga.state = "compensating";
    saga.updatedAt = Date.now();
    metrics.increment("sagas.failed", { type: saga.type });
    logger.warn(`Saga failed: ${saga.type}`, { sagaId: saga.id, error });
    // run compensation in reverse
    for (let i = saga.currentStep - 1; i >= 0; i--) {
      const step = saga.steps[i];
      if (step.compensate) {
        commandBus.dispatch(step.compensate);
      }
    }
    saga.state = "failed";
  }

  private clearTimeout(sagaId: string): void {
    const t = this.timeouts.get(sagaId);
    if (t) {
      clearTimeout(t);
      this.timeouts.delete(sagaId);
    }
  }

  get(id: string): SagaInstance | undefined {
    return this.sagas.get(id);
  }

  all(): SagaInstance[] {
    return Array.from(this.sagas.values());
  }

  active(): SagaInstance[] {
    return this.all().filter((s) => s.state === "running" || s.state === "compensating");
  }
}

export const sagas = new SagaEngine();

// --- Predefined mobility sagas -------------------------------------------

export function seedSagas(): void {
  // Ride booking saga: create intent → optimize → auction → book → confirm
  sagas.register("ride.booking", (data: any) => [
    {
      name: "Create intent",
      command: createCommand("intent.create", generateId("intent"), {
        userId: data.userId,
        origin: data.origin,
        destination: data.destination,
        type: "commute",
      }),
      onSuccess: "intent.created",
      timeoutMs: 5000,
    },
    {
      name: "Optimize intent",
      command: createCommand("intent.optimize", data.intentId || generateId("intent"), {
        intentId: data.intentId,
      }),
      onSuccess: "intent.optimized",
      timeoutMs: 10000,
    },
    {
      name: "Open auction",
      command: createCommand("auction.start", generateId("auction"), {
        intentId: data.intentId,
        startPrice: data.startPrice || 20,
      }),
      onSuccess: "auction.cleared",
      timeoutMs: 30000,
      compensate: createCommand("auction.cancel", generateId("auction"), {}),
    },
    {
      name: "Book ride",
      command: createCommand("ride.book", generateId("ride"), {
        winningBid: data.winningBid,
      }),
      onSuccess: "ride.booked",
      timeoutMs: 10000,
      compensate: createCommand("ride.cancel", generateId("ride"), {}),
    },
  ]);

  // Parcel delivery saga
  sagas.register("parcel.delivery", (data: any) => [
    {
      name: "Create parcel intent",
      command: createCommand("parcel.create", generateId("parcel"), {
        pickup: data.pickup,
        dropoff: data.dropoff,
        size: data.size,
      }),
      onSuccess: "parcel.created",
      timeoutMs: 5000,
    },
    {
      name: "Optimize courier",
      command: createCommand("parcel.optimize", generateId("parcel"), {
        parcelId: data.parcelId,
      }),
      onSuccess: "parcel.optimized",
      timeoutMs: 10000,
    },
    {
      name: "Dispatch",
      command: createCommand("parcel.dispatch", generateId("parcel"), {
        courier: data.courier,
      }),
      onSuccess: "parcel.dispatched",
      timeoutMs: 15000,
    },
  ]);

  // Commute pool formation saga
  sagas.register("commute.pool", (data: any) => [
    {
      name: "Discover matches",
      command: createCommand("pool.discover", generateId("pool"), {
        route: data.route,
        time: data.time,
      }),
      onSuccess: "pool.matches_found",
      timeoutMs: 8000,
    },
    {
      name: "Propose pool",
      command: createCommand("pool.propose", generateId("pool"), {
        matchIds: data.matchIds,
      }),
      onSuccess: "pool.proposed",
      timeoutMs: 10000,
    },
    {
      name: "Open reverse auction for pooled demand",
      command: createCommand("auction.start", generateId("auction"), {
        pooled: true,
        riderCount: data.riderCount,
      }),
      onSuccess: "auction.cleared",
      timeoutMs: 30000,
    },
  ]);
}
