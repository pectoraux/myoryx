import { NextResponse } from "next/server";
import { initKernel, driverOS } from "@/lib/kernel";

// GET — browse subscription packages with filters + compatibility scoring
export async function GET(req: Request) {
  initKernel();
  const { searchParams } = new URL(req.url);
  const filters: any = {};
  if (searchParams.get("zones")) filters.zones = searchParams.get("zones")!.split(",");
  if (searchParams.get("specialty")) filters.specialty = searchParams.get("specialty");
  if (searchParams.get("minRating")) filters.minRating = Number(searchParams.get("minRating"));
  if (searchParams.get("maxPrice")) filters.maxPrice = Number(searchParams.get("maxPrice"));

  const drivers = driverOS.search(filters);
  // flatten packages with driver info
  const packages = drivers.flatMap((d) =>
    d.subscriptionPackages.map((p) => ({ ...p, driver: { id: d.id, name: d.name, avatar: d.avatar, vehicle: d.vehicle, rating: d.rating, reputation: d.reputation, champion: d.champion, zones: d.coverageZones } }))
  );
  return NextResponse.json(packages);
}

// POST — apply for a subscription (computes compatibility score)
export async function POST(req: Request) {
  initKernel();
  const body = await req.json();
  if (body.action === "apply") {
    const app = driverOS.applyForSubscription(
      body.riderId, body.riderName, body.driverId, body.packageId, body.riderCalendar, body.notes
    );
    return NextResponse.json(app);
  }
  if (body.action === "scoreCompatibility") {
    const driver = driverOS.get(body.driverId);
    const pkg = driver?.subscriptionPackages.find((p) => p.id === body.packageId);
    if (!driver || !pkg) return NextResponse.json({ error: "not found" }, { status: 404 });
    const result = driverOS.scoreCompatibility(body.riderCalendar, pkg, driver);
    return NextResponse.json(result);
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
