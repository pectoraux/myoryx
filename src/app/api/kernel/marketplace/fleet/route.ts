import { NextResponse } from "next/server";
import { initKernel, fleetEngine } from "@/lib/kernel";

export async function GET(req: Request) {
  initKernel();
  const { searchParams } = new URL(req.url);
  const zone = searchParams.get("zone");
  const vehicleType = searchParams.get("vehicleType");
  if (zone || vehicleType) {
    return NextResponse.json(fleetEngine.queryAvailableCapacity(zone || undefined, vehicleType || undefined));
  }
  return NextResponse.json({ fleets: fleetEngine.all(), stats: fleetEngine.stats() });
}

export async function POST(req: Request) {
  initKernel();
  const body = await req.json();
  if (body.action === "connect") {
    return NextResponse.json(fleetEngine.connect(body.fleet));
  }
  if (body.action === "sync") {
    fleetEngine.syncCapacity(body.fleetId, body.capacity);
    return NextResponse.json({ ok: true });
  }
  if (body.action === "disconnect") {
    fleetEngine.disconnect(body.fleetId);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
