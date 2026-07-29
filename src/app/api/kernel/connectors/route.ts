import { NextResponse } from "next/server";
import { initKernel, connectors } from "@/lib/kernel";

export async function GET() {
  initKernel();
  return NextResponse.json(
    connectors.all().map((c) => ({
      id: c.manifest.id,
      name: c.manifest.name,
      category: c.manifest.category,
      version: c.manifest.version,
      mode: c.manifest.mode,
      signals: c.manifest.signals,
      status: c.health.status,
      latencyMs: c.health.latencyMs,
      eventsIngested: c.health.eventsIngested,
      uptimePct: c.health.uptimePct,
      lastEventAt: c.health.lastEventAt,
      lastError: c.health.lastError,
    }))
  );
}
