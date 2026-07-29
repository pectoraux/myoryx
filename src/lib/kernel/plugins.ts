// Oryx Mobility Kernel — Plugin Runtime
// Extensions are installable packages with isolated execution, permissions,
// lifecycle hooks, configuration, version management, and hot-reload.
// The Developer Console drives this runtime.

import type {
  ExtensionHook,
  ExtensionInstance,
  ExtensionLog,
  ExtensionManifest,
  ExtensionPermission,
  ExtensionStatus,
  DomainEvent,
} from "./types";
import { eventBus, createEvent, generateId } from "./event-bus";

type HookHandler = (payload: any) => void;

interface LoadedExtension extends ExtensionInstance {
  hookHandlers: Map<ExtensionHook, HookHandler[]>;
}

class PluginRuntime {
  private extensions = new Map<string, LoadedExtension>();
  private installed = new Set<string>();

  register(manifest: ExtensionManifest, status: ExtensionStatus = "development"): ExtensionInstance {
    const instance: LoadedExtension = {
      manifest,
      status,
      eventsProcessed: 0,
      logs: [],
      hookHandlers: new Map(),
    };
    this.extensions.set(manifest.id, instance);
    eventBus.publish([
      createEvent("extension.registered", manifest.id, {
        id: manifest.id,
        name: manifest.name,
        version: manifest.version,
      }),
    ]);
    return instance;
  }

  install(manifest: ExtensionManifest): void {
    const ext = this.register(manifest, "installed");
    ext.installedAt = Date.now();
    this.installed.add(manifest.id);
    // subscribe hooks to the event bus
    for (const hook of manifest.hooks) {
      this.subscribeHook(manifest.id, hook);
    }
    this.log(manifest.id, "info", `Extension ${manifest.name} v${manifest.version} installed`);
  }

  uninstall(id: string): void {
    const ext = this.extensions.get(id);
    if (!ext) return;
    this.installed.delete(id);
    ext.status = "disabled";
    this.log(id, "info", "Extension uninstalled");
  }

  enable(id: string): void {
    const ext = this.extensions.get(id);
    if (ext) ext.status = "installed";
  }

  disable(id: string): void {
    const ext = this.extensions.get(id);
    if (ext) ext.status = "disabled";
  }

  // hot-reload: re-register the manifest, preserving logs + handlers
  hotReload(manifest: ExtensionManifest): void {
    const existing = this.extensions.get(manifest.id);
    this.extensions.set(manifest.id, {
      manifest,
      status: existing?.status || "development",
      installedAt: existing?.installedAt,
      eventsProcessed: existing?.eventsProcessed || 0,
      logs: existing?.logs || [],
      hookHandlers: existing?.hookHandlers || new Map(),
    });
    this.log(manifest.id, "info", `Hot-reloaded v${manifest.version}`);
    eventBus.publish([
      createEvent("extension.hot_reloaded", manifest.id, { version: manifest.version }),
    ]);
  }

  // check permissions before executing an action
  authorize(extId: string, permission: ExtensionPermission): boolean {
    const ext = this.extensions.get(extId);
    if (!ext) return false;
    if (ext.status === "disabled") return false;
    return ext.manifest.permissions.includes(permission);
  }

  registerHook(extId: string, hook: ExtensionHook, handler: HookHandler): void {
    const ext = this.extensions.get(extId);
    if (!ext) return;
    if (!ext.hookHandlers.has(hook)) ext.hookHandlers.set(hook, []);
    ext.hookHandlers.get(hook)!.push(handler);
  }

  private subscribeHook(extId: string, hook: ExtensionHook): void {
    // map hooks to event types
    const hookToEvent: Record<ExtensionHook, string> = {
      onIntentCreated: "intent.created",
      onIntentOptimized: "intent.optimized",
      onCalendarChanged: "calendar.changed",
      onConnectorEvent: "connector.",
      onAuctionCleared: "auction.cleared",
      onRideBooked: "ride.booked",
      onParcelDispatched: "parcel.dispatched",
      onSchedule: "scheduler.tick",
    };
    const eventType = hookToEvent[hook];
    if (!eventType) return;
    eventBus.registerHandler({
      eventType: eventType.endsWith(".") ? "connector.weather.update" : eventType,
      handle: (event: DomainEvent) => {
        const ext = this.extensions.get(extId);
        if (!ext || ext.status === "disabled") return;
        if (!this.authorize(extId, "read:graph") && !this.authorize(extId, "read:intents"))
          return;
        ext.eventsProcessed++;
        const handlers = ext.hookHandlers.get(hook) || [];
        for (const h of handlers) {
          try {
            h(event.payload);
          } catch (e: any) {
            this.log(extId, "error", `Hook ${hook} error: ${e?.message}`);
          }
        }
      },
    });
  }

  log(extId: string, level: ExtensionLog["level"], message: string): void {
    const ext = this.extensions.get(extId);
    if (!ext) return;
    const log: ExtensionLog = {
      id: generateId("log"),
      level,
      message,
      timestamp: Date.now(),
    };
    ext.logs.push(log);
    if (ext.logs.length > 200) ext.logs.shift();
  }

  getLogs(extId: string, limit = 50): ExtensionLog[] {
    return (this.extensions.get(extId)?.logs || []).slice(-limit);
  }

  get(id: string): ExtensionInstance | undefined {
    const ext = this.extensions.get(id);
    if (!ext) return undefined;
    const { hookHandlers, ...rest } = ext;
    return { ...rest, logs: ext.logs.slice(-50) };
  }

  all(): ExtensionInstance[] {
    return Array.from(this.extensions.values()).map((e) => {
      const { hookHandlers, ...rest } = e;
      return { ...rest, logs: e.logs.slice(-50) };
    });
  }

  installedOnly(): ExtensionInstance[] {
    return this.all().filter((e) => this.installed.has(e.manifest.id));
  }
}

export const plugins = new PluginRuntime();
