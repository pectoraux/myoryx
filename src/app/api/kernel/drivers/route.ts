import { NextResponse } from "next/server";
import { initKernel, driverOS } from "@/lib/kernel";

// GET — list all drivers (with optional filters)
export async function GET(req: Request) {
  initKernel();
  const { searchParams } = new URL(req.url);
  const driverId = searchParams.get("id");
  if (driverId) {
    return NextResponse.json(driverOS.get(driverId));
  }
  const filters: any = {};
  if (searchParams.get("zones")) filters.zones = searchParams.get("zones")!.split(",");
  if (searchParams.get("specialty")) filters.specialty = searchParams.get("specialty");
  if (searchParams.get("minRating")) filters.minRating = Number(searchParams.get("minRating"));
  if (searchParams.get("maxPrice")) filters.maxPrice = Number(searchParams.get("maxPrice"));
  if (searchParams.get("vehicleType")) filters.vehicleType = searchParams.get("vehicleType");
  return NextResponse.json(driverOS.search(filters));
}

// POST — update preferences
export async function POST(req: Request) {
  initKernel();
  const body = await req.json();
  if (body.action === "updatePreferences") {
    driverOS.updatePreferences(body.driverId, body.preferences);
    return NextResponse.json({ ok: true });
  }
  if (body.action === "addReview") {
    driverOS.addReview(body.driverId, body.review);
    return NextResponse.json({ ok: true });
  }
  if (body.action === "broadcastReturn") {
    const id = driverOS.broadcastReturnRide(
      body.driverId, body.driverName, body.origin, body.destination,
      body.departInMin, body.seats, body.price, body.vehicle, body.rating
    );
    return NextResponse.json({ ok: true, broadcastId: id });
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
