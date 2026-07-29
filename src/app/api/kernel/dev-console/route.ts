import { NextResponse } from "next/server";
import { initKernel, plugins, eventBus, generateId } from "@/lib/kernel";
import type { ExtensionManifest } from "@/lib/kernel/types";

// GET — dev console state: installed extensions + logs + recent events
export async function GET(req: Request) {
  initKernel();
  const { searchParams } = new URL(req.url);
  const extId = searchParams.get("extId");
  if (extId) {
    const ext = plugins.get(extId);
    const logs = plugins.getLogs(extId, 100);
    return NextResponse.json({ extension: ext, logs });
  }
  return NextResponse.json({
    extensions: plugins.all(),
    recentEvents: eventBus.recent(30),
  });
}

// POST — dev console actions
export async function POST(req: Request) {
  initKernel();
  const body = await req.json();
  const { action } = body;

  // Create a development extension
  if (action === "create") {
    const manifest: ExtensionManifest = {
      id: body.id || generateId("ext"),
      name: body.name || "My Extension",
      developer: body.developer || "dev",
      version: body.version || "0.1.0",
      description: body.description || "",
      category: body.category || "custom",
      emoji: body.emoji || "🧩",
      color: body.color || "#a78bfa",
      permissions: body.permissions || ["read:intents"],
      hooks: body.hooks || ["onIntentCreated"],
      subscribesTo: body.subscribesTo,
      entrypoint: body.entrypoint || "index.ts",
    };
    plugins.register(manifest, "development");
    plugins.log(manifest.id, "info", `Extension created in development mode`);
    return NextResponse.json({ ok: true, manifest });
  }

  // Hot-reload an extension
  if (action === "hotReload") {
    plugins.hotReload(body.manifest);
    return NextResponse.json({ ok: true });
  }

  // Simulate a ride request (for testing)
  if (action === "simulateRide") {
    const events = eventBus.recent(0);
    eventBus.publish([
      {
        id: generateId("evt"),
        type: "ride.simulated",
        aggregateId: generateId("sim"),
        payload: {
          origin: body.origin || "East Legon",
          destination: body.destination || "Airport",
          price: body.price || 14.5,
        },
        correlationId: generateId("corr"),
        timestamp: Date.now(),
        version: 1,
      },
    ]);
    return NextResponse.json({ ok: true, simulated: true });
  }

  // Replay historical events
  if (action === "replay") {
    const events = eventBus.replay((e) => e.type.includes(body.filter || ""));
    return NextResponse.json({ ok: true, replayed: events.length, events: events.slice(-50) });
  }

  // Validate a manifest
  if (action === "validate") {
    const manifest = body.manifest as ExtensionManifest;
    const errors: string[] = [];
    if (!manifest.id) errors.push("id is required");
    if (!manifest.name) errors.push("name is required");
    if (!manifest.version) errors.push("version is required");
    if (!manifest.entrypoint) errors.push("entrypoint is required");
    if (!manifest.permissions || manifest.permissions.length === 0)
      errors.push("at least one permission is required");
    if (!manifest.hooks || manifest.hooks.length === 0)
      errors.push("at least one lifecycle hook is required");
    return NextResponse.json({ ok: errors.length === 0, errors });
  }

  // Package + submit for review
  if (action === "submit") {
    const manifest = body.manifest as ExtensionManifest;
    plugins.register(manifest, "pending_review");
    plugins.log(manifest.id, "info", "Submitted to Extension Store for review");
    return NextResponse.json({ ok: true, status: "pending_review" });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
